-- Add image_style column for profile cover generation
ALTER TABLE public.kid_profiles 
ADD COLUMN IF NOT EXISTS image_style TEXT DEFAULT 'modern cartoon';

-- Add comment for clarity
COMMENT ON COLUMN public.kid_profiles.image_style IS 'Style description for AI-generated profile cover images (e.g., comic, watercolor, minimalist)';