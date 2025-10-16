/**
 * Protected Layout - Server Component
 *
 * Layout for authenticated pages (dashboard, profile, settings)
 * - Uses DAL to verify authentication server-side
 * - Redirects to /login if not authenticated
 * - No client-side auth context needed
 *
 * ARCHITECTURE: This is a Server Component. Auth is verified on the server
 * using middleware-injected headers (via dal.ts).
 *
 * IMPORTANT: Marked as dynamic because it uses headers() via getCurrentSession()
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/dal';

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

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
