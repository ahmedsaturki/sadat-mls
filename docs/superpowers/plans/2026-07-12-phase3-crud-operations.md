# Phase 3: Missing CRUD Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing CRUD operations for offices, contact requests, agents, and users with proper API endpoints, UI modals, and i18n support.

**Architecture:** Follow existing patterns from `src/app/api/admin/users/route.ts` (CSRF + Zod + service-role + rate limiting). UI uses existing Modal, Button, Input components. All strings use i18n keys.

**Tech Stack:** Next.js App Router, Supabase, Zod, CSRF double-submit cookie, rate limiting, i18n (next-intl)

## Global Constraints

- `import "server-only"` for any new server-only modules
- CSRF double-submit cookie via `validateCsrfToken` from `@/lib/security/csrf`
- Rate limit via `checkApiRateLimit(key, request)` from `@/lib/security/rateLimit`
- Zod schemas for ALL user input
- `logger` for error logging (NEVER console.error)
- i18n keys for all user-visible strings (add to both `src/i18n/ar.json` and `src/i18n/en.json` if missing)
- Use `useCsrfHeaders` / `getCsrfHeaders` client-side
- Use `useToast` from `@/components/ui/Toast`
- Use `usePageLocale` from `@/hooks/usePageLocale`
- `dict.common.delete`, `dict.common.cancel`, `dict.common.save`, `dict.common.edit`, etc. already exist

---

## Task 10: Office Edit (API + UI Modal)

**Files:**
- Create: `src/app/api/admin/offices/route.ts`
- Modify: `src/components/admin/AdminOfficesClient.tsx`

**Interfaces:**
- Consumes: `validateCsrfToken` from `@/lib/security/csrf`, `checkApiRateLimit` from `@/lib/security/rateLimit`, `officeSchema` from `@/lib/validation`, `createServiceRoleClient` from `@/lib/supabase/service-role`
- Produces: PATCH endpoint returning `{ success: true }` or error JSON

### Step 1: Add i18n keys for office edit

Add to `src/i18n/messages/en.json` under `admin` section:
```json
"editOffice": "Edit Office",
"officeUpdated": "Office updated successfully",
"officeNameRequired": "Office name is required",
"officeEmailRequired": "Office email is required"
```

Add to `src/i18n/messages/ar.json` under `admin` section:
```json
"editOffice": "تعديل المكتب",
"officeUpdated": "تم تحديث المكتب بنجاح",
"officeNameRequired": "اسم المكتب مطلوب",
"officeEmailRequired": "بريد المكتب الإلكتروني مطلوب"
```

- [ ] **Step 1: Add i18n keys**

```bash
# Verify keys added correctly
grep -n "editOffice\|officeUpdated" src/i18n/messages/en.json src/i18n/messages/ar.json
```

### Step 2: Create API route for office PATCH

Create `src/app/api/admin/offices/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";
import { validateCsrfToken } from "@/lib/security/csrf";
import { officeSchema } from "@/lib/validation";
import { ROLES } from "@/lib/utils/constants";
import { logActivity } from "@/lib/utils/activity-logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const supabase = createServiceRoleClient();

  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser) user = authUser;
    } catch {
      // ignore
    }
  }

  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from("users")
      .select("role, office_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== ROLES.SUPER_ADMIN) return null;
    return { ...user, office_id: profile.office_id, role: profile.role };
  } catch {
    logger.error("Failed to query user profile during admin verification", { userId: user.id });
    return null;
  }
}

// PATCH - Update office (super_admin only)
export async function PATCH(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`admin-offices-patch:${ip}`);
  if (!rate.allowed) {
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patchOfficeSchema = z.object({
    id: z.string().uuid("Invalid office ID"),
    name: z.string().min(2).max(200).optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
  });

  const parsed = patchOfficeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, ...updates } = parsed.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("offices")
    .update(updates)
    .eq("id", id);

  if (error) {
    logger.error("Failed to update office", { error: error.message, officeId: id });
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }

  logger.info("Office updated successfully", { officeId: id, updates, updatedBy: user.id });

  await logActivity({
    userId: user.id,
    action: "office.updated",
    entityType: "office",
    entityId: id,
    metadata: { updates },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create API route**

```bash
# Verify file created
ls -la src/app/api/admin/offices/route.ts
```

### Step 3: Add Edit button and modal to AdminOfficesClient

Modify `src/components/admin/AdminOfficesClient.tsx`:

1. Add `Edit` to lucide-react imports (line 5):
```typescript
import { Building2, Plus, Trash2, Eye, EyeOff, Building, Edit } from "lucide-react";
```

2. Add state for edit modal after line 51:
```typescript
const [editModal, setEditModal] = useState<{ open: boolean; office: Office | null }>({ open: false, office: null });
const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
const [editErrors, setEditErrors] = useState<Record<string, string>>({});
```

3. Add handleEditOffice function after handleDeleteOffice (after line 271):
```typescript
const handleEditOffice = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editModal.office) return;

  const result = officeSchema.safeParse({
    name: editForm.name,
    email: editForm.email,
    phone: editForm.phone,
    address: editForm.address,
  });

  const newErrors: Record<string, string> = {};
  if (!result.success) {
    const validationDict = dict.validation as Record<string, string>;
    result.error.issues.forEach((issue) => {
      newErrors[issue.path.join(".")] = getValidationMessage(issue, validationDict);
    });
  }

  if (Object.keys(newErrors).length > 0) {
    setEditErrors(newErrors);
    return;
  }

  setEditErrors({});
  setSaving(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      showToast(dict.common.unexpectedError, "error");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/admin/offices", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({
        id: editModal.office.id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || dict.common.unexpectedError, "error");
      return;
    }

    showToast(dict.admin.officeUpdated, "success");
    setEditModal({ open: false, office: null });
    loadOffices();
  } catch (err) {
    logger.error("Failed to update office", { error: err instanceof Error ? err.message : String(err) });
    showToast(dict.common.unexpectedError, "error");
  } finally {
    setSaving(false);
  }
};
```

4. Add Edit button to actions column (before the existing toggle button, around line 381):
```typescript
<button
  onClick={() => {
    setEditForm({
      name: office.name,
      email: office.email || "",
      phone: office.phone || "",
      address: office.address || "",
    });
    setEditModal({ open: true, office });
  }}
  className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
  title={dict.admin.editOffice}
  aria-label={dict.admin.editOffice}
>
  <Edit className="w-4 h-4 text-navy-600" />
</button>
```

5. Add Edit Office Modal before the Delete Confirmation Modal (before line 460):
```typescript
{/* Edit Office Modal */}
<Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, office: null })} title={dict.admin.editOffice} size="lg">
  <form onSubmit={handleEditOffice} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Input label={dict.admin.officeName} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
        {editErrors.name && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
      </div>
      <div>
        <Input label={dict.common.email} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
        {editErrors.email && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
      </div>
      <div>
        <Input label={dict.common.phone} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
        {editErrors.phone && <p role="alert" className="text-red-500 text-xs mt-1">{editErrors.phone}</p>}
      </div>
      <div>
        <Input label={dict.common.address} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
      </div>
    </div>
    <div className="flex gap-3 justify-end pt-4">
      <Button type="button" variant="ghost" onClick={() => setEditModal({ open: false, office: null })}>{dict.common.cancel}</Button>
      <Button type="submit" isLoading={saving}>{dict.common.save}</Button>
    </div>
  </form>
</Modal>
```

- [ ] **Step 3: Add Edit button and modal**

```bash
# Verify changes
grep -n "Edit\|editModal\|handleEditOffice" src/components/admin/AdminOfficesClient.tsx | head -20
```

### Step 4: Verify and commit

```bash
npx tsc --noEmit
npm run test:run
git add src/app/api/admin/offices/route.ts src/components/admin/AdminOfficesClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add office edit functionality with API endpoint and edit modal"
```

---

## Task 11: Contact Request Status Updates

**Files:**
- Create: `supabase/migrations/020_add_status_to_contact_requests.sql`
- Modify: `src/components/admin/AdminContactRequestsClient.tsx`

**Interfaces:**
- Consumes: `status` column on `contact_requests` table
- Produces: Status update UI in admin contact requests page

### Step 1: Create migration file

Create `supabase/migrations/020_add_status_to_contact_requests.sql`:

```sql
-- Add status column to contact_requests table
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved'));

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
```

- [ ] **Step 1: Create migration file**

```bash
# Verify migration created
ls -la supabase/migrations/020_add_status_to_contact_requests.sql
```

### Step 2: Add i18n keys for contact request status

Add to `src/i18n/messages/en.json` under `contactRequests` section:
```json
"statusUpdated": "Status updated successfully",
"pending": "Pending",
"read": "Read",
"resolved": "Resolved"
```

Add to `src/i18n/messages/ar.json` under `contactRequests` section:
```json
"statusUpdated": "تم تحديث الحالة بنجاح",
"pending": "قيد الانتظار",
"read": "مقروء",
"resolved": "تم الحل"
```

- [ ] **Step 2: Add i18n keys**

```bash
# Verify keys added
grep -n "statusUpdated\|pending\|read\|resolved" src/i18n/messages/en.json src/i18n/messages/ar.json
```

### Step 3: Add status update UI to AdminContactRequestsClient

Modify `src/components/admin/AdminContactRequestsClient.tsx`:

1. Add status to ContactRequest interface (after line 31):
```typescript
status: "pending" | "read" | "resolved";
```

2. Add status filter state (after line 43):
```typescript
const [statusFilter, setStatusFilter] = useState<string>("all");
```

3. Add handleStatusUpdate function (after handleDelete, around line 126):
```typescript
const handleStatusUpdate = useCallback(async (id: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from("contact_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      showToast(dict.common.unexpectedError, "error");
      return;
    }

    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus as ContactRequest["status"] } : r));
    showToast(dict.contactRequests.statusUpdated, "success");
  } catch {
    showToast(dict.common.unexpectedError, "error");
  }
}, [supabase, showToast, dict]);
```

4. Add status filter to filteredRequests (around line 155):
```typescript
const filteredRequests = requests.filter((r) => {
  if (filter !== "all" && r.contact_type !== filter) return false;
  if (officeFilter !== "all" && r.office_id !== officeFilter) return false;
  if (statusFilter !== "all" && r.status !== statusFilter) return false;
  return true;
});
```

5. Add status filter UI after office filter (around line 224):
```typescript
{/* Status Filter */}
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-500">{dict.common.status}:</span>
  {(["all", "pending", "read", "resolved"] as const).map((s) => (
    <button
      key={s}
      onClick={() => setStatusFilter(s)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        statusFilter === s ? "bg-navy-100 text-navy-700" : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {s === "all" ? dict.common.all : dict.contactRequests[s] || s}
    </button>
  ))}
</div>
```

6. Add status dropdown to each request card (around line 265, before the delete button):
```typescript
<select
  value={request.status}
  onChange={(e) => handleStatusUpdate(request.id, e.target.value)}
  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
  aria-label={`${dict.contactRequests.updateStatus} for ${request.visitor_name || ""}`}
>
  <option value="pending">{dict.contactRequests.pending}</option>
  <option value="read">{dict.contactRequests.read}</option>
  <option value="resolved">{dict.contactRequests.resolved}</option>
</select>
```

- [ ] **Step 3: Add status update UI**

```bash
# Verify changes
grep -n "handleStatusUpdate\|statusFilter" src/components/admin/AdminContactRequestsClient.tsx | head -10
```

### Step 4: Verify and commit

```bash
npx tsc --noEmit
npm run test:run
git add supabase/migrations/020_add_status_to_contact_requests.sql src/components/admin/AdminContactRequestsClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add contact request status updates with pending/read/resolved workflow"
```

---

## Task 12: Agent Edit and Status Toggle

**Files:**
- Modify: `src/app/api/agents/route.ts`
- Modify: `src/app/[locale]/dashboard/agents/page.tsx`

**Interfaces:**
- Consumes: `validateCsrfToken` from `@/lib/security/csrf`, `checkApiRateLimit` from `@/lib/security/rateLimit`, `createServiceRoleClient` from `@/lib/supabase/service-role`
- Produces: PATCH endpoint returning `{ success: true }` or error JSON

### Step 1: Add PATCH handler to agents API

Add to `src/app/api/agents/route.ts` after the DELETE handler (after line 278):

```typescript
export async function PATCH(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`agents-patch:${ip}`);
  if (!rate.allowed) {
    logger.warn("Rate limit exceeded on agents PATCH", { ip });
    const headers = rate.headers || { "Retry-After": String(rate.retryAfter) };
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers }
    );
  }

  const isValidCsrf = await validateCsrfToken(request);
  if (!isValidCsrf) {
    logger.warn("Invalid CSRF token on agents PATCH", { ip });
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const user = await verifyAdmin(request);
  if (!user) {
    logger.warn("Unauthorized agents PATCH attempt", { ip });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patchAgentSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    is_active: z.boolean().optional(),
  });

  const parsed = patchAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  // Authorization: OFFICE_ADMIN can only edit agents in their office
  if (user.role === ROLES.OFFICE_ADMIN && user.office_id) {
    const client = createServiceRoleClient();
    const { data: targetUser, error: queryError } = await client
      .from("users")
      .select("office_id, role")
      .eq("id", id)
      .maybeSingle();

    if (queryError || !targetUser || targetUser.office_id !== user.office_id) {
      return NextResponse.json({ error: "Cannot edit agents from other offices" }, { status: 403 });
    }
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id);

  if (error) {
    logger.error("Failed to update agent", { error: error.message, agentId: id });
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }

  logger.info("Agent updated successfully", { agentId: id, updates, updatedBy: user.id });

  await logActivity({
    userId: user.id,
    officeId: user.office_id,
    action: "agent.updated",
    entityType: "agent",
    entityId: id,
    metadata: { updates },
    ipAddress: ip,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 1: Add PATCH handler**

```bash
# Verify handler added
grep -n "export async function PATCH" src/app/api/agents/route.ts
```

### Step 2: Add i18n keys for agent edit

Add to `src/i18n/messages/en.json` under `office` section:
```json
"editAgent": "Edit Agent",
"agentUpdated": "Agent updated successfully",
"agentStatus": "Status"
```

Add to `src/i18n/messages/ar.json` under `office` section:
```json
"editAgent": "تعديل الوكيل",
"agentUpdated": "تم تحديث الوكيل بنجاح",
"agentStatus": "الحالة"
```

- [ ] **Step 2: Add i18n keys**

```bash
# Verify keys added
grep -n "editAgent\|agentUpdated\|agentStatus" src/i18n/messages/en.json src/i18n/messages/ar.json
```

### Step 3: Add Edit button and modal to agents page

Modify `src/app/[locale]/dashboard/agents/page.tsx`:

1. Add `Edit` to lucide-react imports (line 4):
```typescript
import { Users, Plus, Trash2, UserPlus, Download, Edit } from "lucide-react";
```

2. Add state for edit modal (after line 43):
```typescript
const [editModal, setEditModal] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });
const [editForm, setEditForm] = useState({ full_name: "", email: "", is_active: true });
```

3. Add handleEditAgent function (after handleDeleteAgent, around line 233):
```typescript
const handleEditAgent = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editModal.agent) return;
  setSaving(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      showToast(dict.common.unexpectedError, "error");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/agents", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({
        id: editModal.agent.id,
        full_name: editForm.full_name,
        email: editForm.email,
        is_active: editForm.is_active,
      }),
    });

    if (!res.ok) {
      const result = await res.json();
      showToast(result.error || dict.common.unexpectedError, "error");
      return;
    }

    showToast(dict.office.agentUpdated, "success");
    setEditModal({ open: false, agent: null });
    loadAgents();
  } catch (err) {
    logger.error("Failed to update agent", { error: err instanceof Error ? err.message : String(err) });
    showToast(dict.common.unexpectedError, "error");
  } finally {
    setSaving(false);
  }
};
```

4. Add Edit button to actions column (before the delete button, around line 303):
```typescript
<button
  onClick={() => {
    setEditForm({
      full_name: agent.full_name,
      email: agent.email,
      is_active: agent.is_active,
    });
    setEditModal({ open: true, agent });
  }}
  className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
  title={dict.office.editAgent}
  aria-label={dict.office.editAgent}
>
  <Edit className="w-4 h-4 text-navy-600" />
</button>
```

5. Add Edit Agent Modal before the Delete Confirmation Modal (before line 417):
```typescript
{/* Edit Agent Modal */}
<Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, agent: null })} title={dict.office.editAgent}>
  <form onSubmit={handleEditAgent} className="space-y-4">
    <Input
      label={dict.office.agentName}
      value={editForm.full_name}
      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
      required
    />
    <Input
      label={dict.common.email}
      type="email"
      value={editForm.email}
      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
      required
    />
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">{dict.office.agentStatus}</label>
      <button
        type="button"
        onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          editForm.is_active ? "bg-green-600" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={editForm.is_active}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          editForm.is_active ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
      <span className="text-sm text-gray-600">{editForm.is_active ? dict.common.active : dict.common.inactive}</span>
    </div>
    <div className="flex gap-3 justify-end pt-4">
      <Button type="button" variant="ghost" onClick={() => setEditModal({ open: false, agent: null })}>
        {dict.common.cancel}
      </Button>
      <Button type="submit" isLoading={saving}>
        {dict.common.save}
      </Button>
    </div>
  </form>
</Modal>
```

- [ ] **Step 3: Add Edit button and modal**

```bash
# Verify changes
grep -n "Edit\|editModal\|handleEditAgent" src/app/[locale]/dashboard/agents/page.tsx | head -15
```

### Step 4: Verify and commit

```bash
npx tsc --noEmit
npm run test:run
git add src/app/api/agents/route.ts src/app/[locale]/dashboard/agents/page.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add agent edit and status toggle functionality"
```

---

## Task 13: User Edit and Status Toggle

**Files:**
- Modify: `src/app/api/admin/users/route.ts` (verify PATCH handler exists)
- Modify: `src/components/admin/AdminUsersClient.tsx`

**Interfaces:**
- Consumes: Existing PATCH handler in `src/app/api/admin/users/route.ts`
- Produces: Edit modal and status toggle in admin users page

### Step 1: Verify PATCH handler exists

The PATCH handler already exists in `src/app/api/admin/users/route.ts` (lines 232-314). It supports:
- `userId: z.string().uuid()`
- `role: z.enum(['super_admin', 'office_admin', 'office_agent']).optional()`
- `is_active: z.boolean().optional()`
- `fullName: z.string().min(1).max(255).optional()`
- `email: z.string().email().optional()`

- [ ] **Step 1: Verify PATCH handler exists**

```bash
# Verify handler exists
grep -n "export async function PATCH" src/app/api/admin/users/route.ts
```

### Step 2: Add i18n keys for user edit

Add to `src/i18n/messages/en.json` under `admin` section:
```json
"editUser": "Edit User",
"userUpdated": "User updated successfully"
```

Add to `src/i18n/messages/ar.json` under `admin` section:
```json
"editUser": "تعديل المستخدم",
"userUpdated": "تم تحديث المستخدم بنجاح"
```

- [ ] **Step 2: Add i18n keys**

```bash
# Verify keys added
grep -n "editUser\|userUpdated" src/i18n/messages/en.json src/i18n/messages/ar.json
```

### Step 3: Add Edit button and modal to AdminUsersClient

Modify `src/components/admin/AdminUsersClient.tsx`:

1. Add `Edit` to lucide-react imports (line 5):
```typescript
import { Users, Trash2, Shield, ShieldCheck, ShieldOff, UserPlus, Edit } from "lucide-react";
```

2. Add state for edit modal (after line 67):
```typescript
const [editModal, setEditModal] = useState<{ open: boolean; user: UserRecord | null }>({ open: false, user: null });
const [editForm, setEditForm] = useState({ full_name: "", email: "", role: ROLES.OFFICE_AGENT, is_active: true });
```

3. Add handleEditUser function (after handleRoleChange, around line 164):
```typescript
const handleEditUser = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editModal.user) return;
  setUpdating(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...getCsrfHeaders(),
      },
      body: JSON.stringify({
        userId: editModal.user.id,
        fullName: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      }),
    });

    if (!response.ok) throw new Error("Failed to update user");
    showToast(dict.admin.userUpdated, "success");
    setEditModal({ open: false, user: null });
    fetchUsers();
  } catch (err) {
    logger.error("Failed to update user", { error: err instanceof Error ? err.message : String(err) });
    showToast(dict.common.unexpectedError, "error");
  } finally {
    setUpdating(false);
  }
};
```

4. Add Edit button to actions column (before the role change button, around line 282):
```typescript
{u.id !== user?.id && (
  <>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setEditForm({
          full_name: u.full_name,
          email: u.email,
          role: u.role as UserRole,
          is_active: u.is_active ?? true,
        });
        setEditModal({ open: true, user: u });
      }}
      aria-label={dict.admin.editUser}
    >
      <Edit className="w-4 h-4" aria-hidden="true" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setRoleModal({ open: true, user: u })}
      aria-label={dict.admin.changeRole}
    >
      <Shield className="w-4 h-4" aria-hidden="true" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setDeleteModal({ open: true, user: u })}
      aria-label={dict.admin.deleteUser}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
    </Button>
  </>
)}
```

5. Add Edit User Modal before the Delete Confirmation Modal (before line 370):
```typescript
{/* Edit User Modal */}
<Modal
  isOpen={editModal.open}
  onClose={() => setEditModal({ open: false, user: null })}
  title={dict.admin.editUser}
>
  <form onSubmit={handleEditUser} className="space-y-4">
    <Input
      label={dict.admin.createUserName}
      value={editForm.full_name}
      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
      required
    />
    <Input
      type="email"
      label={dict.admin.createUserEmail}
      value={editForm.email}
      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
      required
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin.createUserRole}</label>
      <select
        value={editForm.role}
        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{getRoleLabel(opt.value)}</option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">{dict.common.status}</label>
      <button
        type="button"
        onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          editForm.is_active ? "bg-green-600" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={editForm.is_active}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          editForm.is_active ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
      <span className="text-sm text-gray-600">{editForm.is_active ? dict.common.active : dict.common.inactive}</span>
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="ghost" type="button" onClick={() => setEditModal({ open: false, user: null })}>
        {dict.common.cancel}
      </Button>
      <Button type="submit" isLoading={updating}>
        {dict.common.save}
      </Button>
    </div>
  </form>
</Modal>
```

- [ ] **Step 3: Add Edit button and modal**

```bash
# Verify changes
grep -n "Edit\|editModal\|handleEditUser" src/components/admin/AdminUsersClient.tsx | head -15
```

### Step 4: Verify and commit

```bash
npx tsc --noEmit
npm run test:run
git add src/components/admin/AdminUsersClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add user edit and status toggle functionality"
```

---

## Final Verification

After all tasks are complete:

```bash
# Run full verification pipeline
npm run lint && npx tsc --noEmit && npm run test:run && npm run build

# Verify all i18n keys exist
grep -n "editOffice\|officeUpdated\|editAgent\|agentUpdated\|editUser\|userUpdated\|statusUpdated" src/i18n/messages/en.json src/i18n/messages/ar.json

# Verify all API routes exist
ls -la src/app/api/admin/offices/route.ts
ls -la src/app/api/agents/route.ts
ls -la src/app/api/admin/users/route.ts

# Verify migration file exists
ls -la supabase/migrations/020_add_status_to_contact_requests.sql
```

## Notes

- Task 11 migration needs to be applied via `supabase db push --linked` (DO NOT execute in code)
- All API routes follow the same pattern: CSRF + rate limit + Zod + service-role client
- UI modals use existing Modal, Button, Input components
- All strings use i18n keys (no hardcoded text)
- Status toggle uses a switch button pattern consistent with existing UI
