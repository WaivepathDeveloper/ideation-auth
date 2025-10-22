/**
 * Invitation type definitions
 *
 * Represents pending user invitations to join tenants
 */

import { UserRole } from './roles';

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface InvitationData {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  invited_at: string; // Serialized Timestamp
  expires_at: string; // Serialized Timestamp
  status: InvitationStatus;
  invite_token: string;
  invite_link: string;
  token_used: boolean;
  user_id?: string; // Set when invitation is accepted
  accepted_at?: string; // Serialized Timestamp
  resource_permissions?: Record<string, string[]>; // For guest role
}

/**
 * Invitation data from Firestore (with Timestamp objects)
 */
export interface InvitationFirestoreData {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  invited_at: Date | { seconds: number; nanoseconds: number };
  expires_at: Date | { seconds: number; nanoseconds: number };
  status: InvitationStatus;
  invite_token: string;
  invite_link: string;
  token_used: boolean;
  user_id?: string;
  accepted_at?: Date | { seconds: number; nanoseconds: number };
  resource_permissions?: Record<string, string[]>;
}

/**
 * Invitation validation result
 */
export interface InvitationValidationResult {
  valid: boolean;
  invitation?: InvitationData;
  error?: string;
}

/**
 * Accept invitation result
 */
export interface AcceptInvitationResult {
  success: boolean;
  error?: string;
}

/**
 * Revoke invitation result
 */
export interface RevokeInvitationResult {
  success: boolean;
  error?: string;
}

/**
 * Helper to serialize Firestore Timestamp to ISO string
 */
export function serializeTimestamp(timestamp: Date | { seconds: number; nanoseconds: number } | undefined): string | undefined {
  if (!timestamp) return undefined;

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  // Firestore Timestamp-like object
  return new Date(timestamp.seconds * 1000).toISOString();
}

/**
 * Check if invitation is expired
 */
export function isInvitationExpired(expiresAt: string | Date): boolean {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiryDate < new Date();
}
