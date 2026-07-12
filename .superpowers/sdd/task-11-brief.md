# Task 11: Contact Request Status Updates

**Files:**
- Create: `supabase/migrations/020_add_status_to_contact_requests.sql`
- Modify: `src/components/admin/AdminContactRequestsClient.tsx`

**Interfaces:**
- Consumes: `status` column on `contact_requests` table
- Produces: Status update UI in admin contact requests page

## Steps

### Step 1: Create migration file

Create `supabase/migrations/020_add_status_to_contact_requests.sql`:

```sql
-- Add status column to contact_requests table
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'resolved'));

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
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

## Verification

```bash
npx tsc --noEmit
npm run test:run
```

## Commit

```bash
git add supabase/migrations/020_add_status_to_contact_requests.sql src/components/admin/AdminContactRequestsClient.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat: add contact request status updates with pending/read/resolved workflow"
```
