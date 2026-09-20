# Sadat MLS — Delivery & Completion Record

## Status

**PRODUCTION VERIFIED — 2026-09-20**

The certified runtime contract is the merged PR #38 Aqarat OS baseline:

- Runtime release baseline: `8fae65aca77751b45ffef7141d7d55cc7c87e8db` (PR #38).
- Production deployment for that runtime baseline: `dpl_7rPQVen2sF1qCiwcgCiHJdKvzppq` (**READY**).
- `main` is now the verified PR #38 runtime release; subsequent documentation-only commits do not change the certified runtime contract.
- Independent self-hosted verification run #90: **SUCCESS** across migration verification, lint, adapter smoke, typecheck, schema contract, 42 files / 677 tests, build, and diff check.
- Hosted CI/CD post-merge verification run #786 is the current hosted release gate; the repository has not weakened hosted gates.
- Production runtime verification for the current production deployment is healthy; older rate-limit failures were isolated to a previous deployment.

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
- Dedicated self-hosted verification validates the provisioned Node 24/npm toolchain directly and avoids the previously unstable `actions/setup-node` admission path.

## Production verification

Verified against the production deployment of the certified runtime baseline:

- `dpl_7rPQVen2sF1qCiwcgCiHJdKvzppq` → **READY**, production, runtime commit `8fae65aca77751b45ffef7141d7d55cc7c87e8db` (PR #38).
- Self-hosted verification run #90 → **SUCCESS**.
- `GET /api/health` → HTTP 200 with Supabase/property checks OK.
- `GET /api/properties` → HTTP 200.
- Arabic/English Explore routes → HTTP 200.
- Arabic login route → HTTP 200.
- Retired dashboard/office-comparison surfaces remain fail-closed rather than executing legacy data paths.
- Vercel runtime errors for the selected 24-hour window → none.
- Vercel unresolved toolbar threads → none.
- Production security headers remained present, including CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, and Referrer-Policy.

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

Issue #30 is **resolved**. The repository contains the complete authoritative 41-version Aqarat OS migration lineage through `20260918171827`; obsolete 2024 migrations and legacy seed/helper SQL are outside the executable migration path, and the linked production migration history reconciles 41/41.

The only remaining acceptance gates are workstation-local: prove that the 41 migrations replay cleanly with `supabase db reset` and regenerate Supabase TypeScript types from that local database with an exact match to `src/lib/supabase/types.ts`.

No destructive remote reset, migration repair, or production schema push is required or permitted for this reconciliation.

## Open engineering items

### Issue #24 — authoritative Aqarat contracts

Before implementing favorites, saved searches, Auth ↔ `people` identity/organization roles, durable media, or replacement office workflows, an authoritative contract must exist for schema → RLS/auth → API → UI → tests → production verification.

### Issue #25 — hosted CI admission

**Closed.** The current hosted pipeline completed its post-merge verification for PR #38; historical hosted admission failures no longer describe the current release state.

### Issue #30 — schema-lineage reproducibility

**Closed.** The repository now contains the authoritative 41-version Aqarat OS migration lineage through `20260918171827`, and linked production/local migration history reconciles 41/41. The remaining workstation-only proof is a local Postgres replay and exact local type-generation check when Docker storage/port health permits.

## Completion rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree.

Unknown mappings remain unknown until verified. Historical code or schema is never reactivated merely to satisfy tests.