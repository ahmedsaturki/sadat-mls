-- ============================================
-- Migration 014: Additional Performance Indexes
-- Offices and properties indexes (consolidated)
-- ============================================

-- Offices: slug-based lookups (public office profile pages)
CREATE INDEX IF NOT EXISTS idx_offices_slug ON offices(slug);

-- Offices: active office filtering
CREATE INDEX IF NOT EXISTS idx_offices_is_active ON offices(is_active);

-- Properties: agent property listing (created_by)
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);

-- Properties: agent listing with status filter
CREATE INDEX IF NOT EXISTS idx_properties_created_by_status ON properties(created_by, status);

-- Property images: primary image lookups (partial index for fast primary image queries)
CREATE INDEX IF NOT EXISTS idx_property_images_primary ON property_images(property_id) WHERE is_primary = true;

-- Contact requests: for admin dashboard with large datasets
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at_desc ON contact_requests(created_at DESC);

-- Contact requests: contact_type filtering for quick filters
CREATE INDEX IF NOT EXISTS idx_contact_requests_contact_type ON contact_requests(contact_type);

-- Rate limit log: for cleanup function performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_created_at ON rate_limit_log(created_at);

-- Property favorites: user-based lookups for dashboard
CREATE INDEX IF NOT EXISTS idx_property_favorites_user_id ON property_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_favorites_user_property ON property_favorites(user_id, property_id);
