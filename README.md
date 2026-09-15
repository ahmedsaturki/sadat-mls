# Sadat MLS — Platform Reconciliation State

## Current status

**BLOCKED — PLATFORM SCHEMA RECONCILIATION REQUIRED**

This repository is not currently certified production-ready. The connected Supabase project uses the Aqarat OS schema lineage, while substantial application code and the repository's historical migrations still target a legacy Sadat MLS schema.

## Verified state

The current reconciliation branch is `research/platform-schema-reconciliation`.

Known verified facts:

- Lint, TypeScript typecheck, generated Supabase types, unit tests, and the production build passed on CI run #228 for the Lara readiness branch.
- Playwright E2E failed on that run: 9 failed, 88 passed, 4 skipped, and 20 did not run.
- The live database contains Aqarat OS relations including `properties`, `people`, `contacts`, `property_people`, `sources`, `source_records`, `provenance`, discovery relations, lead/content/publication relations, and audit relations.
- The live `properties` contract uses fields such as `property_type`, `transaction_type`, `status`, `area_m2`, `city`, `district`, `neighborhood`, `address`, `price`, `first_seen_at`, `last_seen_at`, `parcel_number`, `installments_clear`, and `canonical_key`.
- Legacy runtime paths still reference relations/fields such as `offices`, `users`, `zones`, `property_types`, `property_images`, `property_owners`, `contact_requests`, `property_favorites`, `rate_limit_state`, `increment_rate_limit()`, `area`, `zone_id`, `property_type_id`, `office_id`, `is_active`, and `status = 'available'`.

## Reconciliation policy

The authoritative direction is **forward migration to the live Aqarat OS architecture**.

Do not:

- recreate legacy compatibility tables just to make tests pass;
- weaken E2E assertions;
- restore the legacy schema in production without proving it is the intended system of record;
- modify the Lara readiness gate to compensate for platform drift;
- perform production rollout while the runtime contract is unresolved.

## Enforcement

`npm run contract:check` runs a deterministic source guard against the known legacy database contract. CI executes this guard before Playwright E2E so schema drift is reported explicitly rather than discovered indirectly by browser tests.

## Work sequence

1. Reconcile the property read contract.
2. Reconcile auth and business-person identity semantics.
3. Reconcile media/image persistence.
4. Reconcile interactions, saved searches/favorites, and office/developer/project behavior against authoritative live entities.
5. Replace the legacy rate-limit mechanism.
6. Regenerate and adopt the authoritative database types.
7. Re-run integration, E2E, and performance verification.
8. Resume Lara dogfooding only after the platform is internally coherent.

See:

- `docs/PLATFORM_SCHEMA_RECONCILIATION.md`
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md`

## Lara readiness work

The Lara Asset Readiness Gate remains intentionally isolated from this reconciliation effort. Its deterministic decision logic must not be changed merely to accommodate infrastructure/schema drift.
