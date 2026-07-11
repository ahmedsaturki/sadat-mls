-- Developers and Projects tables for Aqar Cloud
-- Links real estate developers/projects to the platform

-- ============================================
-- 1. DEVELOPERS
-- ============================================
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

-- ============================================
-- 2. PROJECTS
-- ============================================
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

-- ============================================
-- 3. PROPERTY ↔ PROJECT LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS property_projects (
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, project_id)
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);
CREATE INDEX IF NOT EXISTS idx_developers_active ON developers(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_zone_id ON projects(zone_id);
CREATE INDEX IF NOT EXISTS idx_projects_status_active ON projects(status, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_property_projects_project ON property_projects(project_id);

-- ============================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS
-- ============================================
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_projects ENABLE ROW LEVEL SECURITY;

-- Developers: public read active, super_admin full access
CREATE POLICY "Public can view active developers"
  ON developers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin can manage developers"
  ON developers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Projects: public read active, super_admin full access
CREATE POLICY "Public can view active projects"
  ON projects FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin can manage projects"
  ON projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Property projects: public read, super_admin manage
CREATE POLICY "Public can view property project links"
  ON property_projects FOR SELECT
  USING (true);

CREATE POLICY "Super admin can manage property project links"
  ON property_projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
