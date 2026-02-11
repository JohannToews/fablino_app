
-- Add favorite flag to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
