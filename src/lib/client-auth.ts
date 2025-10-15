/**
 * Client-Side Authentication Helper Library
 *
 * Provides clean authentication functions for client components (auth forms).
 * Uses Firebase Client SDK + next-firebase-auth-edge cookie pattern.
 *
 * Architecture:
 * 1. Firebase Client SDK handles authentication
 * 2. Get ID token from authenticated user
 * 3. Send token to /api/login to set httpOnly cookie
 * 4. Middleware validates cookie on subsequent requests
 *
 * Security:
 * - No client-side auth state management
 * - httpOnly cookies prevent XSS attacks
 * - Server validates all requests via middleware
 * - Custom claims verified on server (tenant_id, role)
 *
 * Usage:
 * ```typescript
 * import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from '@/lib/client-auth';
 *
 * // In SignUpForm
 * await signUpWithEmail(email, password);
 *
 * // In SignInForm
 * await signInWithEmail(email, password);
 * await signInWithGoogle();
 *
 * // Logout
 * await signOut();
 * ```
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { waitForCustomClaims, hasCustomClaims } from '@/utils/waitForCustomClaims';

/**
 * Call /api/login to set authentication cookie
 *
 * After Firebase authentication, we need to set a signed httpOnly cookie
 * that the middleware can verify on subsequent requests.
 *
 * @param idToken - Firebase ID token
 * @throws Error if cookie creation fails
 */
async function setAuthCookie(idToken: string): Promise<void> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(error.error || 'Failed to set authentication cookie');
  }
}

/**
 * Call /api/logout to clear authentication cookie
 *
 * Clears the httpOnly cookie so middleware will redirect user to login.
 *
 * @throws Error if cookie removal fails (non-critical)
 */
async function clearAuthCookie(): Promise<void> {
  try {
    await fetch('/api/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Non-critical error - user will still be signed out client-side
    console.warn('Failed to clear auth cookie:', error);
  }
}

/**
 * Sign up with email and password
 *
 * Flow:
 * 1. Create Firebase user account
 * 2. Cloud Function (onUserCreate) sets custom claims
 * 3. Wait for custom claims to be set (up to 30 seconds)
 * 4. Get ID token with claims
 * 5. Set authentication cookie
 *
 * @param email - User email
 * @param password - User password
 * @throws Error if signup fails or custom claims timeout
 */
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  // Step 1: Create Firebase user
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Step 2: Wait for Cloud Function to set custom claims
  // onUserCreate function assigns tenant_id and role
  console.log('Waiting for tenant assignment...');
  await waitForCustomClaims(credential.user);

  // Step 3: Get fresh ID token with custom claims
  const idToken = await credential.user.getIdToken(true); // force refresh

  // Step 4: Set authentication cookie
  await setAuthCookie(idToken);

  console.log('Signup successful - authentication cookie set');
}

/**
 * Sign in with email and password
 *
 * Flow:
 * 1. Authenticate with Firebase
 * 2. Get ID token (already has custom claims from previous signup)
 * 3. Set authentication cookie
 *
 * @param email - User email
 * @param password - User password
 * @throws Error if signin fails
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  // Step 1: Authenticate with Firebase
  const credential: UserCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Step 2: Get ID token (user already has custom claims)
  const idToken = await credential.user.getIdToken();

  // Step 3: Set authentication cookie
  await setAuthCookie(idToken);

  console.log('Signin successful - authentication cookie set');
}

/**
 * Sign in with Google OAuth
 *
 * Flow:
 * 1. Open Google OAuth popup
 * 2. Authenticate with Google
 * 3. Check if this is a new user (no custom claims yet)
 * 4. If new user, wait for Cloud Function to set claims
 * 5. Get ID token with claims
 * 6. Set authentication cookie
 *
 * @throws Error if Google signin fails or custom claims timeout
 */
export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();

  // Step 1: Authenticate with Google
  const credential: UserCredential = await signInWithPopup(auth, provider);

  // Step 2: Check if user already has custom claims (returning user vs new signup)
  const hasClaimsAlready = await hasCustomClaims(credential.user);

  if (!hasClaimsAlready) {
    // New user - wait for Cloud Function to set custom claims
    console.log('New Google user - waiting for tenant assignment...');
    await waitForCustomClaims(credential.user);
  }

  // Step 3: Get ID token with custom claims
  const idToken = await credential.user.getIdToken(true); // force refresh

  // Step 4: Set authentication cookie
  await setAuthCookie(idToken);

  console.log('Google signin successful - authentication cookie set');
}

/**
 * Sign out current user
 *
 * Flow:
 * 1. Clear authentication cookie (server-side)
 * 2. Sign out from Firebase (client-side)
 *
 * @throws Error if signout fails (non-critical for cookie clearing)
 */
export async function signOut(): Promise<void> {
  // Step 1: Clear authentication cookie
  await clearAuthCookie();

  // Step 2: Sign out from Firebase
  await firebaseSignOut(auth);

  console.log('Signout successful - cookie cleared');
}

/**
 * Re-export error mapping utility for convenience
 */
export { mapFirebaseError } from '@/lib/validations/auth';
