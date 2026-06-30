-- ============================================
-- Migration 006: Fix contact_requests for general inquiries
-- Makes property_id nullable to support landing page contact form
-- ============================================

-- Make property_id nullable for general inquiries (landing page contact)
ALTER TABLE contact_requests 
ALTER COLUMN property_id DROP NOT NULL;

-- Add updated_at column if not exists
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create trigger for updated_at (on insert, sets default; on update, updates timestamp)
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop old foreign key constraint (if exists) and add nullable version
ALTER TABLE contact_requests
DROP CONSTRAINT IF EXISTS contact_requests_property_id_fkey;

ALTER TABLE contact_requests
ADD CONSTRAINT contact_requests_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Add index for faster lookups on general inquiries
CREATE INDEX IF NOT EXISTS idx_contact_requests_null_property 
  ON contact_requests(id) 
  WHERE property_id IS NULL;

-- Add index for property_id lookups
CREATE INDEX IF NOT EXISTS idx_contact_requests_property_id ON contact_requests(property_id);