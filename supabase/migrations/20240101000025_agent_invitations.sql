-- ============================================
-- Sadat MLS Cloud - Agent Invitations
-- ============================================

-- Invitations table for email-based agent onboarding
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for efficient lookups by email and token
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_office ON invitations(office_id);

-- RLS policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Office admins can view invitations for their office
CREATE POLICY "Office admins can view own invitations" ON invitations
  FOR SELECT USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid() AND role IN ('office_admin', 'super_admin')
    )
  );

-- Office admins can create invitations for their office
CREATE POLICY "Office admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid() AND role IN ('office_admin', 'super_admin')
    )
  );

-- Office admins can update invitations (mark as accepted/expired)
CREATE POLICY "Office admins can update invitations" ON invitations
  FOR UPDATE USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid() AND role IN ('office_admin', 'super_admin')
    )
  );

-- Super admins can delete any invitation
CREATE POLICY "Super admins can delete invitations" ON invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
