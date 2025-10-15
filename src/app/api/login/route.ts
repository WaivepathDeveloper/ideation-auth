import { NextRequest, NextResponse } from 'next/server';
import { refreshNextResponseCookiesWithToken } from 'next-firebase-auth-edge/lib/next/cookies';
import { authConfig } from '@/config/auth-edge.config';

/**
 * Login API Route - Sets authentication cookies
 *
 * Called by client after Firebase Auth signup/signin.
 * Receives ID token and creates signed httpOnly cookie.
 *
 * Flow:
 * 1. Client authenticates with Firebase (createUserWithEmailAndPassword or signInWithEmailAndPassword)
 * 2. Client gets ID token from Firebase user
 * 3. Client POSTs to this endpoint with Authorization header
 * 4. This endpoint validates token and creates signed cookie
 * 5. Middleware verifies cookie on subsequent requests
 *
 * Official docs: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/refresh-credentials
 */
export async function POST(request: NextRequest) {
  // Extract ID token from Authorization header
  const authorization = request.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    console.error('[API /login] Missing or invalid Authorization header');
    return NextResponse.json(
      { error: 'Unauthorized - Missing Bearer token' },
      { status: 401 }
    );
  }

  const idToken = authorization.split('Bearer ')[1];

  if (!idToken) {
    console.error('[API /login] Invalid token format');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token format' },
      { status: 401 }
    );
  }

  try {
    console.log('[API /login] Setting authentication cookies...');

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Use official library function to set auth cookies
    // Function signature: refreshNextResponseCookiesWithToken(idToken, request, response, options)
    // This validates the ID token and creates signed cookies
    // The library handles:
    // - Token verification with Firebase
    // - Cookie signing with rotating keys
    // - Setting httpOnly, secure, sameSite attributes
    const updatedResponse = await refreshNextResponseCookiesWithToken(
      idToken,
      request,
      response,
      authConfig
    );

    console.log('[API /login] Authentication successful - cookies set');
    return updatedResponse;
  } catch (error) {
    console.error('[API /login] Authentication error:', error);

    // Provide more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
