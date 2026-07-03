-- Notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'contact_request', 'property_inquiry', 'agent_joined', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT, -- 'property', 'contact_request', 'agent', 'office'
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_office_id ON notifications(office_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Office members can read their office's notifications
CREATE POLICY "Office members can read office notifications" ON notifications
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
  );

-- Authenticated users can insert notifications (for creating from client)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Super admins can delete all notifications
CREATE POLICY "Super admins can delete notifications" ON notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
