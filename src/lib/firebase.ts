/**
 * Firebase Client SDK - Lazy Initialization Pattern
 *
 * This module provides lazy-loaded Firebase service instances.
 * Services are initialized on first access, not at module load time.
 *
 * Benefits:
 * 1. No errors if Firebase config is temporarily unavailable
 * 2. Works with Next.js SSR/CSR/SSG rendering modes
 * 3. Proper singleton pattern prevents duplicate initialization
 * 4. Backward compatible with existing imports
 *
 * Usage:
 * ```typescript
 * import { auth, db, functions } from '@/lib/firebase';
 * // Services auto-initialize on first use
 * const user = await signInWithEmailAndPassword(auth, email, password);
 * ```
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { firebaseConfig, useEmulator, emulatorConfig } from '@/config/firebase.config';

/**
 * Global flag to prevent duplicate emulator connections across Next.js hot reloads
 * Uses global object to persist state across module reloads during development
 */
const EMULATORS_STARTED = '__FIREBASE_EMULATORS_STARTED__';

/**
 * Type declaration for global
 * Allows TypeScript to recognize our custom global property
 */
declare global {
  var __FIREBASE_EMULATORS_STARTED__: boolean | undefined;
}

/**
 * Singleton instances
 * These are initialized lazily (on first access)
 */
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _functions: Functions | null = null;

/**
 * Initialize Firebase App
 *
 * Uses singleton pattern to prevent duplicate initialization.
 * Safe to call multiple times - returns existing instance if available.
 *
 * @returns {FirebaseApp} Firebase app instance
 */
function initializeFirebaseApp(): FirebaseApp {
  if (_app) {
    return _app;
  }

  // Check if another part of the app already initialized Firebase
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return _app;
  }

  // Initialize new Firebase app with validated config
  _app = initializeApp(firebaseConfig);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);
  }

  return _app;
}

/**
 * Initialize all Firebase services
 *
 * Creates all service instances (auth, db, functions) atomically.
 * This ensures emulator connection happens AFTER all services are initialized.
 *
 * CRITICAL: Must initialize ALL services before connecting to emulators
 * to prevent race condition where only first service connects to emulator.
 */
function initializeAllServices() {
  const app = initializeFirebaseApp();

  // Initialize all services if not already initialized
  if (!_auth) {
    _auth = getAuth(app);
  }
  if (!_db) {
    _db = getFirestore(app);
  }
  if (!_functions) {
    _functions = getFunctions(app);
  }
}

/**
 * Connect to Firebase Emulators
 *
 * Attempts to connect to local emulators for development.
 * Uses a global flag to prevent duplicate connections across Next.js hot reloads.
 *
 * IMPORTANT: Only runs once per browser session, even with hot module reloading.
 * If connection fails, throws error to prevent accidental production usage.
 *
 * CRITICAL FIX: Now requires all services to be initialized BEFORE calling this function
 * to prevent race condition where services connect to different environments.
 */
function connectToEmulators() {
  // Extra safety: Never connect to emulators in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Attempted to connect to emulators in production - ignoring');
    return;
  }

  // Check if emulators should be used and if already connected
  if (!useEmulator || global[EMULATORS_STARTED]) {
    return;
  }

  // CRITICAL: All services must be initialized before connecting
  // This prevents the race condition where only the first service connects to emulator
  if (!_auth || !_db || !_functions) {
    throw new Error('BUG: connectToEmulators() called before all services initialized!');
  }

  // Set global flag BEFORE attempting connection
  // This persists across Next.js hot reloads
  global[EMULATORS_STARTED] = true;

  try {
    // Connect Auth Emulator
    connectAuthEmulator(
      _auth,
      emulatorConfig.auth.url,
      emulatorConfig.auth.options
    );

    // Connect Firestore Emulator
    connectFirestoreEmulator(
      _db,
      emulatorConfig.firestore.host,
      emulatorConfig.firestore.port
    );

    // Connect Functions Emulator
    connectFunctionsEmulator(
      _functions,
      emulatorConfig.functions.host,
      emulatorConfig.functions.port
    );

    console.log('✅ Connected to Firebase Emulators:', {
      auth: emulatorConfig.auth.url,
      firestore: `${emulatorConfig.firestore.host}:${emulatorConfig.firestore.port}`,
      functions: `${emulatorConfig.functions.host}:${emulatorConfig.functions.port}`,
    });
  } catch (error) {
    // If connection fails, reset flag so it can be retried
    global[EMULATORS_STARTED] = false;

    // Log detailed error - this is CRITICAL in development
    console.error('❌ CRITICAL: Failed to connect to Firebase Emulators!');
    console.error('This means your app will use PRODUCTION Firebase instead of emulators!');
    console.error('Error details:', error);
    console.error('\nTo fix this:');
    console.error('1. Make sure emulators are running: firebase emulators:start');
    console.error('2. Check that emulator ports match your configuration');
    console.error('3. Restart your Next.js dev server');

    // IMPORTANT: Throw the error instead of silently continuing
    // This prevents accidental writes to production during development
    throw new Error('Failed to connect to Firebase Emulators. See console for details.');
  }
}

/**
 * Get Firebase Authentication instance
 *
 * Lazy initialization - creates ALL services atomically on first call,
 * then connects to emulators if configured.
 * Subsequent calls return the existing instance.
 *
 * @returns {Auth} Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!_auth) {
    initializeAllServices();
    connectToEmulators();
  }
  return _auth!;
}

/**
 * Get Firestore Database instance
 *
 * Lazy initialization - creates ALL services atomically on first call,
 * then connects to emulators if configured.
 * Subsequent calls return the existing instance.
 *
 * @returns {Firestore} Firestore instance
 */
export function getFirebaseDb(): Firestore {
  if (!_db) {
    initializeAllServices();
    connectToEmulators();
  }
  return _db!;
}

/**
 * Get Firebase Functions instance
 *
 * Lazy initialization - creates ALL services atomically on first call,
 * then connects to emulators if configured.
 * Subsequent calls return the existing instance.
 *
 * @returns {Functions} Firebase Functions instance
 */
export function getFirebaseFunctions(): Functions {
  if (!_functions) {
    initializeAllServices();
    connectToEmulators();
  }
  return _functions!;
}

/**
 * Get Firebase App instance
 *
 * @returns {FirebaseApp} Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp {
  return initializeFirebaseApp();
}

/**
 * Backward compatibility exports
 *
 * These allow existing code to continue working:
 * ```typescript
 * import { auth, db, functions } from '@/lib/firebase';
 * ```
 *
 * The instances are created lazily on first access.
 */
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const functions = getFirebaseFunctions();

/**
 * Default export for Firebase app
 */
export default getFirebaseApp();
