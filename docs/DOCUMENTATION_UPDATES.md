# Documentation Updates - Token-Based Invitation System

## Summary

Updated all documentation to reflect the new token-based invitation acceptance flow.

---

## Files Updated

### 1. [CLAUDE.md](../CLAUDE.md)
- Added invitation system files to Core Implementation Files table
- Added `NEXT_PUBLIC_APP_URL` to Environment Variables section

### 2. [docs/database-schema.md](database-schema.md)
**Section: invitations collection**
- Added `invite_token: string (64 hex chars, crypto-secure)`
- Added `invite_link: string (full URL with token)`
- Added `token_used: boolean (one-time use flag)`
- Updated indexes to include `invite_token` and `token_used`

### 3. [docs/api-reference.md](api-reference.md)
**Section: inviteUser Cloud Function**
- Updated return type to include `inviteLink: string`
- Updated response example with invitation link
- Added note about manual link sharing (no email delivery in MVP)

### 4. [docs/authentication-flow.md](authentication-flow.md)
**Section: Signup Flow (Invitation-Based)**
- Replaced email-based flow with token-based flow
- Added detailed 13-step process showing:
  - Token generation with crypto.randomBytes(32)
  - Manual link sharing by admin
  - Server-side token validation in /accept-invite page
  - Invitation context display with pre-filled email
  - AcceptInviteForm calling acceptInvitation server action
  - onUserCreate detecting accepted invitation
- Updated invitation states table with revoked state

---

## Key Changes

### Security Pattern
- **Before**: Email-based verification (planned, not implemented)
- **Now**: Cryptographically secure tokens (industry standard)

### User Flow
- **Before**: User receives email → clicks link → accepts
- **Now**: Admin shares link → user clicks → sees invitation context → signs up → auto-accepted

### Implementation Files
- `functions/src/auth/inviteUser.ts` - generates token and link
- `src/app/accept-invite/page.tsx` - validates token (Server Component)
- `src/components/auth/AcceptInviteForm.tsx` - signup form with context
- `src/lib/actions/accept-invitation.ts` - marks invitation accepted
- `src/types/invitation.ts` - TypeScript types
- `src/types/user.ts` - centralized user types with invitation support

---

## Documentation Philosophy

All updates follow minimal, essential-only approach:
- Focus on what changed
- Remove redundant explanations
- Optimize for LLM context initialization
- Keep examples concise and relevant
