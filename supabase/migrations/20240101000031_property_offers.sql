-- Property offers table for deal tracking
CREATE TABLE IF NOT EXISTS property_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  offerer_name TEXT NOT NULL,
  offerer_email TEXT,
  offerer_phone TEXT,
  offer_amount NUMERIC(12, 2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  counter_amount NUMERIC(12, 2),
  counter_message TEXT,
  agent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_offers_property_id ON property_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_office_id ON property_offers(office_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_office_status ON property_offers(office_id, status);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_property_offers_updated_at ON property_offers;
CREATE TRIGGER update_property_offers_updated_at
  BEFORE UPDATE ON property_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE property_offers ENABLE ROW LEVEL SECURITY;

-- Public can submit offers (INSERT only)
CREATE POLICY "Anyone can submit an offer"
  ON property_offers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Office members can view their office's offers
CREATE POLICY "Office members can view offers"
  ON property_offers FOR SELECT
  USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Office members can update their office's offers
CREATE POLICY "Office members can update offers"
  ON property_offers FOR UPDATE
  USING (
    office_id IN (
      SELECT office_id FROM users WHERE id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Super admin full access
CREATE POLICY "Super admin can manage offers"
  ON property_offers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
