-- Create kid_profiles table for storing child profile data
CREATE TABLE public.kid_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  hobbies text NOT NULL DEFAULT '',
  color_palette text NOT NULL DEFAULT 'sunshine',
  cover_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read kid_profiles" 
ON public.kid_profiles FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert kid_profiles" 
ON public.kid_profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update kid_profiles" 
ON public.kid_profiles FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_kid_profiles_updated_at
BEFORE UPDATE ON public.kid_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_kid_profiles_user_id ON public.kid_profiles(user_id);