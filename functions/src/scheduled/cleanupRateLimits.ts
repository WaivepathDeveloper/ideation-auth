import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

/**
 * Scheduled Cloud Function: Cleanup expired rate limit records
 * Runs every 1 hour to prevent rate_limits collection from growing indefinitely
 * Deletes records with expires_at < now
 */
export const cleanupRateLimits = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting rate limits cleanup job');

    const now = admin.firestore.Timestamp.now();
    let totalDeleted = 0;

    try {
      // Find expired rate limit records
      const snapshot = await db.collection('rate_limits')
        .where('expires_at', '<', now)
        .limit(500) // Process in batches to avoid timeouts
        .get();

      if (snapshot.empty) {
        console.log('No expired rate limits to clean up');
        return null;
      }

      // Delete in batches (Firestore limit: 500 operations per batch)
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        totalDeleted++;
      });

      await batch.commit();

      console.log(`Successfully cleaned up ${totalDeleted} expired rate limit records`);

      // If we hit the limit, there might be more to delete
      if (totalDeleted === 500) {
        console.log('Batch limit reached. More records may need cleanup on next run.');
      }

      return {
        success: true,
        deleted: totalDeleted
      };
    } catch (error) {
      console.error('Error during rate limits cleanup:', error);

      // Log error to Firestore for monitoring
      await db.collection('system_logs').add({
        type: 'cleanup_error',
        function: 'cleanupRateLimits',
        error: error instanceof Error ? error.message : String(error),
        timestamp: FieldValue.serverTimestamp()
      });

      throw error;
    }
  });
