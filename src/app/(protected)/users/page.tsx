/**
 * User Management Page (Server Component)
 *
 * Displays a list of users in the current tenant and allows admins/owners to:
 * - Invite new users
 * - Change user roles
 * - Remove users from tenant
 * - Update guest permissions
 *
 * Access: Owner and Admin only
 */

import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { TenantFirestoreAdmin, type QueryResult } from '@/lib/server/TenantFirestoreAdmin';
import { serializeTimestamp } from '@/lib/server/serializers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { InviteUserForm } from '@/components/users/InviteUserForm';
import { UserTable, type User } from '@/components/users/UserTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { UserRole } from '@/types/roles';
import { ROLE_HIERARCHY } from '@/types/roles';

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

  // Map Firestore documents to User type
  // Serialize Timestamp objects to ISO strings for Client Component compatibility
  const users: User[] = usersData.map((doc: QueryResult) => ({
    uid: doc.id,
    email: (doc.email as string) || '',
    display_name: (doc.display_name as string) || (doc.email as string) || 'Unknown User',
    role: (doc.role as UserRole) || 'viewer',
    status: (doc.status as 'active' | 'inactive' | 'suspended') || 'active',
    created_at: serializeTimestamp(doc.created_at),
    last_login: serializeTimestamp(doc.last_login),
    resource_permissions: doc.resource_permissions as Record<string, string[]> | undefined
  }));

  // Sort users by role hierarchy using centralized ROLE_HIERARCHY
  const sortedUsers = users.sort((a, b) => {
    const aOrder = ROLE_HIERARCHY[a.role] || 999;
    const bOrder = ROLE_HIERARCHY[b.role] || 999;
    return aOrder - bOrder;
  });

  return (
    <RoleGuard allowedRoles={['owner', 'admin']} redirectTo="/unauthorized">
      <div
        className="container mx-auto"
        style={{
          padding: 'var(--spacing-lg)',
          maxWidth: '1200px'
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              marginBottom: 'var(--spacing-xs)',
              color: 'hsl(var(--foreground))'
            }}
          >
            User Management
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'hsl(var(--muted-foreground))'
            }}
          >
            Manage your team members, invite new users, and configure roles and permissions.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--spacing-lg)',
            gridTemplateColumns: '1fr'
          }}
        >
          {/* Invite User Form */}
          <InviteUserForm
            currentUserRole={session.role as 'owner' | 'admin'}
            tenantId={session.tenant_id}
          />

          {/* User List Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({sortedUsers.length})</CardTitle>
              <CardDescription>
                View and manage all users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={sortedUsers}
                currentUserRole={session.role as 'owner' | 'admin'}
                currentUserId={session.user_id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
