-- ============================================
-- Sadat MLS Cloud - Push Notification Subscriptions
-- ============================================

-- Add push_subscription column to users table
-- Stores the Web Push API subscription as JSONB
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription JSONB;
