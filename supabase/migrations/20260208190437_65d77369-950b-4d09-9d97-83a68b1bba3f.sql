-- Fix remaining security issues

-- 1. Fix update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Fix point_settings: Only admins can modify
DROP POLICY IF EXISTS "Anyone can update point_settings" ON point_settings;
DROP POLICY IF EXISTS "Anyone can insert point_settings" ON point_settings;

CREATE POLICY "admin_update_point_settings" ON point_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_point_settings" ON point_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Fix level_settings: Only admins can modify
DROP POLICY IF EXISTS "Anyone can update level_settings" ON level_settings;
DROP POLICY IF EXISTS "Anyone can insert level_settings" ON level_settings;

CREATE POLICY "admin_update_level_settings" ON level_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_level_settings" ON level_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Fix image_cache: Require authentication for modifications
DROP POLICY IF EXISTS "image_cache_authenticated_insert" ON image_cache;
DROP POLICY IF EXISTS "image_cache_authenticated_update" ON image_cache;

CREATE POLICY "authenticated_insert_image_cache" ON image_cache
  FOR INSERT WITH CHECK (get_user_profile_id() IS NOT NULL);

CREATE POLICY "authenticated_update_image_cache" ON image_cache
  FOR UPDATE USING (get_user_profile_id() IS NOT NULL);