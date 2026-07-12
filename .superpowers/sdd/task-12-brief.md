# Task 12: Agent Edit and Status Toggle

**Files:**
- Modify: `src/app/api/agents/route.ts`
- Modify: `src/app/[locale]/dashboard/agents/page.tsx`

**Interfaces:**
- Consumes: `validateCsrfToken` from `@/lib/security/csrf`, `checkApiRateLimit` from `@/lib/security/rateLimit`, `createServiceRoleClient` from `@/lib/supabase/service-role`
- Produces: PATCH endpoint returning `{ success: true }` or error JSON

## Steps

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

## Verification

```bash
npx tsc --noEmit
npm run test:run
```

## Commit

```bash
git add src/app/api/agents/route.ts src/app/[locale]/dashboard/agents/page.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add agent edit and status toggle functionality"
```
