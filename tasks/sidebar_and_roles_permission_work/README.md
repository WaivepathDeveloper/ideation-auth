# Sidebar & User Permissions UI - Implementation Guide

## Quick Start (For New Developers)

### Context
This work implements the foundational UI architecture for the multi-tenant SaaS platform, including app-wide collapsible sidebar navigation and enhanced user permissions interface.

### Reference
See [`reference/users-reference.webp`](./reference/users-reference.webp) for the target UI design.

### What's Being Built
- [ ] Collapsible app sidebar with navigation (expand/collapse, NOT fixed width)
- [ ] Settings page with tabs (AI Configuration, User Permissions, Notifications)
- [ ] User table with avatars
- [ ] Users/Roles toggle
- [ ] Current user profile card (UI only, no edit functionality yet)
- [ ] Placeholder routes (engagement, analytics, retention)

### Key Files to be Created/Modified
- `src/app/(protected)/layout.tsx` - Add sidebar integration
- `src/components/layout/AppSidebar.tsx` - NEW: Main collapsible navigation
- `src/components/settings/SettingsTabs.tsx` - NEW: Tab navigation
- `src/components/users/ViewToggle.tsx` - NEW: Users/Roles switcher
- `src/components/users/UserAvatar.tsx` - NEW: Avatar with fallback
- `src/components/users/CurrentUserProfile.tsx` - NEW: Profile card (UI only)
- `src/components/users/UserTable.tsx` - ENHANCE: Add avatar column
- `src/types/navigation.ts` - NEW: Navigation type definitions
- `src/app/(protected)/engagement/page.tsx` - NEW: Placeholder route
- `src/app/(protected)/analytics/page.tsx` - NEW: Placeholder route
- `src/app/(protected)/retention/page.tsx` - NEW: Placeholder route

See [technical-specs/file-structure.md](./technical-specs/file-structure.md) for complete file tree.

### Running Locally
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start Next.js dev server
npm run dev

# Visit http://localhost:3000/users
```

### Architecture Notes
- **Shadcn UI Components**: avatar, tabs, toggle-group, sheet
- **Security**: 6-layer architecture (Middleware, DAL, Validation, Functions, Rules, TenantFirestore)
- **Design Tokens**: 100% CSS variable usage (see [technical-specs/design-tokens-mapping.md](./technical-specs/design-tokens-mapping.md))
- **Role-Based Access**: Navigation filtered by user role (owner, admin, member, guest, viewer)
- **Responsive**: Desktop collapsible sidebar + Mobile hamburger menu (Sheet component)

### Shadcn Agent Pipeline
This implementation uses the Shadcn agent workflow:
1. **shadcn-requirements-analyzer** → [agent-findings/01-requirements-analysis.md](./agent-findings/01-requirements-analysis.md)
2. **shadcn-component-researcher** → [agent-findings/02-component-research.md](./agent-findings/02-component-research.md)
3. **shadcn-implementation-builder** → [agent-findings/03-implementation-notes.md](./agent-findings/03-implementation-notes.md)
4. **frontend-security-enforcer** → [agent-findings/04-security-review.md](./agent-findings/04-security-review.md)

### Task Tracking
See [TASKS.md](./TASKS.md) for detailed task breakdown and status tracking.

### Complete Implementation Plan
See [PLAN.md](./PLAN.md) for the full implementation plan with technical specifications.

### Next Steps (After Foundation)
1. Implement profile editing modal with Zod validation
2. Build Roles management CRUD interface
3. Add content to Settings tabs (AI Configuration, Notifications)
4. Integrate avatar upload with Firebase Storage
5. Build out Dashboard, Engagement, Analytics, Retention modules

---

## Component Overview

### AppSidebar
**Location**: `src/components/layout/AppSidebar.tsx`
**Purpose**: Collapsible app-wide navigation
**Features**:
- Expand/collapse toggle button
- Desktop: Collapsible sidebar (not fixed width)
- Mobile: Hamburger menu → Sheet overlay
- Role-based menu filtering
- Active route highlighting
- Footer section (promotional content placeholder)

### SettingsTabs
**Location**: `src/components/settings/SettingsTabs.tsx`
**Purpose**: Tab navigation for Settings section
**Tabs**:
- AI Configuration (placeholder)
- User Permissions (active, has content)
- Notifications (placeholder)

### ViewToggle
**Location**: `src/components/users/ViewToggle.tsx`
**Purpose**: Switch between Users and Roles views
**States**: Users (active) | Roles (placeholder)

### UserAvatar
**Location**: `src/components/users/UserAvatar.tsx`
**Purpose**: User profile image with intelligent fallback
**Fallback Chain**:
1. user.photoURL (from Firebase Auth)
2. Initials from display_name or email
3. Default UserIcon

### CurrentUserProfile
**Location**: `src/components/users/CurrentUserProfile.tsx`
**Purpose**: Featured current user profile card
**Features**:
- Avatar + display_name + role badge
- "Edit Profile" button (UI only, no functionality yet)

---

## Security Checklist

### Layer 1: Edge Middleware ✅
- Already in place ([src/middleware.ts](../../src/middleware.ts))
- JWT verification before protected routes

### Layer 2: Data Access Layer ✅
- Use `getCurrentSession()` in all server components
- Pass session data to client components as props

### Layer 3: Client Validation ✅
- No forms in sidebar (navigation only)
- Existing validation patterns maintained

### Layer 4: Cloud Functions ✅
- No new privileged operations (navigation is read-only)

### Layer 5: Firestore Rules ✅
- No new collections (existing rules apply)

### Layer 6: TenantFirestore Wrapper ✅
- All data operations use TenantFirestore
- No new database queries in sidebar

See [technical-specs/security-checklist.md](./technical-specs/security-checklist.md) for detailed verification.

---

## Design Token Compliance

### Sidebar Tokens (Already Defined in globals.css)
```css
--sidebar: oklch(0.985 0 0)                    /* Light background */
--sidebar-foreground: oklch(0.145 0 0)         /* Dark text */
--sidebar-primary: oklch(0.205 0 0)            /* Active item bg */
--sidebar-primary-foreground: oklch(0.985 0 0) /* Active item text */
--sidebar-accent: oklch(0.97 0 0)              /* Hover bg */
--sidebar-accent-foreground: oklch(0.205 0 0)  /* Hover text */
--sidebar-border: oklch(0.922 0 0)             /* Dividers */
--sidebar-ring: oklch(0.708 0 0)               /* Focus ring */
```

### ✅ Correct Usage
```tsx
<nav className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
```

### ❌ Never Do This
```tsx
<nav className="bg-white border-gray-200">  {/* Hardcoded colors */}
```

See [technical-specs/design-tokens-mapping.md](./technical-specs/design-tokens-mapping.md) for complete token reference.

---

## Troubleshooting

### Issue: Sidebar not showing
**Check**: Is (protected)/layout.tsx updated with AppSidebar component?

### Issue: Mobile sidebar not working
**Check**: Is Sheet component installed? (`npx shadcn-ui@latest add sheet`)

### Issue: Navigation not filtering by role
**Check**: Is currentUserRole prop being passed from server component?

### Issue: Colors look wrong
**Check**: Are you using design tokens (bg-sidebar) or hardcoded colors (bg-white)?

### Issue: Avatar not showing
**Check**: Does user object have photoURL, display_name, or email property?

---

## Questions?

Refer to:
- [PLAN.md](./PLAN.md) - Complete implementation plan
- [TASKS.md](./TASKS.md) - Task tracking with status
- [agent-findings/](./agent-findings/) - Agent outputs for implementation details
- [technical-specs/](./technical-specs/) - Component APIs, token mapping, security checklist
