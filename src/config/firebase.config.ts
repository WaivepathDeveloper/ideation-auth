/**
 * Firebase Configuration with Zod Validation
 *
 * This module provides:
 * 1. Runtime validation of Firebase environment variables using Zod
 * 2. Type-safe config object with TypeScript inference
 * 3. Detailed error messages for missing/invalid configuration
 *
 * IMPORTANT: All process.env references are STATIC (not dynamic) so Webpack
 * can inline them at build time. This fixes the "undefined in browser" issue.
 */

import { z } from 'zod';

/**
 * Zod schema for Firebase configuration
 * Validates the Firebase config object structure
 */
const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, 'Firebase API Key is required'),
  authDomain: z.string().min(1, 'Firebase Auth Domain is required'),
  projectId: z.string().min(1, 'Firebase Project ID is required'),
  storageBucket: z.string().min(1, 'Firebase Storage Bucket is required'),
  messagingSenderId: z.string().min(1, 'Firebase Messaging Sender ID is required'),
  appId: z.string().min(1, 'Firebase App ID is required'),
});

/**
 * TypeScript type inferred from Zod schema
 * Use this type throughout the codebase for type safety
 */
export type FirebaseConfig = z.infer<typeof firebaseConfigSchema>;

/**
 * Zod schema for environment variables
 * Validates that all required NEXT_PUBLIC_* variables are present
 */
const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'API Key cannot be empty'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Auth Domain cannot be empty'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Project ID cannot be empty'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Storage Bucket cannot be empty'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Messaging Sender ID cannot be empty'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'App ID cannot be empty'),
  NEXT_PUBLIC_USE_EMULATOR: z.enum(['true', 'false']).optional(),
});

/**
 * Parse and validate Firebase environment variables
 *
 * This function:
 * 1. Collects all env vars using STATIC references (Webpack can inline these)
 * 2. Validates them with Zod schema
 * 3. Returns a validated FirebaseConfig object
 * 4. Throws detailed error if validation fails
 *
 * @throws {Error} If any required environment variables are missing or invalid
 * @returns {FirebaseConfig} Validated Firebase configuration
 */
function getFirebaseConfig(): FirebaseConfig {
  // IMPORTANT: Use STATIC references to process.env properties
  // This allows Webpack to inline these values at build time
  // Dynamic access like process.env[varName] WILL NOT WORK
  const rawEnv = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_USE_EMULATOR: process.env.NEXT_PUBLIC_USE_EMULATOR,
  };

  // Validate environment variables with Zod
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    // Extract missing/invalid variables for error message
    const missingVars = result.error.issues.map(issue => issue.path.join('.'));

    // Throw detailed error with helpful information
    throw new Error(
      `❌ Missing or invalid Firebase environment variables:\n\n` +
      `Missing: ${missingVars.join(', ')}\n\n` +
      `Please check your .env.local file. See .env.local.example for reference.\n\n` +
      `Detailed validation errors:\n${result.error.issues.map(i => `  - ${i.path}: ${i.message}`).join('\n')}\n\n` +
      `Make sure you have:\n` +
      `1. Created .env.local file (copy from .env.local.example)\n` +
      `2. Added your Firebase project credentials\n` +
      `3. Restarted the development server after adding env vars`
    );
  }

  // Transform validated env vars into Firebase config format
  const config: FirebaseConfig = {
    apiKey: result.data.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: result.data.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: result.data.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: result.data.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: result.data.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: result.data.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Final validation of Firebase config structure
  return firebaseConfigSchema.parse(config);
}

/**
 * Validated and type-safe Firebase configuration
 *
 * This is evaluated at module load time (both server and client).
 * If validation fails, the error will be thrown immediately with
 * helpful debugging information.
 *
 * Usage:
 * ```typescript
 * import { firebaseConfig } from '@/config/firebase.config';
 * const app = initializeApp(firebaseConfig);
 * ```
 */
export const firebaseConfig = getFirebaseConfig();

/**
 * Check if Firebase emulators should be used
 *
 * Emulators are only enabled when:
 * 1. NODE_ENV is 'development'
 * 2. NEXT_PUBLIC_USE_EMULATOR is explicitly set to 'true'
 *
 * This prevents accidental emulator usage in production.
 */
export const useEmulator =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

/**
 * Emulator connection details
 *
 * Default ports as per Firebase documentation:
 * https://firebase.google.com/docs/emulator-suite/connect_and_prototype
 */
export const emulatorConfig = {
  auth: {
    url: 'http://localhost:9099',
    options: { disableWarnings: true },
  },
  firestore: {
    host: 'localhost',
    port: 8080,
  },
  functions: {
    host: 'localhost',
    port: 5001,
  },
  storage: {
    host: 'localhost',
    port: 9199,
  },
} as const;
