import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AuthAlertProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  message: string;
  title?: string;
}

/**
 * AuthAlert Component
 *
 * Styled alert for form-level messages (errors, success, warnings, info)
 * Automatically maps variants to appropriate colors and icons
 *
 * Features:
 * - Visual feedback with icons
 * - Proper ARIA roles for screen readers
 * - Consistent styling across all auth forms
 *
 * @param variant - Alert type (error, success, warning, info)
 * @param message - Alert message text
 * @param title - Optional title (defaults based on variant)
 */
export function AuthAlert({ variant, message }: AuthAlertProps) {
  const config = {
    error: {
      icon: AlertCircle,
      alertVariant: 'destructive' as const,
      className: undefined,
      iconClassName: undefined,
      role: 'alert' as const,
      defaultTitle: 'Error',
    },
    success: {
      icon: CheckCircle,
      alertVariant: undefined,
      className: 'border-success bg-success/10 text-success-foreground',
      iconClassName: 'text-success',
      role: 'status' as const,
      defaultTitle: 'Success',
    },
    warning: {
      icon: AlertTriangle,
      alertVariant: undefined,
      className: 'border-warning bg-warning/10 text-warning-foreground',
      iconClassName: 'text-warning',
      role: 'alert' as const,
      defaultTitle: 'Warning',
    },
    info: {
      icon: Info,
      alertVariant: undefined,
      className: undefined,
      iconClassName: undefined,
      role: 'status' as const,
      defaultTitle: 'Info',
    },
  };

  const { icon: Icon, alertVariant, className, iconClassName, role } = config[variant];

  return (
    <Alert variant={alertVariant} className={className} role={role}>
      <Icon className={`h-4 w-4 ${iconClassName || ''}`} />
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}
