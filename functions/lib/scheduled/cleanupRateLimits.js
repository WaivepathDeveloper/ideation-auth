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
exports.cleanupRateLimits = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
/**
 * Scheduled Cloud Function: Cleanup expired rate limit records
 * Runs every 1 hour to prevent rate_limits collection from growing indefinitely
 * Deletes records with expires_at < now
 */
exports.cleanupRateLimits = functions.pubsub
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
    }
    catch (error) {
        console.error('Error during rate limits cleanup:', error);
        // Log error to Firestore for monitoring
        await db.collection('system_logs').add({
            type: 'cleanup_error',
            function: 'cleanupRateLimits',
            error: error instanceof Error ? error.message : String(error),
            timestamp: firestore_1.FieldValue.serverTimestamp()
        });
        throw error;
    }
});
//# sourceMappingURL=cleanupRateLimits.js.map