-- Add latitude/longitude to properties for map view
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

-- Partial index for properties with coordinates
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
