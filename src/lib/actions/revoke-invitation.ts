'use server';

/**
 * Server Action: Revoke Invitation
 *
 * Deletes a pending invitation (admin/owner only).
 * Uses Firebase Admin SDK with system privileges.
 *
 * SECURITY:
 * - Validates admin/owner role from session
 * - Validates invitation belongs to current tenant
 * - Creates audit log for revocation
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getCurrentSession } from '@/lib/dal';
import { canManageUsers } from '@/types/roles';
import type { RevokeInvitationResult } from '@/types/invitation';

/**
 * Initialize Firebase Admin SDK
 */
function getAdminFirestore() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  return getFirestore(getApp());
}

/**
 * Revoke an invitation by deleting it
 *
 * @param invitationId - Invitation document ID to revoke
 * @returns Success/error result
 */
export async function revokeInvitation(invitationId: string): Promise<RevokeInvitationResult> {
  try {
    // Validate authentication and authorization
    const session = await getCurrentSession();

    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to revoke invitations',
      };
    }

    if (!canManageUsers(session.role)) {
      return {
        success: false,
        error: 'Only admins and owners can revoke invitations',
      };
    }

    // Validate input
    if (!invitationId) {
      return {
        success: false,
        error: 'Invitation ID is required',
      };
    }

    const db = getAdminFirestore();

    // Get invitation document
    const invitationDoc = await db.collection('invitations').doc(invitationId).get();

    if (!invitationDoc.exists) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    const invitationData = invitationDoc.data();

    // Validate tenant ownership
    if (invitationData?.tenant_id !== session.tenant_id) {
      return {
        success: false,
        error: 'You can only revoke invitations from your own organization',
      };
    }

    // Cannot revoke already accepted invitations
    if (invitationData?.status === 'accepted' || invitationData?.token_used === true) {
      return {
        success: false,
        error: 'Cannot revoke an invitation that has already been accepted',
      };
    }

    // Delete invitation document
    await invitationDoc.ref.delete();

    // Create audit log
    await db.collection('audit_logs').add({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      action: 'INVITATION_REVOKED',
      collection: 'invitations',
      document_id: invitationId,
      timestamp: FieldValue.serverTimestamp(),
      changes: {
        email: invitationData?.email,
        role: invitationData?.role,
      },
    });

    console.log(`Invitation ${invitationId} revoked by user ${session.user_id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return {
      success: false,
      error: 'Failed to revoke invitation. Please try again.',
    };
  }
}
