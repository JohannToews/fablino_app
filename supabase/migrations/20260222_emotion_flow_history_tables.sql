-- ============================================================
-- Emotion-Flow-Engine: History/Tracking Tables
-- Task 2.2 — Round-Robin & Diversity Tracking
-- ============================================================
-- These tables track which blueprints, character seeds, and
-- story elements have been used per kid — enabling anti-repetition
-- rotation (same pattern as story_subtype_history).
-- FKs to kid_profiles and stories only. No changes to existing tables.
-- ============================================================

-- ─── 1. emotion_blueprint_history ─────────────────────────────

CREATE TABLE IF NOT EXISTS emotion_blueprint_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  blueprint_key TEXT NOT NULL,
  tone_mode TEXT,
  intensity_level TEXT,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_blueprint_history_kid_date
  ON emotion_blueprint_history (kid_profile_id, created_at DESC);

-- ─── 2. character_seed_history ────────────────────────────────

CREATE TABLE IF NOT EXISTS character_seed_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  seed_key TEXT NOT NULL,
  seed_type TEXT NOT NULL CHECK (seed_type IN ('protagonist_appearance', 'sidekick_archetype', 'antagonist_archetype')),
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_seed_history_kid_type_date
  ON character_seed_history (kid_profile_id, seed_type, created_at DESC);

-- ─── 3. story_element_usage ───────────────────────────────────

CREATE TABLE IF NOT EXISTS story_element_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  element_key TEXT NOT NULL,
  element_type TEXT NOT NULL CHECK (element_type IN (
    'opening_style', 'narrative_perspective', 'macguffin',
    'setting_detail', 'humor_technique', 'tension_technique', 'closing_style'
  )),
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_element_usage_kid_type_date
  ON story_element_usage (kid_profile_id, element_type, created_at DESC);

-- ─── RLS Policies ─────────────────────────────────────────────

ALTER TABLE emotion_blueprint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_seed_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_element_usage ENABLE ROW LEVEL SECURITY;

-- Edge Functions run as service_role (full access).
-- Authenticated users can read their own kids' history.

CREATE POLICY "Users can view own kids blueprint history"
  ON emotion_blueprint_history FOR SELECT
  USING (kid_profile_id IN (
    SELECT id FROM kid_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert blueprint history"
  ON emotion_blueprint_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own kids seed history"
  ON character_seed_history FOR SELECT
  USING (kid_profile_id IN (
    SELECT id FROM kid_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert seed history"
  ON character_seed_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own kids element usage"
  ON story_element_usage FOR SELECT
  USING (kid_profile_id IN (
    SELECT id FROM kid_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert element usage"
  ON story_element_usage FOR INSERT
  WITH CHECK (true);
