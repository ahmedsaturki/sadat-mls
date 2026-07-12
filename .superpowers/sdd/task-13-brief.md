# Task 13: User Edit and Status Toggle

**Files:**
- Modify: `src/app/api/admin/users/route.ts` (verify PATCH handler exists)
- Modify: `src/components/admin/AdminUsersClient.tsx`

**Interfaces:**
- Consumes: Existing PATCH handler in `src/app/api/admin/users/route.ts`
- Produces: Edit modal and status toggle in admin users page

## Steps

### Step 1: Verify PATCH handler exists

The PATCH handler already exists in `src/app/api/admin/users/route.ts` (lines 232-314). It supports:
- `userId: z.string().uuid()`
- `role: z.enum(['super_admin', 'office_admin', 'office_agent']).optional()`
- `is_active: z.boolean().optional()`
- `fullName: z.string().min(1).max(255).optional()`
- `email: z.string().email().optional()`

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

## Verification

```bash
npx tsc --noEmit
npm run test:run
```

## Commit

```bash
git add src/components/admin/AdminUsersClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add user edit and status toggle functionality"
```
