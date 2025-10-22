# Development Guide

## Table of Contents
- [Local Setup](#local-setup)
- [Firebase Emulators](#firebase-emulators)
- [Development Workflow](#development-workflow)
- [Testing Strategies](#testing-strategies)
- [Debugging Tips](#debugging-tips)
- [Code Style](#code-style)

---

## Local Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Enable emulators for local development
NEXT_PUBLIC_USE_EMULATOR=true
```

### 3. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

---

## Firebase Emulators

### Start Emulators

```bash
firebase emulators:start
```

**Emulator ports**:
- **Emulator UI**: http://localhost:4000
- **Auth**: localhost:9099
- **Firestore**: localhost:8080
- **Functions**: localhost:5001
- **Storage**: localhost:9199

### Emulator Features

**Authentication**:
- Create test users without email verification
- Instantly set custom claims
- No rate limiting

**Firestore**:
- View documents in real-time
- Test security rules
- Clear data between tests

**Cloud Functions**:
- Hot reload on code changes
- View logs in terminal
- Debug with breakpoints

### Import/Export Emulator Data

```bash
# Export data
firebase emulators:export ./emulator-data

# Import data on startup
firebase emulators:start --import=./emulator-data
```

---

## Development Workflow

### 1. Start Development Server

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start Next.js dev server
npm run dev
```

Open http://localhost:3000

### 2. Make Code Changes

**Frontend** (Next.js):
- Hot reload automatic
- Changes visible immediately
- Check browser console for errors

**Cloud Functions**:
- TypeScript compiles automatically
- Functions reload on save
- View logs in terminal

**Firestore Rules**:
- Edit `firestore.rules`
- Rules reload automatically in emulator
- Test in Emulator UI rules simulator

### 3. Test Changes

**Manual testing**:
1. Sign up new user
2. Verify custom claims set (check browser DevTools → Application → IndexedDB → firebaseLocalStorage)
3. Test tenant isolation (create 2 users, verify data separation)
4. Test role-based access (try accessing admin pages as regular user)

**Automated testing**:
```bash
npm test
```

---

## Testing Strategies

### Unit Tests

**Test DAL functions**:
```typescript
// __tests__/lib/dal.test.ts
import { getCurrentSession, requireAuth } from '@/lib/dal';

jest.mock('next/headers', () => ({
  headers: jest.fn()
}));

describe('getCurrentSession', () => {
  it('returns null when headers missing', async () => {
    const session = await getCurrentSession();
    expect(session).toBeNull();
  });

  it('returns session when headers present', async () => {
    // Mock headers
    const mockHeaders = new Map([
      ['x-user-id', 'user-123'],
      ['x-tenant-id', 'tenant-abc'],
      ['x-user-role', 'admin'],
      ['x-user-email', 'user@example.com']
    ]);

    (headers as jest.Mock).mockResolvedValue(mockHeaders);

    const session = await getCurrentSession();
    expect(session).toEqual({
      user_id: 'user-123',
      tenant_id: 'tenant-abc',
      role: 'admin',
      email: 'user@example.com'
    });
  });
});
```

**Test TenantFirestore wrapper**:
```typescript
// __tests__/lib/TenantFirestore.test.ts
import { TenantFirestore } from '@/lib/TenantFirestore';

describe('TenantFirestore', () => {
  it('auto-injects tenant_id on create', async () => {
    const wrapper = new TenantFirestore('tenant-123', 'user-456');

    const doc = await wrapper.create('posts', {
      title: 'Test Post'
    });

    expect(doc.tenant_id).toBe('tenant-123');
    expect(doc.created_by).toBe('user-456');
  });

  it('throws error on tenant_id mismatch', async () => {
    const wrapper = new TenantFirestore('tenant-123', 'user-456');

    await expect(
      wrapper.create('posts', {
        title: 'Test',
        tenant_id: 'different-tenant' // Mismatch!
      })
    ).rejects.toThrow('Cannot specify different tenant_id');
  });
});
```

### Integration Tests

**Test Cloud Functions**:
```bash
cd functions
npm test
```

```typescript
// functions/__tests__/onUserCreate.test.ts
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('onUserCreate', () => {
  afterAll(() => {
    testEnv.cleanup();
  });

  it('creates tenant for new user', async () => {
    const user = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    await onUserCreate(user);

    // Verify tenant created
    const snapshot = await admin.firestore().collection('tenants')
      .where('created_by', '==', 'test-uid')
      .get();

    expect(snapshot.empty).toBe(false);
  });
});
```

### End-to-End Tests

**Test with Cypress or Playwright**:
```typescript
// e2e/signup.spec.ts
test('user can sign up and access dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/signup');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecureP@ss123');
  await page.fill('[name="confirmPassword"]', 'SecureP@ss123');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('http://localhost:3000/dashboard');

  // Verify dashboard loaded
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Test Firestore Rules

**Use rules simulator**:
1. Go to http://localhost:4000
2. Click **Firestore** → **Rules**
3. Click **Rules Playground**
4. Test queries with different auth contexts

**Example**:
```javascript
// Test reading posts as user-123 in tenant-abc
auth: {
  uid: 'user-123',
  token: {
    tenant_id: 'tenant-abc',
    role: 'member'
  }
}

// Try reading:
firestore.collection('posts').where('tenant_id', '==', 'tenant-abc').get()
// Should SUCCEED

firestore.collection('posts').where('tenant_id', '==', 'different-tenant').get()
// Should FAIL
```

---

## Debugging Tips

### 1. Debug Middleware

Add logging in middleware:
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  console.log('[Middleware] Request:', request.nextUrl.pathname);

  return authMiddleware(request, {
    handleValidToken: async ({ decodedToken }, headers) => {
      console.log('[Middleware] Valid token:', {
        uid: decodedToken.uid,
        tenant_id: decodedToken.tenant_id,
        role: decodedToken.role
      });
      // ...
    },

    handleInvalidToken: async (reason) => {
      console.error('[Middleware] Invalid token:', reason);
      // ...
    }
  });
}
```

### 2. Debug DAL

Add logging in Server Components:
```typescript
export default async function DashboardPage() {
  const session = await getCurrentSession();
  console.log('[DashboardPage] Session:', session);

  if (!session) {
    console.error('[DashboardPage] No session, redirecting to login');
    redirect('/login');
  }
}
```

### 3. Debug Cloud Functions

View logs in terminal:
```bash
# Terminal running emulators shows function logs
firebase emulators:start
```

Add detailed logging:
```typescript
// functions/src/auth/onUserCreate.ts
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  console.log('[onUserCreate] Processing user:', {
    uid: user.uid,
    email: user.email
  });

  const inviteSnapshot = await db.collection('invitations')
    .where('email', '==', user.email)
    .get();

  console.log('[onUserCreate] Invitations found:', inviteSnapshot.size);

  // ...
});
```

### 4. Debug Custom Claims

Check claims in browser:
```typescript
// Client-side
import { auth } from '@/lib/firebase';

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const token = await user.getIdTokenResult();
    console.log('Custom claims:', token.claims);
    console.log('Tenant ID:', token.claims.tenant_id);
    console.log('Role:', token.claims.role);
  }
});
```

### 5. Debug Firestore Queries

Enable Firestore debug logging:
```typescript
// lib/firebase.ts
import { enableIndexedDbPersistence, setLogLevel } from 'firebase/firestore';

if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}
```

---

## Code Style

### TypeScript

- ✅ Use explicit types (avoid `any`)
- ✅ Use interfaces for objects
- ✅ Use enums for fixed sets of values

```typescript
// Good
interface Post {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  tenant_id: string;
  created_by: string;
  created_at: Date;
}

// Bad
const post: any = { ... };
```

### React Components

- ✅ Use Server Components by default
- ✅ Mark Client Components with `'use client'`
- ✅ Prefer async/await over promises

```typescript
// Good - Server Component
export default async function DashboardPage() {
  const session = await getCurrentSession();
  return <DashboardClient session={session} />;
}

// Good - Client Component
'use client';
export default function SignInForm() {
  const [loading, setLoading] = useState(false);
  // ...
}
```

### Error Handling

- ✅ Always catch errors
- ✅ Log errors with context
- ✅ Show user-friendly messages

```typescript
// Good
try {
  await signUpWithEmail(email, password);
  router.push('/dashboard');
} catch (error) {
  console.error('Signup error:', error);
  setError(mapFirebaseError(error));
}

// Bad
signUpWithEmail(email, password).then(() => {
  router.push('/dashboard');
}); // No error handling!
```

### Security Rules

- ✅ Always check `isAuthenticated()`
- ✅ Always validate `belongsToTenant()`
- ✅ Use helper functions for readability

```javascript
// Good
match /posts/{postId} {
  allow read: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id);
}

// Bad
match /posts/{postId} {
  allow read: if request.auth != null; // Missing tenant check!
}
```

---

## Useful Commands

```bash
# Development
npm run dev                    # Start Next.js dev server
firebase emulators:start       # Start Firebase emulators
npm test                       # Run tests
npm run lint                   # Run ESLint

# Building
npm run build                  # Production build
cd functions && npm run build  # Build Cloud Functions

# Firebase
firebase deploy --only functions           # Deploy functions only
firebase deploy --only firestore:rules     # Deploy Firestore rules
firebase deploy --only firestore:indexes   # Deploy indexes
firebase functions:log --only onUserCreate # View function logs

# Emulators
firebase emulators:export ./data          # Export emulator data
firebase emulators:start --import=./data  # Import data on start
```

---

## Related Documentation

- [API Reference](./api-reference.md) - Complete API documentation
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Deployment Guide](./deployment.md) - Deploy to production
