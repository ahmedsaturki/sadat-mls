-- ============================================
-- Sadat MLS Cloud - Performance Indexes & Triggers
-- Run this AFTER 004_rate_limit_log.sql
-- ============================================

-- ============================================
-- COMPOSITE INDEXES for common query patterns
-- ============================================

-- Properties filtered by office + status (dashboard property listing)
CREATE INDEX IF NOT EXISTS idx_properties_office_status ON properties(office_id, status);

-- Properties filtered by office + created_at (dashboard, sorted by newest)
CREATE INDEX IF NOT EXISTS idx_properties_office_created ON properties(office_id, created_at DESC);

-- Properties for explore page: status + zone + type + price range
CREATE INDEX IF NOT EXISTS idx_properties_explore ON properties(status, zone_id, property_type_id, price);

-- Properties filtered by status + created_at (explore page listing)
CREATE INDEX IF NOT EXISTS idx_properties_status_created ON properties(status, created_at DESC);

-- Contact requests by office + created_at (admin contact requests page)
CREATE INDEX IF NOT EXISTS idx_contact_requests_office_created ON contact_requests(office_id, created_at DESC);

-- Property images by property + sort_order
CREATE INDEX IF NOT EXISTS idx_property_images_property_sort ON property_images(property_id, sort_order);

-- Users by office + role (admin office user listing)
CREATE INDEX IF NOT EXISTS idx_users_office_role ON users(office_id, role);

-- Updated_at triggers for tables missing them
-- Zones (if updated manually via admin)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS update_zones_updated_at ON zones;
CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Property types (if updated manually via admin)
ALTER TABLE property_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS update_property_types_updated_at ON property_types;
CREATE TRIGGER update_property_types_updated_at
  BEFORE UPDATE ON property_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contact requests (for tracking updates)
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STATISTICS for better query planning
-- ============================================

-- ANALYZE tables to update planner statistics
ANALYZE properties;
ANALYZE users;
ANALYZE property_images;
ANALYZE contact_requests;
ANALYZE property_owners;
ANALYZE offices;
