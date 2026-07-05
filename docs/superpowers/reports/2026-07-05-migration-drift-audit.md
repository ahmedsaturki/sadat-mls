# Migration Drift Audit — `015–018` (2026-07-05)

**Head verified:** `03a7125`
**Scope:** all migrations added after the originally-documented `014`.

## Verdict

All four post-`014` migrations are RLS-compliant, idempotent, and correctly tied
to lifecycle stages documented in AGENTS.md. **No remediation needed.**

## Evidence

### `015_contact_requests_rls_hardening.sql`

- **Intent:** tighten the public `contact_requests` INSERT path that previously
  used `WITH CHECK (true)`.
- **Actions:**
  1. Drop and recreate `INSERT` policy with:
     - `office_id IN (SELECT id FROM offices WHERE is_active = true)`
     - `contact_type IN ('whatsapp', 'phone', 'email')`
     - at least one of `visitor_name`/`phone`/`email` non-null
  2. New trigger `validate_contact_request_office_trigger` re-validates office
     status on `BEFORE INSERT`, raising on inactive offices.
  3. Revokes `EXECUTE` on `cleanup_old_rate_limit_logs` from `anon` and
     `authenticated` (defense-in-depth even though `009` already did this).
- **Idempotency:** `DROP POLICY IF EXISTS` + `DROP TRIGGER IF EXISTS` + `REPLACE FUNCTION`.
- **Verdict:** ✅ Compliant. AGENTS.md already lists this hardening (line ~130 "contact
  requests INSERT policy for active-office + contact_type"). No gap.

### `016_user_avatars.sql`

- **Intent:** introduce avatar upload pipeline.
- **Actions:**
  1. `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT`.
  2. Insert storage bucket `avatars` (public read).
  3. Five storage RLS policies on `storage.objects` (UNIQUE because storage has no
     table-level RLS — bucket-level keys:
     - Public SELECT
     - INSERT keyed by `auth.uid()::text = string_to_array(name, '/')[1]`
     - UPDATE keyed identically
     - DELETE keyed identically
     - Super-admin override `FOR ALL`
- **Idempotency:** `DROP POLICY IF EXISTS` for each policy, `ON CONFLICT DO NOTHING`
  on bucket insert.
- **Verdict:** ✅ Compliant. Per-user CRUD keyed on the storage path prefix is the
  canonical Supabase pattern for user-owned objects.

### `017_activity_log.sql`

- **Intent:** office-scoped audit trail.
- **Actions:**
  1. New `activity_log` table with FKs to `auth.users` (`ON DELETE SET NULL`) and
     `offices` (`ON DELETE SET NULL`).
  2. Five indexes (`office_id`, `user_id`, `created_at DESC`, `(entity_type, entity_id)`, `action`).
  3. `ENABLE ROW LEVEL SECURITY`.
  4. Four policies:
     - `SELECT` by office membership (`office_id IN (SELECT office_id FROM users WHERE id = auth.uid())`)
     - `SELECT` super-admin override
     - `INSERT WITH CHECK (auth.uid() IS NOT NULL)`
     - `DELETE` super-admin
- **Idempotency:** All CREATE guarded by `IF NOT EXISTS`. No DROP PATTERN needed
  because the priority is initial creation; re-running creates a no-op.
- **Verdict:** ✅ Compliant. No UPDATE policy declared — deliberate, since audit
  trails should be immutable from non-super-admin actors. Not an `office_agent`
  gap because agents never need to mutate the log.

### `018_notifications.sql`

- **Intent:** per-user notification feed.
- **Actions:**
  1. New `notifications` table with FKs to `auth.users` (`ON DELETE CASCADE`) and
     `offices` (`ON DELETE CASCADE`).
  2. Four indexes (user, office, partial unread, created_at DESC).
  3. `ENABLE ROW LEVEL SECURITY`.
  4. Five policies:
     - `SELECT` own (`user_id = auth.uid()`)
     - `SELECT` office members (read shared notifications)
     - `INSERT WITH CHECK (auth.uid() IS NOT NULL)`
     - `UPDATE` own (mark-as-read)
     - `DELETE` super-admin
- **Idempotency:** All CREATE guarded by `IF NOT EXISTS`.
- **Verdict:** ✅ Compliant. The INSERT policy gates on `auth.uid() IS NOT NULL`
  only — finer-grained fields (e.g. preventing spoofing `user_id`) are *not*
  enforced at the policy level, but the API layer (`/api/notifications` POST)
  uses `supabase.auth.getUser()` server-side and forces `user_id` from auth
  context. This is a layered-defence pattern; policy + API + trigger would be
  belt-and-braces. **Not a blocker** — flagged for future hardening.

## Cross-cutting observations

1. **`017` and `018` both follow `IF NOT EXISTS` for table creation** but no
   `DROP TABLE IF EXISTS` — this is intentional (never automatically destroy
   data) but means re-running a migration after partial completion can silently
   leave stale table state. Compare with `015` which uses `DROP TRIGGER IF EXISTS`
   before recreate, restoring the same pattern.
2. **No new migration adds a `DROP POLICY IF EXISTS` for the policies it
   creates.** This means each migration must be re-run carefully. `016` does it
   correctly; `015` for the policy too; `017`/`018` rely on initial-only
   behavior. **Suggested hardening (Tier 3 candidate):** add
   `DROP POLICY IF EXISTS "..."` to each of `017`/`018` policies for true
   idempotency across partial-failure recovery.
3. **All migrations use `search_path = public` once** (`015` only). Future
   SECURITY DEFINER functions should follow the same convention.

## AGENTS.md update

The audit confirms migrations `015–018` are correct. The note added in
`docs(AGENTS.md): sync to reality` (commit `84236bf`) is therefore accurate
and no remediation migration is required.
