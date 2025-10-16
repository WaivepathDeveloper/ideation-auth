/**
 * Firebase Admin SDK for Server-Side Operations
 *
 * SECURITY CRITICAL:
 * - Only accessible from server-side code (Next.js Server Components, API Routes, Server Actions)
 * - Never exposed to client
 * - Singleton pattern prevents duplicate initialization
 * - Bypasses Firestore security rules (use with TenantFirestoreAdmin wrapper only)
 *
 * Usage:
 * ```typescript
 * import { getAdminDb } from '@/lib/server/firebase-admin';
 * const db = getAdminDb();
 * ```
 *
 * WARNING: Never use Admin SDK directly for queries. Always use TenantFirestoreAdmin wrapper
 * to ensure tenant isolation and security validation.
 */

import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;
let isEmulatorConfigured = false;

/**
 * Initialize Firebase Admin SDK
 *
 * Initialization strategy:
 * 1. Production: Uses FIREBASE_SERVICE_ACCOUNT environment variable
 * 2. Development (emulators): Uses project ID from NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * 3. Fallback: Application Default Credentials (Google Cloud environments)
 *
 * @returns Firebase Admin App instance
 */
export function initializeAdminApp(): admin.app.App {
  // Check if already initialized
  const existingApps = admin.apps;
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  // Production: Use service account from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT environment variable');
    }
  }

  // Development with emulators: Minimal initialization
  if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID required for emulator mode');
    }

    console.log(`🔥 Initializing Firebase Admin SDK for emulator (project: ${projectId})`);

    return admin.initializeApp({
      projectId,
    });
  }

  // Fallback: Application Default Credentials (for Google Cloud environments)
  try {
    console.log('🔥 Initializing Firebase Admin SDK with Application Default Credentials');
    return admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw new Error(
      'Firebase Admin SDK initialization failed. ' +
      'Set FIREBASE_SERVICE_ACCOUNT environment variable or use Application Default Credentials.'
    );
  }
}

/**
 * Get Admin Firestore instance
 *
 * SECURITY WARNING:
 * - Admin SDK bypasses Firestore security rules
 * - ONLY use through TenantFirestoreAdmin wrapper
 * - Direct usage risks cross-tenant data leaks
 *
 * This function is exported for TenantFirestoreAdmin wrapper only.
 * Do NOT use directly in application code.
 *
 * @returns Firestore instance with Admin SDK privileges
 */
export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    const app = initializeAdminApp();
    adminDb = admin.firestore(app);

    // Connect to emulator if in development (only configure once)
    if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' && !isEmulatorConfigured) {
      console.log('🔥 Connecting Admin SDK to Firestore emulator (localhost:8080)');

      try {
        adminDb.settings({
          host: 'localhost:8080',
          ssl: false,
        });
        isEmulatorConfigured = true;
      } catch (error) {
        // Settings already configured (hot reload), ignore error
        if (error instanceof Error && error.message.includes('already been initialized')) {
          console.log('⚠️ Firestore settings already configured (hot reload detected)');
          isEmulatorConfigured = true;
        } else {
          throw error;
        }
      }
    }
  }

  return adminDb;
}

/**
 * Get Admin Auth instance
 *
 * Used for user management operations (e.g., updating custom claims)
 * This is safe to use directly as Auth operations are already tenant-scoped
 *
 * @returns Firebase Auth instance
 */
export function getAdminAuth(): admin.auth.Auth {
  const app = initializeAdminApp();
  return admin.auth(app);
}

/**
 * Server-side timestamp utility
 * Consistent with Cloud Functions usage
 *
 * @returns FieldValue for server timestamp
 */
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

/**
 * Re-export FieldValue for convenience
 */
export const FieldValue = admin.firestore.FieldValue;
