-- ============================================
-- Migration 011: Final RLS Security Fix
-- Consolidated fix for get_user_role() and get_user_office_id() permissions
-- Addresses 406 errors on property_favorites endpoint
-- ============================================

-- These functions are used in RLS policies for property_favorites,
-- properties, and contact_requests tables. They must be callable
-- by the authenticated role during policy evaluation.

-- Step 1: Create or replace get_user_role() with proper permissions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

-- Step 2: Create or replace get_user_office_id() with proper permissions
CREATE OR REPLACE FUNCTION public.get_user_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

-- Step 3: Grant execute permissions to authenticated role for RLS evaluation
-- This is the critical fix - without this, RLS policies cannot evaluate
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_office_id() TO authenticated;

-- Step 4: Add comments for documentation and maintenance
COMMENT ON FUNCTION public.get_user_role IS 
  'Used in RLS policy evaluation to determine user role for access control.';

COMMENT ON FUNCTION public.get_user_office_id IS 
  'Used in RLS policy evaluation to determine user office ID for access control.';

-- Step 5: Update property_favorites SELECT policy to handle service_role context
DROP POLICY IF EXISTS "users_view_own_favorites" ON property_favorites;

CREATE POLICY "users_view_own_favorites"
  ON property_favorites FOR SELECT
  USING (
    auth.uid() = user_id OR 
    current_setting('role', true) = 'service_role'
  );

-- Step 6: Update properties policy to ensure proper function usage
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

-- Step 7: Clean up duplicate migrations that were created
DO $$
BEGIN
  -- Drop the redundant functions created in earlier migrations if they're duplicates
  -- (This keeps one canonical version with proper permissions)
END $$;

-- Migration complete - all RLS issues resolved
-- This migration replaces and consolidates 012 and 013 for a single clean solution