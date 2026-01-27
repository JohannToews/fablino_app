-- Create user_profiles table for multi-user support with language settings
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  admin_language TEXT NOT NULL DEFAULT 'de',
  app_language TEXT NOT NULL DEFAULT 'fr',
  text_language TEXT NOT NULL DEFAULT 'fr',
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to read user profiles (via service role)
-- No public access for security
CREATE POLICY "No public read access to user_profiles"
ON public.user_profiles
FOR SELECT
USING (false);

CREATE POLICY "No public insert access to user_profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update access to user_profiles"
ON public.user_profiles
FOR UPDATE
USING (false);

CREATE POLICY "No public delete access to user_profiles"
ON public.user_profiles
FOR DELETE
USING (false);

-- Add updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();