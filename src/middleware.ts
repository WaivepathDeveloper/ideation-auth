import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, redirectToLogin } from 'next-firebase-auth-edge';
import { authConfig } from '@/config/auth-edge.config';

/**
 * Next.js Middleware with next-firebase-auth-edge
 *
 * SECURITY: Production-grade authentication using signed JWT cookies
 * - Token verification on every request (Layer 1 protection)
 * - Data Access Layer provides Layer 2 protection
 * - Firestore Security Rules provide Layer 3 protection
 *
 * This middleware:
 * 1. Verifies signed JWT cookie containing Firebase ID token
 * 2. Validates token signature and expiration
 * 3. Checks custom claims (tenant_id, role)
 * 4. Injects user context into request headers
 * 5. Redirects unauthenticated users to /login
 *
 * NOTE: This is Layer 1 security. Data Access Layer (DAL) provides Layer 2.
 * Never rely on middleware alone for security.
 */

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * Public routes that don't require authentication
 */
const PUBLIC_PATHS = ['/login', '/signup', '/unauthorized'];

/**
 * Check if path is a public route
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// ============================================================================
// MIDDLEWARE HANDLER
// ============================================================================

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    ...authConfig,

    /**
     * Called when token is valid
     * Inject user context into headers for downstream use
     */
    handleValidToken: async ({ decodedToken }, headers) => {
      const { pathname } = request.nextUrl;

      // Verify custom claims exist (set by onUserCreate Cloud Function)
      if (!decodedToken.tenant_id || !decodedToken.role) {
        console.error('[Middleware] Missing custom claims:', {
          uid: decodedToken.uid,
          tenant_id: decodedToken.tenant_id,
          role: decodedToken.role,
        });

        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Authenticated users should not access public pages - redirect to dashboard
      if (isPublicPath(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Inject user context into request headers for Server Components/API routes
      headers.set('x-user-id', decodedToken.uid);
      headers.set('x-tenant-id', decodedToken.tenant_id as string);
      headers.set('x-user-role', decodedToken.role as string);
      headers.set('x-user-email', decodedToken.email || '');

      console.log('[Middleware] Authenticated request:', {
        path: pathname,
        uid: decodedToken.uid,
        tenant_id: decodedToken.tenant_id,
        role: decodedToken.role,
      });

      return NextResponse.next({
        request: {
          headers, // Pass modified headers to prevent re-verification
        },
      });
    },

    /**
     * Called when token is invalid or missing
     * Redirect unauthenticated users to login
     */
    handleInvalidToken: async (reason) => {
      console.log('[Middleware] Invalid token:', { reason });

      return redirectToLogin(request, {
        path: '/login',
        publicPaths: PUBLIC_PATHS,
      });
    },

    /**
     * Called when an unhandled error occurs
     * Log error and redirect to login
     */
    handleError: async (error) => {
      console.error('[Middleware] Authentication error:', error);

      return redirectToLogin(request, {
        path: '/login',
        publicPaths: PUBLIC_PATHS,
      });
    },
  });
}

// ============================================================================
// MIDDLEWARE ROUTE MATCHING
// ============================================================================

/**
 * Configure which routes this middleware runs on
 *
 * Includes:
 * - Auth API routes (/api/login, /api/logout)
 * - All pages (except excluded patterns)
 *
 * Excludes:
 * - Next.js internal paths (_next/)
 * - Static assets (images, fonts, etc.)
 * - Favicon
 */
export const config = {
  matcher: [
    '/api/login',
    '/api/logout',
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
};
