# Platform Reconciliation Progress

## Current state

**PRODUCTION-VERIFIED Aqarat OS public property contract — runtime reconciliation and hardening complete for the verified release baseline.**

Verified on **2026-09-20**:

- Production release: `1bc3a3de977917d6a973c4f05f7d9930e1a9e726` (PR #41).
- The current `main` runtime is the PR #41 release and has completed a fresh post-merge verification cycle.
- Production deployment: `dpl_9op1XKW8jKRXZnqJNGAs9esSWbm6` (**READY**).
- Self-hosted verification run #101: **SUCCESS**.
- Hosted CI/CD run #820: **SUCCESS**, including E2E and the production health-check; Issue #25 is closed.
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
- Contact: 5 requests/hour/IP via the constrained public database RPC.
- Public auth/CSRF/CSP/contact rate limiting uses the publishable-key path and fails closed when the RPC is unavailable.
- Protected database rate limiting continues to fail closed when its privileged dependency is unavailable.

### Runtime retirement

- Unsupported commissions/messages/notifications/offers/referrals/activity/office-comparison execution paths were retired.
- Dead clients, wrappers, buttons, hooks, and obsolete tests were removed.
- The mock AI-description endpoint was removed rather than exposed as a fake service.
- Saved-search and favorites remain explicitly non-persistent until an authoritative ownership contract exists.

## Schema-lineage reproducibility gap

The live migration history contains the Aqarat OS lineage beginning with `20260814163031`, including the subsequent intake, discovery, intelligence/content, release-governance, rate-limit, and public-property/security migrations.

The repository migration directory now contains the complete authoritative **52-version** Aqarat lineage through `20260920201858`. The historical 2024 Sadat MLS migration series and legacy helper/seed material are no longer in the executable migration path.

This reconciliation gap is **resolved**. Issue #30 is closed, and the repository and live ledger now reconcile 52/52. The remaining workstation-only acceptance checks are local Postgres recreation and exact local type generation. These are environmental proof gates only; production is not used as their fallback.

1. Reproduce the 51 migration chain locally with `supabase db reset` when workstation Docker resources permit.
2. Generate/check local Supabase types from that local stack.
3. Keep the migration verifier and self-hosted verification as the repository regression gate.

No destructive remote reset is required; do not use `supabase db reset --linked` during this reconciliation.

## CI/CD and deployment hygiene

- Hosted CI keeps its independent secret-dependent type-generation, E2E, build, and production-health gates.
- Dedicated self-hosted verification validates the provisioned Node 24/npm toolchain directly.
- Self-hosted runtime verification run #70 passed end-to-end.
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

No compatibility tables or guessed relationships are created merely to make these features appear complete. These remain an intentional contract backlog tracked by Issue #24.

## Governing rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree. Unknown mappings remain unknown until verified.