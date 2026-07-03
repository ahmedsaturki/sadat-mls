-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'property.created', 'property.updated', 'agent.created', etc.
  entity_type TEXT NOT NULL, -- 'property', 'agent', 'contact_request', 'office'
  entity_id UUID,
  entity_title TEXT, -- human-readable title (e.g. property title, agent name)
  metadata JSONB DEFAULT '{}', -- additional context (old/new values, field changed, etc.)
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_log_office_id ON activity_log(office_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- RLS policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Office members can read their office's activity
CREATE POLICY "Office members can read own activity" ON activity_log
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
  );

-- Super admins can read all activity
CREATE POLICY "Super admins can read all activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Authenticated users can insert activity (for logging their own actions)
CREATE POLICY "Authenticated users can insert activity" ON activity_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Super admins can delete old activity (for cleanup)
CREATE POLICY "Super admins can delete activity" ON activity_log
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
