import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Get Firestore instance (lazy initialization)
 * This ensures firebase-admin is fully initialized before accessing firestore
 */
function getDb() {
  return admin.firestore();
}

/**
 * Layer 1: Login Rate Limiting
 * Prevents brute force attacks by limiting login attempts per email
 * Limit: 5 attempts per 15 minutes
 */
export async function checkLoginRateLimit(email: string): Promise<void> {
  const db = getDb();
  const limitDoc = await db.collection('rate_limits').doc(`auth_${email}`).get();
  const now = Timestamp.now();
  const windowDuration = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (limitDoc.exists) {
    const data = limitDoc.data()!;

    // Check if currently blocked
    if (data.blocked_until && data.blocked_until.toMillis() > now.toMillis()) {
      const remainingSeconds = Math.ceil((data.blocked_until.toMillis() - now.toMillis()) / 1000);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Too many failed login attempts. Try again in ${remainingSeconds} seconds.`
      );
    }

    // Check if window expired
    const windowExpired = (now.toMillis() - data.window_start.toMillis()) > windowDuration;

    if (windowExpired) {
      // Reset counter
      await limitDoc.ref.set({
        key: email,
        type: 'auth',
        count: 1,
        window_start: now,
        blocked_until: null
      });
    } else {
      // Increment counter
      const newCount = data.count + 1;

      if (newCount > maxAttempts) {
        // Block for 15 minutes
        await limitDoc.ref.update({
          count: newCount,
          blocked_until: Timestamp.fromMillis(now.toMillis() + windowDuration)
        });

        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many failed login attempts. Account temporarily locked for 15 minutes.'
        );
      } else {
        await limitDoc.ref.update({ count: newCount });
      }
    }
  } else {
    // First attempt - create record
    await db.collection('rate_limits').doc(`auth_${email}`).set({
      key: email,
      type: 'auth',
      count: 1,
      window_start: now,
      blocked_until: null
    });
  }
}

/**
 * Clear login rate limit on successful authentication
 */
export async function clearLoginRateLimit(email: string): Promise<void> {
  const db = getDb();
  await db.collection('rate_limits').doc(`auth_${email}`).delete();
}

/**
 * Layer 2: API Rate Limiting
 * Prevents API abuse by limiting requests per user
 * Limit: 100 requests per minute per user
 */
export async function checkAPIRateLimit(userId: string): Promise<void> {
  const db = getDb();
  const limitKey = `api_${userId}_${getMinuteKey()}`;
  const limitDoc = await db.collection('rate_limits').doc(limitKey).get();
  const maxRequests = 100;

  if (limitDoc.exists) {
    const count = limitDoc.data()!.count;

    if (count >= maxRequests) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Maximum ${maxRequests} requests per minute allowed.`
      );
    }

    // Increment counter
    await limitDoc.ref.update({
      count: FieldValue.increment(1)
    });
  } else {
    // Create new counter with TTL
    await limitDoc.ref.set({
      key: userId,
      type: 'api',
      count: 1,
      created_at: FieldValue.serverTimestamp(),
      expires_at: Timestamp.fromMillis(Date.now() + 120000) // 2 minutes
    });
  }
}

/**
 * Layer 3: Tenant Rate Limiting
 * Prevents one tenant from consuming all resources
 * Limit: 1000 requests per minute per tenant
 */
export async function checkTenantRateLimit(tenantId: string): Promise<void> {
  const db = getDb();
  const limitKey = `tenant_${tenantId}_${getMinuteKey()}`;
  const limitDoc = await db.collection('rate_limits').doc(limitKey).get();
  const maxRequests = 1000;

  if (limitDoc.exists && limitDoc.data()!.count >= maxRequests) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Tenant rate limit exceeded. Please contact support if you need higher limits.'
    );
  }

  if (limitDoc.exists) {
    await limitDoc.ref.update({
      count: FieldValue.increment(1)
    });
  } else {
    await limitDoc.ref.set({
      key: tenantId,
      type: 'tenant',
      count: 1,
      created_at: FieldValue.serverTimestamp(),
      expires_at: Timestamp.fromMillis(Date.now() + 120000) // 2 minutes
    });
  }
}

/**
 * Helper: Get minute-based key for auto-expiring rate limits
 */
function getMinuteKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
}
