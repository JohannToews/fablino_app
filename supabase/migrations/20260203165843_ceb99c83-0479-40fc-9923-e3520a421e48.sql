-- Remove the check constraint that restricts weakness_reason to specific values
ALTER TABLE public.story_ratings DROP CONSTRAINT IF EXISTS story_ratings_weakness_reason_check;