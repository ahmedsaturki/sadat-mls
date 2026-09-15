# Platform Reconciliation Progress

## Current state

**IN PROGRESS — PROPERTY READ SURFACE MIGRATED; SECONDARY CONTRACT CLEANUP ACTIVE**

The authoritative direction remains forward migration to the connected Aqarat OS architecture. Production schema has not been mutated from this branch.

## Completed in the current slice

- `/[locale]/explore` server read path queries the verified live `properties` contract.
- Active listing semantics use `status = 'active'` rather than the legacy `available` + `is_active` combination.
- The active Explore UI uses an Aqarat-native client component and verified property fields only.
- The superseded legacy `ExploreClient.tsx` surface was removed because it contained a complete legacy-schema query path and was no longer the active route implementation.
- `/[locale]/explore/[id]` property detail server path was migrated to the Aqarat property contract and no longer queries legacy zone/type/office/image relations.
- Landing-page featured-property query was migrated away from the legacy relation contract.
- Property comparison query was migrated to the Aqarat property contract; unavailable legacy image/office/type/zone relations are no longer fabricated as compatibility joins.
- Health endpoint Supabase probe was migrated from the removed legacy `offices` relation to the authoritative `properties` relation.
- Browser and server Supabase clients now have an explicit transitional Aqarat property database type so migrated query paths receive compile-time schema checking.
- The deterministic `contract:check` remains enabled and intentionally fails while other legacy runtime callers elsewhere in the repository still exist.

## Verification boundary

The reconciliation PR remains open and draft. The latest branch HEAD is `fd5a05951e344780b08452656845f0a2c71ff569` and GitHub has started CI Run #261 for this HEAD.

The previous CI run proved the then-current failures were limited to two TypeScript typing issues plus the expected legacy-contract guard. Those TypeScript fixes are now on the branch; the new run must complete before any pass/fail claim is made.

Production Vercel status cannot currently be independently verified from the connected Vercel scope because the linked project scope returned `403 Not authorized` for `jml-projects`. No deployment-health claim is made from that blocked check.

## Known architectural blockers still requiring authoritative design

1. Legacy auth/business-user paths still reference `users`; the authoritative Supabase Auth ↔ business `people` mapping must be established before protected admin flows are rewritten.
2. Favorites still reference `property_favorites`; no authoritative Aqarat replacement has been proven yet.
3. Property imagery/media still reference `property_images`; the Aqarat Storage/media contract must be established before imagery is restored.
4. Rate limiting still references `rate_limit_state` / `increment_rate_limit`; the live Aqarat database currently exposes no public rate-limit primitive, so this must be redesigned rather than silently downgraded.
5. Manual `types.ts` still describes the retired schema; authoritative generated types exist in CI artifacts but have not yet been adopted into the repository as the canonical source.
6. Broad admin, analytics, notifications, invitations, saved-searches, offers, and office/developer/project paths still contain legacy callers and need contract-by-contract migration.

## Safety rules

- No placeholder compatibility tables.
- No E2E weakening.
- No production DDL from this branch.
- No changes to Lara readiness logic for infrastructure reasons.
- No production certification until schema, runtime, auth, rate limiting, and E2E are all verified against one coherent contract.
