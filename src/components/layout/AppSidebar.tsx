'use client';

/**
 * AppSidebar Component
 *
 * Main collapsible sidebar navigation for the application
 *
 * Features:
 * - Collapsible state (icon-only mode)
 * - Role-based navigation filtering
 * - Active route highlighting
 * - localStorage persistence for collapse state
 * - Responsive design (desktop only, hidden on mobile)
 * - Design token styling
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/roles';
import type { NavItem } from '@/types/navigation';

/**
 * Navigation menu items configuration
 *
 * Each item defines:
 * - Route path
 * - Icon component
 * - Display label
 * - Roles that can access it
 */
const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['owner', 'admin', 'member', 'guest', 'viewer'],
  },
  {
    href: '/engagement',
    icon: Users,
    label: 'Engagement',
    roles: ['owner', 'admin', 'member'],
  },
  {
    href: '/analytics',
    icon: TrendingUp,
    label: 'Predictive Analytics',
    roles: ['owner', 'admin'],
  },
  {
    href: '/retention',
    icon: Target,
    label: 'Retention Strategies',
    roles: ['owner', 'admin'],
  },
  {
    href: '/users',
    icon: Settings,
    label: 'Settings',
    roles: ['owner', 'admin'],
  },
];

/**
 * AppSidebar component props
 */
export interface AppSidebarProps {
  /** Current user's role for filtering navigation */
  currentUserRole: UserRole;
  /** Current user's display name */
  currentUserName: string;
  /** Optional CSS classes */
  className?: string;
}

/**
 * AppSidebar component
 *
 * Collapsible sidebar with role-based navigation
 */
export function AppSidebar({ currentUserRole, currentUserName, className }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Load collapse state from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (isClient) {
      localStorage.setItem('sidebar-collapsed', String(newState));
    }
  };

  // Filter navigation items by user role
  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUserRole)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex',
        isCollapsed ? 'w-16' : 'w-[280px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg">Lamda</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-4">
        {!isCollapsed && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-primary-foreground"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </div>
              <span className="font-semibold text-sm">Download Mac OS app</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Get the full experience
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
