-- Add age field to kid_profiles
ALTER TABLE public.kid_profiles 
ADD COLUMN age integer NOT NULL DEFAULT 8;