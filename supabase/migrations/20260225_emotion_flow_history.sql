-- Phase 6.3: Unified Emotion Flow History Tracker
-- Single table for all selector types; replaces per-selector history usage for blueprint/character/element.

CREATE TABLE IF NOT EXISTS emotion_flow_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  selector_type TEXT NOT NULL,
  selected_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_selector_type CHECK (
    selector_type IN (
      'blueprint',
      'protagonist',
      'sidekick',
      'antagonist',
      'opening',
      'perspective',
      'closing',
      'macguffin',
      'setting_detail',
      'humor_technique',
      'tension_technique'
    )
  )
);

CREATE INDEX idx_efh_kid_selector ON emotion_flow_history(kid_profile_id, selector_type, created_at DESC);

ALTER TABLE emotion_flow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON emotion_flow_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users read own history" ON emotion_flow_history
  FOR SELECT USING (
    kid_profile_id IN (
      SELECT id FROM kid_profiles WHERE user_id = auth.uid()
    )
  );
