import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * AuthCard Component
 *
 * Reusable card wrapper for authentication forms
 * Provides consistent styling and layout for sign-in and sign-up pages
 *
 * @param title - Card title (e.g., "Sign In", "Create Account")
 * @param children - Form content
 * @param footer - Optional footer content (e.g., "Don't have an account? Sign up")
 */
export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-center">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
