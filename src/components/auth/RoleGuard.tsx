import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/roles';
import { ROLE_HIERARCHY } from '@/types/roles';

/**
 * Extended role type to support legacy roles from DAL (temporary during migration)
 */
type SessionRole = 'tenant_admin' | 'user' | UserRole;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard Component
 *
 * Server Component that enforces role-based access control.
 * Verifies user session from DAL and checks if user has required role.
 *
 * Security Features:
 * - Server-side session verification (no client-side bypass)
 * - Validates role from middleware-injected headers
 * - Supports redirect or fallback for unauthorized access
 * - Type-safe role checking
 *
 * Role Mapping (for backward compatibility):
 * - 'tenant_admin' (legacy) → 'admin' role
 * - 'user' (legacy) → 'member' role
 *
 * @param children - Content to render if authorized
 * @param allowedRoles - Array of roles that can access this content
 * @param fallback - Optional component to show if unauthorized (instead of redirect)
 * @param redirectTo - Optional path to redirect to if unauthorized (e.g., '/unauthorized')
 *
 * @example
 * // Only owners and admins can see this
 * <RoleGuard allowedRoles={['owner', 'admin']} redirectTo="/unauthorized">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Show fallback message for unauthorized users
 * <RoleGuard
 *   allowedRoles={['owner']}
 *   fallback={<p>Only owners can access this.</p>}
 * >
 *   <BillingSettings />
 * </RoleGuard>
 */
export async function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  // Get session from DAL (middleware-injected headers)
  const session = await getCurrentSession();

  // Not authenticated
  if (!session) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return fallback || null;
  }

  // Map legacy roles to new role system
  const normalizedRole = normalizeRole(session.role);

  // Check if user has required role
  if (!allowedRoles.includes(normalizedRole)) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    return fallback || null;
  }

  // Authorized - render children
  return <>{children}</>;
}

/**
 * Normalize legacy roles to new role system
 *
 * Maps:
 * - 'tenant_admin' → 'admin' (legacy role, not owner)
 * - 'user' → 'member'
 * - Other roles pass through unchanged
 *
 * @param role - Role from session
 * @returns Normalized role
 */
function normalizeRole(role: SessionRole): UserRole {
  const roleMap: Record<string, UserRole> = {
    tenant_admin: 'admin',
    user: 'member',
  };

  return (roleMap[role] as UserRole) || (role as UserRole);
}

/**
 * Check if user has minimum required role level
 *
 * Uses centralized ROLE_HIERARCHY from @/types/roles
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
