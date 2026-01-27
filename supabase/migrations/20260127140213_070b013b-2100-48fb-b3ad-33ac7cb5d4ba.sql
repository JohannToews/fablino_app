-- Add user_id to stories table for user-specific stories
ALTER TABLE public.stories 
ADD COLUMN user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX idx_stories_user_id ON public.stories(user_id);