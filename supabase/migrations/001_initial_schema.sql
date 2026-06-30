-- ============================================
-- Sadat MLS Cloud - Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. OFFICES
-- ============================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 2. USERS (extends Supabase auth.users)
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
-- 3. ZONES (pre-defined Sadat City areas)
-- ============================================
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed zones
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed property types
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- 6. PROPERTY OWNERS (sensitive data)
-- ============================================
CREATE TABLE IF NOT EXISTS property_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_office_id ON users(office_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_properties_office_id ON properties(office_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_zone_id ON properties(zone_id);
CREATE INDEX IF NOT EXISTS idx_properties_type_id ON properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_office_id ON property_owners(office_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_property_id ON contact_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_office_id ON contact_requests(office_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- AUTO-CREATE USER ON SIGNUP
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
