# Backend Auth System - Cloud Functions Guide

## 🎯 Purpose
Server-side authentication logic with automatic tenant management

---

## 📋 Required Functions

### 1. **onUserCreate Trigger**
**When:** User signs up (Email/Password or Google OAuth)
**Purpose:** Auto-assign tenant_id and role

**Key Logic:**
```javascript
// Check if user was invited
const invite = await db.collection('invitations')
  .where('email', '==', email)
  .where('status', '==', 'pending').get();

if (invite exists) {
  // Join existing tenant from invitation
} else {
  // Create NEW tenant, make user tenant_admin
}

// Set custom claims
await admin.auth().setCustomUserClaims(uid, {
  tenant_id: tenant_id,
  role: role
});
```

**Critical Rules:**
- ✅ ALWAYS check invitations first
- ✅ First user in tenant = `tenant_admin` role
- ✅ Create tenant document in Firestore
- ✅ Create user profile with tenant_id
- ❌ NEVER let user choose their own tenant_id

**Impact:** Every user automatically gets tenant assignment - no orphaned users

---

### 2. **inviteUser (Callable)**
**Who can call:** Only `tenant_admin` users
**Purpose:** Add users to existing tenant

**Key Logic:**
```javascript
// Verify caller is tenant_admin
if (context.auth.token.role !== 'tenant_admin') {
  throw error;
}

// Create invitation record
await db.collection('invitations').add({
  tenant_id: context.auth.token.tenant_id,
  email: email,
  role: role,
  status: 'pending',
  expires_at: 7 days from now
});
```

**Critical Rules:**
- ✅ Validate caller has `tenant_admin` role
- ✅ Check email not already in tenant
- ✅ Set expiration (7 days recommended)
- ✅ Track who invited (invited_by field)
- ❌ NEVER allow inviting to different tenant

**Impact:** Controlled tenant access - only admins can add users

---

### 3. **updateUserRole (Callable)**
**Who can call:** Only `tenant_admin` users
**Purpose:** Change user roles within tenant

**Key Logic:**
```javascript
// Get target user
const targetUser = await admin.auth().getUser(user_id);

// Verify same tenant
if (targetUser.customClaims.tenant_id !== caller.tenant_id) {
  throw error;
}

// Update custom claims
await admin.auth().setCustomUserClaims(user_id, {
  ...targetUser.customClaims,
  role: new_role
});

// Update Firestore
await db.collection('users').doc(user_id).update({ role: new_role });
```

**Critical Rules:**
- ✅ Verify target user in same tenant
- ✅ Update BOTH custom claims AND Firestore
- ✅ Don't allow changing own role (prevent lockout)
- ✅ Log role changes for audit
- ❌ NEVER allow cross-tenant role changes

**Impact:** Role-based access control enforced server-side

---

### 4. **deleteUserFromTenant (Callable)**
**Who can call:** Only `tenant_admin` users
**Purpose:** Remove user from tenant (soft delete)

**Key Logic:**
```javascript
// Soft delete - don't actually delete user
await db.collection('users').doc(user_id).update({
  status: 'deleted',
  deleted_at: serverTimestamp(),
  deleted_by: caller_uid
});

// Remove custom claims
await admin.auth().setCustomUserClaims(user_id, null);
```

**Critical Rules:**
- ✅ Use soft delete (keep audit trail)
- ✅ Don't allow admin to delete themselves
- ✅ 30-day retention before hard delete
- ✅ Revoke custom claims immediately

**Impact:** GDPR compliant user deletion with audit trail

---

## 🛡️ Security Best Practices

### Token Refresh
**Problem:** Custom claims don't update immediately
**Solution:** 
```javascript
// Client-side - force token refresh after role change
await user.getIdToken(true); // true = force refresh
```

### Validation Pattern
**ALWAYS validate in this order:**
1. Check authentication exists
2. Verify tenant_id in token
3. Check role permissions
4. Validate input data
5. Check business logic (quotas, limits)

### Error Handling
```javascript
// Use proper HttpsError codes
throw new functions.https.HttpsError(
  'permission-denied', // or 'unauthenticated', 'invalid-argument'
  'User-friendly message'
);
```

---

## 📊 Impact Summary

| Function | Security Impact | User Experience |
|----------|----------------|-----------------|
| onUserCreate | Auto-tenant assignment | Seamless onboarding |
| inviteUser | Controlled access | Admin manages team |
| updateUserRole | RBAC enforcement | Flexible permissions |
| deleteUser | Audit compliance | GDPR compliant |

---

## ⚠️ Common Mistakes to Avoid

1. **Forgetting token refresh** → Users see stale roles for 1 hour
2. **Not checking invitations** → Duplicate tenants created
3. **Trusting client data** → Security bypass possible
4. **Synchronous claims update** → Race conditions in rules
5. **No audit logging** → Can't track who did what

---

## 📦 Required NPM Packages
```json
{
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^5.0.0"
}
```

## 🚀 Deployment Command
```bash
firebase deploy --only functions
```