-- Comic-Strip: Feature Flag
-- key: comic_strip_enabled_users
-- value: JSON array of user IDs. [] = nobody (default). ["*"] = all. ["uuid"] = specific user.
-- Description (for reference): User-IDs für Comic-Strip-Modus. ["*"] = alle. Leer = niemand (klassische Einzelbilder).

INSERT INTO public.app_settings (key, value)
VALUES (
  'comic_strip_enabled_users',
  '[]'
)
ON CONFLICT (key) DO NOTHING;
