'use client';

/**
 * Change Role Dialog Component
 *
 * Allows owners/admins to change a user's role with proper permission checks.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { updateUserRole, getErrorMessage } from '@/lib/functions/user-management';
import type { UserRole } from '@/types/roles';
import type { User } from './UserTable';

interface ChangeRoleDialogProps {
  user: User;
  currentUserRole: 'owner' | 'admin';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({ user, currentUserRole, open, onOpenChange }: ChangeRoleDialogProps) {
  const router = useRouter();
  const [newRole, setNewRole] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine available roles based on current user's role
  const availableRoles: UserRole[] = currentUserRole === 'owner'
    ? ['admin', 'member', 'guest', 'viewer']
    : ['member', 'guest', 'viewer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newRole === user.role) {
      setError('Please select a different role');
      return;
    }

    setLoading(true);

    try {
      await updateUserRole(user.uid, newRole);

      // Success - close dialog and refresh
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {user.display_name} ({user.email})
            </DialogDescription>
          </DialogHeader>

          <div style={{ padding: 'var(--spacing-md) 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current Role */}
            <div>
              <Label>Current Role</Label>
              <p style={{
                marginTop: 'var(--spacing-xs)',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))'
              }}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>

            {/* New Role Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <Label htmlFor="new-role">New Role *</Label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as UserRole)}
                disabled={loading}
                required
              >
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newRole === user.role}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
