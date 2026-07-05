# Comprehensive Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical bugs, security gaps, missing CRUD operations, UX issues, and accessibility problems identified in the comprehensive audit across UI, UX, CX, frontend, backend, database, middleware, admin, dashboard, and all features.

**Architecture:** Six-phase approach — critical fixes first, then security, CRUD gaps, UX, accessibility, and advanced features. Each phase produces working, testable software.

**Tech Stack:** Next.js 14 (App Router), Supabase, Tailwind CSS 4, TypeScript, Zod, lucide-react, Vitest, Playwright

## Global Constraints

- Node 22, npm, Windows PowerShell
- Default locale: Arabic (RTL)
- Auth: Email/password via Supabase (no OAuth)
- Roles: `super_admin`, `office_admin`, `office_agent`
- All text via i18n keys (`dict.*`), never hardcoded
- CSP nonces, CSRF double-submit cookie, rate limiting
- Logger wraps console (never `console.error` directly)
- Tests: Vitest + @testing-library/react; E2E: Playwright

---

## Phase 1: Critical Bug Fixes

### Task 1: Fix Contact Request Field Name Mismatch

**Files:**
- Modify: `src/app/[locale]/dashboard/contact-requests/page.tsx`
- Modify: `src/app/[locale]/admin/contact-requests/page.tsx`

**Problem:** Queries select `name, email, phone, message, type` but TypeScript interfaces expect `visitor_name, visitor_phone, visitor_email, contact_type`.

- [ ] **Step 1: Fix dashboard contact requests query**

In `src/app/[locale]/dashboard/contact-requests/page.tsx`, update the Supabase query to use correct column names:

```typescript
const { data, error } = await supabase
  .from("contact_requests")
  .select("id, visitor_name, visitor_phone, visitor_email, message, contact_type, created_at, property_id")
  .eq("office_id", profile.officeId)
  .order("created_at", { ascending: false });
```

- [ ] **Step 2: Fix admin contact requests query**

In `src/app/[locale]/admin/contact-requests/page.tsx`, update the Supabase query similarly:

```typescript
const { data, error } = await supabase
  .from("contact_requests")
  .select("id, visitor_name, visitor_phone, visitor_email, message, contact_type, created_at, office_id, property_id")
  .order("created_at", { ascending: false });
```

- [ ] **Step 3: Update ContactRequest interface in both files**

Ensure the interface matches the DB columns:

```typescript
interface ContactRequest {
  id: string;
  visitor_name: string;
  visitor_phone: string | null;
  visitor_email: string | null;
  message: string;
  contact_type: "whatsapp" | "phone" | "email";
  created_at: string;
  office_id?: string;
  property_id?: string;
}
```

- [ ] **Step 4: Update all field references**

Replace `req.name` → `req.visitor_name`, `req.phone` → `req.visitor_phone`, `req.email` → `req.visitor_email`, `req.type` → `req.contact_type` throughout both files.

- [ ] **Step 5: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/dashboard/contact-requests/page.tsx src/app/[locale]/admin/contact-requests/page.tsx
git commit -m "fix: correct contact request field names to match DB schema"
```

---

### Task 2: Fix Profile Property Name Mismatch

**Files:**
- Modify: `src/app/[locale]/dashboard/properties/page.tsx`

**Problem:** Uses `profile.officeId` (camelCase) but Supabase returns `office_id` (snake_case). The `useAuthUser` hook returns camelCase, but server-side queries need snake_case.

- [ ] **Step 1: Verify useAuthUser hook shape**

Read `src/hooks/useAuthUser.tsx` to confirm the User type has `officeId` (camelCase).

- [ ] **Step 2: Fix dashboard properties page**

In `src/app/[locale]/dashboard/properties/page.tsx`, ensure the profile object is used correctly. The `useAuthUser` hook returns `officeId` (camelCase), so the existing code should work. But verify the Supabase query uses the correct column name:

```typescript
const { data, error } = await supabase
  .from("properties")
  .select("*")
  .eq("office_id", profile.officeId) // camelCase from hook, snake_case in DB
  .order("created_at", { ascending: false });
```

- [ ] **Step 3: Fix dashboard settings page**

In `src/app/[locale]/dashboard/settings/page.tsx`, verify profile property access is consistent.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/properties/page.tsx src/app/[locale]/dashboard/settings/page.tsx
git commit -m "fix: ensure consistent profile property naming across dashboard pages"
```

---

### Task 3: Fix Toast Dismiss Button Language Bug

**Files:**
- Modify: `src/components/ui/Toast.tsx`

**Problem:** Toast dismiss button always shows English text because it imports `en.json` directly.

- [ ] **Step 1: Read current Toast.tsx**

Read `src/components/ui/Toast.tsx` to understand the current implementation.

- [ ] **Step 2: Fix Toast to accept dict prop**

Modify Toast to accept a `dict` prop or use a context-based approach:

```typescript
// In the Toast component, replace the hardcoded English import with:
// Option A: Accept dict as prop from context
// Option B: Use a simple locale detection from the current path

// Simple fix: detect locale from path
const getLocaleFromPath = () => {
  if (typeof window === "undefined") return "ar";
  return window.location.pathname.startsWith("/en") ? "en" : "ar";
};

// Then in the dismiss button:
const locale = getLocaleFromPath();
const dismissText = locale === "en" ? "Dismiss" : "إغلاق";
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Toast.tsx
git commit -m "fix: toast dismiss button respects current locale"
```

---

### Task 4: Fix RTL/LTR Positioning Bugs

**Files:**
- Modify: `src/components/ui/PaginatedTable.tsx`
- Modify: `src/components/properties/SearchFilters.tsx`
- Modify: `src/components/properties/PropertyCard.tsx`
- Modify: `src/components/layout/NotificationsBell.tsx`

**Problem:** Several components use hardcoded `right-*`/`left-*` positioning that doesn't respect RTL/LTR direction.

- [ ] **Step 1: Fix PaginatedTable search icon**

In `src/components/ui/PaginatedTable.tsx`, change the search icon positioning:

```tsx
// Replace: absolute right-3
// With: RTL-aware positioning
className={`absolute ${dir === "rtl" ? "left-3" : "right-3"} ...`}
```

- [ ] **Step 2: Fix SearchFilters search icon**

In `src/components/properties/SearchFilters.tsx`, apply the same fix:

```tsx
// Use the dir prop or detect locale
className={`absolute ${dir === "rtl" ? "left-3" : "right-3"} ...`}
```

- [ ] **Step 3: Fix PropertyCard actions positioning**

In `src/components/properties/PropertyCard.tsx`, change:

```tsx
// Replace: absolute top-2 right-2
// With: RTL-aware
className={`absolute top-2 ${dir === "rtl" ? "left-2" : "right-2"}`}
```

- [ ] **Step 4: Fix NotificationsBell dropdown positioning**

In `src/components/layout/NotificationsBell.tsx`, change:

```tsx
// Replace: absolute right-0
// With: RTL-aware
className={`absolute ${dir === "rtl" ? "left-0" : "right-0"} ...`}
```

- [ ] **Step 5: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/PaginatedTable.tsx src/components/properties/SearchFilters.tsx src/components/properties/PropertyCard.tsx src/components/layout/NotificationsBell.tsx
git commit -m "fix: RTL/LTR-aware positioning for search icons, card actions, and dropdowns"
```

---

### Task 5: Fix Orphaned Office on Agent Creation Failure

**Files:**
- Modify: `src/app/[locale]/admin/offices/page.tsx`

**Problem:** Office is created first, then agent creation is attempted. If agent creation fails, the office exists without an admin user.

- [ ] **Step 1: Read current office creation flow**

Read `src/app/[locale]/admin/offices/page.tsx` to understand the current create flow.

- [ ] **Step 2: Add rollback on agent creation failure**

After agent creation fails, delete the orphaned office:

```typescript
// After agent creation fails:
if (agentError) {
  // Rollback: delete the orphaned office
  await supabase.from("offices").delete().eq("id", office.id);
  toast.error(dict.admin.offices.agentCreationFailed);
  setLoading(false);
  return;
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/admin/offices/page.tsx
git commit -m "fix: rollback office creation if agent creation fails"
```

---

### Task 6: Remove Redundant Health Endpoint

**Files:**
- Delete: `src/app/api/health.ts` (if exists)
- Keep: `src/app/api/health/route.ts`

**Problem:** Two health endpoints exist. `api/health.ts` leaks uptime/environment info.

- [ ] **Step 1: Check if api/health.ts exists**

Run: `Get-ChildItem -Path "src/app/api" -Recurse -Filter "health*"`

- [ ] **Step 2: Delete the insecure endpoint**

If `src/app/api/health.ts` exists, delete it. Keep only `src/app/api/health/route.ts`.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git rm src/app/api/health.ts 2>$null; git add -A
git commit -m "fix: remove redundant health endpoint that leaks environment info"
```

---

## Phase 2: Security Hardening

### Task 7: Add CSRF to Activity API

**Files:**
- Modify: `src/app/api/activity/route.ts`

**Problem:** POST endpoint lacks CSRF validation.

- [ ] **Step 1: Add CSRF validation**

In `src/app/api/activity/route.ts`, add CSRF validation to the POST handler:

```typescript
import { validateCsrfToken } from "@/lib/security/csrf";

// In the POST handler, before processing:
const csrfValid = await validateCsrfToken(request);
if (!csrfValid) {
  return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
}
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/api/activity/route.ts
git commit -m "fix: add CSRF validation to activity API POST endpoint"
```

---

### Task 8: Add CSRF to Notifications API

**Files:**
- Modify: `src/app/api/notifications/route.ts`

**Problem:** POST and PATCH endpoints lack CSRF validation.

- [ ] **Step 1: Add CSRF validation**

In `src/app/api/notifications/route.ts`, add CSRF validation to POST and PATCH handlers.

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/api/notifications/route.ts
git commit -m "fix: add CSRF validation to notifications API endpoints"
```

---

### Task 9: Add Password Complexity Validation to Agent Creation

**Files:**
- Modify: `src/app/[locale]/dashboard/agents/page.tsx`
- Modify: `src/app/[locale]/admin/users/page.tsx`

**Problem:** Client-side only checks `minLength=8`, no complexity check.

- [ ] **Step 1: Import PasswordService**

```typescript
import { PasswordService } from "@/lib/security/password";
```

- [ ] **Step 2: Add validation before API call**

```typescript
const passwordError = PasswordService.validate(password);
if (passwordError) {
  toast.error(passwordError);
  return;
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/agents/page.tsx src/app/[locale]/admin/users/page.tsx
git commit -m "fix: add password complexity validation to agent and user creation forms"
```

---

## Phase 3: Missing CRUD Operations

### Task 10: Add Office Edit Functionality

**Files:**
- Modify: `src/app/[locale]/admin/offices/page.tsx`
- Create: `src/app/api/admin/offices/route.ts` (PATCH handler)

**Problem:** Cannot edit office details after creation.

- [ ] **Step 1: Create API endpoint for office update**

Create `src/app/api/admin/offices/route.ts` with PATCH handler:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateCsrfToken } from "@/lib/security/csrf";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

const updateOfficeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const rateLimitResult = await checkRateLimit("admin-offices-patch", request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = updateOfficeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { id, ...updates } = parsed.data;
  const { error } = await supabase.from("offices").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Add edit button to offices page**

In `src/app/[locale]/admin/offices/page.tsx`, add an edit button to each row that opens a modal with pre-filled form.

- [ ] **Step 3: Add edit modal**

Create an edit modal component within the offices page that allows editing name, email, phone, and address.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/offices/route.ts src/app/[locale]/admin/offices/page.tsx
git commit -m "feat: add office edit functionality with API endpoint and edit modal"
```

---

### Task 11: Add Contact Request Status Updates

**Files:**
- Modify: `src/app/[locale]/dashboard/contact-requests/page.tsx`
- Modify: `src/app/[locale]/admin/contact-requests/page.tsx`
- Modify: `src/app/api/notifications/route.ts` (add status field)

**Problem:** Cannot mark contact requests as read/resolved.

- [ ] **Step 1: Add status column to contact_requests table**

Create a migration or add via Supabase dashboard:
```sql
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
```

- [ ] **Step 2: Add status update to dashboard contact requests**

Add a status dropdown or button to mark as read/resolved.

- [ ] **Step 3: Add status update to admin contact requests**

Same as dashboard but for admin view.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/contact-requests/page.tsx src/app/[locale]/admin/contact-requests/page.tsx
git commit -m "feat: add contact request status updates (pending/read/resolved)"
```

---

### Task 12: Add Agent Edit and Status Toggle

**Files:**
- Modify: `src/app/[locale]/dashboard/agents/page.tsx`
- Modify: `src/app/api/agents/route.ts` (add PATCH handler)

**Problem:** Cannot edit agent details or toggle active/inactive status.

- [ ] **Step 1: Add PATCH handler to agents API**

In `src/app/api/agents/route.ts`, add PATCH handler for updating agent details and status.

- [ ] **Step 2: Add edit button to agents page**

Add edit button and status toggle to each agent row.

- [ ] **Step 3: Add edit modal**

Create edit modal for agent name, email, and active/inactive toggle.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/agents/route.ts src/app/[locale]/dashboard/agents/page.tsx
git commit -m "feat: add agent edit and status toggle functionality"
```

---

### Task 13: Add User Edit and Status Toggle

**Files:**
- Modify: `src/app/[locale]/admin/users/page.tsx`
- Modify: `src/app/api/admin/users/route.ts` (verify PATCH handler exists)

**Problem:** Cannot edit user details or toggle active/inactive status.

- [ ] **Step 1: Verify PATCH handler exists**

Read `src/app/api/admin/users/route.ts` to check if PATCH handler exists.

- [ ] **Step 2: Add edit button to users page**

Add edit button and status toggle to each user row.

- [ ] **Step 3: Add edit modal**

Create edit modal for user name, email, role, and active/inactive toggle.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/admin/users/page.tsx src/app/api/admin/users/route.ts
git commit -m "feat: add user edit and status toggle functionality"
```

---

## Phase 4: UX Improvements

### Task 14: Add Optimistic UI to Favorite/Compare Buttons

**Files:**
- Modify: `src/components/properties/FavoriteButton.tsx`
- Modify: `src/components/properties/CompareButton.tsx`

**Problem:** Buttons wait for server response before toggling, which feels slow.

- [ ] **Step 1: Add optimistic state to FavoriteButton**

```typescript
const [optimisticState, setOptimisticState] = useState(isFavorited);

const handleToggle = async () => {
  const prevState = optimisticState;
  setOptimisticState(!optimisticState); // Optimistic update
  
  try {
    // ... API call
  } catch {
    setOptimisticState(prevState); // Rollback on error
  }
};
```

- [ ] **Step 2: Apply same pattern to CompareButton**

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/properties/FavoriteButton.tsx src/components/properties/CompareButton.tsx
git commit -m "feat: add optimistic UI updates to favorite and compare buttons"
```

---

### Task 15: Add Loading Skeleton to Property Cards

**Files:**
- Modify: `src/components/properties/PropertyCard.tsx`
- Create: `src/components/properties/PropertyCardSkeleton.tsx`

**Problem:** No loading skeleton when property data is pending.

- [ ] **Step 1: Create PropertyCardSkeleton**

```tsx
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Use skeleton in property listing pages**

Replace `LoadingSpinner` with grid of `PropertyCardSkeleton` components.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/properties/PropertyCardSkeleton.tsx src/app/[locale]/dashboard/properties/page.tsx
git commit -m "feat: add loading skeleton to property cards"
```

---

### Task 16: Add Pause-on-Hover to Toasts

**Files:**
- Modify: `src/components/ui/Toast.tsx`

**Problem:** Toast timer continues even if user is reading.

- [ ] **Step 1: Add pause-on-hover**

```typescript
const [isPaused, setIsPaused] = useState(false);

useEffect(() => {
  if (isPaused) return;
  
  const timer = setTimeout(() => {
    removeToast(toast.id);
  }, 4000);

  return () => clearTimeout(timer);
}, [isPaused, toast.id]);

// On the toast element:
onMouseEnter={() => setIsPaused(true)}
onMouseLeave={() => setIsPaused(false)}
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Toast.tsx
git commit -m "feat: add pause-on-hover to toast notifications"
```

---

### Task 17: Add Keyboard Dismiss to Toasts

**Files:**
- Modify: `src/components/ui/Toast.tsx`

**Problem:** No keyboard dismissal for toasts.

- [ ] **Step 1: Add Escape key handler**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      removeToast(toast.id);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [toast.id]);
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Toast.tsx
git commit -m "feat: add keyboard dismiss (Escape) to toast notifications"
```

---

### Task 18: Add Web Share API to ShareButton

**Files:**
- Modify: `src/components/properties/ShareButton.tsx`

**Problem:** No native Web Share API support.

- [ ] **Step 1: Add Web Share API check**

```typescript
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        url: shareUrl,
      });
    } catch {
      // User cancelled or error
    }
  } else {
    // Fallback to clipboard + WhatsApp
    setShowModal(true);
  }
};
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/ShareButton.tsx
git commit -m "feat: add Web Share API support to ShareButton"
```

---

### Task 19: Add Avatar Fallback (Initials)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Problem:** Avatar not shown when `profile.avatarUrl` is null.

- [ ] **Step 1: Add initials fallback**

```tsx
{profile?.avatarUrl ? (
  <img src={profile.avatarUrl} alt={profile.fullName} className="..." />
) : (
  <div className="... bg-blue-600 text-white flex items-center justify-center">
    {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
  </div>
)}
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add initials fallback when avatar image is missing"
```

---

### Task 20: Standardize Loading Components

**Files:**
- Modify: Multiple dashboard/admin pages

**Problem:** Inconsistent loading components (LoadingSpinner, LuxuryLoader, custom skeletons).

- [ ] **Step 1: Create standard loading component**

Create `src/components/ui/PageLoader.tsx` that combines the best of existing loaders.

- [ ] **Step 2: Replace inconsistent loaders**

Replace `LoadingSpinner` and `LuxuryLoader` usage with `PageLoader` across all pages.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PageLoader.tsx
git commit -m "feat: standardize loading components across all pages"
```

---

## Phase 5: Accessibility

### Task 21: Add Skip-to-Content Link

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/DashboardLayout.tsx`

**Problem:** No skip-to-content link for keyboard users.

- [ ] **Step 1: Add skip link to Navbar**

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
>
  {dict.common.skipToContent}
</a>
```

- [ ] **Step 2: Add id to main content area**

Ensure `<main id="main-content">` exists in the layout.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/DashboardLayout.tsx
git commit -m "feat: add skip-to-content link for keyboard navigation"
```

---

### Task 22: Add ARIA to LuxuryLoader

**Files:**
- Modify: `src/components/ui/LuxuryLoader.tsx`

**Problem:** No `role="status"` or `aria-label`.

- [ ] **Step 1: Add ARIA attributes**

```tsx
<div role="status" aria-label={text || "Loading"} className="...">
  <span className="sr-only">{text || "Loading..."}</span>
  {/* ... existing content */}
</div>
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/LuxuryLoader.tsx
git commit -m "fix: add ARIA attributes to LuxuryLoader for screen readers"
```

---

### Task 23: Add ARIA to EmptyState

**Files:**
- Modify: `src/components/ui/EmptyState.tsx`

**Problem:** No ARIA attributes.

- [ ] **Step 1: Add ARIA attributes**

```tsx
<div role="status" aria-label={title} className="...">
  {/* ... existing content */}
</div>
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/EmptyState.tsx
git commit -m "fix: add ARIA attributes to EmptyState component"
```

---

### Task 24: Add aria-live to Status Changes

**Files:**
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Toast.tsx`

**Problem:** Status changes not announced to screen readers.

- [ ] **Step 1: Add aria-live to Badge**

```tsx
<span role="status" aria-live="polite" className="...">
  {children}
</span>
```

- [ ] **Step 2: Add aria-live="assertive" to error toasts**

```tsx
<div role="alert" aria-live="assertive" className="...">
  {toast.message}
</div>
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Toast.tsx
git commit -m "fix: add aria-live to Badge and error Toasts for screen reader announcements"
```

---

## Phase 6: Advanced Features

### Task 25: Add Search to Dashboard Properties

**Files:**
- Modify: `src/app/[locale]/dashboard/properties/page.tsx`

**Problem:** No search functionality in property listing.

- [ ] **Step 1: Add search input**

Add a search input field above the property grid that filters by title.

- [ ] **Step 2: Implement client-side filtering**

```typescript
const [searchQuery, setSearchQuery] = useState("");
const filteredProperties = properties.filter(p => 
  p.title.toLowerCase().includes(searchQuery.toLowerCase())
);
```

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/properties/page.tsx
git commit -m "feat: add search functionality to dashboard properties page"
```

---

### Task 26: Add Pagination to Favorites

**Files:**
- Modify: `src/app/[locale]/dashboard/favorites/page.tsx`

**Problem:** All favorites loaded at once with no pagination.

- [ ] **Step 1: Add pagination state**

```typescript
const [page, setPage] = useState(1);
const pageSize = 9;
const paginatedFavorites = favorites.slice((page - 1) * pageSize, page * pageSize);
```

- [ ] **Step 2: Add pagination controls**

Add page navigation buttons at the bottom of the grid.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/favorites/page.tsx
git commit -m "feat: add pagination to favorites page"
```

---

### Task 27: Add Confirmation Dialog Before Image Deletion

**Files:**
- Modify: `src/components/properties/PropertyImageManager.tsx`

**Problem:** No confirmation before removing images.

- [ ] **Step 1: Add confirmation state**

```typescript
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

const handleRemove = (index: number) => {
  if (deleteConfirm === images[index].url) {
    // Actually delete
    onRemove(index);
    setDeleteConfirm(null);
  } else {
    // First click: show confirmation
    setDeleteConfirm(images[index].url);
  }
};
```

- [ ] **Step 2: Show confirmation UI**

Change the delete button text to "Confirm?" on first click.

- [ ] **Step 3: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/properties/PropertyImageManager.tsx
git commit -m "feat: add confirmation dialog before image deletion"
```

---

### Task 28: Add Activity Feed Links to Entities

**Files:**
- Modify: `src/components/dashboard/ActivityFeed.tsx`

**Problem:** Activity items don't link to related entities.

- [ ] **Step 1: Add entity links**

```tsx
<Link href={`/${locale}/explore/${activity.entity_id}`}>
  {activity.description}
</Link>
```

- [ ] **Step 2: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ActivityFeed.tsx
git commit -m "feat: add entity links to activity feed items"
```

---

### Task 29: Add Sort Options to Property Listing

**Files:**
- Modify: `src/app/[locale]/dashboard/properties/page.tsx`
- Modify: `src/app/[locale]/explore/page.tsx`

**Problem:** No sorting options for properties.

- [ ] **Step 1: Add sort state**

```typescript
const [sortBy, setSortBy] = useState<"created_at" | "price" | "area">("created_at");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
```

- [ ] **Step 2: Add sort controls**

Add a sort dropdown above the property grid.

- [ ] **Step 3: Implement sorting**

```typescript
const sortedProperties = [...filteredProperties].sort((a, b) => {
  const aVal = a[sortBy];
  const bVal = b[sortBy];
  return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/properties/page.tsx src/app/[locale]/explore/page.tsx
git commit -m "feat: add sort options to property listing pages"
```

---

### Task 30: Add Bulk Operations to Admin Pages

**Files:**
- Modify: `src/app/[locale]/admin/zones/page.tsx`
- Modify: `src/app/[locale]/admin/property-types/page.tsx`
- Modify: `src/app/[locale]/admin/contact-requests/page.tsx`

**Problem:** No bulk delete or bulk status changes.

- [ ] **Step 1: Add checkbox selection**

Add a checkbox column to PaginatedTable for multi-select.

- [ ] **Step 2: Add bulk action bar**

Show a floating action bar when items are selected with "Delete Selected" button.

- [ ] **Step 3: Implement bulk delete**

```typescript
const handleBulkDelete = async (ids: string[]) => {
  const { error } = await supabase.from("zones").delete().in("id", ids);
  if (error) {
    toast.error(dict.common.error);
  } else {
    toast.success(dict.common.success);
    setSelectedIds([]);
    loadData();
  }
};
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/admin/zones/page.tsx src/app/[locale]/admin/property-types/page.tsx src/app/[locale]/admin/contact-requests/page.tsx
git commit -m "feat: add bulk delete operations to admin pages"
```

---

## Verification Checklist

After completing all tasks, run the full verification pipeline:

```bash
# TypeScript check
npx tsc --noEmit

# ESLint
npm run lint

# Unit tests
npm run test:run

# Production build
npm run build
```

All checks must pass before merging.
