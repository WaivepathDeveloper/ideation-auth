'use client';

/**
 * AuthLoadingOverlay Component
 *
 * Simple full-page loading overlay for authentication operations
 * Uses only shadcn Spinner + CSS - no heavy libraries
 *
 * Features:
 * - Backdrop blur effect
 * - Multiple spinner variants
 * - Optional progress bar
 * - Optional status message
 * - Accessible with ARIA labels
 */

import { Spinner } from '@/components/ui/spinner';

interface AuthLoadingOverlayProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  showProgress?: boolean;
  progressValue?: number; // 0-100
}

export function AuthLoadingOverlay({
  isOpen,
  title = 'Loading',
  message,
  showProgress = false,
  progressValue = 0,
}: AuthLoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          {/* Spinner */}
          <div className="flex justify-center">
            <Spinner
              className="h-12 w-12 text-primary"
              aria-label="Loading"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {title}
            </h2>
            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                  role="progressbar"
                  aria-valuenow={progressValue}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(progressValue)}% complete
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
