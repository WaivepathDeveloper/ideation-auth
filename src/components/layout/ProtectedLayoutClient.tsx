'use client';

/**
 * ProtectedLayoutClient Component
 *
 * Client-side wrapper for protected layout
 * Manages sidebar state and mobile navigation
 *
 * Features:
 * - Desktop collapsible sidebar
 * - Mobile sheet overlay
 * - Hamburger menu button
 * - Session data passed from server
 */

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/layout/AppSidebar';
import type { UserRole } from '@/types/roles';

/**
 * Session data from server component
 */
export interface SessionData {
  role: UserRole;
  display_name: string;
  user_id: string;
}

/**
 * ProtectedLayoutClient component props
 */
export interface ProtectedLayoutClientProps {
  /** Children content (page content) */
  children: React.ReactNode;
  /** Session data from server */
  session: SessionData;
}

/**
 * ProtectedLayoutClient component
 *
 * Client wrapper with sidebar and mobile navigation
 */
export function ProtectedLayoutClient({ children, session }: ProtectedLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <AppSidebar
        currentUserRole={session.role}
        currentUserName={session.display_name}
      />

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-background">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-lg">Lamda</h1>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[280px] p-0 bg-sidebar text-sidebar-foreground"
            >
              <AppSidebar
                currentUserRole={session.role}
                currentUserName={session.display_name}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 md:ml-[280px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
