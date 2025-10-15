/**
 * Multi-Tenant Authentication System - Cloud Functions
 *
 * This module exports all Firebase Cloud Functions for the auth system:
 * - Authentication triggers (onUserCreate)
 * - Callable functions (inviteUser, updateUserRole, deleteUserFromTenant)
 * - Scheduled functions (cleanupRateLimits)
 *
 * Security: All functions implement rate limiting and tenant isolation
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Auth Functions - User management
export { onUserCreate } from './auth/onUserCreate';
export { inviteUser } from './auth/inviteUser';
export { updateUserRole } from './auth/updateUserRole';
export { deleteUserFromTenant } from './auth/deleteUserFromTenant';

// Scheduled Functions - Maintenance
export { cleanupRateLimits } from './scheduled/cleanupRateLimits';

// Future GDPR Functions (Post-MVP)
// export { cleanupDeletedData } from './gdpr/cleanupDeletedData';
// export { exportUserData } from './gdpr/exportUserData';
