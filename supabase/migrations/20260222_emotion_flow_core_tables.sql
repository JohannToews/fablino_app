-- ============================================================
-- Emotion-Flow-Engine: Core Tables (Task 2.1)
-- Creates: emotion_blueprints, character_seeds, story_elements
-- No changes to existing tables.
-- ============================================================

-- ─── 1. emotion_blueprints ──────────────────────────────────

CREATE TABLE IF NOT EXISTS emotion_blueprints (
  id                          UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  blueprint_key               TEXT            UNIQUE NOT NULL,
  labels                      JSONB           NOT NULL,
  descriptions                JSONB           NOT NULL,
  category                    TEXT            NOT NULL
                              CHECK (category IN ('growth', 'social', 'courage', 'empathy', 'humor', 'wonder')),
  arc_by_age                  JSONB           NOT NULL,
  arc_description_en          TEXT            NOT NULL,
  tone_guidance               TEXT,
  tension_curve               TEXT,
  surprise_moment             TEXT,
  ending_feeling              TEXT,
  compatible_themes           TEXT[],
  ideal_age_groups            TEXT[]          NOT NULL,
  min_intensity               TEXT            NOT NULL
                              CHECK (min_intensity IN ('light', 'medium', 'deep')),
  compatible_learning_themes  TEXT[],
  weight                      INTEGER         DEFAULT 10,
  is_active                   BOOLEAN         DEFAULT true,
  created_at                  TIMESTAMPTZ     DEFAULT now(),
  updated_at                  TIMESTAMPTZ     DEFAULT now()
);

-- ─── 2. character_seeds ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS character_seeds (
  id                    UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_key              TEXT            UNIQUE NOT NULL,
  seed_type             TEXT            NOT NULL
                        CHECK (seed_type IN ('protagonist_appearance', 'sidekick_archetype', 'antagonist_archetype')),
  creature_type         TEXT            NOT NULL DEFAULT 'human'
                        CHECK (creature_type IN ('human', 'mythical')),
  labels                JSONB           NOT NULL,
  appearance_en         TEXT,
  personality_trait_en  TEXT,
  weakness_en           TEXT,
  strength_en           TEXT,
  cultural_background   TEXT,
  gender                TEXT
                        CHECK (gender IN ('female', 'male', 'neutral')),
  age_range             TEXT[],
  name_pool             JSONB,
  compatible_themes     TEXT[],
  weight                INTEGER         DEFAULT 10,
  is_active             BOOLEAN         DEFAULT true,
  created_at            TIMESTAMPTZ     DEFAULT now(),
  updated_at            TIMESTAMPTZ     DEFAULT now()
);

-- ─── 3. story_elements ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS story_elements (
  id                      UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  element_key             TEXT            UNIQUE NOT NULL,
  element_type            TEXT            NOT NULL
                          CHECK (element_type IN (
                            'opening_style',
                            'narrative_perspective',
                            'macguffin',
                            'setting_detail',
                            'humor_technique',
                            'tension_technique',
                            'closing_style'
                          )),
  content_en              TEXT            NOT NULL,
  labels                  JSONB,
  compatible_themes       TEXT[],
  compatible_categories   TEXT[],
  age_groups              TEXT[],
  weight                  INTEGER         DEFAULT 10,
  is_active               BOOLEAN         DEFAULT true,
  created_at              TIMESTAMPTZ     DEFAULT now()
);

-- ─── 4. updated_at triggers ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_emotion_blueprints
  BEFORE UPDATE ON emotion_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_character_seeds
  BEFORE UPDATE ON character_seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── 5. RLS ─────────────────────────────────────────────────

ALTER TABLE emotion_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_elements ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users (Edge Functions read these)
CREATE POLICY "emotion_blueprints_select" ON emotion_blueprints
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "character_seeds_select" ON character_seeds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "story_elements_select" ON story_elements
  FOR SELECT TO authenticated USING (true);

-- Write access via service_role only (seeding + admin)
CREATE POLICY "emotion_blueprints_service_all" ON emotion_blueprints
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "character_seeds_service_all" ON character_seeds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "story_elements_service_all" ON story_elements
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 6. Indexes ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_emotion_blueprints_category ON emotion_blueprints (category);
CREATE INDEX IF NOT EXISTS idx_emotion_blueprints_active ON emotion_blueprints (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_character_seeds_type ON character_seeds (seed_type);
CREATE INDEX IF NOT EXISTS idx_character_seeds_creature ON character_seeds (creature_type);
CREATE INDEX IF NOT EXISTS idx_character_seeds_active ON character_seeds (is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_story_elements_type ON story_elements (element_type);
CREATE INDEX IF NOT EXISTS idx_story_elements_active ON story_elements (is_active) WHERE is_active = true;
