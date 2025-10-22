# Security Layers Deep Dive

## Table of Contents
- [Overview](#overview)
- [Layer 1: Edge Middleware](#layer-1-edge-middleware)
- [Layer 2: Data Access Layer DAL](#layer-2-data-access-layer-dal)
- [Layer 3: Client Validation](#layer-3-client-validation)
- [Layer 4: Cloud Functions](#layer-4-cloud-functions)
- [Layer 5: Firestore Security Rules](#layer-5-firestore-security-rules)
- [Layer 6: TenantFirestore Wrapper](#layer-6-tenantfirestore-wrapper)
- [How Layers Work Together](#how-layers-work-together)
- [Failure Scenarios](#failure-scenarios)

---

## Overview

The security architecture implements **six independent layers of protection**, each enforcing tenant isolation and access control. This "defense-in-depth" strategy ensures that if any single layer fails or is bypassed, the remaining layers still prevent security breaches.

**Key Principle**: **Never trust a single layer**. Every operation is validated by multiple independent systems.

---

## Layer 1: Edge Middleware

**File**: [src/middleware.ts](../src/middleware.ts)
**Runtime**: Edge (Vercel Edge Functions / Cloudflare Workers)
**Purpose**: First line of defense - authenticate requests before any page loads

### Responsibilities

1. **JWT Cookie Verification**
   - Verify signed JWT cookie exists
   - Validate signature using Firebase Admin SDK keys
   - Check token expiration (60-minute lifetime)

2. **Custom Claims Extraction**
   - Extract `tenant_id` from JWT token
   - Extract `role` from JWT token
   - Validate claims exist (not null/undefined)

3. **Request Header Injection**
   - Inject `x-user-id` header
   - Inject `x-tenant-id` header
   - Inject `x-user-role` header
   - Inject `x-user-email` header

4. **Route Protection**
   - Redirect unauthenticated users to `/login`
   - Redirect authenticated users away from `/login`, `/signup`
   - Allow public routes without authentication

### Implementation Pattern

```typescript
export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    ...authConfig,

    handleValidToken: async ({ decodedToken }, headers) => {
      // Verify custom claims exist
      if (!decodedToken.tenant_id || !decodedToken.role) {
        return NextResponse.redirect('/unauthorized');
      }

      // Inject headers for downstream use
      headers.set('x-user-id', decodedToken.uid);
      headers.set('x-tenant-id', decodedToken.tenant_id);
      headers.set('x-user-role', decodedToken.role);

      return NextResponse.next({ request: { headers } });
    },

    handleInvalidToken: async (reason) => {
      return redirectToLogin(request, { path: '/login' });
    }
  });
}
```

### Security Guarantees

- ✅ Runs on every request (no bypassing)
- ✅ Executes before any application code
- ✅ Uses signed cookies (tampering detected)
- ✅ Validates token cryptographically
- ✅ Blocks unauthenticated access at edge

### Limitations

- ❌ Cannot access Firestore (edge runtime limitation)
- ❌ Cannot verify tenant ownership of specific documents
- ❌ Relies on custom claims being correct (set by Cloud Functions)

---

## Layer 2: Data Access Layer (DAL)

**File**: [src/lib/dal.ts](../src/lib/dal.ts)
**Runtime**: Node.js (Server Components)
**Purpose**: Server-side authorization and session management

### Responsibilities

1. **Session Extraction**
   - Read headers injected by middleware
   - Construct session object with tenant_id, user_id, role, email
   - Cache session per request (React.cache)

2. **Authorization Helpers**
   - `requireAuth()` - Throw error if not authenticated
   - `requireRole(role)` - Throw error if role mismatch
   - `requireAdmin()` - Throw error if not admin/owner
   - `requireTenant(tenantId)` - Throw error if tenant mismatch

3. **Tenant Validation**
   - `validateTenantOwnership(data)` - Check data.tenant_id matches session
   - `belongsToTenant(tenantId)` - Boolean check for tenant membership

4. **DTO Creation**
   - `createDTO(data, fields)` - Return safe subset of data
   - Remove sensitive fields (passwords, tokens, keys)
   - Sanitize data before sending to client

### Implementation Pattern

```typescript
// Server Component
export default async function DashboardPage() {
  // Verify authentication
  const session = await requireAuth();

  // Verify authorization (admin only)
  if (session.role !== 'admin') {
    redirect('/unauthorized');
  }

  // Initialize TenantFirestore with session
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);

  // Fetch tenant-scoped data
  const posts = await tenantDB.query('posts', [
    { field: 'status', op: '==', value: 'published' }
  ]);

  return <DashboardClient posts={posts} />;
}
```

### Security Guarantees

- ✅ Every Server Component independently verifies auth
- ✅ Cannot be bypassed by client manipulation
- ✅ Validates tenant_id on every data access
- ✅ Enforces role-based access control
- ✅ Returns safe DTOs (no sensitive data leaks)

### Limitations

- ❌ Relies on middleware headers being correct
- ❌ Developer must remember to call requireAuth()
- ❌ Does not enforce at database level (relies on Layer 5 & 6)

---

## Layer 3: Client Validation

**File**: [src/lib/validations/auth.ts](../src/lib/validations/auth.ts)
**Runtime**: Client & Server
**Purpose**: Input validation and sanitization

### Responsibilities

1. **Email Validation**
   - Check email format (RFC 5322 compliant)
   - Reject obviously malicious inputs

2. **Password Validation**
   - Minimum 6 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

3. **Error Mapping**
   - Convert Firebase error codes to user-friendly messages
   - Example: `auth/user-not-found` → "No account found with this email"

### Implementation Pattern

```typescript
import { signInSchema, mapFirebaseError } from '@/lib/validations/auth';

function SignInForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate with Zod
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(mapFirebaseError(err));
    }
  };
}
```

### Security Guarantees

- ✅ Prevents malformed inputs from reaching Firebase
- ✅ Enforces password strength requirements
- ✅ Type-safe with Zod schemas
- ✅ Works on both client and server

### Limitations

- ❌ Can be bypassed by direct API calls
- ❌ Does not enforce tenant isolation
- ❌ Not a security boundary (defense in depth only)

---

## Layer 4: Cloud Functions

**Files**: [functions/src/](../functions/src/)
**Runtime**: Node.js (Cloud Functions)
**Purpose**: Privileged server-side operations

### Key Functions

#### 1. onUserCreate (Authentication Trigger)
**Triggered**: Automatically when new user signs up
**Privileges**: Firebase Admin SDK (full access)

**Responsibilities**:
- Check for pending invitation by email
- If invited: Assign to existing tenant with specified role
- If not invited: Create new tenant, assign as admin
- Set custom claims (tenant_id, role)
- Create user profile document
- Create audit log

**Security**:
- ✅ Only place custom claims can be set
- ✅ Automatic tenant assignment (no client input)
- ✅ Validates invitation authenticity
- ✅ Creates audit trail

#### 2. inviteUser (Callable Function)
**Triggered**: Called by admins to invite users
**Privileges**: Firebase Admin SDK

**Responsibilities**:
- Verify caller is admin/owner
- Verify caller's tenant_id
- Create invitation document
- Set expiration (7 days)
- Enforce rate limiting

**Security**:
- ✅ Validates context.auth.token.role
- ✅ Cannot invite to different tenant
- ✅ Rate limiting prevents abuse
- ✅ Invitation records are immutable

#### 3. updateUserRole (Callable Function)
**Triggered**: Called by admins to change user roles
**Privileges**: Firebase Admin SDK

**Responsibilities**:
- Verify caller is admin/owner
- Verify target user in same tenant
- Update custom claims
- Update Firestore user document
- Create audit log

**Security**:
- ✅ Cannot change own role (prevents lockout)
- ✅ Cannot modify users in other tenants
- ✅ Updates both claims AND Firestore
- ✅ Audit trail for compliance

### Implementation Pattern

```typescript
export const inviteUser = functions.https.onCall(async (data, context) => {
  // 1. Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // 2. Verify authorization
  if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // 3. Rate limiting
  await checkRateLimit(context.auth.uid, 'invite_user', 10, 3600); // 10 per hour

  // 4. Create invitation
  await db.collection('invitations').add({
    tenant_id: context.auth.token.tenant_id,
    email: data.email,
    role: data.role,
    invited_by: context.auth.uid,
    status: 'pending',
    created_at: FieldValue.serverTimestamp(),
    expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return { success: true };
});
```

### Security Guarantees

- ✅ Only place custom claims can be modified
- ✅ Full Firebase Admin SDK privileges
- ✅ Runs in secure server environment
- ✅ Cannot be called directly by client (must go through Firebase)
- ✅ Rate limiting built-in

### Limitations

- ❌ 5-10 second delay for custom claims to propagate
- ❌ Relies on Firestore Rules for write validation
- ❌ Must handle concurrent invocations carefully

---

## Layer 5: Firestore Security Rules

**File**: [firestore.rules](../firestore.rules)
**Runtime**: Firestore Database
**Purpose**: Database-level access control

### Core Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function getTenantId() {
  return request.auth.token.tenant_id;
}

function belongsToTenant(tenant_id) {
  return tenant_id == getTenantId();
}

function canManageUsers() {
  return request.auth.token.role == 'owner'
      || request.auth.token.role == 'admin';
}

function canEditData() {
  return request.auth.token.role == 'owner'
      || request.auth.token.role == 'admin'
      || request.auth.token.role == 'member';
}
```

### Collection Rules Pattern

#### Users Collection
```javascript
match /users/{userId} {
  // Users can ALWAYS read their own document (before claims set)
  allow read: if isAuthenticated() && request.auth.uid == userId;

  // Users can read other users in their tenant
  allow read: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id);

  // Only Cloud Functions can create users
  allow create: if false;

  // Users can update own profile OR admin can update any in tenant
  allow update: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && belongsToTenant(request.resource.data.tenant_id)
    && (request.auth.uid == userId || canManageUsers())
    && request.resource.data.role == resource.data.role; // Role changes via CF only

  // No direct deletes
  allow delete: if false;
}
```

#### Tenants Collection
```javascript
match /tenants/{tenantId} {
  // Double validation: token AND document tenant_id must match
  allow read: if isAuthenticated()
    && getTenantId() == tenantId
    && resource.data.tenant_id == tenantId;

  // Update with immutability checks
  allow update: if isAuthenticated()
    && getTenantId() == tenantId
    && canManageUsers()
    && resource.data.tenant_id == tenantId
    && request.resource.data.tenant_id == tenantId
    && request.resource.data.tenant_id == resource.data.tenant_id // IMMUTABLE
    && request.resource.data.created_by == resource.data.created_by // IMMUTABLE
    && request.resource.data.owner_id == resource.data.owner_id; // IMMUTABLE

  // Only Cloud Functions can create/delete tenants
  allow create, delete: if false;
}
```

#### Business Data Collections (Example: posts)
```javascript
match /posts/{postId} {
  // Read: Owner/Admin/Member/Viewer can read all, Guest needs permission
  allow read: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && (canEditData() || isViewer() || hasResourceAccess('posts', postId));

  // Create: Only Owner/Admin/Member
  allow create: if isAuthenticated()
    && request.resource.data.tenant_id == getTenantId()
    && request.resource.data.created_by == request.auth.uid
    && canEditData();

  // Update: Only Owner/Admin/Member, must own document OR be admin
  allow update: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && belongsToTenant(request.resource.data.tenant_id)
    && canEditData()
    && (resource.data.created_by == request.auth.uid || canManageUsers());

  // Delete: Only Owner/Admin/Member, must own document OR be admin
  allow delete: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && canEditData()
    && (resource.data.created_by == request.auth.uid || canManageUsers());
}
```

### Security Guarantees

- ✅ Enforced at database level (cannot be bypassed)
- ✅ Validates on every read/write operation
- ✅ Double-checks tenant_id (token AND document)
- ✅ Prevents tenant_id tampering (immutability)
- ✅ Blocks direct user/tenant creation

### Limitations

- ❌ Cannot perform complex queries (e.g., joins)
- ❌ Limited to 1,000 rules per ruleset
- ❌ Cannot access external APIs
- ❌ Synchronous only (no async operations)

---

## Layer 6: TenantFirestore Wrapper

**File**: [src/lib/TenantFirestore.ts](../src/lib/TenantFirestore.ts)
**Runtime**: Server (Node.js)
**Purpose**: Developer safety and automatic tenant_id injection

### Key Methods

#### create()
```typescript
async create(collectionName: string, data: Record<string, unknown>) {
  // Prevent manual tenant_id override
  if (data.tenant_id && data.tenant_id !== this.tenantId) {
    throw new Error('Cannot specify different tenant_id');
  }

  // Auto-inject tenant_id and audit fields
  const docData = {
    ...data,
    tenant_id: this.tenantId,
    created_by: this.userId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, collectionName), docData);
  return { id: docRef.id, ...docData };
}
```

#### query()
```typescript
async query(collectionName: string, filters: TenantFilter[] = []) {
  // CRITICAL: Always filter by tenant_id first
  const constraints: QueryConstraint[] = [
    where('tenant_id', '==', this.tenantId)
  ];

  // Apply additional filters
  filters.forEach(filter => {
    constraints.push(where(filter.field, filter.op, filter.value));
  });

  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

#### getById()
```typescript
async getById(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Document not found');
  }

  const data = docSnap.data();

  // CRITICAL: Verify tenant_id matches
  if (data.tenant_id !== this.tenantId) {
    throw new Error('Access denied: Document belongs to different tenant');
  }

  return { id: docSnap.id, ...data };
}
```

#### update()
```typescript
async update(collectionName: string, docId: string, updates: Record<string, unknown>) {
  // Verify tenant ownership first
  await this.getById(collectionName, docId);

  // Prepare safe updates
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
    updated_by: this.userId
  };

  // Remove protected fields
  delete updateData.tenant_id;
  delete updateData.created_by;
  delete updateData.created_at;

  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, updateData);

  return { id: docId, ...updateData };
}
```

### Security Guarantees

- ✅ Automatic tenant_id injection (cannot forget)
- ✅ Automatic tenant_id filtering (cannot leak data)
- ✅ Tenant ownership verification on reads
- ✅ Prevents tenant_id tampering on updates
- ✅ Consistent audit trail fields

### Limitations

- ❌ Developer must remember to use wrapper (not raw Firestore SDK)
- ❌ Cannot perform collection group queries easily
- ❌ Adds slight performance overhead (extra validation)

---

## How Layers Work Together

### Example: User Creates a Post

```
1. Client Form Submission
   ↓
2. Layer 3: Client Validation
   - Validate title and content with Zod
   - Check required fields
   ↓
3. Client calls Server Action
   ↓
4. Layer 1: Middleware
   - Verify JWT cookie
   - Extract tenant_id from token
   - Inject headers
   ↓
5. Server Action Executes
   ↓
6. Layer 2: DAL
   - Extract session from headers
   - Validate user is authenticated
   ↓
7. Layer 6: TenantFirestore Wrapper
   - Auto-inject tenant_id
   - Add created_by, created_at, updated_at
   ↓
8. Firestore Write Attempt
   ↓
9. Layer 5: Firestore Rules
   - Verify request.auth exists
   - Verify request.auth.token.tenant_id == request.resource.data.tenant_id
   - Verify request.auth.token.role allows create
   - Verify created_by == request.auth.uid
   ↓
10. Write Succeeds
    ↓
11. Layer 4: Cloud Function (Optional)
    - Trigger on document create
    - Create audit log entry
```

### Example: User Queries Posts

```
1. Server Component Loads
   ↓
2. Layer 1: Middleware
   - Verify JWT cookie
   - Inject tenant_id header
   ↓
3. Layer 2: DAL
   - Extract session from headers
   - Validate user is authenticated
   ↓
4. Layer 6: TenantFirestore Wrapper
   - Auto-add: where('tenant_id', '==', session.tenant_id)
   - Apply additional filters
   ↓
5. Firestore Read Attempt
   ↓
6. Layer 5: Firestore Rules
   - Verify request.auth exists
   - Verify request.auth.token.tenant_id == resource.data.tenant_id
   - Verify user role allows read
   ↓
7. Query Succeeds
   ↓
8. TenantFirestore Returns Results
   - All documents guaranteed to have matching tenant_id
```

---

## Failure Scenarios

### Scenario 1: Developer Forgets to Use TenantFirestore

```typescript
// BAD: Developer uses raw Firestore SDK
const posts = await getDocs(collection(db, 'posts'));

// What happens:
// ❌ Layer 6: BYPASSED (no tenant filtering)
// ✅ Layer 5: Firestore Rules BLOCK read
//   - Rules require belongsToTenant(resource.data.tenant_id)
//   - Query without tenant_id filter will fail or return empty

// Result: No data leak, query fails or returns nothing
```

### Scenario 2: Middleware Token Validation Fails

```typescript
// Middleware detects expired or invalid token

// What happens:
// ❌ Layer 1: Middleware redirects to /login
// ✅ Layer 2-6: NEVER EXECUTE (request blocked at edge)

// Result: User cannot access protected pages
```

### Scenario 3: Developer Bypasses DAL

```typescript
// BAD: Developer directly uses TenantFirestore without DAL
const tenantDB = new TenantFirestore('fake-tenant-id', 'fake-user-id');

// What happens:
// ❌ Layer 2: BYPASSED (no session validation)
// ✅ Layer 5: Firestore Rules CHECK token.tenant_id
//   - Token has real tenant_id
//   - Document write attempts have 'fake-tenant-id'
//   - Mismatch detected, write BLOCKED

// Result: Cannot write to different tenant
```

### Scenario 4: Cloud Function Sets Wrong Tenant ID

```typescript
// BUG: Cloud Function accidentally sets wrong tenant_id in custom claims

// What happens:
// ✅ Layer 1: Middleware accepts token (valid signature)
// ✅ Layer 2: DAL uses wrong tenant_id from token
// ✅ Layer 6: TenantFirestore filters by wrong tenant_id
// ✅ Layer 5: Firestore Rules CHECK token.tenant_id matches document
//   - User can only read/write documents with matching tenant_id
//   - Even if wrong, cannot access other tenants' data

// Result: User isolated to wrong tenant, but no cross-tenant leak
// Fix: Correct custom claims in Cloud Function, force token refresh
```

### Scenario 5: Firestore Rules Misconfigured

```javascript
// BAD: Firestore Rules forget to check tenant_id
match /posts/{postId} {
  allow read: if isAuthenticated(); // Missing tenant check!
}

// What happens:
// ✅ Layer 1: Middleware validates authentication
// ✅ Layer 2: DAL validates session
// ✅ Layer 6: TenantFirestore filters by tenant_id
// ❌ Layer 5: Firestore Rules allow read without tenant check

// Result: Query still filtered by Layer 6
// User ONLY sees posts with matching tenant_id
// No data leak due to wrapper's automatic filtering
```

---

## Best Practices

### DO

- ✅ Always use TenantFirestore wrapper for database operations
- ✅ Call requireAuth() or getCurrentSession() in every Server Component
- ✅ Validate inputs with Zod schemas before Firebase operations
- ✅ Test Firestore Rules with Firebase emulator suite
- ✅ Monitor Cloud Function logs for errors
- ✅ Use httpOnly cookies (never localStorage for tokens)

### DON'T

- ❌ Never use raw Firestore SDK in business logic
- ❌ Never trust client-provided tenant_id or user_id
- ❌ Never skip authentication checks "just this once"
- ❌ Never modify custom claims outside Cloud Functions
- ❌ Never store JWT tokens in localStorage
- ❌ Never assume one layer is sufficient

---

## Testing Each Layer

### Layer 1: Middleware
```bash
# Test unauthenticated access
curl http://localhost:3000/dashboard
# Expected: Redirect to /login

# Test with invalid token
curl -H "Cookie: auth-token=invalid" http://localhost:3000/dashboard
# Expected: Redirect to /login
```

### Layer 2: DAL
```typescript
// Unit test
it('requireAuth throws when session is null', async () => {
  // Mock headers() to return no auth headers
  await expect(requireAuth()).rejects.toThrow('Authentication required');
});
```

### Layer 3: Client Validation
```typescript
// Unit test
it('signUpSchema rejects weak password', () => {
  const result = signUpSchema.safeParse({
    email: 'test@example.com',
    password: 'weak',
    confirmPassword: 'weak'
  });
  expect(result.success).toBe(false);
});
```

### Layer 4: Cloud Functions
```bash
# Test in emulator
firebase emulators:start --only functions,firestore

# Call function
curl -X POST http://localhost:5001/project-id/us-central1/inviteUser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -d '{"email":"test@example.com","role":"member"}'
```

### Layer 5: Firestore Rules
```bash
# Test in Firebase console
# Firestore > Rules > Simulator
# Try reading document from different tenant
```

### Layer 6: TenantFirestore Wrapper
```typescript
// Unit test
it('query auto-filters by tenant_id', async () => {
  const wrapper = new TenantFirestore('tenant-123', 'user-456');
  const posts = await wrapper.query('posts');

  // Verify all posts have correct tenant_id
  posts.forEach(post => {
    expect(post.tenant_id).toBe('tenant-123');
  });
});
```

---

## Related Documentation

- [Architecture Overview](./architecture.md) - System architecture and component diagram
- [Authentication Flow](./authentication-flow.md) - User flows and token lifecycle
- [API Reference](./api-reference.md) - Detailed API documentation
- [Firestore Rules Guide](./firestore-rules-guide.md) - Complete rules reference
