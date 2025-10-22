/**
 * Navigation type definitions
 *
 * Type definitions for sidebar navigation, menu items, and navigation state
 */

import type { LucideIcon } from 'lucide-react';
import type { UserRole } from './roles';

/**
 * Navigation menu item
 *
 * Represents a single navigation link in the sidebar with role-based access control
 */
export interface NavItem {
  /** Navigation route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label for the navigation item */
  label: string;
  /** Roles that can see this navigation item */
  roles: UserRole[];
  /** Optional badge content (e.g., notification count) */
  badge?: string | number;
}

/**
 * Sidebar state
 *
 * Manages sidebar collapse/expand state
 */
export interface SidebarState {
  /** Whether sidebar is collapsed (icon-only mode) */
  isCollapsed: boolean;
}

/**
 * AppSidebar component props
 */
export interface AppSidebarProps {
  /** Current user's role for filtering navigation items */
  currentUserRole: UserRole;
  /** Current user's display name */
  currentUserName: string;
  /** Optional CSS classes */
  className?: string;
}

/**
 * NavItem component props
 *
 * Props for individual navigation link component
 */
export interface NavItemProps {
  /** Navigation route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Whether this item is currently active (matches current route) */
  isActive: boolean;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Optional click handler */
  onClick?: () => void;
}
