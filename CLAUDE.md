# Agent Context for Sadat MLS Cloud

## Authoritative baseline

Verified runtime baseline: **2026-09-20**.

Sadat MLS is currently a bilingual public real-estate property experience backed by the verified Aqarat OS schema. The live Supabase schema, executable contracts, and production verification are authoritative. Historical Sadat MLS relational assumptions are not a runtime source of truth.

- Production: https://sadat-mls.vercel.app
- Certified runtime baseline: `22f366cbc00200a1c19f249bfb4f2136a599de30` (PR #28)
- Certified runtime baseline: `22f366cbc00200a1c19f249bfb4f2136a599de30` (PR #28)
- Runtime verification: self-hosted run #50 (SUCCESS)
- Documentation-only commits may advance `main` without changing the certified runtime contract
- Supabase project: `aaxauqznfhcvgevfczye`
- Framework: Next.js 16.2.10 App Router
- Runtime: Node 24 / npm 12
- Tests/tooling: TypeScript, ESLint, Vitest, Playwright

## Product contract

Certified public behavior includes localized property browse/search/filter/sort, property detail, comparison/share presentation, authentication entry points, public health/property APIs, and the supported public inquiry flow.

Intentionally unresolved until an authoritative Aqarat contract exists:
- Auth user ↔ `people` identity and organization/office role mapping;
- historical office/admin/agent workflows;
- durable property media/storage ownership;
- favorite persistence;
- saved-search persistence.

Do not resurrect retired tables or invent compatibility joins to make these features appear complete.

## Commands

```bash
npm ci --no-audit --no-fund
npm run lint
npm run test:adapter
npm run typecheck
npm run contract:check
npm run test:run
npm run build
npm run test:e2e
git diff --check
```

The currently verified package scripts are defined in `package.json`. Prefer `npm run typecheck` over duplicating its underlying command.

## CI/CD

### Self-hosted verification

Workflow: `.github/workflows/self-hosted-verification.yml`.

It runs on pull requests targeting `main`, pushes to `main`, and manual dispatch.

The dedicated Linux x64 runner is provisioned with Node 24. The workflow verifies the locally provisioned toolchain instead of invoking `actions/setup-node`, because the setup action was the observed failure/hang point on this runner.

Pipeline:

```
checkout → sanitize → verify Node 24/npm
→ npm ci → lint → adapter smoke → typecheck
→ contract check → tests → build → diff check
```

Runner service location:
`~/actions-runners/sadat-mls`

Manage it with `svc.sh`; do not run `./run.sh` concurrently with the service.

### Hosted CI

Workflow: `.github/workflows/ci.yml`.

Hosted CI includes secret-dependent Supabase type generation/type drift checks, typecheck, unit tests, schema contract checks, Playwright E2E, production build, and a production health gate.

A hosted job that fails before any job step is created is not evidence that the corresponding repository command failed. Preserve the existing gates and investigate infrastructure/admission separately.

## Database contract

The authoritative public property contract is documented in:
- `README.md`
- `API.md`
- `SECURITY.md`
- `docs/PLATFORM_SCHEMA_RECONCILIATION.md`
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md`
- `scripts/contract-check.js`

Public property reads are constrained to active rows and approved public columns. Internal fields such as `confidence`, `parcel_number`, `installments_clear`, and `canonical_key` are not public.

The application uses Aqarat geography/measurement fields such as `area_m2`; do not reintroduce legacy fields such as `area`, `zone_id`, `property_type_id`, or `office_id` without a newly verified contract.

## Security invariants

- Never expose a service-role/secret key to browser code.
- Never authorize using user-editable `user_metadata`.
- Never store roles, office IDs, JWTs, or authorization inputs in browser storage.
- Preserve CSRF protection on required state-changing public flows.
- Preserve bounded rate limits and fail-closed behavior for protected operations.
- Keep CSP ownership in the established security layer; do not add competing policy sources.
- Use the repository logger convention rather than direct `console.error` where applicable.
- Do not bypass RLS simply to make an integration pass.

## Contract guard

`npm run contract:check` is a deterministic fail-closed guard over runtime application code.

It detects known legacy relations/functions, retired property fields/status assumptions, and legacy database type contracts. Tests are excluded from runtime scanning.

Never weaken the guard by adding compatibility exceptions for retired production contracts. Migrate the caller instead.

## Documentation discipline

Every volatile fact must carry a verification date or be described as a baseline.

Do not publish static claims such as "current deployment", "latest commit", or exact test totals without evidence for the stated verification window. For runtime-affecting releases, refresh the runtime release record. Documentation-only commits should not force volatile deployment identifiers into the authoritative baseline.

Historical architecture may be documented for migration context, but clearly label it as historical and never present it as the live schema.

## Review gate

Before release:
1. verify the live contract;
2. run deterministic local checks;
3. pass self-hosted verification;
4. inspect hosted CI failures by actual step evidence;
5. verify Vercel deployment readiness;
6. smoke-test production;
7. inspect runtime errors;
8. update current documentation;
9. freeze the verified baseline.

## Schema-lineage reproducibility

The live Supabase project currently records the Aqarat OS migration lineage beginning at `20260814163031`, while the repository migration directory still contains the historical 2024 Sadat MLS series plus the September 2026 migrations. Issue #30 tracks reconciliation of this history into a clean, reviewable local baseline.

Do not use `supabase/run_remaining_migrations.sql`, `supabase/seed.sql`, or `supabase/seed_028.sql` as production schema migrations; they contain historical contracts for retired tables.

The goal is an auditable, fail-closed public property platform with a reproducible schema lineage, not a partially reconstructed copy of the retired Sadat MLS data model.
