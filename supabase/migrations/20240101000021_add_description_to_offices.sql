-- Add description column to offices table
-- The API routes already query/insert this column, but it was never created.

ALTER TABLE offices
  ADD COLUMN IF NOT EXISTS description TEXT;
