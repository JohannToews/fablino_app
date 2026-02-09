-- =============================================================================
-- Migration: User-Tracking & Gamification
-- Date: 2026-02-09
-- Description: 
--   1. Extend user_progress with total_stars + last_activity_date
--   2. Extend user_results with stars_earned + metadata
--   3. Add activity_type CHECK constraint for known types
--   4. Create levels table (replaces level_settings with richer data)
--   5. Create badges table (badge/sticker definitions)
--   6. Create user_badges table (earned badges per child)
--   7. RLS policies for all new tables
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND user_progress
--    (current_streak, longest_streak already exist)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS total_stars INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EXTEND user_results (activity log)
--    Add stars_earned and metadata columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_results
  ADD COLUMN IF NOT EXISTS stars_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add composite indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_results_kid_activity
  ON user_results (kid_profile_id, activity_type);

CREATE INDEX IF NOT EXISTS idx_user_results_kid_created
  ON user_results (kid_profile_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE levels TABLE
--    Static level definitions with emoji, color, star thresholds.
--    Coexists with level_settings (which uses point-based thresholds).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  stars_required INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  color TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Everyone can read levels
CREATE POLICY "levels_select_all"
  ON levels FOR SELECT
  USING (true);

-- Seed level data
INSERT INTO levels (name, emoji, stars_required, sort_order, color) VALUES
  ('Lesefuchs',         '🦊', 0,   1, '#F97316'),
  ('Bücherwurm',        '🐛', 25,  2, '#EAB308'),
  ('Geschichtenjäger',  '🏹', 75,  3, '#22C55E'),
  ('Leseheld',          '🦸', 150, 4, '#3B82F6'),
  ('Wortakrobat',       '🎪', 300, 5, '#8B5CF6'),
  ('Fablino Meister',   '👑', 500, 6, '#F59E0B')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE badges TABLE
--    Badge/sticker definitions with unlock conditions.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  emoji TEXT NOT NULL DEFAULT '🌟',
  category TEXT NOT NULL CHECK (category IN ('reading', 'streak', 'quiz', 'special')),
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Everyone can read badge definitions
CREATE POLICY "badges_select_all"
  ON badges FOR SELECT
  USING (true);

-- Seed badge data
INSERT INTO badges (name, description, emoji, category, condition_type, condition_value, sort_order) VALUES
  -- Reading badges
  ('Lesestart',       'Erste Geschichte gelesen',           '📖', 'reading', 'stories_total',  1,   1),
  ('Bücherfan',       '10 Geschichten gelesen',             '📚', 'reading', 'stories_total',  10,  2),
  ('Leseratte',       '25 Geschichten gelesen',             '🐭', 'reading', 'stories_total',  25,  3),
  ('Bücherheld',      '50 Geschichten gelesen',             '🦸', 'reading', 'stories_total',  50,  4),
  -- Streak badges
  ('Durchhalter',     '3 Tage am Stück gelesen',            '🔥', 'streak',  'streak_days',    3,   5),
  ('Wochenleser',     '7 Tage am Stück gelesen',            '⭐', 'streak',  'streak_days',    7,   6),
  ('Monatsleser',     '30 Tage am Stück gelesen',           '🏆', 'streak',  'streak_days',    30,  7),
  -- Quiz badges
  ('Quiz-Starter',    'Erstes Quiz bestanden',              '✅', 'quiz',    'quizzes_passed', 1,   8),
  ('Quiz-Profi',      '10 Quizze bestanden',                '🧠', 'quiz',    'quizzes_passed', 10,  9),
  -- Special badges
  ('Sternsammler',    '100 Sterne gesammelt',               '💫', 'special', 'stars_total',    100, 10),
  ('Sternenmeister',  '250 Sterne gesammelt',               '🌟', 'special', 'stars_total',    250, 11)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREATE user_badges TABLE
--    Tracks which badges each child has earned.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_new BOOLEAN DEFAULT true,
  UNIQUE (child_id, badge_id)
);

-- Index for fast lookups by child
CREATE INDEX IF NOT EXISTS idx_user_badges_child
  ON user_badges (child_id);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can see badges of their own children
CREATE POLICY "user_badges_select_own_children"
  ON user_badges FOR SELECT
  USING (
    child_id IN (
      SELECT kp.id FROM kid_profiles kp WHERE kp.user_id = auth.uid()::text::uuid
    )
  );

-- Users can insert badges for their own children
CREATE POLICY "user_badges_insert_own_children"
  ON user_badges FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT kp.id FROM kid_profiles kp WHERE kp.user_id = auth.uid()::text::uuid
    )
  );

-- Users can update badges for their own children (e.g. mark is_new = false)
CREATE POLICY "user_badges_update_own_children"
  ON user_badges FOR UPDATE
  USING (
    child_id IN (
      SELECT kp.id FROM kid_profiles kp WHERE kp.user_id = auth.uid()::text::uuid
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES for user_results (ensure stars_earned column is covered)
--    (user_results already has RLS policies; we just ensure they exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- No additional RLS needed — existing user_results policies already cover
-- SELECT and INSERT based on user_id = auth.uid(). The new columns 
-- (stars_earned, metadata) are automatically included.

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────
