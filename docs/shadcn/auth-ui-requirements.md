# Authentication UI Requirements

## Feature Overview

Secure, multi-tenant Firebase authentication system with a comprehensive design tokens system, reusable shadcn-based components, and seamless integration with existing TenantAuthContext backend.

## 1. Design Tokens System

### 1.1 Token Structure

Create a centralized design tokens file (`src/styles/tokens.css`) with CSS variables organized into categories:

#### Color Tokens
```css
/* Primary Brand Colors */
--color-primary-50: hsl(214, 100%, 97%);
--color-primary-100: hsl(214, 95%, 93%);
--color-primary-500: hsl(217, 91%, 60%);  /* Main brand color */
--color-primary-600: hsl(217, 91%, 50%);  /* Hover state */
--color-primary-700: hsl(217, 91%, 40%);

/* Neutral/Gray Scale */
--color-neutral-50: hsl(0, 0%, 98%);
--color-neutral-100: hsl(0, 0%, 96%);
--color-neutral-200: hsl(0, 0%, 90%);
--color-neutral-300: hsl(0, 0%, 83%);
--color-neutral-500: hsl(0, 0%, 64%);
--color-neutral-700: hsl(0, 0%, 38%);
--color-neutral-900: hsl(0, 0%, 9%);

/* Semantic Colors */
--color-error-50: hsl(0, 86%, 97%);
--color-error-100: hsl(0, 93%, 94%);
--color-error-500: hsl(0, 84%, 60%);
--color-error-700: hsl(0, 74%, 42%);

--color-success-50: hsl(142, 76%, 97%);
--color-success-100: hsl(142, 71%, 93%);
--color-success-500: hsl(142, 71%, 45%);
--color-success-700: hsl(142, 71%, 35%);

--color-warning-50: hsl(48, 100%, 97%);
--color-warning-100: hsl(48, 96%, 89%);
--color-warning-500: hsl(48, 96%, 53%);
--color-warning-700: hsl(48, 96%, 43%);

/* Input-specific Colors */
--color-input-border: var(--color-neutral-300);
--color-input-border-hover: var(--color-neutral-400);
--color-input-border-focus: var(--color-primary-500);
--color-input-bg: hsl(0, 0%, 100%);
--color-input-bg-disabled: var(--color-neutral-100);
```

#### Spacing Tokens
```css
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
```

#### Typography Tokens
```css
/* Font Families */
--font-sans: ui-sans-serif, system-ui, sans-serif;
--font-mono: ui-monospace, monospace;

/* Font Sizes */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-md: 1rem;       /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

#### Border Tokens
```css
--border-radius-sm: 0.25rem;   /* 4px */
--border-radius-md: 0.375rem;  /* 6px */
--border-radius-lg: 0.5rem;    /* 8px */
--border-radius-xl: 0.75rem;   /* 12px */

--border-width-thin: 1px;
--border-width-medium: 2px;
```

#### Shadow Tokens
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-focus: 0 0 0 3px var(--color-primary-100);
```

#### Transition Tokens
```css
--transition-fast: 150ms;
--transition-normal: 200ms;
--transition-slow: 300ms;
--transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
```

### 1.2 Dark Mode Support

All tokens include dark mode variants using `@media (prefers-color-scheme: dark)`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Update all color tokens for dark mode */
    --color-neutral-50: hsl(0, 0%, 9%);
    --color-neutral-900: hsl(0, 0%, 98%);
    /* ... etc */
  }
}
```

### 1.3 Tailwind Integration

Update `src/app/globals.css` to import tokens and map to Tailwind v4 theme:

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme inline {
  /* Map tokens to Tailwind */
  --color-primary: var(--color-primary-500);
  --color-background: var(--color-neutral-50);
  --color-foreground: var(--color-neutral-900);
  /* ... etc */
}
```

## 2. shadcn/ui Components Required

### 2.1 Core Components (Install via shadcn CLI)

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add alert
```

#### Button Component (`src/components/ui/button.tsx`)
- **Variants**: default (primary), secondary, outline, ghost, destructive
- **Sizes**: sm, md (default), lg
- **States**: default, hover, active, disabled, loading
- **Uses tokens**: `--color-primary-*`, `--border-radius-md`, `--transition-normal`

#### Input Component (`src/components/ui/input.tsx`)
- **Types**: text, email, password
- **States**: default, focus, error, disabled
- **Uses tokens**: `--color-input-*`, `--border-radius-md`, `--spacing-md`, `--shadow-focus`

#### Label Component (`src/components/ui/label.tsx`)
- **Purpose**: Accessible form labels with htmlFor binding
- **Uses tokens**: `--font-size-sm`, `--font-weight-medium`, `--color-neutral-700`

#### Card Component (`src/components/ui/card.tsx`)
- **Parts**: Card, CardHeader, CardContent, CardFooter
- **Uses tokens**: `--border-radius-lg`, `--shadow-md`, `--color-neutral-100`

#### Alert Component (`src/components/ui/alert.tsx`)
- **Variants**: default, destructive (error), success, warning
- **Parts**: Alert, AlertTitle, AlertDescription
- **Uses tokens**: `--color-error-*`, `--color-success-*`, `--border-radius-md`

### 2.2 Extended Components (From Available Registry)

#### Spinner Component
- **Source**: Available in shadcn registry
- **Purpose**: Loading indicator in buttons and form states
- **Usage**: `<Spinner className="w-4 h-4" />`

#### useBoolean Hook
- **Source**: Available in shadcn registry (`use-boolean`)
- **Purpose**: Toggle password visibility
- **Usage**: `const [showPassword, toggleShowPassword] = useBoolean(false);`

## 3. Shared Reusable Components

### 3.1 FormField Component (`src/components/shared/FormField.tsx`)

**Purpose**: Reusable wrapper combining Label + Input + Error message

**Props**:
```typescript
interface FormFieldProps {
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
```

**Composition**:
- Uses `<Label>` from shadcn
- Uses `<Input>` from shadcn
- Displays error message with `aria-describedby`
- Applies error styling when error present

**Accessibility**:
- `aria-invalid="true"` when error exists
- `aria-describedby="{id}-error"` links to error message
- Error message has `role="alert"` for screen readers

### 3.2 PasswordInput Component (`src/components/shared/PasswordInput.tsx`)

**Purpose**: Password input with visibility toggle

**Props**: Extends `FormFieldProps`

**Composition**:
- Uses `<FormField>` as base
- Adds visibility toggle button (eye icon)
- Uses `useBoolean` hook for show/hide state
- Icons from lucide-react: `Eye`, `EyeOff`

**Accessibility**:
- Toggle button has `aria-label="Toggle password visibility"`
- Toggle button is keyboard accessible (Tab + Enter/Space)

### 3.3 FormAlert Component (`src/components/shared/FormAlert.tsx`)

**Purpose**: Styled alert for form-level errors/success messages

**Props**:
```typescript
interface FormAlertProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
}
```

**Composition**:
- Uses `<Alert>` from shadcn
- Maps variant to color tokens
- Optional dismiss button
- Icons from lucide-react: `AlertCircle`, `CheckCircle`, `AlertTriangle`, `Info`

**Accessibility**:
- `role="alert"` for errors
- `aria-live="polite"` for success messages

### 3.4 AuthCard Component (`src/components/shared/AuthCard.tsx`)

**Purpose**: Consistent card wrapper for auth forms

**Props**:
```typescript
interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Composition**:
- Uses `<Card>` from shadcn
- Consistent padding and max-width
- Title in `<CardHeader>`
- Form in `<CardContent>`
- Optional footer in `<CardFooter>`

**Styling**:
- Max width: 28rem (448px)
- Centered with `mx-auto`
- Uses `--shadow-lg` for elevation

### 3.5 SocialDivider Component (`src/components/shared/SocialDivider.tsx`)

**Purpose**: "Or continue with" divider for OAuth section

**Props**:
```typescript
interface SocialDividerProps {
  text?: string; // Default: "Or continue with"
}
```

**Composition**:
- Horizontal line with centered text
- Uses `--color-neutral-300` for line
- Uses `--color-neutral-500` for text

**Accessibility**:
- Semantic `<hr>` element
- Text has sufficient contrast

## 4. Validation with Zod

### 4.1 Validation Schemas (`src/lib/validations/auth.schema.ts`)

```typescript
import { z } from 'zod';

// Sign In Schema
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

// Sign Up Schema
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
```

### 4.2 Validation Integration Approach

**Option 1: Manual Zod Validation** (Recommended for simplicity)
- Validate on form submit
- Validate individual fields on blur
- Display field-level errors immediately
- No additional dependencies

**Option 2: react-hook-form + zodResolver** (For complex forms)
- Install `react-hook-form` and `@hookform/resolvers`
- More features but heavier
- Consider for future admin forms

### 4.3 Error Handling Flow

1. **Client-side validation** (Zod) → Display field errors
2. **Submit validated data** → Call TenantAuth functions
3. **Backend errors** (Firebase) → Map to user-friendly messages
4. **Display errors** → FormAlert component

## 5. Component Hierarchy

```
AuthCard
├── CardHeader (title)
├── CardContent
│   ├── FormAlert (error/success messages)
│   ├── <form>
│   │   ├── FormField (email)
│   │   ├── PasswordInput (password)
│   │   ├── PasswordInput (confirm password - signup only)
│   │   └── Button (submit with loading state)
│   ├── SocialDivider
│   └── Button (Google OAuth with icon)
└── CardFooter (navigation link to other form)
```

## 6. Integration with Existing TenantAuthContext

### 6.1 Preserved Backend API

The following TenantAuthContext features remain **unchanged**:

```typescript
const {
  signIn,           // (email, password) => Promise<void>
  signUp,           // (email, password) => Promise<void>
  signInWithGoogle, // () => Promise<void>
  loading,          // Global auth loading state
  error,            // Global auth error (not used in new forms)
  user,             // Current user with tenant_id, role
  tenant,           // Current tenant details
  tenantDB,         // TenantFirestore instance
  signOut,          // () => Promise<void>
  refreshToken      // () => Promise<void>
} = useTenantAuth();
```

### 6.2 Form Component Integration Pattern

```typescript
// In SignInForm.tsx
const { signIn } = useTenantAuth();
const [formError, setFormError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (data: SignInFormData) => {
  setFormError(null);
  setIsSubmitting(true);

  try {
    // Validate with Zod
    const validated = signInSchema.parse(data);

    // Call TenantAuth backend
    await signIn(validated.email, validated.password);

    // Redirect handled by middleware or in component
    router.push('/dashboard');
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Handle validation errors
      setFieldErrors(err.errors);
    } else {
      // Handle Firebase errors
      setFormError(mapFirebaseError(err));
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### 6.3 Firebase Error Mapping (Preserved)

Existing error mapping logic stays intact:

```typescript
const mapFirebaseError = (err: any): string => {
  switch (err.code) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    default:
      return err.message || 'An error occurred';
  }
};
```

### 6.4 Loading States

- **Form-level loading**: Local `isSubmitting` state for submit button
- **Global loading**: TenantAuthContext `loading` for initial auth check
- **Button states**: Disabled during submission with spinner

### 6.5 Success Handling

- **Custom claims wait**: Handled by TenantAuthContext (no UI changes needed)
- **Redirect**: `router.push('/dashboard')` after successful auth
- **Auto token refresh**: Already implemented in context (no UI changes)

## 7. File Structure

```
src/
├── styles/
│   └── tokens.css              # Design tokens (CSS variables)
│
├── lib/
│   ├── validations/
│   │   ├── auth.schema.ts      # Zod schemas for auth
│   │   └── index.ts            # Export all schemas
│   └── utils/
│       └── errorMapping.ts     # Firebase error → user message
│
├── components/
│   ├── ui/                     # shadcn components (CLI installed)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   └── spinner.tsx
│   │
│   ├── shared/                 # Reusable auth components
│   │   ├── FormField.tsx       # Label + Input + Error
│   │   ├── PasswordInput.tsx   # Input with visibility toggle
│   │   ├── FormAlert.tsx       # Styled alert component
│   │   ├── AuthCard.tsx        # Card wrapper for forms
│   │   └── SocialDivider.tsx   # "Or continue with" divider
│   │
│   └── auth/                   # Auth-specific forms
│       ├── SignInForm.tsx      # Refactored sign in
│       └── SignUpForm.tsx      # Refactored sign up
│
├── app/
│   ├── globals.css             # Import tokens, Tailwind config
│   ├── login/
│   │   └── page.tsx            # Uses SignInForm
│   └── signup/
│       └── page.tsx            # Uses SignUpForm
│
└── contexts/
    └── TenantAuthContext.tsx   # UNCHANGED (existing backend)
```

## 8. Data Flow Patterns

### 8.1 Sign In Flow

```
User Input → FormField Components
  ↓
Zod Validation (on blur/submit)
  ↓
Valid Data → useTenantAuth().signIn()
  ↓
TenantAuthContext (calls Firebase)
  ↓
Success → router.push('/dashboard')
Error → mapFirebaseError() → FormAlert
```

### 8.2 Sign Up Flow

```
User Input → FormField + PasswordInput Components
  ↓
Zod Validation (password strength + match)
  ↓
Valid Data → useTenantAuth().signUp()
  ↓
TenantAuthContext (calls Firebase + waits for claims)
  ↓
Success → router.push('/dashboard')
Error → mapFirebaseError() → FormAlert
```

### 8.3 Google OAuth Flow

```
User Click → Button (Google)
  ↓
useTenantAuth().signInWithGoogle()
  ↓
TenantAuthContext (Google popup + claim check)
  ↓
Success → router.push('/dashboard')
Error → mapFirebaseError() → FormAlert
```

## 9. Accessibility Requirements

### 9.1 Keyboard Navigation

- All form fields accessible via Tab
- Submit on Enter key from any field
- Password toggle accessible via keyboard
- Skip to main content link (future)

### 9.2 Screen Reader Support

**Form Labels**:
- Every input has associated `<Label>` with `htmlFor`
- Labels are visible (not placeholder-only)

**Error Announcements**:
- Field errors: `aria-describedby` links to error message
- Form errors: `role="alert"` on FormAlert
- Live regions: `aria-live="polite"` for success messages

**Input States**:
- `aria-invalid="true"` when field has error
- `aria-required="true"` on required fields
- `aria-disabled="true"` on disabled inputs

**Button States**:
- Loading state announced: "Signing in..." (text change)
- Disabled state prevents interaction

### 9.3 Color Contrast (WCAG AA)

- Text on background: minimum 4.5:1 ratio
- Error text: minimum 4.5:1 ratio
- Focus indicators: visible and minimum 3:1 ratio
- Tested with both light and dark modes

### 9.4 Focus Management

- Visible focus indicators on all interactive elements
- Focus ring uses `--shadow-focus` token
- Error fields receive focus on validation failure (optional)
- First field auto-focused on page load (optional)

## 10. Validation Rules Summary

### 10.1 Sign In Validation

| Field    | Rules                                      |
|----------|-------------------------------------------|
| Email    | Required, valid email format              |
| Password | Required (no strength check for login)    |

### 10.2 Sign Up Validation

| Field            | Rules                                                                 |
|------------------|----------------------------------------------------------------------|
| Email            | Required, valid email format                                         |
| Password         | Required, min 6 characters, must contain uppercase, lowercase, number |
| Confirm Password | Required, must match password                                         |

### 10.3 Client vs Server Validation

**Client (Zod)**:
- Format validation (email structure)
- Length requirements
- Password matching
- Display immediate feedback

**Server (Firebase)**:
- Email already exists
- Rate limiting (too many attempts)
- Account disabled
- Network errors

## 11. Implementation Steps

### 11.1 Phase 1: Design Tokens & Core Components

1. Create `src/styles/tokens.css` with all CSS variables
2. Update `src/app/globals.css` to import tokens
3. Install shadcn components: `button`, `input`, `label`, `card`, `alert`
4. Test tokens apply correctly to shadcn components

### 11.2 Phase 2: Shared Components

1. Create `FormField` component (uses Label + Input)
2. Create `PasswordInput` component (uses FormField + useBoolean)
3. Create `FormAlert` component (uses Alert)
4. Create `AuthCard` component (uses Card)
5. Create `SocialDivider` component
6. Test each component in isolation

### 11.3 Phase 3: Validation Layer

1. Install Zod: `npm install zod`
2. Create `src/lib/validations/auth.schema.ts`
3. Create `src/lib/utils/errorMapping.ts` (extract from existing forms)
4. Test validation schemas

### 11.4 Phase 4: Refactor Auth Forms

1. Refactor `SignInForm.tsx` to use shared components
2. Refactor `SignUpForm.tsx` to use shared components
3. Integrate Zod validation
4. Test complete auth flows (sign in, sign up, Google OAuth)
5. Verify backend integration (TenantAuthContext unchanged)

### 11.5 Phase 5: Accessibility & Polish

1. Add ARIA labels and roles
2. Test keyboard navigation
3. Test with screen reader
4. Verify color contrast
5. Add loading spinners
6. Test error states

## 12. Dependencies to Install

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "lucide-react": "^0.300.0"
  }
}
```

shadcn components are installed via CLI (no package.json dependency).

## 13. Testing Checklist

### 13.1 Visual Testing

- [ ] All components use design tokens (no hardcoded colors)
- [ ] Light mode styling correct
- [ ] Dark mode styling correct
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Loading states visible
- [ ] Error states styled correctly

### 13.2 Functional Testing

- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials (shows error)
- [ ] Sign up with valid data
- [ ] Sign up with mismatched passwords (shows error)
- [ ] Sign up with weak password (shows error)
- [ ] Google OAuth sign in
- [ ] Form validation on blur
- [ ] Form validation on submit
- [ ] Loading states during auth

### 13.3 Accessibility Testing

- [ ] Tab navigation through all fields
- [ ] Submit form with Enter key
- [ ] Screen reader announces labels
- [ ] Screen reader announces errors
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] aria-invalid on error fields
- [ ] Error messages linked with aria-describedby

### 13.4 Integration Testing

- [ ] TenantAuthContext functions called correctly
- [ ] Custom claims wait logic preserved
- [ ] Token refresh works
- [ ] Redirect to dashboard on success
- [ ] Firebase errors mapped to friendly messages
- [ ] Rate limiting handled correctly

## 14. Rebranding Capability

To rebrand the entire application:

1. **Update `src/styles/tokens.css`**:
   - Change primary color hue: `--color-primary-500`
   - Adjust neutral colors if needed
   - Update border radius for brand style

2. **All components auto-update** (use tokens, not hardcoded values)

3. **Optional**: Update logo, fonts in `globals.css`

**Single source of truth**: `tokens.css` controls all styling.

## 15. Future Enhancements (Out of Scope)

- Forgot password flow
- Email verification UI
- Multi-factor authentication
- Social logins beyond Google (Facebook, GitHub)
- Progressive disclosure for password requirements
- Password strength meter
- Remember me functionality (currently placeholder)
