import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

/**
 * POST-MVP: Scheduled Cloud Function for GDPR compliance
 * Permanently deletes soft-deleted user data after 30-day retention period
 *
 * Runs: Daily at 2 AM UTC
 * Purpose: GDPR Article 17 - Right to erasure
 *
 * To enable this function:
 * 1. Uncomment export in src/index.ts
 * 2. Deploy functions
 * 3. Verify Cloud Scheduler job created
 */
export const cleanupDeletedData = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting GDPR cleanup job for deleted data');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    let totalDeleted = 0;

    try {
      // Collections to clean up
      const collections = ['users', 'posts', 'comments', 'attachments'];

      for (const collectionName of collections) {
        // Find records marked for deletion > 30 days ago
        const snapshot = await db.collection(collectionName)
          .where('deleted', '==', true)
          .where('deleted_at', '<', cutoffTimestamp)
          .limit(500)
          .get();

        if (snapshot.empty) {
          console.log(`No expired deletions in ${collectionName}`);
          continue;
        }

        const batch = db.batch();

        for (const doc of snapshot.docs) {
          // Log before permanent deletion (audit trail)
          await db.collection('deletion_logs').add({
            collection: collectionName,
            document_id: doc.id,
            tenant_id: doc.data().tenant_id,
            deleted_by: doc.data().deleted_by,
            deleted_at: doc.data().deleted_at,
            hard_deleted_at: admin.firestore.FieldValue.serverTimestamp(),
            data_snapshot: {
              // Store minimal metadata only
              email: doc.data().email,
              created_at: doc.data().created_at
            }
          });

          // Hard delete the document
          batch.delete(doc.ref);
          totalDeleted++;
        }

        await batch.commit();
        console.log(`Permanently deleted ${snapshot.size} records from ${collectionName}`);
      }

      console.log(`GDPR cleanup complete. Total records deleted: ${totalDeleted}`);

      return {
        success: true,
        deleted: totalDeleted,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error during GDPR cleanup:', error);

      // Alert admin
      await db.collection('system_alerts').add({
        type: 'gdpr_cleanup_failure',
        error: error instanceof Error ? error.message : String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        severity: 'high'
      });

      throw error;
    }
  });
