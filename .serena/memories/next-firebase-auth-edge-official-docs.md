# next-firebase-auth-edge Official Documentation URLs

## Core Documentation Pages

### Setup & Configuration
- **Getting Started**: https://next-firebase-auth-edge-docs.vercel.app/docs/getting-started
- **Middleware Setup**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/middleware

### API Routes
- **App Router API Routes** (Next.js 13+): https://next-firebase-auth-edge-docs.vercel.app/docs/usage/app-router-api-routes
- **Pages Router API Routes** (Next.js 12): https://next-firebase-auth-edge-docs.vercel.app/docs/usage/pages-router-api-routes

### Authentication Operations
- **Refresh Credentials** (/api/login pattern): https://next-firebase-auth-edge-docs.vercel.app/docs/usage/refresh-credentials
- **Remove Credentials** (/api/logout pattern): https://next-firebase-auth-edge-docs.vercel.app/docs/usage/remove-credentials
- **Client-Side APIs**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/client-side-apis

### Server-Side Usage
- **Server Components**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/server-components
- **getServerSideProps**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/get-server-side-props
- **Redirect Functions**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/redirect-functions

### Advanced Topics
- **Domain Restriction**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/domain-restriction
- **Advanced Usage**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/advanced-usage
- **Debug Mode**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/debug-mode

### Deployment
- **Cloud Run**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/cloud-run
- **Firebase Hosting**: https://next-firebase-auth-edge-docs.vercel.app/docs/usage/firebase-hosting

## Key Implementation Patterns from Official Docs

### Login API Route Pattern (from refresh-credentials docs)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from 'next-firebase-auth-edge';
import { setAuthCookies } from 'next-firebase-auth-edge/lib/next/cookies';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  
  const response = NextResponse.json({ success: true });
  
  return setAuthCookies(request, response, {
    apiKey: 'YOUR_API_KEY',
    cookieName: 'AuthToken',
    cookieSignatureKeys: ['KEY1', 'KEY2'],
    cookieSerializeOptions: { /* options */ },
    serviceAccount: { /* service account */ },
    token: idToken
  });
}
```

### Logout API Route Pattern (from remove-credentials docs)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { removeCookies } from 'next-firebase-auth-edge/lib/next/cookies';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  
  removeCookies(request.headers, response, {
    cookieName: 'AuthToken',
    cookieSerializeOptions: { /* options */ }
  });
  
  return response;
}
```

## Important Notes from Documentation

1. **Middleware Configuration**: The middleware config `loginPath` and `logoutPath` tell middleware which endpoints to set up, but **you still need to create the route handler files**.

2. **Cookie Management**: Use `setAuthCookies()` for login and `removeCookies()` for logout - these are the official library functions.

3. **Token Format**: Client sends ID token in request body as JSON `{ idToken: "..." }` OR in Authorization header `Bearer <token>`.

4. **Integration with Middleware**: Middleware verifies the cookies set by these API routes on subsequent requests.

## Library Version
- Package: `next-firebase-auth-edge`
- Current Version: 1.11.1 (as of project setup)
- NPM: https://www.npmjs.com/package/next-firebase-auth-edge
- GitHub: https://github.com/awinogrodzki/next-firebase-auth-edge