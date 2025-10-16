/**
 * Centralized Role Definitions for Multi-Tenant System
 *
 * Single source of truth for all role-related logic.
 * All role type definitions and utilities should reference this file.
 *
 * Role Hierarchy (lower number = higher privilege):
 * 1. owner   - Full access, can transfer ownership
 * 2. admin   - Can manage users and settings
 * 3. member  - Can create and edit data
 * 4. guest   - Limited access to specific resources
 * 5. viewer  - Read-only access
 */

export type UserRole = 'owner' | 'admin' | 'member' | 'guest' | 'viewer';

/**
 * Role hierarchy for privilege comparisons
 * Lower number = higher privilege level
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 1,
  admin: 2,
  member: 3,
  guest: 4,
  viewer: 5,
};

/**
 * Human-readable role labels for UI display
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
  viewer: 'Viewer',
};

/**
 * Role descriptions for help text
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full access to all features including ownership transfer and billing',
  admin: 'Can manage users, invite members, and configure settings',
  member: 'Can create, edit, and delete data within the organization',
  guest: 'Limited access to specific resources defined by permissions',
  viewer: 'Read-only access to organization data',
};

/**
 * Check if user has minimum required role level
 *
 * Example: If requiredRole is 'member', users with 'owner', 'admin', or 'member' pass
 *
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns true if user meets minimum role requirement
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can manage other users
 * Only owner and admin can invite, remove, or change roles
 *
 * @param role - User's role
 * @returns true if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if user can edit data (create, update, delete)
 * Owner, admin, and member have edit permissions
 *
 * @param role - User's role
 * @returns true if user can edit data
 */
export function canEditData(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/**
 * Check if user has read-only access
 *
 * @param role - User's role
 * @returns true if user is viewer (read-only)
 */
export function isReadOnly(role: UserRole): boolean {
  return role === 'viewer';
}

/**
 * Check if user is guest (resource-specific permissions)
 *
 * @param role - User's role
 * @returns true if user is guest
 */
export function isGuest(role: UserRole): boolean {
  return role === 'guest';
}

/**
 * Get roles that can be assigned by a specific role
 *
 * @param assignerRole - Role of the user doing the assignment
 * @returns Array of roles that can be assigned
 */
export function getAssignableRoles(assignerRole: UserRole): UserRole[] {
  if (assignerRole === 'owner') {
    // Owner can assign all roles except owner itself
    return ['admin', 'member', 'guest', 'viewer'];
  }

  if (assignerRole === 'admin') {
    // Admin can assign member, guest, viewer
    return ['member', 'guest', 'viewer'];
  }

  // Other roles cannot assign roles
  return [];
}

/**
 * Validate if role exists in the system
 *
 * @param role - Role string to validate
 * @returns true if role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ['owner', 'admin', 'member', 'guest', 'viewer'].includes(role);
}
