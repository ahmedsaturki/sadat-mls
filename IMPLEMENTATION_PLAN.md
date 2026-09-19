# Sadat MLS — Delivery & Completion Record

## Status

**PRODUCTION VERIFIED — 2026-09-19**

This record's latest verified runtime release baseline is the merged PR #28 commit:

- Main release commit: `b8c24888f3507135ef9fd0fda200a1076a9efa98`
- Production deployment: `dpl_7agqPn318u1uqZVvnFwNjyEYoVXY` (READY)
- Production: https://sadat-mls.vercel.app
- Supabase project: `aaxauqznfhcvgevfczye`
- Post-merge self-hosted verification: run #39 — **SUCCESS** across toolchain, install, lint, adapter smoke, typecheck, schema contract, unit/integration tests, build, and diff check.
- Production smoke after the release: health/property APIs, representative filter, Arabic/English Explore, and Arabic login all returned HTTP 200.
- Vercel runtime error sweep for the verified 24-hour window: no runtime errors.

This document records a verified release baseline, not a promise that the repository HEAD can never advance. Subsequent documentation-only commits may move `main` without changing the certified runtime contract; re-verify any runtime change before calling it a new release.

The original implementation plan in this repository described the historical Sadat MLS schema and features. That plan is no longer the source of truth.

PR #26 retired unverified legacy runtime surfaces and removed dead notification, office-comparison, and dashboard clients/tests. PR #28 removed remaining dead/unadvertised mock feature implementations and tests. The delivered product boundary remains the verified Aqarat OS public property experience.

## Completed

### Platform reconciliation

- Reconciled public property reads to `properties`.
- Replaced legacy active-state assumptions with `status = 'active'`.
- Replaced legacy geography/property fields with the live Aqarat fields.
- Restricted anonymous/authenticated property reads with RLS plus column-level grants.
- Removed the temporary public SECURITY DEFINER read path.
- Recorded the public-property migration in Supabase migration history and synchronized the repository filename to the applied migration version.
- Regenerated checked-in Supabase types.

### Application reliability

- Centralized verified Supabase public configuration.
- Removed stale public Supabase environment dependencies from the main server/browser clients.
- Hardened server-side Auth construction to use the same canonical public configuration.
- Fixed Auth listener lifecycle cleanup and added an actual refresh operation.
- Fixed homepage property-count reporting so it reflects the live public query count.
- Hardened property detail canonical/open-graph URL construction with the verified production fallback.
- Kept public property and health rate limiting independent from the broken/stale privileged-key path.

### Authentication and request protection

- Kept authorization roles fail-closed when the Auth ↔ business-person mapping is not authoritative.
- Aligned login rate limiting to 5 attempts per 15 minutes.
- Aligned forgot-password limiting to 3 requests per hour.
- Added a dedicated 5-per-hour resend-verification limit.
- Removed the duplicate login rate-limit consumption that occurred around a failed sign-in.
- Preserved CSRF protection for state-changing flows.
- Kept database-backed protected rate limiting fail-closed when the privileged primitive is unavailable.

### CI/CD

- CI uses Node 24 and reproducible `npm ci`.
- Supabase type generation uses the repository's installed CLI instead of an unpinned global install.
- Production health checks retry the verified production endpoint instead of assuming a fixed 30-second deployment delay.
- The schema contract guard scans all application source under `src` while excluding test-only trees.
- The dedicated self-hosted runner now validates its provisioned Node 24/npm toolchain directly and no longer depends on the previously unstable `actions/setup-node` admission path.

### Production verification

- Vercel production deployment `dpl_4BCsj35gTojSyWrPKxhsX1hny4RZ` is READY for merge commit `22f366cbc00200a1c19f249bfb4f2136a599de30`.
- Post-merge self-hosted verification run #48 completed successfully across install, lint, adapter CLI smoke, typecheck, schema contract, unit/integration tests, build, and diff check.
- `/api/health` is HTTP 200 with Supabase/property checks OK.
- `/api/properties` and a representative district filter are HTTP 200.
- Arabic/English Explore routes are HTTP 200.
- Arabic login route is HTTP 200.
- Latest production runtime error sweep is clean for the selected 24-hour window.
- Production security headers remain present, including CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, and Referrer-Policy.

## Current product boundary

The following areas remain deliberately outside the certified product contract because authoritative live replacements are not present:

| Area | Current state |
|---|---|
| Public property browsing | **Delivered / verified** |
| Property detail | **Delivered / verified** |
| Search/filter/sort | **Delivered / verified** |
| Supabase Auth entry point | **Delivered / verified** |
| Auth ↔ business `people` identity | **Unresolved / fail-closed** |
| Property media persistence | **Unresolved / placeholder only** |
| Favorites persistence | **Unresolved / not persisted** |
| Saved searches | **Unresolved / not persisted** |
| Historical office/admin/agent workflows | **Retired until replaced by authoritative Aqarat contracts** |
| Historical 2024 database schema | **Not authoritative for the connected production database** |

## Completion rule

A feature is marked complete only when its live data contract, implementation, security boundary, test coverage, and production behavior are all verified.

For the unresolved areas above, the correct action is not to fabricate a compatibility table or infer missing relationships. A future implementation should begin with an authoritative contract, then follow the same SPEC → IMPLEMENT → TEST → VERIFY → RELEASE → FREEZE discipline used for the current property layer.
