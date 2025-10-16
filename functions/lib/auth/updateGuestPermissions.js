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
exports.updateGuestPermissions = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const rateLimiting_1 = require("../utils/rateLimiting");
const db = admin.firestore();
/**
 * Callable Cloud Function: Update resource_permissions for guest users
 * Only admin or owner can call this
 */
exports.updateGuestPermissions = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to update guest permissions');
    }
    // Rate limiting
    await (0, rateLimiting_1.checkAPIRateLimit)(context.auth.uid);
    // Permission check - only admin or owner
    const callerRole = context.auth.token.role;
    if (callerRole !== 'admin' && callerRole !== 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Only Admins and Owners can update guest permissions');
    }
    const { user_id, resource_permissions } = data;
    const tenant_id = context.auth.token.tenant_id;
    // Validate input
    if (!user_id) {
        throw new functions.https.HttpsError('invalid-argument', 'user_id is required');
    }
    if (!resource_permissions || typeof resource_permissions !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'resource_permissions must be an object');
    }
    // Get target user
    const userDoc = await db.collection('users').doc(user_id).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    // Verify user is in same tenant
    if (userData.tenant_id !== tenant_id) {
        throw new functions.https.HttpsError('permission-denied', 'User is not in your organization');
    }
    // Verify user is a guest
    if (userData.role !== 'guest') {
        throw new functions.https.HttpsError('invalid-argument', 'User must have Guest role to update resource permissions');
    }
    // Update resource_permissions in Firestore
    await db.collection('users').doc(user_id).update({
        resource_permissions,
        updated_at: firestore_1.FieldValue.serverTimestamp(),
        updated_by: context.auth.uid
    });
    // Update custom claims to include resource_permissions
    const userAuth = await admin.auth().getUser(user_id);
    await admin.auth().setCustomUserClaims(user_id, {
        ...userAuth.customClaims,
        resource_permissions
    });
    // Create audit log
    await db.collection('audit_logs').add({
        tenant_id,
        user_id: context.auth.uid,
        action: 'GUEST_PERMISSIONS_UPDATED',
        collection: 'users',
        document_id: user_id,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        changes: {
            target_user_email: userAuth.email,
            resource_permissions
        }
    });
    console.log(`Guest permissions updated for ${userAuth.email} by ${context.auth.uid}`);
    return {
        success: true,
        message: 'Guest permissions updated successfully'
    };
});
//# sourceMappingURL=updateGuestPermissions.js.map