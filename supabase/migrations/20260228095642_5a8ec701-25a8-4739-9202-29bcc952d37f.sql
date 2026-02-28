
-- Create custom_learning_themes table
CREATE TABLE public.custom_learning_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'social',
  story_guidance TEXT,
  original_input TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_learning_themes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own custom themes
CREATE POLICY "user_own_custom_themes_select" ON public.custom_learning_themes
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_custom_themes_insert" ON public.custom_learning_themes
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_custom_themes_update" ON public.custom_learning_themes
  FOR UPDATE USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_custom_themes_delete" ON public.custom_learning_themes
  FOR DELETE USING (user_id = get_user_profile_id());
