DROP FUNCTION IF EXISTS public.admin_story_stats(integer, integer);

CREATE OR REPLACE FUNCTION public.admin_story_stats(p_limit integer DEFAULT 500, p_offset integer DEFAULT 0)
 RETURNS TABLE(user_email text, user_display_name text, child_name text, child_age integer, child_class text, story_id uuid, story_title text, language text, story_length text, word_count_approx integer, difficulty text, emotional_coloring text, emotional_secondary text, humor_level integer, structure_beginning integer, structure_middle integer, structure_ending integer, checker_critical integer, checker_medium integer, checker_low integer, critical_patch_failed boolean, patch_fix_rate numeric, checker_subcategories text[], weakest_part text, weakness_reason text, quality_rating integer, issues_found integer, issues_corrected integer, generation_time_ms integer, story_generation_ms integer, image_generation_ms integer, consistency_check_ms integer, consistency_check_only_ms integer, patch_ms integer, recheck_ms integer, story_created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    up.email::text AS user_email,
    up.display_name::text AS user_display_name,
    kp.name::text AS child_name,
    kp.age AS child_age,
    kp.school_class::text AS child_class,
    s.id AS story_id,
    s.title::text AS story_title,
    s.text_language::text AS language,
    s.story_length::text AS story_length,
    array_length(string_to_array(trim(s.content), ' '), 1) AS word_count_approx,
    s.difficulty::text AS difficulty,
    s.emotional_coloring::text AS emotional_coloring,
    s.emotional_secondary::text AS emotional_secondary,
    s.humor_level AS humor_level,
    s.structure_beginning AS structure_beginning,
    s.structure_middle AS structure_middle,
    s.structure_ending AS structure_ending,
    COALESCE(s.checker_critical, 0) AS checker_critical,
    COALESCE(s.checker_medium, 0) AS checker_medium,
    COALESCE(s.checker_low, 0) AS checker_low,
    COALESCE(s.critical_patch_failed, false) AS critical_patch_failed,
    s.patch_fix_rate AS patch_fix_rate,
    COALESCE(s.checker_subcategories, '{}') AS checker_subcategories,
    sr.weakest_part::text AS weakest_part,
    sr.weakness_reason::text AS weakness_reason,
    sr.quality_rating AS quality_rating,
    ccr.issues_found AS issues_found,
    ccr.issues_corrected AS issues_corrected,
    s.generation_time_ms AS generation_time_ms,
    s.story_generation_ms AS story_generation_ms,
    s.image_generation_ms AS image_generation_ms,
    s.consistency_check_ms AS consistency_check_ms,
    s.consistency_check_only_ms AS consistency_check_only_ms,
    s.patch_ms AS patch_ms,
    s.recheck_ms AS recheck_ms,
    s.created_at AS story_created_at
  FROM stories s
  LEFT JOIN user_profiles up ON up.id = s.user_id
  LEFT JOIN kid_profiles kp ON kp.id = s.kid_profile_id
  LEFT JOIN LATERAL (
    SELECT sr2.quality_rating, sr2.weakest_part, sr2.weakness_reason
    FROM story_ratings sr2
    WHERE sr2.story_id = s.id
    ORDER BY sr2.created_at DESC
    LIMIT 1
  ) sr ON true
  LEFT JOIN LATERAL (
    SELECT ccr2.issues_found, ccr2.issues_corrected
    FROM consistency_check_results ccr2
    WHERE ccr2.story_id = s.id
    ORDER BY ccr2.created_at DESC
    LIMIT 1
  ) ccr ON true
  WHERE s.is_deleted = false
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;