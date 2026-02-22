-- ============================================================
-- Emotion-Flow-Engine: Stories Table Extension (Task 2.3)
-- Adds 7 nullable columns to the existing stories table.
-- ALL columns are NULLABLE — no defaults, no NOT NULL.
-- Existing stories get NULL automatically. No data migration needed.
-- ============================================================

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS emotion_blueprint_key TEXT
    REFERENCES emotion_blueprints(blueprint_key);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS tone_mode TEXT
    CHECK (tone_mode IS NULL OR tone_mode IN ('dramatic', 'comedic', 'adventurous', 'gentle', 'absurd'));

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS intensity_level TEXT
    CHECK (intensity_level IS NULL OR intensity_level IN ('light', 'medium', 'deep'));

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS character_seed_key TEXT
    REFERENCES character_seeds(seed_key);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS sidekick_seed_key TEXT
    REFERENCES character_seeds(seed_key);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS opening_element_key TEXT
    REFERENCES story_elements(element_key);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS perspective_element_key TEXT
    REFERENCES story_elements(element_key);
