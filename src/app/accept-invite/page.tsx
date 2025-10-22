/**
 * Accept Invitation Page (Server Component)
 *
 * Token validation and invitation context display.
 * Extracts token from URL, validates server-side, passes data to client.
 *
 * SECURITY:
 * - Server-side token validation only
 * - Never trust client-sent token without verification
 * - Uses Firebase Admin SDK for privileged operations
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { redirect } from 'next/navigation';
import AcceptInviteForm from '@/components/auth/AcceptInviteForm';
import type { InvitationFirestoreData } from '@/types/invitation';
import { serializeTimestamp, isInvitationExpired } from '@/types/invitation';

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

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const params = await searchParams;
  const token = params.token;

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation Link</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is missing required information. Please check the link and try again.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token format
  if (token.length !== 64) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation Token</h2>
            <p className="text-gray-600 mb-6">
              This invitation link appears to be corrupted. Please request a new invitation.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  try {
    const db = getAdminFirestore();

    // Query invitation by token
    const invitationsSnapshot = await db
      .collection('invitations')
      .where('invite_token', '==', token)
      .where('token_used', '==', false)
      .limit(1)
      .get();

    // Invitation not found or already used
    if (invitationsSnapshot.empty) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Invitation</h2>
              <p className="text-gray-600 mb-6">
                This invitation link has either been used, expired, or was revoked. Please contact the person who invited you to request a new invitation.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      );
    }

    const invitationDoc = invitationsSnapshot.docs[0];
    const invitationData = invitationDoc.data() as Omit<InvitationFirestoreData, 'id'>;

    // Check expiration
    const expiresAt = invitationData.expires_at instanceof Date
      ? invitationData.expires_at
      : new Date(invitationData.expires_at.seconds * 1000);

    if (expiresAt < new Date()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h2>
              <p className="text-gray-600 mb-6">
                This invitation link expired on {expiresAt.toLocaleDateString()}. Please contact the person who invited you to request a new invitation.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Get tenant name
    const tenantDoc = await db.collection('tenants').doc(invitationData.tenant_id).get();
    const tenantName = tenantDoc.exists ? tenantDoc.data()?.name || 'Unknown Organization' : 'Unknown Organization';

    // Get inviter info
    const inviterDoc = await db.collection('users').doc(invitationData.invited_by).get();
    const inviterEmail = inviterDoc.exists ? inviterDoc.data()?.email || 'Unknown' : 'Unknown';

    // Serialize invitation data for client
    const serializedInvitation = {
      id: invitationDoc.id,
      tenant_id: invitationData.tenant_id,
      email: invitationData.email,
      role: invitationData.role,
      invited_by: invitationData.invited_by,
      invited_at: serializeTimestamp(invitationData.invited_at) || '',
      expires_at: serializeTimestamp(invitationData.expires_at) || '',
      status: invitationData.status,
      invite_token: invitationData.invite_token,
      invite_link: invitationData.invite_link,
      token_used: invitationData.token_used,
      resource_permissions: invitationData.resource_permissions,
    };

    // Pass to client component with additional context
    return (
      <AcceptInviteForm
        invitation={serializedInvitation}
        tenantName={tenantName}
        inviterEmail={inviterEmail}
      />
    );
  } catch (error) {
    console.error('Error validating invitation:', error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while validating your invitation. Please try again later or contact support.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
}
