
CREATE OR REPLACE FUNCTION public.log_activity(
  p_activity_type TEXT,
  p_child_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_stars INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings JSONB;
  v_stars_earned INTEGER := 0;
  v_bonus_stars INTEGER := 0;
  v_weekly_bonus TEXT := NULL;
  v_progress RECORD;
  v_new_badges JSONB;
  v_score_percent INTEGER;
  v_story_language TEXT;
  v_reference_id UUID;
BEGIN
  -- 1. Load point_settings from DB (new schema: setting_key / value)
  SELECT jsonb_object_agg(setting_key, value) INTO v_settings
  FROM point_settings;

  -- 2. Calculate stars based on activity_type
  IF p_activity_type = 'story_completed' THEN
    v_stars_earned := COALESCE((v_settings->>'stars_story_read')::integer, 1);
  ELSIF p_activity_type IN ('quiz_complete', 'quiz_completed') THEN
    v_score_percent := COALESCE((p_metadata->>'score_percent')::integer, 0);
    IF v_score_percent = 100 THEN
      v_stars_earned := COALESCE((v_settings->>'stars_quiz_perfect')::integer, 2);
    ELSIF v_score_percent >= COALESCE((v_settings->>'quiz_pass_threshold')::integer, 80) THEN
      v_stars_earned := COALESCE((v_settings->>'stars_quiz_passed')::integer, 1);
    ELSE
      v_stars_earned := COALESCE((v_settings->>'stars_quiz_failed')::integer, 0);
    END IF;
  END IF;

  -- Extract reference_id from metadata (story_id or quiz_id)
  v_reference_id := COALESCE(
    (p_metadata->>'story_id')::uuid,
    (p_metadata->>'quiz_id')::uuid
  );

  -- 3. Load current user_progress (or create if missing)
  SELECT * INTO v_progress FROM user_progress WHERE kid_profile_id = p_child_id;

  IF NOT FOUND THEN
    INSERT INTO user_progress (kid_profile_id, user_id, total_stars, current_streak, longest_streak, last_read_date, current_level)
    VALUES (p_child_id, 
      (SELECT user_id FROM kid_profiles WHERE id = p_child_id),
      0, 0, 0, NULL, 1);
    SELECT * INTO v_progress FROM user_progress WHERE kid_profile_id = p_child_id;
  END IF;

  -- 4. Weekly reset check (Monday = new week)
  IF v_progress.weekly_reset_date IS NULL 
     OR date_trunc('week', CURRENT_DATE) > date_trunc('week', v_progress.weekly_reset_date) THEN
    UPDATE user_progress SET 
      weekly_stories_count = 0,
      weekly_bonus_claimed = NULL,
      weekly_reset_date = CURRENT_DATE
    WHERE kid_profile_id = p_child_id;
    SELECT * INTO v_progress FROM user_progress WHERE kid_profile_id = p_child_id;
  END IF;

  -- 5. Update counters based on activity
  IF p_activity_type = 'story_completed' THEN
    UPDATE user_progress SET
      total_stories_read = COALESCE(total_stories_read, 0) + 1,
      stories_completed = COALESCE(stories_completed, 0) + 1,
      weekly_stories_count = COALESCE(weekly_stories_count, 0) + 1
    WHERE kid_profile_id = p_child_id;

    -- Track language
    v_story_language := p_metadata->>'language';
    IF v_story_language IS NOT NULL THEN
      UPDATE user_progress SET
        languages_read = CASE 
          WHEN NOT (COALESCE(languages_read, '{}') @> ARRAY[v_story_language])
          THEN array_append(COALESCE(languages_read, '{}'), v_story_language)
          ELSE languages_read
        END
      WHERE kid_profile_id = p_child_id;
    END IF;
  END IF;

  IF p_activity_type IN ('quiz_complete', 'quiz_completed') THEN
    v_score_percent := COALESCE((p_metadata->>'score_percent')::integer, 0);
    IF v_score_percent = 100 THEN
      UPDATE user_progress SET
        consecutive_perfect_quizzes = COALESCE(consecutive_perfect_quizzes, 0) + 1,
        total_perfect_quizzes = COALESCE(total_perfect_quizzes, 0) + 1
      WHERE kid_profile_id = p_child_id;
    ELSE
      UPDATE user_progress SET
        consecutive_perfect_quizzes = 0
      WHERE kid_profile_id = p_child_id;
    END IF;
  END IF;

  -- 6. Streak update (using last_read_date)
  IF v_progress.last_read_date IS NULL 
     OR v_progress.last_read_date < CURRENT_DATE THEN
    IF v_progress.last_read_date = CURRENT_DATE - INTERVAL '1 day' THEN
      UPDATE user_progress SET
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_read_date = CURRENT_DATE
      WHERE kid_profile_id = p_child_id;
    ELSIF v_progress.last_read_date IS NULL 
       OR v_progress.last_read_date < CURRENT_DATE - INTERVAL '1 day' THEN
      UPDATE user_progress SET
        current_streak = 1,
        last_read_date = CURRENT_DATE
      WHERE kid_profile_id = p_child_id;
    END IF;
  END IF;

  -- 7. Weekly bonus check
  SELECT * INTO v_progress FROM user_progress WHERE kid_profile_id = p_child_id;
  
  IF v_progress.weekly_stories_count >= 7 
     AND (v_progress.weekly_bonus_claimed IS NULL OR v_progress.weekly_bonus_claimed != '7') THEN
    IF v_progress.weekly_bonus_claimed = '5' THEN
      v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_7')::integer, 8) 
                     - COALESCE((v_settings->>'weekly_bonus_5')::integer, 5);
    ELSIF v_progress.weekly_bonus_claimed = '3' THEN
      v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_7')::integer, 8) 
                     - COALESCE((v_settings->>'weekly_bonus_3')::integer, 3);
    ELSE
      v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_7')::integer, 8);
    END IF;
    v_weekly_bonus := '7';
    UPDATE user_progress SET weekly_bonus_claimed = '7' WHERE kid_profile_id = p_child_id;

  ELSIF v_progress.weekly_stories_count >= 5 
     AND (v_progress.weekly_bonus_claimed IS NULL OR v_progress.weekly_bonus_claimed NOT IN ('5', '7')) THEN
    IF v_progress.weekly_bonus_claimed = '3' THEN
      v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_5')::integer, 5) 
                     - COALESCE((v_settings->>'weekly_bonus_3')::integer, 3);
    ELSE
      v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_5')::integer, 5);
    END IF;
    v_weekly_bonus := '5';
    UPDATE user_progress SET weekly_bonus_claimed = '5' WHERE kid_profile_id = p_child_id;

  ELSIF v_progress.weekly_stories_count >= 3 
     AND v_progress.weekly_bonus_claimed IS NULL THEN
    v_bonus_stars := COALESCE((v_settings->>'weekly_bonus_3')::integer, 3);
    v_weekly_bonus := '3';
    UPDATE user_progress SET weekly_bonus_claimed = '3' WHERE kid_profile_id = p_child_id;
  END IF;

  -- 8. Add stars (base + bonus)
  UPDATE user_progress SET
    total_stars = COALESCE(total_stars, 0) + v_stars_earned + v_bonus_stars
  WHERE kid_profile_id = p_child_id;

  -- 9. Write activity log WITH reference_id
  INSERT INTO user_results (kid_profile_id, user_id, activity_type, reference_id, stars_earned, points_earned, metadata)
  VALUES (
    p_child_id, 
    (SELECT user_id FROM kid_profiles WHERE id = p_child_id),
    p_activity_type,
    v_reference_id,
    v_stars_earned + v_bonus_stars, 
    0, 
    p_metadata || jsonb_build_object('bonus_stars', v_bonus_stars, 'weekly_bonus', v_weekly_bonus)
  );

  -- 10. Badge check
  v_new_badges := check_and_award_badges(p_child_id);

  -- 11. Refresh final state
  SELECT * INTO v_progress FROM user_progress WHERE kid_profile_id = p_child_id;

  -- 12. Return
  RETURN jsonb_build_object(
    'total_stars', v_progress.total_stars,
    'stars_earned', v_stars_earned,
    'bonus_stars', v_bonus_stars,
    'weekly_bonus', v_weekly_bonus,
    'current_streak', v_progress.current_streak,
    'weekly_stories_count', v_progress.weekly_stories_count,
    'new_badges', COALESCE(v_new_badges, '[]'::jsonb)
  );
END;
$$;
