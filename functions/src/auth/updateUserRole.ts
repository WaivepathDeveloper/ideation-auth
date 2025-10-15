import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { checkAPIRateLimit } from '../utils/rateLimiting';

const db = admin.firestore();

interface UpdateRoleData {
  user_id: string;
  new_role: 'tenant_admin' | 'user';
}

/**
 * Callable Cloud Function: Update user role within tenant
 * Only tenant admins can change roles
 */
export const updateUserRole = functions.https.onCall(async (data: UpdateRoleData, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to update user roles'
    );
  }

  // Rate limiting
  await checkAPIRateLimit(context.auth.uid);

  // Permission check - only tenant admins
  if (context.auth.token.role !== 'tenant_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only tenant administrators can change user roles'
    );
  }

  const { user_id, new_role } = data;
  const caller_tenant_id = context.auth.token.tenant_id as string;

  // Validate input
  if (!user_id) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'user_id is required'
    );
  }

  if (!new_role || !['user', 'tenant_admin'].includes(new_role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'new_role must be either "user" or "tenant_admin"'
    );
  }

  // Prevent self-role-change (prevents admin lockout)
  if (user_id === context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You cannot change your own role'
    );
  }

  // Get target user from Authentication
  let targetUser;
  try {
    targetUser = await admin.auth().getUser(user_id);
  } catch (error) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found in authentication system'
    );
  }

  // Verify user is in same tenant
  if (targetUser.customClaims?.tenant_id !== caller_tenant_id) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User is not in your organization'
    );
  }

  // Get current role from Firestore
  const userDoc = await db.collection('users').doc(user_id).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User profile not found'
    );
  }

  const old_role = userDoc.data()!.role;

  // Check if role actually changed
  if (old_role === new_role) {
    return {
      success: true,
      message: 'User already has this role'
    };
  }

  // Update custom claims (critical for security)
  await admin.auth().setCustomUserClaims(user_id, {
    ...targetUser.customClaims,
    role: new_role
  });

  // Update Firestore user document
  await db.collection('users').doc(user_id).update({
    role: new_role,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_by: context.auth.uid
  });

  // Create audit log
  await db.collection('audit_logs').add({
    tenant_id: caller_tenant_id,
    user_id: context.auth.uid,
    action: 'ROLE_UPDATED',
    collection: 'users',
    document_id: user_id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    changes: {
      old_role,
      new_role,
      target_user_email: targetUser.email
    }
  });

  console.log(`User ${context.auth.uid} changed role of ${targetUser.email} from ${old_role} to ${new_role}`);

  return {
    success: true,
    message: `User role updated to ${new_role}`,
    old_role,
    new_role
  };
});
