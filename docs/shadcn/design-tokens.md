# Design Tokens Reference

## Overview

**File**: `src/styles/tokens.css`
**Purpose**: Single source of truth for all styling
**Color Space**: OKLCH (perceptually uniform, modern)
**Integration**: Automatic via Tailwind utilities

---

## Token Categories

### Core Colors

```css
/* Background & Foreground */
--background: oklch(1 0 0)           /* White */
--foreground: oklch(0.145 0 0)       /* Near black */

/* Primary (Brand) */
--primary: oklch(0.205 0 0)          /* Brand color */
--primary-foreground: oklch(0.985 0 0) /* Text on primary */

/* Secondary */
--secondary: oklch(0.97 0 0)
--secondary-foreground: oklch(0.205 0 0)

/* Semantic Colors */
--destructive: oklch(0.577 0.245 27.325)  /* Error red */
--success: oklch(0.645 0.15 142)          /* Success green */
--warning: oklch(0.84 0.16 84)            /* Warning yellow */

/* UI Elements */
--muted: oklch(0.97 0 0)             /* Subtle backgrounds */
--accent: oklch(0.97 0 0)            /* Accent highlights */
--border: oklch(0.922 0 0)           /* Border color */
--input: oklch(0.922 0 0)            /* Input border */
--ring: oklch(0.708 0 0)             /* Focus ring */
```

### Dark Mode

Automatically applied via `.dark` class:

```css
.dark {
  --background: oklch(0.145 0 0)     /* Dark background */
  --foreground: oklch(0.985 0 0)     /* Light text */
  --primary: oklch(0.922 0 0)        /* Light primary */
  --primary-foreground: oklch(0.205 0 0)
  /* All tokens have dark variants */
}
```

**Activation**: Add `dark` class to `<html>` element (handled by `next-themes`)

---

### Spacing Scale

```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 3rem      /* 48px */
```

**Usage**: Mapped to Tailwind's default spacing scale

---

### Typography

```css
/* Font Sizes */
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-md: 1rem       /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

---

### Shadows & Effects

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-focus: 0 0 0 3px oklch(0.97 0 0 / 0.5)

--radius: 0.625rem  /* 10px - global border radius */
```

---

## Usage Patterns

### ✅ Correct Usage

```tsx
// Use Tailwind classes that map to CSS variables
<Button className="bg-primary text-primary-foreground">
  Submit
</Button>

<Alert className="border-destructive bg-destructive/10">
  Error message
</Alert>

<Card className="rounded-md shadow-lg">
  Content
</Card>

<div className="p-4 space-y-2">
  {/* Tailwind spacing (matches token scale) */}
</div>
```

**Why This Works**: Tailwind utilities automatically reference CSS variables

---

### ❌ Incorrect Usage

```tsx
// Never hardcode Tailwind color classes
<Button className="bg-blue-500 text-white">  // ❌
<Alert className="border-red-500 bg-red-50"> // ❌
<Card className="rounded-lg shadow-xl">      // ❌ (inconsistent radius)
<div className="p-5">                        // ❌ (not on token scale)
```

**Why This Fails**: Breaks rebranding, inconsistent with design system

---

### Tailwind Integration

Tokens are automatically mapped to Tailwind utilities in `src/app/globals.css`:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  --color-success: var(--success);
  --color-border: var(--border);
  --radius-xl: var(--radius);
  /* ... all tokens mapped */
}
```

**Result**: Use standard Tailwind classes, get token-based styling

---

## Rebranding Guide

To rebrand the entire application:

### Step 1: Update Primary Color

Edit `src/styles/tokens.css`:

```css
:root {
  /* Change this one token */
  --primary: oklch(0.6 0.2 250);  /* New brand color (purple) */
}

.dark {
  --primary: oklch(0.7 0.2 250);  /* Dark mode variant */
}
```

---

### Step 2: (Optional) Update Border Radius

```css
:root {
  --radius: 0.25rem;  /* Sharper corners (4px) */
  /* OR */
  --radius: 1rem;     /* Rounder corners (16px) */
}
```

---

### Step 3: (Optional) Update Semantic Colors

```css
:root {
  --success: oklch(0.7 0.18 160);  /* Different green */
  --warning: oklch(0.75 0.14 60);  /* Different yellow */
}
```

---

### Step 4: Rebuild

```bash
npm run build
```

**Result**: Entire application rebranded consistently across all components

---

## Why OKLCH?

**Benefits**:
1. **Perceptual Uniformity**: Colors with same lightness appear equally bright
2. **Wide Gamut**: Supports vibrant, modern colors beyond sRGB
3. **Predictable**: Easier to create color scales (adjust L for lightness, C for saturation)
4. **Better Gradients**: Smooth transitions without muddy middle colors
5. **Future-Proof**: Native browser support improving

**OKLCH Format**: `oklch(L C H / A)`
- **L** = Lightness (0-1, where 0 is black, 1 is white)
- **C** = Chroma/saturation (0+ where 0 is gray)
- **H** = Hue (0-360 degrees)
- **A** = Alpha/opacity (optional, 0-1)

---

## Component Examples

### Button with Tokens

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva({
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "border border-input bg-background hover:bg-accent",
      secondary: "bg-secondary text-secondary-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    }
  }
})
```

**Pattern**: All colors reference CSS variables, no hardcoded values

---

### Alert with Tokens

```tsx
// Custom success variant
<Alert className="border-success bg-success/10 text-success-foreground">
  <CheckCircle className="h-4 w-4 text-success" />
  <AlertDescription>Operation completed successfully</AlertDescription>
</Alert>

// Custom warning variant
<Alert className="border-warning bg-warning/10 text-warning-foreground">
  <AlertTriangle className="h-4 w-4 text-warning" />
  <AlertDescription>Please review before continuing</AlertDescription>
</Alert>
```

**Pattern**: Use `/10` opacity for subtle backgrounds, main color for borders/icons

---

### Card with Tokens

```tsx
<Card className="shadow-lg">
  <CardHeader className="space-y-1">
    <CardTitle className="text-2xl">User Profile</CardTitle>
    <CardDescription className="text-muted-foreground">
      Manage your account settings
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with consistent spacing */}
  </CardContent>
</Card>
```

**Pattern**: Use semantic tokens (`muted-foreground` for secondary text)

---

## Token Consistency Checklist

When creating new components:

- ✅ Colors use CSS variables (not hardcoded Tailwind classes)
- ✅ Spacing uses Tailwind's default scale (matches token scale)
- ✅ Border radius uses `rounded-md` or global `--radius`
- ✅ Shadows use `shadow-sm/md/lg` (mapped to tokens)
- ✅ Typography uses semantic classes (`text-sm`, `font-medium`)
- ✅ Dark mode tested (automatic via token system)
- ✅ Semantic colors used appropriately (`destructive` for errors, `success` for confirmations)

---

## Common Token Combinations

### Primary Actions
```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

### Secondary Actions
```tsx
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
```

### Destructive Actions
```tsx
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

### Muted/Subtle UI
```tsx
className="bg-muted text-muted-foreground"
```

### Success States
```tsx
className="border-success bg-success/10 text-success-foreground"
```

### Input Fields
```tsx
className="border-input bg-background focus:ring-ring"
```

### Cards
```tsx
className="bg-card text-card-foreground border border-border"
```

---

## Token Reference Quick Table

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `primary` | Brand color | Buttons, links, highlights |
| `destructive` | Errors, deletions | Error messages, delete buttons |
| `success` | Success states | Success alerts, confirmations |
| `warning` | Warnings | Warning messages, cautions |
| `muted` | Subtle backgrounds | Secondary UI, disabled states |
| `accent` | Hover states | Hover backgrounds |
| `border` | Borders | Card borders, dividers |
| `input` | Input borders | Form field borders |
| `ring` | Focus rings | Focus indicators |

---

## Debugging Token Usage

### Check if Hardcoded Colors Exist

```bash
# Search for hardcoded Tailwind colors
grep -r "bg-blue-\|bg-red-\|bg-green-\|text-blue-\|text-red-" src/components/
```

**Expected**: No results (all should use token-based classes)

### Verify Token Definition

```bash
# Check if token is defined
grep "primary" src/styles/tokens.css
```

### Inspect in DevTools

1. Open browser DevTools
2. Inspect element
3. Look for `var(--primary)` in computed styles
4. If showing color value directly, tokens may not be applied

---

## See Also

- [shadcn-workflow.md](shadcn-workflow.md) - UI development workflow
- [shadcn-agents-usage.md](shadcn-agents-usage.md) - Agent reference
- [../architecture.md](../architecture.md) - System architecture
