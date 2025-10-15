import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Wait for custom claims to be set by Cloud Function (Event-Driven Approach)
 *
 * After user signup, the onUserCreate Cloud Function:
 * 1. Sets custom claims (tenant_id, role)
 * 2. Creates user document in /users/{uid}
 *
 * This function listens to the user document creation via Firestore onSnapshot.
 * When the document appears, we know claims are set and ready.
 *
 * @param user - Firebase User object
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Custom claims object with tenant_id and role
 * @throws Error if timeout reached without claims
 */
export async function waitForCustomClaims(
  user: User,
  timeoutMs = 30000
): Promise<{ tenant_id: string; role: string }> {
  console.log('Waiting for user setup completion...');

  return new Promise((resolve, reject) => {
    const userDocRef = doc(db, 'users', user.uid);
    let unsubscribe: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      reject(new Error(
        `Timeout waiting for tenant assignment (${timeoutMs / 1000}s). This usually means:\n` +
        `1. Cloud Functions are not deployed\n` +
        `2. onUserCreate function failed\n` +
        `3. Network connectivity issues\n\n` +
        `Please check Firebase Console > Functions for errors.`
      ));
    }, timeoutMs);

    // Listen for user document creation
    unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          console.log('User document created - fetching custom claims...');

          try {
            // User document exists, so claims are guaranteed to be set
            // Force token refresh to get latest claims
            const token = await user.getIdTokenResult(true);

            if (token.claims.tenant_id && token.claims.role) {
              // Clean up
              if (unsubscribe) unsubscribe();
              if (timeoutId) clearTimeout(timeoutId);

              console.log('Custom claims received successfully');
              resolve({
                tenant_id: token.claims.tenant_id as string,
                role: token.claims.role as string
              });
            } else {
              // Document exists but claims not in token (rare edge case)
              console.warn('User document exists but claims not in token yet, retrying...');
              // Keep listening, timeout will catch if this persists
            }
          } catch (error) {
            // Clean up and reject
            if (unsubscribe) unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
            reject(error);
          }
        }
      },
      (error) => {
        // Error in snapshot listener
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Firestore listener error: ${error.message}`));
      }
    );
  });
}

/**
 * Check if user has required custom claims
 *
 * @param user - Firebase User object
 * @returns True if user has tenant_id and role claims
 */
export async function hasCustomClaims(user: User): Promise<boolean> {
  const token = await user.getIdTokenResult();
  return !!(token.claims.tenant_id && token.claims.role);
}

/**
 * Get custom claims without waiting
 *
 * @param user - Firebase User object
 * @returns Custom claims or null if not set
 */
export async function getCustomClaims(
  user: User
): Promise<{ tenant_id: string; role: string } | null> {
  const token = await user.getIdTokenResult();

  if (token.claims.tenant_id && token.claims.role) {
    return {
      tenant_id: token.claims.tenant_id as string,
      role: token.claims.role as string
    };
  }

  return null;
}
