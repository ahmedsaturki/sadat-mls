# Tasks 7-9 Brief: Phase 2 Security Hardening

**Plan:** `docs/superpowers/plans/2026-07-03-comprehensive-audit-fixes.md` (Phase 2)
**Dispatch:** One implementer subagent handles all three tasks.
**Working directory:** `D:\worksys\Sadat-RLSCloud\sadat-mls-cloud`
**Current commit:** `15f463c` (Phase 1 complete)

---

## Task 7: Add CSRF Validation to Activity API POST

**File:** `src/app/api/activity/route.ts`

**Goal:** The POST endpoint currently lacks CSRF validation. Add `validateCsrfToken` check.

**Acceptance:**
- Read `src/lib/security/csrf.ts` to confirm the `validateCsrfToken` function signature.
- In the POST handler of `src/app/api/activity/route.ts`, BEFORE the rate limit check (or after — either is fine; after rate limit avoids flooding; before avoids using CSRF cookies for unauthenticated attempts). Pick whichever is the codebase convention; check `src/app/api/agents/route.ts` or similar to see the ordering.
- Add `const csrfValid = await validateCsrfToken(request);` and a 403 response if invalid.
- Commit: `fix: add CSRF validation to activity API POST endpoint`

---

## Task 8: Add CSRF Validation to Notifications API

**File:** `src/app/api/notifications/route.ts`

**Goal:** Both POST and PATCH are state-changing and need CSRF validation. GET stays as-is (read-only).

**Acceptance:**
- Add `validateCsrfToken` to POST handler (around line 60).
- Add `validateCsrfToken` to PATCH handler (around line 110).
- Match the ordering convention from Task 7 / other API routes.
- Commit: `fix: add CSRF validation to notifications API POST and PATCH endpoints`

---

## Task 9: Add Password Complexity Validation to Agent & User Creation

**Files:** `src/app/[locale]/dashboard/agents/page.tsx`, `src/app/[locale]/admin/users/page.tsx`

**Goal:** Replace client-side `minLength=8` check with `PasswordService.validate()` which enforces uppercase, lowercase, number, special char.

**Acceptance:**
- Read `src/lib/security/password.ts` — confirm `PasswordService.validate(password)` returns either an error message string (when invalid) or null/undefined (when valid).
- In both pages, find where the password input is validated (likely `if (password.length < 8)` or `<input minLength={8}>`).
- Replace with: `const err = PasswordService.validate(password); if (err) { toast.error(err); return; }`
- Remove or supplement the `minLength={8}` HTML attribute (now handled server-side AND client-side).
- Verify the existing `/api/admin/users` POST and `/api/agents` POST already call `PasswordService.validate()` server-side — if not, add it there too (read those route files).
- Commit: `fix: add PasswordService complexity validation to agent and admin user creation`

---

## Global Constraints (binding)

- **server-only:** Security modules already use `import "server-only"` — keep all security code server-side.
- **CSRF:** Use `validateCsrfToken(request)` from `@/lib/security/csrf` in API routes.
- **Rate limiting:** Already in place via `checkApiRateLimit(key)` — keep that.
- **Zod:** Use existing schemas in `src/lib/validation.ts` or define inline if needed.
- **logger:** From `@/lib/logger` — NEVER console.error.
- **Test:** Run `npx tsc --noEmit` + `npm run test:run` after each task; both must pass.

---

## Verification Before Committing Each Task

```bash
npx tsc --noEmit
npm run test:run
```

Tests must remain at 215+/215+ (or higher if you added new tests).

Run focused test if a specific test exists:
```bash
npx vitest run src/__tests__/<file>
```

---

## Commit Format (conventional commits)

```bash
git add <changed-files>
git commit -m "<type>(scope): <subject>

<body 1-3 lines explaining what and why>"
```

Types: `fix`, `feat`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`. Subject max 100 chars.

---

## When You're in Over Your Head

If you encounter:
- CSRF signature mismatch with `request` type
- PasswordService API surprises
- Routes that can't import `server-only` modules

**STOP and report BLOCKED with details.** Do not invent workarounds.

---

## Report to: `docs/superpowers/reports/7-9-phase2-security.md`

```
# Tasks 7-9 Report: Phase 2 Security Hardening

## Task 7: Activity API CSRF
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED
- Files changed: src/app/api/activity/route.ts
- Test evidence: tsc + vitest results
- Order of checks (CSRF before/after rate limit):
- Concerns: ...

## Task 8: Notifications API CSRF
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED
- Files changed: src/app/api/notifications/route.ts
- Test evidence: ...
- Concerns: ...

## Task 9: Password Complexity Validation
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED
- Files changed: src/app/[locale]/dashboard/agents/page.tsx, src/app/[locale]/admin/users/page.tsx
- Test evidence: ...
- Concerns: ...

## Summary
- Tasks done: N/3
- Commits: list[SHA + subject]
- Tests: X/X passing
- Concerns: ...
```

Report back with ONLY (under 15 lines):
- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
- Tasks completed (e.g., "3/3")
- Commit SHAs
- One-line test summary
- Concerns (if any)
- Report file path
