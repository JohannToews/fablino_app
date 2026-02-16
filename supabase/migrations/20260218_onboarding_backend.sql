-- ============================================================
-- Migration: Onboarding Backend
-- Adds temp_token + claimed_at to stories for anonymous onboarding stories.
-- Creates onboarding_rate_limits table for IP-based rate limiting.
-- ============================================================

-- 1. Add temp_token to stories (UUID for claiming after registration)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS temp_token UUID DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index for efficient claiming (only rows with temp_token)
CREATE INDEX IF NOT EXISTS idx_stories_temp_token 
  ON public.stories(temp_token) 
  WHERE temp_token IS NOT NULL;

-- 2. Rate limiting table for anonymous onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  first_request_at TIMESTAMPTZ DEFAULT NOW(),
  last_request_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only service_role can access (Edge Functions use service_role key)
ALTER TABLE public.onboarding_rate_limits ENABLE ROW LEVEL SECURITY;
-- No public policies → only service_role can read/write

-- 3. user_id and kid_profile_id are already nullable (verified from schema).
--    No ALTER TABLE ... DROP NOT NULL needed.

-- 4. Cleanup function: Delete unclaimed onboarding stories older than 24h
CREATE OR REPLACE FUNCTION cleanup_unclaimed_onboarding_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.stories
  WHERE temp_token IS NOT NULL
    AND claimed_at IS NULL
    AND created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
