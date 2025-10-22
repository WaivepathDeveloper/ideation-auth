'use client';

/**
 * ComingSoonPlaceholder Component
 *
 * Reusable placeholder component for unimplemented features
 * Used in tabs, routes, and other areas where functionality is planned but not yet built
 *
 * Features:
 * - Card-based layout
 * - Icon display
 * - Customizable message
 * - Design token styling
 */

import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

/**
 * ComingSoonPlaceholder component props
 */
export interface ComingSoonPlaceholderProps {
  /** Optional custom message (defaults to generic message) */
  message?: string;
  /** Optional custom icon (defaults to Construction icon) */
  icon?: React.ReactNode;
}

/**
 * ComingSoonPlaceholder component
 *
 * Displays a centered placeholder with icon and message
 */
export function ComingSoonPlaceholder({
  message = 'This feature is under development and will be available soon.',
  icon,
}: ComingSoonPlaceholderProps) {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {/* Icon */}
        <div className="mb-4">
          {icon || <Construction className="h-12 w-12 text-muted-foreground" />}
        </div>

        {/* Heading */}
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>

        {/* Message */}
        <p className="text-sm text-muted-foreground max-w-md">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
