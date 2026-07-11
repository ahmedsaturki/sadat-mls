-- Property analytics tracking (views, inquiries)
CREATE TABLE IF NOT EXISTS property_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'inquiry', 'favorite', 'share')),
  visitor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_property_analytics_property ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_office ON property_analytics(office_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_event ON property_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_property_analytics_created ON property_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_event ON property_analytics(property_id, event_type);

-- RLS
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can record events (view/inquiry/favorite/share)
CREATE POLICY "Anyone can record analytics events"
  ON property_analytics FOR INSERT
  WITH CHECK (true);

-- Office members can view their office's analytics
CREATE POLICY "Office members can view analytics"
  ON property_analytics FOR SELECT
  USING (
    office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
