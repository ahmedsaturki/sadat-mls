-- ============================================
-- Migration 007: Create property_favorites table
-- For tracking user-favorited properties
-- ============================================

-- Create property_favorites table
CREATE TABLE IF NOT EXISTS property_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (for idempotency)
DROP POLICY IF EXISTS "users_view_own_favorites" ON property_favorites;
DROP POLICY IF EXISTS "users_insert_favorites" ON property_favorites;
DROP POLICY IF EXISTS "users_delete_own_favorites" ON property_favorites;
DROP POLICY IF EXISTS "users_update_own_favorites" ON property_favorites;
DROP POLICY IF EXISTS "super_admin_manage_favorites" ON property_favorites;

-- Helper function for role check (needed for this migration)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users can view their own favorites
CREATE POLICY "users_view_own_favorites"
  ON property_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites (must be authenticated)
CREATE POLICY "users_insert_favorites"
  ON property_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "users_delete_own_favorites"
  ON property_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own favorites (change notes, etc.)
CREATE POLICY "users_update_own_favorites"
  ON property_favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- Super admin can manage all favorites
CREATE POLICY "super_admin_manage_favorites"
  ON property_favorites FOR ALL
  USING (get_user_role() = 'super_admin');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_favorites_user_id ON property_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_favorites_property_id ON property_favorites(property_id);

-- Trigger to prevent favoriting inactive properties
CREATE OR REPLACE FUNCTION check_property_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM properties WHERE id = NEW.property_id AND is_active = true) THEN
    RAISE EXCEPTION 'Cannot favorite inactive property';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_favorites_check_active ON property_favorites;
CREATE TRIGGER property_favorites_check_active
  BEFORE INSERT OR UPDATE ON property_favorites
  FOR EACH ROW EXECUTE FUNCTION check_property_active();