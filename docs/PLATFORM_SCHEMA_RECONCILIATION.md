# Platform Schema Reconciliation

## Final status

**RECONCILIATION COMPLETE FOR THE VERIFIED Aqarat OS PUBLIC PROPERTY CONTRACT — 2026-09-20**

This document is now a completion record. The connected production database is treated as the Aqarat OS source of truth for the currently delivered public property experience.

## Verified live lineage

The connected Supabase project is on the Aqarat OS migration lineage beginning with `initial_aqarat_os_schema` and continuing through intake, discovery, intelligence/content, publication, audit, and security hardening migrations.

The live public schema includes the Aqarat entities used by the platform, including:

`properties`, `people`, `contacts`, `property_people`, `sources`, `source_records`, `provenance`, `intake_events`, `jobs`, `sync_projections`, `discovery_sources`, `discovery_runs`, `discovery_jobs`, `discovery_evidence`, `discovery_permission_evidence`, `discovery_entities`, `entity_matches`, `lead_signals`, `leads`, `interests`, `interactions`, `content_items`, `content_variants`, `content_performance`, `marketing_experiments`, `review_queue`, `publication_jobs`, `publications`, and `audit_events`.

The live database also contains private operational `rate_limit_state` and `security_rate_limits` relations.

## Public property contract

The production application reads active properties through:

- `status = 'active'`;
- the verified Aqarat property columns;
- RLS policy `public_read_active_properties`;
- column grants for `anon` and `authenticated`.

The public allowlist intentionally excludes `confidence`, `parcel_number`, `installments_clear`, and `canonical_key`.

The public read migration is registered in Supabase as:

`20260918152055_public_property_read_contract`

and the repository migration filename is synchronized to that version.

## Resolved legacy assumptions

The application no longer relies on legacy runtime database relations/fields for the certified public property path.

The deterministic guard `npm run contract:check` scans all application source under `src` and fails on known legacy runtime relations, status values, or property fields.

The historical relations below are therefore not recreated merely for compatibility:

- `offices`
- `public.users`
- `zones`
- `property_types`
- `property_images`
- `property_owners`
- `contact_requests`
- `property_favorites`

## Verified production checks

Current production verification includes:

- `/api/health` → HTTP 200.
- `/api/properties` → HTTP 200.
- Representative property filters → HTTP 200.
- `/ar/explore` and `/en/explore` → HTTP 200.
- Active property detail routes → HTTP 200.
- `/ar/login` → HTTP 200.
- Post-merge runtime verification on the new production deployment returned successful health/property/detail requests; older rate-limit errors were tied to the previous deployment.

The production deployment for merged PR #41 is READY at `dpl_9op1XKW8jKRXZnqJNGAs9esSWbm6`. Hosted and self-hosted verification both passed after the merge.

## Intentionally unresolved contracts

The following are explicitly outside the certified boundary until authoritative replacements are available:

| Area | Reason |
|---|---|
| Auth ↔ `people` identity | Live `people` has no verified Auth identity column or equivalent mapping. |
| Property media | No live property media/image relation or verified storage contract is present. |
| Favorites | No live favorite persistence relation or ownership contract is present. |
| Saved searches | No verified current persistence/ownership contract is present. |
| Historical office/admin/agent workflows | Their relational dependencies are not present in the current live Aqarat schema. |

These items remain fail-closed/retired. They are not represented as complete features.

## Safety rules

- Never recreate a retired table solely to satisfy a UI or test.
- Never weaken E2E checks to conceal a schema mismatch.
- Never infer authorization roles from user-editable metadata.
- Never expose internal Aqarat property fields through public convenience queries.
- Never mark an unknown relationship as resolved without authoritative evidence.


## Migration lineage release note

- Authoritative production migration ledger: **51/51** reconciled through `20260920174801`.
- Runtime baseline: `1bc3a3de977917d6a973c4f05f7d9930e1a9e726` via PR #41.
- Self-hosted Verification run #101: **SUCCESS**; hosted CI/CD run #820: **SUCCESS**.
- Issue #30: **closed** after authoritative lineage reconciliation.
