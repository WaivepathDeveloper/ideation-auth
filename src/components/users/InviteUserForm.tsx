'use client';

/**
 * Invite User Form Component
 *
 * Allows owners and admins to invite new users to the tenant.
 * Owners can invite admins. Admins can invite members, guests, and viewers.
 * Guest invitations require resource permissions configuration.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { inviteUser, getErrorMessage } from '@/lib/functions/user-management';
import type { UserRole } from '@/types/roles';

// Validation schema
const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'guest', 'viewer'], {
    required_error: 'Please select a role'
  }),
  resource_permissions: z.string().optional()
}).refine((data) => {
  // Guest role requires resource_permissions
  if (data.role === 'guest' && !data.resource_permissions) {
    return false;
  }
  return true;
}, {
  message: 'Guest role requires resource permissions',
  path: ['resource_permissions']
});

interface InviteUserFormProps {
  currentUserRole: 'owner' | 'admin';
  tenantId: string;
}

export function InviteUserForm({ currentUserRole }: InviteUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [resourcePermissions, setResourcePermissions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Determine available roles based on current user's role
  const availableRoles: UserRole[] = currentUserRole === 'owner'
    ? ['admin', 'member', 'guest', 'viewer']
    : ['member', 'guest', 'viewer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    // Validate form data
    const validation = inviteUserSchema.safeParse({
      email,
      role,
      resource_permissions: resourcePermissions
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Parse resource permissions for guest role
      let parsedPermissions: Record<string, string[]> | undefined;
      if (role === 'guest' && resourcePermissions) {
        try {
          parsedPermissions = JSON.parse(resourcePermissions);
        } catch {
          setError('Invalid JSON format for resource permissions');
          setLoading(false);
          return;
        }
      }

      // Call Cloud Function
      const result = await inviteUser(email, role as UserRole, parsedPermissions);

      // Success
      setSuccess(result.message || `Invitation sent to ${email}`);

      // Reset form
      setEmail('');
      setRole('');
      setResourcePermissions('');

      // Refresh page to show new pending invitation
      setTimeout(() => {
        router.refresh();
        setSuccess(null);
      }, 2000);

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite User
        </CardTitle>
        <CardDescription>
          {currentUserRole === 'owner'
            ? 'Invite admins, members, guests, or viewers to your organization'
            : 'Invite members, guests, or viewers to your team'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Success Alert */}
          {success && (
            <Alert style={{
              backgroundColor: 'hsl(var(--success) / 0.1)',
              borderColor: 'hsl(var(--success))'
            }}>
              <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
              <AlertDescription style={{ color: 'hsl(var(--success))' }}>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" style={{
                fontSize: '0.875rem',
                color: 'hsl(var(--destructive))',
                marginTop: 'var(--spacing-xs)'
              }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Role Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              disabled={loading}
              required
            >
              <SelectTrigger id="role" aria-invalid={!!fieldErrors.role}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.role && (
              <p style={{
                fontSize: '0.875rem',
                color: 'hsl(var(--destructive))',
                marginTop: 'var(--spacing-xs)'
              }}>
                {fieldErrors.role}
              </p>
            )}
          </div>

          {/* Resource Permissions (Guest Only) */}
          {role === 'guest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <Label htmlFor="permissions">Resource Permissions (JSON) *</Label>
              <textarea
                id="permissions"
                placeholder='{"posts": ["post_id_1", "post_id_2"], "projects": ["project_id_3"]}'
                value={resourcePermissions}
                onChange={(e) => setResourcePermissions(e.target.value)}
                disabled={loading}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
                aria-invalid={!!fieldErrors.resource_permissions}
                aria-describedby="permissions-help"
              />
              <p id="permissions-help" style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))'
              }}>
                Specify which resources this guest can access. Format: {`{"collection": ["doc_id1", "doc_id2"]}`}
              </p>
              {fieldErrors.resource_permissions && (
                <p style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--destructive))'
                }}>
                  {fieldErrors.resource_permissions}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={loading || !email || !role}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
