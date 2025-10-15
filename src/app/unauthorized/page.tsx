/**
 * Unauthorized Page
 *
 * Shown when user tries to access a page they don't have permission for
 * - Displays access denied message
 * - Provides navigation back to dashboard or home
 *
 * NOTE: This is a simple static page. We don't fetch user data since
 * users reaching this page either don't have permission or aren't logged in.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/dal';

export default async function UnauthorizedPage() {
  // Check if user is authenticated (optional - for customizing message)
  const session = await getCurrentSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              {session
                ? `Your current role (${session.role === 'tenant_admin' ? 'Admin' : 'User'}) doesn&apos;t have access to this resource.`
                : 'You need to be signed in to access this page.'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {session ? (
              <>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Go to Home</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Go to Home</Link>
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <a
                href="mailto:support@example.com"
                className="font-medium text-primary hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
