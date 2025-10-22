# Shadcn UI Development Workflow

## Overview

This guide provides a concise workflow for using the 4 shadcn agents with this project's patterns: TenantFirestore, 6-layer security architecture, and design token system.

---

## Quick Decision Tree

| Your Task | Agent(s) to Use | Pattern |
|-----------|----------------|---------|
| Complex multi-component feature | Analyzer → Researcher → Builder | Full Pipeline |
| Single component (e.g., button) | Quick Helper | Fast Path |
| Research only (learning) | Researcher | Research Only |
| Planning only (no code yet) | Analyzer | Requirements Phase |

---

## Agent Pipelines

### Pattern 1: Full Pipeline (Complex Features)

**When**: Multi-component features (dashboards, forms with validation, data tables)

**Steps**:
1. **Analyzer** - Break down feature into component requirements
2. **Researcher** - Get component details, dependencies, installation commands
3. **Builder** - Implement with TypeScript, validation, TenantFirestore integration

**Example**: User management table with filters, search, role-based actions

```typescript
// Step 1: Analyze
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze requirements for user management dashboard with table, search, filters, and role badges"
)

// Step 2: Research
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research: table, combobox, badge, dropdown-menu, dialog. Include dependencies and integration patterns."
)

// Step 3: Build
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build user management dashboard using:
    - Research from previous agent
    - TenantFirestore for data (MANDATORY)
    - Role-based action menu (owner/admin only)
    - Design tokens for all styling (MANDATORY)
    Include TypeScript types and error handling"
)
```

---

### Pattern 2: Fast Path (Simple Components)

**When**: Single component addition

**Steps**:
1. **Quick Helper** - Install + basic usage

**Example**: Add a button or alert component

```typescript
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add alert component for displaying form errors"
)
```

---

### Pattern 3: Research Only

**When**: Learning phase, understanding components

**Steps**:
1. **Researcher** - Gather details without implementation

```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research dialog and form components for building a modal with validation"
)
```

---

## Design Token Integration (MANDATORY)

### Non-Negotiable Rules

✅ **DO**:
```tsx
// Use CSS variables from tokens.css
className="bg-primary text-primary-foreground"
className="rounded-md border border-input"
className="shadow-lg"
```

❌ **DON'T**:
```tsx
// Never hardcode Tailwind color classes
className="bg-blue-500 text-white"
className="rounded-lg border-gray-300"
className="shadow-xl"
```

### Token Categories

| Category | Tokens | Usage |
|----------|--------|-------|
| **Colors** | `--primary`, `--destructive`, `--success`, `--warning`, `--muted` | Backgrounds, text, borders |
| **Spacing** | `--spacing-xs` through `--spacing-2xl` | Padding, margin, gaps |
| **Shadows** | `--shadow-sm`, `--shadow-md`, `--shadow-lg` | Card elevation, hover effects |
| **Radius** | `--radius` (0.625rem) | Border radius consistency |

**See**: [design-tokens.md](design-tokens.md) for complete reference

---

## Security Integration Patterns

### Pattern 1: Server Component with TenantFirestore

```typescript
import { getCurrentSession } from '@/lib/dal'
import { TenantFirestore } from '@/lib/TenantFirestore'

export default async function UserListPage() {
  // 1. Get session (validates auth + tenant)
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  // 2. Initialize TenantFirestore
  const tenantDB = new TenantFirestore(session.tenant_id, session.user_id)

  // 3. Query with automatic tenant_id filtering
  const users = await tenantDB.query('users', [])

  return <UserTable users={users} currentRole={session.role} />
}
```

**Key Points**:
- Server components fetch data with automatic tenant isolation
- Pass only necessary data to client components
- Include role for UI-level access control

---

### Pattern 2: Role-Based UI Components

```typescript
'use client'

interface UserActionsProps {
  currentRole: UserRole  // From server component
  targetUser: User
}

export function UserActions({ currentRole, targetUser }: UserActionsProps) {
  // Only admins can delete users
  const canDelete = ['owner', 'admin'].includes(currentRole)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit User</DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem className="text-destructive">
            Delete User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Key Points**:
- Role passed from server component (source of truth)
- Conditional rendering based on role
- Server-side enforcement remains primary defense

---

## Agent Chaining Best Practices

### Provide Context to Builder Agent

**Good** (includes project patterns):
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build user profile form using:
    - Form validation with Zod (like src/lib/validations/auth.ts)
    - TenantFirestore for saving data
    - Design tokens from src/styles/tokens.css
    - Server action for form submission
    Include loading states and error handling"
)
```

**Bad** (vague, missing patterns):
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build a user profile form"
)
```

---

### Specify Design Token Usage

Always remind the builder agent:

```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build [component] using:
    - Design tokens (MANDATORY): bg-primary, text-destructive, etc.
    - NO hardcoded Tailwind colors like bg-blue-500
    - Reference src/styles/tokens.css for available tokens"
)
```

---

## Report Generation Process

After implementation, agents may generate reports documenting:
- Components installed
- Dependencies added
- Integration patterns used
- Design token compliance
- Security considerations

**Reports are saved to**: `docs/shadcn/archive/` for future reference

---

## Common Pitfalls

### ❌ Pitfall 1: Skipping Requirements Phase

```typescript
// Bad: Jump straight to builder for complex features
Task(subagent_type: "shadcn-implementation-builder", prompt: "Build a dashboard")
```

**Fix**: Always analyze requirements first
```typescript
// Good: Start with analyzer
Task(subagent_type: "shadcn-requirements-analyzer", prompt: "Analyze dashboard requirements")
```

---

### ❌ Pitfall 2: Hardcoding Colors

```tsx
// Bad: Direct Tailwind classes
<div className="bg-blue-500 text-white">
<Alert className="border-red-500 bg-red-50">
```

**Fix**: Use design tokens
```tsx
// Good: CSS variables
<div className="bg-primary text-primary-foreground">
<Alert variant="destructive">
```

---

### ❌ Pitfall 3: Missing Security Integration

```typescript
// Bad: No tenant filtering
const users = await getDocs(collection(db, 'users'))

// Bad: Direct Firestore SDK usage
import { collection, getDocs } from 'firebase/firestore'
```

**Fix**: ALWAYS use TenantFirestore wrapper
```typescript
// Good: Automatic tenant isolation
const tenantDB = new TenantFirestore(session.tenant_id, session.user_id)
const users = await tenantDB.query('users', [])
```

---

### ❌ Pitfall 4: Not Providing Enough Context

```typescript
// Bad: Vague prompt
Task(subagent_type: "shadcn-implementation-builder", prompt: "Build form")
```

**Fix**: Include project-specific patterns
```typescript
// Good: Detailed prompt with context
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build invite user form with:
    - Zod validation (email + role selection)
    - Integration with inviteUser Cloud Function
    - Loading states with Spinner component
    - Design tokens for styling
    - Role dropdown (owner/admin/member/guest)
    - TypeScript types"
)
```

---

## Workflow Examples

### Example 1: Building a Dashboard Feature

**User Request**: "Create a tenant admin dashboard with user list, invite form, and settings"

**Step 1: Analyze Requirements**
```typescript
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze requirements for tenant admin dashboard with:
    - User list table (name, email, role, actions)
    - Invite user form (email, role selection)
    - Tenant settings card
    Break down into shadcn components needed"
)
```

**Output**: Components list (table, form, dialog, card, select, etc.)

---

**Step 2: Research Components**
```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research these shadcn components: table, form, dialog, card, select, input, button. Include installation commands and integration patterns."
)
```

**Output**: Complete component documentation and dependencies

---

**Step 3: Build Implementation**
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build tenant admin dashboard using previous research:

    Server Component (app/admin/page.tsx):
    - Use getCurrentSession() for auth
    - Fetch users with TenantFirestore
    - Pass data to client components

    Client Components:
    - UserTable with role badges and actions menu
    - InviteUserForm with Zod validation
    - TenantSettingsCard

    Integration:
    - Design tokens for all styling
    - Role-based action visibility (owner/admin)
    - TypeScript types for all props
    - Error handling and loading states"
)
```

**Output**: Production-ready code with full integration

---

### Example 2: Quick Component Addition

**User Request**: "Add a success alert for when user is invited"

```typescript
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add alert component for success messages"
)
```

**Output**: Installation command + basic usage example

---

## Integration Checklist

When building UI with shadcn agents, verify:

- ✅ Design tokens used (no hardcoded colors)
- ✅ TenantFirestore for data operations (server components)
- ✅ getCurrentSession() for authentication
- ✅ Role-based UI logic (client components)
- ✅ TypeScript types throughout
- ✅ Loading states implemented
- ✅ Error handling present
- ✅ Zod validation for forms
- ✅ Accessibility attributes (aria-label, etc.)
- ✅ Responsive design (mobile-friendly)

---

## Next Steps

1. **For new UI features**: Start with `shadcn-requirements-analyzer`
2. **For quick additions**: Use `shadcn-quick-helper`
3. **For learning**: Use `shadcn-component-researcher`
4. **Always**: Follow design token patterns
5. **Always**: Integrate with TenantFirestore for data operations
6. **Always**: Pass role from server components for UI-level access control

---

## See Also

- [shadcn-agents-usage.md](shadcn-agents-usage.md) - Complete agent API reference
- [design-tokens.md](design-tokens.md) - Token system details and rebranding guide
- [../architecture.md](../architecture.md) - 6-layer security architecture
- [../api-reference.md](../api-reference.md) - DAL and TenantFirestore API
