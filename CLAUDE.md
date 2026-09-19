# Agent Context for Sadat MLS Cloud

## Project Overview
Bilingual (Arabic/English) real estate MLS platform for Sadat City, Egypt. Built with Next.js 16.2.10 App Router, Supabase, Tailwind CSS 4, and TypeScript.

**Production URL:** https://sadat-mls.vercel.app  
**Alias:** https://sadat-mls.vercel.app

## Tech Stack
- **Framework:** Next.js 16.2.10 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT + Cookies)
- **Storage:** Supabase Storage
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry
- **Deployment:** Vercel

## Build & Test Commands
```bash
# Build
npm run build

# Unit tests
npm run test:run

# Unit tests with coverage
npm run test:coverage

# Lint
npm run lint

# TypeScript check
npx tsc --noEmit

# E2E tests
npm run test:e2e
```

## Project Structure
- `src/app/[locale]/` - i18n routes (ar, en)
- `src/app/[locale]/admin/` - Super Admin Dashboard
- `src/app/[locale]/dashboard/` - Office Dashboard
- `src/app/[locale]/explore/` - Public Property Listings
- `src/app/api/` - API Routes
- `src/components/` - React Components
- `src/hooks/` - Custom React Hooks
- `src/i18n/` - Internationalization
- `src/lib/` - Utilities & Services
- `src/__tests__/` - Unit Tests

## Key Conventions
- All pages use `"use client"` with dynamic `[locale]` routing
- i18n via `next-intl` with `dict.*` keys
- Auth checks in middleware for protected routes
- Role-Based Access Control: `super_admin`, `office_admin`, `office_agent`
- CSRF protection on mutating API requests
- Rate limiting on API and contact forms
- CSP with nonce-based scripts

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `NEXT_PUBLIC_SITE_URL` - Site URL for SEO
- `NEXT_PUBLIC_APP_URL` - App URL for metadata
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (optional)

## Database Tables
- `offices` - Real estate offices
- `users` - User profiles (extends auth.users)
- `zones` - Sadat City districts
- `property_types` - Property categories
- `properties` - Property listings
- `property_owners` - Owner contact data
- `property_images` - Property photos
- `contact_requests` - Visitor inquiries
- `rate_limit_log` - Rate limiting audit log

## Testing
- **Unit Tests:** Vitest with @testing-library/react (753 tests, 50 files)
- **E2E Tests:** Playwright (111 tests, 12 files)
- Verify with: `npm run test:run && npm run test:e2e`

## Security
- CSP with nonce-based scripts
- CSRF double-submit cookie pattern
- Rate limiting (memory + database fallback)
- XSS prevention with input sanitization
- HSTS with 1-year max-age
- RLS on all database tables
- RBAC with 3 user roles
