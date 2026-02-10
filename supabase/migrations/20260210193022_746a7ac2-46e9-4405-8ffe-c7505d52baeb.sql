-- Create composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_stories_user_id_not_deleted 
ON public.stories (user_id) 
WHERE is_deleted = false;

-- Ensure get_user_profile_id is as fast as possible by making it IMMUTABLE within session
-- Recreate with explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
$$;