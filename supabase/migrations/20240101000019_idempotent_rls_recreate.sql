-- ============================================
-- Migration 019: idempotent RLS policy hardening for 017/018
-- Add DROP POLICY IF EXISTS pattern to activity_log and notifications
-- so a partial-failure re-run doesn't leave duplicate policies.
-- ============================================

-- activity_log (migration 017) policies
DROP POLICY IF EXISTS "Office members can read own activity" ON activity_log;
CREATE POLICY "Office members can read own activity" ON activity_log
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can read all activity" ON activity_log;
CREATE POLICY "Super admins can read all activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;
CREATE POLICY "Authenticated users can insert activity" ON activity_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Super admins can delete activity" ON activity_log;
CREATE POLICY "Super admins can delete activity" ON activity_log
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- notifications (migration 018) policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Office members can read office notifications" ON notifications;
CREATE POLICY "Office members can read office notifications" ON notifications
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Super admins can delete notifications" ON notifications;
CREATE POLICY "Super admins can delete notifications" ON notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Migration complete
SELECT 'Migration 019 applied: idempotent RLS policy re-creation for activity_log + notifications' as status;
