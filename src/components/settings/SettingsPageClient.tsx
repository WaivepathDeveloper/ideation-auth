'use client';

/**
 * SettingsPageClient Component
 *
 * Main client-side wrapper for the Settings page with tabs navigation
 * Integrates all settings-related components: tabs, view toggle, profile card, user table
 *
 * Features:
 * - Tab navigation (AI Configuration, User Permissions, Notifications)
 * - Users/Roles view toggle
 * - Current user profile card
 * - User management table
 * - Design token styling
 * - Responsive layout
 */

import { useState } from 'react';
import type { User } from '@/types/user';
import type { UserRole } from '@/types/roles';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ViewToggle } from '@/components/users/ViewToggle';
import { CurrentUserProfile } from '@/components/users/CurrentUserProfile';
import { UserTable } from '@/components/users/UserTable';
import { InviteUserForm } from '@/components/users/InviteUserForm';
import { ComingSoonPlaceholder } from '@/components/ui/ComingSoonPlaceholder';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * SettingsPageClient component props
 */
export interface SettingsPageClientProps {
  /** Current logged-in user */
  currentUser: {
    uid: string;
    email: string;
    display_name: string;
    photoURL?: string | null;
    role: UserRole;
  };
  /** Current user's role */
  currentUserRole: 'owner' | 'admin';
  /** Tenant ID */
  tenantId: string;
  /** List of all users (active + pending) */
  users: User[];
  /** Count of active users */
  activeUsersCount: number;
  /** Count of pending invitations */
  pendingInvitationsCount: number;
}

/**
 * SettingsPageClient component
 *
 * Main settings page with tabs and user management
 */
export function SettingsPageClient({
  currentUser,
  currentUserRole,
  tenantId,
  users,
  activeUsersCount,
  pendingInvitationsCount,
}: SettingsPageClientProps) {
  // State for Users/Roles view toggle
  const [view, setView] = useState<'users' | 'roles'>('users');

  return (
    <div className="container mx-auto" style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            marginBottom: 'var(--spacing-xs)',
            color: 'hsl(var(--foreground))',
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          Update settings for better features performance
        </p>
      </div>

      {/* Tabs Navigation */}
      <SettingsTabs defaultTab="user-permissions">
        {/* User Permissions Tab Content */}
        <div className="space-y-6">
          {/* Section Header with View Toggle */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Profile and members</h2>
              <p className="text-sm text-muted-foreground">
                Simplify user roles for secure, seamless access control.
              </p>
            </div>

            {/* Users/Roles Toggle */}
            <ViewToggle value={view} onChange={setView} />
          </div>

          {/* Current User Profile Card */}
          <CurrentUserProfile
            user={{
              photoURL: currentUser.photoURL,
              display_name: currentUser.display_name,
              email: currentUser.email,
              role: currentUser.role,
            }}
            onEditClick={() => {
              // TODO: Implement edit profile modal
              console.log('Edit profile clicked');
            }}
          />

          {/* Conditional View: Users Table or Roles Management */}
          {view === 'users' ? (
            <>
              {/* Invite User Form */}
              <InviteUserForm currentUserRole={currentUserRole} tenantId={tenantId} />

              {/* User Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Team Members ({activeUsersCount} active
                    {pendingInvitationsCount > 0 ? `, ${pendingInvitationsCount} pending` : ''})
                  </CardTitle>
                  <CardDescription>
                    View and manage all users and pending invitations in your organization
                  </CardDescription>
                </CardHeader>
                <div className="p-6 pt-0">
                  <UserTable
                    users={users}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUser.uid}
                  />
                </div>
              </Card>
            </>
          ) : (
            /* Roles View Placeholder */
            <ComingSoonPlaceholder
              message="Roles management interface is under development. You'll be able to view and manage custom roles, permissions, and access controls here."
            />
          )}
        </div>
      </SettingsTabs>
    </div>
  );
}
