# Role-Based UI Components

## Overview

This directory contains role-based access control (RBAC) UI components for the multi-tenant SaaS application.

## Components

### RoleBadge

Displays a user's role with color-coded styling and icons.

**Import:**
```typescript
import { RoleBadge } from '@/components/users/RoleBadge';
```

**Usage:**
```typescript
// Basic usage
<RoleBadge role="admin" />

// Different sizes
<RoleBadge role="owner" size="sm" />
<RoleBadge role="member" size="lg" />

// Without icon
<RoleBadge role="guest" showIcon={false} />

// With custom styling
<RoleBadge role="viewer" className="ml-2" />
```

**Role Color Mapping:**
- `owner` → Primary (purple/blue)
- `admin` → Secondary (blue)
- `member` → Success (green)
- `guest` → Warning (yellow)
- `viewer` → Muted (gray)

**Accessibility:**
- Uses `role="status"` for screen reader announcements
- Includes `aria-label` with full role description
- Icons have `aria-hidden="true"` to avoid redundant announcements

---

### RoleGuard (in auth directory)

Server Component that enforces role-based access control.

**Import:**
```typescript
import { RoleGuard } from '@/components/auth/RoleGuard';
```

**Usage:**
```typescript
// Redirect unauthorized users
<RoleGuard allowedRoles={['owner', 'admin']} redirectTo="/unauthorized">
  <AdminPanel />
</RoleGuard>

// Show fallback for unauthorized users
<RoleGuard
  allowedRoles={['owner']}
  fallback={<p>Only owners can access billing settings.</p>}
>
  <BillingSettings />
</RoleGuard>

// Multiple roles
<RoleGuard allowedRoles={['owner', 'admin', 'member']}>
  <TeamDashboard />
</RoleGuard>
```

**Security Features:**
- Server-side session verification (no client-side bypass)
- Validates role from middleware-injected headers via DAL
- Type-safe role checking
- Supports redirect or fallback for unauthorized access

**Role Hierarchy:**
1. `owner` (highest privilege)
2. `admin`
3. `member`
4. `guest`
5. `viewer` (lowest privilege)

---

## Example: User List with Role Badges

```typescript
// app/(protected)/users/page.tsx
import { getCurrentSession } from '@/lib/dal';
import { TenantFirestore } from '@/lib/TenantFirestore';
import { RoleBadge } from '@/components/users/RoleBadge';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default async function UsersPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id);
  const users = await tenantDB.query('users', []);

  return (
    <RoleGuard allowedRoles={['owner', 'admin']} redirectTo="/unauthorized">
      <div>
        <h1>Team Members</h1>
        <ul>
          {users.map((user) => (
            <li key={user.uid}>
              <span>{user.email}</span>
              <RoleBadge role={user.role} size="sm" />
            </li>
          ))}
        </ul>
      </div>
    </RoleGuard>
  );
}
```

---

## Example: Conditional UI Based on Role

```typescript
// Show different content based on user role
import { getCurrentSession } from '@/lib/dal';
import { RoleBadge } from '@/components/users/RoleBadge';

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <header>
        <h1>Dashboard</h1>
        <RoleBadge role={session.role as any} />
      </header>

      {/* Owner-only section */}
      <RoleGuard allowedRoles={['owner']}>
        <BillingSection />
      </RoleGuard>

      {/* Owner and Admin section */}
      <RoleGuard allowedRoles={['owner', 'admin']}>
        <UserManagementSection />
      </RoleGuard>

      {/* Everyone can see this */}
      <TeamActivitySection />
    </div>
  );
}
```

---

## Styling

All styles use CSS variables from `src/styles/globals.css` to ensure:
- Consistent theming across the application
- Easy rebranding (change one CSS variable)
- Dark mode support automatically

**Badge CSS Classes:**
- `.badge-owner` - Primary color
- `.badge-admin` - Secondary color
- `.badge-member` - Success color
- `.badge-guest` - Warning color
- `.badge-viewer` - Muted color
- `.badge-size-sm` - Small size
- `.badge-size-md` - Medium size (default)
- `.badge-size-lg` - Large size
- `.badge-icon` - Icon styling

---

## Security Considerations

1. **RoleGuard is Server-Side Only:**
   - Uses `getCurrentSession()` from DAL
   - Validates role from middleware headers
   - Cannot be bypassed by client-side manipulation

2. **RoleBadge is Presentation Only:**
   - Does NOT enforce access control
   - Only displays the role visually
   - Always pair with RoleGuard for security

3. **Role Mapping:**
   - Legacy `tenant_admin` → `owner`
   - Legacy `user` → `member`
   - Ensures backward compatibility with existing system

---

## TypeScript Types

```typescript
export type UserRole = 'owner' | 'admin' | 'member' | 'guest' | 'viewer';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}
```
