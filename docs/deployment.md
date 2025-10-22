# Deployment Guide

## Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created
- Domain for production (optional)

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.local.example .env.local
```

### 2. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **General**
4. Scroll to "Your apps" section
5. Click web app icon or "Add app"
6. Copy configuration values

### 3. Update .env.local

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Emulator Mode (development only)
NEXT_PUBLIC_USE_EMULATOR=false
```

---

## Firebase Setup

### 1. Login to Firebase

```bash
firebase login
```

### 2. Initialize Project

```bash
firebase use --add
# Select your Firebase project
# Give it an alias (e.g., "production")
```

### 3. Enable Authentication Providers

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add OAuth client ID
   - Configure authorized domains

---

## Deploy Firebase Infrastructure

### 1. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**Why first?** Indexes must exist before queries can run.

### 2. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 3. Build and Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..

firebase deploy --only functions
```

**Critical functions**:
- `onUserCreate` - Auto tenant assignment
- `inviteUser` - User invitations
- `updateUserRole` - Role management
- `cleanupRateLimits` - Scheduled cleanup

### 4. Verify Deployment

```bash
# Check Cloud Functions
firebase functions:list

# View logs
firebase functions:log --only onUserCreate
```

---

## Deploy Next.js Application

### Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
npm run build
vercel --prod
```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all Firebase configuration variables
   - Redeploy after adding variables

### Other Platforms

- **Firebase Hosting**: `firebase deploy --only hosting`
- **Netlify**: Connect GitHub repo, configure build settings
- **AWS Amplify**: Connect repo, set build command `npm run build`

---

## Post-Deployment Checklist

### 1. Test Authentication

- ✅ Sign up new user → Verify tenant created
- ✅ Sign in existing user → Verify session works
- ✅ Google OAuth → Verify OAuth flow
- ✅ Sign out → Verify cookie cleared

### 2. Test Multi-Tenancy

- ✅ Create User A in Tenant 1
- ✅ Create User B in Tenant 2
- ✅ Verify User A cannot read User B's data
- ✅ Verify User A cannot write to Tenant 2

### 3. Test Role-Based Access

- ✅ Admin invites user → Verify invitation created
- ✅ Regular user tries to invite → Verify blocked
- ✅ Admin changes user role → Verify role updated
- ✅ User tries to change own role → Verify blocked

### 4. Test Security Rules

- ✅ Try reading document from different tenant → Verify blocked
- ✅ Try updating tenant_id field → Verify blocked
- ✅ Try creating tenant directly → Verify blocked

### 5. Verify Cloud Functions

```bash
# Test onUserCreate
firebase functions:log --only onUserCreate

# Test inviteUser
firebase functions:log --only inviteUser

# Verify no errors
```

---

## Production Configuration

### 1. Configure Auth Edge (next-firebase-auth-edge)

Create `src/config/auth-edge.config.ts`:

```typescript
import { AuthConfig } from 'next-firebase-auth-edge';

export const authConfig: AuthConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  cookieName: 'auth-token',
  cookieSignatureKeys: [
    process.env.COOKIE_SECRET_KEY_CURRENT!,
    process.env.COOKIE_SECRET_KEY_PREVIOUS!,
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true,
    secure: true, // HTTPS only in production
    sameSite: 'lax',
    maxAge: 12 * 24 * 60 * 60 * 1000, // 12 days
  },
  serviceAccount: {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  },
};
```

### 2. Generate Cookie Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to Vercel environment variables:
- `COOKIE_SECRET_KEY_CURRENT`
- `COOKIE_SECRET_KEY_PREVIOUS` (for key rotation)

### 3. Get Service Account Credentials

1. Go to Firebase Console → **Project Settings** → **Service Accounts**
2. Click "Generate new private key"
3. Download JSON file
4. Extract values:
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`

Add to Vercel environment variables.

---

## Monitoring & Logging

### 1. Enable Firebase Logging

```bash
# View real-time logs
firebase functions:log --only onUserCreate --follow

# View specific time range
firebase functions:log --only inviteUser --since 2h
```

### 2. Monitor Performance

1. Go to Firebase Console → **Performance**
2. Review page load times
3. Check for slow queries

### 3. Set Up Alerts

1. Go to Firebase Console → **Alerts**
2. Configure alerts for:
   - Cloud Function errors
   - Authentication failures
   - Firestore quota exceeded

---

## Rollback Procedures

### Rollback Cloud Functions

```bash
# List function versions
firebase functions:list

# Rollback specific function
firebase functions:rollback onUserCreate
```

### Rollback Firestore Rules

```bash
# View rule history in Firebase Console
# Go to Firestore → Rules → History
# Select previous version → Publish
```

### Rollback Next.js App

**Vercel**:
1. Go to Vercel Dashboard → Project → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

---

## Performance Optimization

### 1. Enable Firebase Caching

```typescript
// lib/firebase.ts
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
```

### 2. Optimize Firestore Queries

- Create composite indexes for common queries
- Use pagination (`queryPaginated`) for large result sets
- Avoid querying all documents in collection

### 3. Enable Next.js Production Optimizations

```bash
# Verify build optimizations
npm run build
# Check output for bundle sizes
```

---

## Security Hardening

### 1. Rotate Cookie Secrets

```bash
# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Update Vercel environment variables:
# 1. COOKIE_SECRET_KEY_PREVIOUS = old COOKIE_SECRET_KEY_CURRENT
# 2. COOKIE_SECRET_KEY_CURRENT = NEW_SECRET
# 3. Redeploy
```

### 2. Review Firestore Rules

```bash
# Test rules locally
firebase emulators:start --only firestore
# Go to http://localhost:4000 → Firestore → Rules Simulator
```

### 3. Enable Firebase App Check

1. Go to Firebase Console → **App Check**
2. Register web app
3. Enable reCAPTCHA v3
4. Enforce App Check on Cloud Functions

---

## Related Documentation

- [Development Guide](./development.md) - Local development workflow
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Architecture](./architecture.md) - System architecture overview
