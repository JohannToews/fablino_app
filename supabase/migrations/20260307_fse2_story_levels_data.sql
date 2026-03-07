-- FSE2: Fill story_levels table with 5 rows (all 18 attributes)
-- Table already exists from 20260307_fse2_master_data_tables.sql

INSERT INTO story_levels VALUES
(1,
  '{"de":"Erstleser","en":"Early Reader"}',
  '{"de":"Sehr kurze, lineare Geschichten für Leseanfänger","en":"Very short linear stories for beginning readers"}',
  0, 2, false, 'minimal', false,
  6, 'Simple main clauses only', ARRAY['present tense'], false, 'none',
  '50–70%', '2–3 sentences', 2, 'none', 'none', 'Frequent repetition of key words', 'First person or close third person'
),
(2,
  '{"de":"Leseeinsteiger","en":"Emerging Reader"}',
  '{"de":"Kurze Geschichten mit einfacher Wendung","en":"Short stories with one simple twist"}',
  1, 3, false, 'simple', false,
  8, 'Main clauses + coordination (and, but, then)', ARRAY['present','present perfect','future I'], false, 'none',
  '40–60%', '3–4 sentences', 3, 'minimal', 'none', 'Deliberate repetition to reinforce new words', 'Close third person'
),
(3,
  '{"de":"Selbstständiger Leser","en":"Independent Reader"}',
  '{"de":"Mittellange Geschichten mit klarer Struktur","en":"Medium stories with clear structure"}',
  1, 3, false, 'simple-medium', true,
  11, 'Simple subordinate clauses (because, when, that)', ARRAY['present','simple past','present perfect','future I'], true, 'max 1 per story',
  '30–50%', '3–5 sentences', 5, 'sparse', 'occasional', 'Introduce new words in context', 'Third person'
),
(4,
  '{"de":"Geübter Leser","en":"Capable Reader"}',
  '{"de":"Längere Geschichten mit mehreren Wendungen","en":"Longer stories with multiple turns"}',
  2, 4, true, 'medium', true,
  14, 'Subordinate clauses + simple relative clauses', ARRAY['present','simple past','past perfect','future I','conditional'], true, 'max 2 per story',
  '20–40%', '4–6 sentences', 7, 'deliberate', 'sparse', 'Introduce synonyms', 'Third person or alternating'
),
(5,
  '{"de":"Fortgeschrittener Leser","en":"Advanced Reader"}',
  '{"de":"Komplexe mehrstrangige Geschichten","en":"Complex multi-layered stories"}',
  3, 5, true, 'medium-complex', true,
  17, 'Complex sentence structures, parenthetical phrases allowed', ARRAY['all tenses including subjunctive II'], true, 'yes, used sparingly',
  '20–35%', '5–7 sentences', 10, 'used consciously', 'sparse', 'Rich variation encouraged', 'Flexible'
);
