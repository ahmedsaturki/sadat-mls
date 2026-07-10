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
# Development
npm run dev                    # Start dev server (localhost:3000)

# Production build
npm run build                  # Production build (requires env vars below)
npm run analyze                # Bundle analysis (ANALYZE=true)

# Testing
npm run test:run               # Unit tests (Vitest) — 753 tests, 50 files (last verified 2026-07-06, head ddd1739)
npm run test:coverage          # Unit tests with coverage report
npm run test:e2e               # E2E tests (Playwright) — 111 tests, 12 files
npm run test:e2e:ui            # E2E tests with Playwright UI
npm run test:e2e:headed        # E2E tests in headed mode
npm run test:e2e:install       # Install Playwright browsers

# Code quality
npm run lint                   # ESLint (extends next/core-web-vitals + next/typescript)
npx tsc --noEmit               # TypeScript check (known issue: metadataBase)

# Database (via Supabase CLI)
npm run db:migrate             # Run: supabase migration up
npm run db:seed                # Run: supabase db seed

# Docker
docker build -t sadat-mls-cloud .
docker run -p 3000:3000 --env-file .env.local sadat-mls-cloud

# Icons
npm run icons:generate         # Generate PWA icons from public/icons/icon-512.png
```

### Required Environment Variables for Build
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Site URL for SEO/sitemap | ✅ (build fails without) |
| `NEXT_PUBLIC_APP_URL` | App URL for metadata | ✅ (build fails without) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | ❌ |
| `SENTRY_ORG` | Sentry organization | ❌ |
| `SENTRY_PROJECT` | Sentry project | ❌ |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps | ❌ |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID | ❌ |

## CI/CD Pipeline (GitHub Actions)
**Order:** `lint → typecheck → test → build`
- **Node:** 22 (not 18+)
- **Runs on:** push/PR to `main`/`master`
- **Build env:** Requires 4 Supabase/SITE_URL secrets

## Code Conventions

- All pages use `"use client"` with dynamic `[locale]` routing (`src/app/[locale]/...`)
- i18n via `next-intl` — **always** use `dict.*` keys, never hardcode text
- Auth checks in `middleware.ts` for `/admin/*` and `/dashboard/*` routes
- `AuthGuard` component wraps admin/dashboard layouts (role-based redirects)
- `PropertyStatus` type in `src/lib/utils/constants.ts` — single source of truth
- `sessionStorage`: **never** stores role, profile, or anything that would let an
  attacker escalate privileges by tampering with browser storage. Allowed keys:
  - `compare_properties` (property comparison feature: ids + display metadata)
  - theme/UI preferences (where applicable)
  - sessionStorage MUST NOT carry `role`, `office_id`, JWT tokens, or any
    field that would be checked server-side for authorization.
- CSP managed **solely** by `middleware.ts` (no CSP in `next.config.js`)
- Logger wraps console with ISO timestamps (`src/lib/logger.ts`) — **never** use `console.error` directly
- Tests use Vitest + @testing-library/react (setup: `src/__tests__/setup.ts`)
- E2E tests use Playwright (Chromium, Firefox, Mobile Chrome)

## Project Structure (Key Paths)

```
sadat-mls-cloud/
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n routes (ar, en)
│   │   │   ├── admin/             # Super Admin Dashboard
│   │   │   ├── dashboard/         # Office Dashboard
│   │   │   ├── explore/           # Public Property Listings
│   │   │   ├── login/             # Authentication
│   │   │   └── ...
│   │   ├── api/                   # API Routes
│   │   ├── og-image/              # Dynamic OG Image Generator
│   │   ├── layout.tsx             # Root Layout
│   │   ├── page.tsx               # Landing Page
│   │   ├── sitemap.ts             # Dynamic Sitemap
│   │   └── robots.ts              # Robots.txt
│   ├── components/
│   │   ├── ui/                    # Base UI Components (Button, Input, Modal, Card, Badge, Select, etc.)
│   │   ├── properties/            # Property Components (PropertyCard, PropertyForm, PropertyDetails, etc.)
│   │   ├── layout/                # Layout Components (Navbar, Sidebar, Footer, MobileBottomNav, NotificationsBell)
│   │   ├── auth/                  # Auth Components (AuthGuard)
│   │   ├── admin/                 # Admin Components (AdminStatCards)
│   │   ├── dashboard/             # Dashboard Components (ActivityFeed)
│   │   ├── landing/               # Landing Page Components (LandingHero, ContactForm)
│   │   └── shared/                # Shared Components (LuxuryErrorBoundary)
│   ├── hooks/                     # Custom React Hooks
│   ├── i18n/                      # Internationalization (config.ts, getMessages.ts, messages/{ar,en}.json, request.ts)
│   ├── lib/
│   │   ├── supabase/              # Supabase Clients (client.ts, server.ts, server-auth.ts, service-role.ts, types.ts)
│   │   ├── security/              # Security Utils (csrf.ts, csrf-client.ts, csrf-constants.ts, rateLimit.ts, rateLimit-client.ts, sanitizeHtml.ts, sanitize.ts, password.ts, password-rules.ts, client.ts)
│   │   ├── auth/                  # Auth Utilities (jwt.ts)
│   │   ├── queries/               # Database Queries (propertyQueries.ts, landing.ts)
│   │   └── utils/                 # Helper Functions (cn.ts, constants.ts, error-handler.ts, activity-logger.ts, notifier.ts, retry.ts, a11y.ts, contact-rate-limit.ts, validationMessages.ts)
│   ├── __tests__/                # Unit Tests (45 files, 710 tests)
├── supabase/
│   └── migrations/                # 23 migrations (001_initial_schema → 023_notifications_i18n_params)
├── e2e/                           # Playwright E2E Tests (11 files)
├── public/                        # Static Assets, PWA (sw.js, manifest.json, icons/)
├── .github/workflows/             # CI/CD (ci.yml)
└── scripts/                       # Utility Scripts (generate-icons.js)
```

## Security Rules

- **CSRF:** Double-submit cookie pattern (`src/lib/security/csrf.ts`)
- **Rate Limiting:** IP-based with memory map + DB fallback (`src/lib/security/rateLimit.ts`)
- **HTML Sanitization:** Multi-pass regex sanitizer (`src/lib/security/sanitizeHtml.ts`) + entity escaping (`sanitize.ts`)
- **UPSERT** for agent creation (DB trigger coexistence)
- **Auth callback** validates origin against allowed hosts whitelist
- **RLS Policies:** 12 tables have policies (offices, users, zones, property_types, properties, property_owners, property_images, contact_requests, property_favorites, user_avatars (in storage), activity_log, notifications)
- **Input Validation:** Zod schemas in `src/lib/validation.ts` (phone optional in contactSchema)
- **Migrations:** Idempotent (DROP TRIGGER/IF EXISTS patterns)
- **Auth Guard:** Component-level with role-based redirects for admin/dashboard

## ESLint Overrides (Documented Exceptions)

```js
// eslint.config.mjs
"react-hooks/set-state-in-effect": "off"  // Client components legitimately use setState in useEffect for:
                                          // - Data fetching
                                          // - Locale detection from URL
                                          // - Auth state checks
                                          // This is standard React pattern for client components

// Test files only:
"@typescript-eslint/no-explicit-any": "off"
```

## Known TypeScript Issues

| File | Error | Status | Notes |
|------|-------|--------|-------|
| `.next/types/app/[locale]/layout.ts` | `metadataBase` incompatible with index signature | **Known/accepted** | Next.js auto-generated types issue; `metadataBase` removed from static exports but still returned in `generateMetadata()` |

> The `metadataBase` export was removed from `src/app/[locale]/layout.tsx` and `src/app/layout.tsx` — it's already returned inside `generateMetadata()` where Next.js expects it. The auto-generated `.next/types/` file still complains; this is harmless and does not affect build or runtime.

## Do NOT

- Do not add external dependencies without checking if a local solution exists
- Do not hardcode Arabic/English text — always use i18n keys (`dict.*`)
- Do not store role/profile in `sessionStorage`
- Do not add CSP headers in `next.config.js` (middleware owns CSP)
- Do not use `console.error` directly — use `logger.error`
- Do not create duplicate matcher patterns in middleware config
- Do not commit `.env.local` or any secrets
- Do not bypass RLS policies in queries (use Supabase client with user context)

## Security Audit Status (2026-06-29)

| Area | Status | Implementation |
|------|--------|----------------|
| **CSRF** | ✅ | `src/lib/security/csrf.ts` (double-submit cookie) |
| **Rate Limiting** | ✅ | `src/lib/security/rateLimit.ts` (in-memory L1 + PostgreSQL L2 hybrid) |
| **HTML Sanitization** | ✅ | `src/lib/security/sanitizeHtml.ts` (multi-pass regex) + `sanitize.ts` (entity escaping) |
| **RLS Policies** | ✅ | All 12 tables (40+ policies) |
| **Input Validation** | ✅ | Zod schemas in `src/lib/validation.ts` |
| **Migrations** | ✅ | All 23 migrations idempotent (DROP TRIGGER/IF EXISTS) |
| **Tests** | ✅ | **710 unit tests** (45 files) + **111 E2E tests** (12 files) passing |
| **CSP** | ✅ | Nonce-based, managed solely by `middleware.ts` |
| **HSTS** | ✅ | 2-year max-age (63072000s) with preload (middleware) |
| **Auth Security** | ✅ | Origin validation, sessionStorage minimal, AuthGuard RBAC |

## Database Schema (Supabase/PostgreSQL)

### Tables (13 total, all with RLS where applicable)

| Table | Description | RLS |
|-------|-------------|-----|
| `offices` | Real estate offices | ✅ |
| `users` | User profiles (extends auth.users) | ✅ |
| `zones` | Sadat City districts | ✅ |
| `property_types` | Property categories | ✅ |
| `properties` | Property listings | ✅ |
| `property_owners` | Owner contact data (sensitive) | ✅ |
| `property_images` | Property photos | ✅ |
| `contact_requests` | Visitor inquiries | ✅ |
| `rate_limit_log` | Rate limiting audit log | ❌ (operational) |
| `rate_limit_state` | Cross-instance rate limit state (atomic upsert) | ❌ (operational) |
| `property_favorites` | User favorite properties | ✅ |
| `activity_log` | Per-office audit trail | ✅ |
| `notifications` | Per-user notification feed | ✅ |
| `storage.objects` (avatars bucket) | User avatar storage | ✅ |

### Roles

- `super_admin` — Full system access (admin panel, all offices)
- `office_admin` — Office management + property management + agent management
- `office_agent` — Property management only

### Key RLS Policies

- Public read for active offices/properties
- Office-based isolation (each office sees only its data)
- Super admin override on all data
- `office_agent`: INSERT + UPDATE on properties
- `contact_requests`: UPDATE policy for status changes
- `property_favorites`: User-scoped CRUD

## PWA Configuration

- **Service Worker:** `public/sw.js` (Workbox, offline-first caching)
- **Manifest:** `public/manifest.json` (name, icons, theme_color, display: standalone)
- **Icons:** `public/icons/icon-{72,96,128,144,152,192,384,512}.png` (generated via `npm run icons:generate`)
- **Offline Support:** Cached static assets, fallback for navigation

## Monitoring & Observability

- **Sentry:** `@sentry/nextjs` (client, server, edge configs in `src/sentry.*.config.ts`)
- **Vercel Analytics:** `@vercel/analytics` (optional)
- **Vercel Speed Insights:** `@vercel/speed-insights` (optional)
- **Logger:** `src/lib/logger.ts` (ISO timestamps, structured logging)

## Performance Optimizations

- Dashboard queries combined into parallel `Promise.all` (7 sequential → 1 parallel)
- Agent API uses UPSERT for DB trigger coexistence
- Image optimization via Next.js Image + Supabase Storage
- ISR for public pages (explore, property details)
- Dynamic OG image generation (`/og-image` route) + static fallback (`public/og-image.png`)

## Accessibility (WCAG 2.1 AA)

- Navbar: Escape key handler, `role="menu"`, `aria-orientation`
- Badge: `aria-label` prop
- PropertyCard: `aria-label` with title and status
- ShareButton/ContactModal/PropertyImageManager: `aria-label` on all buttons
- Focus management, keyboard navigation, RTL-aware focus styles
- E2E accessibility tests (`e2e/accessibility.spec.ts`)

## Recent Major Changes (Changelog Highlights)

### Security Fixes
- Real HTML sanitizer replacing no-op in `sanitizeHtml.ts`
- Rate limit IP extraction fixed for IPv6 safety
- CSP header conflict removed from `next.config.js` (middleware sole owner)
- Auth callback origin validation with allowed hosts whitelist
- SessionStorage privilege escalation fixed (stores only userId + timestamp)
- AuthGuard component with role-based redirects for admin/dashboard

### Performance
- Dashboard queries parallelized (7 sequential → 1 parallel via Promise.all)
- Agent API uses UPSERT to coexist with DB trigger

### i18n
- All hardcoded Arabic text replaced with i18n keys
- Rate limit messages fully internationalized (ar/en)
- Bilingual error pages for admin and dashboard

### Accessibility
- Comprehensive ARIA labeling across interactive components
- Keyboard navigation and focus management
- Escape key handlers on modals/dropdowns

### RLS
- `office_agent`: INSERT + UPDATE policies on properties
- `contact_requests`: UPDATE policy for notes/updates
- `activity_log`: office-scoped SELECT, super-admin override, INSERT for auth users
- `notifications`: user-scoped SELECT/UPDATE, office visibility, super-admin DELETE
- `storage.objects` (avatars): per-user CRUD keyed by `auth.uid()`, super-admin override

## Useful Commands Reference

```bash
# Full verification pipeline (run before PR)
npm run lint && npx tsc --noEmit && npm run test:run && npm run build

# Quick typecheck only
npx tsc --noEmit

# Run specific test file
npx vitest run src/__tests__/sanitizeHtml.test.ts

# Run E2E with specific browser
npx playwright test --project=chromium

# Supabase local development
supabase start
supabase db reset
supabase studio

# Generate new migration
supabase migration new <name>

# Check bundle size
npm run analyze
```

## Component Library (src/components/)

### UI Components (src/components/ui/)
- `Button.tsx` — Primary interactive element
- `Input.tsx` — Form input with validation states
- `Modal.tsx` — Dialog with escape key handler, focus trap
- `Card.tsx`, `LuxuryStatCard.tsx` — Content containers
- `Badge.tsx` — Status indicator with `aria-label` prop
- `LoadingSpinner.tsx`, `LuxuryLoader.tsx` — Loading states
- `Skeleton.tsx` — Content placeholder
- `Select.tsx` — Dropdown selector
- `PaginatedTable.tsx` — Table with pagination
- `ErrorBoundary.tsx`, `ErrorBoundaryWrapper.tsx` — Error handling
- `Toast.tsx` — Notification toast
- `EmptyState.tsx` — Empty state illustration
- `PageHeader.tsx` — Page title wrapper
- `PageLoader.tsx` — Full page loader

### Property Components (src/components/properties/)
- `PropertyCard.tsx` — Property listing card (with `aria-label`)
- `PropertyForm.tsx` — Full property creation/edit form
- `PropertyDetails.tsx` — Property detail view
- `PropertyFeatures.tsx` — Feature list display
- `PropertyBasicInfo.tsx` — Basic property fields
- `PropertyOwnerInfo.tsx` — Owner contact section
- `PropertyImageManager.tsx` — Image upload/management (with aria-labels)
- `PropertyGallery.tsx` — Image gallery view
- `PropertyLightbox.tsx` — Full-screen image viewer
- `SearchFilters.tsx` — Search/filter panel
- `FavoriteButton.tsx` — Add/remove favorite toggle
- `CompareButton.tsx` — Add to comparison
- `ShareButton.tsx` — Native share / copy link
- `ContactModal.tsx` — Contact inquiry modal

### Layout Components (src/components/layout/)
- `Navbar.tsx` — Top nav with locale switch, mobile menu, Escape key handler, `role="menubar"`
- `Sidebar.tsx` — Admin sidebar with role-based link generation
- `MobileBottomNav.tsx` — Mobile bottom navigation
- `DashboardLayout.tsx` — Protected layout wrapper
- `Footer.tsx` — Site footer
- `NotificationsBell.tsx` — Notification dropdown with unread count

### Auth Components (src/components/auth/)
- `AuthGuard.tsx` — Route protection, role-based redirects

### Admin Components (src/components/admin/)
- `AdminStatCards.tsx` — Admin statistics cards

### Landing Components (src/components/landing/)
- `LandingHero.tsx` — Hero section with search
- `ContactForm.tsx` — Public contact form

### Shared Components (src/components/shared/)
- `LuxuryErrorBoundary.tsx` — Premium error UI with CSS animations

## Custom Hooks (src/hooks/)

| Hook | Purpose |
|------|---------|
| `useAuthUser.tsx` | Auth context + profile caching (5min cache, sessionStorage safe) |
| `useDebounce.ts` | Debounce values for search/input |
| `useInfiniteScroll.ts` | Infinite scroll pagination |
| `useCachedQuery.ts` | Cached data fetching |
| `useCompare.ts` | Property comparison state |
| `useSavedSearches.ts` | Saved search management |
| `useUnsavedChangesWarning.ts` | Navigation warning on unsaved edits |
| `useTouchTarget.ts` | Mobile touch target sizing (44px min) |
| `useSwipeGesture.ts` | Mobile swipe gestures |
| `usePageLocale.ts` | Current locale detection |
| `useCopyToClipboard.ts` | Clipboard copy utility |
| `useAdminCrud.ts` | Admin CRUD operations |
| `useOptimisticUpdate.ts` | Optimistic UI updates with rollback on error |
| `useForm.ts` | Generic form state management with validation and dirty tracking |
| `useStorage.ts` | Generic localStorage/sessionStorage wrapper with SSR safety |
| `useBrowser.ts` | Browser API wrappers (interval, timeout, media query, etc.) |
| `useThrottle.ts` | Time-based throttling for callbacks and values |

## UI/UX Patterns

### Design System
- **Colors:** Navy (`#1B2D4F`), Gold (`#C49A2A`) — premium Egyptian real estate aesthetic
- **Font:** Cairo/Tajawal for Arabic, system fonts for English
- **Glassmorphism:** `.glass-luxury` class with 16px backdrop blur, subtle border
- **CSS Utilities:** `.shimmer`, `.glow-pulse`, `.gradient-border`, `.text-gradient-gold`, `.safe-area-*` for mobile

### Accessibility (WCAG 2.1 AA)
- **Keyboard Navigation:** Escape key closes modals/mobile menus; Tab trap in dialogs
- **Focus Styles:** `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2` with RTL-aware positioning
- **ARIA Labels:** All interactive elements have `aria-label` or `aria-labelledby`
- **Roles:** `role="dialog"`, `role="menu"`, `role="menuitem"`, `role="menubar"`, `aria-modal="true"`

### Mobile Experience
- **Touch Targets:** Minimum 44×44px via `useTouchTarget` hook
- **Mobile Menu:** Collapsible with smooth height transition
- **Swipe Gestures:** Horizontal swipe support via `useSwipeGesture`

### Loading States
- **Skeleton Screens:** Content placeholders for perceived performance
- **LuxuryLoader:** Premium animated loader for luxury UX
- **Button Loading:** Spin animation + `aria-busy` state

### RTL (Arabic) Support
- Default locale is Arabic (`ar`)
- All layout components support RTL direction
- Icons and spacing flip automatically

## API Routes (src/app/api/)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/health` | Health check | ❌ |
| POST | `/api/agents` | Create agent (UPSERT) | ✅ Super Admin + Office Admin |
| DELETE | `/api/agents?id={id}` | Delete agent | ✅ Super Admin + Office Admin |
| POST | `/api/auth/resend-verification` | Resend email verification | Rate limited |
| GET | `/api/auth/forgot-rate-limit` | Check rate limit status | ❌ |
| POST | `/api/auth/rate-limit` | Record rate limit attempt | ❌ |
| POST | `/api/ai/description` | AI property description (mock) | Rate limited |
| GET | `/api/activity` | List office activity feed | ✅ Auth + Rate limited |
| POST | `/api/activity` | Log activity event | ✅ Auth + CSRF + Rate limited |
| GET | `/api/notifications` | List user notifications | ✅ Auth + Rate limited |
| POST | `/api/notifications` | Create notification | ✅ Auth + CSRF + Rate limited |
| PATCH | `/api/notifications` | Mark notifications read | ✅ Auth + CSRF + Rate limited |
| DELETE | `/api/notifications/cleanup` | Cleanup old notifications | ✅ Super Admin + CSRF + Rate limited |
| POST | `/api/admin/users` | Admin user management | ✅ Super Admin + CSRF + Rate limited |
| POST | `/api/contact` | Public contact request submission | ✅ CSRF + Rate limited |
| POST | `/api/csp-report` | CSP violation reporting | ❌ |
| GET | `/api/offices` | Office management | ✅ Auth + Rate limited |
| GET | `/api/offices/active` | Active offices listing | ❌ |

### API Implementation Details

**`/api/agents` (POST)**
- Validates CSRF token via double-submit cookie pattern
- Rate limits by IP (`agents-post:{ip}`)
- Uses service role key for admin operations
- Role assignment: SUPER_ADMIN can create any role, OFFICE_ADMIN creates OFFICE_AGENT
- Implements office ownership validation for OFFICE_ADMIN
- UPSERT pattern to coexist with DB triggers

**`/api/agents` (DELETE)**
- Validates target user belongs to admin's office (for OFFICE_ADMIN)
- Restricts deletion to OFFICE_AGENT users only (for OFFICE_ADMIN)
- Logs deletion events with actor information

**`/api/ai/description`**
- Rate limited by IP (`ai-description:{ip}`)
- Accepts title, property_type, zone, area, bedrooms, bathrooms
- Generates template-based property description (mock LLM)
- No auth required (intended for office_agent use from dashboard)

### Rate Limiting Headers
All rate-limited endpoints return:
- `Retry-After` — Seconds until retry allowed
- `X-RateLimit-Remaining` — Remaining attempts
- `X-RateLimit-Reset` — Unix timestamp of reset time

## Key Routes (src/app/[locale]/)

### Public
- `/[locale]` — Landing page
- `/[locale]/explore` — Property listings (ISR)
- `/[locale]/explore/[id]` — Property detail
- `/[locale]/offices/[slug]` — Office profile
- `/[locale]/login` — Authentication
- `/[locale]/forgot-password` — Password reset
- `/[locale]/reset-password` — Set new password
- `/[locale]/verify-email` — Email verification

### Protected (AuthGuard)
- `/[locale]/dashboard` — Office dashboard
- `/[locale]/dashboard/properties` — Property CRUD
- `/[locale]/dashboard/properties/new` — Create property
- `/[locale]/dashboard/properties/[id]/edit` — Edit property
- `/[locale]/dashboard/agents` — Agent management
- `/[locale]/dashboard/favorites` — Favorite properties
- `/[locale]/dashboard/saved-searches` — Saved searches
- `/[locale]/dashboard/compare` — Property comparison
- `/[locale]/dashboard/contact-requests` — Contact requests
- `/[locale]/dashboard/settings` — Office settings
- `/[locale]/admin` — Super admin panel
- `/[locale]/admin/zones` — Zone management
- `/[locale]/admin/property-types` — Property types
- `/[locale]/admin/offices` — Office management
- `/[locale]/admin/contact-requests` — All contact requests
- `/[locale]/admin/analytics` — Platform analytics

## References

### Lib Layer (src/lib/)

| Path | Purpose |
|------|---------|
| `utils/constants.ts` | ROLES, PERMISSIONS, PROPERTY_STATUSES |
| `utils/cn.ts` | Tailwind class merger (clsx + twMerge) |
| `utils/error-handler.ts` | Supabase/network error mapping with i18n keys |
| `validation.ts` | Zod schemas: agentSchema, propertySchema, ownerSchema, officeSchema, authSchemas |
| `logger.ts` | Logger wrapper with ISO timestamps, structured logging |
| `permissions.ts` | Permission checking (hasPermission, hasAllPermissions, hasAnyPermission, getPermissions) |
| `security/csrf.ts` | Double-submit cookie pattern, token rotation (24hr), constant-time comparison |
| `security/csrf-client.ts` | Client-side CSRF utilities |
| `security/csrf-constants.ts` | Shared CSRF constants (cookie name, header name, token generation, expiry check) |
| `security/rateLimit.ts` | IP-based rate limiting with in-memory L1 + PostgreSQL L2 (risk-level configs, RFC headers) |
| `security/rateLimit-client.ts` | Client-side rate limit check |
| `security/sanitizeHtml.ts` | Multi-pass regex HTML sanitizer |
| `security/sanitize.ts` | Entity escaping utilities |
| `security/password.ts` | Bcrypt password hashing (12 rounds, 128-char truncation) |
| `security/password-rules.ts` | Client-safe password validation rules |
| `security/client.ts` | Client-side security manager (login lockout, nonce generation) |
| `supabase/client.ts` | Browser Supabase client |
| `supabase/server.ts` | Server Supabase client (RLS-aware) |
| `supabase/server-auth.ts` | Server-side auth helpers |
| `supabase/service-role.ts` | Admin client (bypasses RLS) |
| `supabase/types.ts` | Database types generated from schema |
| `queries/propertyQueries.ts` | Property comparison queries with joins |
| `queries/landing.ts` | Landing page data (featured properties, counts) |
| `auth/jwt.ts` | JWT utilities |

### References

- `CLAUDE.md` — Additional agent context
- `README.md` — Full project documentation
- `SECURITY.md` — Security policy
- `PAMPHLET-PERFORMANCE.md` — Performance optimization guide
- `src/lib/security/` — Security implementations
- `middleware.ts` — Auth, locale, CSP, security headers
- `supabase/migrations/` — Database schema evolution

## Database Migrations (supabase/migrations/)

| Migration | Description |
|-----------|-------------|
| `001_initial_schema.sql` | Core tables: offices, users, zones, property_types, properties |
| `002_rls_policies.sql` | Row Level Security policies for all tables |
| `003_office_logos_bucket.sql` | Supabase Storage bucket for office logos |
| `004_rate_limit_log.sql` | Rate limiting audit log table |
| `005_performance_indexes.sql` | Database indexes for query optimization |
| `006_contact_request_fix.sql` | Contact requests table fixes |
| `007_property_favorites.sql` | Property favorites table with user-scoped RLS |
| `008_full_text_search.sql` | Full-text search indexes with Arabic config |
| `009_security_hardening.sql` | Security hardening (RLS, policies, triggers) |
| `010_performance_and_rls_fixes.sql` | Performance indexes and RLS policy fixes |
| `011_rls_final_fix.sql` | Final RLS policy corrections |
| `012_fix_duplicate_policies.sql` | Remove duplicate RLS policies |
| `013_fix_rate_limit_rls.sql` | Re-disable RLS on rate_limit_log |
| `014_performance_indexes.sql` | Additional performance indexes |
| `015_contact_requests_rls_hardening.sql` | Tightens `contact_requests` INSERT (active-office + contact_type) + validation trigger |
| `016_user_avatars.sql` | Adds `users.avatar_url` + `avatars` bucket + storage RLS keyed on `auth.uid()` |
| `017_activity_log.sql` | `activity_log` table, office-scoped SELECT, super-admin override, INSERT for auth users |
| `018_notifications.sql` | `notifications` table, user/office-scoped SELECT+UPDATE, super-admin DELETE |
| `019_idempotent_rls_recreate.sql` | Idempotent re-creation patterns for `activity_log` + `notifications` policies (partial-failure recovery) |
| `020_add_status_to_contact_requests.sql` | Adds `status` column (pending/read/resolved) |
| `021_add_description_to_offices.sql` | Adds `description` column to offices |
| `022_rate_limit_state.sql` | Cross-instance rate limit state table + `increment_rate_limit()` atomic function |
| `023_notifications_i18n_params.sql` | Adds `title_params` and `message_params` JSONB columns to notifications |

> **Note:** AGENTS.md previously listed only `001–014`. Migrations `015–018` were added later but went undocumented; verified loaded 2026-07-05 at head `bdff3bb`. Migration `019` (this commit) adds `DROP POLICY IF EXISTS` re-creation for migrations `017`/`018` so the system handles partial-failure recovery correctly.

## E2E Tests (e2e/)

| Test File | Focus Area | Tests |
|-----------|------------|-------|
| `accessibility.spec.ts` | WCAG 2.1 AA compliance | 5 |
| `admin.spec.ts` | Super admin flows | 20 |
| `auth.spec.ts` | Authentication | 15 |
| `compare.spec.ts` | Property comparison | 7 |
| `explore.spec.ts` | Property listings/browse | 12 |
| `favorites.spec.ts` | Favorites | 6 |
| `flows.spec.ts` | End-to-end user flows | 10 |
| `homepage.spec.ts` | Landing page | 12 |
| `login.spec.ts` | Login flows | 10 |
| `saved-searches.spec.ts` | Saved searches | 6 |
| `security.spec.ts` | Security/CSRF/XSS | 8 |
| `auth.setup.ts` | Auth state setup (not a spec) | — |

> **Note:** Last verified 2026-07-05 at head `bdff3bb`. Two spec files referenced in older docs (`navigation.spec.ts`, `property-details.spec.ts`) are no longer present in `e2e/`. `auth.setup.ts` is the Playwright setup file, not a spec. E2E runs via `npx playwright test` (not via a package.json script — verify whether to wire it).

## Middleware Configuration (middleware.ts)

### Matchers
```ts
matcher: ["/((?!api|_next/static|_next/image|favicon.ico|og-image|sw.js|manifest.json|icons/).*)"]
```

### Security Headers (applied to all routes)
| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (deprecated, CSP replaces) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | Nonce-based, dynamic per request |

### CSP Nonce Generation
- Cryptographically random 16-byte nonce per request
- Base64 encoded, attached to `<script>` tags
- `report-uri` directive for CSP violation reporting

## Deployment (vercel.json)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

## Performance Metrics

| Metric | Target | Implementation |
|--------|--------|----------------|
| **LCP** | < 2.5s | ISR, Next.js Image, Supabase Storage |
| **FID** | < 100ms | Code splitting, lazy loading |
| **CLS** | < 0.1 | Skeleton screens, aspect-ratio |
| **TTFB** | < 200ms | Edge functions, caching |

## State Management Patterns

- **URL State**: Search filters, pagination via query params
- **React State**: Form inputs, modals, local UI state
- **Context**: Auth (`useAuthUser`), Toast notifications
- **Server State**: Supabase queries with SWR-like patterns
- **sessionStorage**: see storage rule in **Code Conventions** — only feature data (e.g. `compare_properties`), never role/profile/tokens

## Error Handling Strategy

| Layer | Handler | Recovery |
|-------|---------|----------|
| **Component** | `ErrorBoundary` | Fallback UI, retry button |
| **Page** | `error.tsx` | Page-level error boundary |
| **Global** | `global-error.tsx` | App-wide crash recovery |
| **API** | Try/catch + `NextResponse` | Structured error responses |
| **Database** | RLS policies | Graceful 403/404 responses |