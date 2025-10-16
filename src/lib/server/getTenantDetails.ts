/**
 * Server-side helper to fetch tenant details
 *
 * Used by Server Components to get tenant data.
 * Uses Firebase Admin SDK with TenantFirestoreAdmin wrapper for secure access.
 */

import { getCurrentSession } from '@/lib/dal';
import { TenantFirestoreAdmin } from './TenantFirestoreAdmin';
import { serializeTimestamp } from './serializers';

export interface Tenant {
  id: string;
  name: string;
  status: string;
  settings: {
    max_users: number;
    features: string[];
    subscription_plan: string;
  };
  owner_id?: string;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  metadata?: {
    industry?: string;
    company_size?: string;
  };
}

/**
 * Fetch tenant details for the current authenticated user
 *
 * SECURITY: Uses TenantFirestoreAdmin to ensure tenant_id validation
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
    // SECURITY: Initialize with validated session context
    const db = new TenantFirestoreAdmin(session.tenant_id, session.user_id);

    // Fetch tenant document - automatically validated by wrapper
    const tenantData = await db.getById('tenants', session.tenant_id);

    // SECURITY: Runtime validation (defense-in-depth)
    // Belt-and-suspenders: verify tenant_id field matches expected value
    if (tenantData.tenant_id !== session.tenant_id) {
      console.error('🚨 CRITICAL: Tenant data integrity violation', {
        documentId: tenantData.id,
        documentTenantId: tenantData.tenant_id,
        sessionTenantId: session.tenant_id,
        userId: session.user_id,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Tenant data integrity violation detected');
    }

    return {
      id: tenantData.id,
      name: tenantData.name,
      status: tenantData.status,
      settings: tenantData.settings,
      owner_id: tenantData.owner_id,
      created_by: tenantData.created_by,
      created_at: serializeTimestamp(tenantData.created_at),
      updated_at: serializeTimestamp(tenantData.updated_at),
      metadata: tenantData.metadata,
    } as Tenant;
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    return null;
  }
}
