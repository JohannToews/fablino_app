-- =============================================================================
-- Migration: Gamification RPC Functions
-- Date: 2026-02-09
-- Description:
--   1. check_and_award_badges(p_child_id) — badge evaluation engine
--   2. log_activity(p_child_id, p_activity_type, p_stars, p_metadata) — central activity logger
--   3. get_results_page(p_child_id) — "Meine Ergebnisse" data aggregator
--
-- Schema mapping:
--   children    → kid_profiles (id, user_id, name)
--   profiles    → user_progress (kid_profile_id, total_stars, current_streak, longest_streak, last_activity_date)
--   activities  → user_results (kid_profile_id, user_id, activity_type, stars_earned, metadata)
--   badges      → badges
--   user_badges → user_badges (child_id, badge_id)
--   levels      → levels
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. check_and_award_badges(p_child_id UUID)
--    Evaluates all badge conditions and awards any newly earned badges.
--    Returns JSONB array of newly awarded badges: [{name, emoji}]
-- ─────────────────────────────────────────────────────────────────────────────

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
  -- 1. Gather current stats from user_progress
  SELECT COALESCE(up.total_stars, 0), COALESCE(up.longest_streak, 0)
    INTO v_total_stars, v_longest_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  -- If no progress row exists, all stats are 0
  IF NOT FOUND THEN
    v_total_stars := 0;
    v_longest_streak := 0;
  END IF;

  -- 2. Count completed stories from user_results
  SELECT COUNT(*)
    INTO v_stories_count
    FROM user_results
   WHERE kid_profile_id = p_child_id
     AND activity_type = 'story_completed';

  -- 3. Count passed quizzes from user_results
  SELECT COUNT(*)
    INTO v_quizzes_count
    FROM user_results
   WHERE kid_profile_id = p_child_id
     AND activity_type = 'quiz_passed';

  -- 4. Loop through all badges the child does NOT yet have
  FOR v_badge IN
    SELECT b.id, b.name, b.emoji, b.condition_type, b.condition_value
      FROM badges b
     WHERE b.id NOT IN (
       SELECT ub.badge_id FROM user_badges ub WHERE ub.child_id = p_child_id
     )
     ORDER BY b.sort_order
  LOOP
    -- 5. Determine the current value for this badge's condition
    v_current_value := CASE v_badge.condition_type
      WHEN 'stories_total'  THEN v_stories_count
      WHEN 'streak_days'    THEN v_longest_streak
      WHEN 'quizzes_passed' THEN v_quizzes_count
      WHEN 'stars_total'    THEN v_total_stars
      ELSE 0
    END;

    -- 6. If condition met → award the badge
    IF v_current_value >= v_badge.condition_value THEN
      INSERT INTO user_badges (child_id, badge_id, is_new)
      VALUES (p_child_id, v_badge.id, true)
      ON CONFLICT (child_id, badge_id) DO NOTHING;

      -- Add to result array
      v_new_badges := v_new_badges || jsonb_build_object(
        'name', v_badge.name,
        'emoji', v_badge.emoji
      );
    END IF;
  END LOOP;

  RETURN v_new_badges;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. log_activity(p_child_id, p_activity_type, p_stars, p_metadata)
--    Central activity logger: logs event, updates stars + streak, awards badges.
--    Returns JSONB: { total_stars, current_streak, new_badges }
-- ─────────────────────────────────────────────────────────────────────────────

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
  -- 1. Get user_id from kid_profiles
  SELECT kp.user_id INTO v_user_id
    FROM kid_profiles kp
   WHERE kp.id = p_child_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Child profile not found: %', p_child_id;
  END IF;

  -- 2. Insert activity into user_results
  INSERT INTO user_results (
    kid_profile_id, user_id, activity_type, stars_earned, points_earned, metadata
  ) VALUES (
    p_child_id, v_user_id, p_activity_type, p_stars, p_stars, p_metadata
  );

  -- 3. Ensure user_progress row exists (upsert)
  INSERT INTO user_progress (kid_profile_id, user_id, total_stars, current_streak, longest_streak, last_activity_date)
  VALUES (p_child_id, v_user_id, 0, 0, 0, NULL)
  ON CONFLICT (kid_profile_id) DO NOTHING;

  -- 4. Get current progress
  SELECT up.last_activity_date, up.current_streak, up.longest_streak, up.total_stars
    INTO v_last_activity, v_current_streak, v_longest_streak, v_total_stars
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  -- 5. Calculate new streak
  IF v_last_activity IS NULL OR v_last_activity < (v_today - INTERVAL '1 day')::DATE THEN
    -- No previous activity or gap > 1 day → reset streak to 1
    v_new_streak := 1;
  ELSIF v_last_activity = (v_today - INTERVAL '1 day')::DATE THEN
    -- Last activity was yesterday → increment streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Last activity is today → keep current streak (already counted)
    v_new_streak := COALESCE(v_current_streak, 1);
  END IF;

  -- 6. Update user_progress: stars, streak, last_activity_date
  UPDATE user_progress
     SET total_stars       = COALESCE(total_stars, 0) + p_stars,
         current_streak    = v_new_streak,
         longest_streak    = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
         last_activity_date = v_today,
         updated_at        = now()
   WHERE kid_profile_id = p_child_id;

  -- Re-read updated values
  SELECT up.total_stars, up.current_streak
    INTO v_total_stars, v_current_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  -- 7. Check and award badges
  v_new_badges := check_and_award_badges(p_child_id);

  -- 8. Return result
  RETURN jsonb_build_object(
    'total_stars',    v_total_stars,
    'current_streak', v_current_streak,
    'new_badges',     v_new_badges
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. get_results_page(p_child_id UUID)
--    Aggregates all data for the "Meine Ergebnisse" page.
--    Returns JSONB with child info, levels, earned badges, next badge hints.
-- ─────────────────────────────────────────────────────────────────────────────

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
  -- 1. Get child name
  SELECT kp.name INTO v_child_name
    FROM kid_profiles kp
   WHERE kp.id = p_child_id;

  IF v_child_name IS NULL THEN
    RAISE EXCEPTION 'Child profile not found: %', p_child_id;
  END IF;

  -- 2. Get progress stats
  SELECT COALESCE(up.total_stars, 0),
         COALESCE(up.current_streak, 0),
         COALESCE(up.longest_streak, 0)
    INTO v_total_stars, v_current_streak, v_longest_streak
    FROM user_progress up
   WHERE up.kid_profile_id = p_child_id;

  -- 3. Count stories and quizzes for badge hint progress
  SELECT COUNT(*) INTO v_stories_count
    FROM user_results
   WHERE kid_profile_id = p_child_id AND activity_type = 'story_completed';

  SELECT COUNT(*) INTO v_quizzes_count
    FROM user_results
   WHERE kid_profile_id = p_child_id AND activity_type = 'quiz_passed';

  -- 4. Get all level definitions
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

  -- 5. Get earned badges
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

  -- 6. Get next 3 reachable badge hints (not yet earned)
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

  -- 7. Return aggregated result
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


-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────
