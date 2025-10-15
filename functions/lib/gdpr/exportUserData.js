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
exports.exportUserData = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const db = admin.firestore();
/**
 * POST-MVP: GDPR Data Export Function
 * Allows users to export all their personal data
 *
 * Purpose: GDPR Article 15 - Right to access
 *
 * To enable this function:
 * 1. Set up Cloud Storage bucket for exports
 * 2. Configure bucket lifecycle (auto-delete after 7 days)
 * 3. Uncomment export in src/index.ts
 * 4. Deploy functions
 */
exports.exportUserData = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to export your data');
    }
    const userId = context.auth.uid;
    const tenantId = context.auth.token.tenant_id;
    console.log(`Starting data export for user ${userId}`);
    try {
        // Collect all user data
        const exportData = {
            export_info: {
                exported_at: new Date().toISOString(),
                user_id: userId,
                tenant_id: tenantId,
                format: 'JSON',
                gdpr_article: 'Article 15 - Right to access'
            },
            profile: {},
            content: {
                posts: [],
                comments: []
            },
            activity: []
        };
        // 1. User profile
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            exportData.profile = userDoc.data();
        }
        // 2. User's posts
        const postsSnapshot = await db.collection('posts')
            .where('tenant_id', '==', tenantId)
            .where('created_by', '==', userId)
            .get();
        exportData.content.posts = postsSnapshot.docs.map(doc => doc.data());
        // 3. User's comments
        const commentsSnapshot = await db.collection('comments')
            .where('tenant_id', '==', tenantId)
            .where('created_by', '==', userId)
            .get();
        exportData.content.comments = commentsSnapshot.docs.map(doc => doc.data());
        // 4. Activity logs (last 1000 actions)
        const logsSnapshot = await db.collection('audit_logs')
            .where('tenant_id', '==', tenantId)
            .where('user_id', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(1000)
            .get();
        exportData.activity = logsSnapshot.docs.map(doc => doc.data());
        // 5. Determine export method based on size
        const exportJson = JSON.stringify(exportData, null, 2);
        const exportSize = Buffer.byteLength(exportJson, 'utf8');
        if (exportSize < 1000000) { // < 1MB - return directly
            console.log(`Returning inline export for user ${userId} (${exportSize} bytes)`);
            return {
                success: true,
                method: 'inline',
                data: exportData,
                size_bytes: exportSize
            };
        }
        else { // > 1MB - upload to Cloud Storage
            const bucket = admin.storage().bucket();
            const fileName = `exports/${tenantId}/${userId}_${Date.now()}.json`;
            const file = bucket.file(fileName);
            await file.save(exportJson, {
                metadata: {
                    contentType: 'application/json',
                    metadata: {
                        userId,
                        tenantId,
                        exportedAt: new Date().toISOString()
                    }
                }
            });
            // Generate signed URL (valid for 1 hour)
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000 // 1 hour
            });
            // Create audit log
            await db.collection('audit_logs').add({
                tenant_id: tenantId,
                user_id: userId,
                action: 'DATA_EXPORTED',
                collection: 'users',
                document_id: userId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                changes: {
                    export_size: exportSize,
                    export_method: 'cloud_storage'
                }
            });
            console.log(`Upload complete for user ${userId}. File: ${fileName}`);
            return {
                success: true,
                method: 'download',
                download_url: signedUrl,
                size_bytes: exportSize,
                expires_in: '1 hour',
                message: 'Your data export is ready. Link expires in 1 hour.'
            };
        }
    }
    catch (error) {
        console.error(`Error exporting data for user ${userId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to export data. Please try again later.');
    }
});
//# sourceMappingURL=exportUserData.js.map