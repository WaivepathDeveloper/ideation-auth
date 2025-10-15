interface AuthDividerProps {
  text?: string;
}

/**
 * AuthDivider Component
 *
 * Horizontal divider with centered text for separating auth methods
 * Typically used between email/password and social auth buttons
 *
 * Features:
 * - Semantic <hr> element for accessibility
 * - Centered text with background
 * - Responsive spacing
 *
 * @param text - Divider text (default: "Or continue with")
 */
export function AuthDivider({ text = 'Or continue with' }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <hr className="w-full border-border" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-background text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
