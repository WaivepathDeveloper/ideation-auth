import { Badge } from '@/components/ui/badge';
import { Crown, Shield, User, UserCheck, Eye } from 'lucide-react';
import type { UserRole } from '@/types/roles';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Role configuration mapping
 *
 * Maps each role to:
 * - label: Display name
 * - icon: Lucide icon component
 * - className: CSS class for styling (uses design tokens)
 */
const roleConfig: Record<UserRole, {
  label: string;
  icon: typeof Crown;
  className: string;
}> = {
  owner: {
    label: 'Owner',
    icon: Crown,
    className: 'badge-owner',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'badge-admin',
  },
  member: {
    label: 'Member',
    icon: User,
    className: 'badge-member',
  },
  guest: {
    label: 'Guest',
    icon: UserCheck,
    className: 'badge-guest',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    className: 'badge-viewer',
  },
};

/**
 * RoleBadge Component
 *
 * Displays a user's role with icon, label, and color-coded styling.
 * Uses design tokens from globals.css for consistent theming.
 *
 * Accessibility Features:
 * - role="status" for screen reader announcements
 * - aria-label with full role description
 * - Semantic HTML with proper ARIA attributes
 * - Keyboard accessible (inherits from Badge)
 *
 * Color Mapping (uses CSS variables):
 * - owner → --primary (purple/blue)
 * - admin → --secondary (blue)
 * - member → --success (green)
 * - guest → --warning (yellow)
 * - viewer → --muted (gray)
 *
 * @param role - User role to display
 * @param size - Badge size variant (sm, md, lg)
 * @param showIcon - Whether to show role icon
 * @param className - Additional CSS classes
 *
 * @example
 * // Basic usage
 * <RoleBadge role="admin" />
 *
 * @example
 * // Custom size without icon
 * <RoleBadge role="member" size="sm" showIcon={false} />
 *
 * @example
 * // With custom styling
 * <RoleBadge role="owner" className="ml-2" />
 */
export function RoleBadge({
  role,
  size = 'md',
  showIcon = true,
  className = '',
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge
      className={`${config.className} badge-size-${size} ${className}`}
      role="status"
      aria-label={`User role: ${config.label}`}
    >
      {showIcon && <Icon className="badge-icon" aria-hidden="true" />}
      {config.label}
    </Badge>
  );
}

/**
 * Get role display label
 *
 * @param role - User role
 * @returns Human-readable role label
 */
export function getRoleLabel(role: UserRole): string {
  return roleConfig[role].label;
}

/**
 * Get role color class
 *
 * @param role - User role
 * @returns CSS class name for role color
 */
export function getRoleColorClass(role: UserRole): string {
  return roleConfig[role].className;
}
