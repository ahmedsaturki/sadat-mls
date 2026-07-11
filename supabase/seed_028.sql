-- ============================================
-- MIGRATION 028: Developers & Projects
-- ============================================

-- 1. DEVELOPERS
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'under_construction', 'delivered')),
  min_price NUMERIC(12, 2),
  max_price NUMERIC(12, 2),
  min_area NUMERIC(8, 2),
  max_area NUMERIC(8, 2),
  delivery_date DATE,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROPERTY-PROJECT LINKS
CREATE TABLE IF NOT EXISTS property_projects (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, project_id)
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);
CREATE INDEX IF NOT EXISTS idx_developers_active ON developers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_zone_id ON projects(zone_id);
CREATE INDEX IF NOT EXISTS idx_projects_status_active ON projects(status, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_property_projects_project ON property_projects(project_id);

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active developers"
  ON developers FOR SELECT USING (is_active = true);

CREATE POLICY "Super admin can manage developers"
  ON developers FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Public can view active projects"
  ON projects FOR SELECT USING (is_active = true);

CREATE POLICY "Super admin can manage projects"
  ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Public can view property project links"
  ON property_projects FOR SELECT USING (true);

CREATE POLICY "Super admin can manage property project links"
  ON property_projects FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- ============================================
-- SEED DATA: Sample Developers & Projects
-- ============================================

-- Get first zone_id for linking
DO $$
DECLARE
  dev1_id UUID;
  dev2_id UUID;
  dev3_id UUID;
  zone1_id UUID;
  prop1_id UUID;
  prop2_id UUID;
BEGIN
  -- Pick the first zone (الحي الأول / First District)
  SELECT id INTO zone1_id FROM zones ORDER BY created_at LIMIT 1;

  -- ── Developer 1: ابراج مصر (Egypt Towers) ──
  INSERT INTO developers (name, slug, description, email, phone, website)
  VALUES (
    'ابراج مصر للتطوير العقاري',
    'egypt-towers',
    'واحد من أكبر المطورين العقاريين في مصر، متخصص في بناء المجمعات السكنية الفاخرة في المدن الجديدة.',
    'info@egypt-towers.com',
    '0224651234',
    'https://egypt-towers.com'
  ) RETURNING id INTO dev1_id;

  -- ── Developer 2: مدينة العاشر للتطوير ──
  INSERT INTO developers (name, slug, description, email, phone, website)
  VALUES (
    'مدينة العاشر للتطوير العقاري',
    'tenth-city-dev',
    'مطور عقاري رائد في مدينة العاشر من رمضان والمناطق الصناعية المجاورة.',
    'info@tenthcitydev.com',
    '01012345678',
    'https://tenthcitydev.com'
  ) RETURNING id INTO dev2_id;

  -- ── Developer 3: دلتا هومز ──
  INSERT INTO developers (name, slug, description, email, phone, website)
  VALUES (
    'دلتا هومز للتطوير',
    'delta-homes',
    'شركة ناشئة متخصصة في المباني السكنية الاقتصادية والشقق المفروشة.',
    'hello@deltahomes.eg',
    '01098765432',
    'https://deltahomes.eg'
  ) RETURNING id INTO dev3_id;

  -- ── Projects for Developer 1 ──
  INSERT INTO projects (developer_id, title, slug, description, zone_id, status, min_price, max_price, min_area, max_area, delivery_date)
  VALUES
    (dev1_id, 'مجمع الاتحاد السكني', 'burj-union-residential', 'مجمع سكني فاخر يتكون من 8 عماير بارتفاع 15 طابق، يحتوي على شقق بغرف نوم 2-4 مع إطلالات على الحدائق.', zone1_id, 'under_construction', 1500000, 4500000, 110, 280, '2027-06-30'),
    (dev1_id, 'برج النخيل الجديد', 'al-nakheel-tower', 'برج سكني مميز بتصميم عصري في قلب حي النخيل، شقق استوديو وغرفتين.', zone1_id, 'upcoming', 800000, 2200000, 55, 140, '2028-12-31');

  -- ── Projects for Developer 2 ──
  INSERT INTO projects (developer_id, title, slug, description, zone_id, status, min_price, max_price, min_area, max_area, delivery_date)
  VALUES
    (dev2_id, 'مشروع سكن العمّال', 'workers-housing-project', 'مشروع سكن مخصص لعمّال المناطق الصناعية بأسعار مناسبة.', zone1_id, 'delivered', 350000, 800000, 60, 120, '2025-12-31'),
    (dev2_id, 'مجمع العاشر الصناعي', 'tenth-industrial-complex', 'مجمع مكاتب ومخازن تجارية بالقرب من المنطقة الصناعية.', zone1_id, 'under_construction', 500000, 1500000, 40, 200, '2027-03-15');

  -- ── Projects for Developer 3 ──
  INSERT INTO projects (developer_id, title, slug, description, zone_id, status, min_price, max_price, min_area, max_area, delivery_date)
  VALUES
    (dev3_id, 'دلتا هومز - المرحلة الأولى', 'delta-homes-phase-1', '120 شقة اقتصادية بتشطيبات عالية الجودة وأسعار تنافسية.', zone1_id, 'delivered', 400000, 900000, 70, 130, '2026-01-15'),
    (dev3_id, 'دلتا هومز - المرحلة الثانية', 'delta-homes-phase-2', 'مرحلة جديدة من الشقق السكنية مع مرافق ترفيهية.', zone1_id, 'upcoming', 500000, 1100000, 75, 150, '2028-06-30');

  -- ── Link some existing properties to projects ──
  SELECT id INTO prop1_id FROM properties ORDER BY created_at LIMIT 1;
  SELECT id INTO prop2_id FROM properties ORDER BY created_at OFFSET 1 LIMIT 1;

  IF prop1_id IS NOT NULL THEN
    INSERT INTO property_projects (property_id, project_id)
    VALUES (prop1_id, (SELECT id FROM projects WHERE slug = 'burj-union-residential' LIMIT 1))
    ON CONFLICT DO NOTHING;
  END IF;

  IF prop2_id IS NOT NULL THEN
    INSERT INTO property_projects (property_id, project_id)
    VALUES (prop2_id, (SELECT id FROM projects WHERE slug = 'delta-homes-phase-1' LIMIT 1))
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
