-- ============================================================
-- T-C1: DB-Übersetzungen — generation_config
-- Adds: tr, bg, ro, pl, lt, hu, ca, sl to length_labels + length_description
-- Key: age_group, story_length
-- ============================================================

-- length_labels: Short/Medium/Long/Extra Long in 8 languages
-- We use the same label set for short, medium, long; extra_long gets "Extra long" variant.
UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Kısa", "bg": "Кратко", "ro": "Scurt", "pl": "Krótka", "lt": "Trumpa", "hu": "Rövid", "ca": "Curt", "sl": "Kratka"}'::jsonb,
  length_description = length_description || '{"tr": "~2-3 dk okuma", "bg": "~2-3 мин. четене", "ro": "~2-3 min citire", "pl": "~2-3 min czytania", "lt": "~2-3 min skaitymo", "hu": "~2-3 perc olvasás", "ca": "~2-3 min lectura", "sl": "~2-3 min branja"}'::jsonb
WHERE age_group = '6-7' AND story_length = 'short';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średnia", "lt": "Vidutinė", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednja"}'::jsonb,
  length_description = length_description || '{"tr": "~4-5 dk okuma", "bg": "~4-5 мин. четене", "ro": "~4-5 min citire", "pl": "~4-5 min czytania", "lt": "~4-5 min skaitymo", "hu": "~4-5 perc olvasás", "ca": "~4-5 min lectura", "sl": "~4-5 min branja"}'::jsonb
WHERE age_group = '6-7' AND story_length = 'medium';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Uzun", "bg": "Дълго", "ro": "Lung", "pl": "Długa", "lt": "Ilga", "hu": "Hosszú", "ca": "Llarg", "sl": "Dolga"}'::jsonb,
  length_description = length_description || '{"tr": "~6-7 dk okuma", "bg": "~6-7 мин. четене", "ro": "~6-7 min citire", "pl": "~6-7 min czytania", "lt": "~6-7 min skaitymo", "hu": "~6-7 perc olvasás", "ca": "~6-7 min lectura", "sl": "~6-7 min branja"}'::jsonb
WHERE age_group = '6-7' AND story_length = 'long';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Kısa", "bg": "Кратко", "ro": "Scurt", "pl": "Krótka", "lt": "Trumpa", "hu": "Rövid", "ca": "Curt", "sl": "Kratka"}'::jsonb,
  length_description = length_description || '{"tr": "~3-4 dk okuma", "bg": "~3-4 мин. четене", "ro": "~3-4 min citire", "pl": "~3-4 min czytania", "lt": "~3-4 min skaitymo", "hu": "~3-4 perc olvasás", "ca": "~3-4 min lectura", "sl": "~3-4 min branja"}'::jsonb
WHERE age_group = '8-9' AND story_length = 'short';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średnia", "lt": "Vidutinė", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednja"}'::jsonb,
  length_description = length_description || '{"tr": "~5-6 dk okuma", "bg": "~5-6 мин. четене", "ro": "~5-6 min citire", "pl": "~5-6 min czytania", "lt": "~5-6 min skaitymo", "hu": "~5-6 perc olvasás", "ca": "~5-6 min lectura", "sl": "~5-6 min branja"}'::jsonb
WHERE age_group = '8-9' AND story_length = 'medium';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Uzun", "bg": "Дълго", "ro": "Lung", "pl": "Długa", "lt": "Ilga", "hu": "Hosszú", "ca": "Llarg", "sl": "Dolga"}'::jsonb,
  length_description = length_description || '{"tr": "~7-8 dk okuma", "bg": "~7-8 мин. четене", "ro": "~7-8 min citire", "pl": "~7-8 min czytania", "lt": "~7-8 min skaitymo", "hu": "~7-8 perc olvasás", "ca": "~7-8 min lectura", "sl": "~7-8 min branja"}'::jsonb
WHERE age_group = '8-9' AND story_length = 'long';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Çok Uzun", "bg": "Екстра дълго", "ro": "Foarte lung", "pl": "Bardzo długa", "lt": "Labai ilga", "hu": "Extra hosszú", "ca": "Molt llarg", "sl": "Zelo dolga"}'::jsonb,
  length_description = length_description || '{"tr": "~10-12 dk okuma", "bg": "~10-12 мин. четене", "ro": "~10-12 min citire", "pl": "~10-12 min czytania", "lt": "~10-12 min skaitymo", "hu": "~10-12 perc olvasás", "ca": "~10-12 min lectura", "sl": "~10-12 min branja"}'::jsonb
WHERE age_group = '8-9' AND story_length = 'extra_long';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Kısa", "bg": "Кратко", "ro": "Scurt", "pl": "Krótka", "lt": "Trumpa", "hu": "Rövid", "ca": "Curt", "sl": "Kratka"}'::jsonb,
  length_description = length_description || '{"tr": "~3-4 dk okuma", "bg": "~3-4 мин. четене", "ro": "~3-4 min citire", "pl": "~3-4 min czytania", "lt": "~3-4 min skaitymo", "hu": "~3-4 perc olvasás", "ca": "~3-4 min lectura", "sl": "~3-4 min branja"}'::jsonb
WHERE age_group = '10-11' AND story_length = 'short';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średnia", "lt": "Vidutinė", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednja"}'::jsonb,
  length_description = length_description || '{"tr": "~5-6 dk okuma", "bg": "~5-6 мин. четене", "ro": "~5-6 min citire", "pl": "~5-6 min czytania", "lt": "~5-6 min skaitymo", "hu": "~5-6 perc olvasás", "ca": "~5-6 min lectura", "sl": "~5-6 min branja"}'::jsonb
WHERE age_group = '10-11' AND story_length = 'medium';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Uzun", "bg": "Дълго", "ro": "Lung", "pl": "Długa", "lt": "Ilga", "hu": "Hosszú", "ca": "Llarg", "sl": "Dolga"}'::jsonb,
  length_description = length_description || '{"tr": "~7-9 dk okuma", "bg": "~7-9 мин. четене", "ro": "~7-9 min citire", "pl": "~7-9 min czytania", "lt": "~7-9 min skaitymo", "hu": "~7-9 perc olvasás", "ca": "~7-9 min lectura", "sl": "~7-9 min branja"}'::jsonb
WHERE age_group = '10-11' AND story_length = 'long';

UPDATE generation_config SET
  length_labels = length_labels || '{"tr": "Çok Uzun", "bg": "Екстра дълго", "ro": "Foarte lung", "pl": "Bardzo długa", "lt": "Labai ilga", "hu": "Extra hosszú", "ca": "Molt llarg", "sl": "Zelo dolga"}'::jsonb,
  length_description = length_description || '{"tr": "~10-12 dk okuma", "bg": "~10-12 мин. четене", "ro": "~10-12 min citire", "pl": "~10-12 min czytania", "lt": "~10-12 min skaitymo", "hu": "~10-12 perc olvasás", "ca": "~10-12 min lectura", "sl": "~10-12 min branja"}'::jsonb
WHERE age_group = '10-11' AND story_length = 'extra_long';
