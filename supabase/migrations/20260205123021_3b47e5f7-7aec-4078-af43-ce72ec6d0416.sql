-- 1. Create user_progress table for streaks and aggregated stats
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT true,
  streak_freeze_used_this_week DATE,
  last_read_date DATE,
  stories_read_total INTEGER NOT NULL DEFAULT 0,
  quizzes_perfect INTEGER NOT NULL DEFAULT 0,
  quizzes_passed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kid_profile_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read user_progress" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_progress" ON public.user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_progress" ON public.user_progress FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create point_transactions table for detailed history
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('story_read', 'quiz_perfect', 'quiz_passed', 'vocab_bonus', 'streak_bonus_3', 'streak_bonus_7', 'streak_bonus_14', 'streak_bonus_30', 'challenge_bonus')),
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read point_transactions" ON public.point_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert point_transactions" ON public.point_transactions FOR INSERT WITH CHECK (true);

-- 3. Create streak_milestones table to track claimed milestones
CREATE TABLE public.streak_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  milestone_days INTEGER NOT NULL CHECK (milestone_days IN (3, 7, 14, 30)),
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_count INTEGER NOT NULL,
  UNIQUE(kid_profile_id, milestone_days, streak_count)
);

-- Enable RLS
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read streak_milestones" ON public.streak_milestones FOR SELECT USING (true);
CREATE POLICY "Anyone can insert streak_milestones" ON public.streak_milestones FOR INSERT WITH CHECK (true);

-- 4. Update level_settings with new German level names
DELETE FROM public.level_settings;

INSERT INTO public.level_settings (level_number, title, min_points) VALUES
  (1, 'Lesefuchs', 0),
  (2, 'Geschichtenentdecker', 150),
  (3, 'Bücherheld', 500),
  (4, 'Lesemeister', 1200),
  (5, 'Geschichtenlegende', 2500);

-- 5. Add icon column to level_settings
ALTER TABLE public.level_settings ADD COLUMN icon TEXT;

UPDATE public.level_settings SET icon = '🦊' WHERE level_number = 1;
UPDATE public.level_settings SET icon = '🧭' WHERE level_number = 2;
UPDATE public.level_settings SET icon = '🦸' WHERE level_number = 3;
UPDATE public.level_settings SET icon = '🎓' WHERE level_number = 4;
UPDATE public.level_settings SET icon = '👑' WHERE level_number = 5;

-- 6. Update point_settings with new values
DELETE FROM public.point_settings;

INSERT INTO public.point_settings (category, difficulty, points) VALUES
  ('story_read', 'all', 15),
  ('quiz_perfect', 'all', 5),
  ('quiz_passed', 'all', 3),
  ('vocab_learned', 'all', 3),
  ('streak_bonus', '3', 10),
  ('streak_bonus', '7', 25),
  ('streak_bonus', '14', 50),
  ('streak_bonus', '30', 100);

-- 7. Reset existing user_results (fresh start)
DELETE FROM public.user_results;