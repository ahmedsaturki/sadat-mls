# Sadat MLS — Delivery & Completion Record

## Status

**PRODUCTION VERIFIED — 2026-09-19**

Current `main`: `d479181268185fd2558bff98b223b8be4467dd60`  
Current production deployment: `dpl_G39fyD8yi9My4otqFmiZg4AX2NHr` (READY)

The original implementation plan in this repository described the historical Sadat MLS schema and features. That plan is no longer the source of truth.

The delivered product boundary is the verified Aqarat OS public property experience.

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

### Production verification

- Vercel production deployment is READY for the current `main` HEAD.
- `/api/health` is HTTP 200 with Supabase/property checks OK.
- `/api/properties` and representative filters are HTTP 200.
- Arabic/English Explore routes are HTTP 200.
- Active property detail routes are HTTP 200.
- Login route is HTTP 200.
- Latest production runtime error sweep is clean (2026-09-19, selected 24-hour window).

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

For the unresolved areas above, the correct action is not to fabricate a compatibility table or infer missing relationships. A future implementation should begin with an authoritative contract, then follow the same SPEC → IMPLEMENT → TEST → VERIFY → RELEASE discipline used for the current property layer.
