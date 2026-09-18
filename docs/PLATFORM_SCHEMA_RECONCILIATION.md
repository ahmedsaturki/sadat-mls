# Platform Schema Reconciliation

## Status

**BLOCKED / RECONCILIATION REQUIRED**

This document records a verified contract mismatch between the current Sadat MLS application code and the connected Supabase database. It is intentionally separate from the Lara Asset Readiness Gate.

## Authoritative live database lineage

The connected Supabase production project is running the Aqarat OS lineage beginning with `initial_aqarat_os_schema` and subsequent intake, discovery, intelligence, publication, audit, and hardening migrations.

Observed live public tables include:

- `properties`
- `people`
- `contacts`
- `property_people`
- `sources`
- `source_records`
- `provenance`
- `intake_events`
- `jobs`
- `sync_projections`
- `discovery_sources`
- `discovery_runs`
- `discovery_jobs`
- `discovery_evidence`
- `discovery_entities`
- `entity_matches`
- `lead_signals`
- `leads`
- `content_items`
- `content_variants`
- `content_performance`
- `marketing_experiments`
- `review_queue`
- `publication_jobs`
- `publications`
- `audit_events`

The live `properties` contract uses fields such as `property_type`, `transaction_type`, `status`, `area_m2`, `city`, `district`, `neighborhood`, `address`, `price`, `first_seen_at`, `last_seen_at`, `parcel_number`, `installments_clear`, and `canonical_key`.

## Legacy application contract still present in code

Parts of the current web application assume a different relational model containing:

- `offices`
- `users`
- `zones`
- `property_types`
- `property_images`
- `property_owners`
- `contact_requests`
- `property_favorites`
- `rate_limit_state`
- `increment_rate_limit()`

For example, `/api/health` queries `offices`, while Explore queries `properties` using `status = 'available'`, `is_active`, `area`, `zone_id`, `property_type_id`, and `office_id`, and joins legacy tables.

## Verified CI symptoms

CI run #228 on commit `a6f884298d1e99d527c9e561be012310a3249a00` established:

- lint: PASS
- typecheck: PASS
- generated Supabase types: PASS
- unit tests: PASS
- production build: PASS
- Playwright E2E: FAIL

The E2E run produced 9 failed tests, 88 passed tests, 4 skipped tests, and 20 tests that did not run.

Representative failures:

1. `/api/health` expected 200 but returned 503.
2. Explore property discovery failed because the application queried a legacy property contract.
3. Rate-limit tests encountered repeated backend failures and eventually request-context disposal because the operational rate-limit path depends on the missing legacy DB function/table.
4. Admin authentication setup remained at `/ar/login`, showing that the auth/user contract also requires verification.
5. Performance assertions measured ~22-second page load behavior while backend calls repeatedly failed, so these measurements are not valid clean baselines for optimization.

## Migration lineage conflict

The repository still contains a legacy `supabase/migrations/20240101000001_initial_schema.sql` that creates `offices`, `users`, `zones`, `property_types`, and the legacy property model. The connected live database, however, reports a newer Aqarat OS migration lineage.

This creates a dangerous split-brain condition: repository migration history suggests one database contract while the connected project implements another.

## Required reconciliation sequence

1. Freeze Lara readiness scope. Do not modify the readiness primitive to compensate for platform drift.
2. Establish the authoritative Aqarat OS application contract from the live schema and the intended repository architecture.
3. Inventory every server, client, API, auth, rate-limit, analytics, and E2E assumption against that contract.
4. Choose one architecture deliberately: migrate the application forward to Aqarat OS, or formally restore the legacy platform. Do not create an accidental hybrid.
5. Bring repository migration lineage and generated types into agreement with the chosen architecture.
6. Add a deterministic schema/application contract guard so missing relations or incompatible fields fail explicitly before E2E.
7. Rebuild health, explore, authentication, rate limiting, and performance verification against the authoritative contract.
8. Only after platform reconciliation, resume Lara dogfooding and evaluate whether the readiness gate changes real operating decisions.

## Explicit non-goals

- Do not create placeholder compatibility tables solely to make CI green.
- Do not weaken E2E assertions to hide integration failures.
- Do not restore old schema objects in production without proving that the legacy architecture is still the intended system of record.
- Do not expand the Lara readiness feature set while the platform contract is unresolved.
- Do not perform external outreach or production rollout from this blocked state.
