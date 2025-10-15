# Product Requirements Document
## Secure Multi-Tenant Authentication System for SaaS MVP

**Version:** 1.0  
**Last Updated:** October 2025  
**Status:** Ready for Implementation

---

## 📋 **Executive Summary**

### **What We're Building**
A production-ready, secure multi-tenant authentication system for a Next.js SaaS application using Firebase as the backend. This system enables multiple organizations (tenants) to use a single application instance while maintaining complete data isolation and security.

### **Key Architecture Decision**
**Single Firebase Project + Logical Multi-Tenancy** using custom claims and Firestore tenant_id fields. This is the industry-standard approach used by companies like Slack, Notion, and Asana.

### **Core Capabilities**
- ✅ User signup with automatic tenant creation
- ✅ Email/Password + Google OAuth authentication
- ✅ Invitation-based user onboarding
- ✅ Role-based access control (tenant_admin, user)
- ✅ Complete tenant data isolation
- ✅ Rate limiting and security protection
- ✅ GDPR-ready (with future enhancements)

### **Technology Stack**
- **Frontend:** Next.js (App Router) with React
- **Backend:** Firebase Cloud Functions (Node.js)
- **Database:** Cloud Firestore
- **Authentication:** Firebase Authentication
- **Storage:** Cloud Storage (for exports)
- **Packages:** Official Firebase SDKs only

---

## ✅ **RE-VALIDATED: What's Good About This Architecture**

### **Why Single Project Multi-Tenancy is CORRECT**

| Decision | Why It's Right | Industry Validation |
|----------|---------------|---------------------|
| **Single Firebase Project** | Standard SaaS pattern | Used by Slack, Notion, Asana |
| **Custom Claims for tenant_id** | Built-in Firebase feature | Official Firebase recommendation |
| **Logical isolation (not physical)** | Cost-effective, scalable | Industry best practice |
| **Firestore + Security Rules** | Database-level protection | Zero-trust security model |
| **NOT using Identity Platform** | Saves cost, sufficient for MVP | Custom claims work perfectly |

### **What This Architecture Gets Right**

**Security (Three-Layer Defense):**
1. **Cloud Functions** - Server-side validation (privileged)
2. **Firestore Rules** - Database-level enforcement
3. **Client Wrapper** - Prevents developer mistakes

**Scalability:**
- ✅ Handles 1,000+ tenants in single project
- ✅ No per-tenant infrastructure needed
- ✅ Firebase auto-scales with load
- ✅ Minimal operational overhead

**Cost Efficiency:**
- ✅ Single project = single billing
- ✅ Shared infrastructure costs
- ✅ No per-tenant servers
- ✅ Pay only for usage

**Developer Experience:**
- ✅ Centralized codebase
- ✅ Single deployment pipeline
- ✅ Consistent security patterns
- ✅ Easy to maintain

### **Known Limitations (Managed, Not Blockers)**

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **GDPR (US-only auth)** | EU compliance risk | Use SCCs, wait for EU regions (Q4 2025) |
| **Manual tenant isolation** | Developer discipline needed | Wrapper library prevents mistakes |
| **No automatic filtering** | Must add tenant_id to queries | Enforced by wrapper + rules |
| **Custom claims delay** | 5-10 second lag on role changes | Force token refresh on client |

**Bottom Line:** Architecture is 90% production-ready. Known issues have clear solutions.

---

## 🏗️ **System Architecture Overview**

### **Component Map**
```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Next.js Application (Frontend)              │   │
│  │                                                      │   │
│  │  • TenantAuthProvider (Context)                     │   │
│  │  • useTenantAuth Hook                               │   │
│  │  • ProtectedRoute Components                        │   │
│  │  • TenantFirestore Wrapper                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ Firebase SDK
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     FIREBASE BACKEND                         │
│                                                               │
│  ┌────────────────────┐    ┌────────────────────────────┐  │
│  │ Firebase Auth      │    │   Cloud Functions          │  │
│  │                    │    │                            │  │
│  │ • Email/Password   │◄───┤ • onUserCreate             │  │
│  │ • Google OAuth     │    │ • inviteUser               │  │
│  │ • Custom Claims    │    │ • updateUserRole           │  │
│  │ • Token Management │    │ • Rate Limiting            │  │
│  └────────────────────┘    └────────────────────────────┘  │
│                                        │                     │
│                                        ▼                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cloud Firestore                          │  │
│  │                                                       │  │
│  │  Collections:                                        │  │
│  │  • tenants (tenant info)                            │  │
│  │  • users (user profiles + tenant_id)                │  │
│  │  • invitations (pending invites)                    │  │
│  │  • audit_logs (activity tracking)                   │  │
│  │  • rate_limits (security)                           │  │
│  │  • posts, comments, etc. (business data)            │  │
│  │                                                       │  │
│  │  Security Rules: Enforce tenant_id on every query   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 📦 **Artifact Dependency Map**

### **7 Artifacts Build the Complete System:**

```
Artifact 5: Database Schema (START HERE)
    │
    ├─► Artifact 2: Firestore Security Rules
    │       │
    │       └─► Protects collections defined in schema
    │
    ├─► Artifact 1: Cloud Functions
    │       │
    │       ├─► Uses schema structure
    │       ├─► Sets custom claims
    │       └─► Enforces business logic
    │
    └─► Artifact 4: Database Wrapper
            │
            ├─► Reads/writes to schema
            ├─► Auto-injects tenant_id
            └─► Used by Artifact 3
                    │
                    └─► Artifact 3: Client Auth Service
                            │
                            ├─► Manages user context
                            └─► Provides auth to UI

Artifact 7: Rate Limiting (APPLIES TO ALL)
    │
    └─► Protects Cloud Functions from abuse

Artifact 6: Future Enhancements (POST-MVP)
    │
    └─► GDPR compliance features
```

### **Implementation Order**
1. **Database Schema** (Artifact 5) - Foundation
2. **Security Rules** (Artifact 2) - Database protection
3. **Cloud Functions** (Artifact 1) - Server logic
4. **Rate Limiting** (Artifact 7) - Security layer
5. **Database Wrapper** (Artifact 4) - Safety net
6. **Client Service** (Artifact 3) - Frontend integration
7. **Future Features** (Artifact 6) - Post-launch

---

## 🔒 **Security Model**

### **Defense-in-Depth Strategy**

**Layer 1: Cloud Functions (Privileged Server)**
```
✓ Verify authentication token
✓ Check custom claims (tenant_id, role)
✓ Validate business logic
✓ Rate limit enforcement
✓ Set custom claims (only place allowed)
```

**Layer 2: Firestore Security Rules (Database)**
```
✓ Check request.auth.token.tenant_id
✓ Validate resource.data.tenant_id
✓ Enforce role-based permissions
✓ Prevent tenant_id changes
✓ Block unauthorized reads/writes
```

**Layer 3: Client Wrapper (Developer Safety)**
```
✓ Auto-inject tenant_id on writes
✓ Auto-filter tenant_id on reads
✓ Prevent forgetting security checks
✓ Consistent API across app
✓ Type-safe operations
```

### **Security Guarantee**
Even if developer forgets to add tenant_id in client code:
- ✅ Firestore rules still enforce isolation
- ✅ Cloud Functions validate all operations
- ✅ Database wrapper adds tenant_id automatically

**Result:** Multiple redundant security layers = Defense in depth

---

## 👥 **User Flows**

### **Flow 1: New User Signup (Creates Tenant)**
```
1. User visits signup page
2. Enters email + password
3. Firebase creates user account
   ↓
4. Cloud Function (onUserCreate) triggers
   - Checks for pending invitation → None found
   - Generates new tenant_id
   - Creates tenant document
   - Sets custom claims: { tenant_id, role: 'tenant_admin' }
   - Creates user profile document
   ↓
5. Client polls for custom claims (5-10 seconds)
6. Redirects to dashboard as tenant admin
```

### **Flow 2: Invited User Joins Tenant**
```
1. Admin sends invitation via inviteUser()
   - Cloud Function creates invitation record
   - Email sent to invited user (future: email integration)
   ↓
2. Invited user signs up with same email
3. Cloud Function (onUserCreate) triggers
   - Checks for pending invitation → Found!
   - Extracts tenant_id from invitation
   - Sets role from invitation
   - Marks invitation as 'accepted'
   - Sets custom claims: { tenant_id, role: 'user' }
   ↓
4. User joins existing tenant
5. Redirects to dashboard as regular user
```

### **Flow 3: Admin Changes User Role**
```
1. Admin clicks "Make Admin" on user
2. Client calls updateUserRole(user_id, 'tenant_admin')
   ↓
3. Cloud Function validates:
   - Caller is tenant_admin ✓
   - Target user in same tenant ✓
   - Not changing own role ✓
   ↓
4. Updates custom claims on target user
5. Updates Firestore user document
6. Target user forced to refresh token
7. New role takes effect immediately
```

### **Flow 4: User Performs Action (Normal Operation)**
```
1. User creates a post
2. Client: tenantDB.create('posts', { title, content })
   ↓
3. Wrapper auto-adds:
   - tenant_id (from user context)
   - created_by (user_id)
   - timestamps
   ↓
4. Firestore rules verify:
   - request.auth.token.tenant_id matches data.tenant_id ✓
   - User is authenticated ✓
   ↓
5. Document saved
6. Audit log created (if enabled)
```

---

## 🎯 **Implementation Roadmap**

### **Phase 1: Foundation (Week 1)**
**Goal:** Set up infrastructure

- [ ] Create Firebase project
- [ ] Configure Next.js with Firebase SDK
- [ ] Deploy database schema (Artifact 5)
- [ ] Deploy Firestore security rules (Artifact 2)
- [ ] Create composite indexes
- [ ] Set up environment variables

**Validation:**
- Can connect to Firebase from Next.js
- Security rules simulator passes tests
- Indexes created successfully

---

### **Phase 2: Server Logic (Week 2)**
**Goal:** Implement Cloud Functions

- [ ] Deploy onUserCreate function (Artifact 1)
- [ ] Deploy inviteUser function
- [ ] Deploy updateUserRole function
- [ ] Implement rate limiting (Artifact 7)
- [ ] Add error handling & logging
- [ ] Test functions in emulator

**Validation:**
- New user creates tenant automatically
- Invitation flow works end-to-end
- Role changes reflect correctly
- Rate limits enforce properly

---

### **Phase 3: Client Integration (Week 3)**
**Goal:** Build frontend auth

- [ ] Create TenantAuthProvider (Artifact 3)
- [ ] Implement useTenantAuth hook
- [ ] Build ProtectedRoute component
- [ ] Create TenantFirestore wrapper (Artifact 4)
- [ ] Integrate with UI components
- [ ] Add loading & error states

**Validation:**
- Users can sign up/sign in
- Auth state persists across refreshes
- Protected routes work correctly
- Database operations use wrapper

---

### **Phase 4: Testing & Refinement (Week 4)**
**Goal:** Ensure quality

- [ ] Write unit tests for Cloud Functions
- [ ] Test Firestore rules thoroughly
- [ ] End-to-end testing (signup → dashboard)
- [ ] Security testing (cross-tenant access attempts)
- [ ] Performance testing (query speeds)
- [ ] Load testing (concurrent users)

**Validation:**
- All tests pass
- No cross-tenant data leaks
- Performance meets targets
- Security audit clean

---

### **Phase 5: Production Launch (Week 5)**
**Goal:** Go live safely

- [ ] Production Firebase project setup
- [ ] Deploy all artifacts to production
- [ ] Configure monitoring & alerts
- [ ] Set up backup strategy
- [ ] Publish privacy policy
- [ ] Create user documentation
- [ ] Soft launch (limited users)
- [ ] Monitor for issues
- [ ] Full public launch

**Validation:**
- Production environment stable
- No security incidents
- User feedback positive
- System performing as expected

---

### **Phase 6: Post-MVP Enhancements (Ongoing)**
**Goal:** Add compliance features

- [ ] Implement scheduled hard delete (Artifact 6)
- [ ] Add GDPR data export function
- [ ] Enhanced audit logging
- [ ] Admin analytics dashboard
- [ ] Email integration (SendGrid/SMTP)
- [ ] 2FA/MFA (optional security)

---

## 📊 **Success Criteria**

### **Security Metrics**
- ✅ Zero cross-tenant data access incidents
- ✅ All security rules tests passing
- ✅ Rate limiting blocks >99% of abuse attempts
- ✅ No unauthorized role escalations

### **Performance Metrics**
- ✅ Authentication: < 2 seconds (signup to dashboard)
- ✅ Database queries: < 500ms (95th percentile)
- ✅ Cloud Functions: < 1 second execution
- ✅ Token refresh: < 100ms

### **Reliability Metrics**
- ✅ 99.9% uptime (Firebase SLA)
- ✅ Zero data loss incidents
- ✅ Successful backup/restore tested
- ✅ Error rate < 0.1% of requests

### **User Experience Metrics**
- ✅ Signup completion rate > 80%
- ✅ Invitation acceptance rate > 60%
- ✅ User satisfaction > 4/5 stars
- ✅ Support tickets < 5% of users

---

## 💰 **Cost Projection**

### **Firebase Costs (Estimated for 1,000 Active Users)**

**Authentication:**
- 50,000 MAU free tier
- 1,000 users = FREE ✅

**Firestore:**
- Reads: ~10M/month = $0.36
- Writes: ~2M/month = $0.18
- Storage: ~5GB = $1.00
- **Total: ~$1.54/month**

**Cloud Functions:**
- Invocations: ~100K/month = FREE (2M free)
- Compute time: ~10K GB-seconds = FREE (400K free)
- **Total: FREE ✅**

**Cloud Storage (exports):**
- Minimal usage (< 1GB)
- **Total: < $0.10/month**

**Grand Total: ~$2/month for 1,000 users** 💰
**Cost per user: $0.002/month**

### **Scaling Costs (10,000 Users)**
- Authentication: FREE (under 50K)
- Firestore: ~$15/month
- Functions: ~$5/month
- **Total: ~$20/month = $0.002/user**

**Result: Extremely cost-effective** ✅

---

## ⚠️ **Risk Assessment & Mitigation**

### **Risk 1: GDPR Compliance (Medium)**
**Issue:** Firebase Auth stores data in US only
**Impact:** Cannot claim full EU compliance
**Mitigation:**
- Use Standard Contractual Clauses
- Clear privacy policy disclosure
- Plan migration to EU regions (Q4 2025)
- Implement data export/deletion tools

### **Risk 2: Developer Mistakes (Low)**
**Issue:** Forgetting to add tenant_id in queries
**Impact:** Potential cross-tenant data leak
**Mitigation:**
- Mandatory wrapper library usage
- Firestore rules as safety net
- Code review checklist
- Automated testing

### **Risk 3: Rate Limit Bypass (Low)**
**Issue:** Sophisticated attackers finding workarounds
**Impact:** Service degradation or abuse
**Mitigation:**
- Multiple rate limit keys (IP + user)
- Monitoring and alerts
- Manual intervention capability
- Exponential backoff

### **Risk 4: Token Refresh Lag (Very Low)**
**Issue:** Role changes take 5-10 seconds
**Impact:** Brief permission mismatch
**Mitigation:**
- Force token refresh on role change
- Show "updating..." state in UI
- Server-side validation as backup
- Acceptable for MVP

---

## 📚 **Documentation Structure**

### **For Developers:**
1. Quick Start Guide (this PRD)
2. Artifact 1: Cloud Functions API
3. Artifact 2: Security Rules Reference
4. Artifact 3: Client SDK Guide
5. Artifact 4: Database Wrapper API
6. Artifact 7: Rate Limiting Config

### **For Users:**
1. User Signup Guide
2. Admin Dashboard Manual
3. Invitation Workflow
4. Privacy Policy
5. Terms of Service

---

## ✅ **Final Validation Checklist**

**Before Production Deploy:**
- [ ] All 7 artifacts reviewed & understood
- [ ] Firebase project created & configured
- [ ] Environment variables set correctly
- [ ] Security rules deployed & tested
- [ ] Cloud Functions deployed & working
- [ ] Client app connects successfully
- [ ] Rate limiting functional
- [ ] Monitoring/logging enabled
- [ ] Backup strategy implemented
- [ ] Privacy policy published
- [ ] User documentation complete
- [ ] Team trained on system
- [ ] Incident response plan ready

**This PRD is your complete implementation guide. Follow the roadmap, reference the artifacts, and build with confidence.** 🚀