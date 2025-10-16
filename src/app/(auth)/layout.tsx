/**
 * Auth Layout - Server Component
 *
 * Layout for public authentication pages (login, signup)
 * - Centers content vertically and horizontally
 * - Provides consistent styling for auth pages
 * - Middleware redirects authenticated users to /dashboard
 *
 * ARCHITECTURE: This is a Server Component rendered statically.
 * Middleware handles authenticated user redirects, not this layout.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render auth pages - middleware handles authenticated user redirects
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
