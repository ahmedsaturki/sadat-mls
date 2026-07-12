# Task 10: Office Edit (API + UI Modal)

**Files:**
- Create: `src/app/api/admin/offices/route.ts`
- Modify: `src/components/admin/AdminOfficesClient.tsx`

**Interfaces:**
- Consumes: `validateCsrfToken` from `@/lib/security/csrf`, `checkApiRateLimit` from `@/lib/security/rateLimit`, `officeSchema` from `@/lib/validation`, `createServiceRoleClient` from `@/lib/supabase/service-role`
- Produces: PATCH endpoint returning `{ success: true }` or error JSON

## Steps

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

## Verification

```bash
npx tsc --noEmit
npm run test:run
```

## Commit

```bash
git add src/app/api/admin/offices/route.ts src/components/admin/AdminOfficesClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add office edit functionality with API endpoint and edit modal"
```
