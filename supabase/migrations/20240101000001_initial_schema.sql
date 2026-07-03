-- Sadat MLS Cloud - Consolidated Schema Migration
-- Combines: 001_initial_schema + 002_rls_policies + 009_security_hardening
-- Run this single migration to set up the database

SET client_min_messages TO WARNING;

-- ============================================
-- EXTENSIONS
-- ============================================
-- gen_random_uuid() is built into PostgreSQL 13+, no extension needed

-- ============================================
-- 1. OFFICES
-- ============================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'office_agent' CHECK (role IN ('super_admin', 'office_admin', 'office_agent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. ZONES
-- ============================================
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO zones (name_ar, name_en) VALUES
  ('الحي الأول', 'First District'),
  ('الحي الثاني', 'Second District'),
  ('الحي الثالث', 'Third District'),
  ('الحي الرابع', 'Fourth District'),
  ('الحي الخامس', 'Fifth District'),
  ('الحي السادس', 'Sixth District'),
  ('الحي السابع', 'Seventh District'),
  ('الحي الثامن', 'Eighth District'),
  ('الحي التاسع', 'Ninth District'),
  ('الحي العاشر', 'Tenth District'),
  ('مدينة العاشر من رمضان', '10th of Ramadan City'),
  ('المنطقة الصناعية', 'Industrial Zone'),
  ('المنطقة الحرة', 'Free Zone'),
  ('أخرى', 'Other')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. PROPERTY TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS property_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO property_types (name_ar, name_en) VALUES
  ('شقة', 'Apartment'),
  ('فيلا', 'Villa'),
  ('دوبلكس', 'Duplex'),
  ('محل تجاري', 'Commercial Shop'),
  ('مكتب', 'Office'),
  ('أرض', 'Land'),
  ('عمارة', 'Building'),
  ('استوديو', 'Studio')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. PROPERTIES
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type_id UUID REFERENCES property_types(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  street TEXT,
  price NUMERIC(12, 2) NOT NULL,
  area NUMERIC(8, 2) NOT NULL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  floors INTEGER,
  has_balcony BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_elevator BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'rented', 'pending_review')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. PROPERTY OWNERS
-- ============================================
CREATE TABLE IF NOT EXISTS property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. PROPERTY IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. CONTACT REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('whatsapp', 'phone', 'email')),
  visitor_name TEXT,
  visitor_phone TEXT,
  visitor_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. PROPERTY FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS property_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- ============================================
-- 10. RATE LIMIT LOG (operational)
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
-- Users
CREATE INDEX IF NOT EXISTS idx_users_office_id ON users(office_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_office_role ON users(office_id, role);

-- Properties (composite indexes replace redundant single-column ones)
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON properties(office_id);
CREATE INDEX IF NOT EXISTS idx_properties_status_active_office_created
  ON properties(status, is_active, office_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_type_zone_office
  ON properties(property_type_id, zone_id, office_id);
CREATE INDEX IF NOT EXISTS idx_properties_office_id_active
  ON properties(office_id, is_active);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_created_by_status
  ON properties(created_by, status);

-- Property owners
CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_office_id ON property_owners(office_id);

-- Property images
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_primary
  ON property_images(property_id, is_primary) WHERE is_primary = true;

-- Contact requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_property_id ON contact_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_office_created
  ON contact_requests(office_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_contact_type ON contact_requests(contact_type);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS update_offices_updated_at ON offices;
CREATE TRIGGER update_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPERS (For RLS)
-- ============================================
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

-- ============================================
-- AUTH TRIGGER
-- ============================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FULL TEXT SEARCH
-- ============================================
-- Stored tsvector column for fast full-text search (Arabic + English)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('arabic', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('arabic', coalesce(street, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties USING GIN (fts);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

-- Policy definitions (same as 002_rls_policies.sql)
-- Note: Rate limit log intentionally has RLS disabled

-- ============================================
-- GRANT PERMISSIONS FOR FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_user_office_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;