-- ============================================
-- Sadat MLS Cloud - Seed Data
-- ============================================
-- RUN IN THIS ORDER:
--   1. Run STEP 1 in SQL Editor to see existing auth users
--   2. Run STEP 2 to insert offices
--   3. Run STEP 3 to insert zones
--   4. Run STEP 4 to insert property types
--   5. Update the UUIDs in STEP 5 with your real auth user IDs, then run it
--   6. Run STEP 6 to insert test properties
-- ============================================

-- ============================================
-- STEP 1: See your existing auth users
-- Run this first to get real UUIDs
-- ============================================
SELECT id, email FROM auth.users;

-- ============================================
-- STEP 2: Insert offices
-- ============================================
INSERT INTO offices (id, name, slug, phone, email, address, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'مكتب سادات العقاري', 'sadat-real-estate', '01012345678', 'sadat@test.com', 'شارع الشهداء، سادات سيتي', true),
  ('a0000000-0000-0000-0000-000000000002', 'بيت الأمان العقاري', 'bayt-aman', '01098765432', 'bayt@test.com', 'شارع الجيش، سادات سيتي', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 3: Insert zones
-- ============================================
INSERT INTO zones (name_ar, name_en) VALUES
  ('الشهداء', 'Al Shuhada'),
  ('الجيش', 'Al Jeish'),
  ('النزهة', 'Al Nuzha'),
  ('المهندسين', 'Al Mohandeseen'),
  ('الحي الأول', 'First District'),
  ('الحي الثاني', 'Second District'),
  ('الحي الثالث', 'Third District'),
  ('الحي الرابع', 'Fourth District'),
  ('الحي الخامس', 'Fifth District'),
  ('الحي السادس', 'Sixth District'),
  ('الحي السابع', 'Seventh District'),
  ('الحي الثامن', 'Eighth District'),
  ('التجمع الخامس', 'Fifth Settlement'),
  ('العبور', 'Al Obour'),
  ('الشروق', 'Al Shorouk')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 4: Insert property types
-- ============================================
INSERT INTO property_types (name_ar, name_en) VALUES
  ('شقة', 'Apartment'),
  ('فيلا', 'Villa'),
  ('دوبلكس', 'Duplex'),
  ('بنتهاوس', 'Penthouse'),
  ('محل تجاري', 'Commercial Shop'),
  ('مكتب', 'Office'),
  ('مستودع', 'Warehouse'),
  ('أرض', 'Land'),
  ('شاليه', 'Chalet'),
  ('كراج', 'Garage')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 5: Link auth users to offices
-- ⚠️  REPLACE THE UUIDs BELOW with real IDs from Step 1
--
-- How to get UUIDs:
--   Run: SELECT id, email FROM auth.users;
--
-- Then replace:
--   YOUR_SUPER_ADMIN_UUID  = the row where email = ahmedsaeedturki@gmail.com
--   YOUR_OFFICE_ADMIN_UUID = create auth user admin@test.com first, then use its UUID
--   YOUR_AGENT_UUID        = create auth user agent@test.com first, then use its UUID
-- ============================================

-- ⚠️ REPLACE THESE UUIDs WITH REAL ONES FROM auth.users
-- Example: if your super admin UUID is 'abc123-def...', replace below

-- Super Admin (already exists from your earlier setup)
UPDATE users SET office_id = NULL, role = 'super_admin', full_name = 'المسؤول العام'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ahmedsaeedturki@gmail.com' LIMIT 1);

-- Office Admin for مكتب سادات العقاري
-- First create this user in Supabase Dashboard: admin@test.com / test1234
-- Then uncomment and run:
-- INSERT INTO users (id, email, office_id, role, full_name)
-- SELECT id, email, 'a0000000-0000-0000-0000-000000000001', 'office_admin', 'مدير المكتب'
-- FROM auth.users WHERE email = 'admin@test.com'
-- ON CONFLICT (id) DO UPDATE SET
--   office_id = 'a0000000-0000-0000-0000-000000000001',
--   role = 'office_admin',
--   full_name = 'مدير المكتب';

-- Office Agent for مكتب سادات العقاري
-- First create this user in Supabase Dashboard: agent@test.com / test1234
-- Then uncomment and run:
-- INSERT INTO users (id, email, office_id, role, full_name)
-- SELECT id, email, 'a0000000-0000-0000-0000-000000000001', 'office_agent', 'مندوب المكتب'
-- FROM auth.users WHERE email = 'agent@test.com'
-- ON CONFLICT (id) DO UPDATE SET
--   office_id = 'a0000000-0000-0000-0000-000000000001',
--   role = 'office_agent',
--   full_name = 'مندوب المكتب';

-- Office Admin for بيت الأمان العقاري
-- First create this user in Supabase Dashboard: bayt-admin@test.com / test1234
-- Then uncomment and run:
-- INSERT INTO users (id, email, office_id, role, full_name)
-- SELECT id, email, 'a0000000-0000-0000-0000-000000000002', 'office_admin', 'مدير بيت الأمان'
-- FROM auth.users WHERE email = 'bayt-admin@test.com'
-- ON CONFLICT (id) DO UPDATE SET
--   office_id = 'a0000000-0000-0000-0000-000000000002',
--   role = 'office_admin',
--   full_name = 'مدير بيت الأمان';

-- ============================================
-- STEP 6: Insert test properties
-- Uses subqueries so zone/type names must exist
-- ⚠️  First uncomment the user inserts in Step 5
-- ============================================

-- Get the admin user ID for created_by
-- Uncomment after creating auth users:

/*
INSERT INTO properties (
  office_id, created_by, title, description, property_type_id,
  zone_id, street, price, area, bedrooms, bathrooms, floors,
  has_balcony, has_parking, has_elevator, status
)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  (SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1),
  'شقة فاخرة في شارع الشهداء',
  'شقة واسعة بإطلالة رائعة على الحديقة المركزية. تشطيب سوبر لوكس.',
  (SELECT id FROM property_types WHERE name_ar = 'شقة' LIMIT 1),
  (SELECT id FROM zones WHERE name_ar = 'الشهداء' LIMIT 1),
  'شارع الشهداء الرئيسي',
  1500000, 180, 3, 2, 5,
  true, true, true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE title = 'شقة فاخرة في شارع الشهداء');

INSERT INTO properties (
  office_id, created_by, title, description, property_type_id,
  zone_id, street, price, area, bedrooms, bathrooms, floors,
  has_balcony, has_parking, has_elevator, status
)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  (SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1),
  'فيلا عائلية في الحي الثالث',
  'فيلا واسعة على مساحة 350 متر مربع. حديقة خاصة، مسبح، جراج مكيف.',
  (SELECT id FROM property_types WHERE name_ar = 'فيلا' LIMIT 1),
  (SELECT id FROM zones WHERE name_ar = 'الحي الثالث' LIMIT 1),
  'شارع النخيل',
  3500000, 350, 4, 3, 2,
  true, true, false, 'available'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE title = 'فيلا عائلية في الحي الثالث');

INSERT INTO properties (
  office_id, created_by, title, description, property_type_id,
  zone_id, street, price, area, bedrooms, bathrooms, floors,
  has_balcony, has_parking, has_elevator, status
)
SELECT
  'a0000000-0000-0000-0000-000000000002',
  (SELECT id FROM auth.users WHERE email = 'bayt-admin@test.com' LIMIT 1),
  'شقة مفروشة للإيجار',
  'شقة مفروشة بالكامل بأثاث عصري. مناسبة للأفراد أو العائلات الصغيرة.',
  (SELECT id FROM property_types WHERE name_ar = 'شقة' LIMIT 1),
  (SELECT id FROM zones WHERE name_ar = 'الحي الأول' LIMIT 1),
  'شارع الحرفيين',
  6000, 120, 2, 1, 3,
  true, false, true, 'available'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE title = 'شقة مفروشة للإيجار');

INSERT INTO properties (
  office_id, created_by, title, description, property_type_id,
  zone_id, street, price, area, bedrooms, bathrooms, floors,
  has_balcony, has_parking, has_elevator, status
)
SELECT
  'a0000000-0000-0000-0000-000000000002',
  (SELECT id FROM auth.users WHERE email = 'bayt-admin@test.com' LIMIT 1),
  'محل تجاري في شارع الجيش',
  'محل تجاري على شارع رئيسي بواجهة زجاجية. مثالي لمحل ملابس أو صيدلية.',
  (SELECT id FROM property_types WHERE name_ar = 'محل تجاري' LIMIT 1),
  (SELECT id FROM zones WHERE name_ar = 'الجيش' LIMIT 1),
  'شارع الجيش',
  800000, 80, 0, 1, 0,
  false, false, true, 'sold'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE title = 'محل تجاري في شارع الجيش');
*/
