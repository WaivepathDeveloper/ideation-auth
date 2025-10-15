# Authentication UI Components Research

## Document Overview

This document provides comprehensive research on shadcn/ui components and design token implementation for the authentication UI system. It includes complete installation commands, component source code, integration patterns, and best practices.

---

## Table of Contents

1. [Design Token System](#1-design-token-system)
2. [Tailwind v4 Integration](#2-tailwind-v4-integration)
3. [Core shadcn/ui Components](#3-core-shadcnui-components)
4. [Extended Components](#4-extended-components)
5. [Form Integration Patterns](#5-form-integration-patterns)
6. [Validation with Zod](#6-validation-with-zod)
7. [Accessibility Best Practices](#7-accessibility-best-practices)
8. [Installation Commands Summary](#8-installation-commands-summary)

---

## 1. Design Token System

### 1.1 CSS Variables Structure

shadcn/ui uses a centralized design token system based on CSS custom properties. The modern approach uses **OKLCH color space** for perceptually uniform colors.

#### Key CSS Variables (from shadcn/ui theming)

```css
:root {
  /* Border Radius */
  --radius: 0.625rem; /* 10px */

  /* Core Colors */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);

  /* Card */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  /* Primary (Brand) */
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);

  /* Secondary */
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  /* Muted */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  /* Accent */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  /* Destructive (Error) */
  --destructive: oklch(0.577 0.245 27.325);

  /* Border & Input */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);

  /* Focus Ring */
  --ring: oklch(0.708 0 0);
}

/* Dark Mode */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
```

#### Custom Tokens for Auth UI (src/styles/tokens.css)

Based on requirements, extend with custom semantic tokens:

```css
@layer base {
  :root {
    /* Success Colors */
    --success: oklch(0.645 0.15 142);
    --success-foreground: oklch(0.985 0.005 142);

    /* Warning Colors */
    --warning: oklch(0.84 0.16 84);
    --warning-foreground: oklch(0.28 0.07 46);

    /* Input-specific (optional overrides) */
    --input-border: var(--border);
    --input-border-hover: oklch(0.8 0 0);
    --input-border-focus: var(--primary);
    --input-bg: var(--background);
    --input-bg-disabled: var(--muted);

    /* Spacing (if not using Tailwind defaults) */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;

    /* Shadow Tokens */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-focus: 0 0 0 3px oklch(0.97 0 0 / 0.5);

    /* Transitions */
    --transition-fast: 150ms;
    --transition-normal: 200ms;
    --transition-slow: 300ms;
    --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dark {
    --success: oklch(0.51 0.13 142);
    --success-foreground: oklch(0.99 0.02 142);

    --warning: oklch(0.41 0.11 46);
    --warning-foreground: oklch(0.99 0.02 95);

    --shadow-focus: 0 0 0 3px oklch(0.269 0 0 / 0.5);
  }
}
```

### 1.2 Why OKLCH Color Space?

- **Perceptual Uniformity**: Colors with same lightness appear equally bright
- **Wide Gamut**: Supports vibrant, modern colors
- **Better Gradients**: Smooth color transitions
- **Predictable**: Easier to create color scales

**OKLCH Format**: `oklch(L C H / A)`
- L = Lightness (0-1)
- C = Chroma (saturation)
- H = Hue (0-360)
- A = Alpha (optional)

---

## 2. Tailwind v4 Integration

### 2.1 Global CSS Setup (src/app/globals.css)

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme inline {
  /* Map CSS variables to Tailwind utilities */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Custom semantic colors */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: var(--radius);
}
```

### 2.2 Dark Mode Implementation

shadcn/ui uses a **class-based strategy** for dark mode:

1. Add `dark` class to root element (usually `<html>`)
2. CSS variables update automatically via `.dark` selector
3. Components inherit colors from CSS variables

**Next.js Setup (app/layout.tsx)**:

```tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 3. Core shadcn/ui Components

### 3.1 Button Component

#### Installation
```bash
npx shadcn@latest add button
```

#### Dependencies
- `@radix-ui/react-slot` (for `asChild` prop)
- `class-variance-authority` (for variants)
- `lucide-react` (for icons, optional)

#### Component API

**Variants**:
- `default` - Primary filled button
- `secondary` - Secondary filled button
- `outline` - Bordered button
- `ghost` - Transparent button
- `link` - Text link styled as button
- `destructive` - Error/delete action

**Sizes**:
- `sm` - Small button
- `default` - Default size
- `lg` - Large button
- `icon` - Square icon-only button
- `icon-sm` - Small icon button
- `icon-lg` - Large icon button

#### TypeScript Interface

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  asChild?: boolean
}
```

#### Usage Examples

```tsx
import { Button } from '@/components/ui/button'

// Primary button
<Button>Sign In</Button>

// Secondary variant
<Button variant="secondary">Cancel</Button>

// Outline variant
<Button variant="outline">Learn More</Button>

// Destructive (error)
<Button variant="destructive">Delete Account</Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  Submit
</Button>

// Icon button
<Button size="icon" variant="outline" aria-label="Close">
  <XIcon />
</Button>

// As Link (Next.js)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

#### Button with Icon Pattern

```tsx
<Button variant="outline" size="sm">
  <GitBranchIcon /> {/* Icon auto-sizes */}
  New Branch
</Button>
```

**Auto Icon Styling**: The button component includes classes for automatic icon spacing:
```css
[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

#### Customization with CSS Variables

```tsx
<Button
  className="bg-primary text-primary-foreground hover:bg-primary/90"
>
  Custom Styled
</Button>
```

---

### 3.2 Input Component

#### Installation
```bash
npx shadcn@latest add input
```

#### Dependencies
None (pure HTML input wrapper)

#### Component API

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

The Input component is a styled wrapper around native `<input>`:

```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### Usage Examples

```tsx
import { Input } from '@/components/ui/input'

// Text input
<Input type="text" placeholder="Enter your name" />

// Email input
<Input type="email" placeholder="email@example.com" />

// Password input
<Input type="password" placeholder="Enter password" />

// Disabled state
<Input disabled placeholder="Cannot edit" />

// With error state (custom)
<Input
  aria-invalid={hasError}
  className={hasError ? 'border-destructive' : ''}
  placeholder="email@example.com"
/>

// With ref
const inputRef = useRef<HTMLInputElement>(null)
<Input ref={inputRef} />
```

#### States

- **Default**: Normal input appearance
- **Focus**: Ring with `--ring` color
- **Disabled**: Reduced opacity, no interaction
- **Error**: Apply `border-destructive` via className

---

### 3.3 Label Component

#### Installation
```bash
npx shadcn@latest add label
```

#### Dependencies
- `@radix-ui/react-label`

#### Component API

```tsx
interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}
```

The Label component uses Radix UI for accessibility:

```tsx
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
```

#### Usage Examples

```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// Basic label with htmlFor
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Required field (custom)
<Label htmlFor="password">
  Password <span className="text-destructive">*</span>
</Label>

// Disabled state (peer-based)
<div className="flex items-center gap-2">
  <input type="checkbox" disabled id="agree" className="peer" />
  <Label htmlFor="agree">I agree to terms</Label>
  {/* Label auto-fades when checkbox is disabled */}
</div>
```

#### Accessibility Features

- Automatically links to input via `htmlFor`
- Screen reader compatible
- Keyboard navigation support
- Visual disabled state via peer selectors

---

### 3.4 Card Component

#### Installation
```bash
npx shadcn@latest add card
```

#### Dependencies
None (pure div wrappers)

#### Component Structure

```tsx
// Card (root container)
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(...)

// CardHeader (top section)
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(...)

// CardTitle (heading in header)
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(...)

// CardDescription (subtitle in header)
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(...)

// CardContent (main content area)
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(...)

// CardFooter (bottom section)
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(...)
```

#### Usage Examples

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Sign In</CardTitle>
    <CardDescription>Enter your credentials to continue</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Form content */}
  </CardContent>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>

// Card with custom styling
<Card className="max-w-md mx-auto">
  <CardHeader className="space-y-1">
    <CardTitle className="text-2xl">Create Account</CardTitle>
    <CardDescription>Get started with a free account</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Form fields */}
  </CardContent>
</Card>

// Auth card pattern (for requirements)
<Card className="w-full max-w-md mx-auto shadow-lg">
  <CardHeader>
    <CardTitle>Welcome Back</CardTitle>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      {/* Form fields */}
    </form>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Link href="/signup">Create account</Link>
  </CardFooter>
</Card>
```

#### Default Styles

- **Card**: `rounded-lg border bg-card text-card-foreground shadow-sm`
- **CardHeader**: `flex flex-col space-y-1.5 p-6`
- **CardTitle**: `text-2xl font-semibold leading-none tracking-tight`
- **CardDescription**: `text-sm text-muted-foreground`
- **CardContent**: `p-6 pt-0`
- **CardFooter**: `flex items-center p-6 pt-0`

---

### 3.5 Alert Component

#### Installation
```bash
npx shadcn@latest add alert
```

#### Dependencies
None (pure div wrappers with cva)

#### Component API

**Variants**:
- `default` - Neutral informational alert
- `destructive` - Error/danger alert

```tsx
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}
```

#### Component Structure

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Alert (root)
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(...)

// AlertTitle
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(...)

// AlertDescription
const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(...)
```

#### Usage Examples

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, InfoIcon } from 'lucide-react'

// Default (info) alert
<Alert>
  <InfoIcon className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the CLI.
  </AlertDescription>
</Alert>

// Destructive (error) alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please sign in again.
  </AlertDescription>
</Alert>

// Success alert (custom variant via className)
<Alert className="border-success bg-success/10 text-success-foreground">
  <CheckCircle className="h-4 w-4 text-success" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your account has been created.</AlertDescription>
</Alert>

// Dismissible alert (custom)
const [visible, setVisible] = useState(true)
{visible && (
  <Alert>
    <AlertTitle>Notice</AlertTitle>
    <AlertDescription>This is a dismissible alert.</AlertDescription>
    <button onClick={() => setVisible(false)}>Dismiss</button>
  </Alert>
)}
```

#### Custom Variants (for auth UI)

Extend alert with success/warning variants:

```tsx
// In src/components/ui/alert.tsx
const alertVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive ...",
        success: "border-success/50 bg-success/10 text-success-foreground [&>svg]:text-success",
        warning: "border-warning/50 bg-warning/10 text-warning-foreground [&>svg]:text-warning",
      },
    },
  }
)
```

---

## 4. Extended Components

### 4.1 Spinner Component

#### Installation
```bash
npx shadcn@latest add spinner
```

#### Dependencies
- `lucide-react` (for icons)

#### Component Source Code

```tsx
import { LoaderCircleIcon, LoaderIcon, LoaderPinwheelIcon, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpinnerVariantProps = Omit<SpinnerProps, 'variant'>

const Default = ({ className, ...props }: SpinnerVariantProps) => (
  <LoaderIcon className={cn('animate-spin', className)} {...props} />
)

const Circle = ({ className, ...props }: SpinnerVariantProps) => (
  <LoaderCircleIcon className={cn('animate-spin', className)} {...props} />
)

const Pinwheel = ({ className, ...props }: SpinnerVariantProps) => (
  <LoaderPinwheelIcon className={cn('animate-spin', className)} {...props} />
)

export type SpinnerProps = LucideProps & {
  variant?: 'default' | 'circle' | 'pinwheel'
}

export const Spinner = ({ variant = 'default', ...props }: SpinnerProps) => {
  switch (variant) {
    case 'circle':
      return <Circle {...props} />
    case 'pinwheel':
      return <Pinwheel {...props} />
    default:
      return <Default {...props} />
  }
}
```

#### Usage Examples

```tsx
import { Spinner } from '@/components/ui/spinner'

// In button
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
  Sign In
</Button>

// Standalone loading indicator
<div className="flex items-center justify-center p-4">
  <Spinner className="h-8 w-8" />
</div>

// Different variants
<Spinner variant="circle" className="h-6 w-6" />
<Spinner variant="pinwheel" className="h-6 w-6" />
```

---

### 4.2 useBoolean Hook

#### Installation
```bash
npx shadcn@latest add use-boolean
```

#### Dependencies
None (React only)

#### Hook Source Code

```tsx
"use client"

import * as React from "react"

type UseBooleanReturn = {
  value: boolean
  setValue: React.Dispatch<React.SetStateAction<boolean>>
  setTrue: () => void
  setFalse: () => void
  toggle: () => void
}

export function useBoolean(defaultValue = false): UseBooleanReturn {
  if (typeof defaultValue !== "boolean") {
    throw new Error("defaultValue must be `true` or `false`")
  }
  const [value, setValue] = React.useState(defaultValue)

  const setTrue = React.useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = React.useCallback(() => {
    setValue(false)
  }, [])

  const toggle = React.useCallback(() => {
    setValue((x) => !x)
  }, [])

  return { value, setValue, setTrue, setFalse, toggle }
}

export type { UseBooleanReturn }
```

#### Usage Examples

```tsx
import { useBoolean } from '@/hooks/use-boolean'

function PasswordInput() {
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean(false)

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
      />
      <button
        type="button"
        onClick={toggleShowPassword}
        className="absolute right-3 top-3"
        aria-label="Toggle password visibility"
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

// Other use cases
const { value: isOpen, setTrue: open, setFalse: close, toggle } = useBoolean(false)
```

---

## 5. Form Integration Patterns

### 5.1 Manual Form Handling (Recommended for Auth)

**Pattern**: Controlled components with local state + Zod validation

```tsx
'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)

    // Validate with Zod
    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0] || '',
        password: fieldErrors.password?.[0] || '',
      })
      return
    }

    // Submit
    setIsSubmitting(true)
    try {
      await signIn(result.data.email, result.data.password)
      // Redirect handled elsewhere
    } catch (err: any) {
      setFormError(err.message || 'Sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
        Sign In
      </Button>
    </form>
  )
}
```

### 5.2 Field-Level Validation (On Blur)

```tsx
const validateField = (field: string, value: string) => {
  try {
    signInSchema.pick({ [field]: true }).parse({ [field]: value })
    setErrors(prev => ({ ...prev, [field]: '' }))
  } catch (err) {
    if (err instanceof z.ZodError) {
      setErrors(prev => ({
        ...prev,
        [field]: err.errors[0]?.message || 'Invalid'
      }))
    }
  }
}

<Input
  onBlur={(e) => validateField('email', e.target.value)}
  // ...
/>
```

### 5.3 React Hook Form + Zod (For Complex Forms)

**Installation**:
```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest add form
```

**Usage**:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export function SignInFormRHF() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await signIn(values.email, values.password)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Sign In</Button>
      </form>
    </Form>
  )
}
```

---

## 6. Validation with Zod

### 6.1 Installation

```bash
npm install zod
```

### 6.2 Auth Validation Schemas

**File**: `src/lib/validations/auth.schema.ts`

```tsx
import { z } from 'zod'

// Sign In Schema
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export type SignInFormData = z.infer<typeof signInSchema>

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
})

export type SignUpFormData = z.infer<typeof signUpSchema>
```

### 6.3 Validation Patterns

**Safe Parse (Recommended)**:

```tsx
const result = signInSchema.safeParse({ email, password })

if (!result.success) {
  // Handle errors
  const errors = result.error.flatten().fieldErrors
  // errors.email = ['Invalid email address']
  // errors.password = ['Password is required']
} else {
  // result.data is type-safe
  const { email, password } = result.data
}
```

**Parse (Throws Error)**:

```tsx
try {
  const data = signInSchema.parse({ email, password })
  // data is type-safe
} catch (err) {
  if (err instanceof z.ZodError) {
    // Handle validation errors
  }
}
```

**Partial Validation**:

```tsx
// Validate single field
signInSchema.pick({ email: true }).safeParse({ email })
```

---

## 7. Accessibility Best Practices

### 7.1 Form Labels

**Always use explicit labels**:

```tsx
// ✅ Good
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ Bad (placeholder-only)
<Input placeholder="Email" />
```

### 7.2 Error Announcements

**Link errors to inputs**:

```tsx
<Label htmlFor="email">Email</Label>
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    {errors.email}
  </p>
)}
```

**Form-level errors**:

```tsx
<Alert variant="destructive" role="alert">
  <AlertDescription>{formError}</AlertDescription>
</Alert>
```

### 7.3 Loading States

**Button loading**:

```tsx
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Spinner className="mr-2" aria-hidden="true" />}
  {isLoading ? 'Signing in...' : 'Sign In'}
</Button>
```

### 7.4 Keyboard Navigation

**Ensure all interactive elements are accessible**:

```tsx
// Password toggle button
<button
  type="button"
  onClick={togglePassword}
  aria-label="Toggle password visibility"
  tabIndex={0}
>
  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
</button>
```

**Submit on Enter**:

```tsx
<form onSubmit={handleSubmit}>
  {/* All inputs automatically submit on Enter */}
  <Input onKeyDown={(e) => e.key === 'Enter' && form.submit()} />
</form>
```

### 7.5 ARIA Attributes Summary

| Attribute | Usage |
|-----------|-------|
| `aria-invalid="true"` | Mark invalid input fields |
| `aria-describedby="error-id"` | Link input to error message |
| `aria-required="true"` | Mark required fields |
| `aria-label="..."` | Label icon buttons |
| `role="alert"` | Error messages |
| `aria-live="polite"` | Success messages |
| `aria-busy="true"` | Loading states |

---

## 8. Installation Commands Summary

### 8.1 Core Components

```bash
# Button
npx shadcn@latest add button

# Input
npx shadcn@latest add input

# Label
npx shadcn@latest add label

# Card
npx shadcn@latest add card

# Alert
npx shadcn@latest add alert
```

### 8.2 Extended Components

```bash
# Spinner
npx shadcn@latest add spinner

# useBoolean hook
npx shadcn@latest add use-boolean
```

### 8.3 Form Components (Optional - React Hook Form)

```bash
# Form wrapper components
npx shadcn@latest add form

# Manual dependencies
npm install react-hook-form @hookform/resolvers zod
```

### 8.4 Dependencies

```bash
# Validation
npm install zod

# Icons
npm install lucide-react

# Dark mode (Next.js)
npm install next-themes

# Utility libraries (usually auto-installed by shadcn)
npm install class-variance-authority clsx tailwind-merge
```

### 8.5 Project-Specific Setup

**1. Create tokens.css**:
```bash
# Create file at src/styles/tokens.css
# (Copy content from Section 1.1)
```

**2. Update globals.css**:
```bash
# Edit src/app/globals.css
# (Copy content from Section 2.1)
```

**3. Create validation schemas**:
```bash
mkdir -p src/lib/validations
# Create src/lib/validations/auth.schema.ts
```

---

## 9. Real-World Implementation Examples

### 9.1 Complete Sign In Form

**File**: `src/components/auth/SignInForm.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useTenantAuth } from '@/contexts/TenantAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export function SignInForm() {
  const router = useRouter()
  const { signIn } = useTenantAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)

    // Validate
    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0] || '',
        password: fieldErrors.password?.[0] || '',
      })
      return
    }

    // Submit
    setIsSubmitting(true)
    try {
      await signIn(result.data.email, result.data.password)
      router.push('/dashboard')
    } catch (err: any) {
      setFormError(mapFirebaseError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={errors.email ? 'border-destructive' : ''}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={errors.password ? 'border-destructive' : ''}
              autoComplete="current-password"
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

function mapFirebaseError(err: any): string {
  switch (err.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    default:
      return err.message || 'Sign in failed'
  }
}
```

### 9.2 Password Input with Visibility Toggle

**File**: `src/components/shared/PasswordInput.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useBoolean } from '@/hooks/use-boolean'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  autoComplete?: string
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  required,
  autoComplete = 'current-password'
}: PasswordInputProps) {
  const { value: showPassword, toggle: toggleShowPassword } = useBoolean(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
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
          autoComplete={autoComplete}
          required={required}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={toggleShowPassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
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
  )
}
```

### 9.3 Reusable Form Alert

**File**: `src/components/shared/FormAlert.tsx`

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FormAlertProps {
  variant: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  onDismiss?: () => void
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    alertVariant: 'destructive' as const,
    role: 'alert' as const,
  },
  success: {
    icon: CheckCircle,
    className: 'border-success bg-success/10 text-success-foreground',
    iconClassName: 'text-success',
    role: 'status' as const,
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning bg-warning/10 text-warning-foreground',
    iconClassName: 'text-warning',
    role: 'alert' as const,
  },
  info: {
    icon: Info,
    role: 'status' as const,
  },
}

export function FormAlert({ variant, title, message, onDismiss }: FormAlertProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Alert
      variant={config.alertVariant}
      className={config.className}
      role={config.role}
    >
      <Icon className={`h-4 w-4 ${config.iconClassName || ''}`} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className={onDismiss ? 'pr-8' : ''}>
        {message}
      </AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  )
}
```

---

## 10. Key Takeaways

### 10.1 Design Token Benefits

1. **Single Source of Truth**: Update `tokens.css` to rebrand entire app
2. **Dark Mode**: Automatic via CSS variable updates
3. **Type Safety**: Tailwind integration provides autocomplete
4. **OKLCH Color Space**: Modern, perceptually uniform colors

### 10.2 Component Installation Strategy

1. Install core components first: `button`, `input`, `label`, `card`, `alert`
2. Add utility components: `spinner`, hooks
3. Optionally add `form` for React Hook Form integration
4. Customize as needed (add variants, extend styles)

### 10.3 Form Validation Approach

**For Auth Forms (Simple)**:
- Manual state management
- Zod for validation
- Direct integration with TenantAuthContext
- No heavy dependencies

**For Complex Forms**:
- React Hook Form + Zod
- Better developer experience for multi-step forms
- Built-in field arrays, watch, etc.

### 10.4 Accessibility Checklist

- ✅ Labels for all inputs (`htmlFor` + `id`)
- ✅ Error messages linked via `aria-describedby`
- ✅ `aria-invalid` on error fields
- ✅ `role="alert"` for errors
- ✅ Loading states announced (text change in button)
- ✅ Focus visible on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Space)

---

## 11. Next Steps

1. **Install shadcn/ui components**:
   ```bash
   npx shadcn@latest add button input label card alert spinner use-boolean
   ```

2. **Create design tokens**:
   - Create `src/styles/tokens.css`
   - Update `src/app/globals.css`

3. **Create validation schemas**:
   - `src/lib/validations/auth.schema.ts`

4. **Build shared components**:
   - `src/components/shared/PasswordInput.tsx`
   - `src/components/shared/FormAlert.tsx`
   - `src/components/shared/AuthCard.tsx`

5. **Refactor auth forms**:
   - `src/components/auth/SignInForm.tsx`
   - `src/components/auth/SignUpForm.tsx`

6. **Test accessibility**:
   - Screen reader testing
   - Keyboard navigation
   - Color contrast validation

---

## 12. Additional Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Radix UI Primitives**: https://www.radix-ui.com
- **Zod Documentation**: https://zod.dev
- **React Hook Form**: https://react-hook-form.com
- **OKLCH Color Space**: https://oklch.com
- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Research Conducted For**: Authentication UI Implementation
