'use server';

/**
 * Server Action: Accept Invitation
 *
 * Marks an invitation as accepted after successful user signup.
 * Uses Firebase Admin SDK with system privileges to update the invitation.
 *
 * SECURITY:
 * - Token is validated server-side before calling this
 * - Only called after successful Firebase Authentication
 * - Updates via Admin SDK (bypasses Firestore rules)
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { AcceptInvitationResult } from '@/types/invitation';

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for credentials
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
 * Accept an invitation by marking it as used
 *
 * @param token - Invitation token (validated by caller)
 * @param userId - New user's Firebase UID
 * @returns Success/error result
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<AcceptInvitationResult> {
  try {
    // Validate inputs
    if (!token || token.length !== 64) {
      return {
        success: false,
        error: 'Invalid invitation token',
      };
    }

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const db = getAdminFirestore();

    // Find invitation by token
    const invitationsSnapshot = await db
      .collection('invitations')
      .where('invite_token', '==', token)
      .where('token_used', '==', false)
      .limit(1)
      .get();

    if (invitationsSnapshot.empty) {
      return {
        success: false,
        error: 'Invitation not found or already used',
      };
    }

    const invitationDoc = invitationsSnapshot.docs[0];
    const invitationData = invitationDoc.data();

    // Check expiration
    const expiresAt = invitationData.expires_at?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      return {
        success: false,
        error: 'Invitation has expired',
      };
    }

    // Mark invitation as accepted
    await invitationDoc.ref.update({
      token_used: true,
      status: 'accepted',
      user_id: userId,
      accepted_at: FieldValue.serverTimestamp(),
    });

    // Create audit log
    await db.collection('audit_logs').add({
      tenant_id: invitationData.tenant_id,
      user_id: userId,
      action: 'INVITATION_ACCEPTED',
      collection: 'invitations',
      document_id: invitationDoc.id,
      timestamp: FieldValue.serverTimestamp(),
      changes: {
        email: invitationData.email,
        role: invitationData.role,
      },
    });

    console.log(`Invitation ${invitationDoc.id} accepted by user ${userId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: 'Failed to accept invitation. Please try again.',
    };
  }
}
