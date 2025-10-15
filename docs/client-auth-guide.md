# Client Auth Service - React/Next.js Guide

## 🎯 Purpose
Frontend authentication with automatic tenant context

---

## 🏗️ Architecture Pattern

### Context Provider Pattern
```
App Root
  └── TenantAuthProvider (wraps entire app)
        ├── Provides: user, tenant, loading, error
        ├── Provides: signIn, signUp, signOut methods
        └── Auto-refreshes token when claims change
```

**Why Context:**
- ✅ Access auth state anywhere in app
- ✅ Single source of truth
- ✅ Automatic re-renders on auth changes
- ✅ No prop drilling

---

## 📦 Core Components

### 1. **TenantAuthProvider (Context)**

**What it manages:**
```javascript
const AuthContext = {
  user: {
    uid: string,
    email: string,
    tenant_id: string,  // From custom claims
    role: string        // From custom claims
  },
  tenant: {
    id: string,
    name: string,
    settings: object
  },
  loading: boolean,
  error: string | null,
  
  // Methods
  signIn: (email, password) => Promise,
  signUp: (email, password) => Promise,
  signOut: () => Promise,
  refreshToken: () => Promise
}
```

**Critical Implementation Points:**

**A. Listen to Auth State**
```javascript
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      // Get custom claims from token
      const token = await firebaseUser.getIdTokenResult();
      
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        tenant_id: token.claims.tenant_id,
        role: token.claims.role
      });
      
      // Fetch tenant details
      fetchTenantDetails(token.claims.tenant_id);
    } else {
      setUser(null);
    }
  });
  
  return unsubscribe;
}, []);
```

**Why:**
- ✅ Real-time auth state updates
- ✅ Survives page refresh
- ✅ Auto-logout on token expiration

**B. Token Refresh Strategy**
```javascript
// Refresh token every 50 minutes (tokens expire at 60 min)
useEffect(() => {
  if (!user) return;
  
  const interval = setInterval(async () => {
    await auth.currentUser.getIdToken(true); // Force refresh
  }, 50 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [user]);
```

**Why:**
- ✅ Keeps custom claims up-to-date
- ✅ Prevents expired token errors
- ✅ User doesn't notice refresh

---

### 2. **useTenantAuth Hook**

**Usage Pattern:**
```javascript
const { user, tenant, signIn, signOut } = useTenantAuth();

if (user.role === 'tenant_admin') {
  // Show admin features
}
```

**Implementation:**
```javascript
export function useTenantAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useTenantAuth must be used within TenantAuthProvider');
  }
  
  return context;
}
```

**Why:**
- ✅ Type-safe access to auth
- ✅ Prevents usage outside provider
- ✅ Clean API for components

---

### 3. **ProtectedRoute Component**

**Purpose:** Block unauthenticated access

**Pattern:**
```javascript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Or with role check
<ProtectedRoute requiredRole="tenant_admin">
  <AdminPanel />
</ProtectedRoute>
```

**Implementation Logic:**
```javascript
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useTenantAuth();
  const router = useRouter();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    router.push('/login');
    return null;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <UnauthorizedPage />;
  }
  
  return children;
}
```

**Why:**
- ✅ Declarative route protection
- ✅ Handles loading states
- ✅ Role-based access control

---

## 🔐 Authentication Methods

### Sign Up Flow
```javascript
async function signUp(email, password) {
  try {
    // 1. Create Firebase user
    const { user } = await createUserWithEmailAndPassword(
      auth, email, password
    );
    
    // 2. Cloud Function automatically:
    //    - Checks for invitation
    //    - Assigns tenant_id
    //    - Sets role
    
    // 3. Wait for custom claims (polling)
    await waitForCustomClaims(user);
    
    // 4. Fetch tenant details
    const tenant = await fetchTenantDetails();
    
    return { success: true };
  } catch (error) {
    throw error;
  }
}
```

**Critical Points:**
- ✅ Let Cloud Function handle tenant assignment
- ✅ Poll for custom claims (they aren't instant)
- ✅ Show loading state during setup
- ❌ DON'T create tenant from client

**Wait for Claims Pattern:**
```javascript
async function waitForCustomClaims(user, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const token = await user.getIdTokenResult(true);
    if (token.claims.tenant_id) {
      return token.claims;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
  }
  throw new Error('Timeout waiting for tenant assignment');
}
```

---

### Sign In Flow
```javascript
async function signIn(email, password) {
  try {
    // 1. Firebase authentication
    const { user } = await signInWithEmailAndPassword(
      auth, email, password
    );
    
    // 2. Get custom claims
    const token = await user.getIdTokenResult();
    
    // 3. Verify has tenant_id
    if (!token.claims.tenant_id) {
      throw new Error('Account setup incomplete');
    }
    
    // 4. Context automatically updates via onAuthStateChanged
    
    return { success: true };
  } catch (error) {
    throw error;
  }
}
```

---

### Google OAuth Flow
```javascript
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  try {
    const { user } = await signInWithPopup(auth, provider);
    
    // Same as email signup - Cloud Function handles tenant
    await waitForCustomClaims(user);
    
    return { success: true };
  } catch (error) {
    throw error;
  }
}
```

---

## 🛡️ Security Best Practices

### 1. **Never Store Sensitive Data in Context**
```javascript
// ❌ BAD
const context = {
  user: user,
  password: password // NEVER!
}

// ✅ GOOD
const context = {
  user: {
    uid, email, tenant_id, role
  }
}
```

### 2. **Always Verify on Server**
```javascript
// Client checks are for UX only
if (user.role !== 'admin') {
  return <div>Access denied</div>; // Good for UX
}

// Server MUST verify again
// Cloud Function or API checks user.token.role
```

### 3. **Handle Token Expiration**
```javascript
// Retry logic for expired tokens
async function callAPI(endpoint) {
  try {
    const token = await auth.currentUser.getIdToken();
    return await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      // Refresh and retry
      const newToken = await auth.currentUser.getIdToken(true);
      return await fetch(endpoint, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
    }
    throw error;
  }
}
```

---

## ⚡ Performance Optimization

### 1. **Lazy Load Tenant Data**
```javascript
// Don't fetch tenant on every render
const [tenant, setTenant] = useState(null);

useEffect(() => {
  if (user?.tenant_id && !tenant) {
    fetchTenantDetails(user.tenant_id);
  }
}, [user?.tenant_id]);
```

### 2. **Memoize Auth Context**
```javascript
const value = useMemo(() => ({
  user,
  tenant,
  signIn,
  signOut
}), [user, tenant]); // Only re-create when these change
```

---

## 📊 State Management

### Loading States
```javascript
State: loading = true  → Show skeleton
State: loading = false, user = null → Redirect to login
State: loading = false, user exists → Show app
```

### Error States
```javascript
// Auth errors
auth/user-not-found
auth/wrong-password
auth/email-already-in-use
auth/weak-password

// Custom errors
account-setup-incomplete (no tenant_id)
invitation-required
tenant-suspended
```

---

## ⚠️ Common Mistakes to Avoid

1. **Not waiting for claims** → User sees undefined tenant_id
2. **Forgetting token refresh** → Stale role for 1 hour
3. **Client-side-only protection** → Security bypass
4. **Not handling loading states** → Flashing content
5. **Storing passwords** → Security risk

---

## 🚀 Required Packages
```json
{
  "firebase": "^10.7.0",
  "react": "^18.0.0"
}
```

## 📦 File Structure
```
/hooks
  └── useTenantAuth.js
/contexts
  └── TenantAuthContext.jsx
/components
  └── ProtectedRoute.jsx
```