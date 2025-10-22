# Troubleshooting Guide

Common issues and their solutions for the multi-tenant authentication system.

---

## Authentication Issues

### Issue: "Custom claims not appearing after signup"

**Symptoms**:
- User signs up successfully
- Redirected to dashboard but gets "Unauthorized"
- `waitForCustomClaims()` times out after 30 seconds

**Causes**:
1. `onUserCreate` Cloud Function not deployed
2. Cloud Function has errors
3. Network issues preventing function execution

**Solutions**:

1. **Check if function is deployed**:
```bash
firebase functions:list
# Look for "onUserCreate"
```

2. **View function logs**:
```bash
firebase functions:log --only onUserCreate
```

3. **Redeploy function**:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:onUserCreate
```

4. **Test in emulator** (development only):
```bash
firebase emulators:start
# Sign up and check emulator logs
```

5. **Manual fix** (temporary):
```bash
# Use Firebase Console → Authentication → Users
# Click user → Custom claims tab
# Set: {"tenant_id": "...", "role": "admin"}
```

---

### Issue: "User role changed but permissions not updating"

**Symptoms**:
- Admin changes user role via `updateUserRole`
- User still sees old permissions
- Firestore queries fail with permission denied

**Cause**: Token still has old custom claims (tokens expire after 60 minutes)

**Solutions**:

1. **Force token refresh** (client-side):
```typescript
import { auth } from '@/lib/firebase';

const user = auth.currentUser;
if (user) {
  await user.getIdToken(true); // Force refresh
  window.location.reload(); // Reload to get new session
}
```

2. **Sign out and sign in again** (simplest):
```typescript
await signOut();
router.push('/login');
// User signs in again with new role
```

3. **Wait 60 minutes**: Token will naturally expire and refresh with new claims

---

### Issue: "Google OAuth fails with 'popup closed by user'"

**Symptoms**:
- User clicks "Sign in with Google"
- Popup opens then immediately closes
- Error: "The popup has been closed by the user before finalizing the operation"

**Causes**:
1. Popup blocked by browser
2. Domain not authorized in Firebase console
3. OAuth configuration incomplete

**Solutions**:

1. **Check popup blockers**:
   - Disable browser popup blocker
   - Whitelist your domain

2. **Verify authorized domains** (Firebase Console):
   - Go to Authentication → Settings → Authorized domains
   - Add your domain (e.g., `localhost`, `yourdomain.com`)

3. **Configure OAuth client ID**:
   - Go to Authentication → Sign-in method → Google
   - Ensure Web SDK configuration is complete
   - Verify client ID matches your app

4. **Use redirect instead of popup** (alternative):
```typescript
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

await signInWithRedirect(auth, new GoogleAuthProvider());
```

---

## Multi-Tenancy Issues

### Issue: "Cross-tenant data leak in new feature"

**Symptoms**:
- User can see data from other tenants
- Queries return documents from multiple tenants
- No errors in console

**Cause**: Using raw Firestore SDK instead of TenantFirestore wrapper

**Solution**:

1. **Find problematic queries**:
```bash
# Search for direct Firestore usage
grep -r "collection(db," src/
grep -r "getDocs" src/
grep -r "getDoc" src/
```

2. **Replace with TenantFirestore**:
```typescript
// ❌ BAD - Direct Firestore usage
import { collection, getDocs } from 'firebase/firestore';
const posts = await getDocs(collection(db, 'posts'));

// ✅ GOOD - TenantFirestore wrapper
import { TenantFirestore } from '@/lib/TenantFirestore';
const session = await getCurrentSession();
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
const posts = await tenantDB.query('posts');
```

3. **Verify Firestore Rules** still enforce tenant isolation:
```bash
# Test in Firebase Console
# Firestore → Rules → Simulator
# Try querying posts without tenant_id filter
# Should FAIL even if client code has bug
```

---

### Issue: "User can access data from wrong tenant"

**Symptoms**:
- User belongs to Tenant A
- Can read/write data in Tenant B
- No permission denied errors

**Causes**:
1. Custom claims have wrong tenant_id
2. Firestore Rules not enforcing tenant_id
3. TenantFirestore initialized with wrong tenant_id

**Solutions**:

1. **Verify custom claims**:
```typescript
// Client-side
import { auth } from '@/lib/firebase';

const user = auth.currentUser;
const token = await user?.getIdTokenResult();
console.log('Tenant ID in token:', token?.claims.tenant_id);

// Server-side
import { getCurrentSession } from '@/lib/dal';
const session = await getCurrentSession();
console.log('Tenant ID in session:', session?.tenant_id);
```

2. **Check Firestore Rules**:
```javascript
// Verify rules include tenant_id check
match /posts/{postId} {
  allow read: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id); // MUST have this!
}
```

3. **Verify TenantFirestore initialization**:
```typescript
// Make sure session.tenant_id is correct
const session = await getCurrentSession();
console.log('Initializing TenantFirestore with tenant_id:', session.tenant_id);
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
```

4. **Fix custom claims** (if wrong):
```bash
# Use Firebase Console → Authentication → Users
# Or redeploy onUserCreate function
```

---

## Rate Limiting Issues

### Issue: "Rate limit false positives during testing"

**Symptoms**:
- Legitimate requests blocked with "Too many requests"
- Happens after a few test signups/logins
- Rate limit records persist

**Cause**: Rate limit records not cleaned up between tests

**Solutions**:

1. **Wait for TTL to expire** (2 minutes for login, 1 hour for invites):
```bash
# Just wait... rate limits auto-expire
```

2. **Clear rate limit collection** (emulator only):
```bash
# In emulator UI: http://localhost:4000
# Firestore → rate_limits collection → Clear collection
```

3. **Manually trigger cleanup** (production):
```bash
# View cleanup logs
firebase functions:log --only cleanupRateLimits

# Cleanup runs hourly automatically
```

4. **Disable rate limiting** (development only):
```typescript
// functions/src/utils/rateLimiting.ts
export async function checkRateLimit(...) {
  if (process.env.NODE_ENV === 'development') {
    return; // Skip rate limiting in dev
  }
  // ... normal rate limit logic
}
```

---

## Database Issues

### Issue: "Firestore query fails with 'requires an index'"

**Symptoms**:
- Query works in development
- Fails in production with index error
- Error message includes index creation link

**Cause**: Composite index not created for query

**Solutions**:

1. **Create index automatically**:
   - Click the link in the error message
   - Firebase Console opens → Create index
   - Wait 2-3 minutes for index to build

2. **Add index to firestore.indexes.json**:
```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenant_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

3. **Deploy indexes**:
```bash
firebase deploy --only firestore:indexes
```

---

### Issue: "Document updates fail with 'PERMISSION_DENIED'"

**Symptoms**:
- Update operation throws permission denied error
- User is authenticated and belongs to tenant
- Similar updates work elsewhere

**Causes**:
1. Trying to update immutable fields (tenant_id, created_by, created_at)
2. Firestore Rules prevent update
3. User doesn't own the document

**Solutions**:

1. **Check for immutable field updates**:
```typescript
// ❌ BAD - Trying to change tenant_id
await tenantDB.update('posts', postId, {
  title: 'New Title',
  tenant_id: 'different-tenant' // BLOCKED by TenantFirestore
});

// ✅ GOOD - Only update allowed fields
await tenantDB.update('posts', postId, {
  title: 'New Title'
  // tenant_id automatically preserved
});
```

2. **Verify document ownership**:
```typescript
const post = await tenantDB.getById('posts', postId);
console.log('Created by:', post.created_by);
console.log('Current user:', session.user_id);

// User must own document OR be admin to update
```

3. **Check Firestore Rules**:
```javascript
match /posts/{postId} {
  allow update: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && belongsToTenant(request.resource.data.tenant_id)
    && (resource.data.created_by == request.auth.uid || canManageUsers());
}
```

---

## Build & Deployment Issues

### Issue: "Build fails with 'Missing Firebase environment variables'"

**Symptoms**:
```bash
npm run build
# Error: Missing required Firebase environment variables
```

**Cause**: Environment variables not set in build environment

**Solutions**:

1. **Local build**: Ensure `.env.local` exists
```bash
cp .env.local.example .env.local
# Fill in Firebase config values
```

2. **Vercel/Netlify build**:
   - Go to project settings → Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Redeploy

3. **Verify variables loaded**:
```typescript
// next.config.ts
console.log('Firebase config check:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅' : '❌',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅' : '❌'
});
```

---

### Issue: "Cloud Functions deployment fails"

**Symptoms**:
```bash
firebase deploy --only functions
# Error: Build failed
```

**Causes**:
1. TypeScript compilation errors
2. Missing dependencies
3. Invalid firebase.json configuration

**Solutions**:

1. **Check TypeScript compilation**:
```bash
cd functions
npm run build
# Fix any TypeScript errors shown
```

2. **Reinstall dependencies**:
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

3. **Check function names** in firebase.json:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

4. **Deploy one function at a time**:
```bash
firebase deploy --only functions:onUserCreate
firebase deploy --only functions:inviteUser
```

---

## Middleware & Session Issues

### Issue: "Middleware redirects authenticated user to login"

**Symptoms**:
- User signs in successfully
- Immediately redirected back to /login
- No errors in console

**Causes**:
1. httpOnly cookie not being set
2. Cookie domain mismatch
3. Middleware configuration error

**Solutions**:

1. **Verify cookie is set**:
   - Browser DevTools → Application → Cookies
   - Look for `auth-token` cookie
   - Should be httpOnly, Secure, SameSite=Lax

2. **Check /api/login endpoint**:
```typescript
// app/api/login/route.ts
import { loginApiRoute } from 'next-firebase-auth-edge/lib/next/api-route';
import { authConfig } from '@/config/auth-edge.config';

export async function POST(request: Request) {
  try {
    return loginApiRoute(request, authConfig);
  } catch (error) {
    console.error('[/api/login] Error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500
    });
  }
}
```

3. **Verify middleware config**:
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/api/login',
    '/api/logout',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

### Issue: "Server Component gets null session despite authentication"

**Symptoms**:
- User is authenticated (cookie exists)
- `getCurrentSession()` returns null in Server Component
- Middleware logs show valid token

**Causes**:
1. Headers not being passed through middleware
2. DAL not reading headers correctly

**Solutions**:

1. **Check middleware header injection**:
```typescript
// middleware.ts
handleValidToken: async ({ decodedToken }, headers) => {
  console.log('[Middleware] Setting headers:', {
    'x-user-id': decodedToken.uid,
    'x-tenant-id': decodedToken.tenant_id,
    'x-user-role': decodedToken.role
  });

  headers.set('x-user-id', decodedToken.uid);
  headers.set('x-tenant-id', decodedToken.tenant_id as string);
  headers.set('x-user-role', decodedToken.role as string);

  return NextResponse.next({ request: { headers } });
}
```

2. **Check DAL header reading**:
```typescript
// lib/dal.ts
export const getCurrentSession = cache(async () => {
  const headersList = await headers();

  console.log('[DAL] Reading headers:', {
    'x-user-id': headersList.get('x-user-id'),
    'x-tenant-id': headersList.get('x-tenant-id'),
    'x-user-role': headersList.get('x-user-role')
  });

  // ...
});
```

---

## Performance Issues

### Issue: "Dashboard loads slowly"

**Symptoms**:
- Dashboard takes 3-5 seconds to load
- Multiple Firestore queries
- No loading states shown

**Solutions**:

1. **Use pagination**:
```typescript
// Instead of loading all posts
const posts = await tenantDB.query('posts');

// Load first page only
const page = await tenantDB.queryPaginated('posts', [], { limit: 20 });
```

2. **Parallel data fetching**:
```typescript
// ❌ Sequential (slow)
const posts = await tenantDB.query('posts');
const users = await tenantDB.query('users');

// ✅ Parallel (fast)
const [posts, users] = await Promise.all([
  tenantDB.query('posts'),
  tenantDB.query('users')
]);
```

3. **Add Suspense boundaries**:
```typescript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}
```

4. **Enable Firestore caching**:
```typescript
// lib/firebase.ts
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
```

---

## Getting Help

### 1. Enable Detailed Logging

```typescript
// Add to all layers

// Middleware
console.log('[Middleware]', ...);

// DAL
console.log('[DAL]', ...);

// TenantFirestore
console.log('[TenantFirestore]', ...);

// Cloud Functions
console.log('[onUserCreate]', ...);
```

### 2. Check Firebase Status

https://status.firebase.google.com

### 3. Review Documentation

- [Architecture](./architecture.md) - System overview
- [Security Layers](./security-layers.md) - How each layer works
- [API Reference](./api-reference.md) - Complete API docs
- [Development Guide](./development.md) - Local development tips

### 4. Common Debug Commands

```bash
# View Cloud Function logs
firebase functions:log --only onUserCreate

# Test Firestore Rules
firebase emulators:start
# Go to http://localhost:4000 → Firestore → Rules simulator

# Check environment variables
env | grep FIREBASE

# Verify Firebase project
firebase use
firebase projects:list
```

---

## Related Documentation

- [Architecture](./architecture.md) - System architecture overview
- [Security Layers](./security-layers.md) - Defense-in-depth explanation
- [API Reference](./api-reference.md) - Complete API documentation
- [Development Guide](./development.md) - Local development workflow
- [Deployment Guide](./deployment.md) - Production deployment steps
