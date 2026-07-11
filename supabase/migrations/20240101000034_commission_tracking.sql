-- Commission tracking for closed deals
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_commissions_listing ON property_commissions(listing_office_id);
CREATE INDEX IF NOT EXISTS idx_property_commissions_referring ON property_commissions(referring_office_id);
CREATE INDEX IF NOT EXISTS idx_property_commissions_status ON property_commissions(status);
CREATE INDEX IF NOT EXISTS idx_property_commissions_created ON property_commissions(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_property_commissions_updated_at ON property_commissions;
CREATE TRIGGER update_property_commissions_updated_at
  BEFORE UPDATE ON property_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE property_commissions ENABLE ROW LEVEL SECURITY;

-- Office members can view their office's commissions (as listing or referring)
CREATE POLICY "Office members can view commissions"
  ON property_commissions FOR SELECT
  USING (
    listing_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR referring_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can manage all commissions
CREATE POLICY "Super admin can manage commissions"
  ON property_commissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
