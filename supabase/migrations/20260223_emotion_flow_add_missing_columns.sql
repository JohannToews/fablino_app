-- ============================================================
-- Emotion-Flow-Engine: Add missing columns (Task 6.2)
-- antagonist_seed_key and used_emotion_flow were not in the
-- original migration 20260222_emotion_flow_stories_columns.sql.
-- ============================================================

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS antagonist_seed_key TEXT
    REFERENCES character_seeds(seed_key);

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS used_emotion_flow BOOLEAN DEFAULT false;
