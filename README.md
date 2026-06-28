# Sadat MLS Cloud - منصة العقارات السحابية لمدينة السادات

<p align="center">
  <img src="public/icons/icon-192.png" alt="Sadat MLS Cloud Logo" width="96" height="96">
</p>

<p align="center">
  <strong>Cloud Real Estate Platform for Sadat City</strong><br>
  منصة إدارة العقارات السحابية لمدينة السادات
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#api">API</a> •
  <a href="#security">Security</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🚀 Features

- **🏠 Property Management** - Add, edit, and manage property listings with images, pricing, and details
- **🏢 Multi-Office Support** - Multiple real estate offices with isolated data and shared marketplace
- **🔐 Role-Based Access Control** - Super Admin, Office Admin, and Office Agent roles
- **🌍 Bilingual** - Full Arabic (RTL) and English (LTR) support
- **📱 Progressive Web App (PWA)** - Installable app with offline support and service worker
- **🔒 Security First** - CSP (middleware-managed), CSRF double-submit, rate limiting (IP + memory + DB), XSS sanitization, HSTS, auth guard
- **⚡ Performance** - Image optimization, lazy loading, infinite scroll, parallel DB queries, ISR
- **📊 SEO Optimized** - Dynamic sitemap, OG images, robots.txt, structured data (JSON-LD), hreflang
- **♿ Accessibility** - WCAG 2.1 AA compliant with keyboard navigation, focus management, ARIA labels, Escape key handlers
- **🛡️ Error Monitoring** - Sentry integration with error boundaries, global error handling, locale-aware error pages
- **📋 Admin Panel** - Manage zones, property types, offices, contact requests, and analytics
- **📊 Dashboard** - Office and agent dashboards with property management, favorites, and contact requests

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT + Cookies) |
| **Storage** | Supabase Storage |
| **Testing** | Vitest + Playwright |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Sentry |
| **Deployment** | Vercel |

## 📁 Project Structure

```
sadat-mls-cloud/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # i18n routes (ar, en)
│   │   │   ├── admin/          # Super Admin Dashboard
│   │   │   ├── dashboard/      # Office Dashboard
│   │   │   ├── explore/        # Property Listings (Public)
│   │   │   ├── login/          # Authentication
│   │   │   └── ...
│   │   ├── api/                # API Routes
│   │   ├── og-image/           # Dynamic OG Image Generator
│   │   ├── layout.tsx          # Root Layout
│   │   ├── page.tsx            # Landing Page
│   │   ├── sitemap.ts          # Dynamic Sitemap
│   │   └── robots.ts           # Robots.txt
│   ├── components/             # React Components
│   │   ├── ui/                 # UI Components (Button, Input, Modal, etc.)
│   │   ├── properties/         # Property Components
│   │   ├── layout/             # Layout Components
│   │   └── landing/            # Landing Page Components
│   ├── hooks/                  # Custom React Hooks
│   ├── i18n/                   # Internationalization (ar, en)
│   ├── lib/                    # Utilities & Services
│   │   ├── supabase/           # Supabase Clients (Browser + Server)
│   │   ├── security/           # Security Utilities (CSRF, Rate Limit, Sanitize)
│   │   ├── queries/            # Database Queries
│   │   ├── services/           # Business Logic Services
│   │   └── utils/              # Helper Functions
│   └── __tests__/              # Unit Tests
├── supabase/
│   └── migrations/             # Database Migrations
├── e2e/                        # Playwright E2E Tests
├── public/                     # Static Assets & PWA
├── .github/workflows/           # CI/CD Pipelines
└── scripts/                    # Utility Scripts
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Supabase CLI (optional, for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sadat-mls-cloud.git
cd sadat-mls-cloud

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

### Database Setup

```bash
# Run migrations in Supabase SQL Editor (in order)
# 1. 001_initial_schema.sql
# 2. 002_rls_policies.sql
# 3. 003_office_logos_bucket.sql
# 4. 004_rate_limit_log.sql
# 5. 005_performance_indexes.sql

# Seed initial data
# Run supabase/seed.sql steps in Supabase SQL Editor
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Run unit tests (9 files, 70 tests)
npm run test:run

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

**Test Files:**
- `sanitizeHtml.test.ts` — 15 tests (HTML sanitizer)
- `rateLimit.test.ts` — 4 tests (IP-based rate limiting)
- `sanitize.test.ts` — 16 tests (entity escaping)
- `formatPrice.test.ts` — 6 tests (currency formatting)
- `i18n.test.ts` — 5 tests (internationalization)
- `cn.test.ts` — 3 tests (className utility)
- `auth-utils.test.tsx` — 3 tests (auth utilities)
- `property-form.test.tsx` — 10 tests (property form)
- `landing.test.tsx` — 8 tests (landing page)

### Build & Analyze

```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy!

**Current Production URL:** https://sadat-5781ts4my-jmls-projects.vercel.app  
**Alias:** https://sadat-mls.vercel.app

### Docker

```bash
# Build Docker image
docker build -t sadat-mls-cloud .

# Run container
docker run -p 3000:3000 --env-file .env.local sadat-mls-cloud
```

### Environment Variables (Required)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Site URL for SEO | ✅ |
| `NEXT_PUBLIC_APP_URL` | App URL for metadata | ✅ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) | ❌ |
| `SENTRY_ORG` | Sentry organization (optional) | ❌ |
| `SENTRY_PROJECT` | Sentry project (optional) | ❌ |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps (optional) | ❌ |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID (optional) | ❌ |

## 🔌 API Routes

### Health Check
- `GET /api/health` - Returns application health status

### Agents Management
- `POST /api/agents` - Create new agent (Admin only)
- `DELETE /api/agents?id={id}` - Delete agent (Admin only)

### Authentication Callback
- `GET /[locale]/auth/callback` - OAuth/Magic Link callback handler

### OG Image
- `GET /og-image?title=...&description=...&locale=...` - Dynamic Open Graph image generation

## 🔒 Security Features

- **Content Security Policy (CSP)** — nonce-based scripts, managed solely by `middleware.ts`
- **CSRF Protection** — double-submit cookie pattern with constant-time comparison
- **Rate Limiting** — IP-based with memory + DB fallback (API: 20/min, Auth: 5/15min)
- **XSS Prevention** — multi-pass HTML sanitizer (`sanitizeHtml.ts`) + input validation
- **HSTS** — 2-year max-age with preload
- **X-Frame-Options: DENY** — Clickjacking protection
- **Row Level Security (RLS)** — on all database tables with 35+ policies
- **Role-Based Access Control (RBAC)** — 3 roles: super_admin, office_admin, office_agent
- **Secure Headers** — via middleware (X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- **Auth Guard** — component-level auth with role-based redirects for admin/dashboard
- **Session Security** — sessionStorage stores only userId + timestamp (never role/profile)
- **Auth Callback Validation** — origin validation against allowed hosts whitelist
- **Agent API Security** — UPSERT for DB trigger coexistence, try/catch for malformed JSON

## 📝 Database Schema

### Tables

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

### Roles

- `super_admin` - Full system access (admin panel, all offices)
- `office_admin` - Office management + property management + agent management
- `office_agent` - Property management only

### RLS Policies

- Public read for active offices/properties
- Office-based isolation (each office sees only its data)
- Super admin override on all data
- office_agent: INSERT + UPDATE on properties
- contact_requests: UPDATE policy for status changes

## 🧪 Testing

```bash
# All unit tests
npm run test:run

# Unit tests with coverage
npm run test:coverage

# E2E tests (Chromium, Firefox, Mobile Chrome)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

**Current Test Status:** 70 tests passing across 9 test files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm run test:run`) — 70 tests across 9 files
- Linting passes (`npm run lint`)
- TypeScript compiles (`npx tsc --noEmit`)
- E2E tests pass (`npm run test:e2e`)

## 📝 Recent Changes (Changelog)

### Security Fixes
- Real HTML sanitizer replacing no-op in `sanitizeHtml.ts`
- Rate limit IP extraction fixed for IPv6 safety
- CSP header conflict removed from `next.config.js` (middleware sole owner)
- Auth callback origin validation with allowed hosts whitelist
- SessionStorage privilege escalation fixed (stores only userId + timestamp)
- AuthGuard component with role-based redirects for admin/dashboard

### Performance
- Dashboard queries combined into parallel Promise.all (7 sequential → 1 parallel)
- Agent API uses UPSERT to coexist with DB trigger

### i18n
- All hardcoded Arabic text replaced with i18n keys
- Rate limit messages fully internationalized (ar/en)
- Bilingual error pages for admin and dashboard

### Accessibility
- Navbar: Escape key handler, role="menu", aria-orientation
- Badge: aria-label prop
- PropertyCard: aria-label with title and status
- ShareButton/ContactModal/PropertyImageManager: aria-labels on all buttons

### RLS
- office_agent: INSERT + UPDATE policies on properties
- contact_requests: UPDATE policy for status changes

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, email info@sadatmls.com or join our discussion board.

---

<p align="center">
  Built with ❤️ for Sadat City
</p>
