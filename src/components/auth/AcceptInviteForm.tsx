'use client';

/**
 * Accept Invitation Form Component
 *
 * Display invitation context and embedded signup form.
 * Handles user signup and marks invitation as accepted.
 *
 * SECURITY:
 * - Email field is pre-filled and disabled (from invitation)
 * - Token is validated server-side before rendering this component
 * - Calls server action to mark invitation as accepted after signup
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/client-auth';
import { acceptInvitation } from '@/lib/actions/accept-invitation';
import { mapFirebaseError } from '@/lib/validations/auth';
import type { InvitationData } from '@/types/invitation';
import { AuthCard } from './shared/AuthCard';
import { AuthField } from './shared/AuthField';
import { PasswordInput } from './shared/PasswordInput';
import { AuthButton } from './shared/AuthButton';
import { AuthAlert } from './shared/AuthAlert';

interface AcceptInviteFormProps {
  invitation: InvitationData;
  tenantName: string;
  inviterEmail: string;
}

export default function AcceptInviteForm({ invitation, tenantName, inviterEmail }: AcceptInviteFormProps) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setFieldErrors({
        password: 'Password must contain uppercase, lowercase, and number',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Firebase user account
      await signUpWithEmail(invitation.email, password);

      // Step 2: Get the current user (just created)
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User creation failed. Please try again.');
      }

      // Step 3: Mark invitation as accepted
      const result = await acceptInvitation(invitation.invite_token, currentUser.uid);

      if (!result.success) {
        setError(result.error || 'Failed to accept invitation');
        setLoading(false);
        return;
      }

      // Step 4: Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Accept invitation error:', err);
      const error = err as { code?: string; message?: string };
      setError(mapFirebaseError(error));
      setLoading(false);
    }
  };

  // Format role for display
  const roleDisplay = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  // Calculate days until expiration
  const expiresAt = new Date(invitation.expires_at);
  const daysUntilExpiration = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Invitation Context Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You've Been Invited!</h2>
            <p className="text-gray-600">
              {inviterEmail} has invited you to join <strong>{tenantName}</strong>
            </p>
          </div>

          <div className="space-y-3 bg-gray-50 rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Organization:</span>
              <span className="text-sm font-medium text-gray-900">{tenantName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Your Role:</span>
              <span className="text-sm font-medium text-gray-900">{roleDisplay}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Invited By:</span>
              <span className="text-sm font-medium text-gray-900">{inviterEmail}</span>
            </div>
            {daysUntilExpiration > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expires In:</span>
                <span className="text-sm font-medium text-gray-900">
                  {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Signup Form */}
        <AuthCard title="Create Your Account">
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            {error && <AuthAlert variant="error" message={error} />}

            {/* Email field - disabled and pre-filled */}
            <AuthField
              label="Email"
              id="email"
              type="email"
              value={invitation.email}
              onChange={() => {}} // No-op, field is disabled
              disabled={true}
              required
              autoComplete="email"
            />

            <PasswordInput
              label="Password"
              id="password"
              value={password}
              onChange={setPassword}
              error={fieldErrors.password}
              disabled={loading}
              required
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />

            <PasswordInput
              label="Confirm Password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={fieldErrors.confirmPassword}
              disabled={loading}
              required
              placeholder="Repeat password"
              autoComplete="new-password"
            />

            <div className="pt-2">
              <AuthButton type="submit" loading={loading} fullWidth>
                {loading ? 'Creating your account...' : 'Accept Invitation & Create Account'}
              </AuthButton>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              By creating an account, you agree to join {tenantName} as a {roleDisplay}.
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
