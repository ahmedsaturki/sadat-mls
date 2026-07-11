-- Add status column to offices for self-registration flow
ALTER TABLE offices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

-- Set existing offices to 'active'
UPDATE offices SET status = 'active' WHERE status IS NULL;

-- Add index for pending offices lookup
CREATE INDEX IF NOT EXISTS idx_offices_status ON offices(status);
