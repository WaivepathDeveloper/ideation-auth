"use strict";
/**
 * Multi-Tenant Authentication System - Cloud Functions
 *
 * This module exports all Firebase Cloud Functions for the auth system:
 * - Authentication triggers (onUserCreate)
 * - Callable functions (inviteUser, updateUserRole, deleteUserFromTenant)
 * - Scheduled functions (cleanupRateLimits)
 *
 * Security: All functions implement rate limiting and tenant isolation
 */
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
exports.cleanupRateLimits = exports.deleteUserFromTenant = exports.updateUserRole = exports.inviteUser = exports.onUserCreate = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Auth Functions - User management
var onUserCreate_1 = require("./auth/onUserCreate");
Object.defineProperty(exports, "onUserCreate", { enumerable: true, get: function () { return onUserCreate_1.onUserCreate; } });
var inviteUser_1 = require("./auth/inviteUser");
Object.defineProperty(exports, "inviteUser", { enumerable: true, get: function () { return inviteUser_1.inviteUser; } });
var updateUserRole_1 = require("./auth/updateUserRole");
Object.defineProperty(exports, "updateUserRole", { enumerable: true, get: function () { return updateUserRole_1.updateUserRole; } });
var deleteUserFromTenant_1 = require("./auth/deleteUserFromTenant");
Object.defineProperty(exports, "deleteUserFromTenant", { enumerable: true, get: function () { return deleteUserFromTenant_1.deleteUserFromTenant; } });
// Scheduled Functions - Maintenance
var cleanupRateLimits_1 = require("./scheduled/cleanupRateLimits");
Object.defineProperty(exports, "cleanupRateLimits", { enumerable: true, get: function () { return cleanupRateLimits_1.cleanupRateLimits; } });
// Future GDPR Functions (Post-MVP)
// export { cleanupDeletedData } from './gdpr/cleanupDeletedData';
// export { exportUserData } from './gdpr/exportUserData';
//# sourceMappingURL=index.js.map