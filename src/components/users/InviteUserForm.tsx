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
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
    <Card style={{
      border: '1px solid hsl(var(--border))',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 'var(--radius-xl)'
    }}>
      <CardHeader style={{
        paddingBottom: 'var(--spacing-lg)'
      }}>
        <CardTitle className="flex items-center" style={{
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-xs)'
        }}>
          <UserPlus className="h-5 w-5" />
          Invite User
        </CardTitle>
        <CardDescription style={{
          marginTop: 'var(--spacing-xs)'
        }}>
          Invite members, guests, or viewers to your team
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xl)',
          paddingTop: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-xl)'
        }}>
          {/* Success Alert */}
          {success && (
            <Alert style={{
              backgroundColor: 'hsl(var(--success) / 0.1)',
              borderColor: 'hsl(var(--success))',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
              <AlertDescription style={{
                color: 'hsl(var(--success))',
                paddingLeft: 'var(--spacing-sm)'
              }}>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription style={{
                paddingLeft: 'var(--spacing-sm)'
              }}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email & Role Fields - Responsive Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            {/* Email Field */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)'
            }}>
              <Label htmlFor="email" style={{
                fontWeight: 500,
                color: 'hsl(var(--foreground))',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Email Address <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : 'email-help'}
                style={{
                  transition: 'border-color var(--transition-normal) var(--transition-ease)'
                }}
              />
              {!fieldErrors.email && (
                <p id="email-help" style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  We'll send an invitation link to this address
                </p>
              )}
              {fieldErrors.email && (
                <p id="email-error" style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--destructive))'
                }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Role Selector */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)'
            }}>
              <Label htmlFor="role" style={{
                fontWeight: 500,
                color: 'hsl(var(--foreground))',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Role <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={loading}
                required
              >
                <SelectTrigger id="role" aria-invalid={!!fieldErrors.role}>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!fieldErrors.role && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  Select appropriate access level for this user
                </p>
              )}
              {fieldErrors.role && (
                <p style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--destructive))'
                }}>
                  {fieldErrors.role}
                </p>
              )}
            </div>
          </div>

          {/* Resource Permissions (Guest Only) */}
          {role === 'guest' && (
            <Alert style={{
              backgroundColor: 'hsl(var(--accent) / 0.5)',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-md)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <Info className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                  <Label htmlFor="permissions" style={{
                    fontWeight: 500,
                    color: 'hsl(var(--foreground))',
                    margin: 0
                  }}>
                    Resource Permissions (JSON) <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </Label>
                </div>
                <AlertDescription style={{ marginTop: 'var(--spacing-xs)' }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginBottom: 'var(--spacing-md)',
                    lineHeight: '1.5'
                  }}>
                    Guest users need specific resource access. Define which collections and documents they can access.
                  </p>
                  <textarea
                    id="permissions"
                    placeholder='{"posts": ["post_123", "post_456"], "projects": ["proj_789"]}'
                    value={resourcePermissions}
                    onChange={(e) => setResourcePermissions(e.target.value)}
                    disabled={loading}
                    required
                    rows={5}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      transition: 'border-color var(--transition-normal) var(--transition-ease)'
                    }}
                    aria-invalid={!!fieldErrors.resource_permissions}
                    aria-describedby="permissions-help"
                  />
                  <p id="permissions-help" style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: 'var(--spacing-sm)',
                    lineHeight: '1.5'
                  }}>
                    Format: {`{"collection_name": ["document_id1", "document_id2"]}`}
                  </p>
                  {fieldErrors.resource_permissions && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'hsl(var(--destructive))',
                      marginTop: 'var(--spacing-sm)'
                    }}>
                      {fieldErrors.resource_permissions}
                    </p>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>

        <CardFooter style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 'var(--spacing-xl)',
          paddingBottom: 'var(--spacing-lg)',
          borderTop: '1px solid hsl(var(--border))',
          marginTop: 'var(--spacing-md)'
        }}>
          <Button
            type="submit"
            disabled={loading || !email || !role}
            style={{
              minWidth: '180px',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              transition: 'all var(--transition-normal) var(--transition-ease)'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
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
