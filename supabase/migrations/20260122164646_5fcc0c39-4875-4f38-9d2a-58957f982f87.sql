-- Remove overly permissive RLS policies on app_settings
DROP POLICY IF EXISTS "Anyone can create app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can update app_settings" ON public.app_settings;

-- Create restrictive policy - no public access (only edge functions with service role can access)
CREATE POLICY "No public access to app_settings" 
ON public.app_settings 
FOR ALL 
USING (false)
WITH CHECK (false);