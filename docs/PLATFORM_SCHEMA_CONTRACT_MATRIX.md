# Platform Schema Contract Matrix

## Purpose

This matrix freezes the current reconciliation boundary between the legacy Sadat MLS application contract and the verified live Aqarat OS database contract. It is a planning and verification artifact; it does not authorize production schema changes.

## Authoritative live contract

The connected Supabase production project reports the `initial_aqarat_os_schema` lineage and subsequent intake, discovery, intelligence, publication, audit, and hardening migrations.

Observed core live relations include:

`properties`, `people`, `contacts`, `property_people`, `sources`, `source_records`, `provenance`, `intake_events`, `jobs`, `sync_projections`, `discovery_sources`, `discovery_runs`, `discovery_jobs`, `discovery_evidence`, `discovery_entities`, `entity_matches`, `lead_signals`, `leads`, `content_items`, `content_variants`, `content_performance`, `marketing_experiments`, `review_queue`, `publication_jobs`, `publications`, `audit_events`.

## Contract matrix

| Legacy application assumption | Live Aqarat OS observation | Decision | Migration note |
|---|---|---|---|
| `offices` | No live `offices` relation observed | REPLACE / REDESIGN | No direct one-to-one replacement proven. Do not map to `people` without an explicit auth/organization design. |
| `users` | No live `users` relation observed | REPLACE / REDESIGN | Supabase Auth identity must be reconciled separately from business `people`. |
| `zones` | No live `zones` relation observed | REPLACE / REDESIGN | Current property geography is represented by `city`, `district`, `neighborhood`, `address`; normalization policy must be decided. |
| `property_types` | No live `property_types` relation observed | REPLACE / REDESIGN | Current `properties.property_type` is text; controlled vocabulary requires an explicit domain contract before normalization. |
| `property_images` | No live `property_images` relation observed | REDESIGN | Image/media ownership model must be established; do not synthesize the old relation. |
| `property_owners` | No live `property_owners` relation observed | REPLACE | Current relationship primitives are `people` + `property_people` + provenance. |
| `contact_requests` | No live `contact_requests` relation observed | REPLACE | Current interaction/lead primitives are `interactions`, `leads`, `lead_signals`, and `contacts`. |
| `property_favorites` | No live `property_favorites` relation observed | UNKNOWN | Product behavior exists in legacy code, but no authoritative current persistence contract has been proven. |
| `rate_limit_state` | No live `rate_limit_state` relation observed | REPLACE / REDESIGN | Current platform must use an operational rate-limit design compatible with Aqarat OS; do not recreate legacy table blindly. |
| `increment_rate_limit()` | No live function observed | REPLACE / REDESIGN | Reconcile rate limiting after core platform contract is settled. |
| `properties.status = 'available'` | Live enum values are `active`, `inactive`, `sold`, `rented`, `archived`, `unknown` | BREAKING MISMATCH | App status filters must use the live property state model. |
| `properties.is_active` | No live `is_active` column observed | BREAKING MISMATCH | Replace with explicit live status semantics; do not add a duplicate boolean merely for compatibility. |
| `properties.area` | Live column is `area_m2` | BREAKING MISMATCH | Rename application access to `area_m2`. |
| `properties.zone_id` | No live `zone_id` column observed | BREAKING MISMATCH | Replace with current geography fields or a deliberately introduced future normalization. |
| `properties.property_type_id` | No live `property_type_id` column observed | BREAKING MISMATCH | Use current `property_type` until a controlled taxonomy is approved. |
| `properties.office_id` | No live `office_id` column observed | BREAKING MISMATCH | Ownership/attribution model must be redesigned around current business entities. |
| `properties.created_at` ordering | Live `created_at` exists | COMPATIBLE | Keep, while also respecting `first_seen_at` and `last_seen_at` semantics where discovery freshness matters. |
| legacy `office` joins | Live entity graph uses people/source/provenance/discovery primitives | BREAKING MISMATCH | Replace relational assumptions rather than recreating old office tables. |

## Required migration order

1. Define the authoritative application domain model from the live Aqarat OS schema.
2. Separate Supabase Auth identity from business/person entities.
3. Replace the legacy property read contract first: status, area, geography, property type, attribution.
4. Replace media/image persistence and rendering contract.
5. Replace contact/favorites/office workflow contracts one subsystem at a time.
6. Rebuild rate limiting on an intentionally supported operational primitive.
7. Add schema-contract verification to CI.
8. Re-run E2E only after the runtime contract is internally coherent.

## Safety rules

- No production DDL is authorized by this document.
- No placeholder tables are allowed solely to satisfy tests.
- No E2E assertions may be weakened to conceal integration failures.
- Unknown mappings remain UNKNOWN until proven by repository intent or live evidence.
- Lara readiness work remains isolated from platform reconciliation.
