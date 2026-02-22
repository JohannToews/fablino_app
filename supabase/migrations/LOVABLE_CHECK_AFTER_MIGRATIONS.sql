-- =============================================================================
-- Lovable: Check nach allen Migrationen
-- Einmal komplett im SQL-Editor ausführen. Prüft: Tabellen, Zeilen, Sprachen.
-- Erwartung: Block 1 = alle 10 Tabellen, Block 2 = Anzahlen > 0, Block 3+4+5 = tr/8 Sprachen.
-- =============================================================================

-- 1) Tabellen vorhanden?
SELECT '1. Tabellen' AS check_block;
SELECT table_name AS tabelle,
       CASE WHEN table_name IS NOT NULL THEN 'ok' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'story_subtypes',
    'story_subtype_history',
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

-- 2) Zeilenanzahl (über pg_stat, schlägt nicht fehl wenn Tabelle fehlt)
SELECT '2. Zeilenanzahl (ca.)' AS check_block;
SELECT relname AS tabelle, n_live_tup::bigint AS anzahl
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
    'learning_themes', 'image_styles', 'generation_config', 'difficulty_rules',
    'theme_rules', 'emotion_rules', 'content_themes_by_level', 'character_seeds',
    'story_subtypes', 'story_subtype_history'
  )
ORDER BY relname;

-- 3) Neue Sprachen (tr) in Übersetzungs-Spalte vorhanden?
--    Spalten: learning_themes/image_styles/... = labels; generation_config = length_labels; difficulty_rules = label
SELECT '3. Übersetzungen (Spalte enthält tr)' AS check_block;
SELECT 'learning_themes' AS tabelle,
       count(*) FILTER (WHERE labels ? 'tr') AS mit_tr,
       count(*) AS gesamt
FROM learning_themes
UNION ALL
SELECT 'image_styles', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM image_styles
UNION ALL
SELECT 'generation_config', count(*) FILTER (WHERE length_labels ? 'tr'), count(*) FROM generation_config
UNION ALL
SELECT 'difficulty_rules', count(*) FILTER (WHERE label ? 'tr'), count(*) FROM difficulty_rules
UNION ALL
SELECT 'theme_rules', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM theme_rules
UNION ALL
SELECT 'emotion_rules', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM emotion_rules
UNION ALL
SELECT 'content_themes_by_level', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM content_themes_by_level
UNION ALL
SELECT 'character_seeds', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM character_seeds
UNION ALL
SELECT 'story_subtypes', count(*) FILTER (WHERE labels ? 'tr'), count(*) FROM story_subtypes
ORDER BY tabelle;

-- 4+5) Beide in einer Tabelle: Welche Tabelle hat wie viele Zeilen mit allen 8 Sprachen?
SELECT '4+5. Zeilen mit allen 8 Sprachen (tr,bg,ro,pl,lt,hu,ca,sl)' AS check_block;
SELECT 'story_subtypes' AS tabelle,
       count(*) AS zeilen_mit_alle_8_sprachen,
       (SELECT count(*) FROM story_subtypes) AS zeilen_gesamt
FROM story_subtypes
WHERE labels ? 'tr' AND labels ? 'bg' AND labels ? 'ro' AND labels ? 'pl'
  AND labels ? 'lt' AND labels ? 'hu' AND labels ? 'ca' AND labels ? 'sl'
UNION ALL
SELECT 'learning_themes',
       count(*),
       (SELECT count(*) FROM learning_themes)
FROM learning_themes
WHERE labels ? 'tr' AND labels ? 'bg' AND labels ? 'ro' AND labels ? 'pl'
  AND labels ? 'lt' AND labels ? 'hu' AND labels ? 'ca' AND labels ? 'sl';
