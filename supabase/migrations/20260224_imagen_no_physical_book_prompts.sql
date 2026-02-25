-- Reduce "physical book" trigger in image prompts (Imagen was rendering open book / page frame).
-- Replace "book" wording in imagen_prompt_snippet with "illustration" wording so model fills frame edge-to-edge.

UPDATE image_styles
SET imagen_prompt_snippet = REPLACE(imagen_prompt_snippet, 'picture book illustration', 'children''s illustration style')
WHERE imagen_prompt_snippet LIKE '%picture book illustration%';

UPDATE image_styles
SET imagen_prompt_snippet = REPLACE(imagen_prompt_snippet, 'children''s book illustration', 'children''s illustration')
WHERE imagen_prompt_snippet LIKE '%children''s book illustration%';

UPDATE image_styles
SET imagen_prompt_snippet = REPLACE(imagen_prompt_snippet, 'children''s book art style', 'children''s illustration style')
WHERE imagen_prompt_snippet LIKE '%children''s book art style%';

UPDATE image_styles
SET imagen_prompt_snippet = REPLACE(imagen_prompt_snippet, 'Children book', 'Children''s illustration')
WHERE imagen_prompt_snippet LIKE '%Children book%';

-- Optional: add to existing negative_prompt if column exists and doesn't already mention book
UPDATE image_styles
SET negative_prompt = CONCAT(
  COALESCE(negative_prompt, ''),
  CASE WHEN COALESCE(negative_prompt, '') <> '' THEN ', ' ELSE '' END,
  'physical book, open book, book pages, book spine, page edges, white borders, grey background, frame'
)
WHERE negative_prompt IS NULL OR negative_prompt NOT LIKE '%physical book%';
