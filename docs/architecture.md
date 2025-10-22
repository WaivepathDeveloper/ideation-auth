# System Architecture

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [6-Layer Defense System](#6-layer-defense-system)
- [Component Architecture](#component-architecture)
- [Communication Flow](#communication-flow)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Data Flow Patterns](#data-flow-patterns)

---

## Overview

This is a **production-ready multi-tenant SaaS authentication system** built for Next.js applications using Firebase as the backend infrastructure. The system implements **logical multi-tenancy** within a single Firebase project, allowing multiple organizations (tenants) to share the same application instance while maintaining complete data isolation and security.

### Key Design Principles

1. **Defense-in-Depth**: Multiple independent security layers that each enforce tenant isolation
2. **Zero Trust**: Every layer validates authentication and authorization independently
3. **Server-First**: Authentication and authorization happen server-side, never trusting client data
4. **Automatic Safety**: Developer-friendly wrappers prevent common security mistakes
5. **Audit Trail**: Every operation is logged with tenant_id and user_id context

---

## Technology Stack

### Frontend
- **Next.js 15** (App Router) - React framework with server components
- **React 18** - UI library
- **TypeScript** - Type safety
- **Firebase Client SDK** - Client-side Firebase integration
- **next-firebase-auth-edge** - Middleware authentication library
- **Zod** - Schema validation

### Backend
- **Firebase Authentication** - User identity management
- **Cloud Firestore** - NoSQL database
- **Cloud Functions** (Node.js) - Serverless compute
- **Cloud Storage** - File storage
- **Firebase Admin SDK** - Privileged server operations

### Security & Infrastructure
- **Firestore Security Rules** - Database-level access control
- **httpOnly Cookies** - Secure token storage
- **JWT Custom Claims** - Tenant and role information
- **Rate Limiting** - Abuse prevention

---

## 6-Layer Defense System

This system implements **six independent security layers** that each enforce tenant isolation. If any single layer fails, the other layers provide backup protection.

### Layer 1: Edge Middleware
**File**: [src/middleware.ts](../src/middleware.ts)
**Purpose**: Edge-level authentication before any page loads

**Responsibilities**:
- ✅ Verify signed JWT cookie on every request
- ✅ Validate token signature and expiration
- ✅ Extract and validate custom claims (tenant_id, role)
- ✅ Inject user context into request headers
- ✅ Redirect unauthenticated users to /login

**Protection**: Prevents unauthenticated access at the edge, before any server code runs.

---

### Layer 2: Data Access Layer (DAL)
**File**: [src/lib/dal.ts](../src/lib/dal.ts)
**Purpose**: Server-side authorization and session management

**Responsibilities**:
- ✅ Extract session from middleware-injected headers
- ✅ Validate tenant ownership on every data access
- ✅ Enforce role-based access control (RBAC)
- ✅ Return safe DTOs (Data Transfer Objects)
- ✅ Provide authorization helper functions

**Protection**: Server components verify authentication independently, never trusting middleware alone.

---

### Layer 3: Client Validation
**File**: [src/lib/validations/auth.ts](../src/lib/validations/auth.ts)
**Purpose**: Input validation and sanitization

**Responsibilities**:
- ✅ Validate email format and password strength
- ✅ Sanitize user inputs before Firebase operations
- ✅ Map Firebase errors to user-friendly messages
- ✅ Enforce password requirements (6+ chars, uppercase, lowercase, number)

**Protection**: Prevents malformed or malicious input from reaching Firebase or backend systems.

---

### Layer 4: Cloud Functions
**Files**: [functions/src/](../functions/src/)
**Purpose**: Privileged server-side operations

**Responsibilities**:
- ✅ Auto-assign tenant_id and role on user creation
- ✅ Manage user invitations and tenant membership
- ✅ Update custom claims (only Cloud Functions can do this)
- ✅ Enforce rate limiting
- ✅ Create audit logs

**Protection**: Critical operations (tenant creation, role changes) only happen server-side with Firebase Admin SDK privileges.

---

### Layer 5: Firestore Security Rules
**File**: [firestore.rules](../firestore.rules)
**Purpose**: Database-level access control

**Responsibilities**:
- ✅ Verify request.auth.token.tenant_id matches resource.data.tenant_id
- ✅ Enforce role-based permissions (5-role hierarchy)
- ✅ Prevent tenant_id tampering (immutability checks)
- ✅ Block direct user/tenant creation (only Cloud Functions allowed)
- ✅ Validate document-level tenant ownership

**Protection**: Even if client or server code has bugs, database enforces tenant isolation.

---

### Layer 6: TenantFirestore Wrapper
**File**: [src/lib/TenantFirestore.ts](../src/lib/TenantFirestore.ts)
**Purpose**: Developer safety and automatic tenant_id injection

**Responsibilities**:
- ✅ Auto-inject tenant_id on all writes
- ✅ Auto-filter by tenant_id on all reads
- ✅ Verify tenant ownership before updates/deletes
- ✅ Prevent developer mistakes (forgetting tenant_id in queries)
- ✅ Add audit trail fields (created_by, created_at, updated_at, etc.)

**Protection**: Prevents common developer mistakes that could lead to cross-tenant data leaks.

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js Client Components                       │   │
│  │                                                               │   │
│  │  • Auth Forms (signup, login)                                │   │
│  │  • Client Auth Helpers (signUpWithEmail, signInWithGoogle)   │   │
│  │  • Input Validation (Zod schemas)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              │ Firebase Client SDK                    │
│                              ▼                                        │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS + httpOnly Cookies
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Server (Edge Runtime)                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 1: Middleware                       │   │
│  │                                                               │   │
│  │  • Verify JWT cookie signature                               │   │
│  │  • Extract custom claims (tenant_id, role)                   │   │
│  │  • Inject headers: x-user-id, x-tenant-id, x-user-role       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │             LAYER 2: Data Access Layer (DAL)                 │   │
│  │                                                               │   │
│  │  • Extract session from headers                              │   │
│  │  • Validate tenant ownership                                 │   │
│  │  • Enforce role-based access                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 Server Components                             │   │
│  │                                                               │   │
│  │  • Dashboard, Profile, Settings pages                        │   │
│  │  • Call DAL functions (getCurrentSession, requireAuth)       │   │
│  │  • Initialize TenantFirestore wrapper                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          LAYER 6: TenantFirestore Wrapper                    │   │
│  │                                                               │   │
│  │  • Auto-inject tenant_id on writes                           │   │
│  │  • Auto-filter by tenant_id on reads                         │   │
│  │  • Verify tenant ownership                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               │ Firebase Admin SDK / Client SDK
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FIREBASE BACKEND                             │
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────────────────────┐ │
│  │ Firebase Auth    │         │   LAYER 4: Cloud Functions        │ │
│  │                  │         │                                    │ │
│  │ • Email/Password │◄────────┤  • onUserCreate (auto tenant)     │ │
│  │ • Google OAuth   │         │  • inviteUser                     │ │
│  │ • JWT Tokens     │         │  • updateUserRole                 │ │
│  │ • Custom Claims  │         │  • Rate limiting                  │ │
│  └──────────────────┘         └──────────────────────────────────┘ │
│                                             │                        │
│                                             ▼                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         LAYER 5: Cloud Firestore + Security Rules             │  │
│  │                                                                │  │
│  │  Collections:                                                 │  │
│  │  • tenants (organization info)                                │  │
│  │  • users (profiles + tenant_id + role)                        │  │
│  │  • invitations (pending invites)                              │  │
│  │  • audit_logs (activity tracking)                             │  │
│  │  • rate_limits (security throttling)                          │  │
│  │  • [business data] (posts, comments, etc.)                    │  │
│  │                                                                │  │
│  │  Security Rules: Enforce tenant_id on EVERY query             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Communication Flow

### Signup/Login Flow
```
1. User submits credentials
   ↓
2. Client validation (Layer 3: Zod schemas)
   ↓
3. Firebase Client SDK authentication
   ↓
4. Cloud Function triggers (Layer 4: onUserCreate)
   - Creates tenant (if new user)
   - Sets custom claims (tenant_id, role)
   ↓
5. Client waits for custom claims (polling, up to 30s)
   ↓
6. Client sends ID token to /api/login
   ↓
7. Server sets httpOnly cookie with signed JWT
   ↓
8. Redirect to /dashboard
```

### Protected Page Access Flow
```
1. User navigates to /dashboard
   ↓
2. Middleware intercepts (Layer 1)
   - Verifies JWT cookie
   - Validates custom claims
   - Injects headers (x-user-id, x-tenant-id, x-user-role)
   ↓
3. Server Component loads
   ↓
4. DAL extracts session (Layer 2)
   - Reads headers from middleware
   - Validates tenant_id and role
   ↓
5. Component initializes TenantFirestore (Layer 6)
   ↓
6. Database query with auto tenant_id filtering
   ↓
7. Firestore Rules validate (Layer 5)
   - Check request.auth.token.tenant_id
   - Check resource.data.tenant_id
   ↓
8. Data returned to component
```

### Cloud Function Flow
```
1. Client calls Cloud Function (e.g., inviteUser)
   ↓
2. Function validates auth context
   - Check context.auth exists
   - Check context.auth.token.tenant_id
   - Check context.auth.token.role
   ↓
3. Function performs privileged operation
   - Create invitation document
   - Update custom claims
   - Write to Firestore
   ↓
4. Firestore Rules validate writes (Layer 5)
   ↓
5. Response returned to client
```

---

## Multi-Tenancy Model

### Logical Separation (Not Physical)
- **Single Firebase Project** shared by all tenants
- **tenant_id field** on every document for isolation
- **Custom Claims** in JWT tokens for context
- **Security Rules** enforce per-request validation

### Why Logical Multi-Tenancy?

| Approach | Cost | Scalability | Maintenance | Security |
|----------|------|-------------|-------------|----------|
| **Logical (Our Choice)** | $ | Excellent | Easy | Very High |
| Physical (per-tenant projects) | $$$ | Complex | Hard | Very High |
| Hybrid | $$ | Moderate | Moderate | Very High |

### Tenant Isolation Guarantees

1. **Every document has tenant_id** - Uniform validation across all collections
2. **JWT custom claims** - Server validates on every request
3. **Firestore Rules double-check** - Database enforces even if server fails
4. **TenantFirestore wrapper** - Prevents developer mistakes
5. **Cloud Functions audit** - Immutable activity log

---

## Data Flow Patterns

### Create Operation
```typescript
// Client → Server Component → TenantFirestore → Firestore

const session = await getCurrentSession(); // Layer 2: DAL
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id); // Layer 6

await tenantDB.create('posts', {
  title: 'Hello World',
  content: 'This is a post'
});

// TenantFirestore automatically adds:
// - tenant_id: session.tenant_id
// - created_by: session.user_id
// - created_at: serverTimestamp()
// - updated_at: serverTimestamp()
```

### Query Operation
```typescript
// Client → Server Component → TenantFirestore → Firestore

const posts = await tenantDB.query('posts', [
  { field: 'status', op: '==', value: 'published' }
]);

// TenantFirestore automatically adds:
// - where('tenant_id', '==', session.tenant_id)
//
// Firestore Rules verify:
// - request.auth.token.tenant_id == resource.data.tenant_id
```

### Update Operation
```typescript
// Client → Server Component → TenantFirestore → Firestore

await tenantDB.update('posts', postId, {
  title: 'Updated Title'
});

// TenantFirestore:
// 1. Verifies tenant ownership (getById check)
// 2. Prevents tenant_id tampering (removes from update data)
// 3. Adds updated_at and updated_by fields
//
// Firestore Rules verify:
// - request.auth.token.tenant_id == resource.data.tenant_id
// - request.resource.data.tenant_id == resource.data.tenant_id (immutable)
```

---

## Key Architecture Decisions

### Why httpOnly Cookies Instead of localStorage?
- ✅ XSS protection (JavaScript cannot access)
- ✅ Automatic CSRF protection with SameSite
- ✅ Server-side verification possible
- ❌ Client-side JavaScript cannot read token (by design)

### Why Custom Claims Instead of Database Roles?
- ✅ Available in JWT token (no database lookup)
- ✅ Firestore Rules can access token.tenant_id
- ✅ Faster authorization (no extra round-trip)
- ❌ 5-10 second delay after role changes (requires token refresh)

### Why TenantFirestore Wrapper Instead of Raw SDK?
- ✅ Prevents common developer mistakes
- ✅ Consistent audit trail across all operations
- ✅ Automatic tenant_id injection (can't forget)
- ✅ Type-safe operations with TypeScript

### Why 6 Layers Instead of 3?
- ✅ Defense-in-depth: Multiple redundant checks
- ✅ If one layer fails, others still protect
- ✅ Separation of concerns (authentication ≠ authorization ≠ validation)
- ✅ Easier to debug (each layer has clear responsibility)

---

## Scalability Considerations

### Current Limits
- **Firebase Authentication**: 50,000 MAU free tier
- **Firestore**: 1 million document reads/day free
- **Cloud Functions**: 2 million invocations/month free
- **Storage**: 5 GB free

### Production Scaling
- ✅ Handles 1,000+ tenants in single project
- ✅ Firebase auto-scales with load
- ✅ Composite indexes required for tenant_id queries
- ✅ Rate limiting prevents abuse

### Cost at Scale
- **1,000 users**: ~$2/month
- **10,000 users**: ~$20/month
- **100,000 users**: ~$200/month
- **Cost per user**: $0.002/month

---

## Security Guarantees

### What This Architecture Prevents

1. **Cross-Tenant Data Leaks** - Every layer validates tenant_id independently
2. **Privilege Escalation** - Only Cloud Functions can change roles
3. **Unauthenticated Access** - Middleware blocks at edge
4. **CSRF Attacks** - httpOnly cookies + SameSite flag
5. **XSS Token Theft** - Tokens never in localStorage
6. **Rate Limit Bypass** - Enforced server-side in Cloud Functions

### What This Architecture Does NOT Prevent

1. **GDPR Compliance** - Firebase Auth stores data in US (use SCCs)
2. **DDoS Attacks** - Requires external WAF/CDN
3. **Compromised Firebase Admin SDK Keys** - Rotate keys, monitor logs
4. **Social Engineering** - User training required

---

## Next Steps

- [Security Layers Deep Dive](./security-layers.md) - Detailed explanation of each layer
- [Authentication Flow](./authentication-flow.md) - User flows and token management
- [API Reference](./api-reference.md) - DAL, Cloud Functions, TenantFirestore APIs
- [Database Schema](./database-schema.md) - Schema requirements and patterns
