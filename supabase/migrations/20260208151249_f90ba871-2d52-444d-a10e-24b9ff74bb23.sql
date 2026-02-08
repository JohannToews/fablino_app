
-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN email TEXT,
ADD COLUMN auth_migrated BOOLEAN DEFAULT false;

-- Add auth_id to user_roles for Supabase Auth integration
ALTER TABLE public.user_roles 
ADD COLUMN auth_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_user_roles_auth_id ON public.user_roles(auth_id);
