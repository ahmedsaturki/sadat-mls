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

These are not replacement implementations. They remain outside the executable contract so the application cannot silently depend on nonexistent production tables.

## Current production boundary

- no compatibility tables/views created only to satisfy old callers
- no weakening of the schema-contract guard
- no E2E/test suppression to hide contract failures
- no `user_metadata` authorization
- production currently runs from `main` on the verified Aqarat OS property contract
- no changes to PR #12

## Next product-contract waves

1. Define authoritative replacement contracts for Auth↔`people`, media/storage, favorites, saved searches, and office/admin/agent workflows before restoring any corresponding feature.
2. Rebuild supported business flows from `people`, `contacts`, `property_people`, `interactions`, `interests`, `leads`, and `lead_signals` where the semantics are actually represented by those entities.
3. Establish and verify the explicit Auth-to-business-person identity contract before restoring role/office-aware workflows.
4. Keep the checked-in Aqarat database type contract synchronized and fail closed on drift.
5. Continue operational monitoring of the public and protected rate-limit primitives and resolve configuration drift without weakening fail-closed behavior.
6. Keep self-hosted verification as an independent repository gate while hosted CI/CD remains an active production gate; the former admission issue is closed.
