-- Story Planner Infrastructure
-- Adds story_plan column and feature flag / prompt settings

-- 1. Add story_plan JSONB column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_plan JSONB;

COMMENT ON COLUMN stories.story_plan IS 'JSON plan from Story Planner LLM step (pre-generation planning)';

-- 2. Add feature flag and system prompt for Story Planner
INSERT INTO app_settings (key, value)
VALUES 
  ('story_planner_enabled_users', '[]'),
  ('system_prompt_story_planner', '')
ON CONFLICT (key) DO NOTHING;
