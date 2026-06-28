-- Office logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('office-logos', 'office-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Office logos are publicly accessible
CREATE POLICY "Office logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'office-logos');

-- Office admins can upload logos for their own office
CREATE POLICY "Office admins can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'office-logos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role = 'office_admin'
      AND office_id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Office admins can update logos for their own office
CREATE POLICY "Office admins can update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'office-logos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role = 'office_admin'
      AND office_id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Office admins can delete logos for their own office
CREATE POLICY "Office admins can delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'office-logos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role = 'office_admin'
      AND office_id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Super admins can manage all logos
CREATE POLICY "Super admins can manage all logos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'office-logos'
    AND auth.uid() IN (
      SELECT id FROM public.users
      WHERE role = 'super_admin'
    )
  );
