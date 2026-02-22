-- =============================================================================
-- In Lovable SQL-Editor ausführen. Zeigt, welche Tabellen für die
-- Übersetzungs-Migrationen (2–10) existieren. Nur die ausführen, die existieren.
-- =============================================================================

SELECT table_name AS "Tabelle existiert"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'story_subtypes',
    'learning_themes',
    'image_styles',
    'generation_config',
    'difficulty_rules',
    'theme_rules',
    'emotion_rules',
    'content_themes_by_level',
    'character_seeds'
  )
ORDER BY table_name;
