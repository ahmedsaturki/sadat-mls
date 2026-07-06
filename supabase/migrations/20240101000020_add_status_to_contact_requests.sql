-- Add status column to contact_requests table
-- This column was referenced in code but never created via migration.
-- Default existing rows to 'pending' and set NOT NULL constraint.

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'read', 'resolved'));

-- Add updated_at column if it doesn't exist (migration 006 added it, but be safe)
ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
