-- FSE2: Feature Flag
-- Adds fse2_enabled_users key to app_settings.
-- Default: empty array = nobody. ["*"] = everyone.

INSERT INTO public.app_settings (key, value)
VALUES (
  'fse2_enabled_users',
  '[]'
)
ON CONFLICT (key) DO NOTHING;
