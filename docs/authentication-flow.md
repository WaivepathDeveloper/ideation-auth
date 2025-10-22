# Authentication Flow

## Table of Contents
- [Overview](#overview)
- [Signup Flow New Tenant](#signup-flow-new-tenant)
- [Signup Flow Invitation-Based](#signup-flow-invitation-based)
- [Sign-In Flow](#sign-in-flow)
- [Google OAuth Flow](#google-oauth-flow)
- [Sign-Out Flow](#sign-out-flow)
- [Custom Claims Lifecycle](#custom-claims-lifecycle)
- [Token Refresh Strategy](#token-refresh-strategy)
- [Role Management](#role-management)
- [Session Management](#session-management)

---

## Overview

This system uses a **server-first authentication pattern** with httpOnly cookies and JWT custom claims. Authentication happens through Firebase Client SDK, then a signed cookie is set for subsequent requests validated by middleware.

### Authentication Architecture

```
Client (Browser)
   │
   ├─► Firebase Client SDK (authentication)
   │   ├─► Email/Password
   │   └─► Google OAuth
   │
   ├─► ID Token (JWT with custom claims)
   │
   ├─► POST /api/login (set httpOnly cookie)
   │
   └─► Subsequent Requests
        ├─► Middleware validates cookie
        ├─► Extracts session (tenant_id, role)
        └─► Injects headers for Server Components
```

### Key Components

- **[src/lib/client-auth.ts](../src/lib/client-auth.ts)** - Client auth helpers
- **[src/middleware.ts](../src/middleware.ts)** - JWT cookie validation
- **[src/lib/dal.ts](../src/lib/dal.ts)** - Server-side session management
- **[functions/src/auth/onUserCreate.ts](../functions/src/auth/onUserCreate.ts)** - Auto tenant assignment

---

## Signup Flow (New Tenant)

When a user signs up **without** an invitation, they become an admin of a new tenant.

### Step-by-Step Flow

```
1. User fills signup form
   └─► Email: john@example.com
   └─► Password: SecureP@ss123

2. Client validation (Layer 3)
   └─► Zod schema validates email format
   └─► Password strength check (6+ chars, uppercase, lowercase, number)

3. Firebase Client SDK
   └─► createUserWithEmailAndPassword(auth, email, password)
   └─► Creates user account in Firebase Auth
   └─► Returns UserCredential with uid

4. Cloud Function Trigger (Layer 4)
   └─► onUserCreate automatically triggers
   └─► Check invitations collection for matching email
   └─► No invitation found → Create new tenant

5. Create Tenant Document
   └─► Generate tenant_id: firestore.doc().id
   └─► Create document in /tenants collection:
       {
         tenant_id: "tenant-abc123",
         name: "John's Organization",
         created_by: user.uid,
         status: "active",
         settings: { max_users: 50, features: ["basic"] }
       }

6. Create User Profile
   └─► Create document in /users collection:
       {
         tenant_id: "tenant-abc123",
         email: "john@example.com",
         role: "admin", // First user becomes admin
         status: "active"
       }

7. Set Custom Claims
   └─► admin.auth().setCustomUserClaims(uid, {
         tenant_id: "tenant-abc123",
         role: "admin"
       })
   └─► Claims embedded in JWT token

8. Client Waits for Claims
   └─► waitForCustomClaims(user) polls up to 30 seconds
   └─► Checks: user.getIdTokenResult().claims.tenant_id
   └─► Retry every 1 second until claims appear

9. Get Fresh ID Token
   └─► user.getIdToken(true) // force refresh
   └─► Token now includes custom claims

10. Set httpOnly Cookie
    └─► POST /api/login with Authorization: Bearer <idToken>
    └─► Server validates token signature
    └─► Server creates signed cookie with 12-day expiration
    └─► Response: Set-Cookie: auth-token=...; HttpOnly; Secure; SameSite=Lax

11. Redirect to Dashboard
    └─► router.push('/dashboard')
    └─► Middleware validates cookie
    └─► Server Component renders with session
```

### Code Example

```typescript
// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/client-auth';
import { signUpSchema, mapFirebaseError } from '@/lib/validations/auth';

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = signUpSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // signUpWithEmail handles:
      // - Firebase user creation
      // - Waiting for custom claims
      // - Setting httpOnly cookie
      await signUpWithEmail(email, password);

      router.push('/dashboard');
    } catch (err) {
      setError(mapFirebaseError(err));
      setLoading(false);
    }
  };

  // ... form JSX
}
```

---

## Signup Flow (Invitation-Based)

When a user signs up **with** a pending invitation, they join an existing tenant.

### Token-Based Invitation Flow (Current)

```
1. Admin creates invitation
   └─► Calls inviteUser Cloud Function
   └─► Function generates secure token (crypto.randomBytes(32))
   └─► Creates invitation with invite_link
       {
         tenant_id: "tenant-abc123",
         email: "jane@example.com",
         role: "member",
         status: "pending",
         invite_token: "64-char-hex-string",
         invite_link: "https://app.com/accept-invite?token=...",
         token_used: false,
         expires_at: Timestamp (7 days)
       }

2. Admin shares invitation link
   └─► Copies invite_link from response
   └─► Shares via Slack/email/messaging (manual sharing)

3. User clicks invitation link
   └─► Redirects to /accept-invite?token=...
   └─► Server Component validates token
       • Checks exists, not expired, not used
       • Fetches invitation details

4. User sees invitation context
   └─► Organization name displayed
   └─► Role displayed
   └─► Inviter email displayed
   └─► Embedded signup form with email pre-filled (disabled)

5. User completes signup
   └─► Enters password (email already filled from invitation)
   └─► Client validates with Zod schema
   └─► Calls signUpWithEmail() which creates Firebase account

6. AcceptInviteForm marks invitation as accepted
   └─► Calls acceptInvitation server action with token and user_id
   └─► Server updates invitation: token_used = true, status = 'accepted'

7. Cloud Function Trigger
   └─► onUserCreate automatically triggers
   └─► Check invitations collection for email: "jane@example.com"
   └─► Invitation FOUND with status: "accepted"

8. Join Existing Tenant
   └─► Extract tenant_id from invitation: "tenant-abc123"
   └─► Extract role from invitation: "member"

9. Create User Profile
   └─► Create document in /users collection:
       {
         tenant_id: "tenant-abc123", // From invitation
         email: "jane@example.com",
         role: "member", // From invitation
         status: "active"
       }

10. Set Custom Claims
    └─► admin.auth().setCustomUserClaims(uid, {
          tenant_id: "tenant-abc123",
          role: "member"
        })

11. Client waits for claims
    └─► Same as new tenant flow

12. Set httpOnly cookie
    └─► Same as new tenant flow

13. Redirect to dashboard
    └─► User now has access to tenant-abc123 data
```

### Invitation States

| State | Description | Next Action |
|-------|-------------|-------------|
| `pending` | Invitation created, user not signed up | Wait for user signup |
| `accepted` | User signed up and joined tenant | None (complete) |
| `expired` | Invitation older than 7 days | Admin creates new invitation |
| `revoked` | Admin cancelled invitation | None (blocked) |

---

## Sign-In Flow

Existing users sign in to access their tenant.

### Step-by-Step Flow

```
1. User fills login form
   └─► Email: john@example.com
   └─► Password: SecureP@ss123

2. Client validation
   └─► Zod schema validates email format
   └─► Password required (no strength check on login)

3. Firebase Client SDK
   └─► signInWithEmailAndPassword(auth, email, password)
   └─► Firebase validates credentials
   └─► Returns UserCredential

4. Get ID Token
   └─► user.getIdToken() // No force refresh needed
   └─► Token already includes custom claims (set during signup)

5. Set httpOnly Cookie
   └─► POST /api/login with Authorization: Bearer <idToken>
   └─► Server validates token
   └─► Server creates signed cookie

6. Redirect to Dashboard
   └─► router.push('/dashboard')
```

### Code Example

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/client-auth';
import { signInSchema, mapFirebaseError } from '@/lib/validations/auth';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(mapFirebaseError(err));
      setLoading(false);
    }
  };

  // ... form JSX
}
```

---

## Google OAuth Flow

Users can sign up or sign in with Google.

### Step-by-Step Flow

```
1. User clicks "Continue with Google"

2. Firebase Client SDK
   └─► signInWithPopup(auth, GoogleAuthProvider)
   └─► Opens Google OAuth popup
   └─► User authenticates with Google
   └─► Returns UserCredential

3. Check if New User
   └─► hasCustomClaims(user) checks for tenant_id in token

4a. If New User (No Custom Claims)
    └─► onUserCreate Cloud Function triggers
    └─► Same as signup flow (create tenant or join invitation)
    └─► Set custom claims
    └─► Client waits for claims (polling)

4b. If Existing User (Has Custom Claims)
    └─► Skip to step 5

5. Get ID Token
   └─► user.getIdToken(true) // Force refresh

6. Set httpOnly Cookie
   └─► POST /api/login with token

7. Redirect to Dashboard
```

### Code Example

```typescript
// components/auth/GoogleSignInButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/client-auth';
import { mapFirebaseError } from '@/lib/validations/auth';

export default function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(mapFirebaseError(err));
      setLoading(false);
    }
  };

  return (
    <button onClick={handleGoogleSignIn} disabled={loading}>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  );
}
```

---

## Sign-Out Flow

Users sign out to end their session.

### Step-by-Step Flow

```
1. User clicks "Sign Out"

2. Client calls signOut()
   └─► POST /api/logout
   └─► Server clears httpOnly cookie
   └─► Response: Set-Cookie: auth-token=; Max-Age=0

3. Firebase Client SDK
   └─► firebaseSignOut(auth)
   └─► Clears client-side Firebase state

4. Redirect to Login
   └─► router.push('/login')
   └─► Or middleware redirects automatically
```

### Code Example

```typescript
// components/auth/SignOutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/client-auth';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

---

## Custom Claims Lifecycle

### What are Custom Claims?

Custom claims are **key-value pairs embedded in JWT tokens** that Firebase Authentication returns. They are set server-side using Firebase Admin SDK and are available in:

1. **Client**: `user.getIdTokenResult().claims`
2. **Middleware**: `decodedToken.tenant_id`, `decodedToken.role`
3. **Firestore Rules**: `request.auth.token.tenant_id`, `request.auth.token.role`
4. **Cloud Functions**: `context.auth.token.tenant_id`, `context.auth.token.role`

### Custom Claims Structure

```typescript
{
  tenant_id: string; // Tenant user belongs to
  role: 'owner' | 'admin' | 'member' | 'guest' | 'viewer'; // User's role
}
```

### When Claims are Set

| Event | Trigger | Claims Set |
|-------|---------|------------|
| User signs up (new tenant) | onUserCreate | `{ tenant_id, role: 'admin' }` |
| User signs up (invitation) | onUserCreate | `{ tenant_id, role: invitation.role }` |
| Admin changes user role | updateUserRole | `{ tenant_id, role: new_role }` |
| Owner transfers ownership | transferOwnership | `{ tenant_id, role: 'owner' }` |

### Claims Propagation Delay

⚠️ **IMPORTANT**: Custom claims take **5-10 seconds** to propagate after being set.

**Why?** Firebase caches tokens on the client. When custom claims are updated server-side, the client's cached token is stale until refreshed.

**Solution**: Force token refresh after role changes:

```typescript
// After updateUserRole Cloud Function
const user = auth.currentUser;
await user.getIdToken(true); // Force refresh
```

### Waiting for Custom Claims

```typescript
// utils/waitForCustomClaims.ts
export async function waitForCustomClaims(
  user: User,
  maxAttempts = 30
): Promise<IdTokenResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const token = await user.getIdTokenResult(true); // Force refresh

    if (token.claims.tenant_id) {
      console.log('Custom claims received:', token.claims);
      return token;
    }

    console.log(`Waiting for claims (attempt ${i + 1}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  }

  throw new Error('Timeout waiting for tenant assignment. Please contact support.');
}
```

---

## Token Refresh Strategy

### Token Expiration

- **ID Tokens**: Expire after **60 minutes**
- **httpOnly Cookies**: Expire after **12 days**

### Automatic Token Validation

The **middleware validates tokens on every request**. No manual refresh needed in Server Components.

```typescript
// middleware.ts validates token on every request
export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    handleValidToken: async ({ decodedToken }, headers) => {
      // Token is fresh (< 60 minutes old)
      // Inject headers for Server Components
      headers.set('x-tenant-id', decodedToken.tenant_id);
      return NextResponse.next({ request: { headers } });
    },

    handleInvalidToken: async (reason) => {
      // Token expired or invalid
      return redirectToLogin(request, { path: '/login' });
    }
  });
}
```

### When Manual Refresh is Needed

Only when **custom claims change** (e.g., role update):

```typescript
// After admin changes user role
const user = auth.currentUser;
await user.getIdToken(true); // Force refresh

// Now token has updated role
const token = await user.getIdTokenResult();
console.log('New role:', token.claims.role);
```

---

## Role Management

### 5-Role Hierarchy

| Role | Permissions | Can Manage Users | Can Edit Data | Can View All |
|------|-------------|------------------|---------------|--------------|
| **Owner** | Full control | ✅ | ✅ | ✅ |
| **Admin** | Manage users, edit data | ✅ | ✅ | ✅ |
| **Member** | Edit data | ❌ | ✅ | ✅ |
| **Guest** | Selective access | ❌ | ❌ | Selective |
| **Viewer** | Read-only | ❌ | ❌ | ✅ |

### Changing User Roles

Only **admins and owners** can change roles via the `updateUserRole` Cloud Function.

```typescript
// Client calls Cloud Function
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const updateUserRole = httpsCallable(functions, 'updateUserRole');

async function changeUserRole(userId: string, newRole: string) {
  try {
    const result = await updateUserRole({ userId, newRole });
    console.log('Role updated:', result.data);

    // Force target user to refresh token
    // (they need to sign out and sign in again, or use refreshToken utility)
  } catch (error) {
    console.error('Failed to update role:', error);
  }
}
```

### Role Update Flow

```
1. Admin calls updateUserRole({ userId, newRole: 'admin' })

2. Cloud Function validates
   └─► Verify caller is admin/owner
   └─► Verify target user in same tenant
   └─► Verify not changing own role

3. Update Custom Claims
   └─► admin.auth().setCustomUserClaims(userId, {
         tenant_id: target.tenant_id,
         role: 'admin'
       })

4. Update Firestore
   └─► db.collection('users').doc(userId).update({
         role: 'admin',
         updated_at: FieldValue.serverTimestamp()
       })

5. Create Audit Log
   └─► db.collection('audit_logs').add({
         tenant_id,
         action: 'ROLE_CHANGED',
         user_id: userId,
         changes: { old_role: 'member', new_role: 'admin' }
       })

6. Target User Refreshes Token
   └─► User must call: user.getIdToken(true)
   └─► Or sign out and sign in again
```

---

## Session Management

### Server-Side Session

Server Components use the **Data Access Layer (DAL)** to get session from middleware headers:

```typescript
// app/(protected)/dashboard/page.tsx
import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Get session from middleware-injected headers
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  // session = {
  //   user_id: string,
  //   tenant_id: string,
  //   role: 'admin' | 'member' | ...,
  //   email: string
  // }

  return <DashboardClient session={session} />;
}
```

### Session Caching

The DAL uses **React.cache()** to avoid duplicate header reads:

```typescript
// lib/dal.ts
export const getCurrentSession = cache(async (): Promise<SessionContext | null> => {
  const headersList = await headers();

  const userId = headersList.get('x-user-id');
  const tenantId = headersList.get('x-tenant-id');
  const role = headersList.get('x-user-role');

  if (!userId || !tenantId || !role) {
    return null;
  }

  return { user_id: userId, tenant_id: tenantId, role, email };
});
```

Multiple components calling `getCurrentSession()` in the same request = **1 header lookup**.

---

## Related Documentation

- [Security Layers](./security-layers.md) - How each layer validates authentication
- [API Reference](./api-reference.md) - Client auth helpers and DAL functions
- [Troubleshooting](./troubleshooting.md) - Common auth issues and solutions
