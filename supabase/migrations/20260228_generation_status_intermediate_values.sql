-- B-14: Allow intermediate generation_status values for incremental metrics writes.
-- Drop existing CHECK and replace with extended list (no enum change; column stays TEXT).

ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_generation_status_check;

ALTER TABLE stories ADD CONSTRAINT stories_generation_status_check
  CHECK (generation_status IN (
    'generating',
    'checking',
    'verified',
    'error',
    'text_complete',
    'images_complete',
    'text_failed',
    'images_failed'
  ));
