
-- Trigger: automatically set cover_image_status/story_images_status to 'complete'
-- when the corresponding URL/array is populated.
-- This prevents the bug where images are uploaded but status stays 'pending'.

CREATE OR REPLACE FUNCTION public.sync_image_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-set cover_image_status to 'complete' when a valid URL is present
  IF NEW.cover_image_url IS NOT NULL 
     AND NEW.cover_image_url != '' 
     AND NEW.cover_image_url NOT LIKE 'data:%' 
     AND (NEW.cover_image_status IS NULL OR NEW.cover_image_status = 'pending') THEN
    NEW.cover_image_status := 'complete';
  END IF;

  -- Auto-set story_images_status to 'complete' when images array is populated
  IF NEW.story_images IS NOT NULL 
     AND array_length(NEW.story_images, 1) > 0 
     AND (NEW.story_images_status IS NULL OR NEW.story_images_status = 'pending') THEN
    NEW.story_images_status := 'complete';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_image_status
BEFORE INSERT OR UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.sync_image_status();
