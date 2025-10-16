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
exports.transferOwnership = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const rateLimiting_1 = require("../utils/rateLimiting");
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
/**
 * Callable Cloud Function: Transfer ownership to another admin
 * ONLY current owner can call this function
 */
exports.transferOwnership = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to transfer ownership');
    }
    // Rate limiting
    await (0, rateLimiting_1.checkAPIRateLimit)(context.auth.uid);
    const { new_owner_uid } = data;
    const caller_uid = context.auth.uid;
    const tenant_id = context.auth.token.tenant_id;
    // Validate input
    if (!new_owner_uid) {
        throw new functions.https.HttpsError('invalid-argument', 'new_owner_uid is required');
    }
    // Verify caller is current owner
    const tenantDoc = await db.collection('tenants').doc(tenant_id).get();
    if (!tenantDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Tenant not found');
    }
    const currentOwnerId = tenantDoc.data()?.owner_id;
    if (currentOwnerId !== caller_uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only the current Owner can transfer ownership');
    }
    // Verify new owner exists and is in same tenant
    const newOwnerDoc = await db.collection('users').doc(new_owner_uid).get();
    if (!newOwnerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'New owner user not found');
    }
    const newOwnerData = newOwnerDoc.data();
    if (newOwnerData.tenant_id !== tenant_id) {
        throw new functions.https.HttpsError('permission-denied', 'New owner must be in the same organization');
    }
    // Verify new owner is currently an admin
    if (newOwnerData.role !== 'admin') {
        throw new functions.https.HttpsError('invalid-argument', 'New owner must be an existing Admin');
    }
    // Prevent self-transfer (redundant but explicit)
    if (new_owner_uid === caller_uid) {
        throw new functions.https.HttpsError('invalid-argument', 'You are already the owner');
    }
    // Update tenant.owner_id
    await db.collection('tenants').doc(tenant_id).update({
        owner_id: new_owner_uid,
        updated_at: firestore_1.FieldValue.serverTimestamp(),
        updated_by: caller_uid
    });
    // Update new owner's custom claims
    const newOwnerAuth = await admin.auth().getUser(new_owner_uid);
    await admin.auth().setCustomUserClaims(new_owner_uid, {
        ...newOwnerAuth.customClaims,
        role: 'owner'
    });
    // Update new owner's Firestore document
    await db.collection('users').doc(new_owner_uid).update({
        role: 'owner',
        updated_at: firestore_1.FieldValue.serverTimestamp(),
        updated_by: caller_uid
    });
    // Update old owner's custom claims (demote to admin)
    const oldOwnerAuth = await admin.auth().getUser(caller_uid);
    await admin.auth().setCustomUserClaims(caller_uid, {
        ...oldOwnerAuth.customClaims,
        role: 'admin'
    });
    // Update old owner's Firestore document
    await db.collection('users').doc(caller_uid).update({
        role: 'admin',
        updated_at: firestore_1.FieldValue.serverTimestamp(),
        updated_by: caller_uid
    });
    // Create audit log
    await db.collection('audit_logs').add({
        tenant_id,
        user_id: caller_uid,
        action: 'OWNERSHIP_TRANSFERRED',
        collection: 'tenants',
        document_id: tenant_id,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        changes: {
            old_owner_uid: caller_uid,
            new_owner_uid,
            old_owner_email: oldOwnerAuth.email,
            new_owner_email: newOwnerAuth.email
        }
    });
    console.log(`Ownership transferred from ${oldOwnerAuth.email} to ${newOwnerAuth.email} in tenant ${tenant_id}`);
    return {
        success: true,
        message: `Ownership transferred to ${newOwnerAuth.email}`,
        new_owner_email: newOwnerAuth.email
    };
});
//# sourceMappingURL=transferOwnership.js.map