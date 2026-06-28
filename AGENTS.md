# Agent Rules for Sadat MLS Cloud

## Project Context
Bilingual (Arabic/English) real estate MLS platform for Sadat City, Egypt.
- **Stack:** Next.js 14 (App Router), Supabase, Tailwind CSS 4, TypeScript
- **Deployed at:** https://sadat-mls.vercel.app
- **Default locale:** Arabic (RTL)
- **Auth:** Email/password via Supabase (no OAuth)
- **Roles:** `super_admin`, `office_admin`, `office_agent`

## Build & Test

```bash
npm run build            # Production build
npm run test:run         # Unit tests (Vitest)
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check
```

## Code Conventions

- All pages use `"use client"` with dynamic `[locale]` routing
- i18n via `next-intl` — always use `dict.*` keys, never hardcode text
- Auth checks in middleware for /admin/* and /dashboard/* routes
- `AuthGuard` component wraps admin/dashboard layouts
- `PropertyStatus` type in `constants.ts` — single source of truth
- sessionStorage stores only userId + timestamp (never role/profile)
- CSP managed solely by `middleware.ts`
- Logger wraps console with ISO timestamps (`src/lib/logger.ts`)
- Tests use Vitest + @testing-library/react

## Security Rules

- CSRF: double-submit cookie pattern
- Rate limiting: IP-based with memory + DB fallback
- HTML sanitization: multi-pass regex sanitizer
- UPSERT for agent creation (DB trigger coexistence)
- Auth callback validates origin against allowed hosts

## Do NOT

- Do not add external dependencies without checking if a local solution exists
- Do not hardcode Arabic/English text — always use i18n keys
- Do not store role/profile in sessionStorage
- Do not add CSP headers in next.config.js (middleware owns CSP)
- Do not use `console.error` directly — use `logger.error`
- Do not create duplicate matcher patterns in middleware config
