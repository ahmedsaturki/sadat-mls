# Aqarat OS Platform Reconciliation

## Verified direction

The live production database is the authoritative Aqarat OS contract. Application code must migrate toward that contract rather than recreate legacy relations solely to preserve old callers.

## Verified Aqarat OS entities used by the application

The current public contract includes, among others, `properties`, `people`, `contacts`, `property_people`, `interactions`, `interests`, `lead_signals`, `leads`, discovery entities/evidence, content/publication entities, jobs, audit, provenance, and sync projection tables.

## Identity boundary

Supabase Auth (`auth.users`) is separate from `public.people`. No verified `auth_user_id` mapping or foreign key currently connects them. Business authorization must not be inferred from user-editable metadata, and application features that require a verified Auth-to-business-person relationship remain blocked until that contract is explicitly established.

## Intentionally retired legacy runtime surfaces

The reconciliation branch removes runtime surfaces that depend on relations or fields absent from the verified Aqarat OS contract:

- legacy agent profile route/client based on `users`, `offices`, and `property_images`
- legacy developer listing/detail routes
- legacy office detail route/layout/loading surface
- legacy project listing/detail routes
- legacy commissions API routes
- legacy dashboard property-management route/client

These are not replacement implementations. They are intentionally removed from the executable contract so the application cannot silently depend on nonexistent production tables.

## Explicit non-goals

- no compatibility tables/views created only to satisfy old callers
- no weakening of the schema-contract guard
- no E2E/test suppression to hide contract failures
- no `user_metadata` authorization
- no production rollout from this draft reconciliation branch
- no changes to PR #12

## Next migration waves

1. Remove or rebuild remaining admin/API surfaces that depend on legacy `users`, `offices`, `contact_requests`, `property_favorites`, and old property fields.
2. Rebuild supported business flows from `people`, `contacts`, `property_people`, `interactions`, `interests`, `leads`, and `lead_signals` where the semantics are actually represented by those entities.
3. Establish and verify the explicit Auth-to-business-person identity contract before restoring role/office-aware workflows.
4. Replace the legacy database type contract with the generated live schema artifact and keep generated-vs-checked-in drift fail-closed.
5. Redesign rate limiting against a real current Aqarat-era server-side primitive; do not silently fall back to memory-only enforcement.
6. Require `lint`, `gen-types`, `typecheck`, and `schema-contract` to pass before re-enabling downstream test/E2E/build/health stages.
