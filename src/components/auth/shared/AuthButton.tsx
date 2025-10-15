import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface AuthButtonProps {
  type?: 'submit' | 'button';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * AuthButton Component
 *
 * Reusable button with loading state for auth forms
 * Handles loading spinner, disabled state, and accessibility
 *
 * Features:
 * - Loading spinner with proper ARIA attributes
 * - Disabled state during loading
 * - Optional icon support (e.g., Google logo)
 * - Full width by default for consistency
 *
 * @param type - Button type (submit or button)
 * @param variant - Visual variant (default, outline, ghost)
 * @param disabled - Whether button is disabled
 * @param loading - Whether button is in loading state
 * @param children - Button text/content
 * @param onClick - Click handler
 * @param className - Additional CSS classes
 * @param icon - Optional icon to display before text
 */
export function AuthButton({
  type = 'button',
  variant = 'default',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  icon,
}: AuthButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full ${className}`}
      aria-busy={loading}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" aria-hidden="true" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
}
