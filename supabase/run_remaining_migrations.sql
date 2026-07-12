-- ============================================
-- MIGRATION 032: Property Coordinates
-- ============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON properties(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- MIGRATION 033: Saved Searches
-- ============================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  last_checked_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches" ON saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create saved searches" ON saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved searches" ON saved_searches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved searches" ON saved_searches FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION 034: Property Commissions
-- ============================================
CREATE TABLE IF NOT EXISTS property_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES property_offers(id) ON DELETE CASCADE,
  listing_office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  referring_office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sale_amount NUMERIC(12, 2) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 2.5,
  total_commission NUMERIC(12, 2) NOT NULL,
  listing_share NUMERIC(12, 2) NOT NULL,
  referring_share NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_commissions_listing ON property_commissions(listing_office_id);
CREATE INDEX IF NOT EXISTS idx_property_commissions_referring ON property_commissions(referring_office_id);
CREATE INDEX IF NOT EXISTS idx_property_commissions_status ON property_commissions(status);
CREATE INDEX IF NOT EXISTS idx_property_commissions_created ON property_commissions(created_at DESC);

DROP TRIGGER IF EXISTS update_property_commissions_updated_at ON property_commissions;
CREATE TRIGGER update_property_commissions_updated_at
  BEFORE UPDATE ON property_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE property_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Office members can view commissions" ON property_commissions FOR SELECT
  USING (
    listing_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR referring_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admin can manage commissions" ON property_commissions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- ============================================
-- MIGRATION 035: Cities
-- ============================================
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cities (name, name_en, slug, latitude, longitude)
VALUES ('مدينة السادات', 'Sadat City', 'sadat-city', 30.3642, 31.0130)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE offices ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE zones ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id);

UPDATE offices SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;
UPDATE zones SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;
UPDATE properties SET city_id = (SELECT id FROM cities WHERE slug = 'sadat-city') WHERE city_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_offices_city ON offices(city_id);
CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city_id);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active cities" ON cities FOR SELECT USING (is_active = true);
CREATE POLICY "Super admin can manage cities" ON cities FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 036: Property Analytics
-- ============================================
CREATE TABLE IF NOT EXISTS property_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'inquiry', 'favorite', 'share')),
  visitor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_analytics_property ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_office ON property_analytics(office_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_event ON property_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_property_analytics_created ON property_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_event ON property_analytics(property_id, event_type);

ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record analytics events" ON property_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Office members can view analytics" ON property_analytics FOR SELECT
  USING (
    office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- MIGRATION 037: Inter-office Messaging
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_office_id UUID REFERENCES offices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_office_id);

DROP POLICY IF EXISTS "Office members can view messages" ON messages;
CREATE POLICY "Office members can view messages" ON messages FOR SELECT
  USING (
    office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR recipient_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
