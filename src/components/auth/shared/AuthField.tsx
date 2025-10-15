import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AuthFieldProps {
  label: string;
  id: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

/**
 * AuthField Component
 *
 * Reusable form field combining Label + Input + Error message
 * Provides consistent styling and accessibility for all auth form inputs
 *
 * Features:
 * - Accessible label-input binding via htmlFor/id
 * - Error state styling and ARIA attributes
 * - Error message announcement for screen readers
 *
 * @param label - Field label text
 * @param id - Unique field ID for accessibility
 * @param type - Input type (text, email, password)
 * @param value - Controlled input value
 * @param onChange - Value change handler
 * @param error - Error message to display
 * @param disabled - Whether input is disabled
 * @param required - Whether field is required
 * @param placeholder - Placeholder text
 * @param autoComplete - Autocomplete attribute value
 */
export function AuthField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  autoComplete,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={error ? 'border-destructive' : ''}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
