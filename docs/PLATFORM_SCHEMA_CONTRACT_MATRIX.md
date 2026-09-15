# Platform Schema Contract Matrix

## Purpose

This matrix records the verified reconciliation boundary between the historical Sadat MLS application contract and the connected Aqarat OS database contract. It is a planning and verification artifact; it does not authorize production schema changes.

## Verified live contract — 2026-09-15

The connected Supabase project is `aqarat` and is healthy. The live public schema is Aqarat OS lineage with core relations including:

`properties`, `people`, `contacts`, `property_people`, `sources`, `source_records`, `provenance`, `intake_events`, `jobs`, `sync_projections`, `discovery_sources`, `discovery_runs`, `discovery_jobs`, `discovery_evidence`, `discovery_permission_evidence`, `discovery_entities`, `entity_matches`, `lead_signals`, `leads`, `interests`, `interactions`, `content_items`, `content_variants`, `content_performance`, `marketing_experiments`, `review_queue`, `publication_jobs`, `publications`, `audit_events`.

The live database also currently contains `rate_limit_state` and `security_rate_limits`, both RLS-enabled, with `increment_rate_limit(text, inet, timestamptz)` and `increment_security_rate_limit(text, inet, timestamptz)` respectively. This corrects an earlier reconciliation note that treated the legacy rate-limit primitive as absent; it is present in the currently verified live schema.

The live `properties` contract includes `property_type`, `transaction_type`, `status`, `title`, `description`, `city`, `district`, `neighborhood`, `address`, `latitude`, `longitude`, `area_m2`, `bedrooms`, `bathrooms`, `floor`, `finishing`, `price`, `currency`, `features`, `confidence`, `first_seen_at`, `last_seen_at`, `created_at`, `updated_at`, `parcel_number`, `installments_clear`, and `canonical_key`.

## Contract matrix

| Historical application assumption | Live Aqarat OS observation | Decision | Migration note |
|---|---|---|---|
| `offices` | No live `offices` relation observed | REPLACE / REDESIGN | Do not map to `people` without an explicit organization/business-identity model. |
| `users` | No live `public.users` relation observed | REPLACE / REDESIGN | Supabase Auth identity must be reconciled separately from business `people`. |
| `zones` | No live `zones` relation observed | REPLACE / REDESIGN | Geography is represented by `city`, `district`, `neighborhood`, and `address`. |
| `property_types` | No live `property_types` relation observed | REPLACE / REDESIGN | Use live `properties.property_type` until a controlled taxonomy is deliberately introduced. |
| `property_images` | No live `property_images` relation observed | REDESIGN | Establish an authoritative media/storage contract before persistence is restored. |
| `property_owners` | No live `property_owners` relation observed | REPLACE | Use `people` + `property_people` + provenance semantics. |
| `contact_requests` | No live `contact_requests` relation observed | REPLACE | Use `interactions`, `leads`, `lead_signals`, and `contacts` according to the intended workflow. |
| `property_favorites` | No live `property_favorites` relation observed | UNKNOWN / REDESIGN | No authoritative favorite persistence contract has been proven. |
| `rate_limit_state` | Live `rate_limit_state` exists and is RLS-enabled | COMPATIBLE, VERIFY CALL PATH | Existing table/function are real; verify application semantics and grants rather than deleting or recreating them. |
| `increment_rate_limit()` | Live `increment_rate_limit(text, inet, timestamptz)` exists | COMPATIBLE, VERIFY CALL PATH | Preserve only if its current operational semantics match the application's required limits. |
| `security_rate_limits` | Live `security_rate_limits` exists and is RLS-enabled | PREFERRED SECURITY PRIMITIVE TO EVALUATE | `increment_security_rate_limit()` exists; compare it with current rate-limit usage before consolidating. |
| `properties.status = 'available'` | Live status values include `active`, `inactive`, `sold`, `rented`, `archived`, `unknown` | BREAKING MISMATCH | Active reads must use the authoritative live status model. |
| `properties.is_active` | No live `is_active` column observed | BREAKING MISMATCH | Do not add a duplicate boolean solely for compatibility. |
| `properties.area` | Live column is `area_m2` | BREAKING MISMATCH | Application access must use `area_m2`. |
| `properties.zone_id` | No live `zone_id` column observed | BREAKING MISMATCH | Replace with live geography fields. |
| `properties.property_type_id` | No live `property_type_id` column observed | BREAKING MISMATCH | Use live `property_type` until a controlled taxonomy exists. |
| `properties.office_id` | No live `office_id` column observed | BREAKING MISMATCH | Attribution must use the live entity graph. |
| `properties.created_at` | Live `created_at` exists | COMPATIBLE | Keep, while using `first_seen_at`/`last_seen_at` for discovery freshness. |
| legacy office/user joins | Live graph uses people/source/provenance/discovery primitives | BREAKING MISMATCH | Replace the relational assumptions rather than restoring historical tables. |

## Required migration order

1. Keep the verified Aqarat property read contract as the application source of truth.
2. Separate Supabase Auth identity from business/person entities and define an explicit mapping.
3. Replace remaining legacy property field/relation access.
4. Establish media/image persistence against an authoritative storage contract.
5. Rebuild contact, favorites, office/developer/project, and dashboard workflows against verified live entities or explicitly retire them.
6. Verify and rationalize the existing rate-limit primitives (`rate_limit_state` versus `security_rate_limits`) rather than assuming either is absent.
7. Make the generated live database types the canonical checked-in type artifact.
8. Keep the schema-contract guard fail-closed until runtime callers match the verified contract.
9. Re-run unit, integration, E2E, build, health, and performance verification only after the runtime contract is coherent.

## Safety rules

- No production DDL is authorized by this document.
- No placeholder tables are allowed solely to satisfy tests.
- No E2E assertions may be weakened to conceal integration failures.
- Unknown mappings remain UNKNOWN until proven by repository intent or live evidence.
- Lara readiness work remains isolated from platform reconciliation.
