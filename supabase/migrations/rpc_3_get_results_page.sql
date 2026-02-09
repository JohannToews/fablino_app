CREATE OR REPLACE FUNCTION public.get_results_page(p_child_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_child_name     TEXT;
  v_total_stars    INTEGER := 0;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_stories_count  INTEGER := 0;
  v_quizzes_count  INTEGER := 0;
  v_levels         JSONB;
  v_earned_badges  JSONB;
  v_next_hints     JSONB;
BEGIN
  SELECT kp.name INTO v_child_name
    FROM kid_profiles kp
   WHERE kp.id = p_child_id;

  IF v_child_name IS NULL THEN
    RAISE EXCEPTION 'Child profile not found: %', p_child_id;
  END IF;

  SELECT COALESCE(up.total_stars, 0),
         COALESCE(up.current_streak, 0),
         COALESCE(up.longest_streak, 0)
    INTO v_total_stars, v_current_streak, v_longest_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  SELECT COUNT(*) INTO v_stories_count
    FROM user_results
   WHERE kid_profile_id = p_child_id AND activity_type = 'story_completed';

  SELECT COUNT(*) INTO v_quizzes_count
    FROM user_results
   WHERE kid_profile_id = p_child_id AND activity_type = 'quiz_passed';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'emoji', l.emoji,
      'stars_required', l.stars_required,
      'sort_order', l.sort_order,
      'color', l.color
    ) ORDER BY l.sort_order
  ), '[]'::JSONB)
  INTO v_levels
  FROM levels l;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'emoji', b.emoji,
      'description', b.description,
      'category', b.category,
      'earned_at', ub.earned_at,
      'is_new', ub.is_new
    ) ORDER BY ub.earned_at DESC
  ), '[]'::JSONB)
  INTO v_earned_badges
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.child_id = p_child_id;

  SELECT COALESCE(jsonb_agg(hint ORDER BY hint->>'sort_order'), '[]'::JSONB)
  INTO v_next_hints
  FROM (
    SELECT jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'emoji', b.emoji,
      'description', b.description,
      'category', b.category,
      'condition_type', b.condition_type,
      'condition_value', b.condition_value,
      'sort_order', b.sort_order,
      'current_progress', CASE b.condition_type
        WHEN 'stories_total'  THEN v_stories_count
        WHEN 'streak_days'    THEN v_longest_streak
        WHEN 'quizzes_passed' THEN v_quizzes_count
        WHEN 'stars_total'    THEN v_total_stars
        ELSE 0
      END
    ) AS hint
    FROM badges b
    WHERE b.id NOT IN (
      SELECT ub.badge_id FROM user_badges ub WHERE ub.child_id = p_child_id
    )
    ORDER BY b.sort_order
    LIMIT 3
  ) sub;

  RETURN jsonb_build_object(
    'child_name',       v_child_name,
    'total_stars',      v_total_stars,
    'current_streak',   v_current_streak,
    'longest_streak',   v_longest_streak,
    'levels',           v_levels,
    'earned_badges',    v_earned_badges,
    'next_badge_hints', v_next_hints
  );
END;
$$;
