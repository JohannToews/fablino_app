-- Farsi (fa) story language: feature flag (same pattern as emotion_flow, comic_strip)
-- key: farsi_enabled_users
-- value: JSON array of user IDs. [] = nobody. ["*"] = all. ["uuid"] = specific user.

INSERT INTO public.app_settings (key, value)
VALUES ('farsi_enabled_users', '[]')
ON CONFLICT (key) DO NOTHING;
