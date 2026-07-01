-- ============================================
-- Migration 014: Additional Performance Indexes
-- Missing indexes identified by audit
-- ============================================

-- Offices: slug-based lookups (public office profile pages)
CREATE INDEX IF NOT EXISTS idx_offices_slug ON offices(slug);

-- Offices: active office filtering
CREATE INDEX IF NOT EXISTS idx_offices_is_active ON offices(is_active);

-- Properties: agent property listing (created_by)
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);

-- Properties: agent listing with status filter
CREATE INDEX IF NOT EXISTS idx_properties_created_by_status ON properties(created_by, status);

-- Property images: primary image lookups
CREATE INDEX IF NOT EXISTS idx_property_images_primary ON property_images(property_id) WHERE is_primary = true;

-- Contact requests: status filtering
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
