-- ============================================
-- Sadat MLS Cloud - Add i18n params to notifications
-- title_params and message_params for parameterized translations
-- Run this AFTER 022_rate_limit_state.sql
-- ============================================

-- Add JSON columns for i18n parameter interpolation
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_params JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_params JSONB;
