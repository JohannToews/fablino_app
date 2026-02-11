CREATE INDEX idx_stories_user_deleted_profile_created 
ON public.stories (user_id, is_deleted, kid_profile_id, created_at DESC);