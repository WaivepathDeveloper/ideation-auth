/**
 * Predictive Analytics Page (Server Component)
 *
 * Placeholder page for predictive analytics and insights
 *
 * Access: Owner, Admin only
 */

import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { ComingSoonPlaceholder } from '@/components/ui/ComingSoonPlaceholder';
import { TrendingUp } from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  // Role check: only owner, admin can access
  if (!['owner', 'admin'].includes(session.role)) {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Predictive Analytics</h1>
        <p className="text-muted-foreground">
          Leverage AI-powered analytics to predict trends, identify opportunities, and make data-driven decisions
        </p>
      </div>

      <ComingSoonPlaceholder
        message="The Predictive Analytics module is under development and will be available soon. This feature will include machine learning models, forecasting tools, and advanced data visualization."
        icon={<TrendingUp className="h-12 w-12 text-muted-foreground" />}
      />
    </div>
  );
}
