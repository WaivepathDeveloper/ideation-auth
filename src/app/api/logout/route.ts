import { NextRequest, NextResponse } from 'next/server';
import { removeAuthCookies } from 'next-firebase-auth-edge/lib/next/cookies';
import { authConfig } from '@/config/auth-edge.config';

/**
 * Logout API Route - Clears authentication cookies
 *
 * Called by client to sign out user.
 * Expires the authentication cookie immediately.
 *
 * Flow:
 * 1. Client POSTs to this endpoint
 * 2. This endpoint expires the AuthToken cookie
 * 3. Middleware detects missing/invalid cookie
 * 4. User is redirected to login page
 *
 * Official docs: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/remove-credentials
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /logout] Clearing authentication cookies...');

    // Use official library function to remove auth cookies
    // Function signature: removeAuthCookies(headers, options) returns NextResponse
    // This expires the cookie by setting maxAge: 0
    // The library handles:
    // - Setting all cookie attributes correctly
    // - Ensuring cookie is cleared across all paths
    const response = removeAuthCookies(request.headers, {
      cookieName: authConfig.cookieName,
      cookieSerializeOptions: authConfig.cookieSerializeOptions,
    });

    console.log('[API /logout] Logout successful - cookies cleared');
    return response;
  } catch (error) {
    console.error('[API /logout] Logout error:', error);

    // Even if there's an error, return success
    // We want the user to be logged out client-side
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  }
}
