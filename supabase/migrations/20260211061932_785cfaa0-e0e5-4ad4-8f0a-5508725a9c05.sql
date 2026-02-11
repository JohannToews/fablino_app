-- Composite index for the main story listing query pattern
CREATE INDEX IF NOT EXISTS idx_stories_user_kid_deleted_created 
ON public.stories(user_id, kid_profile_id, is_deleted, created_at DESC);

-- Also index for user_results completions query
CREATE INDEX IF NOT EXISTS idx_user_results_user_activity 
ON public.user_results(user_id, activity_type, reference_id, kid_profile_id);