-- ============================================
-- Sadat MLS Cloud - Rate Limit State Table
-- Cross-instance rate limiting via PostgreSQL
-- Run this AFTER 021_add_description_to_offices.sql
-- ============================================

-- Rate limit state: one row per (action, ip, window)
-- Atomic upsert via increment_rate_limit() ensures correct counts across serverless instances
CREATE TABLE IF NOT EXISTS rate_limit_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  ip_address INET NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint for atomic upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_state_action_ip_window
  ON rate_limit_state (action, ip_address, window_start);

-- Index for cleanup queries (DELETE WHERE window_start < cutoff)
CREATE INDEX IF NOT EXISTS idx_rate_limit_state_window_start
  ON rate_limit_state (window_start);

-- RLS disabled: operational table, accessed only via service-role client
ALTER TABLE rate_limit_state DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ATOMIC INCREMENT FUNCTION
-- Single-query INSERT-or-UPDATE to prevent race conditions
-- ============================================
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_action TEXT,
  p_ip INET,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO rate_limit_state (action, ip_address, window_start, count)
  VALUES (p_action, p_ip, p_window_start, 1)
  ON CONFLICT (action, ip_address, window_start)
  DO UPDATE SET count = rate_limit_state.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from anon/authenticated — only service-role should call this
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INET, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INET, TIMESTAMPTZ) FROM authenticated;
