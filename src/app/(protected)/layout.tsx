/**
 * Protected Layout - Server Component
 *
 * Layout for authenticated pages (dashboard, profile, settings)
 * - Uses DAL to verify authentication server-side
 * - Redirects to /login if not authenticated
 * - Passes session to client component for sidebar
 *
 * ARCHITECTURE: This is a Server Component. Auth is verified on the server
 * using middleware-injected headers (via dal.ts).
 *
 * IMPORTANT: Marked as dynamic because it uses headers() via getCurrentSession()
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/dal';
import { ProtectedLayoutClient } from '@/components/layout/ProtectedLayoutClient';

// Force dynamic rendering - this layout requires runtime request headers
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication server-side
  const session = await getCurrentSession();

  if (!session) {
    // Not authenticated - redirect to login
    redirect('/login');
  }

  // Pass session data to client component
  return (
    <ProtectedLayoutClient
      session={{
        role: session.role,
        display_name: session.email.split('@')[0], // Extract name from email
        user_id: session.user_id,
      }}
    >
      {children}
    </ProtectedLayoutClient>
  );
}
