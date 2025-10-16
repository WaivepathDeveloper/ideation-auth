# shadcn/ui Components Research: User Management Dashboard

**Research Date:** 2025-10-15
**Purpose:** Component selection for multi-tenant SaaS user management UI

---

## Installation Summary

```bash
# Install all required components at once
npx shadcn@latest add table badge select dropdown-menu dialog form separator

# Or install individually:
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add separator
```

**Already Installed:**
- `button` - Action buttons
- `input` - Form inputs
- `label` - Form labels
- `card` - Container component
- `alert` - Success/error messages

---

## 1. Table Component

### Purpose in User Management UI
Display users in a sortable, paginated table with columns for Name, Email, Role, Status, and Actions.

### Installation
```bash
npx shadcn@latest add table
```

### Dependencies
- Can integrate with `@tanstack/react-table` for sorting, filtering, pagination

### Basic Usage
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>Team members in your organization</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>
        <Badge variant="default">Admin</Badge>
      </TableCell>
      <TableCell>Active</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          {/* Actions menu */}
        </DropdownMenu>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Key Components
- `<Table>` - Main container
- `<TableCaption>` - Optional description/summary
- `<TableHeader>` - Column headers section
- `<TableBody>` - Main content rows
- `<TableRow>` - Individual table rows
- `<TableCell>` - Individual cell content
- `<TableHead>` - Header cell
- `<TableFooter>` - Optional footer row

### Props We'll Use
- `className` - Custom styling for responsive layout
- Standard HTML table attributes

### Integration Notes
- **Responsive Design**: Wrap in scrollable container for mobile
- **Sorting**: Integrate with TanStack Table for sortable columns
- **Row Actions**: Embed DropdownMenu in action column
- **Role Badges**: Use Badge component in role column
- **Accessibility**: Built-in semantic HTML table structure

---

## 2. Badge Component

### Purpose in User Management UI
Display role badges with color-coded visual hierarchy (owner=purple, admin=blue, member=green, guest=yellow, viewer=gray).

### Installation
```bash
npx shadcn@latest add badge
```

### Variants Available
- `default` - Primary color (blue)
- `secondary` - Muted color (gray)
- `destructive` - Error/warning color (red)
- `outline` - Outlined style

### Basic Usage
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Admin</Badge>
<Badge variant="secondary">Member</Badge>
<Badge variant="destructive">Suspended</Badge>
<Badge variant="outline">Guest</Badge>
```

### Custom Role Badge Example
```tsx
// Create custom role badge component
function RoleBadge({ role }: { role: string }) {
  const variants = {
    owner: 'bg-purple-500 text-white',
    admin: 'bg-blue-500 text-white',
    member: 'bg-green-500 text-white',
    guest: 'bg-yellow-500 text-black',
    viewer: 'bg-gray-500 text-white'
  }

  return (
    <Badge
      variant="default"
      className={variants[role as keyof typeof variants]}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  )
}
```

### Props We'll Use
- `variant` - Choose from default, secondary, destructive, outline
- `className` - Override colors for custom role hierarchy
- `asChild` - Render as different component (e.g., link)

### Integration Notes
- **Color Hierarchy**: Use custom className to override default colors
- **Accessibility**: Semantic color contrast maintained by design tokens
- **Placement**: Inline with table cells, form labels, dropdown items

---

## 3. Select Component

### Purpose in User Management UI
Role selector dropdown for invite form and change role action (admin, member, guest, viewer).

### Installation
```bash
npx shadcn@latest add select
```

### Basic Usage
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Admin</SelectItem>
    <SelectItem value="member">Member</SelectItem>
    <SelectItem value="guest">Guest</SelectItem>
    <SelectItem value="viewer">Viewer</SelectItem>
  </SelectContent>
</Select>
```

### Advanced Role Selector with Groups
```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select role" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Administrative Roles</SelectLabel>
      <SelectItem value="owner">Owner</SelectItem>
      <SelectItem value="admin">Admin</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Standard Roles</SelectLabel>
      <SelectItem value="member">Member</SelectItem>
      <SelectItem value="guest">Guest</SelectItem>
      <SelectItem value="viewer">Viewer</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Key Components
- `<Select>` - Root component
- `<SelectTrigger>` - Button that opens dropdown
- `<SelectValue>` - Displays selected value or placeholder
- `<SelectContent>` - Container for selectable items
- `<SelectItem>` - Individual selectable option
- `<SelectGroup>` - Optional grouping of related items
- `<SelectLabel>` - Optional label for groups

### Props We'll Use
- `value` - Controlled value
- `onValueChange` - Callback when selection changes
- `disabled` - Disable select for permission guards
- `className` - Custom width/styling

### Integration Notes
- **Form Integration**: Use with Form component and React Hook Form
- **Permission Guards**: Disable certain roles based on current user permissions
- **Guest Permissions**: Show conditional permissions UI when "guest" selected
- **Validation**: Integrate with Zod schema for role validation

---

## 4. Dropdown Menu Component

### Purpose in User Management UI
Actions menu for each user row with options: Change Role, Remove User, Edit Permissions (guest only).

### Installation
```bash
npx shadcn@latest add dropdown-menu
```

### Basic Usage
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem>Change Role</DropdownMenuItem>
    <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Remove User
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### User Actions Menu Example
```tsx
function UserActionsMenu({ user }: { user: User }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open user actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleChangeRole(user)}>
            Change Role
          </DropdownMenuItem>
          {user.role === 'guest' && (
            <DropdownMenuItem onClick={() => handleEditPermissions(user)}>
              Edit Permissions
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDialogOpen(true)}
          >
            Remove User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* Confirmation dialog */}
      </Dialog>
    </>
  )
}
```

### Key Components
- `<DropdownMenu>` - Root container
- `<DropdownMenuTrigger>` - Button that opens menu
- `<DropdownMenuContent>` - Container for menu items
- `<DropdownMenuLabel>` - Section label
- `<DropdownMenuItem>` - Individual action item
- `<DropdownMenuSeparator>` - Visual divider
- `<DropdownMenuGroup>` - Group related items
- `<DropdownMenuSub>` - Nested submenu
- `<DropdownMenuSubTrigger>` - Opens submenu
- `<DropdownMenuSubContent>` - Submenu items

### Props We'll Use
- `align="end"` - Align menu to right side of trigger
- `className` - Style destructive actions differently
- `onClick` - Handle action clicks
- `asChild` - Make trigger use Button component
- `disabled` - Disable actions based on permissions

### Integration Notes
- **Permission Guards**: Hide/disable actions based on current user role
- **Destructive Actions**: Use red text color for remove user action
- **Confirmation Dialogs**: Trigger Dialog component for destructive actions
- **Keyboard Navigation**: Built-in arrow key navigation
- **Accessibility**: Screen reader labels for icon buttons

---

## 5. Dialog Component

### Purpose in User Management UI
Confirmation dialogs for destructive actions (remove user, transfer ownership).

### Installation
```bash
npx shadcn@latest add dialog
```

### Basic Usage
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### Remove User Confirmation Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function RemoveUserDialog({
  user,
  open,
  onOpenChange
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleRemoveUser() {
    setIsLoading(true)
    try {
      await removeUser(user.id)
      onOpenChange(false)
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove {user.name}?</DialogTitle>
          <DialogDescription>
            This will permanently remove {user.email} from your organization.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveUser}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Remove User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Key Components
- `<Dialog>` - Root component with state management
- `<DialogTrigger>` - Opens the dialog (optional if controlled)
- `<DialogContent>` - Contains dialog's main content
- `<DialogHeader>` - Wrapper for title and description
- `<DialogTitle>` - Dialog's main heading (required for accessibility)
- `<DialogDescription>` - Additional context
- `<DialogFooter>` - Action buttons container

### Props We'll Use
- `open` - Controlled open state
- `onOpenChange` - Callback when dialog state changes
- `className` - Custom max-width (e.g., `sm:max-w-[425px]`)
- `asChild` - Use custom trigger component

### Integration Notes
- **Controlled State**: Use `open` and `onOpenChange` for programmatic control
- **Loading States**: Disable buttons during async operations
- **Validation**: Can embed Form component for forms with validation
- **Accessibility**: Focus management and escape key handled automatically
- **Nested Dialogs**: Avoid nesting dialogs (use separate dialogs)

---

## 6. Form Component

### Purpose in User Management UI
Invite user form with email validation, role selection, and optional guest permissions configuration.

### Installation
```bash
npx shadcn@latest add form
```

### Dependencies
- Requires `react-hook-form` and `zod` for validation
- Uses `@hookform/resolvers/zod` for schema integration

### Basic Usage with Validation
```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  role: z.enum(["admin", "member", "guest", "viewer"], {
    required_error: "Please select a role."
  })
})

function InviteUserForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member"
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await inviteUser(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} />
              </FormControl>
              <FormDescription>
                The user will receive an invitation email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending..." : "Send Invitation"}
        </Button>
      </form>
    </Form>
  )
}
```

### Key Components
- `<Form>` - Root form provider (spreads form methods)
- `<FormField>` - Wrapper for each form field with validation
- `<FormItem>` - Container for label, control, description, message
- `<FormLabel>` - Accessible label with error linking
- `<FormControl>` - Wrapper for input component
- `<FormDescription>` - Helper text below input
- `<FormMessage>` - Error message (auto-populated from validation)

### Props We'll Use
- `control={form.control}` - Connect field to React Hook Form
- `name` - Field name matching Zod schema
- `render` - Render function with field props
- `onSubmit={form.handleSubmit(onSubmit)}` - Form submission

### React Hook Form Integration
```tsx
// Form instance methods
const form = useForm<FormValues>({
  resolver: zodResolver(schema), // Zod validation
  defaultValues: { ... }          // Initial values
})

// Useful methods
form.handleSubmit(onSubmit)       // Handle form submission
form.formState.isSubmitting       // Loading state
form.formState.errors             // Validation errors
form.reset()                       // Reset form to defaults
form.setValue('field', value)     // Set field value programmatically
```

### Integration Notes
- **Type Safety**: Infer TypeScript types from Zod schema with `z.infer<typeof schema>`
- **Validation**: Client-side validation runs on blur and submit
- **Error Messages**: Automatically linked to inputs via `aria-describedby`
- **Loading States**: Use `form.formState.isSubmitting` for button disabled state
- **Success Messages**: Use Alert component to show success after submission
- **Guest Permissions**: Conditionally render additional fields when role="guest"

---

## 7. Separator Component

### Purpose in User Management UI
Visual dividers between form sections, dropdown menu groups, and card sections.

### Installation
```bash
npx shadcn@latest add separator
```

### Basic Usage
```tsx
import { Separator } from "@/components/ui/separator"

<div>
  <div>Section 1</div>
  <Separator className="my-4" />
  <div>Section 2</div>
</div>
```

### Vertical Separator
```tsx
<div className="flex items-center gap-4">
  <span>Option 1</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Option 2</span>
</div>
```

### Props We'll Use
- `orientation` - "horizontal" (default) or "vertical"
- `className` - Custom spacing and sizing
- `decorative` - Set to true if purely decorative (no semantic meaning)

### Integration Notes
- **Form Sections**: Separate email input from role selection
- **Dropdown Menus**: Divide menu items into logical groups
- **Card Layouts**: Separate header from content areas
- **Accessibility**: Semantic `<hr>` element with proper ARIA roles

---

## 8. Already Installed Components

### Button Component
**Status:** Already installed at `src/components/ui/button.tsx`

**Variants:**
- `default` - Primary blue button
- `destructive` - Red button for dangerous actions
- `outline` - Outlined button with transparent background
- `secondary` - Muted gray button
- `ghost` - Minimal hover-only background
- `link` - Text link styled as button

**Sizes:**
- `default` - h-9 (36px)
- `sm` - h-8 (32px)
- `lg` - h-10 (40px)
- `icon`, `icon-sm`, `icon-lg` - Square icon buttons

**Usage in User Management:**
- Invite User button (primary action)
- Dialog action buttons (confirm/cancel)
- Dropdown menu trigger (ghost variant)
- Form submit buttons with loading states

### Input Component
**Status:** Already installed at `src/components/ui/input.tsx`

**Features:**
- Focus ring with `focus-visible:ring-ring/50`
- Error states with `aria-invalid:border-destructive`
- Dark mode support with `dark:bg-input/30`

**Usage in User Management:**
- Email input in invite form
- Search/filter input for user table

### Label Component
**Status:** Already installed at `src/components/ui/label.tsx`

**Features:**
- Accessible form labels with `htmlFor` attribute
- Peer-disabled styling support

**Usage in User Management:**
- Form field labels
- Checkbox/switch labels for permissions

### Card Component
**Status:** Already installed at `src/components/ui/card.tsx`

**Sub-components:**
- `<Card>` - Main container
- `<CardHeader>` - Title and description area
- `<CardTitle>` - Main heading
- `<CardDescription>` - Subtitle/description
- `<CardContent>` - Main content area
- `<CardFooter>` - Action buttons area

**Usage in User Management:**
- Invite user form container
- User table container
- Settings cards

### Alert Component
**Status:** Already installed at `src/components/ui/alert.tsx`

**Variants:**
- `default` - Neutral informational alert
- `destructive` - Error/warning alert

**Sub-components:**
- `<Alert>` - Main container
- `<AlertTitle>` - Alert heading
- `<AlertDescription>` - Alert message

**Usage in User Management:**
- Success message after inviting user
- Error message if invitation fails
- Warning message for destructive actions

---

## Component Integration Strategy

### User List Table
```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>Manage your organization's users</CardDescription>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <RoleBadge role={user.role} />
            </TableCell>
            <TableCell>{user.status}</TableCell>
            <TableCell className="text-right">
              <UserActionsMenu user={user} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Invite User Form
```tsx
<Card>
  <CardHeader>
    <CardTitle>Invite User</CardTitle>
    <CardDescription>Send an invitation to join your organization</CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="email" />
        <Separator />
        <FormField name="role" />
        {selectedRole === 'guest' && (
          <>
            <Separator />
            <FormField name="permissions" />
          </>
        )}
        <Button type="submit">Send Invitation</Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

### Actions Menu with Confirmation
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleChangeRole}>
      Change Role
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-destructive"
      onClick={() => setDialogOpen(true)}
    >
      Remove User
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Remove user?</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDialogOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleRemove}>
        Remove
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Accessibility Checklist

All components follow WCAG AA compliance:

- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Reader Support**: ARIA labels, roles, and descriptions
- **Focus Indicators**: Visible focus rings on all focusable elements
- **Error Announcements**: `role="alert"` on error messages
- **Color Contrast**: 4.5:1 minimum ratio via design tokens
- **Semantic HTML**: Proper use of `<table>`, `<form>`, `<button>`, etc.
- **Dialog Focus Trapping**: Focus trapped within dialog when open
- **Dropdown Menu Navigation**: Arrow key navigation in menus

---

## Next Steps

1. **Install Missing Components**
   ```bash
   npx shadcn@latest add table badge select dropdown-menu dialog form separator
   ```

2. **Set Up TanStack Table** (for sortable columns)
   ```bash
   npm install @tanstack/react-table
   ```

3. **Create Custom Components**
   - `RoleBadge.tsx` - Custom badge with role colors
   - `UserActionsMenu.tsx` - Dropdown menu with permission guards
   - `RemoveUserDialog.tsx` - Confirmation dialog
   - `InviteUserForm.tsx` - Form with validation

4. **Implement Permission Guards**
   - Hide/disable actions based on current user role
   - Validate role changes on server-side

5. **Add Firestore Integration**
   - Use TenantFirestore for all user queries
   - Implement real-time user list updates
   - Handle invitation creation with Cloud Functions

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/docs/components)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/)
