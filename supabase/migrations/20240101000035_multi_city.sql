-- Cities table for multi-city support
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Sadat City
INSERT INTO cities (name, name_en, slug, latitude, longitude)
VALUES ('مدينة السادات', 'Sadat City', 'sadat-city', 30.3642, 31.0130)
ON CONFLICT (slug) DO NOTHING;

-- Add city_id to existing tables
ALTER TABLE offices ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE zones ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);

-- Backfill: assign all existing data to Sadat City
UPDATE offices SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;
UPDATE zones SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;
UPDATE properties SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_offices_city ON offices(city_id);
CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city_id);

-- RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin can manage cities"
  ON cities FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
