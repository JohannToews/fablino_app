-- Emotion-Flow-Engine: Feature Flag
-- Adds a new key to app_settings that controls which users have access
-- to the new Emotion-Flow story generation engine.
-- Default: empty array = nobody. ["*"] = everyone.

INSERT INTO public.app_settings (key, value)
VALUES (
  'emotion_flow_enabled_users',
  '[]'
)
ON CONFLICT (key) DO NOTHING;
