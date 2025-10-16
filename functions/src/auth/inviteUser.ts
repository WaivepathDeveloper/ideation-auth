import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { checkAPIRateLimit } from '../utils/rateLimiting';

const db = admin.firestore();

interface InviteUserData {
  email: string;
  role: 'admin' | 'member' | 'guest' | 'viewer';
  resource_permissions?: Record<string, string[]>; // For guest role: collection -> document IDs
}

/**
 * Callable Cloud Function: Invite user to tenant
 * Only tenant admins can invite users
 */
export const inviteUser = functions.https.onCall(async (data: InviteUserData, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to invite users'
    );
  }

  // Rate limiting
  await checkAPIRateLimit(context.auth.uid);

  // Permission check - only admins can invite
  if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only Admins and Owners can invite users'
    );
  }

  const { email, role, resource_permissions } = data;
  const tenant_id = context.auth.token.tenant_id as string;

  // Only owner can invite admin
  if (role === 'admin') {
    const tenantDoc = await db.collection('tenants').doc(tenant_id).get();
    if (tenantDoc.data()?.owner_id !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the Owner can invite Admins'
      );
    }
  }

  // Guest role requires resource_permissions
  if (role === 'guest' && !resource_permissions) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Guest role requires resource_permissions map'
    );
  }

  // Validate input
  if (!email || !email.includes('@')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valid email address is required'
    );
  }

  if (!role || !['admin', 'member', 'guest', 'viewer'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be one of: admin, member, guest, viewer'
    );
  }

  // Check if user already exists in tenant
  const existingUser = await db.collection('users')
    .where('tenant_id', '==', tenant_id)
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!existingUser.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'User with this email already exists in your organization'
    );
  }

  // Check for existing pending invitation
  const existingInvite = await db.collection('invitations')
    .where('tenant_id', '==', tenant_id)
    .where('email', '==', email)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingInvite.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Pending invitation already exists for this email'
    );
  }

  // Check tenant user limit
  const tenantDoc = await db.collection('tenants').doc(tenant_id).get();
  const maxUsers = tenantDoc.data()?.settings?.max_users || 50;

  const currentUsers = await db.collection('users')
    .where('tenant_id', '==', tenant_id)
    .where('status', '==', 'active')
    .count()
    .get();

  if (currentUsers.data().count >= maxUsers) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Your organization has reached the maximum user limit of ${maxUsers}`
    );
  }

  // Create invitation
  const inviteData: any = {
    tenant_id,
    email,
    role,
    invited_by: context.auth.uid,
    invited_at: FieldValue.serverTimestamp(),
    status: 'pending',
    expires_at: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };

  // Include resource_permissions for guest role
  if (role === 'guest' && resource_permissions) {
    inviteData.resource_permissions = resource_permissions;
  }

  const inviteRef = await db.collection('invitations').add(inviteData);

  // Create audit log
  await db.collection('audit_logs').add({
    tenant_id,
    user_id: context.auth.uid,
    action: 'INVITATION_CREATED',
    collection: 'invitations',
    document_id: inviteRef.id,
    timestamp: FieldValue.serverTimestamp(),
    changes: {
      email,
      role
    }
  });

  console.log(`User ${context.auth.uid} invited ${email} to tenant ${tenant_id} as ${role}`);

  return {
    success: true,
    invitationId: inviteRef.id,
    message: `Invitation sent to ${email}`
  };
});
