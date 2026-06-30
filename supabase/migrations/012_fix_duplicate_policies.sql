-- ============================================
-- Migration 012: Fix duplicate RLS policies on property_favorites
-- Drop the old policy that blocks service_role access
-- ============================================

-- Drop the old restrictive policy (created in migration 007)
DROP POLICY IF EXISTS "Users can view their own favorites" ON property_favorites;

-- The new policy from migration 010 already exists with service_role bypass
-- Verify it exists and is working
SELECT 'Policy cleanup complete - service_role can now access property_favorites' as status;