-- Points configuration table for admin settings
CREATE TABLE public.point_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- 'story', 'question', 'quiz'
  difficulty text NOT NULL, -- 'easy', 'medium', 'difficult'
  points integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, difficulty)
);

-- Enable RLS
ALTER TABLE public.point_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can read (for calculating results), but restrictive
CREATE POLICY "Anyone can read point_settings" 
ON public.point_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update point_settings" 
ON public.point_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert point_settings" 
ON public.point_settings 
FOR INSERT 
WITH CHECK (true);

-- Insert default point values
INSERT INTO public.point_settings (category, difficulty, points) VALUES
  ('story', 'easy', 5),
  ('story', 'medium', 10),
  ('story', 'difficult', 15),
  ('question', 'easy', 2),
  ('question', 'medium', 3),
  ('question', 'difficult', 5),
  ('quiz', 'easy', 1),
  ('quiz', 'medium', 2),
  ('quiz', 'difficult', 3);

-- User results table to track completed activities
CREATE TABLE public.user_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type text NOT NULL, -- 'story_read', 'question_answered', 'quiz_passed'
  reference_id uuid, -- story_id or question_id
  difficulty text, -- 'easy', 'medium', 'difficult'
  points_earned integer NOT NULL DEFAULT 0,
  correct_answers integer, -- for quiz: number of correct answers
  total_questions integer, -- for quiz: total questions
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_results ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can CRUD for now (single-user app)
CREATE POLICY "Anyone can read user_results" 
ON public.user_results 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create user_results" 
ON public.user_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update user_results" 
ON public.user_results 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete user_results" 
ON public.user_results 
FOR DELETE 
USING (true);

-- Add difficulty column to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';

-- Add trigger for point_settings updated_at
CREATE TRIGGER update_point_settings_updated_at
BEFORE UPDATE ON public.point_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();