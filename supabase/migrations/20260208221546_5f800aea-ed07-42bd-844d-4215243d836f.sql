-- Update has_role function to check via user_profiles.auth_id
-- The parameter is still called _user_id but we treat it as auth.uid()
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.user_profiles up ON ur.user_id = up.id
    WHERE up.auth_id = _user_id
      AND ur.role = _role
  )
$$;

-- Also sync auth_id in user_roles from user_profiles for existing records
UPDATE public.user_roles ur
SET auth_id = up.auth_id
FROM public.user_profiles up
WHERE ur.user_id = up.id
AND up.auth_id IS NOT NULL
AND ur.auth_id IS NULL;