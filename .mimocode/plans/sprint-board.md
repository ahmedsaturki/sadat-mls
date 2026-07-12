# Sprint Board: sadat-mls-cloud

## Sprint 1 — Security Hardening & Code Quality (DONE)

**PR**: [#9](https://github.com/ahmedsaturki/sadat-mls/pull/9) — merged to main

### Completed

| # | Item | Severity | Status |
|---|------|----------|--------|
| 1 | CSRF token generation consolidated (csrf-constants.ts) | Low | Done |
| 2 | DB-backed rate limiting (rate_limit_state + increment_rate_limit) | Medium | Done |
| 3 | AGENTS.md comprehensive accuracy fix (9 phantom refs, 22 missing files, 6 outdated counts) | Info | Done |
| 4 | types.ts updated to match actual schema (title_params, message_params, increment_rate_limit) | Medium | Done |
| 5 | 13 new rate limit unit tests (key parsing, window calc, L1/L2 flow, edge cases) | Low | Done |
| 6 | Deep security audit + fixes (search param injection, getAdminClient dedup, activity try/catch, notifications 429 headers) | Medium | Done |
| 7 | HTML sanitizer replaced with DOMPurify (isomorphic-dompurify + CSS expression hook) | Low | Done |
| 8 | Removed unused JwtService (dead code) | Info | Done |
| 9 | parseInt radix 10 in notification/activity routes | Low | Done |

---

## Sprint 2 — Testing, Performance & Reliability

### High Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 10 | Verify E2E tests pass after all sprint 1 changes | Run `npx playwright test` across all 5 projects (chromium, admin-chromium, firefox, mobile-chrome) to confirm no regressions | Medium |
| 11 | Add E2E tests for rate limiting | Test that rate-limited endpoints return 429 with correct headers after exceeding limits | Medium |
| 12 | Bundle size audit | Run `npm run analyze` to check impact of DOMPurify + pg dependencies on bundle size. DOMPurify is ~10KB minified — verify it's only loaded server-side | Low |
| 13 | Performance profiling | Run Lighthouse on key pages (landing, explore, property detail) to establish Core Web Vitals baseline | Medium |

### Medium Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 14 | i18n parity audit | Verify all user-facing strings use `dict.*` keys. Check for any hardcoded Arabic/English text in components | Low |
| 15 | API response caching | Add `Cache-Control` headers to public endpoints (offices/active, explore listings) to reduce origin load | Low |
| 16 | Error monitoring setup | Verify Sentry DSN is configured, test error reporting works end-to-end | Low |
| 17 | Supabase connection pooling | Review Supabase client creation patterns — ensure no connection leaks in serverless functions | Medium |

### Low Priority / Backlog

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 18 | Auto-generate types.ts from Supabase schema | Add `supabase gen types typescript` to CI to prevent future schema drift (supplements manual types.ts) | Medium |
| 19 | API documentation | Add JSDoc comments to all API route handlers with request/response schemas | Medium |
| 20 | Contact form CSRF hardening | Contact endpoint uses service-role client bypassing RLS — consider using anon key with RLS as defense-in-depth | Low |
| 21 | Rate limit state cleanup cron | Set up Supabase pg_cron or periodic cleanup for rate_limit_state table (currently lazy cleanup only) | Low |
| 22 | Accessibility audit | Run full WCAG 2.2 audit on all pages — existing tests cover basics but comprehensive audit may find gaps | Medium |
| 23 | Dark mode support | Implement dark mode toggle with proper contrast ratios | High |

---

## Sprint 3 — Features & Polish

### High Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 24 | Property search improvements | Add full-text search UI with Arabic language support on the explore page | Medium |
| 25 | Notification preferences | Allow users to configure which notification types they receive | Medium |
| 26 | Office profile editing | Allow office admins to edit their office profile (name, description, logo) | Medium |

### Medium Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 27 | Agent invitation flow | Email-based agent invitation with magic link instead of admin-created accounts | High |
| 28 | Property analytics | Track views, inquiries, favorites per property for office admins | Medium |
| 29 | Bulk operations | Bulk status changes, bulk delete for properties and contact requests | Medium |
| 30 | Export functionality | Export properties/contacts to CSV for office admins | Medium |

### Low Priority / Backlog

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 31 | Multi-office comparison | Compare offices side-by-side (listings, agents, ratings) | Medium |
| 32 | Saved search alerts | Email notifications when new properties match saved search criteria | High |
| 33 | Mobile app (PWA) | Enhance PWA with offline support, push notifications, install prompt | High |
| 34 | Multi-language expansion | Add English as full primary language (not just Arabic fallback) | High |

---

## Sprint 8 — WCAG 2.2 Accessibility Audit (DONE)

| # | Item | Status |
|---|------|--------|
| 35 | WCAG contrast fixes (53 locations: text-gray-400 → text-gray-500) | Done |
| 36 | Touch target fixes (2 locations: PropertiesDashboardClient, PropertyCard) | Done |
| 37 | Committed and deployed as PR #12 | Done |

---

## Sprint 9 — Developer & Project Tables (DONE)

**Commit**: `4731e4b` — feat: add developers and projects tables, admin CRUD, and public pages
**Migration**: 028_developers_projects.sql (applied in Supabase Dashboard)
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Files | Status |
|---|------|-------|--------|
| 38 | Database migration 028 (developers, projects, property_projects tables + RLS + indexes + triggers) | `supabase/migrations/20240101000028_developers_projects.sql` | Done |
| 39 | TypeScript types for all 3 new tables | `src/lib/supabase/types.ts` | Done |
| 40 | Zod validation schemas (developerSchema, projectSchema) | `src/lib/validation.ts` | Done |
| 41 | Permissions + constants (DEVELOPER_*, PROJECT_*, PROJECT_STATUSES) | `src/lib/utils/constants.ts` | Done |
| 42 | i18n keys — 40+ keys in English and Arabic | `src/i18n/messages/en.json`, `ar.json` | Done |
| 43 | Admin developers page (server + client) | `src/app/[locale]/admin/developers/page.tsx`, `src/components/admin/AdminDevelopersClient.tsx` | Done |
| 44 | Admin projects page (server + client) | `src/app/[locale]/admin/projects/page.tsx`, `src/components/admin/AdminProjectsClient.tsx` | Done |
| 45 | Sidebar links for developers + projects (super_admin) | `src/components/layout/Sidebar.tsx` | Done |
| 46 | Public developer directory | `src/app/[locale]/developers/page.tsx`, `src/components/developers/DevelopersClient.tsx` | Done |
| 47 | Developer detail page | `src/app/[locale]/developers/[slug]/page.tsx` | Done |
| 48 | Public project directory | `src/app/[locale]/projects/page.tsx`, `src/components/projects/ProjectsClient.tsx` | Done |
| 49 | Project detail page | `src/app/[locale]/projects/[slug]/page.tsx` | Done |
| 50 | Seed data (3 developers + 6 projects for Sadat City) | `supabase/seed_028.sql` | Done |
| 51 | Verify: TypeScript clean, 709 tests pass, 42 routes built | — | Done |

---

## Sprint 10 — Email Notifications (DONE)

**Commit**: `c3adb44` — feat: add email notifications via Resend (5 email types)
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 52 | Email notifications (Resend SDK, 5 templates, contact/agent integration, settings toggles) | Done |
| 67 | Migration 029 (updated notification_preferences defaults) | Done |

---

## Sprint 11 — WCAG 2.2 Accessibility Fixes (DONE)

**Commit**: `2a993d0` — fix: WCAG 2.2 accessibility — touch targets + aria-live for dynamic lists

### Completed

| # | Item | Status |
|---|------|--------|
| 55 | Touch targets: 10 icon-only buttons (AdminOffices, AdminZones, AdminPropertyTypes, PropertyForm, PageHeader) | Done |
| 55 | aria-live: 4 dynamic lists (Notifications, ContactRequests, Messages, Favorites) | Done |

---

## Sprint 12 — Office Self-Registration (DONE)

**Commit**: `b76db6d` — feat: office self-registration with admin approval flow
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 53 | Office self-registration (form, API, approval, emails) | Done |
| 68 | Migration 030 (status column on offices table) | Done |

---

## Sprint 13 — Property Status Workflow (DONE)

**Commit**: `d546185` — feat: property status workflow — offer pipeline with accept/reject/counter
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 54 | Property status workflow (offers table, API, form, dashboard, accept/reject/counter, emails) | Done |
| 69 | Migration 031 (property_offers table with RLS) | Done |

---

## Sprint 14 — Advanced Search Enhancements (DONE)

**Commit**: `38385f8` — feat: advanced search — developer/project/office filters + URL sync
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 56 | Advanced search: developer/project/office filters + cascading + URL sync | Done |

---

## Sprint 15 — Map View (DONE)

**Commit**: `18a4868` — feat: map view for explore page with Leaflet (free, no API key)
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 57 | Map view: Leaflet + OpenStreetMap (free), colored markers, popups, grid/map toggle | Done |
| 70 | Migration 032 (latitude/longitude columns on properties) | Done |

---

## Sprint 16 — Agent Public Profiles (DONE)

**Commit**: `e09b8d5` — feat: enhanced agent public profiles with SSR, avatar, stats, and contact buttons
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 58 | Agent public profiles: SSR metadata, avatar, stats, contact buttons, office link | Done |

---

## Sprint 17 — Saved Search Alerts (DONE)

**Commit**: `0b93d4c` — feat: saved search alerts — database-backed saved searches with email notifications
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 59 | Saved search alerts: DB-backed saved searches + check endpoint + email notifications | Done |
| 71 | Migration 033 (saved_searches table with RLS) | Done |

---

## Sprint 18 — Market Analytics (DONE)

**Commit**: `a37a029` — feat: market analytics — price per sqm, zone comparison, price distribution, activity
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 60 | Market analytics: price/sqm, zone comparison, price distribution, recent activity | Done |

---

## Sprint 19 — Commission Tracking (DONE)

**Commit**: `cca8969` — feat: commission tracking — auto-create on offer accept, dashboard with filters
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 61 | Commission tracking: auto-create on offer accept, dashboard, mark as paid | Done |
| 72 | Migration 034 (property_commissions table with RLS) | Done |

---

## Sprint 20 — Multi-City Support (DONE)

**Commit**: `bb7073a` — feat: multi-city support — cities table, city selector, city selection page
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 62 | Multi-city support: cities table, city selector, city selection page | Done |
| 73 | Migration 035 (cities table + city_id on offices/zones/properties) | Done |

---

## Sprint 21 — Dark Mode (DONE)

**Commit**: `26b3b8d` — feat: dark mode — theme toggle with system preference detection
**Deployed**: Vercel auto-deploy from main

### Completed

| # | Item | Status |
|---|------|--------|
| 63 | Dark mode: theme toggle, system detection, localStorage persistence, key components | Done |

---

## Phase 1 Roadmap — What's Left

### LOW Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 64 | Rate limit cleanup cron | Supabase pg_cron for rate_limit_state | Low |
| 65 | API docs JSDoc | Request/response schemas | Low |
| 66 | Auto-gen types.ts in CI | `supabase gen types typescript` in CI | Low |

---

## Phase 2 Roadmap — Production Polish & Growth

### HIGH Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 67 | Developer public profiles | Public pages with their projects and properties | Done |
| 68 | Project detail enhancement | Full project page with linked properties, developer info, status timeline | Done |
| 69 | Office dashboard analytics | Per-office stats: views, inquiries, conversion rates, agent performance | Done |
| 70 | Property analytics tracking | View counts, inquiry counts per property (server-side) | Done |
| 71 | Email notification preferences UI | Full preferences page with per-type email/push toggles | Done |

### MEDIUM Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 72 | SEO: structured data + sitemap | JSON-LD for properties, auto-generated sitemap.xml | Done |
| 73 | Property image optimization | Image compression, WebP conversion, lazy loading | Done |
| 74 | Inter-office messaging enhancement | File attachments, read receipts, conversation threads | Done |
| 75 | Mobile UX improvements | Bottom sheet filters, swipe cards, touch gestures | Done |
| 76 | Performance: code splitting | Lazy load heavy components, reduce bundle size | Done |

### LOW Priority

| # | Item | Description | Effort |
|---|------|-------------|--------|
| 77 | Multi-language expansion | Support for more languages beyond AR/EN | Done |
| 78 | Property comparison charts | Visual comparison with charts, not just tables | Done |
| 79 | Export: PDF property reports | Generate PDF property sheets for sharing | Done |
| 80 | Rate limit cleanup cron | Supabase pg_cron for rate_limit_state | Done |
| 81 | API docs JSDoc | Request/response schemas | Done |
| 82 | Auto-gen types.ts in CI | `supabase gen types typescript` in CI | Done |

---

## Sprint 38 — Saved Search Auto-Alerts (DONE)

**Commit**: `8b19f21` — feat: saved search auto-alert cron + notification preference + CSRF fix

| # | Item | Status |
|---|------|--------|
| 83 | Cron endpoint `/api/cron/saved-searches` (daily 8 AM) | Done |
| 84 | Iterates all active saved searches across all users | Done |
| 85 | Honors `notification_preferences.saved_search_email` toggle | Done |
| 86 | Fetches zone names for property details in emails | Done |
| 87 | Fix check route: respect notification preferences + user locale | Done |
| 88 | Fix explore page: missing CSRF headers on save search | Done |
| 89 | vercel.json: add saved-searches cron schedule | Done |

---

## Sprint 39 — Investor ROI Calculator (DONE)

**Commit**: `47db91b` — feat: investor ROI calculator with bilingual support

| # | Item | Status |
|---|------|--------|
| 90 | ROI Calculator page at `/investors/roi-calculator` | Done |
| 91 | Property selector dropdown (50 available properties) | Done |
| 92 | 9 input fields (price, rent, down payment, mortgage, appreciation, maintenance, vacancy, tax) | Done |
| 93 | Results: monthly mortgage, cash flow, cap rate, cash-on-cash | Done |
| 94 | 20-year year-by-year projection table | Done |
| 95 | Full i18n: 40+ keys in Arabic and English | Done |
| 96 | Sidebar navigation link (both role types) | Done |

---

## Sprint 40 — Office-to-Office Referral System (DONE)

**Commit**: `9196354` — feat: office-to-office referral system

| # | Item | Status |
|---|------|--------|
| 97 | Migration 039: referral_code, referrals table, referring_office_id on offers | Done |
| 98 | API: GET/POST /api/referrals (list + create) | Done |
| 99 | API: GET/POST /api/referrals/code (get + regenerate) | Done |
| 100 | API: PATCH /api/referrals/[id] (status update) | Done |
| 101 | Dashboard page at /dashboard/referrals | Done |
| 102 | Referral code card with copy/regenerate | Done |
| 103 | Create referral modal (office selector, client info, notes) | Done |
| 104 | Stats cards (total, pending, deals closed, this month) | Done |
| 105 | Filter tabs (all, sent, received) | Done |
| 106 | Wire referral_code into offer creation | Done |
| 107 | Wire referring_office_id into commission creation (60/40 split) | Done |
| 108 | Sidebar link (both role types) | Done |
| 109 | Full i18n: 40+ keys in Arabic and English | Done |

---

## Sprint 41 — Advanced Analytics Dashboard (DONE)

**Commit**: `aa7d5b1` — feat: advanced analytics dashboard with agent performance + conversion funnel

| # | Item | Status |
|---|------|--------|
| 110 | API: GET /api/analytics/office (agent performance, funnel, trends) | Done |
| 111 | Dashboard page at /dashboard/analytics | Done |
| 112 | Agent performance table (listings, sold, contacts, offers, commission, avg days to sell) | Done |
| 113 | Conversion funnel (properties → contacts → offers → deals with rates) | Done |
| 114 | Commission summary (total, paid, pending) | Done |
| 115 | Referral stats (sent, received, closed) | Done |
| 116 | Monthly trends (6 months) | Done |
| 117 | Sidebar link for office_admin | Done |
| 118 | Full i18n: 25+ keys in Arabic and English | Done |

---

## Sprint 42 — Agent Invitation Flow (DONE)

**Commit**: `71ed744` — feat: agent invitation flow with email + acceptance UI

| # | Item | Status |
|---|------|--------|
| 119 | Invitation email template (bilingual AR/EN) | Done |
| 120 | Wire email sending into POST /api/invitations | Done |
| 121 | Acceptance page at /invitations/accept | Done |
| 122 | Token verification with email pre-fill | Done |
| 123 | Full name + password form with show/hide | Done |
| 124 | Success/error states with redirect to login | Done |
| 125 | Full i18n: 20+ keys in Arabic and English | Done |

---

## Sprint 43 — Bulk Operations (DONE)

**Commit**: `2828dd2` — feat: bulk operations for contact requests

| # | Item | Status |
|---|------|--------|
| 126 | Selection UI (checkboxes + select all) | Done |
| 127 | Bulk status change (pending/read/resolved) | Done |
| 128 | Bulk delete with confirmation modal | Done |
| 129 | Single-item status update | Done |
| 130 | Single-item delete | Done |
| 131 | Pagination (10 per page) | Done |
| 132 | Status filter tabs | Done |
| 133 | i18n: 10+ new keys in Arabic and English | Done |

---

## FINAL STATUS — ALL ITEMS COMPLETE

### Platform Stats (as of Sprint 42)
- **39 database migrations** (001-039)
- **55+ page routes** (all SSR with locale-aware metadata)
- **709 unit tests** passing
- **28 API endpoints** (23 documented + cron + referrals + analytics)
- **39+ components** (UI, layout, properties, admin, dashboard, landing, auth, investors)
- **19 custom hooks**
- **9 email templates** (bilingual AR/EN)
- **2 cron jobs** (daily cleanup 3 AM + saved search alerts 8 AM)
- **Bilingual i18n** (AR/EN) with framework for adding more languages

### Migrations — ALL RUN ✓
All migrations 032-037 have been applied in Supabase Dashboard SQL Editor.

### Environment Variables — Configured ✓
- `RESEND_API_KEY` — Configured in Vercel ✓
- `CRON_SECRET` — For rate limit cleanup cron (optional)
- `SUPABASE_ACCESS_TOKEN` — For auto-gen types in CI

### Phase 3 — In Progress
Sprint 38: New listing email notification (template + API + PropertyForm integration)

### Deployed At
- **URL**: https://sadat-mls.vercel.app
- **Vercel project**: jmls-projects/sadat-mls
- **Supabase project**: gastnicaxbqppmmjgryp
