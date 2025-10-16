'use client';

/**
 * Remove User Dialog Component
 *
 * Confirmation dialog for removing a user from the tenant (soft delete).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { deleteUserFromTenant, getErrorMessage } from '@/lib/functions/user-management';
import type { User } from './UserTable';

interface RemoveUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveUserDialog({ user, open, onOpenChange }: RemoveUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setError(null);
    setLoading(true);

    try {
      await deleteUserFromTenant(user.uid);

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
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this user from your organization?
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

          {/* Warning */}
          <Alert style={{
            backgroundColor: 'hsl(var(--warning) / 0.1)',
            borderColor: 'hsl(var(--warning))'
          }}>
            <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
            <AlertDescription style={{ color: 'hsl(var(--warning-foreground))' }}>
              This action will remove access for <strong>{user.display_name}</strong> ({user.email}).
              They will no longer be able to access your organization&apos;s data.
            </AlertDescription>
          </Alert>

          {/* User Details */}
          <div style={{
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'hsl(var(--muted))',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xs)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Name</span>
              <span style={{ fontWeight: '500' }}>{user.display_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Email</span>
              <span style={{ fontWeight: '500' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>Role</span>
              <span style={{ fontWeight: '500' }}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
