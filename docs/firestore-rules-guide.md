# Firestore Security Rules - Multi-Tenant Guide

## 🎯 Purpose
Database-level security to prevent cross-tenant data access

---

## 🔑 Core Security Pattern

### Helper Functions (Define Once, Use Everywhere)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Get user's tenant_id from token
    function getTenantId() {
      return request.auth.token.tenant_id;
    }
    
    // Helper: Check if user is tenant admin
    function isTenantAdmin() {
      return request.auth.token.role == 'tenant_admin';
    }
    
    // Helper: Verify document belongs to user's tenant
    function belongsToTenant(tenant_id) {
      return tenant_id == getTenantId();
    }
  }
}
```

**Why Helper Functions:**
- ✅ Write once, reuse everywhere
- ✅ Consistent security checks
- ✅ Easier to update rules
- ✅ Less chance of mistakes

---

## 📚 Collection Rules

### 1. Users Collection
**Security Goal:** Users only see users in their tenant

```javascript
match /users/{userId} {
  // Read: Only if same tenant
  allow read: if isAuthenticated() 
    && belongsToTenant(resource.data.tenant_id);
  
  // Create: Only during signup (handled by Cloud Function)
  allow create: if false; // Block client-side creates
  
  // Update: Only own profile OR tenant admin
  allow update: if isAuthenticated() 
    && (request.auth.uid == userId || isTenantAdmin())
    && belongsToTenant(resource.data.tenant_id)
    && request.resource.data.tenant_id == resource.data.tenant_id; // Can't change tenant
}
```

**Critical Rules:**
- ✅ ALWAYS check tenant_id on resource (existing data)
- ✅ ALWAYS check tenant_id on request.resource (new data)
- ✅ NEVER allow changing tenant_id
- ✅ Block direct client creates (use Cloud Functions)

---

### 2. Tenants Collection
**Security Goal:** Only tenant members can read tenant info

```javascript
match /tenants/{tenantId} {
  // Read: Only if user belongs to this tenant
  allow read: if isAuthenticated() 
    && getTenantId() == tenantId;
  
  // Update: Only tenant_admin
  allow update: if isAuthenticated() 
    && isTenantAdmin()
    && getTenantId() == tenantId
    && request.resource.data.created_by == resource.data.created_by; // Can't change creator
  
  // Create/Delete: Blocked (Cloud Functions only)
  allow create, delete: if false;
}
```

**Critical Rules:**
- ✅ Match tenantId with user's token tenant_id
- ✅ Only admins can update settings
- ✅ Protect immutable fields (created_by, created_at)

---

### 3. Business Data Collections (Posts, Tasks, etc.)
**Security Goal:** Complete tenant isolation

```javascript
match /posts/{postId} {
  // Read: Same tenant only
  allow read: if isAuthenticated() 
    && belongsToTenant(resource.data.tenant_id);
  
  // Create: Must add tenant_id
  allow create: if isAuthenticated() 
    && request.resource.data.tenant_id == getTenantId()
    && request.resource.data.created_by == request.auth.uid;
  
  // Update: Same tenant + creator OR admin
  allow update: if isAuthenticated() 
    && belongsToTenant(resource.data.tenant_id)
    && belongsToTenant(request.resource.data.tenant_id) // Can't change tenant
    && (resource.data.created_by == request.auth.uid || isTenantAdmin());
  
  // Delete: Creator OR admin
  allow delete: if isAuthenticated() 
    && belongsToTenant(resource.data.tenant_id)
    && (resource.data.created_by == request.auth.uid || isTenantAdmin());
}
```

**Critical Rules:**
- ✅ Check tenant_id on BOTH read and write
- ✅ Auto-inject tenant_id matches user's tenant
- ✅ Prevent tenant_id changes in updates
- ✅ Add created_by for ownership tracking

---

### 4. Invitations Collection
**Security Goal:** Secure invitation workflow

```javascript
match /invitations/{inviteId} {
  // Read: Tenant admins OR invited user (by email)
  allow read: if isAuthenticated() 
    && (isTenantAdmin() && belongsToTenant(resource.data.tenant_id))
    || request.auth.token.email == resource.data.email;
  
  // Create: Only tenant_admin
  allow create: if isAuthenticated() 
    && isTenantAdmin()
    && request.resource.data.tenant_id == getTenantId();
  
  // Update: Only Cloud Functions (mark as accepted)
  allow update: if false;
  
  // Delete: Only tenant_admin or expired
  allow delete: if isAuthenticated() 
    && isTenantAdmin()
    && belongsToTenant(resource.data.tenant_id);
}
```

**Critical Rules:**
- ✅ Invited users can see their invitation
- ✅ Only admins can create/delete invitations
- ✅ Status updates handled by Cloud Functions only

---

## ⚠️ Collection Group Query Protection

**Problem:** Collection group queries bypass normal path-based rules

```javascript
// BAD: This queries across ALL tenants!
db.collectionGroup('comments').get();

// GOOD: Always filter by tenant_id
db.collectionGroup('comments')
  .where('tenant_id', '==', userTenantId)
  .get();
```

**Rule Pattern for Collection Groups:**
```javascript
match /{path=**}/comments/{commentId} {
  allow read: if isAuthenticated() 
    && belongsToTenant(resource.data.tenant_id);
}
```

**Critical Rules:**
- ✅ ALWAYS include tenant_id in collection group queries
- ✅ Use `{path=**}` pattern for collection groups
- ✅ Still validate tenant_id in rules
- ❌ NEVER assume client will filter correctly

---

## 🛡️ Security Best Practices

### 1. **Defense in Depth**
```
Layer 1: Firestore Rules (database level)
Layer 2: Cloud Functions (business logic)
Layer 3: Client Wrapper (prevent mistakes)
```

### 2. **Immutable Field Protection**
```javascript
// Prevent changing critical fields
request.resource.data.tenant_id == resource.data.tenant_id
request.resource.data.created_by == resource.data.created_by
request.resource.data.created_at == resource.data.created_at
```

### 3. **Read vs Write Separation**
```javascript
// Different rules for read vs write
allow read: if [simple check];
allow create: if [strict validation];
allow update: if [ownership + validation];
allow delete: if [admin or owner];
```

---

## 📊 Rules Testing

### Test in Firebase Console
```javascript
// Go to: Firestore → Rules → Simulator
// Test scenarios:
1. User reads their tenant data → ✅ Allow
2. User reads different tenant data → ❌ Deny
3. User updates with wrong tenant_id → ❌ Deny
4. Admin deletes user's data → ✅ Allow
5. Regular user deletes admin data → ❌ Deny
```

### Required Test Cases
- ✅ Cross-tenant read attempt
- ✅ Tenant_id change attempt
- ✅ Admin vs user permissions
- ✅ Unauthenticated access
- ✅ Collection group query filtering

---

## ⚠️ Common Mistakes to Avoid

1. **Checking only request data** → Bypass by omitting tenant_id
2. **Forgetting collection groups** → Cross-tenant leaks
3. **Complex rules** → Performance issues (10 doc read limit)
4. **Not testing rules** → Deploy broken security
5. **Allowing client creates** → Bypass Cloud Function validation

---

## 📈 Performance Impact

| Rule Complexity | Read Cost | Impact |
|----------------|-----------|--------|
| Simple tenant check | 0 extra reads | ✅ Recommended |
| With get() lookup | 1 extra read | ⚠️ Use sparingly |
| Multiple get() calls | 2+ extra reads | ❌ Avoid |

**Limit:** Max 10 document reads per rule evaluation

---

## 🚀 Deployment

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Test before deploy
firebase emulators:start --only firestore

# Rollback if needed
# (Go to Firebase Console → Firestore → Rules → View history)
```

**Best Practice:** Always test in emulator before production deploy!