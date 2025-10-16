'use client';

/**
 * User Actions Menu Component
 *
 * Dropdown menu for user management actions:
 * - Change Role
 * - Edit Permissions (guest only)
 * - Transfer Ownership (owner to admin only)
 * - Remove User
 */

import { useState } from 'react';
import { MoreVertical, Edit, UserCog, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangeRoleDialog } from '@/components/users/ChangeRoleDialog';
import { RemoveUserDialog } from '@/components/users/RemoveUserDialog';
import { TransferOwnershipDialog } from '@/components/users/TransferOwnershipDialog';
import { EditGuestPermissionsDialog } from '@/components/users/EditGuestPermissionsDialog';
import type { User } from './UserTable';

interface UserActionsMenuProps {
  user: User;
  currentUserRole: 'owner' | 'admin';
  currentUserId: string;
}

export function UserActionsMenu({ user, currentUserRole, currentUserId }: UserActionsMenuProps) {
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeUserOpen, setRemoveUserOpen] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);

  // Determine role hierarchy levels
  const roleLevel: Record<string, number> = {
    owner: 1,
    admin: 2,
    member: 3,
    guest: 4,
    viewer: 5
  };

  const currentUserLevel = roleLevel[currentUserRole];
  const targetUserLevel = roleLevel[user.role];

  // Permission checks
  const isCurrentUser = user.uid === currentUserId;
  const canModifyUser = !isCurrentUser && targetUserLevel > currentUserLevel;
  const canTransferOwnership = currentUserRole === 'owner' && user.role === 'admin' && !isCurrentUser;
  const canEditPermissions = user.role === 'guest';

  // If no actions available, don't show menu
  if (!canModifyUser && !canTransferOwnership) {
    return <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            style={{
              padding: 'var(--spacing-xs)',
              height: 'auto'
            }}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Change Role */}
          {canModifyUser && (
            <DropdownMenuItem onClick={() => setChangeRoleOpen(true)}>
              <UserCog className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuItem>
          )}

          {/* Edit Guest Permissions */}
          {canModifyUser && canEditPermissions && (
            <DropdownMenuItem onClick={() => setEditPermissionsOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Permissions
            </DropdownMenuItem>
          )}

          {/* Transfer Ownership (Owner only, to Admin users) */}
          {canTransferOwnership && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTransferOwnershipOpen(true)}>
                <Crown className="mr-2 h-4 w-4" />
                Transfer Ownership
              </DropdownMenuItem>
            </>
          )}

          {/* Remove User */}
          {canModifyUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setRemoveUserOpen(true)}
                style={{ color: 'hsl(var(--destructive))' }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <ChangeRoleDialog
        user={user}
        currentUserRole={currentUserRole}
        open={changeRoleOpen}
        onOpenChange={setChangeRoleOpen}
      />

      <EditGuestPermissionsDialog
        user={user}
        open={editPermissionsOpen}
        onOpenChange={setEditPermissionsOpen}
      />

      <TransferOwnershipDialog
        user={user}
        open={transferOwnershipOpen}
        onOpenChange={setTransferOwnershipOpen}
      />

      <RemoveUserDialog
        user={user}
        open={removeUserOpen}
        onOpenChange={setRemoveUserOpen}
      />
    </>
  );
}
