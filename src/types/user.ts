/**
 * User type definitions
 *
 * Represents users and pending invitations in the system
 */

import type { UserRole } from './roles';

/**
 * User status
 * - active: User is active and can access the system
 * - inactive: User account is deactivated
 * - suspended: User account is temporarily suspended
 * - pending: Pending invitation (not yet accepted)
 * - expired: Invitation has expired
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'expired';

/**
 * User interface (includes both active users and pending invitations)
 */
export interface User {
  uid: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string | null; // ISO 8601 string
  last_login?: string | null; // ISO 8601 string
  resource_permissions?: Record<string, string[]>;

  // Invitation-specific fields (only for pending/expired status)
  invite_link?: string;
  invited_by?: string;
  expires_at?: string | null; // ISO 8601 string
}

/**
 * Type guard to check if user is a pending invitation
 */
export function isPendingInvitation(user: User): boolean {
  return user.status === 'pending' || user.status === 'expired';
}

/**
 * Type guard to check if user is active
 */
export function isActiveUser(user: User): boolean {
  return user.status === 'active';
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: UserStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'expired':
    case 'suspended':
      return 'destructive';
    case 'inactive':
      return 'secondary';
  }
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: UserStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'suspended':
      return 'Suspended';
    case 'pending':
      return 'Invited - Pending';
    case 'expired':
      return 'Invited - Expired';
  }
}

/**
 * Get status icon (emoji or SVG name)
 */
export function getStatusIcon(status: UserStatus): string {
  switch (status) {
    case 'active':
      return '🟢';
    case 'inactive':
      return '⚪';
    case 'suspended':
      return '🔴';
    case 'pending':
      return '🟡';
    case 'expired':
      return '🔴';
  }
}
