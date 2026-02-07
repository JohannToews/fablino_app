-- Block 2.2b: Schema adjustments before seed data
-- 1. New table: difficulty_rules
-- 2. New field: kid_profiles.difficulty_level
-- 3. Adjust age_rules age groups (remove 4-5, split 10-12 into 10-11 + 12-13)
-- 4. Remove vocabulary_level and complexity_level from age_rules

-- ============================================================
-- 1. New table: difficulty_rules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.difficulty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty_level integer NOT NULL,        -- 1, 2, 3
  language text NOT NULL,
  label jsonb NOT NULL,                     -- {"de": "Leicht", "fr": "Facile", "en": "Easy"}
  description jsonb NOT NULL,               -- {"de": "Einfacher Wortschatz...", ...}
  vocabulary_scope text NOT NULL,           -- prose: what kind of vocabulary
  new_words_per_story integer NOT NULL,     -- how many new/challenging words per story
  figurative_language text NOT NULL,        -- prose: use of metaphors, similes, etc.
  idiom_usage text NOT NULL,               -- prose: use of idiomatic expressions
  humor_types text[] NOT NULL,             -- types of humor allowed
  repetition_strategy text NOT NULL,       -- prose: how key words/concepts are repeated
  example_vocabulary text[],               -- example words for this level/language
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(difficulty_level, language)
);

-- RLS: SELECT for all, no INSERT/UPDATE/DELETE for anon
ALTER TABLE public.difficulty_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "difficulty_rules_select" ON public.difficulty_rules;
CREATE POLICY "difficulty_rules_select" ON public.difficulty_rules FOR SELECT USING (true);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_difficulty_rules_updated_at ON public.difficulty_rules;
CREATE TRIGGER update_difficulty_rules_updated_at
  BEFORE UPDATE ON public.difficulty_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. New field on kid_profiles: difficulty_level
-- ============================================================

ALTER TABLE public.kid_profiles
  ADD COLUMN IF NOT EXISTS difficulty_level integer NOT NULL DEFAULT 2;

-- Add CHECK constraint (only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'kid_profiles_difficulty_level_check'
  ) THEN
    ALTER TABLE public.kid_profiles
      ADD CONSTRAINT kid_profiles_difficulty_level_check
      CHECK (difficulty_level BETWEEN 1 AND 3);
  END IF;
END $$;

-- ============================================================
-- 3. Adjust age_rules age groups
-- ============================================================

-- 3a. Delete 4-5 age group (all languages)
DELETE FROM public.age_rules WHERE min_age = 4 AND max_age = 5;

-- 3b. Create 12-13 entries by copying from 10-12 (before changing 10-12)
INSERT INTO public.age_rules (
  min_age, max_age, language,
  max_sentence_length, allowed_tenses, sentence_structures,
  vocabulary_level, complexity_level,
  min_word_count, max_word_count,
  paragraph_length, dialogue_ratio, narrative_perspective,
  narrative_guidelines, example_sentences
)
SELECT
  12, 13, language,
  max_sentence_length, allowed_tenses, sentence_structures,
  vocabulary_level, complexity_level,
  min_word_count, max_word_count,
  paragraph_length, dialogue_ratio, narrative_perspective,
  narrative_guidelines, example_sentences
FROM public.age_rules
WHERE min_age = 10 AND max_age = 12
ON CONFLICT (min_age, max_age, language) DO NOTHING;

-- 3c. Change 10-12 to 10-11
UPDATE public.age_rules SET max_age = 11 WHERE min_age = 10 AND max_age = 12;

-- ============================================================
-- 4. Remove vocabulary_level and complexity_level from age_rules
-- ============================================================

ALTER TABLE public.age_rules DROP COLUMN IF EXISTS vocabulary_level;
ALTER TABLE public.age_rules DROP COLUMN IF EXISTS complexity_level;
