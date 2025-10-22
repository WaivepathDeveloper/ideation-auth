# Visual Analysis: Reference Image

**Source**: `users-reference.webp` (Lamda app Settings page)
**Analysis Date**: 2025-10-22

---

## Layout Structure

### Overall Architecture
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────────┐  ┌────────────────────────────────┐    │
│  │          │  │                                │    │
│  │          │  │         Main Content           │    │
│  │ Sidebar  │  │    (Settings Page)             │    │
│  │  ~280px  │  │                                │    │
│  │          │  │   - Page Header                │    │
│  │          │  │   - Tab Navigation             │    │
│  │          │  │   - Profile Card               │    │
│  │          │  │   - User Table                 │    │
│  │          │  │                                │    │
│  └──────────┘  └────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Measurements
- **Sidebar Width**: ~280px (collapsible, NOT fixed)
- **Content Width**: Fluid (remaining space)
- **Page Background**: Light gray (#F7F7F7)
- **Sidebar Background**: White (#FFFFFF)
- **Card Padding**: 24-32px
- **Content Padding**: 24px minimum

---

## Sidebar Design

### Logo Area
- **Position**: Top
- **Content**: "Lamda" text with icon
- **Height**: ~60px
- **Padding**: 16px

### Navigation Menu
**Items** (top to bottom):
1. Dashboard (icon: layout grid)
2. Engagement (icon: users)
3. Predictive Analytics (icon: trending up)
4. Retention Strategies (icon: target)
5. Settings (icon: settings) - **ACTIVE STATE**

**Styling**:
- **Normal State**:
  - Background: Transparent
  - Text: Dark gray (#374151)
  - Padding: 12px 16px
  - Border Radius: 8px

- **Active State**:
  - Background: Light gray (#F3F4F6)
  - Text: Dark (bold weight)
  - Icon: Same color as text

- **Hover State**:
  - Background: Very light gray (#F9FAFB)
  - Cursor: Pointer

### Footer Section
- **Position**: Bottom of sidebar
- **Content**: "Download Mac OS app" promotional card
- **Styling**:
  - White card with border
  - Icon: Apple logo
  - Text: Medium weight
  - Small padding

---

## Settings Page Header

### Title Section
- **Title**: "Settings"
  - Font Size: 28-32px
  - Font Weight: Bold (700)
  - Color: Dark (#1F2937)
  - Margin Bottom: 8px

- **Subtitle**: "Update settings for better features performance"
  - Font Size: 14px
  - Font Weight: Regular (400)
  - Color: Medium gray (#6B7280)
  - Margin Bottom: 24px

### Tab Navigation
**Tabs**:
1. AI Configuration
2. User Permissions (active)
3. Notifications

**Styling**:
- **Normal Tab**:
  - Background: Transparent
  - Text: Medium gray (#6B7280)
  - Font Size: 14px
  - Font Weight: Medium (500)
  - Padding: 8px 16px

- **Active Tab**:
  - Background: None
  - Text: Dark (#1F2937)
  - Font Weight: Semi-bold (600)
  - Border Bottom: 2px solid primary color

- **Layout**:
  - Horizontal layout
  - Gap: 24px between tabs
  - Margin Bottom: 32px

---

## Profile and Members Section

### Section Header
- **Title**: "Profile and members"
  - Font Size: 18px
  - Font Weight: Semi-bold (600)
  - Color: Dark

- **Toggle Buttons**: "Users" | "Roles"
  - Position: Right side of header
  - Active: "Users" (blue icon and background)
  - Inactive: "Roles" (gray icon)
  - Icon: Users icon | Shield icon
  - Size: Small (32px height)
  - Border Radius: 6px

### Current User Profile Card
**Layout**: Horizontal card with padding

**Content** (left to right):
1. **Avatar**:
   - Size: 48px diameter
   - Shape: Circle
   - Border: 2px solid light gray
   - Image: User photo

2. **User Info** (middle):
   - Name: "Borja Loma"
     - Font Size: 16px
     - Font Weight: Semi-bold (600)
     - Color: Dark
   - Role Badge: "Admin"
     - Background: Light gray
     - Text: Medium gray
     - Font Size: 12px
     - Padding: 4px 8px
     - Border Radius: 4px

3. **Action Button** (right):
   - Text: "Edit Profile"
   - Variant: Outline
   - Color: Border gray
   - Padding: 8px 16px
   - Border Radius: 6px

---

## User Table

### Table Structure

**Columns**:
1. Avatar (implicit)
2. NAME
3. EMAIL
4. ROLE
5. Actions (right-aligned)

**Column Headers**:
- Font Size: 12px
- Font Weight: Medium (500)
- Text Transform: Uppercase
- Color: Medium gray (#6B7280)
- Padding: 12px 16px

### Table Rows

**Row 1**: Napa Soli
- Avatar: Orange circular avatar
- Name: "Napa Soli" (semi-bold)
- Email: "napa@lamda.com" (gray)
- Role: Dropdown showing "Manager" (with chevron)
- Action: User icon button

**Row 2**: Sophia Martinez
- Avatar: Red circular avatar
- Name: "Sophia Martinez"
- Email: "sophia@lamda.com"
- Role: Dropdown showing "Manager"
- Action: User icon button

**Row 3**: Emily Johnson
- Avatar: Blue circular avatar
- Name: "Emily Johnson"
- Email: "emily@lamda.com"
- Role: Dropdown showing "Analyst"
- Action: User icon button

**Row 4**: David Smith
- Avatar: Yellow circular avatar
- Name: "David Smith"
- Email: "smith@lamda.com"
- Role: Dropdown showing "Analyst"
- Action: User icon button

**Row 5**: Mei Lin Chen
- Avatar: Purple circular avatar
- Name: "Mei Lin Chen"
- Email: "mei@lamda.com"
- Role: Dropdown showing "Analyst"
- Action: User icon button

**Row Styling**:
- Height: ~56px
- Padding: 12px 16px
- Border Bottom: 1px solid light gray (#E5E7EB)
- Hover: Light gray background (#F9FAFB)

**Avatar Styling**:
- Size: 32px diameter
- Shape: Circle
- Colors: Various (orange, red, blue, yellow, purple)
- Position: Leftmost in row

**Name Styling**:
- Font Size: 14px
- Font Weight: Medium (500)
- Color: Dark (#1F2937)

**Email Styling**:
- Font Size: 14px
- Font Weight: Regular (400)
- Color: Medium gray (#6B7280)

**Role Dropdown**:
- Background: White
- Border: 1px solid light gray
- Border Radius: 6px
- Padding: 4px 12px
- Font Size: 14px
- Icon: Chevron down (right side)

**Action Button**:
- Size: 32px (icon only)
- Background: Transparent
- Hover: Light gray background
- Icon: User icon (gray)

### Add Member Button
- **Position**: Bottom right of table
- **Text**: "+ Add Member"
- **Variant**: Primary (filled)
- **Background**: Cyan blue (#06B6D4)
- **Text Color**: White
- **Padding**: 10px 20px
- **Border Radius**: 8px
- **Shadow**: Subtle shadow

---

## Color Palette Analysis

### Primary Colors
| Color Name | Hex Estimate | Usage | Project Token |
|------------|--------------|-------|---------------|
| White | `#FFFFFF` | Sidebar, cards, backgrounds | `--sidebar`, `--card` |
| Light Gray BG | `#F7F7F7` | Page background | `--background` |
| Border Gray | `#E5E7EB` | Borders, dividers | `--border`, `--sidebar-border` |
| Text Dark | `#1F2937` | Primary text | `--foreground`, `--sidebar-foreground` |
| Text Medium Gray | `#6B7280` | Secondary text | `--muted-foreground` |
| Active BG | `#F3F4F6` | Active nav item | `--sidebar-accent` |
| Hover BG | `#F9FAFB` | Hover states | `--sidebar-accent` (lighter) |
| Primary Blue | `#06B6D4` | Buttons, accents | `--primary` |

### Avatar Colors (Diverse)
- Orange: `#F97316`
- Red: `#EF4444`
- Blue: `#3B82F6`
- Yellow: `#EAB308`
- Purple: `#8B5CF6`

---

## Typography Scale

### Font Sizes
| Size | Usage | Example | Token |
|------|-------|---------|-------|
| 12px | Small text, labels, badges | "ADMIN", column headers | `text-xs` |
| 14px | Body text, emails, navigation | User emails, nav items | `text-sm` |
| 16px | Medium text, user names | "Borja Loma" | `text-base` |
| 18px | Section titles | "Profile and members" | `text-lg` |
| 28-32px | Page titles | "Settings" | `text-2xl` to `text-3xl` |

### Font Weights
| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, emails |
| Medium | 500 | Names, navigation |
| Semi-bold | 600 | Section titles, active items |
| Bold | 700 | Page titles |

---

## Spacing System

### Padding Scale
| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Badge padding vertical |
| sm | 8px | Button padding, tab padding |
| md | 12px | Table row padding |
| lg | 16px | Card padding, nav item padding |
| xl | 24px | Section spacing |
| 2xl | 32px | Major section gaps |

### Gaps
- **Nav Items**: 4px vertical gap
- **Section Spacing**: 24-32px
- **Table Rows**: 0px gap (border-separated)
- **Horizontal Elements**: 16px gap

---

## Shadows

### Card Shadow
- **Value**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **Token**: `shadow-sm` or `shadow-md`
- **Usage**: Cards, dropdowns

### Button Shadow
- **Value**: None (flat design)
- **Hover**: Subtle shadow on hover

---

## Border Radius

| Element | Radius | Token |
|---------|--------|-------|
| Cards | 8-10px | `rounded-md` or `rounded-lg` |
| Buttons | 6-8px | `rounded-md` |
| Badges | 4px | `rounded` |
| Avatars | 50% (full circle) | `rounded-full` |
| Dropdowns | 6px | `rounded-md` |

---

## Interactive States

### Hover States
- **Sidebar Nav Item**: Background changes to #F9FAFB
- **Table Row**: Background changes to #F9FAFB
- **Button**: Slight opacity change or shadow
- **Dropdown**: Border color changes

### Active States
- **Sidebar Nav Item**: Background #F3F4F6, text bold
- **Tab**: Border bottom 2px primary color, text bold
- **Toggle Button**: Primary background, white text

### Focus States
- **All Interactive Elements**: Ring visible (2-3px)
- **Ring Color**: Primary color with opacity
- **Token**: `focus:ring-ring`

---

## Responsive Considerations

### Desktop (≥768px)
- Sidebar visible (collapsible)
- Two-column layout
- Table shows all columns

### Tablet (768-1024px)
- Sidebar collapsible
- Two-column layout maintained
- Table may need horizontal scroll

### Mobile (<768px)
- Sidebar hidden
- Hamburger menu button
- Sheet overlay for navigation
- Table converts to cards (future enhancement)
- Stacked layout for content

---

## Component Breakdown

### Components Needed
1. **AppSidebar**
   - Logo area
   - Navigation menu (5 items)
   - Footer promotional card
   - Collapsible functionality
   - Mobile sheet overlay

2. **SettingsTabs**
   - Tab list (3 tabs)
   - Tab content slot
   - Active state indicator

3. **ViewToggle**
   - Toggle group (2 options)
   - Icons (Users, Shield)
   - Active state

4. **UserAvatar**
   - Circular image
   - Fallback to initials
   - Multiple sizes (sm, md, lg)

5. **CurrentUserProfile**
   - Card layout
   - Avatar + name + role
   - Edit button

6. **UserTable** (enhanced)
   - Avatar column (new)
   - Name, email, role columns (existing)
   - Role dropdown
   - Action button

7. **AddMemberButton**
   - Primary button
   - Icon + text
   - Position: bottom right

---

## Design Patterns Observed

### Pattern 1: Subtle Hierarchy
- Use of background shades (white, light gray, lighter gray)
- No heavy borders or shadows
- Clean, minimal aesthetic

### Pattern 2: Consistent Spacing
- 8px base unit
- Predictable padding/margins
- Aligned to grid

### Pattern 3: Muted Colors
- Gray as primary color scheme
- Single accent color (cyan blue)
- Minimal use of bright colors (except avatars)

### Pattern 4: Icon Usage
- All navigation items have icons
- Icons are consistent size (20-24px)
- Simple line icons (not filled)

### Pattern 5: Typography Contrast
- Bold vs regular for hierarchy
- Size changes for emphasis
- Color changes for secondary info

---

## Key Takeaways for Implementation

1. **Keep it minimal**: Avoid heavy shadows, borders, decorations
2. **Use grayscale**: Primary UI is grayscale + single accent color
3. **Spacing matters**: Follow 8px system religiously
4. **Collapsible sidebar**: NOT fixed width, users can expand/collapse
5. **Consistent tokens**: Use design tokens exclusively, no hardcoded values
6. **Mobile-first**: Consider responsive behavior from the start
7. **Subtle interactions**: Hover/active states are subtle, not dramatic
8. **Icons everywhere**: Navigation needs icons for quick scanning

---

## Discrepancies from Project Requirements

### Match Requirements
✅ Collapsible sidebar (user confirmed)
✅ Settings tabs
✅ Users/Roles toggle
✅ User table with avatars
✅ Profile card with "Edit Profile" button
✅ Role-based navigation (can be inferred)

### Differences
- Reference shows "Download Mac OS app" promo - we'll make this a placeholder
- Reference shows specific avatar colors - we'll use fallback logic
- Reference shows 5 users - we'll fetch actual data from Firestore

---

**End of Visual Analysis**
