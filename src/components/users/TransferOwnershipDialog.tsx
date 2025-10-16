'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Crown } from 'lucide-react';
import { transferOwnership, getErrorMessage } from '@/lib/functions/user-management';
import type { User } from './UserTable';

interface TransferOwnershipDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipDialog({ user, open, onOpenChange }: TransferOwnershipDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    setError(null);
    setLoading(true);

    try {
      await transferOwnership(user.uid);
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
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer full ownership to {user.display_name}
          </DialogDescription>
        </DialogHeader>

        <div style={{ padding: 'var(--spacing-md) 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', borderColor: 'hsl(var(--warning))' }}>
            <AlertDescription>
              You will become an Admin and {user.display_name} will become the Owner. This cannot be undone without their permission.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleTransfer} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transferring...</> : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
