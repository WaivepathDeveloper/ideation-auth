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
exports.updateUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const rateLimiting_1 = require("../utils/rateLimiting");
const db = admin.firestore();
/**
 * Callable Cloud Function: Update user role within tenant
 * Only tenant admins can change roles
 */
exports.updateUserRole = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to update user roles');
    }
    // Rate limiting
    await (0, rateLimiting_1.checkAPIRateLimit)(context.auth.uid);
    // Permission check - only admins and owners
    if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Only Admins and Owners can change user roles');
    }
    const { user_id, new_role } = data;
    const caller_tenant_id = context.auth.token.tenant_id;
    // Get tenant to check if caller is owner
    const tenantDoc = await db.collection('tenants').doc(caller_tenant_id).get();
    const isOwner = tenantDoc.data()?.owner_id === context.auth.uid;
    // const isAdmin = context.auth.token.role === 'admin';
    // Validate input
    if (!user_id) {
        throw new functions.https.HttpsError('invalid-argument', 'user_id is required');
    }
    if (!new_role || !['owner', 'admin', 'member', 'guest', 'viewer'].includes(new_role)) {
        throw new functions.https.HttpsError('invalid-argument', 'new_role must be one of: owner, admin, member, guest, viewer');
    }
    // Prevent self-role-change (prevents admin lockout)
    if (user_id === context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'You cannot change your own role');
    }
    // Get target user's Firestore document first to check current role
    const userDoc = await db.collection('users').doc(user_id).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }
    const currentRole = userDoc.data().role;
    // Protect owner role - cannot be changed
    if (currentRole === 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Cannot change Owner role. Use transferOwnership function.');
    }
    // Prevent promotion to owner via this function
    if (new_role === 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Cannot promote to Owner. Use transferOwnership function.');
    }
    // Admin role change restrictions
    if (new_role === 'admin' && !isOwner) {
        throw new functions.https.HttpsError('permission-denied', 'Only Owner can promote users to Admin');
    }
    if (currentRole === 'admin' && !isOwner) {
        throw new functions.https.HttpsError('permission-denied', 'Only Owner can demote Admins');
    }
    // Get target user from Authentication
    let targetUser;
    try {
        targetUser = await admin.auth().getUser(user_id);
    }
    catch (error) {
        throw new functions.https.HttpsError('not-found', 'User not found in authentication system');
    }
    // Verify user is in same tenant
    if (targetUser.customClaims?.tenant_id !== caller_tenant_id) {
        throw new functions.https.HttpsError('permission-denied', 'User is not in your organization');
    }
    // Check if role actually changed
    if (currentRole === new_role) {
        return {
            success: true,
            message: 'User already has this role'
        };
    }
    // Update custom claims (critical for security)
    await admin.auth().setCustomUserClaims(user_id, {
        ...targetUser.customClaims,
        role: new_role
    });
    // Update Firestore user document
    await db.collection('users').doc(user_id).update({
        role: new_role,
        updated_at: firestore_1.FieldValue.serverTimestamp(),
        updated_by: context.auth.uid
    });
    // Create audit log
    await db.collection('audit_logs').add({
        tenant_id: caller_tenant_id,
        user_id: context.auth.uid,
        action: 'ROLE_UPDATED',
        collection: 'users',
        document_id: user_id,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        changes: {
            old_role: currentRole,
            new_role,
            target_user_email: targetUser.email
        }
    });
    console.log(`User ${context.auth.uid} changed role of ${targetUser.email} from ${currentRole} to ${new_role}`);
    return {
        success: true,
        message: `User role updated to ${new_role}`,
        old_role: currentRole,
        new_role
    };
});
//# sourceMappingURL=updateUserRole.js.map