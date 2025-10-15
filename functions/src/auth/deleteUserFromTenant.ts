import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { checkAPIRateLimit } from '../utils/rateLimiting';

const db = admin.firestore();

interface DeleteUserData {
  user_id: string;
  hard_delete?: boolean; // For GDPR compliance (future use)
}

/**
 * Callable Cloud Function: Remove user from tenant (soft delete)
 * Only tenant admins can delete users
 * Implements soft delete for audit trail and 30-day recovery period
 */
export const deleteUserFromTenant = functions.https.onCall(async (data: DeleteUserData, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to delete users'
    );
  }

  // Rate limiting
  await checkAPIRateLimit(context.auth.uid);

  // Permission check - only tenant admins
  if (context.auth.token.role !== 'tenant_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only tenant administrators can delete users'
    );
  }

  const { user_id, hard_delete = false } = data;
  const caller_tenant_id = context.auth.token.tenant_id as string;

  // Validate input
  if (!user_id) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'user_id is required'
    );
  }

  // Prevent self-deletion (prevents admin lockout)
  if (user_id === context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You cannot delete yourself. Transfer admin privileges first.'
    );
  }

  // Get user document to verify tenant
  const userDoc = await db.collection('users').doc(user_id).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found'
    );
  }

  const userData = userDoc.data()!;

  // Verify user is in same tenant
  if (userData.tenant_id !== caller_tenant_id) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User is not in your organization'
    );
  }

  // Check if already deleted
  if (userData.status === 'deleted') {
    return {
      success: true,
      message: 'User already deleted'
    };
  }

  if (hard_delete) {
    // Hard delete (GDPR compliance - future use)
    // This should only be used after 30-day soft delete period

    // 1. Delete user from Firestore
    await db.collection('users').doc(user_id).delete();

    // 2. Delete user from Authentication
    try {
      await admin.auth().deleteUser(user_id);
    } catch (error) {
      console.error(`Failed to delete user ${user_id} from auth:`, error);
    }

    // 3. Keep audit log of deletion
    await db.collection('audit_logs').add({
      tenant_id: caller_tenant_id,
      user_id: context.auth.uid,
      action: 'USER_HARD_DELETED',
      collection: 'users',
      document_id: user_id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        deleted_user_email: userData.email,
        deletion_type: 'hard'
      }
    });

    console.log(`User ${user_id} permanently deleted by ${context.auth.uid}`);

    return {
      success: true,
      message: 'User permanently deleted'
    };
  } else {
    // Soft delete (default - recommended)

    // 1. Mark as deleted in Firestore
    await db.collection('users').doc(user_id).update({
      status: 'deleted',
      deleted_at: admin.firestore.FieldValue.serverTimestamp(),
      deleted_by: context.auth.uid,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Revoke custom claims (removes access immediately)
    await admin.auth().setCustomUserClaims(user_id, null);

    // 3. Create audit log
    await db.collection('audit_logs').add({
      tenant_id: caller_tenant_id,
      user_id: context.auth.uid,
      action: 'USER_DELETED',
      collection: 'users',
      document_id: user_id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        deleted_user_email: userData.email,
        deletion_type: 'soft',
        recoverable_until: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    console.log(`User ${user_id} soft deleted by ${context.auth.uid}`);

    return {
      success: true,
      message: 'User removed from organization',
      recoverable_for_days: 30
    };
  }
});
