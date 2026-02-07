-- Block 2.3d: Add story_languages[] to kid_profiles
-- This field explicitly stores which languages a child should receive stories in.
-- Replaces the implicit derivation from reading_language + home_languages in the wizard.

ALTER TABLE kid_profiles 
ADD COLUMN IF NOT EXISTS story_languages text[] NOT NULL DEFAULT '{"fr"}';

-- Bestehende Profile: Befülle mit reading_language + home_languages (deduplicated)
UPDATE kid_profiles 
SET story_languages = ARRAY(
  SELECT DISTINCT unnest(
    ARRAY[reading_language] || COALESCE(home_languages, '{}')
  )
);
