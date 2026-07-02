-- ============================================
-- Sadat MLS Cloud - Full Text Search
-- ============================================

-- Add a tsvector column for fast full-text search
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('arabic', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('arabic', coalesce(street, '')), 'C')
) STORED;

-- Create a GIN index on the new tsvector column for fast searches
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties USING GIN (fts);
