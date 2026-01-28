-- Add text_type column to stories table to distinguish fiction from non-fiction
ALTER TABLE public.stories 
ADD COLUMN text_type TEXT DEFAULT 'fiction';

-- Add comment for clarity
COMMENT ON COLUMN public.stories.text_type IS 'Type of story: fiction or non-fiction';