# Rate Limiting Implementation - Security Guidelines

## 🎯 Purpose
Prevent abuse, brute force attacks, and resource exhaustion

---

## 🔒 **Why Rate Limiting is Critical**

### **Attack Vectors Without Rate Limiting:**
- Brute force password attempts (1000s per second)
- API abuse (drain quota/costs)
- DoS attacks (crash functions)
- Credential stuffing
- Invitation spam

### **Impact of Attacks:**
- 💰 High Firebase costs (function invocations)
- 🔓 Account compromise
- ⚡ Service degradation
- 📊 Data exposure

---

## 🛡️ **Three-Layer Rate Limiting Strategy**

### **Layer 1: Authentication Attempts** (Highest Priority)
- Limit: 5 failed attempts per 15 minutes
- Scope: Per email address
- Action: Temporary account lock

### **Layer 2: API Calls** (Per User)
- Limit: 100 requests per minute per user
- Scope: Per user_id across all functions
- Action: Reject with 429 error

### **Layer 3: Tenant Operations** (Per Tenant)
- Limit: 1000 requests per minute per tenant
- Scope: Per tenant_id
- Action: Throttle expensive operations

---

## 🔥 **Implementation Pattern**

### **Storage Strategy**
```javascript
// Firestore collection for tracking
rate_limits/{limit_id}
  ├── key: string (email, user_id, tenant_id)
  ├── type: string ('auth', 'api', 'tenant')
  ├── count: number (request count)
  ├── window_start: timestamp
  ├── blocked_until: timestamp (nullable)
  └── attempts: array (for detailed logging)
```

**Why Firestore:**
- ✅ No external dependencies
- ✅ Survives function restarts
- ✅ Already available
- ✅ Can query/audit limits
- ❌ Slightly slower than Redis (acceptable tradeoff)

---

## 🔐 **Layer 1: Login Rate Limiting**

### **Implementation**
```javascript
// Middleware for login attempts
async function checkLoginRateLimit(email) {
  const limitDoc = await db
    .collection('rate_limits')
    .doc(`auth_${email}`)
    .get();
  
  const now = admin.firestore.Timestamp.now();
  const windowDuration = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  if (limitDoc.exists) {
    const data = limitDoc.data();
    
    // Check if currently blocked
    if (data.blocked_until && data.blocked_until.toMillis() > now.toMillis()) {
      const remainingSeconds = Math.ceil((data.blocked_until.toMillis() - now.toMillis()) / 1000);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Too many failed attempts. Try again in ${remainingSeconds} seconds.`
      );
    }
    
    // Check if window expired
    const windowExpired = (now.toMillis() - data.window_start.toMillis()) > windowDuration;
    
    if (windowExpired) {
      // Reset counter
      await limitDoc.ref.set({
        key: email,
        type: 'auth',
        count: 1,
        window_start: now,
        blocked_until: null
      });
    } else {
      // Increment counter
      const newCount = data.count + 1;
      
      if (newCount > maxAttempts) {
        // Block for 15 minutes
        await limitDoc.ref.update({
          count: newCount,
          blocked_until: admin.firestore.Timestamp.fromMillis(now.toMillis() + windowDuration)
        });
        
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many failed login attempts. Account temporarily locked for 15 minutes.'
        );
      } else {
        await limitDoc.ref.update({ count: newCount });
      }
    }
  } else {
    // First attempt - create record
    await db.collection('rate_limits').doc(`auth_${email}`).set({
      key: email,
      type: 'auth',
      count: 1,
      window_start: now,
      blocked_until: null
    });
  }
}
```

### **Usage in Sign-In Function**
```javascript
exports.signIn = functions.https.onCall(async (data, context) => {
  const { email, password } = data;
  
  try {
    // Check rate limit BEFORE attempting authentication
    await checkLoginRateLimit(email);
    
    // Proceed with authentication
    const user = await admin.auth().getUserByEmail(email);
    
    // If successful, clear the rate limit counter
    await db.collection('rate_limits').doc(`auth_${email}`).delete();
    
    return { success: true };
    
  } catch (error) {
    // Failed login - rate limit already incremented
    throw error;
  }
});
```

**Key Points:**
- ✅ Check limit BEFORE authentication (prevent credential validation abuse)
- ✅ Clear counter on successful login
- ✅ Block increases with repeated failures
- ✅ Auto-expire blocks (no manual intervention)

---

## ⚡ **Layer 2: API Rate Limiting**

### **Reusable Middleware**
```javascript
// Generic rate limiter for all callable functions
async function checkAPIRateLimit(userId) {
  const limitKey = `api_${userId}_${getMinuteKey()}`;
  const limitDoc = await db.collection('rate_limits').doc(limitKey).get();
  
  const maxRequests = 100; // per minute
  
  if (limitDoc.exists) {
    const count = limitDoc.data().count;
    
    if (count >= maxRequests) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Max ${maxRequests} requests per minute.`
      );
    }
    
    // Increment
    await limitDoc.ref.update({
      count: admin.firestore.FieldValue.increment(1)
    });
  } else {
    // Create with TTL (expires after 2 minutes)
    await limitDoc.ref.set({
      key: userId,
      type: 'api',
      count: 1,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 120000)
    });
  }
}

// Helper: Get minute-based key for auto-expiring limits
function getMinuteKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
}
```

### **Apply to All Functions**
```javascript
exports.inviteUser = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Rate limit check
  await checkAPIRateLimit(context.auth.uid);
  
  // Proceed with function logic
  // ...
});

exports.updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  await checkAPIRateLimit(context.auth.uid);
  
  // Function logic...
});
```

**Pattern:**
```javascript
// Every callable function should have:
1. Authentication check
2. Rate limit check
3. Permission check (role)
4. Business logic
```

---

## 🏢 **Layer 3: Tenant-Level Limiting**

### **Purpose**
Prevent one tenant from consuming all resources

### **Implementation**
```javascript
async function checkTenantRateLimit(tenantId) {
  const limitKey = `tenant_${tenantId}_${getMinuteKey()}`;
  const limitDoc = await db.collection('rate_limits').doc(limitKey).get();
  
  const maxRequests = 1000; // per minute per tenant
  
  if (limitDoc.exists && limitDoc.data().count >= maxRequests) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Tenant rate limit exceeded. Please contact support.'
    );
  }
  
  if (limitDoc.exists) {
    await limitDoc.ref.update({
      count: admin.firestore.FieldValue.increment(1)
    });
  } else {
    await limitDoc.ref.set({
      key: tenantId,
      type: 'tenant',
      count: 1,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 120000)
    });
  }
}
```

### **Usage**
```javascript
// Apply to resource-intensive operations
exports.bulkImportUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const tenantId = context.auth.token.tenant_id;
  
  // Check both user AND tenant limits
  await checkAPIRateLimit(context.auth.uid);
  await checkTenantRateLimit(tenantId);
  
  // Proceed with bulk import...
});
```

---

## 🧹 **Cleanup Strategy**

### **Auto-Expire Old Records**
```javascript
// Scheduled function (runs every hour)
exports.cleanupRateLimits = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    
    const now = admin.firestore.Timestamp.now();
    
    // Delete expired rate limit records
    const snapshot = await db.collection('rate_limits')
      .where('expires_at', '<', now)
      .limit(500)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    console.log(`Cleaned up ${snapshot.size} expired rate limits`);
  });
```

**Why cleanup:**
- ✅ Prevent collection growth
- ✅ Keep queries fast
- ✅ Reduce storage costs

---

## 📊 **Monitoring & Alerts**

### **Track Rate Limit Hits**
```javascript
async function checkAPIRateLimit(userId) {
  // ... existing logic ...
  
  if (count >= maxRequests) {
    // Log rate limit hit
    await db.collection('security_events').add({
      type: 'rate_limit_exceeded',
      user_id: userId,
      limit_type: 'api',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Alert if repeated violations
    const recentViolations = await db.collection('security_events')
      .where('user_id', '==', userId)
      .where('type', '==', 'rate_limit_exceeded')
      .where('timestamp', '>', oneDayAgo)
      .get();
    
    if (recentViolations.size > 10) {
      // Send alert to admin
      console.error(`User ${userId} has ${recentViolations.size} rate limit violations`);
    }
    
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
  }
}
```

### **Dashboard Metrics**
```javascript
// Query for analysis
db.collection('security_events')
  .where('type', '==', 'rate_limit_exceeded')
  .where('timestamp', '>', last24Hours)
  .get();

// Metrics to track:
// - Total rate limit hits per day
// - Users with most violations
// - Most rate-limited functions
// - Peak traffic times
```

---

## 🎯 **Rate Limit Configuration**

### **Recommended Limits**

| Operation | Limit | Window | Reasoning |
|-----------|-------|--------|-----------|
| Login attempts | 5 | 15 min | Prevent brute force |
| Password reset | 3 | 1 hour | Prevent email spam |
| API calls (user) | 100 | 1 min | Normal usage ~20/min |
| API calls (tenant) | 1000 | 1 min | Multi-user tenant |
| Invitations | 10 | 1 hour | Prevent spam |
| File uploads | 20 | 1 hour | Prevent storage abuse |

### **Environment-Based Configuration**
```javascript
// config/rate-limits.js
const LIMITS = {
  development: {
    login: { max: 10, window: 5 * 60 * 1000 },     // Relaxed for testing
    api: { max: 1000, window: 60 * 1000 }
  },
  production: {
    login: { max: 5, window: 15 * 60 * 1000 },
    api: { max: 100, window: 60 * 1000 }
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = LIMITS[env];
```

---

## ⚠️ **Security Best Practices**

### **1. Rate Limit by Multiple Keys**
```javascript
// Protect against distributed attacks
async function checkLoginRateLimit(email, ipAddress) {
  // Check per email
  await checkLimit(`auth_email_${email}`);
  
  // Also check per IP (prevents rotating emails from same IP)
  await checkLimit(`auth_ip_${ipAddress}`);
}
```

### **2. Exponential Backoff**
```javascript
// Increase block time with repeated violations
function calculateBlockDuration(attemptCount) {
  const baseMinutes = 15;
  return Math.min(baseMinutes * Math.pow(2, attemptCount - 5), 1440); // Max 24 hours
}
```

### **3. Whitelist Internal Systems**
```javascript
const WHITELISTED_IPS = ['10.0.0.1', '10.0.0.2']; // Internal systems

async function checkAPIRateLimit(userId, ipAddress) {
  if (WHITELISTED_IPS.includes(ipAddress)) {
    return; // Skip rate limit
  }
  
  // Normal rate limit check
}
```

---

## ✅ **Testing Strategy**

### **Test Cases**
```javascript
// Test 1: Verify limit enforcement
for (let i = 0; i < 6; i++) {
  try {
    await signIn(email, 'wrong-password');
  } catch (error) {
    if (i === 5) {
      assert(error.code === 'resource-exhausted');
    }
  }
}

// Test 2: Verify window expiration
await sleep(15 * 60 * 1000); // Wait 15 minutes
const result = await signIn(email, 'correct-password');
assert(result.success === true);

// Test 3: Verify counter reset on success
await signIn(email, 'correct-password');
const limitDoc = await db.collection('rate_limits').doc(`auth_${email}`).get();
assert(!limitDoc.exists); // Counter cleared
```

---

## 💰 **Cost Impact**

### **Firestore Operations**
- Rate limit check: 1 read + 1 write per request
- Average API calls: 1000/day per user
- Cost: 1000 * 2 * 30 = 60K operations/month = ~$0.04/month per user ✅

### **Storage**
- Rate limit docs auto-expire (2 minutes)
- Max concurrent docs: ~100 per tenant
- Storage cost: Negligible ✅

**Total: Minimal cost for critical security** 💪

---

## 🚀 **Implementation Checklist**

- [ ] Create rate_limits collection
- [ ] Implement checkLoginRateLimit()
- [ ] Implement checkAPIRateLimit()
- [ ] Implement checkTenantRateLimit()
- [ ] Add middleware to all callable functions
- [ ] Create cleanup scheduled function
- [ ] Configure limits per environment
- [ ] Add monitoring/logging
- [ ] Test all rate limit scenarios
- [ ] Document limits in API docs
- [ ] Add user-friendly error messages
- [ ] Create admin dashboard for limits