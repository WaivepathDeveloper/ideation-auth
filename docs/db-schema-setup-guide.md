# Database Schema & Setup Guide

## 🎯 Purpose
Optimized Firestore structure for multi-tenant SaaS

---

## 📊 Collection Structure

### 1. **tenants** (Top Level)
```
tenants/{tenant_id}
  ├── name: string
  ├── created_by: string (user_id)
  ├── created_at: timestamp
  ├── updated_at: timestamp
  ├── status: 'active' | 'suspended' | 'deleted'
  ├── settings: {
  │     max_users: number (default: 50)
  │     features: array ['basic', 'advanced']
  │     subscription_plan: string
  │     billing_email: string
  │   }
  └── metadata: {
        industry: string
        company_size: string
      }
```

**Indexes Required:**
```
- status + created_at (DESC)
```

**Why this structure:**
- ✅ Tenant-level settings in one place
- ✅ Easy to query by status
- ✅ Scalable settings object
- ✅ Soft delete via status field

---

### 2. **users** (Top Level)
```
users/{user_id}
  ├── tenant_id: string ⚠️ CRITICAL
  ├── email: string
  ├── display_name: string
  ├── role: 'tenant_admin' | 'user' | 'viewer'
  ├── status: 'active' | 'invited' | 'deleted'
  ├── created_at: timestamp
  ├── updated_at: timestamp
  ├── last_login: timestamp
  ├── profile: {
  │     avatar_url: string
  │     phone: string
  │     timezone: string
  │   }
  └── preferences: {
        notifications: boolean
        language: string
      }
```

**Indexes Required:**
```
- tenant_id + created_at (DESC)
- tenant_id + role
- tenant_id + status
- tenant_id + email (for quick lookup)
```

**Why this structure:**
- ✅ tenant_id for isolation
- ✅ Separate profile/preferences
- ✅ Last login tracking
- ✅ Role-based access

**Critical Rule:** EVERY user document MUST have tenant_id

---

### 3. **invitations** (Top Level)
```
invitations/{invitation_id}
  ├── tenant_id: string ⚠️ CRITICAL
  ├── email: string
  ├── role: string (role to assign)
  ├── invited_by: string (user_id)
  ├── invited_at: timestamp
  ├── status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  ├── accepted_at: timestamp (nullable)
  ├── expires_at: timestamp
  └── user_id: string (set when accepted)
```

**Indexes Required:**
```
- tenant_id + status
- email + status
- expires_at (for cleanup jobs)
```

**Why this structure:**
- ✅ Track invitation lifecycle
- ✅ Prevent duplicate invites
- ✅ Audit trail
- ✅ Auto-expire old invites

---

### 4. **audit_logs** (Top Level)
```
audit_logs/{log_id}
  ├── tenant_id: string ⚠️ CRITICAL
  ├── user_id: string
  ├── action: string ('CREATE' | 'UPDATE' | 'DELETE' | 'READ')
  ├── collection: string
  ├── document_id: string
  ├── timestamp: timestamp
  ├── ip_address: string (optional)
  ├── user_agent: string (optional)
  └── changes: object (before/after values)
```

**Indexes Required:**
```
- tenant_id + timestamp (DESC)
- tenant_id + user_id + timestamp (DESC)
- tenant_id + action + timestamp (DESC)
```

**Why this structure:**
- ✅ Compliance requirement
- ✅ Security monitoring
- ✅ Debug issues
- ✅ User activity tracking

**Best Practice:** Auto-delete logs older than 90 days (GDPR)

---

### 5. **Business Collections** (Example: posts)
```
posts/{post_id}
  ├── tenant_id: string ⚠️ CRITICAL
  ├── title: string
  ├── content: string
  ├── status: 'draft' | 'published' | 'archived'
  ├── created_by: string (user_id)
  ├── created_at: timestamp
  ├── updated_by: string (user_id)
  ├── updated_at: timestamp
  ├── deleted: boolean (soft delete)
  ├── deleted_by: string (nullable)
  └── deleted_at: timestamp (nullable)
```

**Indexes Required:**
```
- tenant_id + status + created_at (DESC)
- tenant_id + created_by + created_at (DESC)
- tenant_id + deleted (for filtering out deleted)
```

**Pattern to follow for ALL business collections:**
- ✅ ALWAYS include tenant_id
- ✅ ALWAYS track created_by
- ✅ ALWAYS include timestamps
- ✅ Use soft delete pattern
- ✅ Add updated_by for audit

---

## 🚫 Anti-Patterns (DON'T DO THIS)

### ❌ Nested Tenant Data
```javascript
// BAD: Data nested under tenant
tenants/{tenant_id}/
  ├── posts/{post_id}     // ❌ Bad!
  └── users/{user_id}     // ❌ Bad!

// WHY BAD:
// - Can't query across tenants (for admin)
// - Collection group queries needed everywhere
// - Migration nightmare
// - Harder to enforce rules
```

### ❌ Missing tenant_id
```javascript
// BAD: No tenant isolation
posts/{post_id}
  ├── title: string
  └── content: string
  // ❌ No tenant_id = security breach!
```

### ❌ User-chosen tenant_id
```javascript
// BAD: Client sets tenant_id
await db.collection('posts').add({
  tenant_id: userInput.tenant_id  // ❌ Security breach!
});

// GOOD: Server sets tenant_id
// Only Cloud Functions or wrapper library
```

---

## ⚙️ Setup Steps

### Step 1: Initialize Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init firestore
firebase init functions

# Select:
# - Firestore rules and indexes
# - Cloud Functions
```

### Step 2: Configure Firestore Indexes
```
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenant_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenant_id", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
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

### Step 3: Environment Variables
```
# .env.local (Next.js)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Cloud Functions
FIREBASE_PROJECT_ID=your-project-id
```

### Step 4: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### Step 5: Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Step 6: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

---

## 📈 Performance Optimization

### Composite Indexes Strategy
**Rule:** Every query filtering by tenant_id needs index

**Common Patterns:**
```
tenant_id + [sort_field]
tenant_id + [status_field] + [sort_field]
tenant_id + [user_field] + [sort_field]
```

**Example:**
```javascript
// This query needs index
db.collection('posts')
  .where('tenant_id', '==', tid)
  .where('status', '==', 'published')
  .orderBy('created_at', 'desc');

// Required index:
// tenant_id (ASC) + status (ASC) + created_at (DESC)
```

### Query Limits
```javascript
// Always use limits
.limit(20)  // Default page size
.limit(100) // Max page size

// Use pagination
.startAfter(lastDoc)
```

---

## 🔒 Security Checklist

### Before Production:
- [ ] All collections have tenant_id field
- [ ] Firestore rules deployed and tested
- [ ] Composite indexes created
- [ ] Cloud Functions deployed
- [ ] Environment variables configured
- [ ] Audit logging enabled
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry)
- [ ] Privacy policy published

---

## 🚀 Migration Strategy

### Adding tenant_id to Existing Data
```javascript
// Cloud Function for one-time migration
exports.migrateTenantId = functions.https.onRequest(async (req, res) => {
  const batch = db.batch();
  const snapshot = await db.collection('posts').get();
  
  snapshot.docs.forEach(doc => {
    // Determine tenant_id from user_id or other logic
    const tenant_id = determineTenant(doc.data());
    batch.update(doc.ref, { tenant_id });
  });
  
  await batch.commit();
  res.send('Migration complete');
});
```

---

## 📊 Monitoring Queries

### Check Index Usage
```javascript
// Firebase Console → Firestore → Usage
// Look for:
// - Queries running slow (> 1s)
// - Missing index warnings
// - High read counts
```

### Query Performance
```javascript
// Add timing to wrapper
async query(collection, filters) {
  const start = Date.now();
  const results = await this.db.collection(collection)...
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`Slow query: ${collection} took ${duration}ms`);
  }
  
  return results;
}
```

---

## 💾 Backup Strategy

### Automated Daily Backups
```bash
# Cloud Scheduler → Cloud Function
exports.backupFirestore = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const client = new firestore.v1.FirestoreAdminClient();
    await client.exportDocuments({
      name: client.databasePath(projectId, '(default)'),
      outputUriPrefix: `gs://${bucketName}/backups`,
      collectionIds: [] // Empty = all collections
    });
  });
```

### Retention Policy
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

---

## ⚠️ Common Setup Mistakes

1. **Forgetting indexes** → Queries fail in production
2. **No composite indexes** → Slow queries
3. **Missing environment variables** → Functions crash
4. **Not testing rules** → Security holes
5. **No backup strategy** → Data loss risk
6. **Wrong index order** → Index not used
7. **Missing tenant_id** → Cross-tenant leaks

---

## ✅ Final Deployment Checklist

```
Pre-Deploy:
[ ] Rules tested in emulator
[ ] Indexes created
[ ] Functions tested locally
[ ] Environment variables set
[ ] Audit logging working

Deploy:
[ ] firebase deploy --only firestore:rules
[ ] firebase deploy --only firestore:indexes
[ ] firebase deploy --only functions

Post-Deploy:
[ ] Test signup flow
[ ] Test invitation flow
[ ] Test role changes
[ ] Verify audit logs
[ ] Check index usage
[ ] Monitor error logs
```