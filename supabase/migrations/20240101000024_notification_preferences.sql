-- ============================================
-- Sadat MLS Cloud - User Notification Preferences
-- ============================================

-- Add notification_preferences JSONB column to users table
-- Default enables all notification types
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  DEFAULT '{"contact_request": true, "agent_joined": true}'::jsonb;

-- Add check constraint to ensure valid preference keys
-- (Optional: validates JSONB structure on insert/update)
-- ALTER TABLE users ADD CONSTRAINT check_notification_preferences
--   CHECK (notification_preferences ?& array['contact_request', 'agent_joined']);
