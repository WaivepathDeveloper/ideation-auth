/**
 * Auth Layout - Server Component
 *
 * Layout for public authentication pages (login, signup)
 * - Centers content vertically and horizontally
 * - Provides consistent styling for auth pages
 * - Redirects to /dashboard if user is already authenticated
 *
 * ARCHITECTURE: This is a Server Component. Auth check happens server-side
 * using getCurrentSession() from DAL. No loading states needed.
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/dal';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await getCurrentSession();

  if (session) {
    // User is already logged in - redirect to dashboard
    redirect('/dashboard');
  }

  // Render auth pages for unauthenticated users
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
