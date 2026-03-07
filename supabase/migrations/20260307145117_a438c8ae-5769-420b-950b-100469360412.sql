
CREATE OR REPLACE FUNCTION public.create_default_language_settings()
RETURNS TRIGGER AS $$
DECLARE
  default_lvl integer;
  lang text;
BEGIN
  lang := COALESCE(NEW.reading_language, NEW.school_system, 'fr');

  SELECT default_level INTO default_lvl
  FROM age_level_defaults
  WHERE age = NEW.age;

  default_lvl := COALESCE(default_lvl, 1);

  INSERT INTO kid_language_settings
    (kid_profile_id, language, language_class, language_level, content_level, length_level)
  VALUES
    (NEW.id, lang, 1, default_lvl, default_lvl, 1)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_language_settings
AFTER INSERT ON kid_profiles
FOR EACH ROW EXECUTE FUNCTION create_default_language_settings();
