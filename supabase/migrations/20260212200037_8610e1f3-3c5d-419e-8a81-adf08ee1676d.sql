
-- Add performance breakdown columns to stories table
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS story_generation_ms integer,
  ADD COLUMN IF NOT EXISTS image_generation_ms integer,
  ADD COLUMN IF NOT EXISTS consistency_check_ms integer;

-- Add a comment for documentation
COMMENT ON COLUMN public.stories.story_generation_ms IS 'Duration of text generation in milliseconds';
COMMENT ON COLUMN public.stories.image_generation_ms IS 'Duration of image generation in milliseconds';
COMMENT ON COLUMN public.stories.consistency_check_ms IS 'Duration of consistency check in milliseconds';
