'use client';

/**
 * UserAvatar Component
 *
 * Displays user avatar with three-tier fallback chain:
 * 1. photoURL (Firebase Auth photo)
 * 2. Initials from display_name or email
 * 3. UserIcon fallback
 *
 * Features:
 * - Three size variants (sm, md, lg)
 * - Automatic fallback handling
 * - Design token styling
 * - Accessible alt text
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Size variant configurations
 */
const AVATAR_SIZES = {
  sm: 'size-8',   // 32px - table rows
  md: 'size-10',  // 40px - general use
  lg: 'size-12',  // 48px - profile cards
} as const;

/**
 * UserAvatar component props
 */
export interface UserAvatarProps {
  /** User data for avatar display */
  user: {
    /** Firebase Auth photo URL */
    photoURL?: string | null;
    /** User's display name */
    display_name?: string;
    /** User's email address */
    email: string;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional CSS classes */
  className?: string;
}

/**
 * Extract initials from name or email
 *
 * Rules:
 * - Single word: First letter
 * - Multiple words: First letter of first and last word
 * - Returns null if no valid text
 *
 * Examples:
 * - "John Smith" → "JS"
 * - "Alice" → "A"
 * - "john@example.com" → "J"
 *
 * @param text - Name or email to extract initials from
 * @returns Uppercase initials or null
 */
function getInitials(text?: string | null): string | null {
  if (!text) return null;

  const cleaned = text.trim();
  if (!cleaned) return null;

  // Remove email domain if it's an email
  const nameOnly = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;

  // Split by whitespace or special characters
  const parts = nameOnly.split(/[\s._-]+/).filter(part => part.length > 0);

  if (parts.length === 0) return null;
  if (parts.length === 1) {
    // Single word: return first letter
    return parts[0][0].toUpperCase();
  }

  // Multiple words: return first letter of first and last word
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * UserAvatar component
 *
 * Displays user avatar with fallback chain
 */
export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  // Determine fallback content (Tier 2 and 3)
  const initials = getInitials(user.display_name) || getInitials(user.email);

  const fallbackContent = initials || (
    <UserIcon className="h-4 w-4" />
  );

  return (
    <Avatar className={cn(AVATAR_SIZES[size], 'border-2 border-border', className)}>
      {/* Tier 1: Try photoURL */}
      {user.photoURL && (
        <AvatarImage
          src={user.photoURL}
          alt={user.display_name || user.email}
        />
      )}

      {/* Tier 2 & 3: Initials or icon */}
      <AvatarFallback
        delayMs={600}
        className="bg-muted text-muted-foreground font-semibold"
      >
        {fallbackContent}
      </AvatarFallback>
    </Avatar>
  );
}
