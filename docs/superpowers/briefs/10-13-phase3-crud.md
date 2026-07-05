# Tasks 10-13 Brief: Phase 3 Missing CRUD Operations

**Plan:** `docs/superpowers/plans/2026-07-03-comprehensive-audit-fixes.md` (Phase 3)
**Dispatch:** One implementer subagent handles all four tasks.
**Working directory:** `D:\worksys\Sadat-RLSCloud\sadat-mls-cloud`
**Current commit:** `3ec4790` (Phase 2 complete)

---

## Task 10: Office Edit (API + UI Modal)

**Files:**
- Create: `src/app/api/admin/offices/route.ts` (PATCH handler)
- Modify: `src/app/[locale]/admin/offices/page.tsx` (edit button + modal)

**Acceptance:**
- API PATCH endpoint:
  - `validateCsrfToken(request)` (403 on invalid)
  - `checkApiRateLimit` or `checkApiRateLimit` for rate limiting
  - Zod schema: `{ id: uuid, name?: string max 200, email?: email, phone?: string max 20, address?: string max 500 }`
  - Use `SUPABASE_SERVICE_ROLE_KEY` + service-role client (like `/api/admin/users`)
  - Update `offices` table by id; return `{ success: true }` or error JSON
- UI:
  - Add an "Edit" button per office row (use Edit icon from lucide-react)
  - Open a modal (existing `src/components/ui/Modal.tsx`) pre-filled with current values
  - On submit: PATCH `/api/admin/offices` with CSRF
  - On success: refresh list, show toast, close modal
- Commit: `feat: add office edit functionality with API endpoint and edit modal`

---

## Task 11: Contact Request Status Updates

**Files:**
- Create: `supabase/migrations/<timestamp>_contact_request_status.sql`
- Modify: `src/app/[locale]/dashboard/contact-requests/page.tsx`
- Modify: `src/app/[locale]/admin/contact-requests/page.tsx`

**Acceptance:**
- Migration: `ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved'));`
- Add a `<select>` or 3-button group per row to change status
- Add a PATCH handler in `/api/admin/contact-requests` route (create it if missing) — or extend existing endpoints — to update status. Must include CSRF, rate limit, Zod validation.
- Run migration file via `supabase db push --linked` (DO NOT execute; just write the SQL for the user to apply).
- Commit: `feat: add contact request status updates with pending/read/resolved workflow`

**Note on tests:** If you create the migration, document its filename + notes in your report so the orchestrator knows to apply it.

---

## Task 12: Agent Edit and Status Toggle

**Files:**
- Modify: `src/app/api/agents/route.ts` (add PATCH handler)
- Modify: `src/app/[locale]/dashboard/agents/page.tsx` (edit button + modal + status toggle)

**Acceptance:**
- API PATCH:
  - CSRF + rate limit (use the existing `agents-patch:{ip}` key or similar)
  - Zod schema: `{ id: uuid, full_name?: string max 200, email?: email, is_active?: boolean }`
  - Use service-role client for the update
  - Authorization: OFFICE_ADMIN can only edit agents in their office; SUPER_ADMIN can edit any
- UI:
  - "Edit" button per agent row
  - Edit modal: full_name, email, is_active toggle
  - Update on submit
- Commit: `feat: add agent edit and status toggle functionality`

---

## Task 13: User Edit and Status Toggle

**Files:**
- Read: `src/app/api/admin/users/route.ts` (verify PATCH handler)
- Modify: `src/app/[locale]/admin/users/page.tsx` (edit button + modal)

**Acceptance:**
- Read `/api/admin/users` route — if PATCH handler exists, use it. Otherwise add one mirroring `/api/agents` PATCH pattern (CSRF + rate limit + Zod).
- UI:
  - "Edit" button per user row
  - Edit modal: full_name, email, role, is_active toggle
  - Update on submit
- Commit: `feat: add user edit and status toggle functionality`

---

## Global Constraints

- `import "server-only"` for any new server-only modules
- CSRF double-submit cookie via `validateCsrfToken` from `@/lib/security/csrf`
- Rate limit via `checkApiRateLimit(key, request)` from `@/lib/security/rateLimit`
- Zod schemas for ALL user input
- `logger` for error logging (NEVER console.error)
- i18n keys for all user-visible strings (add to both `src/i18n/ar.json` and `src/i18n/en.json` if missing)
- Use `useCsrfHeaders` / `getCsrfHeaders` client-side
- Use `useToast` from `@/components/ui/Toast`
- Use `usePageLocale` from `@/hooks/usePageLocale`
- `dict.common.delete`, `dict.common.cancel`, `dict.common.save`, `dict.common.edit`, etc. should already exist

---

## Verification Before Each Commit

```bash
npx tsc --noEmit
npm run test:run
```

If you add tests for the new functionality, even better.

---

## Report to: `docs/superpowers/reports/10-13-phase3-crud.md`

For each task:
- Status (DONE / DONE_WITH_CONCERNS / BLOCKED)
- Files changed
- Test evidence
- Migration files written (Task 11 only)
- Concerns

Then a summary: tasks done, commits, tests, concerns.

Back-report under 15 lines: status, tasks done, commits, one-line test, concerns, report path.