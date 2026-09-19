# Sadat MLS

## Production status

**PRODUCTION VERIFIED — current Aqarat OS public property contract**

Verified on **2026-09-19** against the connected Supabase project and the live Vercel deployment.

- Production: https://sadat-mls.vercel.app
- GitHub: `ahmedsaturki/sadat-mls`
- Supabase project: `aaxauqznfhcvgevfczye`
- Current main HEAD: `664fc39b1743059d84d72b86d921c8085d06e84e`
- Latest production deployment: `dpl_GF6csFucVqiSbLWDhBoo9y3gwgJP`
- Latest production deployment status: READY
- Production deployment commit: `664fc39b1743059d84d72b86d921c8085d06e84e`
- Main advanced through merged PR #20, which reconciled production documentation with the then-current verified main/deployment state; the resulting merge commit is now the production HEAD.
- Live smoke verification on 2026-09-19: `/api/health` returned HTTP 200 with `supabase_api: ok` and `properties: ok`; `/en/explore` returned HTTP 200 with active property results.
- Verified live active properties: 2

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

and the repository migration filename matches that applied version.

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

The current production baseline was verified with:

- `/api/health` → HTTP 200 with Supabase/property checks OK.
- `/api/properties` → HTTP 200.
- Property type and price filters → HTTP 200 with correctly filtered results.
- `/ar/explore` and `/en/explore` → HTTP 200.
- `/ar/login` → HTTP 200.
- Latest production runtime error sweep (2026-09-19) → no runtime errors in the selected 24-hour window.
- Current production Vercel deployment for main HEAD (`dpl_GF6csFucVqiSbLWDhBoo9y3gwgJP`) → READY.
- Post-merge self-hosted verification run #5 on main → install, lint, adapter CLI smoke, typecheck, schema contract, unit/integration tests, build, and diff check all passed.
- Post-merge production smoke → `/api/health`, `/api/properties`, filtered property queries, `/en/explore`, and `/ar/login` returned HTTP 200.
- Current Vercel runtime error sweep (2026-09-19) → no runtime errors and no error/warning log entries in the selected 24-hour window.

The GitHub-hosted CI workflow remains independent because it contains secret-dependent type-generation, E2E, and production-gate jobs. The current main run's hosted lint job failed before any job steps were created, including on one rerun; no job log was available from GitHub. This is separate from the successful self-hosted verification and successful Vercel production deployment, and should not be fixed by weakening CI gates.

## Engineering rules

- Treat the live Aqarat OS schema as the current source of truth.
- Do not resurrect legacy tables solely to satisfy tests.
- Do not weaken E2E assertions to hide integration failures.
- Do not expose internal Aqarat fields through convenience queries.
- Do not infer organization or authorization roles from user-editable metadata.
- Keep migration files synchronized with the migration versions actually applied to Supabase.
- Keep unknown mappings explicitly unknown until verified.
- Run the self-hosted verification companion on PRs and every push to `main`.

## Development

Install dependencies:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

Run the main verification commands:

```bash
npm run lint
npx tsc --noEmit
npm run test:run
npm run contract:check
npm run build
```

Playwright E2E:

```bash
npx playwright test --project=chromium --reporter=list
```

The CI pipeline generates Supabase types from project `aaxauqznfhcvgevfczye` and fails on checked-in type drift.

## Related documentation

- `API.md` — actual deployed API surface.
- `SECURITY.md` — current security contract and known boundaries.
- `IMPLEMENTATION_PLAN.md` — current delivery/completion record.
- `docs/PLATFORM_RECONCILIATION_PROGRESS.md` — detailed reconciliation evidence.
- `docs/PLATFORM_SCHEMA_RECONCILIATION.md` — authoritative reconciliation record.
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md` — contract-by-contract decisions.

## Lara scope

Sadat MLS platform reconciliation is kept separate from the Lara Asset Readiness Gate. Platform infrastructure or schema defects must never be hidden by changing the readiness decision logic.
