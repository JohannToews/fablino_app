-- Fix: Change story_ratings RLS policies from RESTRICTIVE to PERMISSIVE

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "user_own_ratings_insert" ON public.story_ratings;
DROP POLICY IF EXISTS "user_own_ratings_select" ON public.story_ratings;
DROP POLICY IF EXISTS "user_own_ratings_update" ON public.story_ratings;
DROP POLICY IF EXISTS "user_own_ratings_delete" ON public.story_ratings;
DROP POLICY IF EXISTS "admin_can_select_all_ratings" ON public.story_ratings;
DROP POLICY IF EXISTS "admin_can_delete_all_ratings" ON public.story_ratings;

-- Recreate as PERMISSIVE policies
CREATE POLICY "user_own_ratings_insert"
  ON public.story_ratings FOR INSERT TO authenticated
  WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_select"
  ON public.story_ratings FOR SELECT TO authenticated
  USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_update"
  ON public.story_ratings FOR UPDATE TO authenticated
  USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_delete"
  ON public.story_ratings FOR DELETE TO authenticated
  USING (user_id = get_user_profile_id());

CREATE POLICY "admin_can_select_all_ratings"
  ON public.story_ratings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_can_delete_all_ratings"
  ON public.story_ratings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));