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
- `getServerAuth()` no longer queries the retired `public.users` table. Supabase Auth is the authoritative identity source; protected role mapping is fail-closed until a verified `auth.users` -> business `people` mapping exists.
- `useAuthUser()` no longer queries `public.users` and uses Supabase Auth identity data only. Authorization roles are intentionally not derived from user-editable metadata.
- Login routing no longer reads role/office from `public.users`; absent a verified business-role mapping it routes authenticated users to Explore (or a safe same-origin `next` path).
- The deterministic `contract:check` remains enabled and intentionally fails while other legacy runtime callers elsewhere in the repository still exist.

## Verification boundary

The reconciliation PR remains open and draft. Current branch HEAD is `2f6a7b9988980b70bb4efe7c997072e1eb525271`.

CI Run #276 is active for this HEAD. The latest completed baseline established that lint and generated-type verification pass, while typecheck and the legacy-contract guard remain intentionally failing until migration is complete. No green-branch claim is made before the current run completes.

Production Vercel status cannot currently be independently verified from the connected Vercel scope because the linked project scope returned `403 Not authorized` for `jml-projects`. No deployment-health claim is made from that blocked check.

## Known architectural blockers still requiring authoritative design

1. Business authorization mapping between Supabase Auth identity and `public.people` is not yet persisted or proven. Current role-gated flows therefore fail closed.
2. Favorites still reference `property_favorites`; no authoritative Aqarat replacement has been proven yet.
3. Property imagery/media still lack a verified Aqarat media/storage persistence contract; presentation is decoupled but persistence remains pending.
4. Rate limiting still references `rate_limit_state` / `increment_rate_limit`; the live Aqarat database currently exposes no public rate-limit primitive, so this must be redesigned rather than silently downgraded.
5. Manual `types.ts` still describes the retired schema; CI-generated live types exist and should become the canonical checked-in type artifact after the repository generation workflow is finalized.
6. Broad admin, analytics, notifications, invitations, saved-searches, offers, office, developer, and project paths still contain legacy callers and need contract-by-contract migration or explicit retirement.

## Safety rules

- No placeholder compatibility tables.
- No E2E weakening.
- No production DDL from this branch until a specific forward migration is independently designed and verified.
- No authorization from `user_metadata` or other user-editable claims.
- No changes to Lara readiness logic for infrastructure reasons.
- No production certification until schema, runtime, auth, rate limiting, and E2E are all verified against one coherent contract.
