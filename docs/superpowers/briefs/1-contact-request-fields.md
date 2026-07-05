# Task 1 Brief: Fix Contact Request Field Name Mismatch

**Plan:** `docs/superpowers/plans/2026-07-03-comprehensive-audit-fixes.md` (Phase 1)
**Status:** COMPLETE (uncommitted changes from prior session)
**Files Modified:**
- `src/app/[locale]/dashboard/contact-requests/page.tsx`
- `src/app/[locale]/admin/contact-requests/page.tsx`

## Problem
Queries selected wrong column names (`name`, `email`, `phone`, `type`) but DB columns are `visitor_name`, `visitor_email`, `visitor_phone`, `contact_type`. TypeScript interfaces expected the correct names but queries returned `null`/empty data.

## Solution Already Applied
1. Updated both queries to use correct DB column names with FK joins preserved (`properties(title)`, `offices(name)`).
2. Added `updated_at` column to both queries (useful for Task 11 status updates).
3. Field references throughout both files already use snake_case `visitor_*`/`contact_type`.

## Verification
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 215/215 passing (`npm run test:run`)

## Commit
`fix: correct contact request field names to match DB schema`
