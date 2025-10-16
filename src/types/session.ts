/**
 * Session Schema Types
 *
 * Defines the structure of session documents stored in Firestore.
 * Sessions are used for BFF (Backend for Frontend) authentication pattern.
 */

import { Timestamp } from 'firebase/firestore';
import type { UserRole } from './roles';

export interface Session {
  /**
   * Unique session identifier (stored in httpOnly cookie)
   * Generated using crypto.randomBytes(32).toString('base64url')
   */
  session_id: string;

  /**
   * Firebase Auth user ID
   */
  user_id: string;

  /**
   * Tenant ID for multi-tenant isolation
   */
  tenant_id: string;

  /**
   * User role within the tenant
   */
  role: UserRole;

  /**
   * User email (for logging/monitoring)
   */
  email: string;

  /**
   * Firebase ID token (encrypted, stored server-side only)
   * Never exposed to client
   */
  firebase_token: string;

  /**
   * Session creation timestamp
   */
  created_at: Timestamp;

  /**
   * Session expiration timestamp (TTL index auto-deletes)
   * Default: 5 days from creation
   */
  expires_at: Timestamp;

  /**
   * Last activity timestamp (updated on each request)
   * Used for idle timeout and suspicious activity detection
   */
  last_activity: Timestamp;

  /**
   * Client IP address (for security monitoring)
   */
  ip_address: string;

  /**
   * Client User-Agent header (for security monitoring)
   */
  user_agent: string;

  /**
   * Session metadata (optional)
   */
  metadata?: {
    /**
     * Device type (mobile, desktop, tablet)
     */
    device_type?: string;

    /**
     * Browser name and version
     */
    browser?: string;

    /**
     * Operating system
     */
    os?: string;

    /**
     * Location (city, country) from IP geolocation
     */
    location?: string;
  };
}

/**
 * Session creation input (before timestamps)
 */
export interface CreateSessionInput {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
  firebase_token: string;
  ip_address: string;
  user_agent: string;
  metadata?: Session['metadata'];
}

/**
 * Session data returned to middleware (no sensitive tokens)
 */
export interface SessionContext {
  session_id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
  expires_at: Date;
  last_activity: Date;
}
