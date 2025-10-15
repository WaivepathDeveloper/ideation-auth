# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **multi-tenant authentication system** for Next.js SaaS applications using Firebase. It implements **logical multi-tenancy** within a single Firebase project using a **3-layer security defense**:

1. **Cloud Functions** - Server-side logic enforces tenant isolation
2. **Firestore Security Rules** - Database-level access control
3. **TenantFirestore Client Wrapper** - Prevents developer mistakes

**CRITICAL**: Every layer must enforce tenant isolation independently. If one layer fails, the others provide backup protection.

## Core Security Pattern: TenantFirestore Wrapper

**Rule #1**: ALL database operations MUST use `TenantFirestore` wrapper (src/lib/TenantFirestore.ts). NEVER use raw Firestore SDK (`collection()`, `doc()`, etc.) in business logic.

### Why TenantFirestore is Critical

The wrapper automatically:
- Injects `tenant_id` on all writes
- Filters by `tenant_id` on all reads
- Verifies tenant ownership on updates/deletes
- Prevents cross-tenant data leaks from developer mistakes

### How to Use TenantFirestore

Initialize in Server Components with session data:

```typescript
import { getCurrentSession } from '@/lib/dal';
import { TenantFirestore } from '@/lib/TenantFirestore';

// In Server Component
export default async function MyPage() {
  const session = await getCurrentSession();
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);

  // Create with auto tenant_id injection
  await tenantDB.create('posts', { title: 'Hello' });

  // Query with auto tenant filtering
  const posts = await tenantDB.query('posts', [
    { field: 'status', op: '==', value: 'published' }
  ]);

  // Get by ID with tenant verification
  const post = await tenantDB.getById('posts', postId);

  // Update with tenant verification
  await tenantDB.update('posts', postId, { title: 'Updated' });

  // Soft delete (recommended) or hard delete
  await tenantDB.delete('posts', postId); // soft delete
  await tenantDB.delete('posts', postId, true); // hard delete

  return <MyPageClient posts={posts} />;
}
```

**Exception**: Only `tenants` and `users` collections can be accessed directly in rare admin scenarios, but still require tenant_id verification in security rules.

## Custom Claims & Token Management

### How Custom Claims Work

1. User signs up → `onUserCreate` Cloud Function triggers
2. Function checks for invitation OR creates new tenant
3. Function sets custom claims: `{ tenant_id: string, role: 'tenant_admin' | 'user' }`
4. Claims are embedded in JWT token
5. Frontend waits for claims (up to 30 seconds via `waitForCustomClaims`)
6. Once claims are set, ID token is sent to `/api/login` to create httpOnly cookie
7. Claims are accessible in:
   - Server (DAL): `session.tenant_id`, `session.role` (from middleware headers)
   - Security Rules: `request.auth.token.tenant_id`, `request.auth.token.role`
   - Cloud Functions: `context.auth.token.tenant_id`

### Token Refresh Requirements

Tokens expire after 60 minutes. The middleware automatically validates tokens on every request.

**Token refresh happens automatically when**:
- User navigates to a new page (middleware verifies cookie)
- Cookie expires (after 12 days, user must re-authenticate)
- User role changes (must sign out and sign in again to get new claims)

**Note**: Unlike client-side contexts, there's no manual token refresh needed. The server validates the token on every request via middleware.

## Database Schema Requirements

### Mandatory Fields for ALL Collections

Every tenant-scoped collection MUST include:

```typescript
{
  tenant_id: string;        // CRITICAL - enables tenant isolation
  created_by: string;       // User UID who created document
  created_at: Timestamp;    // Server timestamp
  updated_at: Timestamp;    // Server timestamp
  updated_by?: string;      // User UID who last updated (optional)
  deleted?: boolean;        // Soft delete flag (optional)
  deleted_at?: Timestamp;   // Soft delete timestamp (optional)
  deleted_by?: string;      // User UID who deleted (optional)
}
```

TenantFirestore automatically handles `tenant_id`, `created_by`, `created_at`, `updated_at`, `updated_by`, `deleted`, `deleted_at`, `deleted_by`.

### Firestore Indexes

Composite indexes are required for queries filtering by `tenant_id` + other fields. Update `firestore.indexes.json` when adding new query patterns.

```bash
# Deploy indexes before deploying code
firebase deploy --only firestore:indexes
```

## Cloud Functions Architecture

### Critical Functions (src: functions/src/)

1. **onUserCreate** (auth/onUserCreate.ts)
   - Triggered on new user signup
   - Assigns user to tenant (via invitation or creates new tenant)
   - Sets custom claims
   - **NEVER modify this without understanding impact on entire auth flow**

2. **inviteUser** (auth/inviteUser.ts)
   - Callable function for admins to invite users
   - Creates invitation document
   - Enforces rate limiting

3. **updateUserRole** (auth/updateUserRole.ts)
   - Changes user role within tenant
   - Updates custom claims
   - User must call `refreshToken()` after role change

4. **cleanupRateLimits** (scheduled/cleanupRateLimits.ts)
   - Runs hourly via Cloud Scheduler
   - Removes expired rate limit records

### Functions Development Commands

```bash
cd functions

# Build TypeScript
npm run build

# Test locally with emulators
npm run serve

# Deploy all functions
npm run deploy
# OR from project root:
firebase deploy --only functions

# View logs for specific function
firebase functions:log --only onUserCreate
```

## Security Rules Philosophy

Firestore rules (firestore.rules) are the **second layer of defense**. They must:

1. **Always verify tenant_id**: `belongsToTenant(resource.data.tenant_id)`
2. **Prevent tenant_id tampering**: `request.resource.data.tenant_id == resource.data.tenant_id`
3. **Enforce role-based access**: `isTenantAdmin()` for admin-only operations
4. **Block Cloud Function responsibilities**: User/tenant creation → `allow create: if false`

### Adding New Collections

When adding a new collection, copy the `posts` pattern (firestore.rules:99-119):

```javascript
match /your_collection/{docId} {
  allow read: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id);

  allow create: if isAuthenticated()
    && request.resource.data.tenant_id == getTenantId()
    && request.resource.data.created_by == request.auth.uid;

  allow update: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id)
    && belongsToTenant(request.resource.data.tenant_id);

  allow delete: if isAuthenticated()
    && belongsToTenant(resource.data.tenant_id);
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Frontend Development

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

### Client-Side Authentication

**IMPORTANT**: After server-first migration, authentication uses **client helper functions** instead of React Context.

#### Authentication Functions ([src/lib/client-auth.ts](src/lib/client-auth.ts))

```typescript
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from '@/lib/client-auth';

// Sign up with email
await signUpWithEmail(email, password);
// - Creates Firebase user
// - Waits for custom claims (tenant_id, role)
// - Sets httpOnly authentication cookie
// - Redirects to /dashboard

// Sign in with email
await signInWithEmail(email, password);
// - Authenticates with Firebase
// - Sets httpOnly authentication cookie
// - Redirects to /dashboard

// Sign in with Google OAuth
await signInWithGoogle();
// - Opens Google OAuth popup
// - Waits for custom claims if new user
// - Sets httpOnly authentication cookie
// - Redirects to /dashboard

// Sign out
await signOut();
// - Clears httpOnly cookie
// - Signs out from Firebase
// - Middleware redirects to /login
```

#### Usage in Auth Forms

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/client-auth';
import { signInSchema, mapFirebaseError } from '@/lib/validations/auth';

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
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

### Server-Side Data Access

**Server Components** use the Data Access Layer (DAL) to get user session:

```typescript
// app/(protected)/dashboard/page.tsx
import { getCurrentSession } from '@/lib/dal';
import { TenantFirestore } from '@/lib/TenantFirestore';

export default async function DashboardPage() {
  // Get session from middleware-injected headers
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  // Initialize TenantFirestore for database operations
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);

  // Fetch tenant-scoped data
  const posts = await tenantDB.query('posts', [
    { field: 'status', op: '==', value: 'published' }
  ]);

  return <DashboardClient session={session} posts={posts} />;
}
```

### Protected Routes

**Server Components** handle authentication via middleware and DAL:

```typescript
// No need for ProtectedRoute wrapper
// Middleware redirects unauthenticated users to /login
// Server Components use getCurrentSession() to verify auth

export default async function ProtectedPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login'); // Fallback (middleware should catch first)
  }

  // Require admin role
  if (session.role !== 'tenant_admin') {
    redirect('/unauthorized');
  }

  return <AdminPanel session={session} />;
}
```

## Design Tokens & shadcn Components

### Design Token System

**CRITICAL**: All styling MUST use CSS variables from [src/styles/globals.css](src/styles/globals.css). This enables one-file rebranding and maintains consistency across the application.

**To rebrand the entire application:**
1. Edit `src/styles/globals.css`
2. Update primary color: `--primary: oklch(0.45 0.2 250);` (change the hue value)
3. All components automatically update with new theme
4. Dark mode variants automatically adjust

**Key token categories:**
- **Colors**: `--primary`, `--secondary`, `--destructive`, `--success`, `--warning`, `--muted`, `--accent`
- **Foregrounds**: `--primary-foreground`, `--secondary-foreground`, etc. (auto-contrasting text colors)
- **Layout**: `--background`, `--foreground`, `--card`, `--border`, `--input`, `--ring`
- **Spacing**: `--spacing-xs` (0.5rem) through `--spacing-2xl` (3rem)
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`
- **Transitions**: `--transition-fast` (150ms), `--transition-normal` (200ms), `--transition-slow` (300ms)
- **Radius**: `--radius` (0.625rem for all rounded corners)

**Color Space**: Uses OKLCH (perceptually uniform) for vibrant, modern colors that maintain consistency across light/dark modes.

### Shared Auth Components

Reusable components located in [src/components/auth/shared/](src/components/auth/shared/):

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **AuthCard** | Container wrapper for auth forms | Title, optional footer, max-width constraint |
| **AuthField** | Input + label + error message | ARIA labels, error states, accessible |
| **PasswordInput** | Password field with visibility toggle | Eye icon, keyboard accessible, secure |
| **AuthButton** | Button with loading state | Spinner, disabled during loading, icon support |
| **AuthDivider** | "Or continue with" separator | Semantic `<hr>`, centered text |
| **AuthAlert** | Error/success/warning/info messages | Icon indicators, ARIA roles, variants |

**Usage Example:**
```typescript
'use client';
import { AuthCard, AuthField, PasswordInput, AuthButton, AuthAlert } from '@/components/auth/shared';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <AuthCard title="Welcome Back" footer={<a href="/signup">Create account</a>}>
      {error && <AuthAlert variant="error" message={error} />}
      <form>
        <AuthField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
        />
        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>
      </form>
    </AuthCard>
  );
}
```

### Validation with Zod

All form validation uses Zod schemas from [src/lib/validations/auth.ts](src/lib/validations/auth.ts):

```typescript
import { signInSchema, signUpSchema, mapFirebaseError } from '@/lib/validations/auth';

// Client-side validation
try {
  const validatedData = signInSchema.parse({ email, password });
  await signIn(validatedData.email, validatedData.password);
} catch (err) {
  if (err instanceof z.ZodError) {
    setError(err.errors[0].message); // Show first validation error
  } else {
    setError(mapFirebaseError(err)); // Map Firebase errors to friendly messages
  }
}
```

**Password Requirements** (enforced by signUpSchema):
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Accessibility Features

All auth components are **WCAG AA compliant**:

| Feature | Implementation |
|---------|---------------|
| **Form Labels** | All inputs have explicit `<Label>` with `htmlFor` attribute |
| **Error Announcements** | `role="alert"` on field errors for screen readers |
| **Error Linking** | `aria-describedby` links error messages to inputs |
| **Invalid States** | `aria-invalid="true"` on fields with errors |
| **Loading States** | `aria-busy="true"` on loading buttons |
| **Keyboard Navigation** | Tab through all fields, Enter to submit |
| **Password Toggle** | `aria-label` on visibility toggle button |
| **Focus Indicators** | Visible focus ring using `--shadow-focus` token |
| **Color Contrast** | Design tokens ensure 4.5:1 minimum ratio |

### shadcn/ui Components Installed

Base UI components from shadcn/ui (in [src/components/ui/](src/components/ui/)):
- `button.tsx` - Primary, secondary, outline, ghost, destructive variants
- `input.tsx` - Text, email, password input fields
- `label.tsx` - Accessible form labels with Radix UI
- `card.tsx` - Container with header, content, footer sections
- `alert.tsx` - Error, success, warning, info alert variants
- `spinner.tsx` - Loading indicator

**Installation command** (if adding new components):
```bash
npx shadcn@latest add [component-name]
```

### Routing Structure

**Public Routes** (no authentication required):
- `/` - Landing page
- `/login` - Sign in page (uses SignInForm)
- `/signup` - Sign up page (uses SignUpForm)
- `/unauthorized` - Access denied page

**Protected Routes** (require authentication):
- `/dashboard` - Main dashboard (redirects here after login)
- `/profile` - User profile settings
- `/settings` - Application settings

**Route Protection Layers**:
1. **Middleware** ([src/middleware.ts](src/middleware.ts)) - Edge-level redirect before page load
2. **ProtectedRoute Component** - Client-side verification with loading states

### Adding New Protected Pages

```typescript
// src/app/(protected)/my-page/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

**For admin-only pages:**
```typescript
<ProtectedRoute requiredRole="tenant_admin">
  {/* Admin content */}
</ProtectedRoute>
```

## Local Development with Emulators

```bash
# Start Firebase emulators (Auth, Firestore, Functions, Storage)
firebase emulators:start

# In .env.local, enable emulator mode:
NEXT_PUBLIC_USE_EMULATOR=true
```

Emulator UI: http://localhost:4000
- Auth: :9099
- Firestore: :8080
- Functions: :5001
- Storage: :9199

## Common Pitfalls & Solutions

### Issue: "Custom claims not appearing after signup"

**Cause**: `onUserCreate` function takes 5-10 seconds to run and set claims.

**Solution**: Already handled by `waitForCustomClaims` utility (src/utils/waitForCustomClaims.ts). If still failing:
1. Check Cloud Functions logs: `firebase functions:log --only onUserCreate`
2. Verify function deployed: `firebase deploy --only functions`

### Issue: "Cross-tenant data leak in new feature"

**Cause**: Using raw Firestore SDK instead of TenantFirestore wrapper.

**Solution**: ALWAYS use `tenantDB` from auth context. Search codebase for direct `collection()` or `doc()` calls in business logic and replace with `tenantDB` methods.

### Issue: "User role changed but permissions not updating"

**Cause**: Token still has old claims (tokens expire after 60 min).

**Solution**: Call `refreshToken()` after role changes:
```typescript
const { refreshToken } = useTenantAuth();
await updateUserRoleFunction(userId, newRole);
await refreshToken(); // Force token refresh
```

### Issue: "Rate limit false positives during testing"

**Cause**: Rate limit records persist until cleanup runs.

**Solution**:
- Wait 2 minutes (TTL expires)
- OR run cleanup manually: `firebase functions:log --only cleanupRateLimits`
- OR clear emulator data: Firebase Emulator UI → Firestore → Delete collection `rate_limits`

## Testing Multi-Tenancy

### Test Scenarios (Required Before Production)

1. **Cross-tenant read isolation**
   - Create User A in Tenant 1
   - Create User B in Tenant 2
   - User A attempts to read User B's data → MUST FAIL

2. **Cross-tenant write isolation**
   - User A attempts to create document with Tenant 2's tenant_id → MUST FAIL

3. **Role enforcement**
   - Regular user attempts admin-only function (e.g., inviteUser) → MUST FAIL

4. **Token expiration**
   - Wait 60+ minutes → Verify auto token refresh works

5. **Rate limiting**
   - Attempt 6+ failed logins → MUST BLOCK on 6th attempt

## Firebase Deployment Checklist

```bash
# 1. Deploy indexes first (required for queries)
firebase deploy --only firestore:indexes

# 2. Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# 3. Build and deploy functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# 4. Deploy Next.js app (e.g., to Vercel)
npm run build
# Follow hosting provider's deployment steps
```

## Firebase Configuration System

### 3-Layer Defense Architecture

The Firebase configuration implements a **production-grade 3-layer validation system** to prevent runtime errors and ensure environment variables are correctly configured across all deployment environments.

**Why This Matters**: Next.js 15's Webpack cannot inline dynamic `process.env[varName]` references. The 3-layer system uses static references, runtime validation, and lazy initialization to ensure Firebase works reliably in all scenarios.

#### Layer 1: Build-Time Validation ([next.config.ts](next.config.ts))

Validates environment variables **before** the build starts. If any required Firebase variables are missing, the build fails immediately with a clear error message.

```bash
# Build fails fast if env vars missing
npm run build

# Example error output:
# ❌ BUILD ERROR: Missing Firebase Environment Variables
# - NEXT_PUBLIC_FIREBASE_API_KEY
# - NEXT_PUBLIC_FIREBASE_PROJECT_ID
# 📋 To fix this:
#   1. Copy .env.local.example to .env.local
#   2. Fill in your Firebase project values
```

**Key Features**:
- Static `process.env` references (Webpack can inline these in client bundle)
- Explicit `env` property ensures variables are available in browser
- Helpful error messages with troubleshooting steps

#### Layer 2: Runtime Schema Validation ([src/config/firebase.config.ts](src/config/firebase.config.ts))

Uses **Zod schema validation** to verify environment variables at runtime with type safety.

```typescript
import { firebaseConfig, useEmulator } from '@/config/firebase.config';

// firebaseConfig is validated and type-safe
console.log(firebaseConfig.projectId); // TypeScript knows this exists

// useEmulator is a boolean flag
if (useEmulator) {
  // Connect to Firebase emulators
}
```

**Key Features**:
- Static `process.env` references for Webpack compatibility
- Zod schema validates format and presence of all required fields
- TypeScript type inference from Zod schema (`z.infer<typeof envSchema>`)
- Clear validation error messages if schema fails
- Separate emulator configuration

**Validation Rules**:
- All Firebase config fields must be non-empty strings
- `NEXT_PUBLIC_USE_EMULATOR` must be 'true' or 'false' (optional, defaults to 'false')
- Emulator mode only enabled in development + when flag is 'true'

#### Layer 3: Lazy Initialization ([src/lib/firebase.ts](src/lib/firebase.ts))

Firebase services (Auth, Firestore, Functions) initialize **only when first accessed**, not during module load. This prevents errors during SSR and provides graceful error handling.

```typescript
import { auth, db, functions } from '@/lib/firebase';

// Services initialize on first access
const currentUser = auth.currentUser; // Auth initializes here
const userDoc = await getDoc(doc(db, 'users', uid)); // Firestore initializes here
```

**Key Features**:
- Singleton pattern prevents multiple Firebase app instances
- Lazy initialization prevents SSR errors
- Graceful emulator connection with try-catch (won't crash if emulators not running)
- Backward compatible exports (existing imports continue to work)

**Emulator Connection**:
- Automatically connects to emulators in development when `NEXT_PUBLIC_USE_EMULATOR=true`
- Uses try-catch to handle cases where emulators aren't running
- Emulator ports:
  - Auth: `localhost:9099`
  - Firestore: `localhost:8080`
  - Functions: `localhost:5001`

### Environment Variable Requirements

Required in `.env.local` (or production environment):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Emulator Mode (optional, development only)
NEXT_PUBLIC_USE_EMULATOR=true
```

**Where to get Firebase config**:
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Select your web app (or create one)
4. Copy the config values to `.env.local`

### Common Issues & Solutions

#### Issue: "Missing required Firebase environment variables"

**Cause**: Environment variables not set or not accessible in client bundle.

**Solution**:
1. Verify `.env.local` exists and contains all required variables
2. Restart dev server after changing `.env.local`
3. For production builds, ensure hosting provider has environment variables configured

#### Issue: Build succeeds but runtime error in browser

**Cause**: Dynamic `process.env[varName]` access in code (Webpack can't inline).

**Solution**: Always use static imports:
```typescript
// ✅ CORRECT - Static import
import { firebaseConfig } from '@/config/firebase.config';

// ❌ WRONG - Dynamic access
const apiKey = process.env['NEXT_PUBLIC_FIREBASE_API_KEY'];
```

#### Issue: Firebase emulator connection fails

**Cause**: Emulators not running or wrong ports.

**Solution**:
1. Start emulators: `firebase emulators:start`
2. Verify emulator UI at `http://localhost:4000`
3. Check ports match in firebase.json
4. Error is non-fatal (app will use production Firebase if emulators unavailable)

## Key Files Reference

- **[src/lib/TenantFirestore.ts](src/lib/TenantFirestore.ts)** - Database wrapper (CRITICAL)
- **[src/contexts/TenantAuthContext.tsx](src/contexts/TenantAuthContext.tsx)** - Auth state + tenantDB initialization
- **[src/config/firebase.config.ts](src/config/firebase.config.ts)** - Firebase config with Zod validation (Layer 2)
- **[src/lib/firebase.ts](src/lib/firebase.ts)** - Lazy Firebase initialization (Layer 3)
- **[next.config.ts](next.config.ts)** - Build-time env validation (Layer 1)
- **[functions/src/auth/onUserCreate.ts](functions/src/auth/onUserCreate.ts)** - Auto tenant assignment
- **[firestore.rules](firestore.rules)** - Security rules (Layer 2 defense)
- **[docs/](docs/)** - Detailed guides for each component

## Rate Limiting

Rate limits are enforced in Cloud Functions using `functions/src/utils/rateLimiting.ts`. Current limits:
- Failed login attempts: 5 per email per 15 minutes
- Invitation creation: 10 per tenant per hour

Records auto-expire and are cleaned up hourly by `cleanupRateLimits` scheduled function.


## 4. Recent Work Log
<!-- Auto-updated by SubagentStop hook (max 10 entries) -->
- **2025-10-13 09:50** | `unknown` | Subagent completed successfully. → [Details](.claude/context/unknown_findings.md)
- **2025-10-13 09:41** | `unknown` | Subagent completed successfully. → [Details](.claude/context/unknown_findings.md)
- **2025-10-07 06:16** | `unknown` | Subagent completed successfully. → [Details](.claude/context/unknown_findings.md)
- **2025-10-06 14:11** | `unknown` | Subagent completed successfully. → [Details](.claude/context/unknown_findings.md)

- **2025-10-06 14:04** | `unknown` | Subagent completed successfully. → [Details](.claude/context/unknown_findings.md)
