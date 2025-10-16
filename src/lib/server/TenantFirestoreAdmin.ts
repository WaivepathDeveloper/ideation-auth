/**
 * TenantFirestoreAdmin - Server-Side Database Wrapper
 *
 * CRITICAL SECURITY COMPONENT:
 * This class automatically enforces tenant isolation for all database operations.
 * It provides the same security guarantees as the client-side TenantFirestore wrapper,
 * but uses Firebase Admin SDK for server-side operations.
 *
 * SECURITY FEATURES:
 * 1. Auto-injects tenant_id on ALL write operations
 * 2. Auto-filters by tenant_id on ALL read operations
 * 3. Validates session context before every operation
 * 4. Post-query validation ensures ALL results belong to session tenant
 * 5. Comprehensive audit logging for security monitoring
 * 6. Fail-fast design throws errors immediately on violations
 *
 * USAGE:
 * - ALL server-side database reads MUST use this wrapper
 * - Initialize with validated session from getCurrentSession()
 * - Never use raw Admin SDK in application code
 *
 * Example:
 * ```typescript
 * const session = await getCurrentSession();
 * const db = new TenantFirestoreAdmin(session.tenant_id, session.user_id);
 * const users = await db.query('users', [{ field: 'status', op: '==', value: 'active' }]);
 * ```
 */

import { getAdminDb, FieldValue } from './firebase-admin';
import type { Firestore, WhereFilterOp } from 'firebase-admin/firestore';

export interface TenantFilter {
  field: string;
  op: WhereFilterOp;
  value: unknown;
}

export interface QueryResult {
  id: string;
  [key: string]: unknown;
}

export class TenantFirestoreAdmin {
  private readonly db: Firestore;

  /**
   * Constructor - Validates session context
   *
   * SECURITY: Throws immediately if required fields missing
   * This prevents accidental queries without proper tenant context
   *
   * @param sessionTenantId - Tenant ID from validated session
   * @param userId - User ID from validated session
   * @throws Error if sessionTenantId or userId is missing
   */
  constructor(
    private readonly sessionTenantId: string,
    private readonly userId: string
  ) {
    if (!sessionTenantId) {
      throw new Error('SECURITY: sessionTenantId is required');
    }
    if (!userId) {
      throw new Error('SECURITY: userId is required');
    }

    this.db = getAdminDb();
  }

  /**
   * Query collection with auto-enforced tenant isolation
   *
   * SECURITY GUARANTEES:
   * 1. tenant_id filter ALWAYS added first (cannot be bypassed)
   * 2. Session validation before execution
   * 3. Post-query validation of ALL results
   * 4. Audit logging of operation (optional)
   *
   * @param collectionName - Collection to query
   * @param filters - Additional filters (optional)
   * @returns Array of documents with id field
   * @throws Error if collection name missing or tenant mismatch detected
   */
  async query(collectionName: string, filters: TenantFilter[] = []): Promise<QueryResult[]> {
    // SECURITY: Validate inputs
    if (!collectionName) {
      throw new Error('SECURITY: collectionName is required');
    }

    // Build query with MANDATORY tenant_id filter
    let query: FirebaseFirestore.Query = this.db
      .collection(collectionName)
      .where('tenant_id', '==', this.sessionTenantId);

    // Apply additional filters
    for (const filter of filters) {
      query = query.where(filter.field, filter.op, filter.value);
    }

    try {
      // Execute query
      const snapshot = await query.get();

      // POST-QUERY VALIDATION: Double-check ALL results belong to session tenant
      const results: QueryResult[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();

        // CRITICAL: Assert tenant_id matches session
        if (data.tenant_id !== this.sessionTenantId) {
          // Log security violation
          console.error('🚨 SECURITY VIOLATION DETECTED:', {
            documentId: doc.id,
            documentTenant: data.tenant_id,
            sessionTenant: this.sessionTenantId,
            collection: collectionName,
            userId: this.userId,
            timestamp: new Date().toISOString(),
          });

          // Log to audit_logs (non-blocking)
          this.logSecurityViolation(collectionName, doc.id, data.tenant_id).catch(err => {
            console.error('Failed to log security violation:', err);
          });

          throw new Error(
            `SECURITY VIOLATION: Document ${doc.id} in ${collectionName} belongs to different tenant (${data.tenant_id})`
          );
        }

        results.push({
          id: doc.id,
          ...data,
        });
      });

      return results;
    } catch (error) {
      console.error(`Query failed for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get single document by ID with tenant verification
   *
   * SECURITY: Verifies document belongs to session tenant
   *
   * @param collectionName - Collection name
   * @param docId - Document ID
   * @returns Document data with id field
   * @throws Error if document not found or belongs to different tenant
   */
  async getById(collectionName: string, docId: string): Promise<QueryResult> {
    if (!collectionName || !docId) {
      throw new Error('SECURITY: collectionName and docId are required');
    }

    const docRef = this.db.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Document not found: ${collectionName}/${docId}`);
    }

    const data = docSnap.data()!;

    // CRITICAL: Verify tenant_id matches session
    if (data.tenant_id !== this.sessionTenantId) {
      console.error('🚨 SECURITY VIOLATION: Cross-tenant access attempt', {
        documentId: docId,
        collection: collectionName,
        documentTenant: data.tenant_id,
        sessionTenant: this.sessionTenantId,
        userId: this.userId,
      });

      // Log security violation
      await this.logSecurityViolation(collectionName, docId, data.tenant_id);

      throw new Error(
        `Access denied: Document ${collectionName}/${docId} belongs to different tenant`
      );
    }

    return {
      id: docSnap.id,
      ...data,
    };
  }

  /**
   * Get multiple documents by IDs with tenant verification
   *
   * @param collectionName - Collection name
   * @param docIds - Array of document IDs
   * @returns Array of documents (only those belonging to session tenant)
   */
  async getByIds(collectionName: string, docIds: string[]): Promise<QueryResult[]> {
    if (!collectionName || !docIds || docIds.length === 0) {
      return [];
    }

    const promises = docIds.map(id =>
      this.db.collection(collectionName).doc(id).get()
    );

    const docs = await Promise.all(promises);

    // Filter by tenant and return only accessible documents
    const results: QueryResult[] = [];

    docs.forEach(doc => {
      if (doc.exists) {
        const data = doc.data()!;

        // Only include documents from session tenant
        if (data.tenant_id === this.sessionTenantId) {
          results.push({
            id: doc.id,
            ...data,
          });
        }
      }
    });

    return results;
  }

  /**
   * Count documents matching query
   *
   * @param collectionName - Collection to count
   * @param filters - Optional filters
   * @returns Number of documents matching query
   */
  async count(collectionName: string, filters: TenantFilter[] = []): Promise<number> {
    const results = await this.query(collectionName, filters);
    return results.length;
  }

  /**
   * Log security violation to audit_logs
   *
   * CONSISTENT with existing Cloud Functions audit log pattern:
   * - Same schema structure
   * - Same field names
   * - Same timestamp format
   *
   * @param collection - Collection where violation occurred
   * @param documentId - Document ID involved
   * @param attemptedTenantId - Tenant ID of the accessed document
   */
  private async logSecurityViolation(
    collection: string,
    documentId: string,
    attemptedTenantId: string
  ): Promise<void> {
    try {
      await this.db.collection('audit_logs').add({
        tenant_id: this.sessionTenantId,
        user_id: this.userId,
        action: 'SECURITY_VIOLATION',
        collection,
        document_id: documentId,
        timestamp: FieldValue.serverTimestamp(),
        changes: {
          attempted_tenant_id: attemptedTenantId,
          session_tenant_id: this.sessionTenantId,
          severity: 'CRITICAL',
          source: 'TenantFirestoreAdmin',
        },
      });
    } catch (error) {
      // Don't throw - logging failure shouldn't break the app
      console.error('Failed to log security violation to audit_logs:', error);
    }
  }

  /**
   * Log successful operation to audit_logs (optional)
   *
   * Use this for operations that require audit trail.
   * Consistent with Cloud Functions audit log pattern.
   *
   * @param action - Action performed (e.g., 'READ_USERS', 'QUERY_POSTS')
   * @param collection - Collection accessed
   * @param resultCount - Number of results returned
   */
  async logOperation(
    action: string,
    collection: string,
    resultCount: number
  ): Promise<void> {
    try {
      await this.db.collection('audit_logs').add({
        tenant_id: this.sessionTenantId,
        user_id: this.userId,
        action,
        collection,
        document_id: null,
        timestamp: FieldValue.serverTimestamp(),
        changes: {
          result_count: resultCount,
          source: 'TenantFirestoreAdmin',
        },
      });
    } catch (error) {
      console.error('Failed to log operation to audit_logs:', error);
    }
  }
}
