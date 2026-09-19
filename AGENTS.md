# Agent Rules for Sadat MLS Cloud

## Authoritative state — 2026-09-19

This file is the operational guide for the current repository. The live Aqarat OS schema, the checked-in application contract, and verified production behavior are authoritative; older historical Sadat MLS assumptions are retired.

- Production: https://sadat-mls.vercel.app
- Supabase project: `aaxauqznfhcvgevfczye`
- Current `main`: `664fc39b1743059d84d72b86d921c8085d06e84e`
- Current production deployment: `dpl_GF6csFucVqiSbLWDhBoo9y3gwgJP` (READY)
- Framework: Next.js 16.2.10 App Router
- Runtime/tooling baseline: Node 24, npm 12
- Database: Supabase PostgreSQL using the Aqarat OS migration lineage
- Public product scope: bilingual public property browsing, search/filter/sort, property detail, authentication entry point, and protected request flows that have authoritative backing

## Completion and change discipline

Use SPEC → IMPLEMENT → TEST → VERIFY → RELEASE → FREEZE. Do not mark a feature complete until its data contract, implementation, security boundary, automated verification, and production behavior agree.

- Treat the live Aqarat OS schema as the source of truth.
- Do not recreate retired legacy tables solely to satisfy code or tests.
- Do not weaken tests to hide integration or schema failures.
- Keep unknown Auth↔business mappings unknown until authoritative evidence exists.
- Do not expose internal Aqarat property fields through public queries.
- Keep repository migrations synchronized with actually applied Supabase migration versions.

## Current product boundaries

Certified public surfaces include:

- `/[locale]/explore` and `/[locale]/explore/[id]`
- `/[locale]/login` and supported Auth entry flows
- `GET /api/properties` and `GET /api/health`
- supported filters/sorts and public property comparison/share UI

Deliberately unresolved/retired until an authoritative contract exists:

- Auth user ↔ business `people` identity and office/organization role mapping
- property media persistence/storage relations
- favorite persistence
- saved-search persistence
- historical office/admin/agent workflows based on the retired relational model

See `README.md`, `API.md`, `SECURITY.md`, and `IMPLEMENTATION_PLAN.md` for the current contract.

## Build and verification

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run test:run
npm run contract:check
npm run build
npm run test:e2e
```

For the normal local build, required environment values are the canonical Supabase public URL/publishable key, the server-only privileged key, and the documented site/app URLs. Never commit environment files or secrets.

## GitHub Actions

` .github/workflows/self-hosted-verification.yml` (without the leading space in the path) is the repository-owned non-secret verification companion. It runs on pull requests and pushes to `main` and verifies install, lint, adapter smoke, typecheck, schema contract, tests, build, and diff cleanliness.

`.github/workflows/ci.yml` remains the independent hosted pipeline because it contains secret-dependent Supabase type generation, Playwright E2E, and production health checks. A hosted `lint` failure before any steps are created is an infrastructure/admission signal, not evidence that the repository lint command failed; do not hide it with weaker gates.

## Security invariants

- Public `properties` reads are constrained by RLS and column-level grants to active/public fields.
- Internal fields such as `confidence`, `parcel_number`, `installments_clear`, and `canonical_key` are not part of the public grant.
- Supabase service-role credentials are server-only.
- Do not infer authorization from `user_metadata.role` or `user_metadata.office_id`.
- Mutating public requests use CSRF protection where required.
- Public and protected request surfaces use the documented rate limits and fail closed when protected operational dependencies are unavailable.
- Never store roles, office IDs, JWTs, or authorization inputs in browser storage.
- Use `logger` instead of direct `console.error`.

## Engineering conventions

- Keep Arabic/English UI text in the existing i18n system; do not hardcode user-facing strings where translation keys exist.
- Use the existing Supabase client helpers and public/privileged separation.
- Keep contract checks deterministic and fail closed.
- Avoid new dependencies when the existing stack can solve the problem.
- Verify production behavior after any release-affecting change.
- Do not treat historical docs, debug logs, or old route tables as current runtime truth without re-verification.

## Local runner

The self-hosted GitHub Actions runner is installed as a system service in `~/actions-runners/sadat-mls` and must be operated through the service (`svc.sh`). Do not run `./run.sh` while the service is active because that creates a second runner session.

## Canonical references

- `README.md` — current production status and scope
- `API.md` — supported API surface
- `SECURITY.md` — current security contract
- `IMPLEMENTATION_PLAN.md` — delivery/completion record
- `docs/PLATFORM_SCHEMA_RECONCILIATION.md` — schema reconciliation decisions
- `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md` — contract matrix