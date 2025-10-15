/**
 * Shared Configuration for next-firebase-auth-edge
 *
 * These values MUST match across:
 * - Middleware (src/middleware.ts)
 * - API Routes (src/app/api/login, logout)
 * - Client Code (TenantAuthContext)
 *
 * SECURITY: Cookie signature keys should be rotated regularly
 * See: https://developer.okta.com/docs/concepts/key-rotation/
 */

export const authConfig = {
  loginPath: '/api/login',
  logoutPath: '/api/logout',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  cookieName: 'AuthToken',
  cookieSignatureKeys: [
    process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
    process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS || process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
  ],
  cookieSerializeOptions: {
    path: '/',
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection
    maxAge: 12 * 60 * 60 * 24, // 12 days
  },
  serviceAccount: {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
  enableMultipleCookies: true, // Split tokens across cookies to avoid size limits
  checkRevoked: false, // Don't check Firebase server on every request (performance)
};

/**
 * Validate that all required environment variables are set
 * Called at module load time to fail fast
 */
function validateAuthConfig() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'AUTH_COOKIE_SIGNATURE_KEY_CURRENT',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required auth environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all variables are set.'
    );
  }
}

// Validate config on module load (fail fast)
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateAuthConfig();
}
