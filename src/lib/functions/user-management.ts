/**
 * User Management Function Wrappers
 *
 * Client-side wrappers for calling Cloud Functions related to user management.
 * These functions provide type-safe interfaces to the backend Cloud Functions.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { UserRole } from '@/types/roles';

/**
 * Type definitions for function parameters and responses
 */

export interface InviteUserData {
  email: string;
  role: UserRole;
  resource_permissions?: Record<string, string[]>;
}

export interface InviteUserResponse {
  success: boolean;
  invitationId: string;
  message: string;
}

export interface UpdateUserRoleData {
  user_id: string;
  new_role: UserRole;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
  old_role: UserRole;
  new_role: UserRole;
}

export interface DeleteUserData {
  user_id: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export interface TransferOwnershipData {
  new_owner_uid: string;
}

export interface TransferOwnershipResponse {
  success: boolean;
  message: string;
  new_owner_email: string;
}

export interface UpdateGuestPermissionsData {
  user_id: string;
  resource_permissions: Record<string, string[]>;
}

export interface UpdateGuestPermissionsResponse {
  success: boolean;
  message: string;
}

/**
 * Error class for Cloud Function errors
 */
export class CloudFunctionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CloudFunctionError';
  }
}

/**
 * Invite a user to the current tenant
 *
 * @param email - Email address of the user to invite
 * @param role - Role to assign (admin, member, guest, viewer)
 * @param resourcePermissions - Optional resource permissions for guest role
 * @returns Promise with invitation details
 * @throws CloudFunctionError if invitation fails
 */
export async function inviteUser(
  email: string,
  role: UserRole,
  resourcePermissions?: Record<string, string[]>
): Promise<InviteUserResponse> {
  try {
    const inviteUserFn = httpsCallable<InviteUserData, InviteUserResponse>(
      functions,
      'inviteUser'
    );

    const result = await inviteUserFn({
      email,
      role,
      resource_permissions: resourcePermissions
    });

    return result.data;
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: unknown };
    throw new CloudFunctionError(
      err.message || 'Failed to invite user',
      err.code || 'unknown',
      err.details
    );
  }
}

/**
 * Update a user's role within the tenant
 *
 * @param userId - UID of the user to update
 * @param newRole - New role to assign
 * @returns Promise with update details
 * @throws CloudFunctionError if update fails
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<UpdateUserRoleResponse> {
  try {
    const updateRoleFn = httpsCallable<UpdateUserRoleData, UpdateUserRoleResponse>(
      functions,
      'updateUserRole'
    );

    const result = await updateRoleFn({
      user_id: userId,
      new_role: newRole
    });

    return result.data;
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: unknown };
    throw new CloudFunctionError(
      err.message || 'Failed to update user role',
      err.code || 'unknown',
      err.details
    );
  }
}

/**
 * Delete a user from the current tenant (soft delete)
 *
 * @param userId - UID of the user to delete
 * @returns Promise with deletion confirmation
 * @throws CloudFunctionError if deletion fails
 */
export async function deleteUserFromTenant(
  userId: string
): Promise<DeleteUserResponse> {
  try {
    const deleteUserFn = httpsCallable<DeleteUserData, DeleteUserResponse>(
      functions,
      'deleteUserFromTenant'
    );

    const result = await deleteUserFn({
      user_id: userId
    });

    return result.data;
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: unknown };
    throw new CloudFunctionError(
      err.message || 'Failed to delete user',
      err.code || 'unknown',
      err.details
    );
  }
}

/**
 * Transfer ownership to another admin user
 * ONLY the current owner can call this function
 *
 * @param newOwnerUid - UID of the admin user to become new owner
 * @returns Promise with transfer details
 * @throws CloudFunctionError if transfer fails
 */
export async function transferOwnership(
  newOwnerUid: string
): Promise<TransferOwnershipResponse> {
  try {
    const transferFn = httpsCallable<TransferOwnershipData, TransferOwnershipResponse>(
      functions,
      'transferOwnership'
    );

    const result = await transferFn({
      new_owner_uid: newOwnerUid
    });

    return result.data;
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: unknown };
    throw new CloudFunctionError(
      err.message || 'Failed to transfer ownership',
      err.code || 'unknown',
      err.details
    );
  }
}

/**
 * Update resource permissions for a guest user
 *
 * @param userId - UID of the guest user
 * @param resourcePermissions - Map of collection names to document IDs
 * @returns Promise with update confirmation
 * @throws CloudFunctionError if update fails
 */
export async function updateGuestPermissions(
  userId: string,
  resourcePermissions: Record<string, string[]>
): Promise<UpdateGuestPermissionsResponse> {
  try {
    const updatePermsFn = httpsCallable<UpdateGuestPermissionsData, UpdateGuestPermissionsResponse>(
      functions,
      'updateGuestPermissions'
    );

    const result = await updatePermsFn({
      user_id: userId,
      resource_permissions: resourcePermissions
    });

    return result.data;
  } catch (error) {
    const err = error as { message?: string; code?: string; details?: unknown };
    throw new CloudFunctionError(
      err.message || 'Failed to update guest permissions',
      err.code || 'unknown',
      err.details
    );
  }
}

/**
 * Helper function to map Firebase error codes to user-friendly messages
 *
 * @param error - CloudFunctionError or generic error
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof CloudFunctionError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'unauthenticated':
        return 'Please sign in to continue.';
      case 'already-exists':
        return 'A user with this email already exists in your organization.';
      case 'not-found':
        return 'User not found.';
      case 'invalid-argument':
        return error.message || 'Invalid input provided.';
      case 'resource-exhausted':
        return 'Your organization has reached the maximum user limit.';
      case 'deadline-exceeded':
        return 'Request timeout. Please try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
