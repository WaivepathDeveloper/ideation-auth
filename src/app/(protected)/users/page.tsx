/**
 * Settings Page (Server Component)
 *
 * Main settings page with tabs for different configuration sections:
 * - AI Configuration (placeholder)
 * - User Permissions (active - user management)
 * - Notifications (placeholder)
 *
 * Displays:
 * - Current user profile card
 * - Users/Roles view toggle
 * - User management table (invite, change roles, remove)
 *
 * Access: Owner and Admin only
 */

import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { TenantFirestoreAdmin, type QueryResult } from '@/lib/server/TenantFirestoreAdmin';
import { serializeTimestamp } from '@/lib/server/serializers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SettingsPageClient } from '@/components/settings/SettingsPageClient';
import type { UserRole } from '@/types/roles';
import { ROLE_HIERARCHY } from '@/types/roles';
import type { User } from '@/types/user';

export default async function UsersPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  // SECURITY: Initialize TenantFirestoreAdmin with validated session context
  // This ensures all database operations are automatically filtered by tenant_id
  const db = new TenantFirestoreAdmin(session.tenant_id, session.user_id);

  // Fetch all active users in the tenant
  // tenant_id filter is automatically enforced by TenantFirestoreAdmin
  const usersData = await db.query('users', [
    { field: 'status', op: '==', value: 'active' }
  ]);

  // Fetch all pending invitations (not yet accepted)
  const invitationsData = await db.query('invitations', [
    { field: 'status', op: '==', value: 'pending' },
    { field: 'token_used', op: '==', value: false }
  ]);

  // Map Firestore documents to User type
  // Serialize Timestamp objects to ISO strings for Client Component compatibility
  const users: User[] = usersData.map((doc: QueryResult) => ({
    uid: doc.id,
    email: (doc.email as string) || '',
    display_name: (doc.display_name as string) || (doc.email as string) || 'Unknown User',
    role: (doc.role as UserRole) || 'viewer',
    status: 'active' as const,
    created_at: serializeTimestamp(doc.created_at),
    last_login: serializeTimestamp(doc.last_login),
    resource_permissions: doc.resource_permissions as Record<string, string[]> | undefined
  }));

  // Map invitations to User type (with pending/expired status)
  const pendingInvitations: User[] = invitationsData.map((doc: QueryResult) => {
    const expiresAt = doc.expires_at as { seconds: number; nanoseconds: number } | Date | undefined;
    const expiresAtDate = expiresAt
      ? (expiresAt instanceof Date ? expiresAt : new Date(expiresAt.seconds * 1000))
      : new Date();

    const isExpired = expiresAtDate < new Date();

    return {
      uid: doc.id,
      email: (doc.email as string) || '',
      display_name: (doc.email as string) || 'Unknown User',
      role: (doc.role as UserRole) || 'viewer',
      status: isExpired ? 'expired' as const : 'pending' as const,
      created_at: serializeTimestamp(doc.invited_at),
      invite_link: doc.invite_link as string,
      invited_by: doc.invited_by as string,
      expires_at: serializeTimestamp(doc.expires_at),
      resource_permissions: doc.resource_permissions as Record<string, string[]> | undefined
    };
  });

  // Fetch current user's full data for profile card
  const currentUserData = await db.query('users', [
    { field: '__name__', op: '==', value: session.user_id }
  ]);

  const currentUser = currentUserData[0] ? {
    uid: session.user_id,
    email: (currentUserData[0].email as string) || session.email,
    display_name: (currentUserData[0].display_name as string) || session.email || 'User',
    photoURL: (currentUserData[0].photoURL as string) || null,
    role: session.role as UserRole,
  } : {
    uid: session.user_id,
    email: session.email,
    display_name: session.email || 'User',
    photoURL: null,
    role: session.role as UserRole,
  };

  // Merge users and pending invitations
  const allUsers = [...users, ...pendingInvitations];

  // Sort by role hierarchy first, then by status (active first, then pending, then expired)
  const sortedUsers = allUsers.sort((a, b) => {
    // First, sort by role hierarchy
    const aOrder = ROLE_HIERARCHY[a.role] || 999;
    const bOrder = ROLE_HIERARCHY[b.role] || 999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Then sort by status (active first, then pending, then expired)
    const statusOrder = { active: 0, pending: 1, expired: 2, inactive: 3, suspended: 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <RoleGuard allowedRoles={['owner', 'admin']} redirectTo="/unauthorized">
      <SettingsPageClient
        currentUser={currentUser}
        currentUserRole={session.role as 'owner' | 'admin'}
        tenantId={session.tenant_id}
        users={sortedUsers}
        activeUsersCount={users.length}
        pendingInvitationsCount={pendingInvitations.length}
      />
    </RoleGuard>
  );
}
