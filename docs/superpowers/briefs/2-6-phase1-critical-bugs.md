# Tasks 2-6 Brief: Phase 1 Critical Bug Fixes (Remainder)

**Plan:** `docs/superpowers/plans/2026-07-03-comprehensive-audit-fixes.md` (Phase 1)
**Dispatch:** One implementer subagent handles all five tasks.
**Working directory:** `D:\worksys\Sadat-RLSCloud\sadat-mls-cloud`

---

## Task 2: Profile Property Name Consistency

**Files:** `src/app/[locale]/dashboard/properties/page.tsx`, `src/app/[locale]/dashboard/settings/page.tsx`

**Goal:** Verify `profile.officeId` (camelCase from `useAuthUser`) is used consistently on dashboard pages. Server-side Supabase queries use `office_id` (snake_case) when filtering — that is correct; client component receives camelCase from the hook.

**Acceptance:**
- Confirm `useAuthUser`'s User type has `officeId` (camelCase) — read `src/hooks/useAuthUser.tsx`.
- Read the two dashboard pages; if `.eq("office_id", profile.office_id)` is found anywhere, change to `profile.officeId` OR adjust hook if reverse is true.
- Run `npx tsc --noEmit` and `npm run test:run` — both must pass.

---

## Task 3: Toast Dismiss Button Locale

**Files:** `src/components/ui/Toast.tsx`

**Problem:** Dismiss button always shows English text (likely from hardcoded string or from a direct `en.json` import).

**Acceptance:**
- Read `src/components/ui/Toast.tsx`. Find any hardcoded "Dismiss"/"Close" English text.
- Replace with a locale-aware approach: detect locale via `usePageLocale(params)` if Toast is rendered inside a page, OR receive a dict prop, OR detect from `window.location.pathname.startsWith("/en") ? "en" : "ar"` as a last resort.
- Add `dict.common.dismiss` keys to `src/i18n/ar.json` and `src/i18n/en.json` if not present.
- Run tests + tsc.

---

## Task 4: RTL/LTR Positioning Bugs

**Files:** `src/components/ui/PaginatedTable.tsx`, `src/components/properties/SearchFilters.tsx`, `src/components/properties/PropertyCard.tsx`, `src/components/layout/NotificationsBell.tsx`

**Goal:** Replace `right-*`/`left-*` absolute positioning with RTL-aware variants. The project uses `dir="rtl"` on `<html>` for Arabic and `dir="ltr"` for English. Use a `dir` value or prop to flip between left/right.

**Acceptance:**
- Search icon in PaginatedTable is currently at `absolute right-3` — flip based on dir.
- Same for SearchFilters search icon.
- PropertyCard action buttons at `absolute top-2 right-2` — flip.
- NotificationsBell dropdown `absolute right-0` — flip.
- Test passes; tsc passes.

---

## Task 5: Orphaned Office Rollback on Agent Creation Failure

**Files:** `src/app/[locale]/admin/offices/page.tsx`

**Goal:** When a new office is created (POST) and then an admin agent is created, if the agent creation fails, delete the office to avoid orphaned data.

**Acceptance:**
- After `await supabase.from("offices").insert(...)` returns an office, when the subsequent admin user creation fails (via the `/api/agents` POST endpoint), call `supabase.from("offices").delete().eq("id", office.id)`.
- Show a toast error: `dict.admin.offices.agentCreationFailed` (add this i18n key if missing in both `src/i18n/ar.json` and `src/i18n/en.json`).
- Abort UI flow gracefully.

---

## Task 6: Remove Redundant Health Endpoint (if exists)

**Files:** Check and remove `src/app/api/health.ts` if it exists. Keep `src/app/api/health/route.ts`.

**Goal:** If two health endpoints exist (`api/health.ts` and `api/health/route.ts`), delete `api/health.ts`.

**Acceptance:**
- Run `Get-ChildItem -Path src/app/api -Recurse -Filter "health*"` (or equivalent bash command) to confirm only `src/app/api/health/route.ts` exists.
- If `src/app/api/health.ts` is found, delete it.
- Commit `fix: remove redundant health endpoint that leaks environment info` (only if deleted).
- If `api/health.ts` does NOT exist, document that in the report and skip the commit.

---

## Global Constraints (apply to all tasks)

- **Default locale:** Arabic (RTL). All user-visible strings via `dict.*` (i18n keys in `src/i18n/ar.json` + `src/i18n/en.json`).
- **Auth:** Email/password via Supabase, no OAuth.
- **Roles:** `super_admin`, `office_admin`, `office_agent`.
- **Logger:** Use `logger.error` / `logger.warn` from `@/lib/logger`, never `console.error` directly.
- **CSP nonces:** Apply `nonce` to any new `<script>` injection.
- **CSRF double-submit cookie:** Use `validateCsrfToken` server-side; client uses `getCsrfToken()`.
- **Rate limiting:** Use `checkRateLimit(key, request)` server-side for any new POST/PATCH/DELETE routes.
- **Zod:** Use Zod schemas from `src/lib/validation.ts` for any new user input.
- **Tests:** Vitest + @testing-library/react. e2e for browser flows.

---

## Verification Before Committing Each Task

1. `npx tsc --noEmit` → 0 errors
2. `npm run lint` → 0 errors
3. `npm run test:run` → 215+/215+ passing
4. Run focused test for files you changed: `npx vitest run <file-pattern>` if a specific test exists.

Commit per task:
```bash
git add <changed-files>
git commit -m "<type>: <subject>

<body explaining the fix>"
```

Use **conventional commit** format. Max 100 chars/line in subject.

---

## When You're in Over Your Head

If you hit:
- An architectural change the plan doesn't cover
- A subtle Supabase RLS behavior
- Conflicting tests or types

**STOP and report BLOCKED with details.** Do not silently invent solutions.

---

## Report to: `docs/superpowers/reports/2-6-phase1-critical-bugs.md`

For each task (2, 3, 4, 5, 6):
- Status (DONE/DONE_WITH_CONCERNS/BLOCKED)
- Files changed
- Test evidence (command + result)
- Concerns

Then report back with:
- Status summary (all DONE? any BLOCKED?)
- Commit SHAs
- One-line test outcome
- Report path
