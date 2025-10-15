/**
 * Dashboard Page - Server Component
 *
 * Main dashboard for authenticated users
 * - Fetches user and tenant data server-side using DAL
 * - Passes data to client component as props
 * - No loading states needed (server-rendered with data)
 *
 * ARCHITECTURE: This is a Server Component. Auth is verified by layout.tsx,
 * and we fetch data using getCurrentSession() from DAL.
 */

import { getCurrentSession } from '@/lib/dal';
import { getTenantDetails } from '@/lib/server/getTenantDetails';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  // Get current session (already verified by layout)
  const session = await getCurrentSession();

  // This should never happen (layout redirects if no session),
  // but TypeScript needs the null check
  if (!session) {
    return null;
  }

  // Fetch tenant details server-side
  const tenant = await getTenantDetails();

  // Transform session data to match client component props
  const user = {
    uid: session.user_id,
    email: session.email,
    tenant_id: session.tenant_id,
    role: session.role,
  };

  // Render client component with server-fetched data
  return <DashboardClient user={user} tenant={tenant} />;
}
