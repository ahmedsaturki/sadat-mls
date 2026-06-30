-- ============================================
-- Migration 013: Fix Rate Limit RLS
-- Re-disable RLS on rate_limit_log table
-- ============================================

-- Re-disable RLS on rate_limit_log (may have been re-enabled via dashboard)
ALTER TABLE rate_limit_log DISABLE ROW LEVEL SECURITY;

-- Drop any policies that may have been created
DROP POLICY IF EXISTS "Service role can insert rate limit logs" ON rate_limit_log;
DROP POLICY IF EXISTS "Service role can view rate limit logs" ON rate_limit_log;
DROP POLICY IF EXISTS "rate_limit_log_insert_policy" ON rate_limit_log;
DROP POLICY IF EXISTS "rate_limit_log_select_policy" ON rate_limit_log;

-- Migration complete
SELECT 'Rate limit RLS re-disabled - service-role can now insert logs' as status;
