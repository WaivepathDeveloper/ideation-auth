# Future Enhancements - Post-MVP Features

## 🎯 Purpose
Features to implement after MVP launch for compliance and scalability

---

## 📅 **Enhancement 1: Scheduled Hard Delete (30-Day Cleanup)**

### **Business Requirement**
GDPR Article 17 - Right to erasure requires permanent deletion after retention period

### **Current State (MVP)**
- Soft delete: `deleted: true, deleted_at: timestamp`
- Data kept indefinitely in Firestore
- ⚠️ Not fully GDPR compliant

### **Target State (Post-MVP)**
- Soft delete for 30 days (undo capability)
- Automatic hard delete after 30 days
- Audit trail maintained separately

---

### **Implementation Approach**

#### **Step 1: Cloud Scheduler Setup**
```bash
# Create scheduled trigger (runs daily at 2 AM)
gcloud scheduler jobs create pubsub cleanup-deleted-data \
  --schedule="0 2 * * *" \
  --topic="cleanup-trigger" \
  --message-body="run"
```

**Why daily:** Balance between compliance and cost

#### **Step 2: Cloud Function Pattern**
```javascript
exports.cleanupDeletedData = functions.pubsub
  .topic('cleanup-trigger')
  .onPublish(async (message) => {
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find records marked for deletion > 30 days ago
    const snapshot = await db.collectionGroup('users')
      .where('deleted', '==', true)
      .where('deleted_at', '<', thirtyDaysAgo)
      .get();
    
    const batch = db.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      // Log before deletion (audit trail)
      await db.collection('deletion_logs').add({
        collection: 'users',
        document_id: doc.id,
        tenant_id: doc.data().tenant_id,
        deleted_by: doc.data().deleted_by,
        deleted_at: doc.data().deleted_at,
        hard_deleted_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Hard delete
      batch.delete(doc.ref);
      count++;
      
      // Firestore batch limit: 500 operations
      if (count % 500 === 0) {
        await batch.commit();
      }
    }
    
    if (count % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`Hard deleted ${count} records`);
  });
```

#### **Key Decisions**
- ✅ Process all collections (users, posts, etc.)
- ✅ Keep deletion_logs collection separate (never delete)
- ✅ Batch operations for performance
- ✅ Run during low-traffic hours (2 AM)

#### **Collections to Process**
```javascript
const collections = [
  'users',
  'posts',
  'comments',
  'attachments'
  // Add all business collections
];

for (const collection of collections) {
  await processCollection(collection, thirtyDaysAgo);
}
```

---

### **Testing Strategy**
```javascript
// Test with shorter retention (1 day instead of 30)
const oneDayAgo = new Date();
oneDayAgo.setDate(oneDayAgo.getDate() - 1);

// Verify:
// 1. Records > 1 day deleted
// 2. Records < 1 day kept
// 3. Deletion logs created
// 4. Audit trail intact
```

---

### **Monitoring & Alerts**
```javascript
// Add logging
console.log('Cleanup job started');
console.log(`Found ${snapshot.size} records to delete`);
console.log(`Successfully deleted ${count} records`);

// Alert if fails
if (error) {
  // Send alert to admin email or Slack
}
```

---

## 📤 **Enhancement 2: GDPR Data Export Function**

### **Business Requirement**
GDPR Article 15 - Right to access (user can request their data)

### **Implementation Approach**

#### **Callable Cloud Function**
```javascript
exports.exportUserData = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userId = context.auth.uid;
  const tenantId = context.auth.token.tenant_id;
  
  // Collect all user data
  const userData = {
    profile: {},
    activity: [],
    posts: [],
    comments: []
  };
  
  // 1. User profile
  const userDoc = await db.collection('users').doc(userId).get();
  userData.profile = userDoc.data();
  
  // 2. User's posts
  const postsSnapshot = await db.collection('posts')
    .where('tenant_id', '==', tenantId)
    .where('created_by', '==', userId)
    .get();
  userData.posts = postsSnapshot.docs.map(doc => doc.data());
  
  // 3. User's comments
  const commentsSnapshot = await db.collection('comments')
    .where('tenant_id', '==', tenantId)
    .where('created_by', '==', userId)
    .get();
  userData.comments = commentsSnapshot.docs.map(doc => doc.data());
  
  // 4. Audit logs
  const logsSnapshot = await db.collection('audit_logs')
    .where('tenant_id', '==', tenantId)
    .where('user_id', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(1000) // Last 1000 actions
    .get();
  userData.activity = logsSnapshot.docs.map(doc => doc.data());
  
  // 5. Generate export file
  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    tenant_id: tenantId,
    data: userData
  };
  
  // Option A: Return JSON directly (small data)
  if (JSON.stringify(exportData).length < 1000000) { // < 1MB
    return { success: true, data: exportData };
  }
  
  // Option B: Upload to Cloud Storage (large data)
  const bucket = admin.storage().bucket();
  const fileName = `exports/${tenantId}/${userId}_${Date.now()}.json`;
  const file = bucket.file(fileName);
  
  await file.save(JSON.stringify(exportData, null, 2), {
    metadata: { contentType: 'application/json' }
  });
  
  // Generate signed URL (valid for 1 hour)
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000
  });
  
  return { 
    success: true, 
    download_url: signedUrl,
    message: 'Data export ready. Link expires in 1 hour.'
  };
});
```

#### **Client-Side Usage**
```javascript
// User clicks "Export My Data" button
const { data } = await functions.httpsCallable('exportUserData')();

if (data.download_url) {
  // Large export - download link
  window.open(data.download_url, '_blank');
} else {
  // Small export - direct JSON
  downloadJSON(data.data, 'my-data.json');
}
```

---

### **What Data to Include**
- ✅ User profile (email, name, preferences)
- ✅ Content created (posts, comments, uploads)
- ✅ Activity history (last 1000 actions)
- ✅ Settings and preferences
- ✅ Subscription/billing info (if applicable)
- ❌ Other users' data (privacy)
- ❌ System metadata (internal IDs, technical fields)

---

### **Performance Considerations**
```javascript
// For large datasets, process in chunks
async function exportLargeCollection(collection, userId, tenantId) {
  const chunks = [];
  let lastDoc = null;
  
  while (true) {
    let query = db.collection(collection)
      .where('tenant_id', '==', tenantId)
      .where('created_by', '==', userId)
      .limit(100);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) break;
    
    chunks.push(...snapshot.docs.map(doc => doc.data()));
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }
  
  return chunks;
}
```

---

### **Security & Privacy**
- ✅ Only user can export their own data
- ✅ Tenant admins CANNOT export user data (privacy)
- ✅ Signed URLs expire (1 hour)
- ✅ Export files auto-delete after 7 days
- ✅ Log all export requests (audit)

---

## 📊 **Implementation Priority**

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Hard Delete | High | Medium | GDPR compliance |
| Data Export | High | Medium | GDPR compliance |

---

## ⚙️ **Configuration Requirements**

### **Cloud Scheduler Pricing**
- 3 jobs free per month
- $0.10 per job per month after
- Our usage: 1 job = FREE ✅

### **Cloud Storage (for exports)**
```bash
# Create bucket for exports
gsutil mb -l us-central1 gs://your-project-exports

# Set lifecycle policy (auto-delete after 7 days)
gsutil lifecycle set lifecycle.json gs://your-project-exports
```

**lifecycle.json:**
```json
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 7}
    }]
  }
}
```

---

## ✅ **Testing Checklist**

**Hard Delete:**
- [ ] Records > 30 days deleted
- [ ] Records < 30 days preserved
- [ ] Deletion logs created
- [ ] No orphaned data
- [ ] Batch limits respected

**Data Export:**
- [ ] User can export own data
- [ ] Export includes all collections
- [ ] Large exports use Cloud Storage
- [ ] Signed URL expires correctly
- [ ] Other users' data excluded
- [ ] Export request logged

---

## 📈 **Cost Estimation**

**Hard Delete Job:**
- Runs: Daily (once per day)
- Reads: ~1000 documents per run = 30K/month
- Deletes: ~100 documents per run = 3K/month
- Cost: < $0.50/month ✅

**Data Export:**
- Estimated: 10 exports per month
- Reads: ~500 documents per export = 5K/month
- Storage: Negligible (7-day retention)
- Cost: < $0.10/month ✅

**Total: < $1/month** 💰

---

## 🚀 **Deployment Steps**

1. Deploy Cloud Functions
2. Create Cloud Scheduler job
3. Configure Cloud Storage bucket
4. Test with staging data
5. Enable in production
6. Add UI buttons (Export/Delete)
7. Update privacy policy

---

## ⚠️ **Important Notes**

- Schedule hard delete during low-traffic hours
- Test thoroughly with non-production data first
- Monitor deletion logs for anomalies
- Keep deletion_logs collection indefinitely
- Review export contents before production
- Ensure Cloud Storage bucket is private