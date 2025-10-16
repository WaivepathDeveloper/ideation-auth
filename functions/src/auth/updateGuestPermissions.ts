import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { FieldValue } from 'firebase-admin/firestore';
import { checkAPIRateLimit } from '../utils/rateLimiting';

const db = admin.firestore();

interface UpdateGuestPermissionsData {
  user_id: string;
  resource_permissions: {
    [collection: string]: string[]; // collection -> document IDs
  };
}

/**
 * Callable Cloud Function: Update resource_permissions for guest users
 * Only admin or owner can call this
 */
export const updateGuestPermissions = functions.https.onCall(async (data: UpdateGuestPermissionsData, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to update guest permissions'
    );
  }

  // Rate limiting
  await checkAPIRateLimit(context.auth.uid);

  // Permission check - only admin or owner
  const callerRole = context.auth.token.role as string;
  if (callerRole !== 'admin' && callerRole !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only Admins and Owners can update guest permissions'
    );
  }

  const { user_id, resource_permissions } = data;
  const tenant_id = context.auth.token.tenant_id as string;

  // Validate input
  if (!user_id) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'user_id is required'
    );
  }

  if (!resource_permissions || typeof resource_permissions !== 'object') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'resource_permissions must be an object'
    );
  }

  // Get target user
  const userDoc = await db.collection('users').doc(user_id).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found'
    );
  }

  const userData = userDoc.data()!;

  // Verify user is in same tenant
  if (userData.tenant_id !== tenant_id) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User is not in your organization'
    );
  }

  // Verify user is a guest
  if (userData.role !== 'guest') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User must have Guest role to update resource permissions'
    );
  }

  // Update resource_permissions in Firestore
  await db.collection('users').doc(user_id).update({
    resource_permissions,
    updated_at: FieldValue.serverTimestamp(),
    updated_by: context.auth.uid
  });

  // Update custom claims to include resource_permissions
  const userAuth = await admin.auth().getUser(user_id);
  await admin.auth().setCustomUserClaims(user_id, {
    ...userAuth.customClaims,
    resource_permissions
  });

  // Create audit log
  await db.collection('audit_logs').add({
    tenant_id,
    user_id: context.auth.uid,
    action: 'GUEST_PERMISSIONS_UPDATED',
    collection: 'users',
    document_id: user_id,
    timestamp: FieldValue.serverTimestamp(),
    changes: {
      target_user_email: userAuth.email,
      resource_permissions
    }
  });

  console.log(`Guest permissions updated for ${userAuth.email} by ${context.auth.uid}`);

  return {
    success: true,
    message: 'Guest permissions updated successfully'
  };
});
