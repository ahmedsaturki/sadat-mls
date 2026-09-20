# Sadat MLS — Delivery & Completion Record

## Status

**PRODUCTION VERIFIED — 2026-09-20**

The certified runtime contract is the merged PR #41 Aqarat OS baseline:

- Runtime release: `1bc3a3de977917d6a973c4f05f7d9930e1a9e726` (PR #41).
- Production deployment: `dpl_9op1XKW8jKRXZnqJNGAs9esSWbm6` (**READY**).
- Self-hosted verification run #101: **SUCCESS** across migration verification, lint, adapter smoke, typecheck, schema contract, tests, build, and diff check.
- Hosted CI/CD run #820: **SUCCESS**, including E2E and production health-check.
- The public runtime no longer depends on the lost Supabase privileged secret for auth/CSRF/CSP/contact rate-limit operations.

This record is the release source for exact verified baseline identifiers. Subsequent documentation-only commits may advance `main` without changing the certified runtime contract; any runtime-affecting change requires a fresh verification cycle.

The original implementation plan described the historical Sadat MLS relational model. That model is not the source of truth for the connected production database.

## Completed

### Platform reconciliation

- Reconciled public property reads to the live Aqarat OS `properties` contract.
- Replaced legacy active-state assumptions with `status = 'active'`.
- Replaced legacy geography/property fields with the live Aqarat fields.
- Restricted anonymous/authenticated property reads with RLS plus column-level grants.
- Removed the temporary public SECURITY DEFINER read path.
- Recorded the public-property and internal-table hardening migrations in Supabase.
- Regenerated checked-in Supabase types.

### Application reliability

- Centralized verified Supabase public configuration.
- Removed stale public Supabase environment dependencies from the main server/browser clients.
- Hardened server-side Auth construction to use the same canonical public configuration.
- Fixed Auth listener lifecycle cleanup and added an actual refresh operation.
- Fixed homepage property-count reporting so it reflects the live public query count.
- Hardened property-detail canonical/Open Graph URL construction with the verified production fallback.
- Kept public property and health rate limiting independent from privileged Supabase credentials.

### Authentication and request protection

- Kept authorization roles fail-closed when the Auth ↔ business-person mapping is not authoritative.
- Login rate limiting: 5 attempts / 15 minutes / IP.
- Forgot-password rate limiting: 3 requests / hour / IP.
- Resend-verification rate limiting: 5 requests / hour / IP.
- Preserved CSRF protection for state-changing flows.
- Kept database-backed protected rate limiting fail-closed when the protected primitive is unavailable.
- Removed duplicate login rate-limit consumption around failed sign-in.

### Legacy/runtime retirement

PR #26 retired unsupported notification, office-comparison, and historical dashboard execution paths and removed their dead clients/tests.

PR #28 additionally removed:

- the unadvertised mock AI-description endpoint;
- the browser-only saved-search hook;
- the disabled `FavoriteButton`;
- obsolete tests for those dead/mock surfaces.

No replacement compatibility schema was invented.

### CI/CD

- Hosted CI uses Node 24 and reproducible `npm ci`.
- Supabase type generation uses the repository-installed CLI.
- Production health checks retry the real production endpoint instead of assuming a fixed deployment delay.
- The schema contract guard scans runtime application source and blocks known legacy runtime contracts.
- Dedicated self-hosted verification validates the provisioned Node 24/npm toolchain directly.
- Hosted CI/CD is now executing successfully again; Issue #25 is closed after the successful post-merge pipeline.

## Production verification

Verified on the merged PR #41 runtime:

- `dpl_9op1XKW8jKRXZnqJNGAs9esSWbm6` → **READY**, production, commit `1bc3a3de977917d6a973c4f05f7d9930e1a9e726`.
- Self-hosted verification run #101 → **SUCCESS** across migration verification, lint, adapter smoke, typecheck, schema contract, tests, build, and diff check.
- Hosted CI/CD run #820 → **SUCCESS**, including E2E and production health-check.
- `GET /api/health` → HTTP 200 with `supabase_api=ok` and `properties=ok`.
- `GET /api/properties` → HTTP 200 with the current 2 active production properties.
- `/ar/explore` and `/en/explore` → HTTP 200.
- Direct production smoke confirmed the current security headers remain present, including CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, and Referrer-Policy.
- Current runtime error sweep for the selected window → none.
- Public auth/CSRF/CSP/contact rate-limit operations no longer require the lost privileged Supabase key.

## Current product boundary

| Area | Current state |
|---|---|
| Public property browsing | **Delivered / verified** |
| Property detail | **Delivered / verified** |
| Search/filter/sort | **Delivered / verified** |
| Supabase Auth entry point | **Delivered / verified** |
| Public inquiry flow | **Delivered / verified where the Aqarat contact contract is available** |
| Auth ↔ business `people` identity | **Unresolved / fail-closed** |
| Property media persistence | **Unresolved / placeholder only** |
| Favorites persistence | **Unresolved / not persisted** |
| Saved searches | **Unresolved / not persisted** |
| Historical office/admin/agent workflows | **Retired until authoritative Aqarat replacements exist** |
| Historical 2024 relational schema | **Historical only; not authoritative for production** |

## Schema-lineage reproducibility

Issue #30 is **resolved**. The repository contains the complete authoritative 51-version Aqarat OS migration lineage through `20260920174801`; obsolete 2024 migrations and legacy seed/helper SQL are outside the executable migration path, and the linked production migration history reconciles 51/51.

The only remaining acceptance gates are workstation-local: prove that the 41 migrations replay cleanly with `supabase db reset` and regenerate Supabase TypeScript types from that local database with an exact match to `src/lib/supabase/types.ts`.

No destructive remote reset, migration repair, or production schema push is required or permitted for this reconciliation.

## Open engineering items

### Issue #24 — authoritative Aqarat contracts

Before implementing favorites, saved searches, Auth ↔ `people` identity/organization roles, durable media, or replacement office workflows, an authoritative contract must exist for schema → RLS/auth → API → UI → tests → production verification.

### Issue #25 — hosted CI admission

**Closed.** The hosted workflow is now executing normally. Main run #820 completed successfully, including E2E and the production health-check; repository gates were not weakened.

### Issue #30 — schema-lineage reproducibility

**Closed.** The repository now contains the authoritative 51-version Aqarat OS migration lineage through `20260920174801`, and linked production/local migration history reconciles 51/51. The remaining workstation-only proof is a local Postgres replay and exact local type-generation check when Docker storage/port health permits.

## Completion rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree.

Unknown mappings remain unknown until verified. Historical code or schema is never reactivated merely to satisfy tests.