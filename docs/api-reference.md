# API Reference

## Table of Contents
- [Overview](#overview)
- [Client Auth Helpers](#client-auth-helpers)
- [Data Access Layer DAL](#data-access-layer-dal)
- [TenantFirestore Wrapper](#tenantfirestore-wrapper)
- [Cloud Functions](#cloud-functions)
- [Validation Schemas](#validation-schemas)

---

## Overview

This document provides a complete API reference for the authentication system, covering:

- **Client Auth Helpers** - Functions for signup, signin, signout
- **Data Access Layer (DAL)** - Server-side session and authorization
- **TenantFirestore Wrapper** - Database operations with tenant isolation
- **Cloud Functions** - Privileged server operations
- **Validation Schemas** - Input validation with Zod

---

## Client Auth Helpers

**File**: [src/lib/client-auth.ts](../src/lib/client-auth.ts)
**Purpose**: Client-side authentication functions for auth forms

### signUpWithEmail()

Create a new user account with email and password.

```typescript
async function signUpWithEmail(
  email: string,
  password: string
): Promise<void>
```

**Parameters**:
- `email` - User email address
- `password` - User password (min 6 chars, uppercase, lowercase, number)

**Flow**:
1. Creates Firebase user account
2. Cloud Function (onUserCreate) sets custom claims
3. Waits for custom claims (up to 30 seconds)
4. Gets ID token with claims
5. Sets authentication cookie via /api/login

**Throws**:
- `Error` if signup fails
- `Error` if custom claims timeout

**Example**:
```typescript
import { signUpWithEmail } from '@/lib/client-auth';

try {
  await signUpWithEmail('user@example.com', 'SecureP@ss123');
  router.push('/dashboard');
} catch (error) {
  console.error('Signup failed:', error.message);
}
```

---

### signInWithEmail()

Sign in existing user with email and password.

```typescript
async function signInWithEmail(
  email: string,
  password: string
): Promise<void>
```

**Parameters**:
- `email` - User email address
- `password` - User password

**Flow**:
1. Authenticates with Firebase
2. Gets ID token (already has custom claims)
3. Sets authentication cookie via /api/login

**Throws**:
- `Error` if credentials invalid
- `Error` if cookie creation fails

**Example**:
```typescript
import { signInWithEmail } from '@/lib/client-auth';

try {
  await signInWithEmail('user@example.com', 'SecureP@ss123');
  router.push('/dashboard');
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

### signInWithGoogle()

Sign in or sign up with Google OAuth.

```typescript
async function signInWithGoogle(): Promise<void>
```

**Flow**:
1. Opens Google OAuth popup
2. User authenticates with Google
3. If new user: Waits for custom claims
4. Gets ID token
5. Sets authentication cookie

**Throws**:
- `Error` if OAuth cancelled
- `Error` if custom claims timeout (new users)

**Example**:
```typescript
import { signInWithGoogle } from '@/lib/client-auth';

try {
  await signInWithGoogle();
  router.push('/dashboard');
} catch (error) {
  console.error('Google sign-in failed:', error.message);
}
```

---

### signOut()

Sign out current user.

```typescript
async function signOut(): Promise<void>
```

**Flow**:
1. Clears httpOnly cookie via /api/logout
2. Signs out from Firebase client

**Throws**: None (errors logged but not thrown)

**Example**:
```typescript
import { signOut } from '@/lib/client-auth';

await signOut();
router.push('/login');
```

---

## Data Access Layer (DAL)

**File**: [src/lib/dal.ts](../src/lib/dal.ts)
**Purpose**: Server-side session management and authorization

### Types

```typescript
interface SessionContext {
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest' | 'viewer';
  email: string;
}

type DTO<T> = Omit<T, 'firebase_token' | 'password' | 'private_key'>;
```

---

### getCurrentSession()

Get current user session from middleware headers (cached per request).

```typescript
async function getCurrentSession(): Promise<SessionContext | null>
```

**Returns**: Session context or null if not authenticated

**Example**:
```typescript
import { getCurrentSession } from '@/lib/dal';

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  console.log('User:', session.user_id);
  console.log('Tenant:', session.tenant_id);
  console.log('Role:', session.role);
}
```

---

### requireAuth()

Verify user is authenticated (throws if not).

```typescript
async function requireAuth(): Promise<SessionContext>
```

**Returns**: Session context

**Throws**: `Error` if not authenticated

**Example**:
```typescript
import { requireAuth } from '@/lib/dal';

export default async function ProfilePage() {
  const session = await requireAuth(); // Throws if not authenticated

  return <ProfileClient session={session} />;
}
```

---

### requireRole()

Verify user has specific role (throws if not).

```typescript
async function requireRole(
  role: 'owner' | 'admin' | 'member' | 'guest' | 'viewer'
): Promise<SessionContext>
```

**Parameters**:
- `role` - Required role

**Returns**: Session context

**Throws**: `Error` if user doesn't have required role

**Example**:
```typescript
import { requireRole } from '@/lib/dal';

export default async function AdminPage() {
  const session = await requireRole('admin'); // Only admins can access

  return <AdminPanel session={session} />;
}
```

---

### requireAdmin()

Verify user is admin or owner (throws if not).

```typescript
async function requireAdmin(): Promise<SessionContext>
```

**Returns**: Session context

**Throws**: `Error` if user is not admin/owner

**Example**:
```typescript
import { requireAdmin } from '@/lib/dal';

export default async function UsersPage() {
  const session = await requireAdmin(); // Only admin/owner can manage users

  return <UserManagement session={session} />;
}
```

---

### requireTenant()

Verify user belongs to specific tenant (throws if not).

```typescript
async function requireTenant(tenantId: string): Promise<SessionContext>
```

**Parameters**:
- `tenantId` - Required tenant ID

**Returns**: Session context

**Throws**: `Error` if user doesn't belong to tenant

**Example**:
```typescript
import { requireTenant } from '@/lib/dal';

export default async function TenantSettingsPage({ params }: { params: { tenantId: string } }) {
  const session = await requireTenant(params.tenantId);

  return <TenantSettings session={session} />;
}
```

---

### Helper Functions

```typescript
// Get user ID
async function getCurrentUserId(): Promise<string>

// Get tenant ID
async function getCurrentTenantId(): Promise<string>

// Get user role
async function getCurrentUserRole(): Promise<SessionContext['role']>

// Check if authenticated
async function isAuthenticated(): Promise<boolean>

// Check if admin
async function isAdmin(): Promise<boolean>

// Check if belongs to tenant
async function belongsToTenant(tenantId: string): Promise<boolean>
```

---

### DTO Creation

```typescript
// Create safe DTO from object
function createDTO<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Partial<T>

// Create array of DTOs
function createDTOArray<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[]
): Partial<T>[]
```

**Example**:
```typescript
import { createDTO } from '@/lib/dal';

const user = {
  uid: '123',
  email: 'user@example.com',
  password_hash: 'secret', // Sensitive!
  tenant_id: 'tenant-abc'
};

// Return safe DTO to client
const userDTO = createDTO(user, ['uid', 'email', 'tenant_id']);
// Result: { uid: '123', email: 'user@example.com', tenant_id: 'tenant-abc' }
```

---

### Validation Functions

```typescript
// Validate data belongs to current tenant
async function validateTenantOwnership(
  data: { tenant_id: string }
): Promise<void>

// Validate array belongs to current tenant
async function validateTenantOwnershipBatch(
  items: { tenant_id: string }[]
): Promise<void>
```

---

## TenantFirestore Wrapper

**File**: [src/lib/TenantFirestore.ts](../src/lib/TenantFirestore.ts)
**Purpose**: Database operations with automatic tenant isolation

### Constructor

```typescript
class TenantFirestore {
  constructor(tenantId: string, userId: string)
}
```

**Parameters**:
- `tenantId` - Tenant ID for filtering
- `userId` - User ID for audit trail

**Example**:
```typescript
import { TenantFirestore } from '@/lib/TenantFirestore';
import { getCurrentSession } from '@/lib/dal';

const session = await getCurrentSession();
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
```

---

### create()

Create document with auto-injected tenant_id.

```typescript
async create(
  collectionName: string,
  data: Record<string, unknown>
): Promise<{ id: string; [key: string]: unknown }>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `data` - Document data (tenant_id will be auto-injected)

**Returns**: Created document with ID

**Auto-injected fields**:
- `tenant_id`
- `created_by`
- `created_at`
- `updated_at`

**Throws**: `Error` if manual tenant_id doesn't match

**Example**:
```typescript
const post = await tenantDB.create('posts', {
  title: 'Hello World',
  content: 'This is a post',
  status: 'draft'
});
// Result: { id: 'post-123', title: 'Hello World', ..., tenant_id: 'tenant-abc', created_by: 'user-456' }
```

---

### query()

Query documents with auto-filtered tenant_id.

```typescript
async query(
  collectionName: string,
  filters?: TenantFilter[]
): Promise<Array<{ id: string; [key: string]: unknown }>>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `filters` - Additional filters (optional)

**TenantFilter**:
```typescript
interface TenantFilter {
  field: string;
  op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: unknown;
}
```

**Returns**: Array of documents

**Auto-applied filters**:
- `where('tenant_id', '==', this.tenantId)`

**Example**:
```typescript
// Query published posts
const posts = await tenantDB.query('posts', [
  { field: 'status', op: '==', value: 'published' },
  { field: 'created_at', op: '>=', value: startDate }
]);
```

---

### getById()

Get document by ID with tenant verification.

```typescript
async getById(
  collectionName: string,
  docId: string
): Promise<{ id: string; [key: string]: unknown }>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `docId` - Document ID

**Returns**: Document data with ID

**Throws**:
- `Error` if document not found
- `Error` if document belongs to different tenant

**Example**:
```typescript
const post = await tenantDB.getById('posts', 'post-123');
console.log(post.title);
```

---

### update()

Update document with tenant verification.

```typescript
async update(
  collectionName: string,
  docId: string,
  updates: Record<string, unknown>
): Promise<{ id: string; [key: string]: unknown }>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `docId` - Document ID
- `updates` - Fields to update

**Returns**: Updated document

**Auto-added fields**:
- `updated_at`
- `updated_by`

**Protected fields** (automatically removed):
- `tenant_id` (immutable)
- `created_by` (immutable)
- `created_at` (immutable)

**Throws**: `Error` if document belongs to different tenant

**Example**:
```typescript
await tenantDB.update('posts', 'post-123', {
  title: 'Updated Title',
  status: 'published'
});
```

---

### delete()

Delete document (soft delete by default).

```typescript
async delete(
  collectionName: string,
  docId: string,
  hardDelete?: boolean
): Promise<{ success: true }>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `docId` - Document ID
- `hardDelete` - If true, permanently delete (default: false)

**Returns**: Success object

**Soft delete** (default):
- Sets `deleted: true`
- Sets `deleted_at: serverTimestamp()`
- Sets `deleted_by: userId`

**Hard delete**:
- Permanently removes document (use with caution)

**Throws**: `Error` if document belongs to different tenant

**Example**:
```typescript
// Soft delete (recommended)
await tenantDB.delete('posts', 'post-123');

// Hard delete (permanent)
await tenantDB.delete('posts', 'post-123', true);
```

---

### queryPaginated()

Query with pagination support.

```typescript
async queryPaginated(
  collectionName: string,
  filters?: TenantFilter[],
  options?: PaginationOptions
): Promise<{
  data: Array<{ id: string; [key: string]: unknown }>;
  lastDoc: DocumentSnapshot;
  hasMore: boolean;
}>
```

**PaginationOptions**:
```typescript
interface PaginationOptions {
  limit?: number; // Default: 20
  startAfter?: DocumentSnapshot;
}
```

**Example**:
```typescript
// First page
const page1 = await tenantDB.queryPaginated('posts', [], { limit: 10 });

// Next page
const page2 = await tenantDB.queryPaginated('posts', [], {
  limit: 10,
  startAfter: page1.lastDoc
});

console.log('Has more:', page2.hasMore);
```

---

### batchCreate()

Create multiple documents in batch.

```typescript
async batchCreate(
  collectionName: string,
  items: Record<string, unknown>[]
): Promise<{ success: true; count: number }>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `items` - Array of documents to create

**Returns**: Success object with count

**Example**:
```typescript
await tenantDB.batchCreate('posts', [
  { title: 'Post 1', content: 'Content 1' },
  { title: 'Post 2', content: 'Content 2' },
  { title: 'Post 3', content: 'Content 3' }
]);
```

---

### getByIds()

Get multiple documents by IDs.

```typescript
async getByIds(
  collectionName: string,
  docIds: string[]
): Promise<Array<{ id: string; [key: string]: unknown }>>
```

**Parameters**:
- `collectionName` - Firestore collection name
- `docIds` - Array of document IDs

**Returns**: Array of documents (only those belonging to tenant)

**Example**:
```typescript
const posts = await tenantDB.getByIds('posts', ['post-1', 'post-2', 'post-3']);
```

---

## Cloud Functions

**Files**: [functions/src/](../functions/src/)
**Purpose**: Privileged server-side operations

### onUserCreate (Trigger)

Automatically assigns tenant and role when user signs up.

**Type**: Authentication Trigger
**Triggered**: Automatically on user creation
**File**: [functions/src/auth/onUserCreate.ts](../functions/src/auth/onUserCreate.ts)

**Flow**:
1. Check for pending invitation by email
2. If invited: Assign to existing tenant with specified role
3. If not invited: Create new tenant, assign as admin
4. Set custom claims (tenant_id, role)
5. Create user profile document
6. Create audit log

**Cannot be called directly** - triggered automatically by Firebase Auth.

---

### inviteUser (Callable)

Invite user to tenant.

**Type**: Callable Function
**Who can call**: Admins and owners only
**File**: [functions/src/auth/inviteUser.ts](../functions/src/auth/inviteUser.ts)

```typescript
const inviteUser = httpsCallable<
  { email: string; role: string },
  { success: boolean; invitationId: string; inviteLink: string }
>(functions, 'inviteUser');
```

**Parameters**:
```typescript
{
  email: string; // Email of user to invite
  role: 'member' | 'guest' | 'viewer'; // Role to assign
}
```

**Returns**:
```typescript
{
  success: boolean;
  invitationId: string;
  inviteLink: string; // Secure token-based URL (crypto.randomBytes(32))
  message: string;
}
```

**Invitation Fields Created:**
- `invite_token` - 64-char hex token
- `invite_link` - Full URL to `/accept-invite?token={token}`
- `token_used` - false (one-time use)
- `expires_at` - 7 days

**Validation**:
- Caller must be admin or owner
- Cannot invite to different tenant
- Rate limited: 10 invitations per hour per user

**Example**:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const inviteUser = httpsCallable(functions, 'inviteUser');

try {
  const result = await inviteUser({
    email: 'newuser@example.com',
    role: 'member'
  });
  console.log('Share link:', result.data.inviteLink);
} catch (error) {
  console.error('Failed to invite user:', error.message);
}
```

---

### updateUserRole (Callable)

Change user's role within tenant.

**Type**: Callable Function
**Who can call**: Admins and owners only
**File**: [functions/src/auth/updateUserRole.ts](../functions/src/auth/updateUserRole.ts)

```typescript
const updateUserRole = httpsCallable<
  { userId: string; newRole: string },
  { success: boolean }
>(functions, 'updateUserRole');
```

**Parameters**:
```typescript
{
  userId: string; // User ID to update
  newRole: 'admin' | 'member' | 'guest' | 'viewer'; // New role
}
```

**Returns**:
```typescript
{
  success: boolean;
}
```

**Validation**:
- Caller must be admin or owner
- Target user must be in same tenant
- Cannot change own role
- Cannot assign 'owner' role (manual only)

**Example**:
```typescript
const updateUserRole = httpsCallable(functions, 'updateUserRole');

await updateUserRole({
  userId: 'user-123',
  newRole: 'admin'
});

// User must refresh token to see new role
```

---

### deleteUserFromTenant (Callable)

Remove user from tenant.

**Type**: Callable Function
**Who can call**: Admins and owners only
**File**: [functions/src/auth/deleteUserFromTenant.ts](../functions/src/auth/deleteUserFromTenant.ts)

```typescript
const deleteUserFromTenant = httpsCallable<
  { userId: string },
  { success: boolean }
>(functions, 'deleteUserFromTenant');
```

**Parameters**:
```typescript
{
  userId: string; // User ID to remove
}
```

**Returns**:
```typescript
{
  success: boolean;
}
```

**Validation**:
- Caller must be admin or owner
- Target user must be in same tenant
- Cannot remove self
- Cannot remove owner

**Example**:
```typescript
const deleteUserFromTenant = httpsCallable(functions, 'deleteUserFromTenant');

await deleteUserFromTenant({ userId: 'user-123' });
```

---

### updateGuestPermissions (Callable)

Update resource permissions for guest users.

**Type**: Callable Function
**Who can call**: Admins and owners only
**File**: [functions/src/auth/updateGuestPermissions.ts](../functions/src/auth/updateGuestPermissions.ts)

```typescript
const updateGuestPermissions = httpsCallable<
  { userId: string; permissions: Record<string, string[]> },
  { success: boolean }
>(functions, 'updateGuestPermissions');
```

**Parameters**:
```typescript
{
  userId: string; // Guest user ID
  permissions: {
    [collection: string]: string[]; // Array of document IDs
  }
}
```

**Example**:
```typescript
const updateGuestPermissions = httpsCallable(functions, 'updateGuestPermissions');

await updateGuestPermissions({
  userId: 'guest-user-123',
  permissions: {
    posts: ['post-1', 'post-2'], // Can access these posts
    files: ['file-5'] // Can access this file
  }
});
```

---

### transferOwnership (Callable)

Transfer tenant ownership to another admin.

**Type**: Callable Function
**Who can call**: Owners only
**File**: [functions/src/auth/transferOwnership.ts](../functions/src/auth/transferOwnership.ts)

```typescript
const transferOwnership = httpsCallable<
  { newOwnerId: string },
  { success: boolean }
>(functions, 'transferOwnership');
```

**Parameters**:
```typescript
{
  newOwnerId: string; // User ID of new owner (must be admin)
}
```

**Validation**:
- Caller must be current owner
- Target user must be admin in same tenant
- Caller becomes admin after transfer

**Example**:
```typescript
const transferOwnership = httpsCallable(functions, 'transferOwnership');

await transferOwnership({ newOwnerId: 'admin-user-456' });
// Current owner becomes admin
// admin-user-456 becomes owner
```

---

### cleanupRateLimits (Scheduled)

Cleanup expired rate limit records.

**Type**: Scheduled Function (runs hourly)
**File**: [functions/src/scheduled/cleanupRateLimits.ts](../functions/src/scheduled/cleanupRateLimits.ts)

**Cannot be called manually** - runs automatically via Cloud Scheduler.

---

### exportUserData (Callable)

Export all user data (GDPR compliance).

**Type**: Callable Function
**Who can call**: Authenticated users (own data only)
**File**: [functions/src/gdpr/exportUserData.ts](../functions/src/gdpr/exportUserData.ts)

```typescript
const exportUserData = httpsCallable<
  {},
  { downloadUrl: string; expiresAt: string }
>(functions, 'exportUserData');
```

**Returns**:
```typescript
{
  downloadUrl: string; // Cloud Storage download URL
  expiresAt: string; // URL expiration timestamp
}
```

**Example**:
```typescript
const exportUserData = httpsCallable(functions, 'exportUserData');

const result = await exportUserData({});
window.location.href = result.data.downloadUrl; // Download ZIP file
```

---

### cleanupDeletedData (Scheduled)

Permanently delete soft-deleted data after 30 days.

**Type**: Scheduled Function (runs daily)
**File**: [functions/src/gdpr/cleanupDeletedData.ts](../functions/src/gdpr/cleanupDeletedData.ts)

**Cannot be called manually** - runs automatically via Cloud Scheduler.

---

## Validation Schemas

**File**: [src/lib/validations/auth.ts](../src/lib/validations/auth.ts)
**Purpose**: Input validation with Zod

### signInSchema

Validate sign-in credentials.

```typescript
const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type SignInFormData = z.infer<typeof signInSchema>;
```

**Example**:
```typescript
import { signInSchema } from '@/lib/validations/auth';

const result = signInSchema.safeParse({ email, password });
if (!result.success) {
  console.error(result.error.errors[0].message);
} else {
  const { email, password } = result.data;
}
```

---

### signUpSchema

Validate sign-up credentials with password strength.

```typescript
const signUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type SignUpFormData = z.infer<typeof signUpSchema>;
```

---

### mapFirebaseError()

Map Firebase error codes to user-friendly messages.

```typescript
function mapFirebaseError(err: { code?: string; message?: string }): string
```

**Error mappings**:
- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/too-many-requests` → "Too many failed attempts. Please try again later."
- `auth/email-already-in-use` → "An account with this email already exists"
- `auth/weak-password` → "Password is too weak. Please choose a stronger password."
- `auth/invalid-email` → "Invalid email address"
- `auth/user-disabled` → "This account has been disabled. Please contact support."

**Example**:
```typescript
import { mapFirebaseError } from '@/lib/validations/auth';

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  const friendlyMessage = mapFirebaseError(error);
  setError(friendlyMessage);
}
```

---

## Related Documentation

- [Authentication Flow](./authentication-flow.md) - User flows and token management
- [Security Layers](./security-layers.md) - How each layer validates requests
- [Database Schema](./database-schema.md) - Schema requirements and patterns
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
