/**
 * TenantFirestore - Database Wrapper with Auto Tenant Isolation
 *
 * CRITICAL SECURITY COMPONENT:
 * This class automatically injects tenant_id on writes and filters by tenant_id on reads.
 * It prevents developer mistakes that could lead to cross-tenant data leaks.
 *
 * USAGE: ALL database operations MUST go through this wrapper.
 * Direct Firestore access should NEVER be used in business logic.
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint,
  limit,
  startAfter,
  DocumentSnapshot,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface TenantFilter {
  field: string;
  op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: unknown;
}

export interface PaginationOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export class TenantFirestore {
  constructor(
    private tenantId: string,
    private userId: string
  ) {
    if (!tenantId) {
      throw new Error('TenantFirestore: tenantId is required');
    }
    if (!userId) {
      throw new Error('TenantFirestore: userId is required');
    }
  }

  /**
   * Create document with auto-injected tenant_id
   */
  async create(collectionName: string, data: Record<string, unknown>) {
    // Prevent manual tenant_id override
    if (data.tenant_id && data.tenant_id !== this.tenantId) {
      throw new Error('Cannot specify different tenant_id');
    }

    const docData = {
      ...data,
      tenant_id: this.tenantId,
      created_by: this.userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, collectionName), docData);

    return {
      id: docRef.id,
      ...docData,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Query documents with auto-filtered tenant_id
   */
  async query(collectionName: string, filters: TenantFilter[] = []) {
    // CRITICAL: Always filter by tenant_id first
    const constraints: QueryConstraint[] = [
      where('tenant_id', '==', this.tenantId)
    ];

    // Apply additional filters
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.op, filter.value));
    });

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get document by ID with tenant verification
   */
  async getById(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const data = docSnap.data();

    // CRITICAL: Verify tenant_id matches
    if (data.tenant_id !== this.tenantId) {
      throw new Error('Access denied: Document belongs to different tenant');
    }

    return {
      id: docSnap.id,
      ...data
    };
  }

  /**
   * Update document with tenant verification
   */
  async update(collectionName: string, docId: string, updates: Record<string, unknown>) {
    // Verify tenant ownership first
    await this.getById(collectionName, docId);

    // Prepare safe updates
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: serverTimestamp(),
      updated_by: this.userId
    };

    // Remove protected fields
    delete updateData.tenant_id;
    delete updateData.created_by;
    delete updateData.created_at;

    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, updateData);

    return {
      id: docId,
      ...updateData,
      updated_at: new Date()
    };
  }

  /**
   * Delete document (soft delete by default)
   */
  async delete(collectionName: string, docId: string, hardDelete = false) {
    // Verify tenant ownership
    await this.getById(collectionName, docId);

    const docRef = doc(db, collectionName, docId);

    if (hardDelete) {
      // Permanent deletion (use with caution)
      await deleteDoc(docRef);
    } else {
      // Soft delete (recommended - maintains audit trail)
      await updateDoc(docRef, {
        deleted: true,
        deleted_at: serverTimestamp(),
        deleted_by: this.userId
      });
    }

    return { success: true };
  }

  /**
   * Query with pagination support
   */
  async queryPaginated(
    collectionName: string,
    filters: TenantFilter[] = [],
    options: PaginationOptions = {}
  ) {
    const { limit: pageSize = 20, startAfter: startAfterDoc } = options;

    const constraints: QueryConstraint[] = [
      where('tenant_id', '==', this.tenantId)
    ];

    // Apply filters
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.op, filter.value));
    });

    // Add pagination
    constraints.push(limit(pageSize));

    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }

  /**
   * Batch create multiple documents
   */
  async batchCreate(collectionName: string, items: Record<string, unknown>[]) {
    const batch: WriteBatch = writeBatch(db);

    items.forEach(item => {
      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, {
        ...item,
        tenant_id: this.tenantId,
        created_by: this.userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    });

    await batch.commit();

    return {
      success: true,
      count: items.length
    };
  }

  /**
   * Get multiple documents by IDs
   */
  async getByIds(collectionName: string, docIds: string[]) {
    const promises = docIds.map(id =>
      getDoc(doc(db, collectionName, id))
    );

    const docs = await Promise.all(promises);

    // Filter by tenant and return only accessible documents
    return docs
      .filter(doc => doc.exists() && doc.data()?.tenant_id === this.tenantId)
      .map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
