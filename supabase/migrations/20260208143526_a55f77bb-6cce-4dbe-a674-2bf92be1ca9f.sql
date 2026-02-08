-- Phase 1.1: Add auth_id column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);

-- Phase 1.2: Create trigger function for auto-profile creation on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_id, username, display_name, admin_language, app_language, text_language, password_hash)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'admin_language', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'app_language', 'fr'),
    COALESCE(NEW.raw_user_meta_data->>'text_language', 'fr'),
    'supabase_auth' -- Placeholder since we still require password_hash (will be removed later)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phase 1.3: Update RLS policies to use auth.uid() for user_profiles
-- First drop existing restrictive policies
DROP POLICY IF EXISTS "No public read access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "No public insert access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "No public update access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "No public delete access to user_profiles" ON public.user_profiles;

-- Create new policies that allow authenticated users to access their own profile
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Allow the trigger function to insert (service role)
CREATE POLICY "Service can insert profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Also update user_roles RLS to work with new auth system
DROP POLICY IF EXISTS "No public read access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No public insert access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No public update access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No public delete access to user_roles" ON public.user_roles;

-- Users can read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));