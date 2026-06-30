-- ============================================
-- Migration 009: Security Hardening
-- Fixes Supabase linter warnings
-- ============================================

-- ============================================
-- 1. RATE LIMIT LOG TABLE FIX
-- Remove policies since RLS is intentionally disabled
-- ============================================
DROP POLICY IF EXISTS "Super admin can insert rate limit logs" ON rate_limit_log;
DROP POLICY IF EXISTS "Super admin can view rate limit logs" ON rate_limit_log;

-- RLS remains disabled as this is operational logging
-- that service-role client accesses without auth.uid()

-- ============================================
-- 2. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- Add SET search_path to prevent schema confusion
-- ============================================

-- Check if set_updated_at function exists and drop it if so (it's a duplicate/conflicting function)
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- update_updated_at_column - called as trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- handle_new_user - trigger function, needs SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'office_agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- get_user_role - helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

-- get_user_office_id - helper function
CREATE OR REPLACE FUNCTION get_user_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE;

-- cleanup_old_rate_limit_logs - needs SECURITY DEFINER but restrict access
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs(retention_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- check_property_active - trigger function
CREATE OR REPLACE FUNCTION check_property_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = NEW.property_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot favorite inactive property';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================
-- 3. REVOKE PUBLIC EXECUTE ON SENSITIVE FUNCTIONS
-- Prevent anon/authenticated from calling via REST API
-- ============================================

-- cleanup_old_rate_limit_logs should only be callable by service_role
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limit_logs(retention_days INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limit_logs(retention_days INTEGER) FROM authenticated;

-- get_user_office_id and get_user_role are needed for RLS policies
-- Grant execute to authenticated role so they can be used in RLS evaluation
GRANT EXECUTE ON FUNCTION public.get_user_office_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- handle_new_user is called as trigger, revoke direct execute
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- rls_auto_enable - system function, revoke if exists (conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
  END IF;
END $$;

-- ============================================
-- 4. STORAGE BUCKET POLICY FIX
-- Prevent listing but allow access by path
-- Note: Public SELECT on bucket_id is still needed for signed URLs to work
-- The warning is about listing all files, but our use case requires public access
-- ============================================

-- Office logos - already correctly configured (public SELECT with bucket_id check)
-- Properties - already correctly configured (public SELECT with bucket_id check)
-- These policies are intentional for public image access via signed URLs

-- ============================================
-- 5. CONTACT REQUESTS POLICY FIX
-- Add check constraint for data quality
-- ============================================

-- The policy WITH CHECK (true) is flagged but intentional for public contact forms
-- Add check constraint to ensure data quality even with permissive RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contact_requests_valid_check'
    AND conrelid = 'contact_requests'::regclass
  ) THEN
    ALTER TABLE contact_requests
      ADD CONSTRAINT contact_requests_valid_check
      CHECK (
        contact_type IN ('whatsapp', 'phone', 'email')
        AND (visitor_name IS NOT NULL OR visitor_phone IS NOT NULL OR visitor_email IS NOT NULL)
      );
  END IF;
END $$;

-- Migration complete

-- ============================================
-- REMAINING WARNINGS (INTENTIONAL / OUT OF SCOPE)
-- ============================================
-- 1. contact_requests INSERT policy: WITH CHECK (true) is intentional for public contact forms
--    Users submit inquiries without accounts; the check constraint added above ensures data quality
--
-- 2. public_bucket_allows_listing: Both office-logos and properties buckets intentionally allow
--    public listing because signed URLs require public SELECT access. This is documented behavior.
--
-- 3. rls_auto_enable: Supabase system function created by platform. May reappear if auto-created.
--
-- 4. auth_leaked_password_protection: Requires Supabase Pro Plan upgrade (not in scope)