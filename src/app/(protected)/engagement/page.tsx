/**
 * Engagement Page (Server Component)
 *
 * Placeholder page for user engagement tracking and analytics
 *
 * Access: Owner, Admin, Member
 */

import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { ComingSoonPlaceholder } from '@/components/ui/ComingSoonPlaceholder';
import { Users } from 'lucide-react';

export default async function EngagementPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  // Role check: only owner, admin, member can access
  if (!['owner', 'admin', 'member'].includes(session.role)) {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Engagement</h1>
        <p className="text-muted-foreground">
          Track and analyze user engagement metrics to improve retention and user experience
        </p>
      </div>

      <ComingSoonPlaceholder
        message="The Engagement module is under development and will be available soon. This feature will include user activity tracking, engagement metrics, and actionable insights."
        icon={<Users className="h-12 w-12 text-muted-foreground" />}
      />
    </div>
  );
}
