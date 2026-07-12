-- Referral system for office-to-office referrals

-- 1. Add referral_code to offices
ALTER TABLE offices ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_offices_referral_code ON offices(referral_code) WHERE referral_code IS NOT NULL;

-- 2. Add referring_office_id to property_offers
ALTER TABLE property_offers ADD COLUMN IF NOT EXISTS referring_office_id UUID REFERENCES offices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_property_offers_referring ON property_offers(referring_office_id);

-- 3. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  referred_office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES property_offers(id) ON DELETE SET NULL,
  commission_id UUID REFERENCES property_commissions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'offer_submitted', 'deal_closed', 'expired', 'cancelled')),
  notes TEXT,
  referral_code_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referring ON referrals(referring_office_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_office_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Office members can view referrals where they are referring or referred
CREATE POLICY "Office members can view referrals"
  ON referrals FOR SELECT
  USING (
    referring_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR referred_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Office members can create referrals (as referring office)
CREATE POLICY "Office members can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (
    referring_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Office members can update referrals where they are involved
CREATE POLICY "Office members can update referrals"
  ON referrals FOR UPDATE
  USING (
    referring_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR referred_office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can delete referrals
CREATE POLICY "Super admin can delete referrals"
  ON referrals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 5. Generate referral codes for existing offices
UPDATE offices SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE referral_code IS NULL;
