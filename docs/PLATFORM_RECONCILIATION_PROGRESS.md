# Platform Reconciliation Progress

## Current state

**IN PROGRESS — Aqarat PROPERTY READ + AUTH IDENTITY MIGRATION ACTIVE; LEGACY CONTRACT CLEANUP CONTINUES**

The authoritative direction remains forward migration to the connected Aqarat OS architecture. Production schema has not been mutated from this branch.

## Completed in the current slice

- `/[locale]/explore` server read path queries the verified live `properties` contract.
- Active listing semantics use `status = 'active'` rather than the legacy `available` + `is_active` combination.
- The active Explore UI uses an Aqarat-native client component and verified property fields only.
- The superseded legacy `ExploreClient.tsx` surface was removed because it contained a complete legacy-schema query path and was no longer the active route implementation.
- `/[locale]/explore/[id]` property detail server path was migrated to the Aqarat property contract and no longer queries legacy zone/type/office/image relations.
- Property-detail metadata no longer queries the retired `property_images`, `property_types`, `zones`, or `offices` relations.
- Landing-page featured-property query was migrated away from the legacy relation contract.
- Property comparison query was migrated to the Aqarat property contract; unavailable legacy image/office/type/zone relations are no longer fabricated as compatibility joins.
- Health endpoint Supabase probe was migrated from the removed legacy `offices` relation to the authoritative `properties` relation.
- Browser and server Supabase clients now use the Aqarat database contract for migrated paths.
- Property gallery/lightbox presentation types are decoupled from the retired `property_images` database table so media can be reintroduced only after an authoritative media contract exists.
- `getServerAuth()` no longer queries the retired `public.users` table. Supabase Auth is the authoritative identity source; protected role mapping is fail-closed until a verified Auth-to-business-people mapping exists.
- `useAuthUser()` no longer queries `public.users` and uses Supabase Auth identity data only. Authorization roles are intentionally not derived from user-editable metadata.
- Login routing no longer reads role/office from `public.users`; absent a verified business-role mapping it routes authenticated users to Explore (or a safe same-origin `next` path).
- The deterministic `contract:check` remains enabled and intentionally fails while other legacy runtime callers elsewhere in the repository still exist.
- A stale favorites unit test was removed after the corresponding legacy `FavoritesClient` surface was retired.
- A retired export endpoint was corrected to import `NextResponse` from `next/server`.

## Newly verified live database facts — 2026-09-15

Direct inspection of the connected Supabase project `aqarat` verified that the live public schema currently contains both `rate_limit_state` and `security_rate_limits`, both with RLS enabled. The live project also exposes `increment_rate_limit(text, inet, timestamptz)` and `increment_security_rate_limit(text, inet, timestamptz)`. Therefore rate limiting is **not** currently a missing-database blocker; the remaining task is to verify which primitive is authoritative and reconcile application usage accordingly.

The live `properties` relation was re-verified with the Aqarat fields used by the migrated property reads, including `property_type`, `transaction_type`, `status`, `city`, `district`, `neighborhood`, `address`, `area_m2`, `price`, `first_seen_at`, `last_seen_at`, `parcel_number`, `installments_clear`, and `canonical_key`.

## Verification boundary

PR #14 remains open and draft. The latest branch work is intentionally not production-certified. CI run #326 failed at the schema-contract guard and typecheck, and the typecheck rerun is being used to separate stale legacy-surface errors from genuine Aqarat contract issues. No green-branch claim is made until the current verification completes.

## Current architectural blockers

1. Business authorization mapping between Supabase Auth identity and `public.people` is not yet persisted or proven. Current role-gated flows therefore fail closed.
2. Favorites still reference `property_favorites`; no authoritative Aqarat replacement has been proven.
3. Property imagery/media still lack a verified Aqarat media/storage persistence contract; presentation is decoupled but persistence remains pending.
4. Manual/checked-in type usage and generated live types must be reconciled so the checked-in artifact represents the authoritative database contract without legacy relations.
5. Broad admin, analytics, notifications, invitations, saved-searches, offers, office, developer, and project paths still contain legacy callers and need contract-by-contract migration or explicit retirement.
6. Rate limiting requires semantic reconciliation between the two verified live primitives, not schema recreation.

## Safety rules

- No placeholder compatibility tables.
- No E2E weakening.
- No production DDL from this branch until a specific forward migration is independently designed and verified.
- No authorization from `user_metadata` or other user-editable claims.
- No changes to Lara readiness logic for infrastructure reasons.
- No production certification until schema, runtime, auth, rate limiting, and E2E are all verified against one coherent contract.
