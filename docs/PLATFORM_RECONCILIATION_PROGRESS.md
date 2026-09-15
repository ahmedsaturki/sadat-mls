# Platform Reconciliation Progress

## Current state

**IN PROGRESS — PROPERTY READ SLICE MIGRATED**

The authoritative direction remains forward migration to the connected Aqarat OS architecture. Production schema has not been mutated.

## Completed in this slice

- `/[locale]/explore` server read path now queries the verified live `properties` contract.
- Active listing semantics now use `status = 'active'` rather than the legacy `available` + `is_active` combination.
- Legacy property fields were removed from the active Explore server path: `area`, `zone_id`, `property_type_id`, `office_id`, and legacy relational joins.
- The active Explore UI now uses an Aqarat-native client component and only consumes verified property fields: `property_type`, `city`, `district`, `neighborhood`, `area_m2`, `price`, `bedrooms`, `bathrooms`, coordinates, freshness timestamps, and other live property metadata.
- The active property card no longer invokes the legacy persistence-dependent favorites path. Comparison remains client-side and does not require a database relation.
- The deterministic `contract:check` remains enabled and intentionally fails while other legacy callers elsewhere in the repository still exist.

## Verification boundary

The latest reconciliation branch HEAD is verified by GitHub as `48c24a1d81c3bf2b5053d0f734cea3c6b5cfbec4`.

GitHub commit status for this HEAD currently reports Vercel checks as **pending**. No green deployment claim is made from a pending status.

A full local clone/typecheck/lint/contract run could not be executed in the current execution environment because outbound DNS resolution for `github.com` was unavailable. This is an environment limitation, not a test result.

## Remaining work

1. Remove or migrate remaining legacy callers outside the active Explore route, including the old Explore component, map component, favorites path, health/rate-limit path, auth/user assumptions, and legacy manual database types.
2. Establish the authoritative Auth/business-person mapping before changing protected admin flows.
3. Establish the authoritative media/storage contract before reintroducing property imagery.
4. Replace the legacy rate-limit persistence/RPC contract with a supported Aqarat OS operational design.
5. Regenerate/adopt authoritative database types and make type drift fail closed.
6. Restore strict E2E gating only after the application contract is internally coherent.

## Safety rules

- No placeholder compatibility tables.
- No E2E weakening.
- No production DDL from this branch.
- No changes to Lara readiness logic for infrastructure reasons.
- No production certification until schema, runtime, auth, rate limiting, and E2E are all verified against one contract.
