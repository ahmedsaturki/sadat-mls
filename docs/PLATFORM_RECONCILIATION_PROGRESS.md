# Platform Reconciliation Progress

## Current state

**PRODUCTION-VERIFIED Aqarat OS public property contract — runtime reconciliation and hardening complete for the verified release baseline.**

Verified on **2026-09-20**:

- Certified runtime baseline: `22f366cbc00200a1c19f249bfb4f2136a599de30` (PR #28).
- Documentation-only commits may advance `main` after PR #28 without changing the certified runtime contract.
- Certified runtime production deployment: `dpl_4BCsj35gTojSyWrPKxhsX1hny4RZ` (**READY**).
- Self-hosted runtime verification run #50: **SUCCESS**.
- Hosted CI run #706 rerun attempt 2: **FAILURE before any job steps were created**; tracked separately under Issue #25.
- Production runtime error sweep for the selected 24-hour window: no runtime errors.

## Verified live database facts — 2026-09-20

- Supabase project: `aaxauqznfhcvgevfczye`.
- The database follows the Aqarat OS migration lineage.
- `properties` contains the current public property model.
- Current live active property count: 2.
- `people` contains business-person data but no verified Auth identity mapping column.
- No live relations matching `offices`, `public.users`, `zones`, `property_types`, `property_images`, or `property_favorites` are present.
- `rate_limit_state` and `security_rate_limits` exist as private operational relations.
- The public-property and internal-table hardening migrations are applied in production.
- Supabase security advisor findings are informational: RLS is enabled with no public policies on the two private rate-limit state tables. This is intentional.
- Supabase performance advisor reports unused indexes. No indexes are removed solely from low-volume usage telemetry.

## Completed reconciliation work

### Public property path

- `/[locale]/explore` reads the live `properties` contract.
- Active visibility uses `status = 'active'`.
- Search/filter/sort uses Aqarat fields.
- `/[locale]/explore/[id]` reads only approved public property columns.
- Landing-page featured properties use the public read client and exact matching counts.
- Comparison reads use the same public property contract.
- Health probes the public property contract instead of retired legacy relations.
- The public property API is bounded and independent from privileged Supabase credentials.

### Database security

- RLS policy `public_read_active_properties` permits public reads only for active properties.
- Anonymous/authenticated property reads are restricted to approved public columns.
- Internal fields `confidence`, `parcel_number`, `installments_clear`, and `canonical_key` are excluded from public reads.
- Direct privileges on internal Aqarat relations were revoked for `anon` and `authenticated` as defense-in-depth.
- The temporary SECURITY DEFINER public-read RPC was removed.

### Authentication

- Browser, middleware, and server Auth clients use the verified canonical Supabase public configuration.
- Supabase Auth is the identity source.
- User-editable metadata is never trusted for authorization roles.
- Auth listener cleanup is deterministic.
- Protected role/organization mapping fails closed because no authoritative Auth ↔ `people` mapping exists yet.

### Rate limiting

- Public property API: 60 requests/minute/IP in bounded memory.
- Health: 100 requests/minute/IP in bounded memory.
- Login: 5 attempts/15 minutes/IP.
- Forgot password: 3 requests/hour/IP.
- Resend verification: 5 requests/hour/IP.
- Contact: 5 requests/hour/IP.
- Protected database rate limiting fails closed when its privileged dependency is unavailable.

### Runtime retirement

- Unsupported commissions/messages/notifications/offers/referrals/activity/office-comparison execution paths were retired.
- Dead clients, wrappers, buttons, hooks, and obsolete tests were removed.
- The mock AI-description endpoint was removed rather than exposed as a fake service.
- Saved-search and favorites remain explicitly non-persistent until an authoritative ownership contract exists.

## Schema-lineage reproducibility gap

The live migration history contains the Aqarat OS lineage beginning with `20260814163031`, including the subsequent intake, discovery, intelligence/content, release-governance, rate-limit, and public-property/security migrations.

The repository migration directory does **not** yet contain that complete August lineage. It also still contains the historical 2024 Sadat MLS migration series. Several legacy helper/seed files reference retired tables and must not be executed against the current Aqarat production model.

This is now explicitly tracked as **Issue #30**. The remediation path is:

1. Pull the authoritative production schema into a reviewed local baseline migration.
2. Verify `supabase db reset` from the resulting migration chain on the local machine.
3. Quarantine obsolete legacy migration/seed material so `supabase/migrations` contains only the executable authoritative chain.
4. Re-run type generation, contract checks, self-hosted verification, and production verification.
5. Freeze the reconciled schema lineage as the new repository baseline.

No destructive remote reset is required; do not use `supabase db reset --linked` during this reconciliation.

## CI/CD and deployment hygiene

- Hosted CI keeps its independent secret-dependent type-generation, E2E, build, and production-health gates.
- Dedicated self-hosted verification validates the provisioned Node 24/npm toolchain directly.
- Self-hosted runtime verification run #50 passed end-to-end.
- Supabase CLI usage for generated types is project-local.
- Schema contract guard scans application runtime source under `src`.
- Production health verification retries the real production endpoint.
- Stale Vercel Cron configuration was removed because its referenced routes no longer exist.
- The PWA service worker uses network-first navigation for listing pages.

## Deliberate unresolved product contracts

1. Supabase Auth ↔ business `people` identity and organization/role mapping.
2. Property media/image persistence and storage ownership.
3. Favorite persistence.
4. Saved-search persistence/ownership.
5. Historical office/admin/agent workflows based on the retired relational model.

No compatibility tables or guessed relationships are created merely to make these features appear complete.

## Governing rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree. Unknown mappings remain unknown until verified.
