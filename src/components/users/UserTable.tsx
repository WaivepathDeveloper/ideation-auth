'use client';

/**
 * User Table Component
 *
 * Displays a list of users with their roles, statuses, and action menus.
 * Supports role-based permissions for actions (change role, remove user, etc.)
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/users/RoleBadge';
import { UserActionsMenu } from '@/components/users/UserActionsMenu';

export interface User {
  uid: string;
  email: string;
  display_name: string;
  role: 'owner' | 'admin' | 'member' | 'guest' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string | null; // ISO 8601 string
  last_login?: string | null; // ISO 8601 string
  resource_permissions?: Record<string, string[]>;
}

interface UserTableProps {
  users: User[];
  currentUserRole: 'owner' | 'admin';
  currentUserId: string;
}

export function UserTable({ users, currentUserRole, currentUserId }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'hsl(var(--muted-foreground))'
        }}
      >
        <p style={{ fontSize: '0.875rem' }}>No users found</p>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              {/* Name */}
              <TableCell style={{ fontWeight: '500' }}>
                {user.display_name}
                {user.uid === currentUserId && (
                  <Badge
                    variant="outline"
                    style={{
                      marginLeft: 'var(--spacing-xs)',
                      fontSize: '0.75rem'
                    }}
                  >
                    You
                  </Badge>
                )}
              </TableCell>

              {/* Email */}
              <TableCell style={{ color: 'hsl(var(--muted-foreground))' }}>
                {user.email}
              </TableCell>

              {/* Role Badge */}
              <TableCell>
                <RoleBadge role={user.role} size="sm" />
              </TableCell>

              {/* Status Badge */}
              <TableCell>
                <Badge
                  variant={user.status === 'active' ? 'default' : 'secondary'}
                  style={{
                    backgroundColor:
                      user.status === 'active'
                        ? 'hsl(var(--success) / 0.1)'
                        : 'hsl(var(--muted))',
                    color:
                      user.status === 'active'
                        ? 'hsl(var(--success))'
                        : 'hsl(var(--muted-foreground))',
                    borderColor:
                      user.status === 'active'
                        ? 'hsl(var(--success))'
                        : 'hsl(var(--border))'
                  }}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </TableCell>

              {/* Actions Menu */}
              <TableCell className="text-right">
                <UserActionsMenu
                  user={user}
                  currentUserRole={currentUserRole}
                  currentUserId={currentUserId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
