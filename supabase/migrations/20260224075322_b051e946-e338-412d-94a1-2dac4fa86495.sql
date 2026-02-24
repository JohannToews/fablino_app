
DROP FUNCTION IF EXISTS public.get_my_stories_list(uuid, integer, integer);

CREATE FUNCTION public.get_my_stories_list(
  p_profile_id uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  cover_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  difficulty text,
  user_id uuid,
  kid_profile_id uuid,
  text_type text,
  is_deleted boolean,
  text_language text,
  ending_type text,
  series_id uuid,
  episode_number integer,
  generation_status text,
  cover_image_status text,
  story_images_status text,
  emotional_coloring text,
  completed boolean,
  image_count integer,
  has_comic_grid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    CASE WHEN s.cover_image_url LIKE 'data:%' THEN NULL ELSE s.cover_image_url END,
    s.created_at,
    s.updated_at,
    s.difficulty,
    s.user_id,
    s.kid_profile_id,
    s.text_type,
    s.is_deleted,
    s.text_language,
    s.ending_type::TEXT,
    s.series_id,
    s.episode_number,
    s.generation_status,
    s.cover_image_status,
    s.story_images_status,
    s.emotional_coloring,
    s.completed,
    s.image_count,
    (s.comic_grid_plan IS NOT NULL) AS has_comic_grid
  FROM stories s
  WHERE s.kid_profile_id = p_profile_id
    AND (s.is_deleted IS NULL OR s.is_deleted = false)
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
