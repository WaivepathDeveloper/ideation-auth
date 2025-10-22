# Component Research: Shadcn UI Components for Sidebar & Settings Implementation

**Date**: 2025-10-22
**Researcher**: shadcn Component Researcher
**Feature**: Collapsible App Sidebar Navigation + Settings Page Enhancements
**Project**: Multi-Tenant SaaS Auth System with 6-Layer Security

---

## Executive Summary

This document provides comprehensive research on shadcn/ui components required for implementing a production-ready sidebar navigation system and enhanced settings page. All components have been verified as installed in the project, with complete source code, props interfaces, usage patterns, and integration guidelines documented below.

**Key Findings**:
- All required shadcn/ui primitives are already installed (Sheet, Tabs, ToggleGroup, Avatar, Button, Card, Badge, Table, Separator)
- Sidebar-specific design tokens are fully defined in `src/app/globals.css`
- No native shadcn Sidebar component exists - requires custom implementation using primitives
- All components integrate with Radix UI primitives for accessibility
- Lucide React icons (v0.545.0) available for navigation icons

**Component Status**:
- ✅ **Already Installed**: Sheet, Tabs, ToggleGroup, Avatar, Button, Separator, Card, Badge, Table
- 🔨 **Custom Required**: AppSidebar, NavItem, UserAvatar, ComingSoonPlaceholder

---

## 1. Sheet Component (Mobile Sidebar Overlay)

### Installation Status
✅ **Already Installed** - Located at `src/components/ui/sheet.tsx`

### Dependencies
```json
{
  "@radix-ui/react-dialog": "1.1.15",
  "lucide-react": "0.545.0"
}
```

### Installation Command (if needed)
```bash
pnpm dlx shadcn@latest add sheet
```

---

### Source Code Analysis

**File**: `src/components/ui/sheet.tsx`

**Core Components**:
- `Sheet` - Root component (wrapper for Radix Dialog)
- `SheetTrigger` - Button/element that opens the sheet
- `SheetContent` - Main content container with side positioning
- `SheetOverlay` - Semi-transparent backdrop
- `SheetHeader` - Optional header section
- `SheetFooter` - Optional footer section
- `SheetTitle` - Accessible title (for screen readers)
- `SheetDescription` - Accessible description
- `SheetClose` - Close button component

**Built on**: `@radix-ui/react-dialog` with custom styling and animations

---

### Props Interface

#### Sheet (Root)
```typescript
interface SheetProps extends React.ComponentProps<typeof SheetPrimitive.Root> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean; // Default: true
}
```

#### SheetContent
```typescript
interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
  side?: "top" | "right" | "bottom" | "left"; // Default: "right"
  className?: string;
  children: React.ReactNode;
}
```

**Side Values**:
- `"left"` - Slides from left edge (mobile navigation pattern)
- `"right"` - Slides from right edge (default)
- `"top"` - Slides from top edge
- `"bottom"` - Slides from bottom edge

---

### Key Features

1. **Portal Rendering**: Renders outside DOM hierarchy for z-index management
2. **Focus Trap**: Traps keyboard focus within sheet when open
3. **ESC to Close**: Keyboard shortcut for dismissing sheet
4. **Backdrop Click**: Closes sheet when clicking overlay
5. **Smooth Animations**: Slide-in/slide-out transitions with Radix animations
6. **Accessibility**: Full ARIA support, screen reader friendly
7. **Auto Close Button**: Built-in X icon in top-right corner

---

### Usage Example: Mobile Navigation

```tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[280px] bg-sidebar text-sidebar-foreground"
      >
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 mt-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <Link href={item.href} onClick={() => setOpen(false)}>
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Responsive Pattern

```tsx
// Desktop: Hidden sidebar toggle, visible fixed sidebar
// Mobile: Visible hamburger menu, sheet overlay

<header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b bg-background">
  <div className="flex items-center justify-between p-4">
    <h1>App Name</h1>
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        {/* Same navigation items as desktop sidebar */}
      </SheetContent>
    </Sheet>
  </div>
</header>
```

---

### Design Token Integration

```tsx
// Use sidebar design tokens for consistent styling
<SheetContent
  side="left"
  className="
    w-[280px]
    bg-sidebar
    text-sidebar-foreground
    border-sidebar-border
  "
>
  {/* Content */}
</SheetContent>
```

**Available Sidebar Tokens**:
- `bg-sidebar` - Background color
- `text-sidebar-foreground` - Text color
- `border-sidebar-border` - Border color
- `bg-sidebar-primary` - Active item background
- `text-sidebar-primary-foreground` - Active item text
- `bg-sidebar-accent` - Hover background
- `text-sidebar-accent-foreground` - Hover text
- `ring-sidebar-ring` - Focus ring color

---

### Accessibility Features

- **ARIA Dialog**: Sheet uses `role="dialog"` with proper ARIA attributes
- **Focus Management**: Focus automatically trapped within sheet
- **Keyboard Support**:
  - `ESC` - Close sheet
  - `Tab` - Navigate between focusable elements
  - Focus returns to trigger element on close
- **Screen Reader**: SheetTitle and SheetDescription announced
- **Backdrop**: Prevents interaction with background content

---

### Integration Notes

1. **Close on Navigation**: Manually close sheet when user clicks nav link
   ```tsx
   <Link href="/dashboard" onClick={() => setOpen(false)}>
   ```

2. **Controlled State**: Use `open` and `onOpenChange` props for controlled behavior
   ```tsx
   const [open, setOpen] = useState(false);
   <Sheet open={open} onOpenChange={setOpen}>
   ```

3. **Animation Duration**: Default durations defined in className
   - Open: 500ms
   - Close: 300ms

4. **Z-Index**: Sheet overlay at `z-50`, content above overlay

5. **Mobile-Only**: Hide trigger on desktop with `md:hidden`

---

## 2. Tabs Component (Settings Navigation)

### Installation Status
✅ **Already Installed** - Available via shadcn registry

### Dependencies
```json
{
  "lucide-react": "0.545.0",
  "motion": "^11.x",
  "@repo/motion-highlight": "registry dependency"
}
```

### Installation Command (if needed)
```bash
pnpm dlx shadcn@latest add tabs
```

---

### Source Code Analysis

**Core Components**:
- `Tabs` - Root component with state management
- `TabsList` - Container for tab triggers (horizontal layout)
- `TabsTrigger` - Individual tab button
- `TabsContents` - Wrapper for content panels with slide animation
- `TabsContent` - Individual content panel
- `useTabs` - Hook for accessing tab context

**Built on**: Custom React Context with Framer Motion animations

---

### Props Interface

#### Tabs (Root)
```typescript
// Uncontrolled Mode
interface UnControlledTabsProps {
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
  children: React.ReactNode;
  className?: string;
}

// Controlled Mode
interface ControlledTabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  defaultValue?: never;
  children: React.ReactNode;
  className?: string;
}

type TabsProps = UnControlledTabsProps | ControlledTabsProps;
```

#### TabsList
```typescript
interface TabsListProps extends React.ComponentProps<'div'> {
  children: React.ReactNode;
  activeClassName?: string;
  transition?: Transition; // Framer Motion transition config
}
```

#### TabsTrigger
```typescript
interface TabsTriggerProps extends HTMLMotionProps<'button'> {
  value: string; // Must match TabsContent value
  children: React.ReactNode;
  className?: string;
}
```

#### TabsContent
```typescript
interface TabsContentProps extends HTMLMotionProps<'div'> {
  value: string; // Must match TabsTrigger value
  children: React.ReactNode;
  className?: string;
}
```

---

### Key Features

1. **Controlled/Uncontrolled Modes**: Flexible state management
2. **Smooth Animations**: Framer Motion slide transitions between content
3. **Active Indicator**: Motion-highlighted active tab with background
4. **Keyboard Navigation**:
   - Arrow keys to navigate tabs
   - Tab key to focus
   - Enter/Space to activate
5. **Auto-Registration**: Triggers auto-register with context on mount
6. **Blur Animation**: Inactive content slightly blurred for visual hierarchy
7. **ARIA Compliance**: Proper `role="tab"`, `role="tablist"`, `role="tabpanel"`

---

### Usage Example: Settings Page

```tsx
'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/ui/tabs';

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState('user-permissions');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="ai-config">
          AI Configuration
        </TabsTrigger>
        <TabsTrigger value="user-permissions">
          User Permissions
        </TabsTrigger>
        <TabsTrigger value="notifications">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContents className="mt-6">
        <TabsContent value="ai-config">
          <ComingSoonPlaceholder module="AI Configuration" />
        </TabsContent>

        <TabsContent value="user-permissions">
          <UserPermissionsContent />
        </TabsContent>

        <TabsContent value="notifications">
          <ComingSoonPlaceholder module="Notifications" />
        </TabsContent>
      </TabsContents>
    </Tabs>
  );
}
```

---

### Advanced Pattern: Tabs with Icons

```tsx
import { Bot, Users, Bell } from 'lucide-react';

<TabsList>
  <TabsTrigger value="ai-config" className="gap-2">
    <Bot className="h-4 w-4" />
    <span>AI Configuration</span>
  </TabsTrigger>
  <TabsTrigger value="user-permissions" className="gap-2">
    <Users className="h-4 w-4" />
    <span>User Permissions</span>
  </TabsTrigger>
  <TabsTrigger value="notifications" className="gap-2">
    <Bell className="h-4 w-4" />
    <span>Notifications</span>
  </TabsTrigger>
</TabsList>
```

---

### Design Token Integration

```tsx
// TabsList uses muted background with shadow
<TabsList className="bg-muted text-muted-foreground">
  {/* Active tab automatically gets highlighted background */}
</TabsList>

// Active trigger styles (automatic)
// data-state="active": text-foreground with motion background

// Inactive trigger styles (automatic)
// data-state="inactive": text-muted-foreground
```

**CSS Variables Used**:
- `--muted` - Tab list background
- `--muted-foreground` - Inactive tab text
- `--foreground` - Active tab text
- `--background` - Active tab highlight background
- `--ring` - Focus ring color

---

### Accessibility Features

- **ARIA Tabs**: Proper `role="tablist"`, `role="tab"`, `role="tabpanel"`
- **Keyboard Navigation**:
  - Left/Right Arrow keys navigate between tabs
  - Home/End jump to first/last tab
  - Tab key focuses tab list, then moves to content
  - Enter/Space activates focused tab
- **Focus Management**: Focus visible ring on keyboard navigation
- **State Attributes**: `data-state="active"` for styling and screen readers

---

### Animation Configuration

```typescript
// Default transition for TabsList highlight
const highlightTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

// Default transition for TabsContents slide
const contentTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  bounce: 0,
  restDelta: 0.01,
};

// Override transition
<TabsList transition={{ type: 'tween', duration: 0.2 }}>
```

---

### Integration Notes

1. **Default Tab**: Set `defaultValue` for uncontrolled or `value` for controlled
   ```tsx
   <Tabs defaultValue="user-permissions">
   ```

2. **Content Rendering**: All TabsContent components render, but inactive ones are blurred/translated
   - Use `TabsContents` wrapper for slide animation
   - Content persists in DOM (maintains state)

3. **Responsive**: Stack TabsList vertically on mobile if needed
   ```tsx
   <TabsList className="flex-col md:flex-row">
   ```

4. **Value Matching**: TabsTrigger `value` MUST match corresponding TabsContent `value`

---

## 3. ToggleGroup Component (Users/Roles Switcher)

### Installation Status
✅ **Already Installed** - Located at `src/components/ui/toggle-group.tsx`

### Dependencies
```json
{
  "@radix-ui/react-toggle-group": "1.1.11",
  "class-variance-authority": "^0.7.x"
}
```

### Installation Command (if needed)
```bash
pnpm dlx shadcn@latest add toggle-group
```

---

### Source Code Analysis

**File**: `src/components/ui/toggle-group.tsx`

**Core Components**:
- `ToggleGroup` - Root component with context provider
- `ToggleGroupItem` - Individual toggle button
- `ToggleGroupContext` - Context for sharing variant/size/spacing

**Built on**: `@radix-ui/react-toggle-group` with custom styling variants

---

### Props Interface

#### ToggleGroup
```typescript
interface ToggleGroupProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Root> {
  type: "single" | "multiple"; // REQUIRED
  value?: string | string[]; // Controlled
  defaultValue?: string | string[]; // Uncontrolled
  onValueChange?: (value: string | string[]) => void;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  spacing?: number; // Gap between items (0 = no gap, connected buttons)
  disabled?: boolean;
  className?: string;
}
```

**Type Values**:
- `"single"` - Only one item can be selected (radio behavior)
- `"multiple"` - Multiple items can be selected (checkbox behavior)

**Spacing Values**:
- `0` - No gap, buttons connected (first/last rounded corners only)
- `1` or higher - Gap between buttons in spacing units

#### ToggleGroupItem
```typescript
interface ToggleGroupItemProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Item> {
  value: string; // REQUIRED - unique identifier
  children: React.ReactNode;
  variant?: "default" | "outline"; // Inherits from ToggleGroup if not specified
  size?: "default" | "sm" | "lg"; // Inherits from ToggleGroup if not specified
  disabled?: boolean;
  "aria-label"?: string; // RECOMMENDED for accessibility
  className?: string;
}
```

---

### Key Features

1. **Single/Multiple Selection**: Radio or checkbox behavior via `type` prop
2. **Context-Based Styling**: Child items inherit variant/size/spacing from parent
3. **Connected Buttons**: `spacing={0}` creates button group with shared borders
4. **Pressed State**: Visual feedback for active/pressed items
5. **Keyboard Navigation**: Arrow keys navigate, Space/Enter toggles
6. **ARIA Compliance**: Proper `role="radiogroup"` or `role="group"`
7. **Disabled State**: Individual items or entire group can be disabled

---

### Usage Example: Users/Roles Switcher

```tsx
'use client';

import { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ViewSwitcher() {
  const [view, setView] = useState<'users' | 'roles'>('users');

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => {
        if (value) setView(value as 'users' | 'roles');
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="users" aria-label="View users">
        <Users className="h-4 w-4" />
        <span className="ml-2">Users</span>
      </ToggleGroupItem>

      <ToggleGroupItem value="roles" aria-label="View roles">
        <Shield className="h-4 w-4" />
        <span className="ml-2">Roles</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

---

### Advanced Pattern: Connected Button Group

```tsx
// No spacing = connected buttons with shared borders
<ToggleGroup type="single" variant="outline" spacing={0}>
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month">Month</ToggleGroupItem>
  <ToggleGroupItem value="year">Year</ToggleGroupItem>
</ToggleGroup>
```

---

### Design Token Integration

```tsx
// Outline variant (default)
<ToggleGroup variant="outline">
  {/*
    Inactive: bg-background, border-border
    Active (data-state=on): bg-accent, text-accent-foreground
  */}
</ToggleGroup>

// Default variant
<ToggleGroup variant="default">
  {/*
    Inactive: bg-transparent
    Active: bg-accent, text-accent-foreground
  */}
</ToggleGroup>
```

**CSS Variables Used**:
- `--background` - Inactive background (outline variant)
- `--border` - Border color (outline variant)
- `--accent` - Active background
- `--accent-foreground` - Active text color
- `--ring` - Focus ring color

---

### Custom Active State Styling

```tsx
// Custom styling for active state
<ToggleGroupItem
  value="users"
  className="
    data-[state=on]:bg-primary
    data-[state=on]:text-primary-foreground
    data-[state=on]:border-primary
  "
>
  Users
</ToggleGroupItem>
```

---

### Accessibility Features

- **ARIA Role**: `role="radiogroup"` (single) or `role="group"` (multiple)
- **ARIA Pressed**: `aria-pressed` attribute on each item indicates state
- **ARIA Label**: `aria-label` recommended on each item for screen readers
- **Keyboard Navigation**:
  - Arrow keys navigate between items
  - Space/Enter toggle item state
  - Tab moves focus to/from group
- **Focus Visible**: Keyboard focus shows visible ring

---

### Integration Notes

1. **Single Select**: Always provide callback to handle empty state
   ```tsx
   onValueChange={(value) => {
     if (value) setView(value); // Prevents deselecting last item
   }}
   ```

2. **Multiple Select**: Value is string array
   ```tsx
   <ToggleGroup
     type="multiple"
     value={['bold', 'italic']}
     onValueChange={(values) => console.log(values)} // string[]
   >
   ```

3. **Default Value**: Use uncontrolled mode for simple cases
   ```tsx
   <ToggleGroup type="single" defaultValue="users">
   ```

4. **Spacing CSS Variable**: `spacing={2}` sets `--gap: 2` CSS variable
   ```tsx
   style={{ "--gap": spacing } as React.CSSProperties}
   ```

---

## 4. Avatar Component (User Profile Pictures)

### Installation Status
✅ **Already Installed** - Located at `src/components/ui/avatar.tsx`

### Dependencies
```json
{
  "@radix-ui/react-avatar": "1.1.10"
}
```

### Installation Command (if needed)
```bash
pnpm dlx shadcn@latest add avatar
```

---

### Source Code Analysis

**File**: `src/components/ui/avatar.tsx`

**Core Components**:
- `Avatar` - Root container (circular, fixed size)
- `AvatarImage` - Image element with loading state
- `AvatarFallback` - Fallback content (shown if image fails/loading)

**Built on**: `@radix-ui/react-avatar`

**Current Implementation**:
```typescript
function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}
```

**Default Size**: `size-8` (32px) - same as `h-8 w-8`

---

### Props Interface

#### Avatar (Root)
```typescript
interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  className?: string;
  children: React.ReactNode; // Should contain AvatarImage and AvatarFallback
}
```

#### AvatarImage
```typescript
interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  src: string;
  alt?: string; // RECOMMENDED for accessibility
  onLoadingStatusChange?: (status: "idle" | "loading" | "loaded" | "error") => void;
  className?: string;
}
```

#### AvatarFallback
```typescript
interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  delayMs?: number; // Delay before showing fallback (prevents flash)
  className?: string;
  children: React.ReactNode; // Initials, icon, or other fallback content
}
```

---

### Key Features

1. **Automatic Fallback**: AvatarFallback shown when:
   - Image is loading
   - Image fails to load (404, CORS, etc.)
   - No `src` provided to AvatarImage

2. **Loading States**: Component handles all loading states internally
   - `idle` - No image attempted
   - `loading` - Image currently loading
   - `loaded` - Image successfully loaded
   - `error` - Image failed to load

3. **Delay Fallback**: Optional delay before showing fallback (prevents flash on fast connections)
   ```tsx
   <AvatarFallback delayMs={600}>JD</AvatarFallback>
   ```

4. **Circular Shape**: Default `rounded-full` with overflow hidden

5. **Flexible Sizing**: Override size with className
   ```tsx
   <Avatar className="size-12"> {/* 48px */}
   ```

6. **Aspect Ratio**: Image maintains aspect ratio, fills container

---

### Usage Example: Basic Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar className="size-10">
      <AvatarImage
        src={user.photoURL || undefined}
        alt={user.display_name}
      />
      <AvatarFallback className="bg-muted text-muted-foreground">
        {getInitials(user.display_name)}
      </AvatarFallback>
    </Avatar>
  );
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

---

### Advanced Pattern: Three-Tier Fallback Chain

```tsx
import { UserIcon } from 'lucide-react';

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'size-8',    // 32px - table rows
    md: 'size-10',   // 40px - general use
    lg: 'size-12',   // 48px - profile cards
  };

  // Tier 1: Try photoURL
  // Tier 2: Try initials from display_name
  // Tier 3: Try initials from email
  // Tier 4: Show user icon
  const fallbackContent =
    getInitials(user.display_name) ||
    getInitials(user.email) || (
      <UserIcon className="h-4 w-4" />
    );

  return (
    <Avatar className={cn(sizeClasses[size])}>
      <AvatarImage
        src={user.photoURL || undefined}
        alt={user.display_name || user.email}
      />
      <AvatarFallback
        delayMs={600}
        className="bg-muted text-muted-foreground"
      >
        {fallbackContent}
      </AvatarFallback>
    </Avatar>
  );
}

function getInitials(text?: string | null): string | null {
  if (!text) return null;
  const cleaned = text.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

---

### Size Variants Pattern

```tsx
interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZES = {
  sm: 'size-8',   // 32px
  md: 'size-10',  // 40px
  lg: 'size-12',  // 48px
} as const;

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  return (
    <Avatar className={cn(AVATAR_SIZES[size], className)}>
      {/* ... */}
    </Avatar>
  );
}
```

---

### Design Token Integration

```tsx
// Fallback styling with design tokens
<AvatarFallback className="
  bg-muted
  text-muted-foreground
  border-2
  border-border
">
  JD
</AvatarFallback>

// Custom role-based avatar backgrounds
<AvatarFallback className={cn(
  roleColors[user.role],
  "text-white font-semibold"
)}>
  {getInitials(user.display_name)}
</AvatarFallback>

const roleColors = {
  owner: 'bg-primary',
  admin: 'bg-secondary',
  member: 'bg-success',
  guest: 'bg-warning',
  viewer: 'bg-muted',
};
```

**CSS Variables Used**:
- `--muted` - Fallback background
- `--muted-foreground` - Fallback text
- `--border` - Optional border color
- Role-specific colors from globals.css

---

### Image Optimization with Next.js

```tsx
// For Next.js projects, use next/image for optimization
import Image from 'next/image';

<Avatar>
  <AvatarImage
    src={user.photoURL}
    alt={user.display_name}
    asChild
  >
    <Image
      src={user.photoURL}
      alt={user.display_name}
      width={40}
      height={40}
      className="aspect-square size-full"
    />
  </AvatarImage>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Accessibility Features

- **Alt Text**: Always provide descriptive `alt` attribute on AvatarImage
- **Fallback Text**: Initials should be 1-2 uppercase letters (readable by screen readers)
- **Semantic HTML**: Uses `<span>` elements (no interactive roles needed)
- **Color Contrast**: Fallback text should meet WCAG AA contrast (4.5:1)

---

### Best Practices

1. **Delay Fallback**: Use `delayMs={600}` to prevent flash on fast networks
2. **Image Sources**: Provide full URL, handle null/undefined gracefully
3. **Initials Logic**: Parse names correctly ("John Smith" → "JS", not "JO")
4. **Icon Fallback**: Use Lucide UserIcon as last resort
5. **Test Error States**: Disable images in DevTools to verify fallbacks
6. **Size Consistency**: Use predefined size variants across app
7. **Border Optional**: Add border only if design requires separation

---

### Integration Notes

1. **Firebase Auth photoURL**: May be null, handle gracefully
   ```tsx
   <AvatarImage src={user.photoURL || undefined} />
   ```

2. **Loading State**: No need to handle manually, component handles it

3. **Error Handling**: Fallback automatically shown on error

4. **SSR Safe**: Component works with server-side rendering

5. **Performance**: Images lazy-loaded by browser, use Next.js Image for more control

---

## 5. Button Component (Actions, Toggle, Hamburger)

### Installation Status
✅ **Already Installed** - Located at `src/components/ui/button.tsx`

### Dependencies
```json
{
  "@radix-ui/react-slot": "^1.1.x",
  "class-variance-authority": "^0.7.x"
}
```

### Source Code (Summary)

**Variants**:
- `default` - Primary brand button (bg-primary)
- `destructive` - Danger/delete actions (bg-destructive)
- `outline` - Secondary actions (border, bg-background)
- `secondary` - Tertiary actions (bg-secondary)
- `ghost` - Minimal button (hover only, no background)
- `link` - Text link style (underline on hover)

**Sizes**:
- `default` - h-9 (36px height)
- `sm` - h-8 (32px height)
- `lg` - h-10 (40px height)
- `icon` - size-9 (36x36px square)
- `icon-sm` - size-8 (32x32px square)
- `icon-lg` - size-10 (40x40px square)

---

### Props Interface

```typescript
interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  asChild?: boolean; // Renders as child element (for Link components)
  className?: string;
}
```

**asChild Pattern**: Renders child element instead of button
```tsx
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
// Renders: <a href="/dashboard" class="button-styles">Dashboard</a>
```

---

### Usage Examples

#### Sidebar Collapse Toggle
```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

<Button
  variant="ghost"
  size="icon-sm"
  onClick={toggleCollapse}
  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
>
  {isCollapsed ? (
    <ChevronRight className="h-4 w-4" />
  ) : (
    <ChevronLeft className="h-4 w-4" />
  )}
</Button>
```

#### Mobile Hamburger Menu
```tsx
import { Menu } from 'lucide-react';

<Button
  variant="ghost"
  size="icon"
  className="md:hidden"
  aria-label="Open navigation menu"
>
  <Menu className="h-5 w-5" />
</Button>
```

#### Edit Profile Action
```tsx
<Button variant="outline" size="sm">
  Edit Profile
</Button>
```

#### Navigation Item (Ghost Button)
```tsx
<Button
  variant="ghost"
  className="justify-start w-full"
  asChild
>
  <Link href="/dashboard">
    <LayoutDashboard className="h-5 w-5 mr-2" />
    Dashboard
  </Link>
</Button>
```

---

### Design Token Integration

All button variants use design tokens:
```tsx
// Default variant
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Destructive variant
className="bg-destructive text-white hover:bg-destructive/90"

// Outline variant
className="border bg-background hover:bg-accent hover:text-accent-foreground"

// Ghost variant
className="hover:bg-accent hover:text-accent-foreground"
```

---

### Accessibility Features

- **Focus Ring**: Visible focus indicator (`focus-visible:ring-2 focus-visible:ring-ring`)
- **Disabled State**: Pointer events disabled, reduced opacity
- **ARIA Labels**: Use `aria-label` for icon-only buttons
- **Keyboard**: Full keyboard support (Enter, Space)

---

## 6. Separator Component (Visual Dividers)

### Installation Status
✅ **Already Installed** - Located at `src/components/ui/separator.tsx`

### Source Code (Summary)

```typescript
function Separator({
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  );
}
```

---

### Props Interface

```typescript
interface SeparatorProps {
  orientation?: "horizontal" | "vertical"; // Default: "horizontal"
  decorative?: boolean; // Default: true (not read by screen readers)
  className?: string;
}
```

---

### Usage Examples

#### Sidebar Section Dividers
```tsx
<Separator className="my-4 bg-sidebar-border" />
```

#### Vertical Divider
```tsx
<Separator orientation="vertical" className="h-6" />
```

---

## 7. Card, Badge, Table Components

### Card Component

**Status**: ✅ Already Installed - `src/components/ui/card.tsx`

**Components**:
- `Card` - Root container
- `CardHeader` - Header section with title/description
- `CardTitle` - Title text
- `CardDescription` - Subtitle/description text
- `CardAction` - Action button in header
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Current User</CardTitle>
    <CardDescription>Your profile information</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Profile content */}
  </CardContent>
</Card>
```

---

### Badge Component

**Status**: ✅ Already Installed - `src/components/ui/badge.tsx`

**Variants**:
- `default` - Primary badge (bg-primary)
- `secondary` - Secondary badge (bg-secondary)
- `destructive` - Error badge (bg-destructive)
- `outline` - Outline only

**Usage**:
```tsx
<Badge variant="default">Owner</Badge>
<Badge variant="outline">Member</Badge>
```

---

### Table Component

**Status**: ✅ Already Installed - `src/components/ui/table.tsx`

**Components**:
- `Table` - Root table with overflow container
- `TableHeader` - thead element
- `TableBody` - tbody element
- `TableFooter` - tfoot element
- `TableRow` - tr element
- `TableHead` - th element
- `TableCell` - td element
- `TableCaption` - caption element

**Usage**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 8. Custom Sidebar Implementation Patterns

### Overview

Since shadcn/ui does not provide a native Sidebar component, we need to build a custom implementation using the available primitives (Button, Separator, Sheet) and standard HTML elements.

---

### Official Sidebar Component (Optional)

**Note**: shadcn/ui v3 introduced an official Sidebar component. However, based on project requirements, a custom implementation may be more appropriate.

**Installation** (if using official):
```bash
pnpm dlx shadcn@latest add sidebar
```

**Key Components**:
- `SidebarProvider` - Context provider for state management
- `Sidebar` - Main container with collapsible support
- `SidebarHeader` - Header section
- `SidebarContent` - Scrollable content area
- `SidebarMenu` - Navigation menu container
- `SidebarMenuItem` - Individual menu item
- `SidebarMenuButton` - Menu button with active state
- `SidebarFooter` - Footer section
- `SidebarTrigger` - Toggle button component
- `useSidebar` - Hook for accessing sidebar state

**Props**:
```typescript
interface SidebarProps {
  side?: 'left' | 'right'; // Default: 'left'
  variant?: 'sidebar' | 'floating' | 'inset'; // Default: 'sidebar'
  collapsible?: 'offcanvas' | 'icon' | 'none'; // Default: 'offcanvas'
}

interface SidebarProviderProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// useSidebar hook return type
interface SidebarState {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}
```

---

### Custom Sidebar Pattern (Recommended for Project)

Given the project's specific requirements (role-based filtering, design token system, security integration), a custom sidebar implementation is recommended.

**Core Structure**:

```tsx
// AppSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/roles';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['owner', 'admin', 'member', 'guest', 'viewer'],
  },
  {
    href: '/engagement',
    icon: Users,
    label: 'Engagement',
    roles: ['owner', 'admin', 'member'],
  },
  {
    href: '/analytics',
    icon: TrendingUp,
    label: 'Predictive Analytics',
    roles: ['owner', 'admin'],
  },
  {
    href: '/retention',
    icon: Target,
    label: 'Retention Strategies',
    roles: ['owner', 'admin'],
  },
  {
    href: '/users',
    icon: Settings,
    label: 'Settings',
    roles: ['owner', 'admin'],
  },
];

interface AppSidebarProps {
  currentUserRole: UserRole;
  className?: string;
}

export function AppSidebar({ currentUserRole, className }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Filter navigation items by role
  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUserRole)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 md:flex',
        isCollapsed ? 'w-16' : 'w-[280px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg">AppName</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-4">
        {!isCollapsed && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro for advanced features
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
```

---

### Desktop Layout Integration

```tsx
// app/(protected)/layout.tsx
import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <AppSidebar currentUserRole={session.role} />

      <main className="flex-1 md:ml-[280px] transition-all duration-300">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

### Mobile Navigation Integration

```tsx
// MobileNav.tsx
'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppSidebarNav } from './AppSidebarNav'; // Extract nav items to separate component

export function MobileNav({ currentUserRole }: { currentUserRole: UserRole }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b bg-background">
      <div className="flex items-center justify-between p-4">
        <h1 className="font-bold text-lg">AppName</h1>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[280px] bg-sidebar text-sidebar-foreground">
            <AppSidebarNav
              currentUserRole={currentUserRole}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
```

---

### Role-Based Filtering Pattern

```tsx
// Filter navigation items by user role
const filteredNavItems = NAV_ITEMS.filter((item) =>
  item.roles.includes(currentUserRole)
);

// Examples:
// Owner sees: Dashboard, Engagement, Analytics, Retention, Settings
// Admin sees: Dashboard, Engagement, Analytics, Retention, Settings
// Member sees: Dashboard, Engagement
// Guest sees: Dashboard
// Viewer sees: Dashboard
```

---

### Active Route Highlighting

```tsx
import { usePathname } from 'next/navigation';

const pathname = usePathname();
const isActive = pathname === item.href;

<Link
  href={item.href}
  className={cn(
    isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
  )}
  aria-current={isActive ? 'page' : undefined}
>
```

---

### Collapse State Persistence

```tsx
// Load from localStorage on mount
useEffect(() => {
  const stored = localStorage.getItem('sidebar-collapsed');
  if (stored !== null) {
    setIsCollapsed(stored === 'true');
  }
}, []);

// Save to localStorage on change
const toggleCollapse = () => {
  const newState = !isCollapsed;
  setIsCollapsed(newState);
  localStorage.setItem('sidebar-collapsed', String(newState));
};
```

---

### Responsive Behavior

```tsx
// Desktop: Fixed sidebar, content has left margin
<aside className="hidden md:flex fixed left-0 top-0 w-[280px]">

<main className="md:ml-[280px]">

// Mobile: Hidden sidebar, Sheet overlay
<div className="md:hidden">
  <Sheet>
    {/* Mobile menu */}
  </Sheet>
</div>
```

---

## 9. Design Token System

### Sidebar-Specific Tokens

**Location**: `src/app/globals.css`

#### Light Mode
```css
:root {
  --sidebar: oklch(0.985 0 0);                    /* Off-white background */
  --sidebar-foreground: oklch(0.145 0 0);         /* Dark gray text */
  --sidebar-primary: oklch(0.205 0 0);            /* Active: dark */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Active text: light */
  --sidebar-accent: oklch(0.97 0 0);              /* Hover: light gray */
  --sidebar-accent-foreground: oklch(0.205 0 0);  /* Hover text: dark */
  --sidebar-border: oklch(0.922 0 0);             /* Light gray borders */
  --sidebar-ring: oklch(0.708 0 0);               /* Focus ring */
}
```

#### Dark Mode
```css
.dark {
  --sidebar: oklch(0.205 0 0);                    /* Dark background */
  --sidebar-foreground: oklch(0.985 0 0);         /* Light text */
  --sidebar-primary: oklch(0.488 0.243 264.376);  /* Active: purple accent */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Active text: light */
  --sidebar-accent: oklch(0.269 0 0);             /* Hover: lighter dark */
  --sidebar-accent-foreground: oklch(0.985 0 0);  /* Hover text: light */
  --sidebar-border: oklch(1 0 0 / 10%);           /* Subtle borders */
  --sidebar-ring: oklch(0.556 0 0);               /* Focus ring */
}
```

---

### Tailwind CSS Classes

**Available via @theme inline**:
```css
@theme inline {
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
```

**Usage in Components**:
```tsx
className="bg-sidebar"                          // Background
className="text-sidebar-foreground"             // Text
className="border-sidebar-border"               // Border
className="bg-sidebar-primary"                  // Active background
className="text-sidebar-primary-foreground"     // Active text
className="hover:bg-sidebar-accent"             // Hover background
className="hover:text-sidebar-accent-foreground"// Hover text
className="ring-sidebar-ring"                   // Focus ring
```

---

### General Design Tokens

#### Core Colors
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
```

---

### Zero Hardcoded Colors Rule

**CRITICAL**: No Tailwind color classes allowed (e.g., `bg-blue-500`, `text-gray-700`)

**❌ Wrong**:
```tsx
<div className="bg-blue-500 text-white">
<Button className="bg-gray-100 hover:bg-gray-200">
```

**✅ Correct**:
```tsx
<div className="bg-primary text-primary-foreground">
<Button className="bg-muted hover:bg-accent">
```

**ESLint Rule** (recommended):
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/bg-(red|blue|green|yellow|purple|pink|indigo|gray|zinc|slate|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\\d+/]",
        "message": "Use design tokens instead of hardcoded Tailwind colors"
      }
    ]
  }
}
```

---

## 10. Lucide React Icons

### Installation Status
✅ **Already Installed** - Version 0.545.0

### Required Icons for Implementation

```typescript
import {
  // Navigation icons
  LayoutDashboard,  // Dashboard
  Users,            // Engagement & Users view
  TrendingUp,       // Predictive Analytics
  Target,           // Retention Strategies
  Settings,         // Settings page

  // UI control icons
  Menu,             // Mobile hamburger menu
  ChevronLeft,      // Collapse sidebar
  ChevronRight,     // Expand sidebar
  X,                // Close sheet

  // Avatar fallback
  UserIcon,         // User avatar fallback

  // Toggle group icons
  Shield,           // Roles view

  // Placeholder icons
  Sparkles,         // Coming soon placeholder
} from 'lucide-react';
```

---

### Icon Sizing Guidelines

**Navigation Items**: `h-5 w-5` (20px)
```tsx
<LayoutDashboard className="h-5 w-5" />
```

**Inline Icons**: `h-4 w-4` (16px)
```tsx
<Users className="h-4 w-4" />
```

**Avatar Fallback**: `h-4 w-4` (16px)
```tsx
<UserIcon className="h-4 w-4" />
```

**Large Icons**: `h-6 w-6` or `h-8 w-8`
```tsx
<Sparkles className="h-8 w-8" />
```

---

### Color Inheritance

Icons automatically inherit text color from parent:
```tsx
<Link className="text-sidebar-foreground hover:text-sidebar-accent-foreground">
  <LayoutDashboard className="h-5 w-5" />
  {/* Icon color matches text color */}
</Link>
```

---

## 11. TypeScript Type Definitions

### Navigation Types

```typescript
// src/types/navigation.ts
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from './roles';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: UserRole[]; // Which roles can see this item
}

export interface SidebarState {
  isCollapsed: boolean;
}

export interface AppSidebarProps {
  currentUserRole: UserRole;
  className?: string;
}

export interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}
```

---

### User Avatar Types

```typescript
// src/types/user.ts (enhance existing)
export interface User {
  id: string;
  email: string;
  display_name?: string;
  photoURL?: string | null; // Firebase Auth photo URL
  role: UserRole;
  tenant_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// src/components/users/UserAvatar.tsx
interface UserAvatarProps {
  user: {
    photoURL?: string | null;
    display_name?: string;
    email: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

---

## 12. Installation Commands Summary

### All Components (Already Installed)
```bash
# These are already installed in the project
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add toggle-group
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add table
```

---

### Optional: Official Sidebar Component
```bash
# If choosing to use official shadcn sidebar instead of custom
pnpm dlx shadcn@latest add sidebar
```

---

### Installed Dependencies
```json
{
  "@radix-ui/react-avatar": "1.1.10",
  "@radix-ui/react-dialog": "1.1.15",
  "@radix-ui/react-toggle-group": "1.1.11",
  "@radix-ui/react-separator": "^1.1.x",
  "@radix-ui/react-slot": "^1.1.x",
  "class-variance-authority": "^0.7.x",
  "lucide-react": "0.545.0",
  "motion": "^11.x"
}
```

---

## 13. Component Integration Summary

### Server Component Pattern (RootLayout)

```tsx
// app/(protected)/layout.tsx
import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get session (validates auth + tenant)
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return (
    <>
      {/* Mobile navigation */}
      <MobileNav currentUserRole={session.role} />

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <AppSidebar currentUserRole={session.role} />

        {/* Main content */}
        <main className="flex-1 pt-16 md:pt-0 md:ml-[280px]">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
```

---

### Settings Page Pattern

```tsx
// app/(protected)/users/page.tsx
import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { TenantFirestore } from '@/lib/TenantFirestore';
import { SettingsPageClient } from '@/components/settings/SettingsPageClient';

export default async function SettingsPage() {
  // 1. Get session
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  // 2. Fetch users data
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
  const users = await tenantDB.query('users', [
    { field: 'deleted', op: '!=', value: true },
  ]);

  // 3. Pass to client component
  return (
    <SettingsPageClient
      currentUser={session.user}
      currentUserRole={session.role}
      users={users}
    />
  );
}
```

---

### Client Component Pattern (Settings)

```tsx
// components/settings/SettingsPageClient.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield } from 'lucide-react';
import { UserAvatar } from '@/components/users/UserAvatar';
import { RoleBadge } from '@/components/users/RoleBadge';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/users/UserTable';
import { ComingSoonPlaceholder } from '@/components/ui/ComingSoonPlaceholder';

export function SettingsPageClient({ currentUser, currentUserRole, users }) {
  const [view, setView] = useState<'users' | 'roles'>('users');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="user-permissions">
        <TabsList>
          <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
          <TabsTrigger value="user-permissions">User Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContents className="mt-6">
          <TabsContent value="ai-config">
            <ComingSoonPlaceholder module="AI Configuration" />
          </TabsContent>

          <TabsContent value="user-permissions">
            <div className="space-y-6">
              {/* Section Header with Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Profile and members</h2>
                  <p className="text-muted-foreground">
                    Manage your profile and team members
                  </p>
                </div>

                <ToggleGroup
                  type="single"
                  value={view}
                  onValueChange={(value) => {
                    if (value) setView(value as 'users' | 'roles');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="users" aria-label="View users">
                    <Users className="h-4 w-4" />
                    <span className="ml-2">Users</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="roles" aria-label="View roles">
                    <Shield className="h-4 w-4" />
                    <span className="ml-2">Roles</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Current User Profile Card */}
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={currentUser} size="lg" />
                    <div>
                      <p className="font-medium">{currentUser.display_name}</p>
                      <RoleBadge role={currentUserRole} />
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Users Table or Roles View */}
              {view === 'users' ? (
                <UserTable users={users} currentUserRole={currentUserRole} />
              ) : (
                <ComingSoonPlaceholder module="Roles Management" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <ComingSoonPlaceholder module="Notifications" />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
```

---

## 14. Security Integration Checklist

### Layer 1: Edge Middleware
- ✅ No changes needed - JWT verification already handles route protection
- ✅ Navigation is read-only, middleware redirects unauthenticated users

### Layer 2: Data Access Layer
- ✅ Call `getCurrentSession()` in all server components
- ✅ Pass `session.role` to client components as props (never fetch client-side)

### Layer 3: Client Validation
- ✅ No forms in navigation (read-only UI)
- ✅ Settings page uses existing UserTable validation

### Layer 4: Cloud Functions
- ✅ No new functions needed for navigation
- ✅ Settings page uses existing inviteUser, onUserCreate functions

### Layer 5: Firestore Security Rules
- ✅ No new collections - navigation uses existing users, tenants
- ✅ Existing rules already enforce tenant isolation

### Layer 6: TenantFirestore Wrapper
- ✅ Settings page queries users via TenantFirestore
- ✅ Auto tenant_id injection ensures data isolation

---

## 15. Accessibility Compliance (WCAG 2.1 AA)

### Keyboard Navigation
- ✅ All interactive elements keyboard accessible
- ✅ Tab order follows logical flow
- ✅ Focus indicators visible (ring-2 ring-ring)
- ✅ ESC closes mobile menu
- ✅ Arrow keys navigate tabs and toggle groups

### Screen Reader Support
- ✅ Semantic HTML (nav, aside, main, button)
- ✅ aria-label for icon-only buttons
- ✅ aria-current="page" for active nav items
- ✅ Title attribute for collapsed nav items (tooltip)
- ✅ Sheet has focus trap and ARIA dialog semantics

### Color Contrast
- ✅ All text meets 4.5:1 contrast ratio (design tokens ensure this)
- ✅ Active/hover states have clear visual indication
- ✅ Focus indicators highly visible

---

## 16. Next Steps

### Custom Components to Build
1. **AppSidebar** - Main sidebar container with collapse logic
2. **NavItem** - Individual navigation link component
3. **UserAvatar** - Reusable avatar with fallback chain
4. **ComingSoonPlaceholder** - Placeholder for unimplemented features

### Files to Create
1. `src/types/navigation.ts` - Navigation type definitions
2. `src/components/layout/AppSidebar.tsx` - Desktop sidebar
3. `src/components/layout/MobileNav.tsx` - Mobile sheet navigation
4. `src/components/users/UserAvatar.tsx` - Avatar wrapper
5. `src/components/ui/ComingSoonPlaceholder.tsx` - Placeholder component
6. `app/(protected)/layout.tsx` - Update with sidebar
7. `app/(protected)/users/page.tsx` - Update with tabs and enhancements

### Testing Requirements
- Test all 5 role permission levels (owner, admin, member, guest, viewer)
- Test responsive behavior (mobile, tablet, desktop)
- Test collapse/expand state persistence
- Test keyboard navigation and focus management
- Test avatar fallback chain (photoURL, initials, icon)
- Test dark mode compatibility
- Test screen reader announcements

---

## Conclusion

All required shadcn/ui components are already installed and ready for use. The project has a comprehensive design token system that supports both light and dark modes. The sidebar implementation will require custom components built using the available primitives (Sheet, Button, Separator) combined with role-based filtering from the existing security architecture.

**Key Success Factors**:
1. ✅ All components verified as installed
2. ✅ Design tokens fully defined and compliant
3. ✅ Security integration patterns documented
4. ✅ Accessibility requirements clear
5. ✅ Responsive patterns established
6. ✅ TypeScript types defined

**Ready for Implementation Phase**: Proceed to shadcn-implementation-builder agent.

---

**File Locations**:
- Component Research: `g:\work\agentient-app\ideation\auth\tasks\sidebar_and_roles_permission_work\agent-findings\02-component-research.md`
- Requirements Analysis: `g:\work\agentient-app\ideation\auth\tasks\sidebar_and_roles_permission_work\agent-findings\01-requirements-analysis.md`
- Project Root: `g:\work\agentient-app\ideation\auth`
