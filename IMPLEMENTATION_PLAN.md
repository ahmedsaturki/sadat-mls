# Sadat MLS — Delivery & Completion Record

## Status

**PRODUCTION VERIFIED — 2026-09-20**

The certified runtime contract remains the merged PR #28 baseline:

- Runtime release baseline: `22f366cbc00200a1c19f249bfb4f2136a599de30` (PR #28).
- Production deployment for that runtime baseline: `dpl_4BCsj35gTojSyWrPKxhsX1hny4RZ` (**READY**).
- The current `main` branch may contain documentation-only commits after PR #28 without changing the certified runtime contract.
- Independent self-hosted verification run #50: **SUCCESS** across toolchain, install, lint, adapter smoke, typecheck, schema contract, unit/integration tests, build, and diff check.
- Hosted CI run #706, rerun attempt 2: **FAILURE before job steps were created**; `lint` has no steps/runner evidence and all dependent jobs were skipped. This remains an infrastructure/admission issue under Issue #25, not evidence of a repository command failure.
- Production runtime error sweep for the selected 24-hour verification window: no runtime errors.

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

- `dpl_4BCsj35gTojSyWrPKxhsX1hny4RZ` → **READY**, production, runtime commit `22f366cbc00200a1c19f249bfb4f2136a599de30`.
- Self-hosted verification run #50 → **SUCCESS**.
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

A live Supabase migration-history audit on 2026-09-20 found a mismatch that is now tracked explicitly:

- The connected production project records the Aqarat OS migration lineage beginning at `20260814163031` and continuing through the Aqarat migrations and the September public-read/security migrations.
- The repository currently contains the older 2024 Sadat MLS migration series plus the September 2026 public-property/security files, but does not yet contain the full August 2026 Aqarat migration lineage.
- Legacy helper SQL such as `supabase/run_remaining_migrations.sql`, `supabase/seed.sql`, and `supabase/seed_028.sql` references retired tables such as `offices`, `zones`, and `users` and must not be treated as a production migration source.

Therefore the repository is **production-verified but not yet fully reproducible from a clean local Supabase migration chain**.

The required remediation is to pull the authoritative remote schema into a reviewed baseline migration, verify that baseline with a local `db reset`, and then quarantine/remove obsolete legacy migration/seed material from the executable migration path. No destructive remote schema reset is part of this task; any migration-history repair requires an explicit, separately reviewed reconciliation step.

## Open engineering items

### Issue #24 — authoritative Aqarat contracts

Before implementing favorites, saved searches, Auth ↔ `people` identity/organization roles, durable media, or replacement office workflows, an authoritative contract must exist for schema → RLS/auth → API → UI → tests → production verification.

### Issue #25 — hosted CI admission

The hosted workflow remains independent. Runs #706 attempt 2 and #713 continue to fail before steps are created. The repository gates have not been weakened and the dedicated self-hosted verification remains green.

### Issue #30 — schema-lineage reproducibility

The repository needs a clean, reviewable local migration baseline matching the live Aqarat production schema. This is a repository/tooling reconciliation task, not a feature-schema invention task.

## Completion rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree.

Unknown mappings remain unknown until verified. Historical code or schema is never reactivated merely to satisfy tests.
