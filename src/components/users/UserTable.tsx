'use client';

/**
 * User Table Component
 *
 * Displays a list of users with their roles, statuses, and action menus.
 * Supports role-based permissions for actions (change role, remove user, etc.)
 * Also displays pending and expired invitations with appropriate actions.
 */

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/users/RoleBadge';
import { UserActionsMenu } from '@/components/users/UserActionsMenu';
import { UserAvatar } from '@/components/users/UserAvatar';
import type { User } from '@/types/user';
import { getStatusBadgeVariant, getStatusDisplayText, getStatusIcon, isPendingInvitation } from '@/types/user';
import { revokeInvitation } from '@/lib/actions/revoke-invitation';
import { useRouter } from 'next/navigation';

interface UserTableProps {
  users: User[];
  currentUserRole: 'owner' | 'admin';
  currentUserId: string;
}

export function UserTable({ users, currentUserRole, currentUserId }: UserTableProps) {
  const router = useRouter();
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleCopyInviteLink = async (user: User) => {
    if (!user.invite_link) return;

    setCopyingId(user.uid);
    try {
      await navigator.clipboard.writeText(user.invite_link);
      // Show toast notification (you can add a toast library)
      alert('Invitation link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      alert('Failed to copy invitation link');
    } finally {
      setCopyingId(null);
    }
  };

  const handleRevokeInvitation = async (user: User) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${user.email}?`)) {
      return;
    }

    setRevokingId(user.uid);
    try {
      const result = await revokeInvitation(user.uid);
      if (result.success) {
        alert('Invitation revoked successfully');
        router.refresh(); // Refresh to update the list
      } else {
        alert(result.error || 'Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      alert('Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

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
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isPending = isPendingInvitation(user);

            return (
              <TableRow key={user.uid}>
                {/* Avatar */}
                <TableCell>
                  <UserAvatar
                    user={{
                      photoURL: null, // Pending invitations don't have photos
                      display_name: user.display_name,
                      email: user.email,
                    }}
                    size="sm"
                  />
                </TableCell>

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

                {/* Status Badge with Icon */}
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(user.status)}
                    style={{
                      backgroundColor:
                        user.status === 'active'
                          ? 'hsl(var(--success) / 0.1)'
                          : user.status === 'pending'
                          ? 'hsl(142.1 76.2% 36.3% / 0.1)'
                          : user.status === 'expired'
                          ? 'hsl(var(--destructive) / 0.1)'
                          : 'hsl(var(--muted))',
                      color:
                        user.status === 'active'
                          ? 'hsl(var(--success))'
                          : user.status === 'pending'
                          ? 'hsl(142.1 76.2% 36.3%)'
                          : user.status === 'expired'
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--muted-foreground))',
                      borderColor:
                        user.status === 'active'
                          ? 'hsl(var(--success))'
                          : user.status === 'pending'
                          ? 'hsl(142.1 76.2% 36.3%)'
                          : user.status === 'expired'
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--border))'
                    }}
                  >
                    {getStatusIcon(user.status)} {getStatusDisplayText(user.status)}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  {isPending ? (
                    // Invitation-specific actions
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInviteLink(user)}
                        disabled={copyingId === user.uid}
                      >
                        {copyingId === user.uid ? 'Copying...' : 'Copy Link'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeInvitation(user)}
                        disabled={revokingId === user.uid}
                      >
                        {revokingId === user.uid ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </div>
                  ) : (
                    // Regular user actions
                    <UserActionsMenu
                      user={user}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
