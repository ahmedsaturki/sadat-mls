-- ============================================
-- Sadat MLS Cloud - RLS Policies
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (for idempotency)
-- ============================================
DROP POLICY IF EXISTS "Public can view active offices" ON offices;
DROP POLICY IF EXISTS "Super admin can manage offices" ON offices;
DROP POLICY IF EXISTS "Office admin can view own office" ON offices;
DROP POLICY IF EXISTS "Office admin can update own office" ON offices;

DROP POLICY IF EXISTS "Super admin can view all users" ON users;
DROP POLICY IF EXISTS "Super admin can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Office admin can view office users" ON users;
DROP POLICY IF EXISTS "Office admin can manage office users" ON users;

DROP POLICY IF EXISTS "Everyone can view zones" ON zones;
DROP POLICY IF EXISTS "Super admin can manage zones" ON zones;

DROP POLICY IF EXISTS "Everyone can view property types" ON property_types;
DROP POLICY IF EXISTS "Super admin can manage property types" ON property_types;

DROP POLICY IF EXISTS "Public can view properties from active offices" ON properties;
DROP POLICY IF EXISTS "Super admin can manage all properties" ON properties;
DROP POLICY IF EXISTS "Office admin can manage office properties" ON properties;
DROP POLICY IF EXISTS "Office agent can view office properties" ON properties;
DROP POLICY IF EXISTS "Office agent can create office properties" ON properties;
DROP POLICY IF EXISTS "Office agent can update office properties" ON properties;

DROP POLICY IF EXISTS "Office can view own property owners" ON property_owners;
DROP POLICY IF EXISTS "Office can manage own property owners" ON property_owners;
DROP POLICY IF EXISTS "Super admin can manage all property owners" ON property_owners;

DROP POLICY IF EXISTS "Public can view images from active offices" ON property_images;
DROP POLICY IF EXISTS "Office can manage own property images" ON property_images;
DROP POLICY IF EXISTS "Super admin can manage all images" ON property_images;

DROP POLICY IF EXISTS "Office can view own contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Office can update own contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Super admin can manage all contact requests" ON contact_requests;

DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Office can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Office can delete own property images" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can manage all storage" ON storage.objects;

-- ============================================
-- HELPER FUNCTION: Get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Get current user's office_id
-- ============================================
CREATE OR REPLACE FUNCTION get_user_office_id()
RETURNS UUID AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 1. OFFICES
-- ============================================
-- Everyone can view active offices (for public explore page)
CREATE POLICY "Public can view active offices"
  ON offices FOR SELECT
  USING (is_active = true);

-- Super admin can do everything
CREATE POLICY "Super admin can manage offices"
  ON offices FOR ALL
  USING (get_user_role() = 'super_admin');

-- Office admin can view their own office
CREATE POLICY "Office admin can view own office"
  ON offices FOR SELECT
  USING (
    id = get_user_office_id()
    AND get_user_role() = 'office_admin'
  );

-- Office admin can update their own office
CREATE POLICY "Office admin can update own office"
  ON offices FOR UPDATE
  USING (
    id = get_user_office_id()
    AND get_user_role() = 'office_admin'
  );

-- ============================================
-- 2. USERS
-- ============================================
-- Super admin can see all users
CREATE POLICY "Super admin can view all users"
  ON users FOR SELECT
  USING (get_user_role() = 'super_admin');

-- Super admin can manage all users
CREATE POLICY "Super admin can manage all users"
  ON users FOR ALL
  USING (get_user_role() = 'super_admin');

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Office admin can view users in their office
CREATE POLICY "Office admin can view office users"
  ON users FOR SELECT
  USING (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_admin'
  );

-- Office admin can manage users in their office
CREATE POLICY "Office admin can manage office users"
  ON users FOR ALL
  USING (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_admin'
  );

-- ============================================
-- 3. ZONES (read-only for everyone)
-- ============================================
CREATE POLICY "Everyone can view zones"
  ON zones FOR SELECT
  USING (true);

CREATE POLICY "Super admin can manage zones"
  ON zones FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- 4. PROPERTY TYPES (read-only for everyone)
-- ============================================
CREATE POLICY "Everyone can view property types"
  ON property_types FOR SELECT
  USING (true);

CREATE POLICY "Super admin can manage property types"
  ON property_types FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- 5. PROPERTIES
-- ============================================
-- Public can view properties from active offices
CREATE POLICY "Public can view properties from active offices"
  ON properties FOR SELECT
  USING (
    is_active = true
    AND office_id IN (SELECT id FROM offices WHERE is_active = true)
  );

-- Super admin can see all properties
CREATE POLICY "Super admin can manage all properties"
  ON properties FOR ALL
  USING (get_user_role() = 'super_admin');

-- Office admin can manage their own office properties
CREATE POLICY "Office admin can manage office properties"
  ON properties FOR ALL
  USING (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_admin'
  );

-- Office agent can view their office properties
CREATE POLICY "Office agent can view office properties"
  ON properties FOR SELECT
  USING (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_agent'
  );

-- Office agent can create properties in their office
CREATE POLICY "Office agent can create office properties"
  ON properties FOR INSERT
  WITH CHECK (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_agent'
  );

-- Office agent can update properties in their office
CREATE POLICY "Office agent can update office properties"
  ON properties FOR UPDATE
  USING (
    office_id = get_user_office_id()
    AND get_user_role() = 'office_agent'
  );

-- ============================================
-- 6. PROPERTY OWNERS (CRITICAL SECURITY)
-- ============================================
-- Only the office that owns the property can see owner data
CREATE POLICY "Office can view own property owners"
  ON property_owners FOR SELECT
  USING (
    office_id = get_user_office_id()
  );

-- Office can manage their property owners
CREATE POLICY "Office can manage own property owners"
  ON property_owners FOR ALL
  USING (
    office_id = get_user_office_id()
  );

-- Super admin can see all property owners
CREATE POLICY "Super admin can manage all property owners"
  ON property_owners FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- 7. PROPERTY IMAGES
-- ============================================
-- Public can view images for properties from active offices
CREATE POLICY "Public can view images from active offices"
  ON property_images FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties
      WHERE is_active = true
      AND office_id IN (SELECT id FROM offices WHERE is_active = true)
    )
  );

-- Office can manage their property images
CREATE POLICY "Office can manage own property images"
  ON property_images FOR ALL
  USING (
    property_id IN (
      SELECT id FROM properties WHERE office_id = get_user_office_id()
    )
  );

-- Super admin can manage all images
CREATE POLICY "Super admin can manage all images"
  ON property_images FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- 8. CONTACT REQUESTS
-- ============================================
-- Office can view their own contact requests
CREATE POLICY "Office can view own contact requests"
  ON contact_requests FOR SELECT
  USING (
    office_id = get_user_office_id()
  );

-- Office can update their own contact requests (mark as read, change status)
CREATE POLICY "Office can update own contact requests"
  ON contact_requests FOR UPDATE
  USING (
    office_id = get_user_office_id()
  );

-- Anyone can create contact requests (for public users)
CREATE POLICY "Anyone can create contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

-- Super admin can see all contact requests
CREATE POLICY "Super admin can manage all contact requests"
  ON contact_requests FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Public can read property images
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'properties');

-- Office can upload images to their folder
CREATE POLICY "Office can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = get_user_office_id()::text
  );

-- Office can delete their own images
CREATE POLICY "Office can delete own property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = get_user_office_id()::text
  );

-- Super admin can manage all storage
CREATE POLICY "Super admin can manage all storage"
  ON storage.objects FOR ALL
  USING (get_user_role() = 'super_admin');
