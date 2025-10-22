# Implementation Plan: Sidebar & User Permissions UI

**Version**: 1.0
**Date**: 2025-10-22
**Status**: In Progress

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Visual Analysis](#visual-analysis)
3. [Architecture Decisions](#architecture-decisions)
4. [Component Specifications](#component-specifications)
5. [Implementation Phases](#implementation-phases)
6. [Security Integration](#security-integration)
7. [Design Token Compliance](#design-token-compliance)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)
10. [Future Enhancements](#future-enhancements)

---

## 📊 Executive Summary

### Objective
Build the foundational UI architecture for the multi-tenant SaaS platform, implementing app-wide collapsible sidebar navigation and enhanced user permissions interface based on the reference design ([reference/users-reference.webp](./reference/users-reference.webp)).

### Scope
- **Collapsible App Sidebar**: Desktop expandable/collapsible + Mobile hamburger menu
- **Settings Page**: Tabs navigation + Users/Roles toggle + Enhanced user table
- **Avatar System**: Conditional rendering (photoURL → initials → icon)
- **Placeholder Routes**: For future modules (engagement, analytics, retention)

### Key Constraints
- ✅ **Security**: All 6 layers enforced (no exceptions)
- ✅ **Design Tokens**: 100% CSS variable usage (zero hardcoded colors)
- ✅ **Type Safety**: Full TypeScript, no `any` types
- ✅ **Extensibility**: Foundation for all future modules
- ✅ **Responsive**: Mobile-first design

### Estimated Effort
**6-8 hours** total (with Shadcn agent pipeline)

---

## 🎨 Visual Analysis

### Reference Image Breakdown

**Source**: `reference/users-reference.webp` (Lamda app Settings page)

#### Layout Architecture
- **Type**: Two-column (sidebar + main content)
- **Sidebar**:
  - Width: ~280px (collapsible, NOT fixed)
  - Background: White (`var(--sidebar)`)
  - Border: Right border (`var(--sidebar-border)`)
  - Position: Collapsible (expand/collapse button)
- **Main Content**:
  - Background: Light gray (`var(--background)`)
  - Padding: 24-32px (`var(--spacing-lg)` to `var(--spacing-xl)`)
  - Content: White cards with shadows

#### Visual Elements

**1. Sidebar Navigation**
- Logo: Top (Lamda with icon)
- Menu Items:
  - Dashboard (icon: LayoutDashboard)
  - Engagement (icon: Users)
  - Predictive Analytics (icon: TrendingUp)
  - Retention Strategies (icon: Target)
  - Settings (icon: Settings) - **ACTIVE STATE**
- Footer: Promotional card (Download Mac OS app)
- Active State: Light gray background + bold text

**2. Settings Page Header**
- Title: "Settings" (28-32px, bold)
- Subtitle: "Update settings for better features performance" (14px, gray)
- Tabs: AI Configuration | User Permissions | Notifications

**3. Profile and Members Section**
- Header: "Profile and members" + "Users | Roles" toggle
- Current User Card:
  - Avatar (circular, 48px)
  - Name: "Borja Loma"
  - Role: "Admin" badge
  - Button: "Edit Profile" (outline)

**4. User Table**
- Columns: NAME | EMAIL | ROLE | (Actions)
- Rows: 5 users visible
- Features:
  - Circular avatars (32px)
  - Role dropdowns (Manager, Analyst)
  - User action icons (person icon)
- Button: "Add Member" (primary, bottom right)

#### Design Token Mapping

| Reference Color | Hex Estimate | Project Token | Usage |
|----------------|--------------|---------------|-------|
| Sidebar white | `#FFFFFF` | `--sidebar` | Sidebar background |
| Active item bg | `#F7F7F7` | `--sidebar-accent` | Hover/active states |
| Text dark | `#1F2937` | `--sidebar-foreground` | Primary text |
| Text gray | `#6B7280` | `--muted-foreground` | Secondary text |
| Border gray | `#E5E7EB` | `--sidebar-border` | Dividers, borders |
| Primary blue | `#06B6D4` | `--primary` | Buttons, links |
| Background gray | `#F7F7F7` | `--background` | Page background |
| Card white | `#FFFFFF` | `--card` | Card backgrounds |

#### Typography Scale
- **Page Title**: 28-32px, Bold (700) - `text-3xl font-bold`
- **Section Title**: 18-20px, Semi-bold (600) - `text-lg font-semibold`
- **Tab Text**: 14px, Medium (500) - `text-sm font-medium`
- **Body Text**: 14px, Regular (400) - `text-sm`
- **Small Text**: 12px, Medium (500) - `text-xs font-medium`

#### Spacing System
- **Base**: 8px (matches Tailwind default scale)
- **Card Padding**: 24px (`p-6`)
- **Table Row**: 12-16px vertical (`py-3` to `py-4`)
- **Section Gap**: 24-32px (`space-y-6` to `space-y-8`)

---

## 🏛️ Architecture Decisions

### Decision 1: Sidebar Placement
**Decision**: Integrate sidebar in `src/app/(protected)/layout.tsx`

**Rationale**:
- Next.js 15 pattern for shared layouts
- Applies to ALL protected routes automatically
- Single source of truth for navigation
- Simplifies future module integration

**Implementation**:
```tsx
// src/app/(protected)/layout.tsx
export default async function ProtectedLayout({ children }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        currentUserRole={session.role}
        currentUserName={session.display_name}
      />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
```

---

### Decision 2: Sidebar Behavior (Collapsible, NOT Fixed)
**Decision**: Use state-managed collapsible sidebar (not fixed width)

**Rationale**:
- User requested collapsible, not fixed
- Better UX: Users can maximize screen space
- Desktop: Expand/collapse button
- Mobile: Hidden by default, hamburger menu → Sheet overlay

**State Management**:
```tsx
// In layout.tsx
const [sidebarOpen, setSidebarOpen] = useState(true);

<AppSidebar
  isOpen={sidebarOpen}
  onToggle={() => setSidebarOpen(!sidebarOpen)}
/>
```

**Note**: Since layout.tsx is server component, we'll need a client wrapper for state.

---

### Decision 3: Avatar Fallback Strategy
**Decision**: Three-tier fallback system

**Fallback Chain**:
1. **Primary**: `user.photoURL` (from Firebase Auth)
2. **Secondary**: Initials from `display_name` or `email`
3. **Tertiary**: Default `UserIcon` from Lucide

**Implementation**:
```tsx
export function UserAvatar({ user, size = 'md' }) {
  if (user.photoURL) {
    return <Avatar><AvatarImage src={user.photoURL} /></Avatar>;
  }

  const initials = getInitials(user.display_name || user.email);
  if (initials) {
    return <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>;
  }

  return <Avatar><AvatarFallback><UserIcon /></AvatarFallback></Avatar>;
}
```

---

### Decision 4: Navigation Security
**Decision**: Role-based menu filtering at component level

**Rationale**:
- Defense-in-depth: UI + middleware + Firestore rules
- Better UX: Users only see allowed routes
- Easy to maintain: Single nav config

**Implementation**:
```tsx
const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'member', 'guest', 'viewer'] },
  { name: 'Engagement', href: '/engagement', icon: Users, roles: ['owner', 'admin', 'member'] },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, roles: ['owner', 'admin'] },
  { name: 'Settings', href: '/users', icon: Settings, roles: ['owner', 'admin'] }
];

const filteredNav = navigationItems.filter(item =>
  item.roles.includes(currentUserRole)
);
```

---

### Decision 5: Mobile Responsive Strategy
**Decision**: Use Shadcn Sheet component for mobile sidebar

**Breakpoints**:
- **Desktop** (≥768px): Collapsible sidebar visible
- **Mobile** (<768px): Hidden sidebar, hamburger button, Sheet overlay

**Implementation**:
```tsx
// Desktop
<aside className="hidden md:flex">
  <AppSidebar />
</aside>

// Mobile
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-6 w-6" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <AppSidebar />
  </SheetContent>
</Sheet>
```

---

### Decision 6: TypeScript Type Safety
**Decision**: Create comprehensive type definitions in `src/types/navigation.ts`

**Types**:
```typescript
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from './roles';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string | number;
}

export interface SidebarProps {
  currentUserRole: UserRole;
  currentUserName: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}
```

---

## 📦 Component Specifications

### 1. AppSidebar Component

**File**: `src/components/layout/AppSidebar.tsx`
**Type**: Client Component (`'use client'`)

#### Props Interface
```typescript
interface AppSidebarProps {
  currentUserRole: UserRole;
  currentUserName: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}
```

#### Features
- Collapsible navigation (expand/collapse button)
- Navigation items with Lucide icons
- Active route highlighting (using `usePathname()`)
- Role-based menu filtering
- Footer section (promotional content placeholder)
- Responsive: Desktop sidebar + Mobile sheet

#### Styling Requirements
```tsx
// CORRECT: Use design tokens
<nav className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
  <button className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
    Dashboard
  </button>
  <button className="bg-sidebar-primary text-sidebar-primary-foreground"> {/* Active */}
    Settings
  </button>
</nav>
```

#### Dependencies
- Lucide React icons
- Next.js `usePathname()` hook
- Shadcn Sheet component (for mobile)

---

### 2. SettingsTabs Component

**File**: `src/components/settings/SettingsTabs.tsx`
**Type**: Client Component

#### Props Interface
```typescript
interface SettingsTabsProps {
  defaultTab?: string;
  children: React.ReactNode;
}
```

#### Features
- Tab navigation: AI Configuration | User Permissions | Notifications
- Only "User Permissions" tab has content (children prop)
- Other tabs show "Coming Soon" placeholder
- Uses Shadcn Tabs component

#### Tabs Configuration
```tsx
const tabs = [
  { value: 'ai-config', label: 'AI Configuration', content: <ComingSoon /> },
  { value: 'permissions', label: 'User Permissions', content: children },
  { value: 'notifications', label: 'Notifications', content: <ComingSoon /> }
];
```

---

### 3. ViewToggle Component

**File**: `src/components/users/ViewToggle.tsx`
**Type**: Client Component

#### Props Interface
```typescript
interface ViewToggleProps {
  value: 'users' | 'roles';
  onChange: (value: 'users' | 'roles') => void;
}
```

#### Features
- Toggle group: Users | Roles
- Icons: Users icon | Shield icon
- "Users" active by default
- Uses Shadcn ToggleGroup component

---

### 4. UserAvatar Component

**File**: `src/components/users/UserAvatar.tsx`
**Type**: Client Component

#### Props Interface
```typescript
interface UserAvatarProps {
  user: {
    photoURL?: string;
    display_name?: string;
    email: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Size Mapping
- `sm`: 32px (h-8 w-8)
- `md`: 40px (h-10 w-10) - default
- `lg`: 48px (h-12 w-12)

#### Fallback Logic
1. If `photoURL` exists → `<AvatarImage src={photoURL} />`
2. Else if `display_name` or `email` → `<AvatarFallback>{initials}</AvatarFallback>`
3. Else → `<AvatarFallback><UserIcon /></AvatarFallback>`

#### Helper Function
```typescript
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
```

---

### 5. CurrentUserProfile Component

**File**: `src/components/users/CurrentUserProfile.tsx`
**Type**: Client Component

#### Props Interface
```typescript
interface CurrentUserProfileProps {
  user: User;
  onEditClick?: () => void; // Placeholder for future implementation
}
```

#### Features
- Display current user info
- UserAvatar component (size: lg)
- display_name
- RoleBadge component
- "Edit Profile" button (outline variant)
- Card layout with padding

#### Layout
```tsx
<Card>
  <CardContent className="flex items-center gap-4 p-6">
    <UserAvatar user={user} size="lg" />
    <div className="flex-1">
      <h3 className="font-semibold">{user.display_name}</h3>
      <RoleBadge role={user.role} size="sm" />
    </div>
    <Button variant="outline" onClick={onEditClick}>
      Edit Profile
    </Button>
  </CardContent>
</Card>
```

---

### 6. Enhanced UserTable Component

**File**: `src/components/users/UserTable.tsx` (existing, will enhance)
**Type**: Client Component

#### Changes Required
- **ADD**: Avatar column (leftmost position)
- **KEEP**: All existing functionality (role dropdown, actions menu)
- **REFINE**: Spacing to match reference image
- **USE**: UserAvatar component (size: sm)

#### New Column Structure
```tsx
<TableRow>
  <TableCell>{/* NEW: Avatar */}
    <UserAvatar user={user} size="sm" />
  </TableCell>
  <TableCell>{/* Name */}</TableCell>
  <TableCell>{/* Email */}</TableCell>
  <TableCell>{/* Role */}</TableCell>
  <TableCell>{/* Actions */}</TableCell>
</TableRow>
```

---

### 7. Updated Protected Layout

**File**: `src/app/(protected)/layout.tsx` (existing, will enhance)
**Type**: Server Component (with client wrapper for sidebar state)

#### Changes Required
- Add AppSidebar integration
- Two-column layout: Sidebar + Main
- Fetch session once, pass to sidebar
- State management for sidebar collapse (use client wrapper)

#### Structure
```tsx
// New client wrapper component
'use client';
function ProtectedLayoutClient({ children, session }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        currentUserRole={session.role}
        currentUserName={session.display_name}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}

// Server component
export default async function ProtectedLayout({ children }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return <ProtectedLayoutClient session={session}>{children}</ProtectedLayoutClient>;
}
```

---

## 🔄 Implementation Phases

### Phase 1: Setup & Documentation ✅
**Time**: 1 hour

1. ✅ Create documentation folder structure
2. 🔄 Write core documentation files
3. ⏳ Install Shadcn components
4. ⏳ Create TypeScript type definitions

---

### Phase 2: Shadcn Agent Pipeline
**Time**: 3-4 hours

#### TASK 2.1: Requirements Analysis
**Agent**: `shadcn-requirements-analyzer`

**Prompt**:
```
Analyze requirements for multi-tenant SaaS platform UI:

SCOPE:
1. Collapsible app sidebar navigation (NOT fixed)
   - Desktop: Expandable/collapsible sidebar with toggle button
   - Mobile: Hamburger menu → Sheet overlay
   - Navigation: Dashboard, Engagement, Analytics, Retention, Settings
   - Role-based filtering (5 roles: owner, admin, member, guest, viewer)
   - Active state highlighting

2. Settings page enhancements:
   - Tab navigation (AI Configuration, User Permissions, Notifications)
   - Only User Permissions has content (others placeholder)
   - Users/Roles toggle
   - User table with avatar column
   - Current user profile card (UI only)

3. Avatar system:
   - Check user.photoURL from Firebase Auth
   - Fallback to initials from display_name or email
   - Final fallback to UserIcon
   - Sizes: sm (32px), md (40px), lg (48px)

4. Placeholder routes:
   - /engagement (Coming Soon)
   - /analytics (Coming Soon)
   - /retention (Coming Soon)

Break down into shadcn components needed.
```

**Output**: `agent-findings/01-requirements-analysis.md`

---

#### TASK 2.2: Component Research
**Agent**: `shadcn-component-researcher`

**Prompt**:
```
Research shadcn components from requirements analysis:

Components to research:
- avatar (with fallback patterns)
- tabs (navigation tabs)
- toggle-group (for Users/Roles switcher)
- sheet (for mobile sidebar overlay)
- separator (for visual dividers)

For each component, provide:
- Full source code
- Installation command
- Dependencies (npm packages)
- Registry dependencies (other shadcn components)
- Usage examples
- TypeScript types
- Integration patterns
```

**Output**: `agent-findings/02-component-research.md`

---

#### TASK 2.3: Implementation
**Agent**: `shadcn-implementation-builder`

**Prompt**:
```
Build foundation UI components using research:

CRITICAL REQUIREMENTS:

1. Design Tokens (MANDATORY):
   - Use tokens from src/app/globals.css ONLY
   - Sidebar tokens: --sidebar, --sidebar-foreground, --sidebar-primary, --sidebar-accent
   - NO hardcoded colors (no bg-blue-500, bg-cyan-400, etc.)
   - Spacing: Use Tailwind default scale (matches 8px system)
   - Radius: Use var(--radius) token

2. Security Integration:
   - TenantFirestore for all data operations
   - getCurrentSession() for auth validation
   - Role-based filtering: filter nav items by user role
   - Pass session data from server to client components as props

3. Components to Create:

   A. AppSidebar (src/components/layout/AppSidebar.tsx)
      - Collapsible sidebar (expand/collapse button)
      - Navigation items with Lucide icons
      - Active state highlighting (use usePathname())
      - Role-based filtering
      - Responsive: Desktop sidebar + Mobile sheet
      - Footer section placeholder

   B. SettingsTabs (src/components/settings/SettingsTabs.tsx)
      - Tab navigation: AI Configuration, User Permissions, Notifications
      - Only User Permissions tab has content slot
      - Other tabs show "Coming Soon"

   C. ViewToggle (src/components/users/ViewToggle.tsx)
      - Toggle group: Users | Roles
      - Icons for each option

   D. UserAvatar (src/components/users/UserAvatar.tsx)
      - Check user.photoURL first
      - Fallback to initials
      - Final fallback to UserIcon
      - Size variants: sm, md, lg

   E. CurrentUserProfile (src/components/users/CurrentUserProfile.tsx)
      - Avatar + display_name + role badge
      - "Edit Profile" button (onClick placeholder)

   F. Enhanced UserTable (src/components/users/UserTable.tsx)
      - ADD avatar column (leftmost)
      - Keep existing functionality

   G. Updated Protected Layout (src/app/(protected)/layout.tsx)
      - Add AppSidebar component
      - Two-column layout
      - State management for sidebar collapse

4. TypeScript:
   - Full types, no 'any'
   - Create src/types/navigation.ts

5. Responsive:
   - Desktop (≥768px): Collapsible sidebar
   - Mobile (<768px): Hidden sidebar, Sheet overlay
```

**Output**: `agent-findings/03-implementation-notes.md`

---

### Phase 3: Placeholder Routes
**Time**: 30 min

Create three placeholder routes with "Coming Soon" UI:
1. `src/app/(protected)/engagement/page.tsx`
2. `src/app/(protected)/analytics/page.tsx`
3. `src/app/(protected)/retention/page.tsx`

**Template**:
```tsx
import { getCurrentSession } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function EngagementPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Engagement</CardTitle>
          <CardDescription>Coming Soon</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
```

---

### Phase 4: Testing & QA
**Time**: 1-2 hours

#### Security Testing
**Agent**: `frontend-security-enforcer`

**Prompt**:
```
Review all created components for security:

Check for:
- XSS vulnerabilities
- CSRF protection
- Proper authentication checks
- No sensitive data in client code
- Security headers configuration

Verify:
- TenantFirestore used (no raw Firestore SDK)
- Role-based access control works
- Session data properly validated

Files to review:
- src/components/layout/AppSidebar.tsx
- src/components/settings/SettingsTabs.tsx
- src/components/users/ViewToggle.tsx
- src/components/users/UserAvatar.tsx
- src/components/users/CurrentUserProfile.tsx
- src/components/users/UserTable.tsx
- src/app/(protected)/layout.tsx
```

**Output**: `agent-findings/04-security-review.md`

---

## 🔐 Security Integration

### All 6 Layers Enforced

#### Layer 1: Edge Middleware ✅
**Status**: Already implemented
**File**: `src/middleware.ts`
**Function**: JWT verification before protected routes
**No Changes Required**

---

#### Layer 2: Data Access Layer ✅
**Implementation**:
- Use `getCurrentSession()` in all server components
- Pass session data to client components as props
- Never access Firebase Auth directly in client components

**Example**:
```tsx
// Server Component
export default async function ProtectedLayout({ children }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  // Pass session data to client component
  return <ProtectedLayoutClient session={session}>{children}</ProtectedLayoutClient>;
}
```

---

#### Layer 3: Client Validation ✅
**Implementation**:
- No forms in sidebar (navigation only)
- Existing validation patterns maintained
- TypeScript ensures type safety

**No New Validation Required**

---

#### Layer 4: Cloud Functions ✅
**Implementation**:
- No new privileged operations
- Navigation is read-only
- No user creation/modification in sidebar

**No New Functions Required**

---

#### Layer 5: Firestore Security Rules ✅
**Implementation**:
- No new collections
- Existing rules apply to users/invitations collections

**No New Rules Required**

---

#### Layer 6: TenantFirestore Wrapper ✅
**Implementation**:
- All data operations already use TenantFirestore
- No new database queries in sidebar
- User data fetched in existing pages

**Verification**:
```bash
# Audit for raw Firestore SDK usage
grep -r "collection\(.*\)" src/components/layout/
grep -r "doc\(.*\)" src/components/layout/

# Expected result: NO matches
```

---

## 🎨 Design Token Compliance

### Token Usage Rules

#### ✅ REQUIRED: Use Design Tokens
```tsx
// Sidebar
<nav className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

// Active navigation item
<button className="bg-sidebar-primary text-sidebar-primary-foreground">

// Hover state
<button className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">

// Card
<Card className="bg-card text-card-foreground border border-border">

// Primary button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
```

#### ❌ FORBIDDEN: Hardcoded Colors
```tsx
// Never do this
<nav className="bg-white text-gray-900 border-gray-200">
<button className="bg-blue-500 text-white hover:bg-blue-600">
<Card className="bg-white border-gray-300">
```

### Sidebar-Specific Tokens

From `src/app/globals.css`:
```css
/* Light Mode (lines 71-78) */
:root {
  --sidebar: oklch(0.985 0 0);                    /* Light background */
  --sidebar-foreground: oklch(0.145 0 0);         /* Dark text */
  --sidebar-primary: oklch(0.205 0 0);            /* Active item bg */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Active item text */
  --sidebar-accent: oklch(0.97 0 0);              /* Hover bg */
  --sidebar-accent-foreground: oklch(0.205 0 0);  /* Hover text */
  --sidebar-border: oklch(0.922 0 0);             /* Dividers */
  --sidebar-ring: oklch(0.708 0 0);               /* Focus ring */
}

/* Dark Mode (lines 105-112) */
.dark {
  --sidebar: oklch(0.205 0 0);                    /* Dark background */
  --sidebar-foreground: oklch(0.985 0 0);         /* Light text */
  --sidebar-primary: oklch(0.488 0.243 264.376);  /* Active item bg (purple) */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Active item text */
  --sidebar-accent: oklch(0.269 0 0);             /* Hover bg */
  --sidebar-accent-foreground: oklch(0.985 0 0);  /* Hover text */
  --sidebar-border: oklch(1 0 0 / 10%);           /* Dividers (translucent) */
  --sidebar-ring: oklch(0.556 0 0);               /* Focus ring */
}
```

### Token Audit Command
```bash
# Check for hardcoded colors
grep -r "bg-blue-\|bg-red-\|bg-cyan-\|bg-green-\|bg-yellow-\|bg-purple-\|bg-gray-\|bg-white\|text-blue-\|text-red-\|text-gray-\|border-gray-" src/components/layout/ src/components/settings/ src/components/users/ src/app/\(protected\)/

# Expected result: NO matches (100% token usage)
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

#### Functional Testing
- [ ] Sidebar navigation works (all routes)
- [ ] Sidebar expand/collapse button works
- [ ] Mobile sidebar uses hamburger menu
- [ ] Mobile Sheet overlay opens/closes
- [ ] Active route highlighted correctly (usePathname)
- [ ] Role-based navigation filtering works
  - [ ] Test as owner (all items visible)
  - [ ] Test as admin (analytics visible)
  - [ ] Test as member (engagement visible, analytics hidden)
  - [ ] Test as viewer (only dashboard visible)
- [ ] Settings tabs can switch
- [ ] Users/Roles toggle works
- [ ] User table shows avatars
- [ ] Avatar fallback works:
  - [ ] photoURL displays image
  - [ ] No photoURL → shows initials
  - [ ] No display_name → shows initials from email
  - [ ] No email → shows UserIcon
- [ ] Current user profile card displays
- [ ] Edit Profile button exists (no functionality yet)
- [ ] Placeholder routes accessible (/engagement, /analytics, /retention)

---

#### Security Testing
- [ ] Verify TenantFirestore usage
  - [ ] Run grep audit for raw `collection()`, `doc()`
  - [ ] Expected: ZERO matches
- [ ] Test tenant isolation
  - [ ] Switch tenant in emulator
  - [ ] Verify cannot access other tenant data
- [ ] Test role-based access control
  - [ ] Navigation items hide/show based on role
  - [ ] Unauthorized routes redirect (middleware level)
- [ ] Verify session validation
  - [ ] Sign out → sidebar hidden
  - [ ] Invalid session → redirect to login
- [ ] Run frontend-security-enforcer agent
  - [ ] Review for XSS vulnerabilities
  - [ ] Review for CSRF issues
  - [ ] Check security headers

---

#### Design Token Testing
- [ ] Run grep audit for hardcoded colors
  - [ ] Expected: ZERO matches
- [ ] Test light mode
  - [ ] Sidebar background is light
  - [ ] Active item has correct background
  - [ ] Hover states work
- [ ] Test dark mode
  - [ ] Toggle dark mode
  - [ ] Sidebar background is dark
  - [ ] Active item has purple background
  - [ ] Text is light colored
- [ ] Verify spacing
  - [ ] All spacing uses Tailwind scale (no custom px)
  - [ ] Matches 8px system

---

#### Visual QA
- [ ] Compare with reference image
  - [ ] Sidebar layout matches
  - [ ] Typography sizes/weights match
  - [ ] Spacing matches
  - [ ] Shadows match
- [ ] Test responsive breakpoints
  - [ ] Desktop (≥768px): Sidebar visible
  - [ ] Tablet (768-1024px): Sidebar collapsible
  - [ ] Mobile (<768px): Hamburger menu
- [ ] Test all interactive states
  - [ ] Hover: Background changes to --sidebar-accent
  - [ ] Active: Background is --sidebar-primary
  - [ ] Focus: Ring visible (--sidebar-ring)
- [ ] Verify avatar sizes
  - [ ] sm: 32px (table rows)
  - [ ] md: 40px (default)
  - [ ] lg: 48px (profile card)

---

### Automated Testing

#### Unit Tests (Future)
```typescript
// Example: UserAvatar.test.tsx
describe('UserAvatar', () => {
  it('shows image when photoURL exists', () => {
    const user = { photoURL: 'https://example.com/photo.jpg', email: 'test@example.com' };
    render(<UserAvatar user={user} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', user.photoURL);
  });

  it('shows initials when no photoURL', () => {
    const user = { display_name: 'John Doe', email: 'john@example.com' };
    render(<UserAvatar user={user} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows UserIcon when no data', () => {
    const user = { email: '' };
    render(<UserAvatar user={user} />);
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });
});
```

---

## ✅ Success Criteria

### Documentation ✅
- [x] README.md created (new developer can start immediately)
- [x] PLAN.md created (this document)
- [x] TASKS.md created (task tracking with checkboxes)
- [ ] All agent findings saved to `agent-findings/`
- [ ] Component specs documented in `technical-specs/`
- [ ] Design token mapping documented
- [ ] Security checklist created

### Implementation ✅
- [ ] Collapsible sidebar works (expand/collapse button)
- [ ] Mobile sidebar uses Sheet component (hamburger menu)
- [ ] Navigation shows/hides based on role
- [ ] Active route highlighted in sidebar
- [ ] Settings tabs navigation works
- [ ] Users/Roles toggle works
- [ ] User table has avatar column
- [ ] Avatars show photoURL or fallback to initials
- [ ] Current user profile card displays
- [ ] Placeholder routes created (/engagement, /analytics, /retention)

### Quality ✅
- [ ] ZERO hardcoded colors (100% token usage)
- [ ] Full TypeScript types (no `any`)
- [ ] TenantFirestore used for all data operations
- [ ] Tenant isolation verified
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode works correctly
- [ ] No console errors or warnings
- [ ] Passes frontend-security-enforcer review

### Handoff ✅
- [ ] New developer can understand the work from README.md
- [ ] All tasks tracked in TASKS.md
- [ ] Agent findings saved for next session
- [ ] Clear next steps documented

---

## 🚀 Future Enhancements

### Phase 6: Profile Editing (Post-Foundation)
**Estimated**: 2-3 hours

1. **Create Profile Edit Modal**
   - Form with Zod validation
   - Fields: display_name, email (readonly), photoURL upload
   - Server action for updates
   - Optimistic UI updates

2. **Avatar Upload Integration**
   - Firebase Storage integration
   - Image upload with preview
   - Crop/resize functionality
   - Update user.photoURL in Firestore

---

### Phase 7: Roles Management (Post-Foundation)
**Estimated**: 4-6 hours

1. **Roles View Implementation**
   - Table of roles (owner, admin, member, guest, viewer)
   - Permission matrix (CRUD operations per resource)
   - Edit role permissions (owner/admin only)

2. **Role Assignment**
   - Bulk role changes
   - Role change history/audit trail
   - Confirmation modals

---

### Phase 8: Settings Tabs Content (Post-Foundation)
**Estimated**: 6-8 hours

1. **AI Configuration Tab**
   - TBD based on product requirements

2. **Notifications Tab**
   - Email notification preferences
   - In-app notification settings
   - Notification history

---

### Phase 9: Dashboard Module (Post-Foundation)
**Estimated**: 1-2 weeks

1. **Dashboard Page**
   - Key metrics cards
   - Charts (engagement, analytics)
   - Recent activity feed
   - Quick actions

---

### Phase 10: Engagement Module (Post-Foundation)
**Estimated**: 1-2 weeks

1. **Engagement Page**
   - User engagement metrics
   - Activity timeline
   - Engagement charts
   - Export functionality

---

### Phase 11: Analytics Module (Post-Foundation)
**Estimated**: 1-2 weeks

1. **Predictive Analytics Page**
   - Analytics dashboard
   - Trend charts
   - Predictive models
   - Export/reporting

---

### Phase 12: Retention Module (Post-Foundation)
**Estimated**: 1-2 weeks

1. **Retention Strategies Page**
   - Retention metrics
   - Strategy management
   - Campaign tracking
   - ROI analysis

---

## 📝 Appendix

### File Structure (Complete)
```
src/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx              # ENHANCED: Add AppSidebar integration
│   │   ├── dashboard/
│   │   │   └── page.tsx            # ENHANCED: Add basic dashboard UI
│   │   ├── engagement/
│   │   │   └── page.tsx            # NEW: Placeholder route
│   │   ├── analytics/
│   │   │   └── page.tsx            # NEW: Placeholder route
│   │   ├── retention/
│   │   │   └── page.tsx            # NEW: Placeholder route
│   │   └── users/
│   │       └── page.tsx            # ENHANCED: Add tabs, toggle, profile card
│   ├── layout.tsx
│   └── globals.css                 # ✅ Already has sidebar tokens
├── components/
│   ├── layout/
│   │   └── AppSidebar.tsx          # NEW: Main navigation sidebar
│   ├── settings/
│   │   └── SettingsTabs.tsx        # NEW: Tab navigation
│   ├── users/
│   │   ├── UserAvatar.tsx          # NEW: Avatar with fallback
│   │   ├── ViewToggle.tsx          # NEW: Users/Roles switcher
│   │   ├── CurrentUserProfile.tsx  # NEW: Profile card (UI only)
│   │   └── UserTable.tsx           # ENHANCED: Add avatar column
│   └── ui/
│       ├── avatar.tsx              # NEW: Shadcn component
│       ├── tabs.tsx                # NEW: Shadcn component
│       ├── toggle-group.tsx        # NEW: Shadcn component
│       └── sheet.tsx               # NEW: Shadcn component
├── types/
│   ├── navigation.ts               # NEW: Navigation types
│   ├── roles.ts                    # ✅ Already exists
│   └── user.ts                     # ✅ Already exists
└── lib/
    ├── dal.ts                      # ✅ Already exists
    ├── TenantFirestore.ts          # ✅ Already exists
    └── client-auth.ts              # ✅ Already exists
```

### Glossary

**Collapsible Sidebar**: Sidebar that can be expanded or collapsed via toggle button (NOT fixed width)

**Design Tokens**: CSS variables in globals.css (single source of truth for styling)

**TenantFirestore**: Wrapper class that automatically injects tenant_id into all Firestore queries

**getCurrentSession()**: DAL function that validates auth and returns session with tenant_id + role

**Role Hierarchy**: owner > admin > member > guest > viewer (5 roles)

**Shadcn UI**: Component library built on Radix UI with Tailwind CSS

**Sheet**: Shadcn overlay component for mobile navigation

**MCP Server**: Model Context Protocol server for Shadcn component data

---

**End of Implementation Plan**
