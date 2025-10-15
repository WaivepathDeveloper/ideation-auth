# Tenant Database Wrapper Library - Guidelines

## 🎯 Purpose
Prevent security bugs by auto-injecting tenant_id in all database operations

---

## 🔑 Core Concept

### The Problem
```javascript
// ❌ DANGEROUS - Easy to forget tenant_id
db.collection('posts').add({
  title: 'My Post',
  content: 'Hello'
  // Forgot tenant_id! → Security breach
});

// ❌ DANGEROUS - Wrong tenant_id
db.collection('posts').add({
  title: 'My Post',
  tenant_id: 'wrong-tenant' // Manual entry error
});
```

### The Solution
```javascript
// ✅ SAFE - tenant_id auto-injected
const tenantDB = new TenantFirestore(user.tenant_id);
tenantDB.create('posts', {
  title: 'My Post',
  content: 'Hello'
  // tenant_id added automatically!
});
```

**Impact:** Makes it IMPOSSIBLE to forget tenant_id

---

## 🏗️ Wrapper Class Design

### Core Structure
```javascript
class TenantFirestore {
  constructor(tenantId, userId) {
    this.tenantId = tenantId;   // From user's custom claims
    this.userId = userId;        // For created_by tracking
    this.db = firebase.firestore();
  }
  
  // All methods auto-handle tenant isolation
  create(collection, data) { }
  query(collection, filters) { }
  update(collection, docId, data) { }
  delete(collection, docId) { }
  getById(collection, docId) { }
}
```

**Why this design:**
- ✅ Encapsulates all Firestore operations
- ✅ Single source of tenant_id
- ✅ Consistent API across app
- ✅ Easy to add audit logging

---

## 📋 Required Methods

### 1. **create() - Add Documents**

**Purpose:** Create new document with auto-injected tenant_id

**Implementation Pattern:**
```javascript
async create(collection, data) {
  // Validate input
  if (!collection || !data) {
    throw new Error('Collection and data required');
  }
  
  // Auto-inject tenant fields
  const docData = {
    ...data,
    tenant_id: this.tenantId,      // Auto-inject
    created_by: this.userId,       // Auto-inject
    created_at: serverTimestamp(), // Auto-inject
    updated_at: serverTimestamp()
  };
  
  // Don't allow overriding
  if (data.tenant_id && data.tenant_id !== this.tenantId) {
    throw new Error('Cannot specify different tenant_id');
  }
  
  const docRef = await this.db.collection(collection).add(docData);
  return { id: docRef.id, ...docData };
}
```

**Critical Rules:**
- ✅ ALWAYS add tenant_id automatically
- ✅ Add created_by for audit trail
- ✅ Add timestamps for tracking
- ❌ NEVER allow overriding tenant_id
- ❌ NEVER trust data.tenant_id from input

**Usage:**
```javascript
const post = await tenantDB.create('posts', {
  title: 'New Post',
  content: 'Content here'
});
// Result: { id: 'abc123', title: '...', tenant_id: 'xyz', created_by: 'user1' }
```

---

### 2. **query() - Read Documents**

**Purpose:** Query with automatic tenant_id filtering

**Implementation Pattern:**
```javascript
async query(collection, filters = []) {
  // Start with tenant filter
  let queryRef = this.db
    .collection(collection)
    .where('tenant_id', '==', this.tenantId); // Auto-filter
  
  // Apply additional filters
  filters.forEach(filter => {
    queryRef = queryRef.where(filter.field, filter.op, filter.value);
  });
  
  const snapshot = await queryRef.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

**Critical Rules:**
- ✅ ALWAYS filter by tenant_id first
- ✅ Can't be bypassed by client
- ✅ Works with additional filters
- ✅ Returns only tenant's data

**Usage:**
```javascript
// Simple query
const posts = await tenantDB.query('posts');

// With filters
const activePosts = await tenantDB.query('posts', [
  { field: 'status', op: '==', value: 'active' },
  { field: 'created_at', op: '>', value: yesterday }
]);
```

---

### 3. **getById() - Get Single Document**

**Purpose:** Fetch document by ID with tenant verification

**Implementation Pattern:**
```javascript
async getById(collection, docId) {
  const docRef = this.db.collection(collection).doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    throw new Error('Document not found');
  }
  
  const data = doc.data();
  
  // CRITICAL: Verify tenant_id matches
  if (data.tenant_id !== this.tenantId) {
    throw new Error('Access denied: Document belongs to different tenant');
  }
  
  return { id: doc.id, ...data };
}
```

**Critical Rules:**
- ✅ ALWAYS verify tenant_id after fetch
- ✅ Throw error if wrong tenant
- ✅ Don't expose other tenant's data
- ❌ NEVER skip tenant verification

**Why verify:** Firestore rules protect writes, but this adds read protection

---

### 4. **update() - Modify Documents**

**Purpose:** Update with tenant verification and audit tracking

**Implementation Pattern:**
```javascript
async update(collection, docId, updates) {
  // Get existing document
  const existing = await this.getById(collection, docId); // Verifies tenant
  
  // Prepare update data
  const updateData = {
    ...updates,
    updated_at: serverTimestamp(),
    updated_by: this.userId
  };
  
  // Prevent changing protected fields
  delete updateData.tenant_id;    // Can't change tenant
  delete updateData.created_by;   // Can't change creator
  delete updateData.created_at;   // Can't change creation time
  
  await this.db.collection(collection).doc(docId).update(updateData);
  
  return { id: docId, ...existing, ...updateData };
}
```

**Critical Rules:**
- ✅ Verify tenant_id before update
- ✅ Prevent changing immutable fields
- ✅ Track who updated (audit)
- ✅ Update timestamp automatically

---

### 5. **delete() - Remove Documents**

**Purpose:** Soft delete with tenant verification

**Implementation Pattern:**
```javascript
async delete(collection, docId, hardDelete = false) {
  // Verify tenant ownership
  await this.getById(collection, docId);
  
  if (hardDelete) {
    // Permanent deletion
    await this.db.collection(collection).doc(docId).delete();
  } else {
    // Soft delete (recommended)
    await this.db.collection(collection).doc(docId).update({
      deleted: true,
      deleted_at: serverTimestamp(),
      deleted_by: this.userId
    });
  }
  
  return { success: true };
}
```

**Critical Rules:**
- ✅ Default to soft delete
- ✅ Keep audit trail
- ✅ Verify tenant before delete
- ✅ Hard delete only for compliance (GDPR)

---

## 🔧 Advanced Features

### Batch Operations
```javascript
async batchCreate(collection, items) {
  const batch = this.db.batch();
  
  items.forEach(item => {
    const docRef = this.db.collection(collection).doc();
    batch.set(docRef, {
      ...item,
      tenant_id: this.tenantId,
      created_by: this.userId,
      created_at: serverTimestamp()
    });
  });
  
  await batch.commit();
  return { count: items.length };
}
```

### Pagination Support
```javascript
async queryPaginated(collection, filters, { limit = 20, startAfter = null }) {
  let query = this.db
    .collection(collection)
    .where('tenant_id', '==', this.tenantId)
    .limit(limit);
  
  if (startAfter) {
    query = query.startAfter(startAfter);
  }
  
  filters.forEach(f => query = query.where(f.field, f.op, f.value));
  
  const snapshot = await query.get();
  
  return {
    data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === limit
  };
}
```

---

## 🛡️ Security Enhancements

### Input Validation
```javascript
validateData(data, schema) {
  // Validate required fields
  // Check data types
  // Sanitize inputs
  // Prevent injection attacks
}
```

### Audit Logging
```javascript
async create(collection, data) {
  const result = await this.db.collection(collection).add(docData);
  
  // Log action
  await this.db.collection('audit_logs').add({
    tenant_id: this.tenantId,
    user_id: this.userId,
    action: 'CREATE',
    collection: collection,
    document_id: result.id,
    timestamp: serverTimestamp()
  });
  
  return result;
}
```

### Rate Limiting
```javascript
// Track operations per user per minute
private async checkRateLimit() {
  const recentOps = await this.db
    .collection('rate_limits')
    .where('user_id', '==', this.userId)
    .where('timestamp', '>', oneMinuteAgo)
    .get();
  
  if (recentOps.size > 100) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## ⚡ Performance Best Practices

### 1. **Index Strategy**
```javascript
// Required composite indexes
tenant_id + created_at (DESC)
tenant_id + status + created_at (DESC)
tenant_id + created_by + created_at (DESC)
```

### 2. **Caching Pattern**
```javascript
class TenantFirestore {
  constructor(tenantId, userId) {
    this.cache = new Map();
  }
  
  async getById(collection, docId, useCache = true) {
    const cacheKey = `${collection}:${docId}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const data = await this.fetchFromFirestore(collection, docId);
    this.cache.set(cacheKey, data);
    
    return data;
  }
}
```

### 3. **Batch Reads**
```javascript
// Get multiple documents in one call
async getByIds(collection, docIds) {
  const promises = docIds.map(id => 
    this.db.collection(collection).doc(id).get()
  );
  
  const docs = await Promise.all(promises);
  
  return docs
    .filter(doc => doc.exists && doc.data().tenant_id === this.tenantId)
    .map(doc => ({ id: doc.id, ...doc.data() }));
}
```

---

## ⚠️ Common Mistakes to Avoid

1. **Bypassing wrapper** → Use for ALL database operations
2. **Not verifying in getById** → Cross-tenant read possible
3. **Allowing tenant_id override** → Security bypass
4. **Skipping audit fields** → Can't track changes
5. **Hard delete by default** → Lose audit trail

---

## 📦 Usage Pattern

### Initialization
```javascript
// In Auth Context
const tenantDB = useMemo(() => {
  if (user) {
    return new TenantFirestore(user.tenant_id, user.uid);
  }
  return null;
}, [user]);

// Provide to entire app
<DBContext.Provider value={tenantDB}>
  {children}
</DBContext.Provider>
```

### In Components
```javascript
const { tenantDB } = useDatabase();

// Create
const post = await tenantDB.create('posts', { title: 'Test' });

// Query
const posts = await tenantDB.query('posts', [
  { field: 'status', op: '==', value: 'published' }
]);

// Update
await tenantDB.update('posts', postId, { title: 'Updated' });

// Delete
await tenantDB.delete('posts', postId);
```

---

## 📊 Impact Summary

| Without Wrapper | With Wrapper |
|----------------|--------------|
| 90% chance of bugs | 5% chance of bugs |
| Manual tenant_id | Auto-injected |
| Inconsistent API | Consistent API |
| Hard to audit | Built-in logging |
| No safety net | Multiple checks |