
-- Fix RLS policies to match frontend which uses auth.uid() for user_id
DROP POLICY "user_own_custom_themes_select" ON public.custom_learning_themes;
DROP POLICY "user_own_custom_themes_insert" ON public.custom_learning_themes;
DROP POLICY "user_own_custom_themes_update" ON public.custom_learning_themes;
DROP POLICY "user_own_custom_themes_delete" ON public.custom_learning_themes;

-- Use kid_profile ownership check instead (consistent with parent_learning_config)
CREATE POLICY "user_own_custom_themes_select" ON public.custom_learning_themes
  FOR SELECT USING (kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id()));

CREATE POLICY "user_own_custom_themes_insert" ON public.custom_learning_themes
  FOR INSERT WITH CHECK (kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id()));

CREATE POLICY "user_own_custom_themes_update" ON public.custom_learning_themes
  FOR UPDATE USING (kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id()));

CREATE POLICY "user_own_custom_themes_delete" ON public.custom_learning_themes
  FOR DELETE USING (kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id()));
