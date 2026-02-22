-- ============================================================
-- T-C1: DB-Übersetzungen — emotion_rules
-- Adds: tr, bg, ro, pl, lt, hu, ca, sl to labels only
-- Key: emotion_key, language (18 rows: joy, thrill, humor_emotion, warmth, curiosity, depth × de, en, fr)
-- ============================================================

UPDATE emotion_rules SET labels = labels || '{"tr": "Neşe", "bg": "Радост", "ro": "Bucurie", "pl": "Radość", "lt": "Džiaugsmas", "hu": "Öröm", "ca": "Alegria", "sl": "Radost"}'::jsonb WHERE emotion_key = 'joy' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Neşe", "bg": "Радост", "ro": "Bucurie", "pl": "Radość", "lt": "Džiaugsmas", "hu": "Öröm", "ca": "Alegria", "sl": "Radost"}'::jsonb WHERE emotion_key = 'joy' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Neşe", "bg": "Радост", "ro": "Bucurie", "pl": "Radość", "lt": "Džiaugsmas", "hu": "Öröm", "ca": "Alegria", "sl": "Radost"}'::jsonb WHERE emotion_key = 'joy' AND language = 'en';

UPDATE emotion_rules SET labels = labels || '{"tr": "Gerilim", "bg": "Напрежение", "ro": "Suspendare", "pl": "Napięcie", "lt": "Įtampa", "hu": "Feszültség", "ca": "Suspens", "sl": "Napetost"}'::jsonb WHERE emotion_key = 'thrill' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Gerilim", "bg": "Напрежение", "ro": "Suspendare", "pl": "Napięcie", "lt": "Įtampa", "hu": "Feszültség", "ca": "Suspens", "sl": "Napetost"}'::jsonb WHERE emotion_key = 'thrill' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Gerilim", "bg": "Напрежение", "ro": "Suspendare", "pl": "Napięcie", "lt": "Įtampa", "hu": "Feszültség", "ca": "Suspens", "sl": "Napetost"}'::jsonb WHERE emotion_key = 'thrill' AND language = 'en';

UPDATE emotion_rules SET labels = labels || '{"tr": "Mizah", "bg": "Хумор", "ro": "Umor", "pl": "Humor", "lt": "Humoras", "hu": "Humor", "ca": "Humor", "sl": "Humor"}'::jsonb WHERE emotion_key = 'humor_emotion' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Mizah", "bg": "Хумор", "ro": "Umor", "pl": "Humor", "lt": "Humoras", "hu": "Humor", "ca": "Humor", "sl": "Humor"}'::jsonb WHERE emotion_key = 'humor_emotion' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Mizah", "bg": "Хумор", "ro": "Umor", "pl": "Humor", "lt": "Humoras", "hu": "Humor", "ca": "Humor", "sl": "Humor"}'::jsonb WHERE emotion_key = 'humor_emotion' AND language = 'en';

UPDATE emotion_rules SET labels = labels || '{"tr": "Sıcaklık", "bg": "Топлина", "ro": "Căldură", "pl": "Ciepło", "lt": "Šiluma", "hu": "Melegség", "ca": "Calor", "sl": "Toplota"}'::jsonb WHERE emotion_key = 'warmth' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Sıcaklık", "bg": "Топлина", "ro": "Căldură", "pl": "Ciepło", "lt": "Šiluma", "hu": "Melegség", "ca": "Calor", "sl": "Toplota"}'::jsonb WHERE emotion_key = 'warmth' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Sıcaklık", "bg": "Топлина", "ro": "Căldură", "pl": "Ciepło", "lt": "Šiluma", "hu": "Melegség", "ca": "Calor", "sl": "Toplota"}'::jsonb WHERE emotion_key = 'warmth' AND language = 'en';

UPDATE emotion_rules SET labels = labels || '{"tr": "Merak", "bg": "Любопитство", "ro": "Curiozitate", "pl": "Ciekawość", "lt": "Smalsumas", "hu": "Kíváncsiság", "ca": "Curiositat", "sl": "Radovednost"}'::jsonb WHERE emotion_key = 'curiosity' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Merak", "bg": "Любопитство", "ro": "Curiozitate", "pl": "Ciekawość", "lt": "Smalsumas", "hu": "Kíváncsiság", "ca": "Curiositat", "sl": "Radovednost"}'::jsonb WHERE emotion_key = 'curiosity' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Merak", "bg": "Любопитство", "ro": "Curiozitate", "pl": "Ciekawość", "lt": "Smalsumas", "hu": "Kíváncsiság", "ca": "Curiositat", "sl": "Radovednost"}'::jsonb WHERE emotion_key = 'curiosity' AND language = 'en';

UPDATE emotion_rules SET labels = labels || '{"tr": "Derinlik", "bg": "Дълбочина", "ro": "Adâncime", "pl": "Głębia", "lt": "Gylis", "hu": "Mélység", "ca": "Profunditat", "sl": "Globina"}'::jsonb WHERE emotion_key = 'depth' AND language = 'fr';
UPDATE emotion_rules SET labels = labels || '{"tr": "Derinlik", "bg": "Дълбочина", "ro": "Adâncime", "pl": "Głębia", "lt": "Gylis", "hu": "Mélység", "ca": "Profunditat", "sl": "Globina"}'::jsonb WHERE emotion_key = 'depth' AND language = 'de';
UPDATE emotion_rules SET labels = labels || '{"tr": "Derinlik", "bg": "Дълбочина", "ro": "Adâncime", "pl": "Głębia", "lt": "Gylis", "hu": "Mélység", "ca": "Profunditat", "sl": "Globina"}'::jsonb WHERE emotion_key = 'depth' AND language = 'en';
