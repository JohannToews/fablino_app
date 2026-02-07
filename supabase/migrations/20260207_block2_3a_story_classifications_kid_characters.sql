-- Block 2.3a: Story classifications + kid_characters table
-- 1. New columns on stories for LLM classifications
-- 2. New table kid_characters for recurring story figures
-- No UI changes, no logic changes – pure DB migration.

-- ============================================================
-- 1. New columns on stories
-- ============================================================

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS emotional_secondary text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS humor_level integer;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS emotional_depth integer;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS moral_topic text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS concrete_theme text;

-- CHECK constraints (idempotent with DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'stories_humor_level_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_humor_level_check
      CHECK (humor_level BETWEEN 1 AND 5);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'stories_emotional_depth_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_emotional_depth_check
      CHECK (emotional_depth BETWEEN 1 AND 3);
  END IF;
END $$;

-- ============================================================
-- 2. New table: kid_characters
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kid_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('sibling', 'friend', 'known_figure', 'custom')),
  age integer,
  relation text,          -- 'Bruder', 'Schwester', 'Freund', 'Lehrer', etc.
  description text,       -- 'Batman', 'Gargamel aus den Schlümpfen', etc.
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by kid_profile_id
CREATE INDEX IF NOT EXISTS idx_kid_characters_profile ON public.kid_characters(kid_profile_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_kid_characters_updated_at ON public.kid_characters;
CREATE TRIGGER update_kid_characters_updated_at
  BEFORE UPDATE ON public.kid_characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. RLS Policies for kid_characters
-- ============================================================

ALTER TABLE public.kid_characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kid_characters_select" ON public.kid_characters;
CREATE POLICY "kid_characters_select" ON public.kid_characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kid_profiles kp
      WHERE kp.id = kid_characters.kid_profile_id
    )
  );

DROP POLICY IF EXISTS "kid_characters_insert" ON public.kid_characters;
CREATE POLICY "kid_characters_insert" ON public.kid_characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kid_profiles kp
      WHERE kp.id = kid_characters.kid_profile_id
    )
  );

DROP POLICY IF EXISTS "kid_characters_update" ON public.kid_characters;
CREATE POLICY "kid_characters_update" ON public.kid_characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.kid_profiles kp
      WHERE kp.id = kid_characters.kid_profile_id
    )
  );

DROP POLICY IF EXISTS "kid_characters_delete" ON public.kid_characters;
CREATE POLICY "kid_characters_delete" ON public.kid_characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.kid_profiles kp
      WHERE kp.id = kid_characters.kid_profile_id
    )
  );
