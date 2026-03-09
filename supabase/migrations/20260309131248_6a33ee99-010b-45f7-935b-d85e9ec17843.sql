
CREATE OR REPLACE FUNCTION public.extract_grade_from_class(p_school_class text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  grade_num integer;
BEGIN
  -- Extract first number from school_class string
  -- Handles: "1. Klasse", "P1 (Primaire 1)", "Grade 1", "1º Primaria", "Groep 3", "1 клас", etc.
  SELECT (regexp_match(p_school_class, '(\d+)'))[1]::integer INTO grade_num;
  -- Clamp to 1-5 range
  RETURN LEAST(5, GREATEST(1, COALESCE(grade_num, 1)));
END;
$$;

-- Update the trigger function to use grade-based defaults instead of age_level_defaults
CREATE OR REPLACE FUNCTION public.create_default_language_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_lvl integer;
  lang text;
BEGIN
  lang := COALESCE(NEW.reading_language, NEW.school_system, 'fr');

  -- Use grade from school_class instead of age_level_defaults
  default_lvl := extract_grade_from_class(COALESCE(NEW.school_class, '1'));

  INSERT INTO kid_language_settings
    (kid_profile_id, language, language_class, language_level, content_level, length_level)
  VALUES
    (NEW.id, lang, 1, default_lvl, default_lvl, 1)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
