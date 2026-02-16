-- ============================================================
-- Migration: Alter 5 Support
-- Setzt "short" als Default-Länge für Altersgruppe 6-7,
-- da 5-Jährige in diese Gruppe fallen und kürzere Texte brauchen.
-- ============================================================

UPDATE generation_config
SET is_default = (story_length = 'short')
WHERE age_group = '6-7';
