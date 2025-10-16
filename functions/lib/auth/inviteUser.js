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
exports.inviteUser = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const firestore_1 = require("firebase-admin/firestore");
const rateLimiting_1 = require("../utils/rateLimiting");
const db = admin.firestore();
/**
 * Callable Cloud Function: Invite user to tenant
 * Only tenant admins can invite users
 */
exports.inviteUser = functions.https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to invite users');
    }
    // Rate limiting
    await (0, rateLimiting_1.checkAPIRateLimit)(context.auth.uid);
    // Permission check - only admins can invite
    if (context.auth.token.role !== 'admin' && context.auth.token.role !== 'owner') {
        throw new functions.https.HttpsError('permission-denied', 'Only Admins and Owners can invite users');
    }
    const { email, role, resource_permissions } = data;
    const tenant_id = context.auth.token.tenant_id;
    // Only owner can invite admin
    if (role === 'admin') {
        const tenantDoc = await db.collection('tenants').doc(tenant_id).get();
        if (tenantDoc.data()?.owner_id !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Only the Owner can invite Admins');
        }
    }
    // Guest role requires resource_permissions
    if (role === 'guest' && !resource_permissions) {
        throw new functions.https.HttpsError('invalid-argument', 'Guest role requires resource_permissions map');
    }
    // Validate input
    if (!email || !email.includes('@')) {
        throw new functions.https.HttpsError('invalid-argument', 'Valid email address is required');
    }
    if (!role || !['admin', 'member', 'guest', 'viewer'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role must be one of: admin, member, guest, viewer');
    }
    // Check if user already exists in tenant
    const existingUser = await db.collection('users')
        .where('tenant_id', '==', tenant_id)
        .where('email', '==', email)
        .limit(1)
        .get();
    if (!existingUser.empty) {
        throw new functions.https.HttpsError('already-exists', 'User with this email already exists in your organization');
    }
    // Check for existing pending invitation
    const existingInvite = await db.collection('invitations')
        .where('tenant_id', '==', tenant_id)
        .where('email', '==', email)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
    if (!existingInvite.empty) {
        throw new functions.https.HttpsError('already-exists', 'Pending invitation already exists for this email');
    }
    // Check tenant user limit
    const tenantDoc = await db.collection('tenants').doc(tenant_id).get();
    const maxUsers = tenantDoc.data()?.settings?.max_users || 50;
    const currentUsers = await db.collection('users')
        .where('tenant_id', '==', tenant_id)
        .where('status', '==', 'active')
        .count()
        .get();
    if (currentUsers.data().count >= maxUsers) {
        throw new functions.https.HttpsError('resource-exhausted', `Your organization has reached the maximum user limit of ${maxUsers}`);
    }
    // Create invitation
    const inviteData = {
        tenant_id,
        email,
        role,
        invited_by: context.auth.uid,
        invited_at: firestore_1.FieldValue.serverTimestamp(),
        status: 'pending',
        expires_at: firestore_1.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    // Include resource_permissions for guest role
    if (role === 'guest' && resource_permissions) {
        inviteData.resource_permissions = resource_permissions;
    }
    const inviteRef = await db.collection('invitations').add(inviteData);
    // Create audit log
    await db.collection('audit_logs').add({
        tenant_id,
        user_id: context.auth.uid,
        action: 'INVITATION_CREATED',
        collection: 'invitations',
        document_id: inviteRef.id,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        changes: {
            email,
            role
        }
    });
    console.log(`User ${context.auth.uid} invited ${email} to tenant ${tenant_id} as ${role}`);
    return {
        success: true,
        invitationId: inviteRef.id,
        message: `Invitation sent to ${email}`
    };
});
//# sourceMappingURL=inviteUser.js.map