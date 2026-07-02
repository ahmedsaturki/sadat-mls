-- ============================================
-- Migration 015: Contact Requests RLS Hardening
-- Tighten INSERT policy and add validation trigger
-- ============================================

-- 1. Tighten contact_requests INSERT policy
-- Instead of WITH CHECK (true), validate that office_id references an active office
DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
CREATE POLICY "Anyone can create contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (
    office_id IN (SELECT id FROM offices WHERE is_active = true)
    AND contact_type IN ('whatsapp', 'phone', 'email')
    AND (visitor_name IS NOT NULL OR visitor_phone IS NOT NULL OR visitor_email IS NOT NULL)
  );

-- 2. Add trigger to validate office_id exists before insert
CREATE OR REPLACE FUNCTION validate_contact_request_office()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.offices
    WHERE id = NEW.office_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive office_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS validate_contact_request_office_trigger ON contact_requests;
CREATE TRIGGER validate_contact_request_office_trigger
  BEFORE INSERT ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION validate_contact_request_office();

-- 3. Revoke execute on cleanup function from authenticated (already done in 009, but ensure)
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limit_logs(retention_days INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limit_logs(retention_days INTEGER) FROM authenticated;

-- Migration complete
SELECT 'Contact requests RLS hardened - INSERT now validates office_id and contact_type' as status;
