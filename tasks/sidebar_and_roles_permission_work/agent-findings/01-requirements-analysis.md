# Requirements Analysis: Multi-Tenant SaaS Foundational UI

**Date**: 2025-10-22
**Analyzer**: shadcn Requirements Analyzer
**Feature**: Collapsible App Sidebar Navigation + Settings Page Enhancements

---

## Executive Summary

This analysis breaks down the requirements for implementing a production-ready, collapsible sidebar navigation system and enhanced settings page for a multi-tenant SaaS platform with 6-layer security architecture. The implementation requires a combination of existing shadcn/ui components and custom components that integrate with the platform's authentication and role-based access control system.

**Key Challenges**:
- No native sidebar component in shadcn/ui registry - requires custom implementation
- Role-based navigation filtering integrated with 6-layer security
- Responsive behavior (collapsible desktop, sheet overlay mobile)
- Avatar fallback chain with Firebase Auth integration
- Design token compliance (zero hardcoded colors)

---

## Component Analysis

### 1. SIDEBAR COMPONENTS

#### 1.1 Sheet (Already Installed)
**Component Name**: `sheet`
**Purpose**: Mobile sidebar overlay implementation
**Usage**: Opens sidebar as slide-from-left overlay on mobile devices (<768px)
**Key Features**:
- Overlay backdrop with click-to-close
- Slide animation from left edge
- Accessibility support (focus trap, ESC to close)
- Portal rendering for z-index management

**Integration Notes**:
- Triggered by hamburger button in mobile header
- Closes on route navigation (Next.js router integration)
- Contains same navigation items as desktop sidebar
- Uses sidebar design tokens for consistent styling

**Implementation Details**:
```tsx
// Mobile Navigation Pattern
<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-[280px] bg-sidebar">
    <AppSidebarNav items={filteredNavItems} />
  </SheetContent>
</Sheet>
```

---

#### 1.2 Button (Already Installed)
**Component Name**: `button`
**Purpose**: Toggle button for sidebar collapse/expand, hamburger menu trigger
**Usage**:
- Desktop: Toggle icon in sidebar header (collapse/expand)
- Mobile: Hamburger menu button in app header
- Edit Profile button in current user card

**Key Features**:
- Multiple variants (ghost, outline, default)
- Size variants (icon, sm, default, lg)
- Hover and focus states
- Loading state support

**Integration Notes**:
- Ghost variant for sidebar toggle (minimal visual weight)
- Icon-only variant for mobile hamburger
- Outline variant for "Edit Profile" action
- Uses CSS variable tokens for all states

---

#### 1.3 Separator (Already Installed)
**Component Name**: `separator`
**Purpose**: Visual dividers in sidebar
**Usage**:
- Between navigation sections
- Above footer promotional content
- Between sidebar header and navigation items

**Key Features**:
- Horizontal and vertical orientation
- Uses --sidebar-border token for color
- Subtle visual break without heavy styling

**Integration Notes**:
```tsx
<Separator className="my-4 bg-sidebar-border" />
```

---

#### 1.4 Custom Component: AppSidebar
**Component Name**: `AppSidebar` (Custom - Not in Registry)
**Purpose**: Main collapsible sidebar container
**Usage**: Root layout component, wraps entire app content

**Key Features**:
- Collapsible state management (expanded/collapsed)
- Desktop: ~280px expanded, ~64px collapsed
- Persistent state (localStorage)
- Smooth width transition animation
- Fixed position on desktop
- Header section with branding + toggle button
- Navigation section with role-filtered items
- Footer section with promotional content

**Structure**:
```
AppSidebar/
├── SidebarHeader
│   ├── Brand Logo + Name
│   └── Collapse Toggle Button
├── Separator
├── SidebarNav
│   └── NavItem[] (filtered by role)
├── Separator
└── SidebarFooter
    └── Promotional Card (placeholder)
```

**State Management**:
```tsx
interface SidebarState {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
}

// Desktop: Toggle collapse state
// Mobile: Toggle sheet open state
```

**Integration Notes**:
- Receives `currentUserRole` from server component (layout.tsx)
- Filters nav items based on role permissions
- Uses usePathname() for active route highlighting
- Persists collapse state to localStorage
- Desktop only - hidden on mobile (<768px)

**Design Token Usage**:
```css
background: bg-sidebar
text: text-sidebar-foreground
border: border-sidebar-border
active-bg: bg-sidebar-primary
active-text: text-sidebar-primary-foreground
hover-bg: bg-sidebar-accent
hover-text: text-sidebar-accent-foreground
```

---

#### 1.5 Custom Component: NavItem
**Component Name**: `NavItem` (Custom - Not in Registry)
**Purpose**: Individual navigation link with icon and label
**Usage**: Sidebar navigation menu items

**Key Features**:
- Active state highlighting (matches current route)
- Hover state with background change
- Icon + label layout (icon only when collapsed)
- Smooth transition animations
- Touch-friendly hit target (44px minimum)
- Next.js Link integration

**Props Interface**:
```typescript
interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}
```

**Layout Patterns**:
```tsx
// Expanded State
<Link href={href}>
  <Icon className="h-5 w-5 flex-shrink-0" />
  <span>{label}</span>
</Link>

// Collapsed State
<Link href={href} title={label}> {/* Tooltip via title */}
  <Icon className="h-5 w-5" />
</Link>
```

**Integration Notes**:
- Uses Next.js Link for client-side routing
- Active state determined by usePathname() comparison
- Role-based filtering happens at parent (AppSidebar) level
- Smooth transition between collapsed/expanded states

---

### 2. SETTINGS PAGE COMPONENTS

#### 2.1 Tabs (Already Installed)
**Component Name**: `tabs`
**Purpose**: Settings page section navigation
**Usage**: Three tabs: "AI Configuration" | "User Permissions" | "Notifications"

**Key Features**:
- Horizontal tab list
- Active indicator (underline or background)
- Keyboard navigation (arrow keys)
- Content panel switching
- ARIA accessibility

**Implementation Pattern**:
```tsx
<Tabs defaultValue="user-permissions">
  <TabsList>
    <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
    <TabsTrigger value="user-permissions">User Permissions</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>

  <TabsContent value="ai-config">
    <ComingSoonPlaceholder module="AI Configuration" />
  </TabsContent>

  <TabsContent value="user-permissions">
    <UserPermissionsContent />
  </TabsContent>

  <TabsContent value="notifications">
    <ComingSoonPlaceholder module="Notifications" />
  </TabsContent>
</Tabs>
```

**Integration Notes**:
- Default active: "User Permissions" tab
- Other tabs show "Coming Soon" placeholder
- Tab content rendered conditionally (unmounts inactive tabs)
- Uses primary color tokens for active state

---

#### 2.2 Toggle Group (Already Installed)
**Component Name**: `toggle-group`
**Purpose**: Users/Roles view switcher
**Usage**: Toggle between "Users" table view and "Roles" management view

**Key Features**:
- Single selection mode
- Icon + label layout
- Pressed state styling
- Accessible toggle group (ARIA)
- Keyboard navigation

**Implementation Pattern**:
```tsx
<ToggleGroup type="single" value={view} onValueChange={setView}>
  <ToggleGroupItem value="users" aria-label="Users view">
    <Users className="h-4 w-4" />
    <span className="ml-2">Users</span>
  </ToggleGroupItem>
  <ToggleGroupItem value="roles" aria-label="Roles view">
    <Shield className="h-4 w-4" />
    <span className="ml-2">Roles</span>
  </ToggleGroupItem>
</ToggleGroup>
```

**Integration Notes**:
- Default: "Users" view active
- Positioned in section header (right side, aligned with "Profile and members" title)
- "Roles" view is placeholder (future enhancement)
- State managed in parent component (Settings page)

---

#### 2.3 Card (Already Installed)
**Component Name**: `card`
**Purpose**: Current user profile card, promotional footer card
**Usage**:
- Featured card showing logged-in user info
- Sidebar footer promotional content
- "Coming Soon" placeholder cards

**Key Features**:
- White background, subtle border, shadow
- CardHeader, CardContent, CardFooter sections
- Responsive padding
- Hover effects (optional)

**Integration Notes**:
- Profile card layout: Avatar (left) + Name/Role (center) + Button (right)
- Uses existing Avatar component (already installed)
- Uses existing Badge component for role display
- Footer card contains placeholder promotional content

**Current User Profile Card Structure**:
```tsx
<Card>
  <CardContent className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        <AvatarImage src={session.user.photoURL} />
        <AvatarFallback>
          {getInitials(session.user.display_name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{session.user.display_name}</p>
        <RoleBadge role={session.role} />
      </div>
    </div>
    <Button variant="outline" size="sm">
      Edit Profile
    </Button>
  </CardContent>
</Card>
```

---

#### 2.4 Avatar (Already Installed)
**Component Name**: `avatar`
**Purpose**: User profile pictures with fallback chain
**Usage**:
- Current user profile card (lg: 48px)
- User table leftmost column (sm: 32px)
- Future user mentions, comments, activity logs

**Key Features**:
- Image loading with fallback
- Circular shape
- Size variants (sm, md, lg)
- AvatarImage + AvatarFallback pattern

**Fallback Chain Implementation**:
1. **Primary**: `user.photoURL` (from Firebase Auth or Firestore)
2. **Secondary**: Initials from `display_name` or `email`
3. **Tertiary**: Default UserIcon from Lucide React

**Size Variants**:
- `sm`: 32px (table rows)
- `md`: 40px (default, general use)
- `lg`: 48px (profile card, prominent display)

**Integration Pattern**:
```tsx
function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  return (
    <Avatar size={size}>
      <AvatarImage src={user.photoURL || undefined} alt={user.display_name} />
      <AvatarFallback className="bg-muted text-muted-foreground">
        {getInitials(user.display_name) || getInitials(user.email) || (
          <UserIcon className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

function getInitials(name?: string): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

**Integration Notes**:
- Wrap in custom `UserAvatar` component for reusability
- Fallback styling uses --muted and --muted-foreground tokens
- Circular shape with 2px border (--border token)
- Lazy loading for images (built into Avatar component)

---

#### 2.5 Badge (Already Installed)
**Component Name**: `badge`
**Purpose**: Display user roles, status indicators
**Usage**:
- User role display in profile card
- User role display in table
- Status badges (pending, active, suspended)

**Key Features**:
- Multiple variants (default, secondary, destructive, outline)
- Size variants
- Color coding via design tokens

**Integration Notes**:
- Existing `RoleBadge` component already handles role display
- Uses color coding for different roles:
  - Owner: primary variant
  - Admin: secondary variant
  - Member, Guest, Viewer: outline variant
- No changes needed to existing badge implementation

---

#### 2.6 Table (Already Installed)
**Component Name**: `table`
**Purpose**: Display user list with enhanced avatar column
**Usage**: Settings > User Permissions tab

**Key Features**:
- Responsive table layout
- Sortable columns
- Fixed header with scrollable body
- Hover states for rows

**Enhancement Required**:
- ADD new leftmost column: User Avatar (32px)
- KEEP existing columns: Name, Email, Role, Actions
- Update UserTable component to include avatar

**Updated Column Structure**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-12"></TableHead> {/* Avatar column */}
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>
          <UserAvatar user={user} size="sm" />
        </TableCell>
        <TableCell>{user.display_name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell><RoleBadge role={user.role} /></TableCell>
        <TableCell className="text-right">
          <UserActionsMenu user={user} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Integration Notes**:
- Reuse existing UserTable component, add avatar column
- Avatar column: Fixed width (48px), no header label
- Maintain existing functionality: role dropdown, actions menu, invitation status
- Responsive: hide avatar column on small screens (<640px)

---

#### 2.7 Select (Already Installed)
**Component Name**: `select`
**Purpose**: Role dropdown in user table
**Usage**: Change user role (already implemented in UserTable)

**Key Features**:
- Dropdown with search/filter
- Keyboard navigation
- Custom trigger styling
- Option grouping

**Integration Notes**:
- Already implemented in existing UserTable
- No changes needed
- Integrated with Cloud Functions for role updates

---

#### 2.8 Dropdown Menu (Already Installed)
**Component Name**: `dropdown-menu`
**Purpose**: User actions menu (edit, delete, copy invite, revoke)
**Usage**: Actions column in user table (already implemented)

**Key Features**:
- Contextual menu with icon buttons
- Keyboard navigation
- Separators between action groups
- Destructive action styling

**Integration Notes**:
- Already implemented in UserActionsMenu component
- No changes needed
- Integrated with server actions and Cloud Functions

---

### 3. CUSTOM COMPONENTS NEEDED

#### 3.1 UserAvatar Component
**Component Name**: `UserAvatar` (Custom - Wraps Avatar)
**Purpose**: Reusable avatar with Firebase Auth integration
**Props Interface**:
```typescript
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

**Features**:
- Three-tier fallback chain
- Size variant support
- Design token styling
- TypeScript strict mode compliance

**File Location**: `src/components/users/UserAvatar.tsx`

---

#### 3.2 ComingSoonPlaceholder Component
**Component Name**: `ComingSoonPlaceholder` (Custom)
**Purpose**: Placeholder for unimplemented tabs and routes
**Props Interface**:
```typescript
interface ComingSoonPlaceholderProps {
  module: string;
  description?: string;
}
```

**Features**:
- Card-based layout
- Icon display (optional)
- Module name heading
- Optional description text
- Consistent styling with app theme

**Usage**:
- AI Configuration tab content
- Notifications tab content
- Roles view placeholder
- Future module placeholder pages (/engagement, /analytics, /retention)

**Implementation**:
```tsx
export function ComingSoonPlaceholder({
  module,
  description = "This feature is coming soon."
}: ComingSoonPlaceholderProps) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{module}</h3>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
      </div>
    </Card>
  );
}
```

**File Location**: `src/components/ui/ComingSoonPlaceholder.tsx`

---

### 4. ICON LIBRARY

**Library**: Lucide React (already installed)
**Purpose**: Consistent icon system across UI

**Required Icons**:
- `LayoutDashboard` - Dashboard nav item
- `Users` - Engagement nav item, Users toggle
- `TrendingUp` - Predictive Analytics nav item
- `Target` - Retention Strategies nav item
- `Settings` - Settings nav item
- `Menu` - Mobile hamburger button
- `ChevronLeft` - Sidebar collapse button (expanded state)
- `ChevronRight` - Sidebar expand button (collapsed state)
- `UserIcon` - Avatar fallback
- `Shield` - Roles toggle
- `Sparkles` - Coming soon placeholder
- `X` - Close mobile menu

**Integration Notes**:
- All icons use consistent size: `h-5 w-5` for nav items, `h-4 w-4` for inline icons
- Color inherits from parent text color (design tokens)
- Import directly from `lucide-react` package

---

## Component Hierarchy

### Desktop Layout (≥768px)
```
RootLayout
├── AppSidebar (fixed left, collapsible)
│   ├── SidebarHeader
│   │   ├── Brand (logo + name / logo only)
│   │   └── Button (collapse toggle)
│   ├── Separator
│   ├── SidebarNav
│   │   └── NavItem[] (filtered by role)
│   ├── Separator
│   └── SidebarFooter
│       └── Card (promotional placeholder)
└── main (content area)
    └── {children}
```

### Mobile Layout (<768px)
```
RootLayout
├── header (fixed top)
│   └── Button (hamburger menu)
└── Sheet (mobile menu)
    ├── SheetTrigger (hamburger button)
    └── SheetContent
        └── SidebarNav (same nav items as desktop)
└── main (content area, full width)
    └── {children}
```

### Settings Page Hierarchy
```
SettingsPage (Server Component)
├── getCurrentSession() → session
└── SettingsPageClient
    ├── Tabs
    │   ├── TabsList
    │   │   ├── TabsTrigger ("AI Configuration")
    │   │   ├── TabsTrigger ("User Permissions" - default)
    │   │   └── TabsTrigger ("Notifications")
    │   ├── TabsContent (ai-config)
    │   │   └── ComingSoonPlaceholder
    │   ├── TabsContent (user-permissions)
    │   │   ├── Section Header
    │   │   │   ├── h3 + description (left)
    │   │   │   └── ToggleGroup (Users/Roles - right)
    │   │   ├── Card (Current User Profile)
    │   │   │   ├── UserAvatar (lg)
    │   │   │   ├── Name + RoleBadge
    │   │   │   └── Button ("Edit Profile")
    │   │   └── UserTable (enhanced with avatar column)
    │   │       ├── Column: Avatar (UserAvatar sm)
    │   │       ├── Column: Name
    │   │       ├── Column: Email
    │   │       ├── Column: Role (Select dropdown)
    │   │       └── Column: Actions (DropdownMenu)
    │   └── TabsContent (notifications)
    │       └── ComingSoonPlaceholder
```

---

## Data Flow Patterns

### 1. Sidebar Navigation Flow
```
RootLayout (Server Component)
  ↓ getCurrentSession()
  ↓ session { user_id, tenant_id, role, user: { display_name, email } }
  ↓ Pass role to client component
AppSidebar (Client Component)
  ↓ Filter nav items by role
  ↓ usePathname() for active state
  ↓ localStorage for collapse state
NavItem[] (rendered with filtered items)
  ↓ Next.js Link for routing
  ↓ Active state highlighting
User clicks → Client-side navigation
```

### 2. User Table Enhancement Flow
```
SettingsPage (Server Component)
  ↓ getCurrentSession()
  ↓ TenantFirestore.query('users')
  ↓ users[] with Firebase Auth data
UserTable (Client Component)
  ↓ Map users to table rows
  ↓ For each user:
UserAvatar (fallback chain)
  ↓ 1. Try user.photoURL
  ↓ 2. Try getInitials(display_name)
  ↓ 3. Try getInitials(email)
  ↓ 4. Show UserIcon
Avatar rendered with appropriate fallback
```

### 3. Role-Based Navigation Filtering
```typescript
// Navigation configuration with role requirements
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['owner', 'admin', 'member', 'guest', 'viewer'] },
  { href: '/engagement', icon: Users, label: 'Engagement', roles: ['owner', 'admin', 'member'] },
  { href: '/analytics', icon: TrendingUp, label: 'Predictive Analytics', roles: ['owner', 'admin'] },
  { href: '/retention', icon: Target, label: 'Retention Strategies', roles: ['owner', 'admin'] },
  { href: '/users', icon: Settings, label: 'Settings', roles: ['owner', 'admin'] },
];

// Filter by current user role
const filteredNavItems = NAV_ITEMS.filter(item =>
  item.roles.includes(currentUserRole)
);
```

---

## Security Integration (6-Layer Architecture)

### Layer 1: Edge Middleware
- **Already Implemented**: JWT verification in middleware.ts
- **No Changes Needed**: Navigation is read-only, middleware handles route protection
- **Behavior**: Redirects unauthenticated users to /login before page load

### Layer 2: Data Access Layer (DAL)
- **Implementation**: Call `getCurrentSession()` in all server components
- **Navigation**: RootLayout fetches session for role-based filtering
- **Settings Page**: Fetches session + queries users via TenantFirestore

```typescript
// Example: RootLayout server component
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <AppSidebar currentUserRole={session.role} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Layer 3: Client Validation
- **Scope**: No forms in sidebar (navigation only)
- **Settings Page**: Existing validation in UserTable (role changes, invitations)
- **No New Validation Needed**: UI is read-only navigation

### Layer 4: Cloud Functions
- **No New Functions**: Navigation doesn't require privileged operations
- **Existing Functions**: UserTable already integrates with inviteUser, onUserCreate

### Layer 5: Firestore Security Rules
- **No New Collections**: Navigation uses existing users, tenants collections
- **Existing Rules**: Already enforce tenant isolation and role-based access

### Layer 6: TenantFirestore Wrapper
- **Settings Page**: Use TenantFirestore to query users collection
- **Auto tenant_id Injection**: Ensures cross-tenant data isolation

```typescript
// Example: Settings page data fetching
const session = await getCurrentSession();
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
const users = await tenantDB.query('users', [
  { field: 'status', op: '!=', value: 'deleted' }
]);
```

---

## Design Token Requirements

**ZERO hardcoded colors allowed** - all styling MUST use CSS variables from globals.css.

### Sidebar Tokens (Already Defined)
```css
/* Light Mode */
--sidebar: oklch(0.985 0 0)                    /* Off-white background */
--sidebar-foreground: oklch(0.145 0 0)         /* Dark gray text */
--sidebar-primary: oklch(0.205 0 0)            /* Active item: dark */
--sidebar-primary-foreground: oklch(0.985 0 0) /* Active text: light */
--sidebar-accent: oklch(0.97 0 0)              /* Hover: light gray */
--sidebar-accent-foreground: oklch(0.205 0 0)  /* Hover text: dark */
--sidebar-border: oklch(0.922 0 0)             /* Light gray borders */
--sidebar-ring: oklch(0.708 0 0)               /* Focus ring: medium gray */

/* Dark Mode */
--sidebar: oklch(0.205 0 0)                    /* Dark background */
--sidebar-foreground: oklch(0.985 0 0)         /* Light text */
--sidebar-primary: oklch(0.488 0.243 264.376)  /* Active: purple accent */
--sidebar-primary-foreground: oklch(0.985 0 0) /* Active text: light */
--sidebar-accent: oklch(0.269 0 0)             /* Hover: lighter dark */
--sidebar-accent-foreground: oklch(0.985 0 0)  /* Hover text: light */
--sidebar-border: oklch(1 0 0 / 10%)           /* Subtle borders */
--sidebar-ring: oklch(0.556 0 0)               /* Focus ring: medium */
```

### Usage Examples
```tsx
// Sidebar container
<aside className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

// Active navigation item
<Link className="bg-sidebar-primary text-sidebar-primary-foreground">

// Hover state (use group hover pattern)
<Link className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">

// Focus state
<Link className="focus-visible:ring-2 focus-visible:ring-sidebar-ring">
```

### Other Design Tokens
```css
--primary              /* Primary brand color */
--primary-foreground   /* Text on primary background */
--card                 /* Card backgrounds */
--card-foreground      /* Text on cards */
--muted                /* Subtle backgrounds */
--muted-foreground     /* Subtle text */
--border               /* General borders */
--ring                 /* General focus rings */
```

**Critical Rule**: Never use Tailwind color classes like `bg-blue-500`, `text-gray-700`, etc. Always use design token classes like `bg-primary`, `text-muted-foreground`.

---

## TypeScript Requirements

### New Type Definitions

**File**: `src/types/navigation.ts`
```typescript
import { LucideIcon } from 'lucide-react';
import { UserRole } from './roles';

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

**File**: `src/types/user.ts` (enhance existing)
```typescript
// Add to existing User type
export interface User {
  // ... existing fields
  photoURL?: string | null; // Firebase Auth photo URL
}
```

### Component Props Interfaces
- Export all component props interfaces from component files
- Use `React.FC<PropsInterface>` pattern or explicit typing
- No `any` types allowed
- Full TypeScript strict mode compliance

---

## Responsive Strategy

### Breakpoint: 768px (md)

**Desktop (≥768px)**:
- Sidebar visible, fixed left
- Width: 280px expanded, 64px collapsed
- Toggle button in sidebar header
- Content area: `margin-left: 280px` (expanded) or `margin-left: 64px` (collapsed)
- Smooth transition on width change (0.3s ease)

**Mobile (<768px)**:
- Sidebar hidden by default
- Hamburger button in app header (fixed top)
- Sheet overlay slides from left (280px width)
- Content area: full width
- Sheet closes on route navigation or backdrop click

### Touch Targets
- Minimum touch target: 44x44px (WCAG AAA compliance)
- Navigation items: 48px height (exceeds minimum)
- Buttons: Use size="icon" for 40x40px minimum

### Responsive Utilities
```tsx
// Hide sidebar on mobile, show on desktop
<aside className="hidden md:flex">

// Show hamburger on mobile, hide on desktop
<Button className="md:hidden">

// Adjust padding for mobile
<div className="px-4 md:px-6">
```

---

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order follows logical flow
- Focus indicators visible (ring-2 ring-ring)
- ESC to close mobile menu
- Arrow keys for tab navigation

### Screen Reader Support
- Semantic HTML elements (nav, aside, main, button)
- aria-label for icon-only buttons
- aria-current="page" for active nav items
- Title attribute for collapsed nav items (tooltip)
- Sheet has focus trap and ARIA dialog semantics

### Color Contrast
- All text meets 4.5:1 contrast ratio
- Design tokens ensure sufficient contrast
- Active/hover states have clear visual indication
- Focus indicators highly visible

### Example ARIA Usage
```tsx
// Active navigation item
<Link
  href="/dashboard"
  aria-current={isActive ? 'page' : undefined}
  aria-label="Dashboard"
>

// Collapsed sidebar item (tooltip)
<Link href="/dashboard" title="Dashboard" aria-label="Dashboard">

// Mobile hamburger button
<Button
  variant="ghost"
  size="icon"
  aria-label="Open navigation menu"
  aria-expanded={isMobileMenuOpen}
>
```

---

## Implementation Order Recommendation

### Phase 1: Core Sidebar (Day 1-2)
1. Create `src/types/navigation.ts` with interfaces
2. Implement `AppSidebar` custom component
3. Implement `NavItem` custom component
4. Integrate with RootLayout (pass currentUserRole from session)
5. Test role-based filtering
6. Test collapse/expand functionality
7. Persist collapse state to localStorage

### Phase 2: Mobile Navigation (Day 2-3)
1. Add Sheet component for mobile menu
2. Create hamburger button in app header
3. Implement close-on-navigation behavior
4. Test responsive breakpoint transitions
5. Test touch interactions

### Phase 3: Settings Page Enhancements (Day 3-4)
1. Create `UserAvatar` component with fallback chain
2. Create `ComingSoonPlaceholder` component
3. Add Tabs to settings page
4. Add ToggleGroup for Users/Roles switcher
5. Add Current User Profile Card
6. Enhance UserTable with avatar column
7. Test with Firebase Auth photoURL data

### Phase 4: Placeholder Routes (Day 4-5)
1. Create `/engagement` placeholder page
2. Create `/analytics` placeholder page
3. Create `/retention` placeholder page
4. Test navigation to all routes
5. Test role-based access (viewer shouldn't see analytics link)

### Phase 5: Polish & Testing (Day 5-6)
1. Verify all design tokens used (no hardcoded colors)
2. Test dark mode compatibility
3. Test keyboard navigation
4. Test screen reader support
5. Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
6. Performance audit (Lighthouse)

---

## Testing Checklist

### Functional Testing
- [ ] Sidebar toggles between collapsed/expanded states
- [ ] Collapse state persists after page refresh (localStorage)
- [ ] Active route highlighted correctly on all pages
- [ ] Mobile hamburger opens/closes sheet overlay
- [ ] Sheet closes when navigating to new route
- [ ] Sheet closes when clicking backdrop
- [ ] Role-based filtering: owner sees all nav items
- [ ] Role-based filtering: viewer sees only Dashboard
- [ ] Role-based filtering: admin sees Dashboard, Engagement, Analytics, Settings
- [ ] Avatar fallback chain: photoURL → initials → icon
- [ ] Tabs switch content correctly
- [ ] ToggleGroup changes view between Users/Roles
- [ ] Edit Profile button is clickable (UI only, no action yet)

### Responsive Testing
- [ ] Desktop (≥1024px): Sidebar expanded by default
- [ ] Tablet (768-1023px): Sidebar collapsed by default
- [ ] Mobile (<768px): Sidebar hidden, hamburger visible
- [ ] Content area adjusts width when sidebar state changes
- [ ] No horizontal scroll on any device size

### Accessibility Testing
- [ ] All nav items keyboard accessible (Tab navigation)
- [ ] Active nav item has aria-current="page"
- [ ] Collapsed nav items have title attribute (tooltip)
- [ ] Mobile menu has focus trap (ESC closes)
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces "Navigation menu" for sidebar
- [ ] Screen reader announces active page
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)

### Security Testing
- [ ] Non-authenticated users redirected to /login (middleware)
- [ ] Role-based nav filtering matches server-side permissions
- [ ] Cannot manually navigate to hidden routes (middleware catches)
- [ ] getCurrentSession() called in all server components
- [ ] User data queries use TenantFirestore wrapper
- [ ] No console errors about missing session/tenant_id

### Design Token Compliance
- [ ] Zero hardcoded Tailwind colors (grep codebase for `bg-blue`, `text-gray`, etc.)
- [ ] All sidebar styling uses --sidebar-* tokens
- [ ] All card styling uses --card-* tokens
- [ ] All border styling uses --border token
- [ ] Dark mode works correctly (all tokens have dark variants)

---

## Risk Assessment

### High Risk Items
1. **No native shadcn sidebar component** - Requires custom implementation
   - Mitigation: Use shadcn patterns (Sheet, Button, Separator) for consistency
   - Estimated effort: 8-12 hours

2. **Role-based filtering complexity** - Filtering must match server-side permissions
   - Mitigation: Share role configuration between client nav and middleware
   - Test thoroughly with all 5 roles

3. **Avatar fallback chain** - Multiple fallback sources (Firebase Auth, initials, icon)
   - Mitigation: Unit test all fallback scenarios
   - Handle null/undefined gracefully

### Medium Risk Items
1. **Mobile navigation UX** - Sheet behavior on route change
   - Mitigation: Use Next.js router events to close Sheet
   - Test on real mobile devices (not just DevTools)

2. **Collapse state persistence** - localStorage across browser sessions
   - Mitigation: Handle SSR carefully (localStorage not available server-side)
   - Use useEffect to read state after hydration

3. **Design token compliance** - Easy to accidentally use hardcoded colors
   - Mitigation: ESLint rule to catch Tailwind color classes
   - Code review checklist

### Low Risk Items
1. **Tabs implementation** - Straightforward shadcn component
2. **ToggleGroup implementation** - Straightforward shadcn component
3. **Placeholder routes** - Simple server components, no data fetching

---

## Performance Considerations

### Bundle Size
- Icons: Use Lucide React tree-shaking (import individual icons)
- Sidebar state: Use native useState, not external state library
- Sheet: Already optimized in shadcn implementation

### Rendering Performance
- Navigation items: Small array (<10 items), no virtualization needed
- User table: Existing implementation, no changes to rendering strategy
- Avatar images: Use Next.js Image component for optimization (future enhancement)

### Accessibility Performance
- Focus management: Sheet component handles focus trap efficiently
- ARIA updates: Minimal DOM updates on state change

---

## Documentation Requirements

### Developer Documentation
1. **README**: Add section on sidebar navigation architecture
2. **Architecture Docs**: Update with navigation flow diagrams
3. **Component Docs**: Document AppSidebar, NavItem, UserAvatar props and usage
4. **Security Docs**: Explain role-based navigation filtering

### Code Comments
- NavItem: Document role filtering logic
- UserAvatar: Document fallback chain priority
- AppSidebar: Document collapse state management

### Storybook (Future Enhancement)
- Create stories for AppSidebar (collapsed/expanded states)
- Create stories for NavItem (active/inactive/hover states)
- Create stories for UserAvatar (all fallback scenarios)

---

## Conclusion

This implementation requires:
- **3 existing shadcn components**: Sheet, Tabs, ToggleGroup (already installed)
- **7 existing shadcn components**: Avatar, Badge, Button, Card, Dropdown Menu, Select, Table, Separator (already installed)
- **3 custom components**: AppSidebar, NavItem, UserAvatar
- **1 utility component**: ComingSoonPlaceholder
- **1 new type definition file**: src/types/navigation.ts

**Total Estimated Effort**: 5-6 days for complete implementation and testing

**Critical Success Factors**:
1. Role-based filtering matches server-side permissions
2. Design token compliance (zero hardcoded colors)
3. Responsive behavior works on all device sizes
4. Accessibility standards met (WCAG 2.1 AA)
5. Integration with existing 6-layer security architecture

**Next Steps**:
1. Review this requirements analysis with team
2. Proceed to Phase 2: Component Research (shadcn-component-researcher)
3. Research AppSidebar, NavItem, UserAvatar implementation patterns
4. Identify any additional dependencies or conflicts
