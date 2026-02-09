CREATE OR REPLACE FUNCTION public.log_activity(
  p_child_id      UUID,
  p_activity_type TEXT,
  p_stars         INTEGER DEFAULT 0,
  p_metadata      JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id           UUID;
  v_last_activity     DATE;
  v_current_streak    INTEGER;
  v_longest_streak    INTEGER;
  v_total_stars       INTEGER;
  v_new_streak        INTEGER;
  v_new_badges        JSONB;
  v_today             DATE := CURRENT_DATE;
BEGIN
  SELECT kp.user_id INTO v_user_id
    FROM kid_profiles kp
   WHERE kp.id = p_child_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Child profile not found: %', p_child_id;
  END IF;

  INSERT INTO user_results (
    kid_profile_id, user_id, activity_type, stars_earned, points_earned, metadata
  ) VALUES (
    p_child_id, v_user_id, p_activity_type, p_stars, p_stars, p_metadata
  );

  INSERT INTO user_progress (kid_profile_id, user_id, total_stars, current_streak, longest_streak, last_activity_date)
  VALUES (p_child_id, v_user_id, 0, 0, 0, NULL)
  ON CONFLICT (kid_profile_id) DO NOTHING;

  SELECT up.last_activity_date, up.current_streak, up.longest_streak, up.total_stars
    INTO v_last_activity, v_current_streak, v_longest_streak, v_total_stars
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  IF v_last_activity IS NULL OR v_last_activity < (v_today - INTERVAL '1 day')::DATE THEN
    v_new_streak := 1;
  ELSIF v_last_activity = (v_today - INTERVAL '1 day')::DATE THEN
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    v_new_streak := COALESCE(v_current_streak, 1);
  END IF;

  UPDATE user_progress
     SET total_stars       = COALESCE(total_stars, 0) + p_stars,
         current_streak    = v_new_streak,
         longest_streak    = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
         last_activity_date = v_today,
         updated_at        = now()
   WHERE kid_profile_id = p_child_id;

  SELECT up.total_stars, up.current_streak
    INTO v_total_stars, v_current_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  v_new_badges := check_and_award_badges(p_child_id);

  RETURN jsonb_build_object(
    'total_stars',    v_total_stars,
    'current_streak', v_current_streak,
    'new_badges',     v_new_badges
  );
END;
$$;
