'use client';

/**
 * CurrentUserProfile Component
 *
 * Displays current user's profile with avatar, name, role, and edit button
 *
 * Features:
 * - UserAvatar integration (lg size)
 * - RoleBadge display
 * - Edit Profile button (placeholder)
 * - Card layout
 * - Design token styling
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/users/UserAvatar';
import { RoleBadge } from '@/components/users/RoleBadge';
import type { User } from '@/types/user';

/**
 * CurrentUserProfile component props
 */
export interface CurrentUserProfileProps {
  /** Current user data */
  user: {
    photoURL?: string | null;
    display_name: string;
    email: string;
    role: User['role'];
  };
  /** Optional click handler for Edit Profile button */
  onEditClick?: () => void;
}

/**
 * CurrentUserProfile component
 *
 * Displays featured current user card
 */
export function CurrentUserProfile({ user, onEditClick }: CurrentUserProfileProps) {
  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      // Placeholder functionality
      alert('Edit Profile functionality coming soon!');
    }
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardContent className="flex items-center gap-4 p-6">
        {/* User Avatar */}
        <UserAvatar user={user} size="lg" />

        {/* User Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">{user.display_name}</h3>
          <RoleBadge role={user.role} size="sm" />
        </div>

        {/* Edit Button */}
        <Button variant="outline" onClick={handleEditClick}>
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}
