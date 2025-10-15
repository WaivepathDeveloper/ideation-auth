/**
 * ProgressBar Component
 *
 * Simple horizontal progress bar with CSS animation
 * No external dependencies - pure CSS + design tokens
 *
 * Features:
 * - Smooth width transitions
 * - Accessible with ARIA attributes
 * - Uses design tokens for colors
 * - Optional label display
 */

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  label,
  variant = 'default',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {label || 'Progress'}
          </span>
          <span className="font-medium text-foreground">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            variantClasses[variant]
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
}
