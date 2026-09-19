# Agent Context for Sadat MLS Cloud

## Current authoritative state — 2026-09-19

Sadat MLS is currently a bilingual public real-estate property experience backed by the verified Aqarat OS schema. The historical Sadat MLS relational model is not the runtime source of truth.

- Production: https://sadat-mls.vercel.app
- Current main: `664fc39b1743059d84d72b86d921c8085d06e84e`
- Current production deployment: `dpl_GF6csFucVqiSbLWDhBoo9y3gwgJP` (READY)
- Framework: Next.js 16.2.10
- Runtime: Node 24
- Database/Auth: Supabase
- Testing: Vitest + Playwright

## Authoritative product rules

Use the live Aqarat schema and checked-in contract as the source of truth. Do not resurrect legacy tables or invent Auth↔people, media, favorites, saved-search, office, or agent mappings without an authoritative contract.

Public property access is intentionally fail-closed: active rows only, approved public columns only, RLS plus column-level grants. User-editable Auth metadata is never an authorization source.

## Commands

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run test:run
npm run contract:check
npm run build
npm run test:e2e
```

## CI

The repository-owned self-hosted verification workflow checks install, lint, adapter smoke, typecheck, schema contract, tests, build, and `git diff --check` on pull requests and pushes to `main`.

The separate hosted CI contains secret-dependent type generation, Playwright E2E, and production health checks. Preserve those gates; do not weaken them to conceal infrastructure failures.

## Security conventions

- CSRF protection for required state-changing flows.
- Documented IP rate limits with fail-closed protected operations.
- Server-only privileged Supabase credentials.
- No role/office authorization values in browser storage.
- No authorization based on `user_metadata`.
- Use the project logger rather than direct `console.error`.
- Never commit `.env*`, tokens, passwords, or privileged keys.

## References

`README.md`, `API.md`, `SECURITY.md`, `IMPLEMENTATION_PLAN.md`, and `docs/PLATFORM_SCHEMA_CONTRACT_MATRIX.md` are the canonical project references.