# Shadcn Agents Usage Guide

This guide explains how to use Claude Code's shadcn agents with the MCP server to build production-ready UI components.

## Overview

Claude Code provides 4 specialized shadcn agents that work together with the shadcn MCP server to streamline UI development.

### Shadcn MCP Server

**Tools Available:**
- `getComponents()` - Lists all 348+ available shadcn components
- `getComponent(component)` - Gets full implementation details for a specific component

**Setup:**
```bash
claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp
```

**Verify Connection:**
```bash
claude mcp list
# Should show: shadcn: https://www.shadcn.io/api/mcp (HTTP) -  Connected
```

---

## The 4 Shadcn Agents

### 1. = shadcn-requirements-analyzer

**Purpose:** Analyzes complex UI feature requests and breaks them down into structured component requirements

**When to Use:** At the START of a UI feature development

**Input:** High-level feature description
**Output:** Structured list of shadcn components needed

**Workflow:**
1. Takes natural language feature description
2. Analyzes UI requirements
3. Calls MCP `getComponents()` to verify components exist
4. Returns component list with rationale

**Example:**
```typescript
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze requirements for a user management dashboard with:
    - User list table with search/filter
    - Add user form modal
    - User detail sidebar
    - Role-based badges
    Break down into shadcn components needed"
)
```

**Expected Output:**
```
Components Needed:
 table - User list with pagination
 combobox - Search and filter functionality
 dialog - Add user modal
 tabs - User details sections
 badge - Role indicators
 calendar - Date filtering
 form - User input validation
```

---

### 2. =Ú shadcn-component-researcher

**Purpose:** Researches specific shadcn components for implementation details

**When to Use:** AFTER requirements analysis, BEFORE implementation

**Input:** List of component names from requirements
**Output:** Detailed component docs, examples, installation commands

**Workflow:**
1. Takes component names from analyzer
2. For each component, calls MCP `getComponent(name)`
3. Compiles research document with:
   - Full source code
   - Dependencies required
   - Registry dependencies (other shadcn components)
   - Installation paths
   - Usage examples
   - TypeScript types

**Example:**
```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research these shadcn components: table, combobox, dialog, tabs, badge
    Get installation commands, dependencies, and integration notes"
)
```

**Expected Output:**
```
Component Research Document:

## table
Dependencies: @tanstack/react-table
Registry Dependencies: button, dropdown-menu, input
Path: components/ui/table/index.tsx
[Full implementation code]

## combobox
Dependencies: cmdk
Registry Dependencies: command, popover, button
Path: components/ui/combobox/index.tsx
[Full implementation code]

[... etc for each component]
```

---

### 3. ¡ shadcn-quick-helper

**Purpose:** Rapid assistance for adding single components

**When to Use:** For SIMPLE, single-component additions (skips analysis/research)

**Input:** Component name
**Output:** Installation command + basic usage

**Workflow:**
1. Takes component name
2. Calls MCP `getComponent(name)`
3. Returns instant installation + code snippet

**Example:**
```typescript
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add calendar component to my project"
)
```

**Expected Output:**
```
Install dependencies:
npm install date-fns jotai lucide-react

Registry dependencies (install these components first):
- button
- command
- popover

Add file: components/ui/calendar/index.tsx

Basic usage:
import { CalendarProvider, CalendarBody } from '@/components/ui/calendar'

<CalendarProvider>
  <CalendarBody features={features}>
    {({ feature }) => <CalendarItem feature={feature} />}
  </CalendarBody>
</CalendarProvider>
```

---

### 4. <× shadcn-implementation-builder

**Purpose:** Builds production-ready implementations with TypeScript, state management, validation

**When to Use:** AFTER research is complete, for COMPLEX implementations

**Input:** Requirements + research from previous agents
**Output:** Complete, production-ready code with TypeScript types

**Workflow:**
1. Takes requirements from analyzer
2. Takes research from researcher
3. Calls MCP `getComponent()` for each required component
4. Integrates components together
5. Adds TypeScript types
6. Adds form validation (zod)
7. Adds state management
8. Handles edge cases
9. Writes complete files

**Example:**
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build complete user management dashboard using:
    - Research from previous agent
    - Table with 10 users per page
    - Search by name/email
    - Filter by role (combobox)
    - Add user modal with validation
    Include TypeScript types and error handling"
)
```

**Expected Output:**
```
Files Created:
 components/UserTable.tsx - Full table implementation
 components/AddUserDialog.tsx - Form with validation
 components/UserFilters.tsx - Search + filter UI
 types/user.ts - TypeScript interfaces
 lib/userValidation.ts - Zod schemas

Features Implemented:
 Pagination (10 per page)
 Search functionality
 Role filtering
 Form validation
 Loading states
 Error handling
 TypeScript types throughout
```

---

## Complete Workflow Examples

### Example 1: Building a User Management Dashboard

**Step 1: Analyze Requirements**
```typescript
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze requirements for user management dashboard"
)
```

Output: List of 6 components needed

---

**Step 2: Research Components**
```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research: table, combobox, dialog, tabs, badge, calendar"
)
```

Output: Full implementation details for all 6 components

---

**Step 3: Build Implementation**
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build complete dashboard with all components integrated"
)
```

Output: Production-ready code with TypeScript

---

### Example 2: Quick Single Component

**For simple needs, skip directly to quick-helper:**

```typescript
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add badge component for user roles"
)
```

Output: Instant installation + basic usage

---

## When to Use Each Agent

| Scenario | Agent(s) to Use | Workflow |
|----------|----------------|----------|
| Complex multi-component feature | Analyzer ’ Researcher ’ Builder | Full pipeline |
| "What components do I need?" | Analyzer only | Planning phase |
| "How does X component work?" | Researcher only | Research only |
| "Add a button" | Quick Helper | Single component |
| Production implementation | Builder (after research) | Complex build |

---

## Agent Chaining Patterns

### Pattern 1: Full Pipeline (Complex Features)
```typescript
// Step 1: Analyze
Task(subagent_type: "shadcn-requirements-analyzer", ...)

// Step 2: Research (use output from Step 1)
Task(subagent_type: "shadcn-component-researcher", ...)

// Step 3: Build (use output from Step 1 & 2)
Task(subagent_type: "shadcn-implementation-builder", ...)
```

### Pattern 2: Quick Add (Simple Tasks)
```typescript
// Single step
Task(subagent_type: "shadcn-quick-helper", prompt: "Add X component")
```

### Pattern 3: Research Only
```typescript
// For understanding before custom implementation
Task(subagent_type: "shadcn-component-researcher", prompt: "Research X, Y, Z")
```

---

## Integration with MCP Server

**How Agents Use MCP:**

1. **Requirements Analyzer**
   - Calls `getComponents()` to list available components
   - Verifies suggested components exist

2. **Component Researcher**
   - Calls `getComponent(name)` for each component
   - Retrieves full source code and dependencies

3. **Quick Helper**
   - Calls `getComponent(name)` for target component
   - Extracts installation commands

4. **Implementation Builder**
   - Calls `getComponent(name)` multiple times
   - Uses accurate component APIs (no hallucination)
   - Integrates components based on real implementations

**Key Advantage:** MCP ensures agents always have **up-to-date, accurate** component data from the official shadcn registry.

---

## Best Practices

### 1. Always Start with Requirements
Don't jump straight to implementation. Use the analyzer to understand what you need:
```typescript
// L Bad: Skip to implementation
Task(subagent_type: "shadcn-implementation-builder", prompt: "Build dashboard")

//  Good: Analyze first
Task(subagent_type: "shadcn-requirements-analyzer", prompt: "Analyze dashboard requirements")
```

### 2. Research Before Complex Builds
For multi-component features, research first:
```typescript
// After analysis
Task(subagent_type: "shadcn-component-researcher", prompt: "Research [components from analysis]")
// Then build
Task(subagent_type: "shadcn-implementation-builder", prompt: "Build using research")
```

### 3. Use Quick Helper for Simple Additions
Don't overcomplicate single component additions:
```typescript
//  Good: Quick helper for simple tasks
Task(subagent_type: "shadcn-quick-helper", prompt: "Add button component")
```

### 4. Provide Context to Builder
When using the builder, reference previous agent outputs:
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build dashboard using:
    - Requirements from analyzer: [paste or reference]
    - Component research: [paste or reference]
    - Integration with TenantFirestore wrapper
    - TypeScript types"
)
```

### 5. Chain with Security Agents
After building UI, always review security:
```typescript
// After shadcn-implementation-builder
Task(
  subagent_type: "frontend-security-enforcer",
  prompt: "Review [component] for XSS, CSRF, security headers"
)
```

---

## Common Pitfalls

### L Pitfall 1: Skipping Requirements Analysis
```typescript
// Bad: Jump straight to implementation
"Build a dashboard" ’ Builder agent ’ Missing components
```

**Solution:** Always analyze first
```typescript
"Build dashboard" ’ Analyzer ’ Researcher ’ Builder
```

---

### L Pitfall 2: Using Builder for Single Components
```typescript
// Bad: Overkill for simple tasks
Task(subagent_type: "shadcn-implementation-builder", prompt: "Add button")
```

**Solution:** Use Quick Helper
```typescript
Task(subagent_type: "shadcn-quick-helper", prompt: "Add button")
```

---

### L Pitfall 3: Not Providing Context to Builder
```typescript
// Bad: Vague prompt
Task(subagent_type: "shadcn-implementation-builder", prompt: "Build form")
```

**Solution:** Provide detailed requirements
```typescript
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build user registration form with:
    - Email, password, confirm password fields
    - Zod validation
    - Integration with TenantAuth context
    - Error handling
    - Loading states"
)
```

---

## Example: Multi-Tenant Auth UI

Here's how to use shadcn agents for your auth system:

### Phase 1: Sign In/Sign Up Forms

```typescript
// Step 1: Analyze
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze UI components for:
    - Sign in form (email/password)
    - Sign up form (email/password/confirm)
    - Google OAuth button
    - Password visibility toggle
    - Form validation errors
    - Loading states"
)

// Step 2: Research
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research components from analysis"
)

// Step 3: Build
Task(
  subagent_type: "shadcn-implementation-builder",
  prompt: "Build sign-in and sign-up forms with:
    - Integration with useTenantAuth() hook
    - Zod validation
    - Error handling
    - Google OAuth integration
    - TypeScript types"
)

// Step 4: Security Review
Task(
  subagent_type: "frontend-security-enforcer",
  prompt: "Review auth forms for security issues"
)
```

### Phase 2: Dashboard Components

```typescript
// Quick add for simple components
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add navbar component for dashboard"
)

// Full pipeline for complex features
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze user profile settings page"
)
// ... continue with researcher and builder
```

---

## Troubleshooting

### Issue: Agent Not Finding Component
**Symptom:** Agent says component doesn't exist

**Solution:** Check available components
```typescript
// List all 348 components
mcp__shadcn__getComponents()
```

---

### Issue: Builder Creating Incorrect Integration
**Symptom:** Components not working together

**Solution:** Use researcher first to understand integration patterns
```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Research how dialog and form components integrate"
)
```

---

### Issue: Missing Dependencies
**Symptom:** npm install errors

**Solution:** Researcher agent provides complete dependency list
```typescript
Task(
  subagent_type: "shadcn-component-researcher",
  prompt: "Get all dependencies for [component]"
)
```

---

## Summary

**4 Agents, 1 Goal: Production-Ready shadcn UI**

1. **Analyzer** - What do I need?
2. **Researcher** - How do they work?
3. **Quick Helper** - Add it fast
4. **Builder** - Build it right

**MCP Server** - Always accurate, never hallucinating

**Best Practice** - Start with analysis, research complex features, build with context

---

## Next Steps

Now that you understand the agents, try building your first shadcn component:

```typescript
Task(
  subagent_type: "shadcn-quick-helper",
  prompt: "Add button component to my auth project"
)
```

Then graduate to complex features:

```typescript
Task(
  subagent_type: "shadcn-requirements-analyzer",
  prompt: "Analyze requirements for tenant admin dashboard"
)
```

Happy building! =€
