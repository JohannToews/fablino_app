-- ============================================
-- Fablino Gamification Vereinfachung – Migration
-- ============================================

-- 1. Neue Spalte für Story-Completion
ALTER TABLE stories ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- 2. Backfill: Stories die bereits ein Reading-Result haben als completed markieren
UPDATE stories SET completed = true
WHERE id IN (
  SELECT DISTINCT reference_id::uuid FROM user_results
  WHERE activity_type = 'story_completed'
);

-- 3. user_progress: Neue Spalten für vereinfachtes Tracking
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS stories_completed INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS words_learned INTEGER DEFAULT 0;

-- 4. Backfill stories_completed aus stories_read_total (vorhandene Daten übernehmen)
UPDATE user_progress SET stories_completed = stories_read_total;

-- 5. Level-Settings auf neue Werte anpassen (niedrigere Schwellen, neue Titel)
UPDATE level_settings SET title = 'Bücherfuchs',           min_points = 0,   icon = '🦊' WHERE level_number = 1;
UPDATE level_settings SET title = 'Geschichtenentdecker',   min_points = 25,  icon = '🧭' WHERE level_number = 2;
UPDATE level_settings SET title = 'Leseheld',               min_points = 75,  icon = '🦸' WHERE level_number = 3;
UPDATE level_settings SET title = 'Wortmagier',             min_points = 150, icon = '🪄' WHERE level_number = 4;
UPDATE level_settings SET title = 'Fablino-Meister',        min_points = 300, icon = '👑' WHERE level_number = 5;

-- 6. Falls mehr als 5 Level existieren, überschüssige entfernen
DELETE FROM level_settings WHERE level_number > 5;
