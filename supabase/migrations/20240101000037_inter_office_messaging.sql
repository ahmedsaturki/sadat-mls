-- Enhance messages for inter-office messaging
-- Add parent_id for conversation threads
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Add read_by JSONB for read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]';

-- Add attachment support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Add recipient_office_id for inter-office messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_office_id UUID REFERENCES offices(id) ON DELETE SET NULL;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_office_id);

-- Update RLS to allow inter-office messaging
DROP POLICY IF EXISTS "Office members can view messages" ON messages;
CREATE POLICY "Office members can view messages"
  ON messages FOR SELECT
  USING (
    office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR recipient_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR auth.uid() = sender_id
  );

-- Allow inserting messages to other offices
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
