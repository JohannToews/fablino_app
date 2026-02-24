-- Premium UI: Feature Flag (per-user)
-- key: premium_ui_enabled_users
-- value: JSON array of user_profiles.id. [] = nobody (default). ["*"] = all. ["uuid"] = specific user.

INSERT INTO public.app_settings (key, value)
VALUES (
  'premium_ui_enabled_users',
  '[]'
)
ON CONFLICT (key) DO NOTHING;
