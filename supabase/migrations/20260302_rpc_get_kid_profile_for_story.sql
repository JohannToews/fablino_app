-- RPC to load kid profile by id for Edge Functions (bypasses RLS).
-- Used by generate-story for protagonist name/age/gender when include_self=true.
-- Table kid_profiles uses column "name" (not first_name); we return it as first_name for API compatibility.
CREATE OR REPLACE FUNCTION public.get_kid_profile_for_story(p_id uuid)
RETURNS TABLE (
  first_name text,
  age integer,
  gender text,
  difficulty_level integer,
  content_safety_level integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    k.name::text,
    k.age,
    k.gender,
    k.difficulty_level,
    k.content_safety_level
  FROM kid_profiles k
  WHERE k.id = p_id
    AND (k.is_deleted = false OR k.is_deleted IS NULL);
$$;

COMMENT ON FUNCTION public.get_kid_profile_for_story(uuid) IS
  'Returns one kid profile row by id. Used by generate-story Edge Function to get protagonist gender/name/age. Bypasses RLS.';
