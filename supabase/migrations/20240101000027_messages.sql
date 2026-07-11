-- Messages table for office-to-visitor communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_request_id UUID REFERENCES contact_requests(id) ON DELETE SET NULL,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent')),
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_office ON messages(office_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_request ON messages(contact_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Office members can read messages for their office
CREATE POLICY "Office members can read messages"
  ON messages FOR SELECT
  USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
    OR auth.uid() = sender_id
  );

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Office members can update read status
CREATE POLICY "Office members can update messages"
  ON messages FOR UPDATE
  USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
  );
