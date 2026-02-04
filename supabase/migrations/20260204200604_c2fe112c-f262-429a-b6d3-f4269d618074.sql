-- Add options column for multiple choice answers
ALTER TABLE public.comprehension_questions 
ADD COLUMN options text[] DEFAULT '{}'::text[];