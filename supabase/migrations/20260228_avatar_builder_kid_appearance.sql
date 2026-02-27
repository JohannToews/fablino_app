-- Avatar Builder feature flag (Mein Look)
-- key: avatar_builder_enabled_users
-- value: JSON array of user IDs. [] = nobody. ["*"] = all. ["uuid"] = specific user.

INSERT INTO public.app_settings (key, value)
VALUES ('avatar_builder_enabled_users', '[]')
ON CONFLICT (key) DO NOTHING;

-- kid_appearance: one row per kid_profile, used for image generation character_anchor
CREATE TABLE IF NOT EXISTS public.kid_appearance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  skin_tone text NOT NULL DEFAULT 'medium',
  hair_length text NOT NULL DEFAULT 'medium',
  hair_type text NOT NULL DEFAULT 'straight',
  hair_style text NOT NULL DEFAULT 'loose',
  hair_color text NOT NULL DEFAULT 'brown',
  glasses boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(kid_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_kid_appearance_kid_profile_id ON public.kid_appearance(kid_profile_id);

ALTER TABLE public.kid_appearance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_kid_appearance_select" ON public.kid_appearance;
CREATE POLICY "user_own_kid_appearance_select" ON public.kid_appearance
  FOR SELECT USING (
    kid_profile_id IN (SELECT id FROM public.kid_profiles WHERE user_id = get_user_profile_id())
  );

DROP POLICY IF EXISTS "user_own_kid_appearance_insert" ON public.kid_appearance;
CREATE POLICY "user_own_kid_appearance_insert" ON public.kid_appearance
  FOR INSERT WITH CHECK (
    kid_profile_id IN (SELECT id FROM public.kid_profiles WHERE user_id = get_user_profile_id())
  );

DROP POLICY IF EXISTS "user_own_kid_appearance_update" ON public.kid_appearance;
CREATE POLICY "user_own_kid_appearance_update" ON public.kid_appearance
  FOR UPDATE USING (
    kid_profile_id IN (SELECT id FROM public.kid_profiles WHERE user_id = get_user_profile_id())
  );

DROP TRIGGER IF EXISTS set_kid_appearance_updated_at ON public.kid_appearance;
CREATE TRIGGER set_kid_appearance_updated_at
  BEFORE UPDATE ON public.kid_appearance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
