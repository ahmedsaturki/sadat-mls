# Agent Rules for Sadat MLS Cloud

## Authoritative state

Last verified baseline: **2026-09-19**.

The current application is a bilingual public real-estate property experience backed by the verified Aqarat OS schema. The live Supabase schema and the checked-in contract documentation are authoritative. Historical Sadat MLS relational assumptions are retired unless a current document explicitly identifies them as historical.

Baseline references:
- Production: https://sadat-mls.vercel.app
- Baseline main commit before this documentation PR: `0e603135cb7c2f87c3c2d00b1be0a56bf0f5946f`
- Baseline production deployment: `dpl_2nRKvAmLKcRSUpRwk7UkgcbDDJEs` (READY)
- Supabase project: `aaxauqznfhcvgevfczye`
- Framework: Next.js 16.2.10 App Router
- Runtime baseline: Node 24 / npm 12
- Database: Supabase PostgreSQL using the Aqarat OS migration lineage

Do not hard-code a future "current main" or production deployment identifier into this file after release. Record new verified baselines in the repository's release/implementation record.

## Product boundary

The certified public scope is intentionally narrow and fail-closed:

- localized Arabic and English public property browsing;
- search, filters, and sorting over the public property contract;
- property detail pages;
- public property comparison/share presentation;
- authentication entry points backed by Supabase Auth;
- public health/property API probes;
- public inquiry submission where the authoritative Aqarat contact model is available.

The following remain unresolved or retired until an authoritative Aqarat contract is established:

- Auth user ↔ business `people` identity and organization/office role mapping;
- historical office/admin/agent workflows based on retired tables;
- durable property media/image relationships and storage ownership;
- favorite persistence;
- saved-search persistence.

Never make an unresolved feature "work" by recreating retired tables, inventing joins, trusting user-editable metadata, or weakening the contract guard.

## Source of truth hierarchy

When sources disagree, use this order:

1. verified live Aqarat/Supabase schema;
2. executable application contract and tests;
3. production behavior;
4. current README/API/SECURITY/reconciliation records;
5. historical documentation only as historical context.

A prose document never overrides a live schema or a failing deterministic contract check.

## Engineering change discipline

Use:

**SPEC → IMPLEMENT → TEST → VERIFY → RELEASE → FREEZE → NEXT**

For every change:
- define the data and security contract first;
- keep authorization server-side and database-backed;
- preserve fail-closed behavior;
- do not weaken tests to conceal failures;
- verify production behavior after release-affecting changes;
- document unknowns explicitly rather than guessing;
- prefer existing dependencies and local implementation over new services.

## Stack

- Next.js 16.2.10, App Router
- React 18
- TypeScript
- Tailwind CSS 4
- Supabase JS + SSR
- Supabase PostgreSQL
- Vitest
- Playwright
- Vercel
- GitHub Actions

Package scripts currently verified in `package.json`:

```bash
npm run dev
npm run build
npm run analyze
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:run
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:install
npm run contract:check
npm run db:gen-types
npm run test:adapter
```

Do not document `npm run db:migrate` or other scripts unless they actually exist in `package.json`.

## Local verification

Normal pre-PR verification:

```bash
npm ci --no-audit --no-fund
npm run lint
npm run test:adapter
npm run typecheck
npm run contract:check
npm run test:run
npm run build
git diff --check
```

Playwright:

```bash
npm run test:e2e
# or
npx playwright test --project=chromium --reporter=list
```

The deterministic schema guard is:

```bash
npm run contract:check
```

It scans runtime application code for known legacy relation/status/field usage. Do not add exclusions merely to make the check pass.

## CI/CD

### Self-hosted verification

`.github/workflows/self-hosted-verification.yml` is the repository-owned non-secret verification companion.

It runs on:
- pushes to `main`;
- pull requests targeting `main`;
- manual dispatch.

The dedicated Linux x64 runner is provisioned with Node 24 locally. The workflow verifies that toolchain instead of invoking `actions/setup-node`, because that action was repeatedly the unstable admission point on this dedicated runner.

Verification order:

```
checkout
→ workspace sanitize
→ local Node/npm guard
→ npm ci
→ lint
→ adapter smoke
→ typecheck
→ schema contract
→ unit/integration tests
→ build
→ git diff --check
```

The runner is managed as a system service from:

`~/actions-runners/sadat-mls`

Operate it through `svc.sh`. Do not run `./run.sh` while the service is active.

Useful checks:

```bash
cd ~/actions-runners/sadat-mls
sudo ./svc.sh status
sudo ./svc.sh stop
sudo ./svc.sh start
```

### Hosted CI

`.github/workflows/ci.yml` remains independent and must not be weakened to hide infrastructure failures.

It contains:
- hosted lint and adapter smoke;
- Supabase type generation from the authoritative project;
- checked-in type drift detection;
- typecheck;
- unit tests;
- schema-contract check;
- Playwright build/E2E;
- production build;
- production health check on main/master.

The hosted workflow has historically failed in the hosted job before steps were created. Treat that as an infrastructure/admission observation unless an actual job step fails. Do not label it a repository lint failure without job-step evidence.

## Supabase contract

Project:

`aaxauqznfhcvgevfczye`

The public property contract is protected by:
- RLS active-row filtering;
- column-level grants;
- checked-in generated/manual application types;
- `scripts/contract-check.js`.

Known internal property fields intentionally excluded from public reads include:

`confidence`, `parcel_number`, `installments_clear`, `canonical_key`.

Current property geography/measurements use the Aqarat model, including `area_m2` and geography fields rather than retired `area`, `zone_id`, or `office_id` assumptions.

Private operational rate-limit state must remain non-public.

Never:
- expose a service-role/secret key to browser code;
- authorize using user-editable `user_metadata`;
- bypass RLS just to make a query work;
- create public compatibility tables for historical Sadat MLS entities.

## Database and API verification

The certified public API is documented in `API.md`.

Current public endpoints include:
- `GET /api/health`;
- `GET /api/properties`;
- `POST /api/contact`;
- supported Auth rate-limit/verification helpers;
- CSP reporting endpoint.

Retired endpoint families return explicit 410s where applicable and must not be documented as supported.

For public properties:
- active rows only;
- approved public columns only;
- bounded per-IP read limiting;
- no privileged key required for ordinary public reads.

For protected mutations:
- validate input;
- validate CSRF where required;
- use server-only privileged credentials only where the contract requires them;
- fail closed when protected operational dependencies are unavailable.

## Security invariants

- Service-role/secret credentials are server-only.
- Authorization never comes from browser storage or user-editable metadata.
- `sessionStorage` must not contain roles, office IDs, JWTs, or other authorization inputs.
- State-changing public flows use the established CSRF mechanism where required.
- Public input is bounded and validated.
- Use the project logger instead of direct `console.error` where the repository convention applies.
- CSP ownership remains in the established middleware/security layer; do not create duplicate policy sources.
- Keep rate limiting fail-closed for protected operations.

## Documentation rules

Keep these synchronized with verified behavior:
- `README.md` — production status and high-level contract;
- `API.md` — actual deployed API;
- `SECURITY.md` — current security boundary;
- `IMPLEMENTATION_PLAN.md` — delivery/completion record;
- `docs/PLATFORM_SCHEMA_RECONCILIATION.md` — schema reconciliation evidence;
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md` — contract decisions.

When a current fact becomes historical:
- keep the historical record;
- label it with the verification date/commit;
- never leave it in a section that sounds current.

Avoid embedding volatile deployment IDs, test counts, or route inventories unless they have a clear verification date and purpose.

## Legacy architecture note

Earlier Sadat MLS iterations used relational entities such as `offices`, `public.users`, `zones`, `property_types`, `property_images`, `property_favorites`, and other office/agent workflows. Those assumptions are retained only as migration history.

The current live Aqarat schema does not make those historical relations authoritative. Any future replacement must be designed forward from an authoritative Aqarat contract.

## Review checklist

Before merging:
- [ ] Contract matches live Aqarat schema.
- [ ] No legacy runtime references were introduced.
- [ ] No authorization relies on `user_metadata` or browser storage.
- [ ] Public reads expose only approved columns.
- [ ] `npm run contract:check` passes.
- [ ] Self-hosted verification passes.
- [ ] Hosted CI failures, when present, are classified from actual step evidence.
- [ ] Vercel preview/production deployment is READY.
- [ ] Production smoke checks pass.
- [ ] Runtime error sweep is clean for the verified window.
- [ ] Documentation reflects the verified state and clearly labels historical information.

## Current verified release baseline

The baseline preceding this documentation PR was verified on 2026-09-19:
- main: `0e603135cb7c2f87c3c2d00b1be0a56bf0f5946f`;
- production deployment: `dpl_2nRKvAmLKcRSUpRwk7UkgcbDDJEs`;
- production health and public property probes were successful;
- self-hosted verification run #5 on the then-current main passed;
- the repository was clean after the associated release work.

Re-verify and refresh this section after every release affecting runtime or infrastructure.
