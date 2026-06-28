-- ============================================
-- Sadat MLS Cloud - Rate Limit Log Table
-- Run this AFTER 003_office_logos_bucket.sql
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RATE LIMIT LOG TABLE
-- ============================================
CREATE TABLE rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient rate limit queries
CREATE INDEX idx_rate_limit_log_action_ip_created
  ON rate_limit_log (action, ip_address, created_at DESC);

-- RLS for rate limit log
-- Disabled: rate_limit_log is operational logging, not user data.
-- Service-role client bypasses RLS anyway; server client may run without auth.uid().
ALTER TABLE rate_limit_log DISABLE ROW LEVEL SECURITY;

-- ============================================
-- CLEANUP FUNCTION (optional - run via cron)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs(retention_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_log
  WHERE created_at < now() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-CLEANUP TRIGGER (optional - on insert)
-- ============================================
-- Uncomment if you want automatic cleanup on each insert
-- CREATE TRIGGER cleanup_rate_limit_logs
--   AFTER INSERT ON rate_limit_log
--   FOR EACH ROW EXECUTE FUNCTION cleanup_old_rate_limit_logs(7);