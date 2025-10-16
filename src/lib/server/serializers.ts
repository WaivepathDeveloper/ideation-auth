/**
 * Server-Side Serialization Utilities
 *
 * Converts Firestore data types (Timestamps, DocumentReferences, etc.)
 * into plain JavaScript objects that can be safely passed to Client Components.
 *
 * Next.js Server Components can only pass serializable data to Client Components.
 * Classes, functions, and complex objects must be converted to plain JSON-compatible values.
 */

/**
 * Serialize Firestore Timestamp to ISO 8601 string
 *
 * Handles both firebase-admin Timestamp objects and raw timestamp data
 * with _seconds and _nanoseconds properties.
 *
 * @param timestamp - Firestore Timestamp or timestamp-like object
 * @returns ISO 8601 string or null if invalid
 *
 * @example
 * ```typescript
 * const isoString = serializeTimestamp(doc.created_at);
 * // "2024-01-15T10:30:00.000Z"
 * ```
 */
export function serializeTimestamp(timestamp: unknown): string | null {
  if (!timestamp) {
    return null;
  }

  // Handle Timestamp objects with toDate() method
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    try {
      const toDateFn = (timestamp as { toDate: () => Date }).toDate;
      if (typeof toDateFn === 'function') {
        const date = toDateFn.call(timestamp);
        return date instanceof Date && !isNaN(date.getTime())
          ? date.toISOString()
          : null;
      }
    } catch {
      return null;
    }
  }

  // Handle raw timestamp data with _seconds property
  if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
    try {
      const seconds = (timestamp as { _seconds: number })._seconds;
      const date = new Date(seconds * 1000);
      return !isNaN(date.getTime()) ? date.toISOString() : null;
    } catch {
      return null;
    }
  }

  // Handle Date objects
  if (timestamp instanceof Date) {
    return !isNaN(timestamp.getTime()) ? timestamp.toISOString() : null;
  }

  // Handle ISO strings (already serialized)
  if (typeof timestamp === 'string') {
    return timestamp;
  }

  return null;
}

/**
 * Serialize Firestore document data for Client Components
 *
 * Recursively converts Firestore-specific types to plain JavaScript objects:
 * - Timestamps → ISO 8601 strings
 * - Nested objects → recursively serialized
 * - Arrays → mapped with serialization
 * - Primitives → returned as-is
 *
 * @param data - Firestore document data
 * @returns Serialized plain object
 *
 * @example
 * ```typescript
 * const serialized = serializeFirestoreData({
 *   name: "John",
 *   created_at: firestoreTimestamp,
 *   metadata: { updated_at: firestoreTimestamp }
 * });
 * // { name: "John", created_at: "2024-01-15T10:30:00.000Z", metadata: { updated_at: "2024-01-15T10:30:00.000Z" } }
 * ```
 */
export function serializeFirestoreData<T = unknown>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T;
  }

  // Handle Timestamp objects
  if (typeof data === 'object' && data !== null && ('toDate' in data || '_seconds' in data)) {
    return serializeTimestamp(data) as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData) as T;
  }

  // Handle plain objects
  if (typeof data === 'object' && data.constructor === Object) {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized as T;
  }

  // Return primitives as-is (string, number, boolean)
  return data as T;
}
