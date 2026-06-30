-- ============================================
-- Migration 010: Performance and RLS Fixes
-- Fix 406 errors on property_favorites and timeout issues
-- ============================================

-- 1. Fix property_favorites 406 errors
-- The issue: RLS policy requires auth.uid() = user_id, but queries may come from
-- service_role or different contexts. Allow SELECT for authenticated users
-- who own the favorite OR are viewing their own.
-- For 406 on empty results: this is PostgREST behavior when Prefer: count=exact
-- and no rows match. Client should handle gracefully or use limit=1.

-- Update SELECT policy to also allow service_role (for admin dashboards)
DROP POLICY IF EXISTS "users_view_own_favorites" ON property_favorites;
CREATE POLICY "users_view_own_favorites"
  ON property_favorites FOR SELECT
  USING (auth.uid() = user_id OR current_setting('role', true) = 'service_role');

-- 2. Increase statement timeout for complex queries
-- Default is often 10-30s, increase to 60s for dashboard queries
ALTER DATABASE postgres SET statement_timeout = '60s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '60s';

-- 3. Add missing indexes for common query patterns
-- Properties: commonly filtered by status, is_active, office_id, created_at
CREATE INDEX IF NOT EXISTS idx_properties_status_active_office_created 
  ON properties(status, is_active, office_id, created_at DESC);

-- Properties: commonly joined with property_types, zones, offices
CREATE INDEX IF NOT EXISTS idx_properties_type_zone_office 
  ON properties(property_type_id, zone_id, office_id);

-- Property images: commonly filtered by property_id and is_primary
CREATE INDEX IF NOT EXISTS idx_property_images_property_primary 
  ON property_images(property_id, is_primary) WHERE is_primary = true;

-- Contact requests: commonly filtered by office_id and ordered by created_at
CREATE INDEX IF NOT EXISTS idx_contact_requests_office_created 
  ON contact_requests(office_id, created_at DESC);

-- Users: commonly filtered by office_id and role
CREATE INDEX IF NOT EXISTS idx_users_office_role 
  ON users(office_id, role);

-- 4. Optimize get_user_role and get_user_office_id functions
-- Use CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

CREATE OR REPLACE FUNCTION get_user_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

-- Grant execute permissions to authenticated role for RLS evaluation
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_office_id() TO authenticated;

-- 5. Add index on rate_limit_log for cleanup function performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_created_at 
  ON rate_limit_log(created_at);

-- 6. Update RLS policy for properties to use stable functions
-- This helps the planner optimize better
DROP POLICY IF EXISTS "office_admin_manage_own_properties" ON properties;
CREATE POLICY "office_admin_manage_own_properties"
  ON properties FOR ALL
  USING (
    office_id = get_user_office_id() 
    AND get_user_role() IN ('office_admin', 'office_agent')
  )
  WITH CHECK (
    office_id = get_user_office_id() 
    AND get_user_role() IN ('office_admin', 'office_agent')
  );

-- 7. Ensure properties table has proper indexes for RLS
CREATE INDEX IF NOT EXISTS idx_properties_office_id_active 
  ON properties(office_id, is_active);

-- Migration complete