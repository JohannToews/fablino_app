CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_child_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_stars     INTEGER;
  v_longest_streak  INTEGER;
  v_stories_count   INTEGER;
  v_quizzes_count   INTEGER;
  v_badge           RECORD;
  v_new_badges      JSONB := '[]'::JSONB;
  v_current_value   INTEGER;
BEGIN
  SELECT COALESCE(up.total_stars, 0), COALESCE(up.longest_streak, 0)
    INTO v_total_stars, v_longest_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  IF NOT FOUND THEN
    v_total_stars := 0;
    v_longest_streak := 0;
  END IF;

  SELECT COUNT(*)
    INTO v_stories_count
    FROM user_results
   WHERE kid_profile_id = p_child_id
     AND activity_type = 'story_completed';

  SELECT COUNT(*)
    INTO v_quizzes_count
    FROM user_results
   WHERE kid_profile_id = p_child_id
     AND activity_type = 'quiz_passed';

  FOR v_badge IN
    SELECT b.id, b.name, b.emoji, b.condition_type, b.condition_value
      FROM badges b
     WHERE b.id NOT IN (
       SELECT ub.badge_id FROM user_badges ub WHERE ub.child_id = p_child_id
     )
     ORDER BY b.sort_order
  LOOP
    v_current_value := CASE v_badge.condition_type
      WHEN 'stories_total'  THEN v_stories_count
      WHEN 'streak_days'    THEN v_longest_streak
      WHEN 'quizzes_passed' THEN v_quizzes_count
      WHEN 'stars_total'    THEN v_total_stars
      ELSE 0
    END;

    IF v_current_value >= v_badge.condition_value THEN
      INSERT INTO user_badges (child_id, badge_id, is_new)
      VALUES (p_child_id, v_badge.id, true)
      ON CONFLICT (child_id, badge_id) DO NOTHING;

      v_new_badges := v_new_badges || jsonb_build_object(
        'name', v_badge.name,
        'emoji', v_badge.emoji
      );
    END IF;
  END LOOP;

  RETURN v_new_badges;
END;
$$;
