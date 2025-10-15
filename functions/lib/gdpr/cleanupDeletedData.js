"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDeletedData = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
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
exports.cleanupDeletedData = functions.pubsub
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
    }
    catch (error) {
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
//# sourceMappingURL=cleanupDeletedData.js.map