'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBoolean } from '@/hooks/use-boolean';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

/**
 * PasswordInput Component
 *
 * Password field with visibility toggle button
 * Extends AuthField functionality with show/hide password feature
 *
 * Features:
 * - Password visibility toggle (eye icon)
 * - Accessible toggle button with proper ARIA labels
 * - Keyboard accessible (Tab + Enter/Space)
 * - Error state styling and messages
 *
 * @param label - Field label text
 * @param id - Unique field ID
 * @param value - Controlled input value
 * @param onChange - Value change handler
 * @param error - Error message to display
 * @param disabled - Whether input is disabled
 * @param required - Whether field is required
 * @param placeholder - Placeholder text
 * @param autoComplete - Autocomplete attribute (e.g., "current-password", "new-password")
 */
export function PasswordInput({
  label,
  id,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={error ? 'border-destructive pr-10' : 'pr-10'}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={toggleShowPassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
