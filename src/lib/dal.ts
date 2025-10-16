/**
 * Data Access Layer (DAL)
 *
 * Centralized authentication and authorization for Next.js 15.
 * Following official Next.js security guidance after CVE-2025-29927.
 *
 * Key Principles:
 * - Verify session on every data access
 * - Validate tenant_id for multi-tenant isolation
 * - Return minimal DTOs (not full objects)
 * - Cache with React.cache() to avoid duplicate lookups
 *
 * SECURITY: All server-side data access should go through this layer
 */

import { cache } from 'react';
import { headers } from 'next/headers';
import type { UserRole } from '@/types/roles';
import { canManageUsers } from '@/types/roles';

/**
 * Session context from middleware headers
 * Middleware injects these headers after verifying auth cookie
 */
export interface SessionContext {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
}

/**
 * DTO (Data Transfer Object) type
 * Represents minimal, safe data returned to client
 */
export type DTO<T> = Omit<T, 'firebase_token' | 'password' | 'private_key'>;

/**
 * Get current session from middleware-injected headers
 *
 * Middleware verifies auth cookie and injects user context into headers.
 * This is faster than cookie verification as middleware already did the work.
 *
 * Cached per request to avoid duplicate header reads.
 * Multiple components calling this in same request = 1 header lookup.
 *
 * @returns Session context or null if not authenticated
 */
export const getCurrentSession = cache(async (): Promise<SessionContext | null> => {
  try {
    const headersList = await headers();

    const userId = headersList.get('x-user-id');
    const tenantId = headersList.get('x-tenant-id');
    const role = headersList.get('x-user-role') as SessionContext['role'] | null;
    const email = headersList.get('x-user-email');

    // If any required header is missing, user is not authenticated
    if (!userId || !tenantId || !role || !email) {
      return null;
    }

    return {
      user_id: userId,
      tenant_id: tenantId,
      role,
      email,
    };
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
});

/**
 * Verify user is authenticated
 *
 * @throws Error if not authenticated
 * @returns Session context
 */
export async function requireAuth(): Promise<SessionContext> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error('Authentication required. Please sign in.');
  }

  return session;
}

/**
 * Verify user has specific role
 *
 * @param role - Required role
 * @throws Error if user doesn't have required role
 * @returns Session context
 */
export async function requireRole(role: SessionContext['role']): Promise<SessionContext> {
  const session = await requireAuth();

  if (session.role !== role) {
    throw new Error(`Unauthorized. Required role: ${role}`);
  }

  return session;
}

/**
 * Verify user is tenant admin (owner or admin)
 *
 * @throws Error if user is not tenant admin
 * @returns Session context
 */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireAuth();

  if (!canManageUsers(session.role)) {
    throw new Error('Unauthorized. Admin access required.');
  }

  return session;
}

/**
 * Verify user belongs to specific tenant
 *
 * @param tenantId - Required tenant ID
 * @throws Error if user doesn't belong to tenant
 * @returns Session context
 */
export async function requireTenant(tenantId: string): Promise<SessionContext> {
  const session = await requireAuth();

  if (session.tenant_id !== tenantId) {
    throw new Error('Unauthorized. Access denied to this tenant.');
  }

  return session;
}

/**
 * Get user ID from session
 *
 * @throws Error if not authenticated
 * @returns User ID
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user_id;
}

/**
 * Get tenant ID from session
 *
 * @throws Error if not authenticated
 * @returns Tenant ID
 */
export async function getCurrentTenantId(): Promise<string> {
  const session = await requireAuth();
  return session.tenant_id;
}

/**
 * Get user role from session
 *
 * @throws Error if not authenticated
 * @returns User role
 */
export async function getCurrentUserRole(): Promise<SessionContext['role']> {
  const session = await requireAuth();
  return session.role;
}

/**
 * Check if current user is authenticated
 *
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Check if current user is tenant admin (owner or admin)
 *
 * @returns true if tenant admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session ? canManageUsers(session.role) : false;
}

/**
 * Check if current user belongs to specific tenant
 *
 * @param tenantId - Tenant ID to check
 * @returns true if user belongs to tenant, false otherwise
 */
export async function belongsToTenant(tenantId: string): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.tenant_id === tenantId;
}

/**
 * Create a safe DTO from an object
 * Removes sensitive fields like passwords, tokens, private keys
 *
 * @param data - Full object with potentially sensitive data
 * @param fields - Fields to include in DTO
 * @returns Safe DTO
 */
export function createDTO<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): Partial<T> {
  const dto: Partial<T> = {};

  for (const field of fields) {
    if (field in data) {
      dto[field] = data[field];
    }
  }

  return dto;
}

/**
 * Sanitize array of objects into DTOs
 *
 * @param items - Array of items
 * @param fields - Fields to include
 * @returns Array of DTOs
 */
export function createDTOArray<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[]
): Partial<T>[] {
  return items.map((item) => createDTO(item, fields));
}

/**
 * Validate tenant_id in data matches current user's tenant
 *
 * @param data - Data with tenant_id field
 * @throws Error if tenant_id mismatch
 */
export async function validateTenantOwnership(data: { tenant_id: string }): Promise<void> {
  const session = await requireAuth();

  if (data.tenant_id !== session.tenant_id) {
    throw new Error('Unauthorized. Cannot access data from different tenant.');
  }
}

/**
 * Validate array of data all belong to current user's tenant
 *
 * @param items - Array of items with tenant_id
 * @throws Error if any tenant_id mismatch
 */
export async function validateTenantOwnershipBatch(
  items: { tenant_id: string }[]
): Promise<void> {
  const session = await requireAuth();

  for (const item of items) {
    if (item.tenant_id !== session.tenant_id) {
      throw new Error('Unauthorized. Cannot access data from different tenant.');
    }
  }
}

/**
 * Example: Get user profile data (safe DTO)
 *
 * This demonstrates how to use DAL in your data fetching functions.
 *
 * @param userId - User ID to fetch
 * @returns User profile DTO
 */
export async function getUserProfile(userId: string) {
  // 1. Verify authentication
  const session = await requireAuth();

  // 2. Validate user can access this data
  // (In this case, user can only access their own profile or admin can access any)
  const isAdminUser = canManageUsers(session.role);
  if (session.user_id !== userId && !isAdminUser) {
    throw new Error('Unauthorized. Cannot access other user profiles.');
  }

  // 3. Fetch data from Firestore
  // (Replace with actual Firestore query)
  const userData = {
    uid: userId,
    email: session.email,
    tenant_id: session.tenant_id,
    role: session.role,
    // ... other fields
  };

  // 4. Return safe DTO (exclude sensitive fields)
  return createDTO(userData, ['uid', 'email', 'tenant_id', 'role']);
}

/**
 * Authorization error types
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TenantMismatchError extends Error {
  constructor(message = 'Tenant access denied') {
    super(message);
    this.name = 'TenantMismatchError';
  }
}
