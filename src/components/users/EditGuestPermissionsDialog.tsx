'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { updateGuestPermissions, getErrorMessage } from '@/lib/functions/user-management';
import type { User } from './UserTable';

interface EditGuestPermissionsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGuestPermissionsDialog({ user, open, onOpenChange }: EditGuestPermissionsDialogProps) {
  const router = useRouter();
  const [permissions, setPermissions] = useState(
    JSON.stringify(user.resource_permissions || {}, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const parsedPermissions = JSON.parse(permissions);
      await updateGuestPermissions(user.uid, parsedPermissions);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Guest Permissions</DialogTitle>
            <DialogDescription>
              Configure resource-specific access for {user.display_name}
            </DialogDescription>
          </DialogHeader>

          <div style={{ padding: 'var(--spacing-md) 0' }}>
            {error && (
              <Alert variant="destructive" style={{ marginBottom: 'var(--spacing-md)' }}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Label htmlFor="permissions">Resource Permissions (JSON)</Label>
            <textarea
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              disabled={loading}
              rows={10}
              style={{
                width: '100%',
                marginTop: 'var(--spacing-xs)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
