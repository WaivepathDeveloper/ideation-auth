# CLAUDE.md

This file provides guidance to Claude Code when working with this multi-tenant authentication system.

---

## Project Overview

This is a **production-ready multi-tenant SaaS authentication system** built with Next.js 15 and Firebase. It implements **logical multi-tenancy** within a single Firebase project using a **6-layer defense-in-depth security architecture**.

### Defense Layers

1. **Edge Middleware** - JWT token verification before page load
2. **Data Access Layer (DAL)** - Server-side authorization and session management
3. **Client Validation** - Input validation with Zod schemas
4. **Cloud Functions** - Privileged operations (tenant creation, role management)
5. **Firestore Security Rules** - Database-level enforcement
6. **TenantFirestore Wrapper** - Automatic tenant_id injection and developer safety

### Communication Flow

```
Client → Firebase SDK → httpOnly Cookies → Middleware → DAL → Server Components → TenantFirestore → Firestore
                                           ↓
                                    Cloud Functions (privileged operations)
```

---

## 📚 Complete Documentation

### Core Guides

| Document | Description |
|----------|-------------|
| **[docs/architecture.md](docs/architecture.md)** | System architecture, 6-layer defense, component diagram, multi-tenancy model |
| **[docs/security-layers.md](docs/security-layers.md)** | Deep dive into each security layer, implementation patterns, failure scenarios |
| **[docs/authentication-flow.md](docs/authentication-flow.md)** | User flows (signup, signin, OAuth), custom claims, token lifecycle, role management |
| **[docs/api-reference.md](docs/api-reference.md)** | Complete API documentation for DAL, TenantFirestore, Cloud Functions, client helpers |
| **[docs/deployment.md](docs/deployment.md)** | Step-by-step deployment guide, environment setup, production checklist |
| **[docs/development.md](docs/development.md)** | Local development, Firebase emulators, testing strategies, debugging tips |
| **[docs/database-schema.md](docs/database-schema.md)** | Schema requirements, mandatory fields, indexes, audit trails |
| **[docs/troubleshooting.md](docs/troubleshooting.md)** | Common issues and solutions, debugging guide |

### UI Development Guides

| Document | Description |
|----------|-------------|
| **[docs/shadcn/shadcn-workflow.md](docs/shadcn/shadcn-workflow.md)** | Shadcn UI development workflow, agent pipelines, integration patterns |
| **[docs/shadcn/design-tokens.md](docs/shadcn/design-tokens.md)** | Design token system, CSS variables, rebranding guide |
| **[docs/shadcn/shadcn-agents-usage.md](docs/shadcn/shadcn-agents-usage.md)** | Complete agent reference (analyzer, researcher, builder, quick-helper) |

### Specialized Guides

| Document | Description |
|----------|-------------|
| **[docs/firestore-rules-guide.md](docs/firestore-rules-guide.md)** | Firestore Security Rules patterns and examples |
| **[docs/rate-limiting-guide.md](docs/rate-limiting-guide.md)** | Rate limiting implementation and configuration |
| **[docs/5-role-implementation-summary.md](docs/5-role-implementation-summary.md)** | 5-role hierarchy (owner, admin, member, guest, viewer) |
| **[docs/role-based-ui-implementation.md](docs/role-based-ui-implementation.md)** | Frontend role-based access control |
| **[docs/future-enhancements.md](docs/future-enhancements.md)** | Planned features and improvements |

---

## ⚡ Quick Start for Claude Code

### Critical Security Rule

**Rule #1**: ALL database operations MUST use `TenantFirestore` wrapper. NEVER use raw Firestore SDK (`collection()`, `doc()`, etc.) in business logic.

### Server Component Pattern

```typescript
import { getCurrentSession } from '@/lib/dal';
import { TenantFirestore } from '@/lib/TenantFirestore';

export default async function MyPage() {
  // 1. Get session (validates auth + tenant)
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  // 2. Initialize TenantFirestore
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);

  // 3. Query with auto tenant filtering
  const posts = await tenantDB.query('posts', [
    { field: 'status', op: '==', value: 'published' }
  ]);

  return <MyPageClient posts={posts} />;
}
```

### Client Authentication Pattern

```typescript
'use client';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } from '@/lib/client-auth';
import { signInSchema, mapFirebaseError } from '@/lib/validations/auth';

// Validate input
const result = signInSchema.safeParse({ email, password });
if (!result.success) {
  setError(result.error.errors[0].message);
  return;
}

// Authenticate
try {
  await signInWithEmail(email, password); // Sets httpOnly cookie
  router.push('/dashboard');
} catch (err) {
  setError(mapFirebaseError(err));
}
```

### Adding New Firestore Collections

**Always copy this pattern** (see [docs/firestore-rules-guide.md](docs/firestore-rules-guide.md)):

```javascript
// firestore.rules
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

---

## 🔑 Key Files Reference

### Security Layer Files

| File | Layer | Purpose |
|------|-------|---------|
| [src/middleware.ts](src/middleware.ts) | Layer 1 | Edge authentication, JWT verification |
| [src/lib/dal.ts](src/lib/dal.ts) | Layer 2 | Server authorization, session management |
| [src/lib/validations/auth.ts](src/lib/validations/auth.ts) | Layer 3 | Input validation with Zod |
| [functions/src/auth/](functions/src/auth/) | Layer 4 | Privileged Cloud Functions |
| [firestore.rules](firestore.rules) | Layer 5 | Database security rules |
| [src/lib/TenantFirestore.ts](src/lib/TenantFirestore.ts) | Layer 6 | Database wrapper with auto tenant_id |

### Core Implementation Files

| File | Purpose |
|------|---------|
| [src/lib/firebase.ts](src/lib/firebase.ts) | Firebase initialization (lazy, with emulator support) |
| [src/lib/client-auth.ts](src/lib/client-auth.ts) | Client auth helpers (signUpWithEmail, signInWithEmail, signInWithGoogle, signOut) |
| [src/config/firebase.config.ts](src/config/firebase.config.ts) | Firebase config with Zod validation |
| [next.config.ts](next.config.ts) | Build-time environment validation |
| [functions/src/auth/onUserCreate.ts](functions/src/auth/onUserCreate.ts) | Auto tenant assignment on signup (CRITICAL) |
| [functions/src/auth/inviteUser.ts](functions/src/auth/inviteUser.ts) | Generate secure invitation tokens & links |
| [src/app/accept-invite/page.tsx](src/app/accept-invite/page.tsx) | Token-based invitation acceptance (public route) |
| [src/lib/actions/accept-invitation.ts](src/lib/actions/accept-invitation.ts) | Server action: mark invitation accepted |
| [src/lib/actions/revoke-invitation.ts](src/lib/actions/revoke-invitation.ts) | Server action: revoke pending invitations |

---

## 🚨 Common Pitfalls

| Issue | Cause | Solution |
|-------|-------|----------|
| **Custom claims timeout** | onUserCreate function not deployed or has errors | Check logs: `firebase functions:log --only onUserCreate` |
| **Cross-tenant data leak** | Using raw Firestore SDK instead of TenantFirestore | Always use `tenantDB.query()` not `getDocs(collection())` |
| **Role change not working** | Token cached with old claims (60min expiry) | Force refresh: `user.getIdToken(true)` or sign out/in |
| **Rate limit false positive** | Rate limit records persist | Wait 2 min or clear `rate_limits` collection in emulator |
| **Firestore index missing** | Composite index not created | Click error link to create or add to `firestore.indexes.json` |

See [docs/troubleshooting.md](docs/troubleshooting.md) for detailed solutions.

---

## 📦 Database Schema Requirements

### Mandatory Fields (ALL Collections)

```typescript
{
  tenant_id: string;        // CRITICAL - enables tenant isolation
  created_by: string;       // User UID who created
  created_at: Timestamp;    // Server timestamp
  updated_at: Timestamp;    // Server timestamp
  updated_by?: string;      // User UID who last updated
  deleted?: boolean;        // Soft delete flag
  deleted_at?: Timestamp;   // Soft delete timestamp
  deleted_by?: string;      // User UID who deleted
}
```

**TenantFirestore automatically handles these fields** - just provide business data.

### Tenants Collection (Special Requirements)

```typescript
{
  tenant_id: string;        // MUST equal document ID (validated in rules)
  name: string;
  status: 'active' | 'suspended' | 'deleted';
  created_by: string;       // IMMUTABLE
  owner_id?: string;        // IMMUTABLE after first set
  settings: { /* ... */ },
  // ...standard audit fields
}
```

See [docs/database-schema.md](docs/database-schema.md) for complete schema guide.

---

## 🛠️ Development Commands

```bash
# Development
npm run dev                          # Start Next.js dev server
firebase emulators:start             # Start Firebase emulators (Auth, Firestore, Functions)

# Testing
npm test                             # Run unit tests
npm run lint                         # Run ESLint

# Building
npm run build                        # Production build
cd functions && npm run build        # Build Cloud Functions

# Firebase Deployment
firebase deploy --only firestore:indexes   # Deploy indexes (do this first!)
firebase deploy --only firestore:rules     # Deploy security rules
firebase deploy --only functions           # Deploy Cloud Functions
firebase deploy --only storage:rules       # Deploy storage rules

# Debugging
firebase functions:log --only onUserCreate # View function logs
firebase emulators:start --import=./data   # Import emulator data
```

See [docs/development.md](docs/development.md) for detailed workflow.

---

## 🌐 Environment Variables

Required in `.env.local`:

```bash
# Firebase Configuration (get from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Application URL (for generating invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Use production domain in prod

# Development Only
NEXT_PUBLIC_USE_EMULATOR=true  # Use Firebase emulators
```

---

## 🎯 When Adding New Features

1. **Read first**: Check [docs/architecture.md](docs/architecture.md) to understand the system
2. **Database operations**: ALWAYS use TenantFirestore wrapper
3. **Server components**: ALWAYS call `getCurrentSession()` or `requireAuth()`
4. **New collections**: Add Firestore rules following [docs/firestore-rules-guide.md](docs/firestore-rules-guide.md)
5. **Client forms**: Validate with Zod schemas from `src/lib/validations/`
6. **Test isolation**: Verify cross-tenant data cannot be accessed

---

## 🎨 Shadcn UI Development

### Quick Start

For UI features, use the 4-agent pipeline:
1. **shadcn-requirements-analyzer** - Break down feature into components
2. **shadcn-component-researcher** - Research component APIs and dependencies
3. **shadcn-implementation-builder** - Build production-ready code
4. **shadcn-quick-helper** - Fast path for single components

### Critical Rules

**Design Tokens**: ALL UI MUST use tokens from `src/styles/tokens.css`
- ❌ NEVER hardcode colors: `bg-blue-500`
- ✅ ALWAYS use CSS variables: `bg-primary`
- Single source of truth for rebranding

**Security Integration**: UI components MUST integrate with:
- TenantFirestore for data operations
- Role-based access control (5-role hierarchy)
- getCurrentSession() for server components

**See**: [docs/shadcn/shadcn-workflow.md](docs/shadcn/shadcn-workflow.md) for complete workflow

---

## 📖 Additional Resources

- **Firebase Console**: https://console.firebase.google.com
- **Next.js Docs**: https://nextjs.org/docs
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **Firestore Docs**: https://firebase.google.com/docs/firestore
