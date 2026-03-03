-- Avatar v2: kid_appearance extension, character_appearances table, kid_characters link, feature flag
-- All in one migration. Legacy columns on kid_appearance unchanged.

-- ── TEIL 1: kid_appearance erweitern ──
ALTER TABLE public.kid_appearance
  ADD COLUMN IF NOT EXISTS appearance_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS body_type TEXT DEFAULT 'average';

COMMENT ON COLUMN public.kid_appearance.appearance_data IS 'Avatar v2: flexible JSON (e.g. skin, hair, eyes, body). Legacy columns remain for backward compatibility.';

-- ── TEIL 2: Neue Tabelle character_appearances ──
CREATE TABLE IF NOT EXISTS public.character_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  role TEXT NOT NULL,
  relation TEXT,
  age_category TEXT NOT NULL DEFAULT 'adult',
  gender TEXT,
  appearance_data JSONB NOT NULL DEFAULT '{}',
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, character_name, relation)
);

COMMENT ON TABLE public.character_appearances IS 'Avatar v2: reusable character appearances per user (e.g. family members, friends). Linked from kid_characters via character_appearance_id.';
COMMENT ON COLUMN public.character_appearances.age_category IS 'E.g. child, teen, adult. Used for default appearance presets.';
COMMENT ON COLUMN public.character_appearances.appearance_data IS 'Avatar v2: flexible JSON (skin, hair, eyes, body, clothing, etc.).';

ALTER TABLE public.character_appearances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own character appearances" ON public.character_appearances;
CREATE POLICY "Users can manage own character appearances"
  ON public.character_appearances
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access" ON public.character_appearances;
CREATE POLICY "Service role full access"
  ON public.character_appearances
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_character_appearances_updated_at ON public.character_appearances;
CREATE TRIGGER update_character_appearances_updated_at
  BEFORE UPDATE ON public.character_appearances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── TEIL 3: kid_characters verlinken ──
ALTER TABLE public.kid_characters
  ADD COLUMN IF NOT EXISTS character_appearance_id UUID
    REFERENCES public.character_appearances(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.kid_characters.character_appearance_id IS 'Avatar v2: optional link to a character_appearances row for visual description in stories.';

CREATE INDEX IF NOT EXISTS idx_kid_characters_appearance
  ON public.kid_characters(character_appearance_id)
  WHERE character_appearance_id IS NOT NULL;

-- ── TEIL 4: Feature Flag ──
INSERT INTO public.app_settings (id, key, value)
VALUES (gen_random_uuid(), 'avatar_v2_enabled_users', '[]')
ON CONFLICT (key) DO NOTHING;
