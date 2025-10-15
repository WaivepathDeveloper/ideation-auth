/**
 * Server-side helper to fetch tenant details
 *
 * Used by Server Components to get tenant data
 * Uses the current session from DAL
 */

import { getCurrentSession } from '@/lib/dal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Tenant {
  id: string;
  name: string;
  status: string;
  settings: {
    max_users: number;
    features: string[];
    subscription_plan: string;
  };
}

/**
 * Fetch tenant details for the current authenticated user
 *
 * @returns Tenant data or null if not found
 * @throws Error if not authenticated
 */
export async function getTenantDetails(): Promise<Tenant | null> {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const tenantDoc = await getDoc(doc(db, 'tenants', session.tenant_id));

    if (!tenantDoc.exists()) {
      console.warn('Tenant document not found:', session.tenant_id);
      return null;
    }

    return {
      id: tenantDoc.id,
      ...tenantDoc.data(),
    } as Tenant;
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    return null;
  }
}
