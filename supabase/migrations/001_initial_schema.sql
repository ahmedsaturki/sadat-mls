-- Sadat MLS Cloud - Initial Database Schema
-- Created for emergency efficiency deployment

-- Drop existing objects (for development)
DROP TABLE IF EXISTS property_favorites CASCADE;
DROP TABLE IF EXISTS rate_limit_log CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS property_owners CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Enable necessary extensions
-- gen_random_uuid() is built into PostgreSQL 13+, no extension needed

-- Offices table (Real estate agencies)
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends auth.users, role-based access)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'office_admin', 'office_agent')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Office-based access control
    CONSTRAINT users_office_active CHECK (
        (office_id IS NULL AND role = 'super_admin') OR
        (office_id IS NOT NULL AND role IN ('office_admin', 'office_agent'))
    )
);

-- Zones table (Sadat City districts)
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property types table (property categories)
CREATE TABLE property_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table (property listings)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    property_type_id UUID REFERENCES property_types(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    area TEXT NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    floors INTEGER DEFAULT 0,
    has_balcony BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_elevator BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'rented', 'pending_review')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Visibility constraints via RLS
    CONSTRAINT properties_office_active CHECK (
        EXISTS (
            SELECT 1 FROM offices o 
            WHERE o.id = properties.office_id AND o.is_active = TRUE
        )
    )
);

-- Property owners table (contact data, sensitive info)
CREATE TABLE property_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    owner_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Encrypted storage for phone/email in production
);

-- Property images table (property photos)
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact requests table (visitor inquiries)
CREATE TABLE contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property favorites table (user saved properties)
CREATE TABLE property_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, property_id)
);

-- Rate limit log table (audit trail for rate limiting)
CREATE TABLE rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_offices_slug ON offices(slug);
CREATE INDEX idx_offices_active ON offices(is_active);
CREATE INDEX idx_users_office_id ON users(office_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_zones_active ON zones(is_active);
CREATE INDEX idx_property_types_active ON property_types(is_active);
CREATE INDEX idx_properties_office_id ON properties(office_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_featured ON properties(is_featured);
CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_office_status ON properties(office_id, status);
CREATE INDEX idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(is_primary);
CREATE INDEX idx_contact_requests_property_id ON contact_requests(property_id);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_property_favorites_user_id ON property_favorites(user_id);
CREATE INDEX idx_property_favorites_property_id ON property_favorites(property_id);
CREATE INDEX idx_rate_limit_log_ip_address ON rate_limit_log(ip_address);
CREATE INDEX idx_rate_limit_log_endpoint ON rate_limit_log(endpoint);
CREATE INDEX idx_rate_limit_log_window_start ON rate_limit_log(window_start);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER trigger_update_offices
    BEFORE UPDATE ON offices
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_zones
    BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_property_types
    BEFORE UPDATE ON property_types
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_properties
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_property_owners
    BEFORE UPDATE ON property_owners
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_property_images
    BEFORE UPDATE ON property_images
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_contact_requests
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_property_favorites
    BEFORE UPDATE ON property_favorites
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_rate_limit_log
    BEFORE UPDATE ON rate_limit_log
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, office_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'office_agent'),
    NULLIF(NEW.raw_user_meta_data->>'office_id', '')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up trigger for new user registration
CREATE TRIGGER on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create view for property listing with office details
CREATE VIEW property_listings AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price,
  p.area,
  p.bedrooms,
  p.bathrooms,
  p.floors,
  p.has_balcony,
  p.has_parking,
  p.has_elevator,
  p.status,
  p.is_featured,
  p.created_at,
  o.id as office_id,
  o.name as office_name,
  o.slug as office_slug,
  o.logo_url as office_logo,
  pt.id as property_type_id,
  pt.name as property_type_name,
  pt.name_ar as property_type_name_ar,
  z.id as zone_id,
  z.name as zone_name,
  z.name_ar as zone_name_ar,
  COALESCE(ARRAY_AGG(pi.image_url) FILTER (WHERE pi.is_primary), '{}') as primary_images,
  COUNT(pi.id) FILTER (WHERE pi.is_primary IS NOT TRUE) as total_images
FROM properties p
JOIN offices o ON p.office_id = o.id
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN zones z ON p.zone_id = z.id
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary IS NOT TRUE
WHERE p.is_active = TRUE AND o.is_active = TRUE
GROUP BY p.id, p.title, p.description, p.price, p.area, p.bedrooms, p.bathrooms, p.floors,
         p.has_balcony, p.has_parking, p.has_elevator, p.status, p.is_featured, p.created_at,
         o.id, o.name, o.slug, o.logo_url, pt.id, pt.name, pt.name_ar, z.id, z.name, z.name_ar;

-- Create view for user favorites with property details
CREATE VIEW user_favorites AS
SELECT
  pf.id,
  pf.created_at,
  p.id as property_id,
  p.title,
  p.description,
  p.price,
  p.area,
  p.bedrooms,
  p.bathrooms,
  p.floors,
  p.has_balcony,
  p.has_parking,
  p.has_elevator,
  p.status,
  p.is_featured,
  p.created_at as property_created_at,
  o.id as office_id,
  o.name as office_name,
  o.slug as office_slug,
  o.logo_url as office_logo,
  pt.id as property_type_id,
  pt.name as property_type_name,
  pt.name_ar as property_type_name_ar,
  z.id as zone_id,
  z.name as zone_name,
  z.name_ar as zone_name_ar
FROM property_favorites pf
JOIN properties p ON pf.property_id = p.id
JOIN offices o ON p.office_id = o.id
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN zones z ON p.zone_id = z.id
WHERE p.is_active = TRUE AND o.is_active = TRUE;