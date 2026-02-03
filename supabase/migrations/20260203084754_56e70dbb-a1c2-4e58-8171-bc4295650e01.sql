-- Add prompt field to stories table to store the user's generation prompt
ALTER TABLE public.stories ADD COLUMN prompt TEXT;

-- Add is_deleted field for soft delete tracking
ALTER TABLE public.stories ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster queries
CREATE INDEX idx_stories_is_deleted ON public.stories(is_deleted);