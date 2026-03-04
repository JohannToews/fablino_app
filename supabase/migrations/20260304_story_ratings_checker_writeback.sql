-- 1. Add issues_found / issues_corrected columns to story_ratings.
ALTER TABLE public.story_ratings
  ADD COLUMN IF NOT EXISTS issues_found INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS issues_corrected INTEGER DEFAULT NULL;

-- 2. Drop the old CHECK constraint on weakest_part so we can store
--    'beginning', 'middle', 'ending' (original only allowed 'development').
ALTER TABLE public.story_ratings
  DROP CONSTRAINT IF EXISTS story_ratings_weakest_part_check;

-- 3. Backfill story_ratings from consistency_check_results.
--    Join on story_id first (if present), fall back to story_title + user_id.
--    Use DISTINCT ON to pick the latest consistency result per story.
UPDATE public.story_ratings AS r
SET
  issues_found     = sub.issues_found,
  issues_corrected = sub.issues_corrected
FROM (
  SELECT DISTINCT ON (c.story_id)
    c.story_id,
    c.issues_found,
    c.issues_corrected
  FROM public.consistency_check_results c
  WHERE c.story_id IS NOT NULL
  ORDER BY c.story_id, c.created_at DESC
) sub
WHERE r.issues_found IS NULL
  AND r.story_id = sub.story_id;

-- Fallback: match on story_title + user_id for rows without story_id in checker
UPDATE public.story_ratings AS r
SET
  issues_found     = sub.issues_found,
  issues_corrected = sub.issues_corrected
FROM (
  SELECT DISTINCT ON (c.story_title, c.user_id)
    c.story_title,
    c.user_id,
    c.issues_found,
    c.issues_corrected
  FROM public.consistency_check_results c
  WHERE c.story_id IS NULL
  ORDER BY c.story_title, c.user_id, c.created_at DESC
) sub
WHERE r.issues_found IS NULL
  AND r.story_title = sub.story_title
  AND (r.user_id = sub.user_id OR (r.user_id IS NULL AND sub.user_id IS NULL));
