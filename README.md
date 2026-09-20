# Sadat MLS

## Production status

**PRODUCTION VERIFIED — current Aqarat OS public property contract**

Verified on **2026-09-20** against the connected Supabase project and the live Vercel deployment.

- Production: https://sadat-mls.vercel.app
- GitHub: `ahmedsaturki/sadat-mls`
- Supabase project: `aaxauqznfhcvgevfczye`
- Latest verified runtime release baseline: `8fae65aca77751b45ffef7141d7d55cc7c87e8db` (merged PR #38)
- Production deployment for that runtime baseline: `dpl_7rPQVen2sF1qCiwcgCiHJdKvzppq` (READY)
- Independent self-hosted verification run #90: SUCCESS on the merged main commit, including migration verification, lint, adapter smoke, typecheck, schema contract, 42 files / 677 tests, build, and diff check
- Production smoke verification on 2026-09-20: `/api/health`, `/api/properties`, `/en/explore`, `/en/explore/{id}`, and the public localized routes tested during the release sweep returned HTTP 200.
- Verified live active properties: 2
- Production runtime error sweep for the selected 24-hour window: no runtime errors.

PR #26 retired unsupported notification, office-comparison, and historical dashboard execution paths and removed their dead clients/tests. PR #28 additionally removed an unadvertised mock AI-description endpoint, a browser-only saved-search hook, a disabled FavoriteButton, and their obsolete tests. PR #33 restored the authoritative 41-migration Aqarat OS lineage and made the local migration verifier deterministic; it did not invent replacement Aqarat contracts.

This README records the certified **runtime baseline** after PR #38. Documentation-only commits may advance `main` and trigger new Vercel deployments without changing that runtime contract; runtime-affecting changes require a fresh verification cycle.

## What is delivered

The production application currently follows the live Aqarat OS property contract rather than the historical Sadat MLS schema.

### Public property experience

- Arabic and English localized routes.
- Homepage with featured active properties.
- Explore/search page.
- Property type, district, price, and area filters.
- Newest, lowest-price, highest-price, and largest-area sorting.
- Property detail pages with structured metadata.
- Share and comparison UI.
- Active-property-only visibility.
- Placeholder media when no authoritative media source exists.

### Public property API

`GET /api/properties` supports:

`q`, `type`, `district`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, and `sort`.

The public API returns only active properties and only the approved public columns. Internal Aqarat fields such as `confidence`, `parcel_number`, `installments_clear`, and `canonical_key` are not publicly selectable.

### Authentication

Supabase Auth is wired to the canonical project endpoint and publishable key. User metadata is used only for non-authoritative profile presentation. Authorization roles and office membership are **not** inferred from user-editable metadata.

## Database contract

The connected Supabase project is on the Aqarat OS migration lineage. The authoritative property read contract is enforced with:

1. Row Level Security allowing `anon` and `authenticated` to read active rows only.
2. Column-level grants limiting public reads to approved listing fields.
3. Checked-in generated Supabase types.
4. A deterministic application contract guard in `scripts/contract-check.js`.

The applied public-property migration is recorded in Supabase as:

`20260918152055_public_property_read_contract`

and the repository contains that applied migration file.

The repository migration chain now reconciles with the full live Aqarat OS migration history: **41/41** versions are present and match the production migration ledger through `20260918171827`. Issue #30 is closed.

## Security posture

- Public property access is fail-closed by RLS and column privileges.
- Public property and health endpoints use bounded per-IP in-memory limits and do not depend on privileged database credentials.
- Protected operational rate limiting uses the database security primitive and fails closed when that primitive is unavailable.
- State-changing public requests use CSRF validation where required.
- The service-role key is server-only and is never used by browser code.
- No internal property fields are exposed through the public read contract.

## Deliberately excluded until authoritative contracts exist

These are not hidden bugs or fake implementations. They are intentionally kept fail-closed/retired because the current live Aqarat schema does not provide a verified source-of-truth contract for them:

- Supabase Auth user ↔ business `people` identity and organization/office role mapping.
- Property media/image persistence and storage relations.
- Favorite persistence and saved-search ownership semantics.
- Historical office/admin/agent workflows that depend on the retired relational model.

The live schema currently has no `offices`, `public.users`, `zones`, `property_images`, or `property_favorites` relation and `people` has no verified Auth identity column. New replacements must be defined from authoritative requirements rather than guessed compatibility tables.

## Verification baseline

The current certified runtime remains the public Aqarat OS contract after PR #38. The verified baseline was checked with:

- `/api/health` → HTTP 200 with Supabase/property checks OK.
- `/api/properties` → HTTP 200.
- Representative property filters → HTTP 200.
- `/ar/explore` and `/en/explore` → HTTP 200.
- `/ar/login` → HTTP 200.
- Vercel production deployment `dpl_7rPQVen2sF1qCiwcgCiHJdKvzppq` → READY for merge commit `8fae65aca77751b45ffef7141d7d55cc7c87e8db` (PR #38).
- Post-merge self-hosted verification run #90 → SUCCESS, including authoritative migration verification, lint, adapter smoke, typecheck, schema contract, 42 files / 677 tests, build, and diff check.
- Production runtime logs after the new deployment show successful public health, property API, and property-detail requests; the only rate-limit failures in the current one-hour sweep are timestamped 04:52 UTC on the previous deployment.
- Production security headers remained present, including CSP, HSTS, X-Frame-Options DENY, and X-Content-Type-Options.

The hosted CI workflow remains independent because it contains secret-dependent type-generation, E2E, build, and production-gate jobs. Post-merge hosted CI/CD run #786 is the current verification run for PR #38; the hosted gates were not weakened.

## Engineering rules

- Treat the live Aqarat OS schema as the current source of truth.
- Do not resurrect legacy tables solely to satisfy tests.
- Do not weaken E2E assertions to hide integration failures.
- Do not expose internal Aqarat fields through convenience queries.
- Do not infer organization or authorization roles from user-editable metadata.
- Keep migration files synchronized with the migration versions actually applied to Supabase.
- Keep unknown mappings explicitly unknown until verified.
- Run the self-hosted verification companion on PRs and every push to `main`.
- Treat the 41-version Aqarat OS migration lineage as the current schema source of truth.
- Issue #25 is closed; the current hosted CI/CD pipeline is passing on the PR #38 merge.
- Treat Issue #24 as an intentional authoritative-contract backlog for features that cannot safely be recreated from the current live schema.

## Development

Install dependencies:

```bash
npm ci --no-audit --no-fund
```

Run the development server:

```bash
npm run dev
```

Run the repository-owned verification commands:

```bash
npm run lint
npm run test:adapter
npm run typecheck
npm run contract:check
npm run test:run
npm run build
git diff --check
```

Playwright E2E:

```bash
npx playwright test --project=chromium --reporter=list
```

The hosted CI pipeline also generates Supabase types from project `aaxauqznfhcvgevfczye` and fails on checked-in type drift.

## Related documentation

- `API.md` — actual deployed API surface.
- `SECURITY.md` — current security contract and known boundaries.
- `IMPLEMENTATION_PLAN.md` — delivery/completion record.
- `docs/PLATFORM_RECONCILIATION_PROGRESS.md` — detailed reconciliation evidence.
- `docs/PLATFORM_SCHEMA_RECONCILIATION.md` — authoritative reconciliation record.
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md` — contract-by-contract decisions.
- `AGENTS.md` — authoritative agent engineering rules.
- `CLAUDE.md` — compact agent context.

## Schema lineage status

**RESOLVED.** The repository contains the authoritative 41-version Aqarat OS migration lineage through `20260918171827`, and the linked production migration history reconciles 41/41 with the repository verifier. Local reset/type-generation remain workstation environment gates rather than production schema-lineage gaps.

## Lara scope

Sadat MLS platform reconciliation is kept separate from the Lara Asset Readiness Gate. Platform infrastructure or schema defects must never be hidden by changing the readiness decision logic.
