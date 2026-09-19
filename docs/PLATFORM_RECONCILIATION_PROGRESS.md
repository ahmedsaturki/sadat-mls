# Platform Reconciliation Progress

## Current state

**PRODUCTION-VERIFIED Aqarat OS public property contract — reconciliation and hardening complete for the verified release baseline (2026-09-19).**

The connected Supabase project is treated as the authoritative Aqarat OS source of truth for the currently delivered public property experience. The original platform mismatch that blocked PR #14 has been reconciled for the certified public surface. PR #26 retired remaining legacy runtime paths, and PR #28 removed the remaining dead/unadvertised mock feature implementations.

Latest verified release baseline:
- Main merge commit: `51e01617f94a3352b963b774fa18b538a4a6cb78` (PR #27 documentation baseline)
- Production deployment: `dpl_2f6Q5agnHCNAyZvXPh84qtsD7HWa` (READY)
- PR #28 cleanup self-hosted verification: run #44 — SUCCESS
- Runtime contract baseline before documentation update: PR #26 / `b8c24888f3507135ef9fd0fda200a1076a9efa98`
- Production runtime error sweep: clean for the selected 24-hour window

## Verified live database facts — 2026-09-19

- Supabase project: `aaxauqznfhcvgevfczye`.
- The database follows the Aqarat OS migration lineage.
- `properties` contains the current public property model.
- Current live active property count: 2.
- `people` contains business-person data but no verified Auth identity mapping column.
- No live relations matching `offices`, `public.users`, `zones`, `property_types`, `property_images`, or `property_favorites` are present.
- `rate_limit_state` and `security_rate_limits` exist as private operational relations.
- `increment_rate_limit(text, inet, timestamptz)` and `increment_security_rate_limit(text, inet, timestamptz)` exist.

## Completed reconciliation work

### Public property path

- `/[locale]/explore` reads the live `properties` contract.
- Active visibility uses `status = 'active'`.
- Search/filter/sort uses Aqarat fields.
- `/[locale]/explore/[id]` reads only approved public property columns.
- Landing-page featured properties use the public read client and the exact matching count.
- Comparison reads use the same public property contract.
- Health probes the public property contract instead of retired legacy relations.
- The public property API is bounded and independent from privileged Supabase credentials.

### Database security

- RLS policy `public_read_active_properties` permits public reads only for active properties.
- Anonymous/authenticated property reads are restricted to approved public columns through column-level grants.
- Internal fields `confidence`, `parcel_number`, `installments_clear`, and `canonical_key` are not publicly selectable.
- Direct privileges on internal Aqarat relations such as `contacts`, `property_people`, `provenance`, `source_records`, `sources`, `discovery_entities`, `entity_matches`, `lead_signals`, and `publications` were revoked for `anon` and `authenticated` as defense-in-depth.
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

### CI/CD and deployment hygiene

- Hosted CI keeps its independent secret-dependent type-generation, E2E, build, and production-health gates.
- The dedicated self-hosted verification workflow validates the provisioned Node 24/npm toolchain directly.
- The self-hosted workflow no longer invokes the previously unstable `actions/setup-node` admission path.
- Self-hosted main verification run #14 passed end-to-end after PR #22 merge.
- Supabase CLI is invoked from the installed project dependency rather than an unpinned global install.
- Checked-in Supabase types are compared against live generated types.
- Schema contract guard scans all application source under `src`.
- Production health verification retries the real production endpoint.
- Stale Vercel Cron configuration was removed because its referenced routes no longer exist.
- The PWA service worker caches only verified existing shell paths and uses network-first navigation to avoid indefinitely stale listing pages.

## Migration history

The public property read contract is registered in Supabase as:

`20260918152055_public_property_read_contract`

The internal-table privilege hardening is registered as:

`20260918153026_revoke_public_internal_table_grants`

Repository migration filenames match both applied versions.

## Production verification record

Verified against production on 2026-09-19 after PR #22 merge:
- `GET /api/health` → 200 with both Supabase and property checks OK.
- `GET /api/properties` → 200 with 2 active properties in the verified dataset.
- Representative district filter → 200 with the expected empty/non-matching result for that query.
- Arabic and English Explore routes → 200.
- Arabic login route → 200.
- Vercel production deployment `dpl_7agqPn318u1uqZVvnFwNjyEYoVXY` → READY after PR #26.
- Documentation production deployment `dpl_2f6Q5agnHCNAyZvXPh84qtsD7HWa` → READY after PR #27.
- PR #28 self-hosted verification run #44 → SUCCESS.
- Vercel runtime error sweep → no runtime errors in the selected 24-hour window.
- Security headers remained present in production.

## Deliberate unresolved product contracts

These remain intentionally fail-closed/retired rather than being simulated:

1. Supabase Auth ↔ business `people` identity and organization/role mapping.
2. Property media/image persistence and storage ownership.
3. Favorite persistence.
4. Saved-search persistence/ownership.
5. Historical office/admin/agent workflows based on the retired relational model.

There is no authoritative live schema evidence for these replacements yet. No compatibility tables are created merely to make them appear complete.

## Governing rule

A feature is complete only when its authoritative data contract, implementation, security boundary, automated verification, and production behavior agree. Unknown mappings remain unknown until verified.
