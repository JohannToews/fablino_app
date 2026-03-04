-- RPC function: admin_story_stats
-- Returns per-story stats for the admin dashboard (latest 200 stories)

CREATE OR REPLACE FUNCTION public.admin_story_stats(
  p_limit INTEGER DEFAULT 200,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_email          TEXT,
  user_display_name   TEXT,
  child_name          TEXT,
  child_age           INTEGER,
  child_class         TEXT,
  story_id            UUID,
  story_title         TEXT,
  language            TEXT,
  story_length        TEXT,
  word_count_approx   INTEGER,
  difficulty          TEXT,
  emotional_coloring  TEXT,
  emotional_secondary TEXT,
  humor_level         INTEGER,
  structure_beginning INTEGER,
  structure_middle    INTEGER,
  structure_ending    INTEGER,
  checker_critical    INTEGER,
  checker_medium      INTEGER,
  checker_low         INTEGER,
  critical_patch_failed BOOLEAN,
  patch_fix_rate      NUMERIC,
  checker_subcategories TEXT[],
  weakest_part        TEXT,
  weakness_reason     TEXT,
  quality_rating      INTEGER,
  issues_found        INTEGER,
  issues_corrected    INTEGER,
  generation_time_ms  INTEGER,
  story_generation_ms INTEGER,
  image_generation_ms INTEGER,
  consistency_check_ms INTEGER,
  story_created_at    TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    up.email                                                    AS user_email,
    up.display_name                                             AS user_display_name,
    kp.name                                                     AS child_name,
    kp.age                                                      AS child_age,
    kp.school_class                                             AS child_class,
    s.id                                                        AS story_id,
    s.title                                                     AS story_title,
    s.text_language                                              AS language,
    s.story_length,
    array_length(string_to_array(s.content, ' '), 1)            AS word_count_approx,
    s.difficulty,
    s.emotional_coloring,
    s.emotional_secondary,
    s.humor_level,
    s.structure_beginning,
    s.structure_middle,
    s.structure_ending,
    s.checker_critical,
    s.checker_medium,
    s.checker_low,
    s.critical_patch_failed,
    s.patch_fix_rate,
    s.checker_subcategories,
    r.weakest_part,
    r.weakness_reason,
    r.quality_rating,
    r.issues_found,
    r.issues_corrected,
    s.generation_time_ms,
    s.story_generation_ms,
    s.image_generation_ms,
    s.consistency_check_ms,
    s.created_at                                                 AS story_created_at
  FROM stories s
  LEFT JOIN story_ratings  r  ON r.story_id = s.id
  LEFT JOIN kid_profiles   kp ON kp.id = s.kid_profile_id
  LEFT JOIN user_profiles  up ON up.id = kp.user_id
  WHERE s.is_deleted = false
  ORDER BY s.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.admin_story_stats IS
  'Admin dashboard: per-story stats with checker metrics, ratings, and user/child info. Paginated via p_limit/p_offset.';
