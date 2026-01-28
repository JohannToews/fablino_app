-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'standard');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only readable via edge functions with service role)
CREATE POLICY "No public read access to user_roles" 
ON public.user_roles FOR SELECT USING (false);

CREATE POLICY "No public insert access to user_roles" 
ON public.user_roles FOR INSERT WITH CHECK (false);

CREATE POLICY "No public update access to user_roles" 
ON public.user_roles FOR UPDATE USING (false);

CREATE POLICY "No public delete access to user_roles" 
ON public.user_roles FOR DELETE USING (false);