-- Fix double-escaped quotes in prompt templates.
-- These "" artifacts came from JSON-serialized template storage.
-- Must be fixed in DB, not at runtime (runtime fix breaks valid JSON in prompts).

UPDATE fse3_prompt_templates
SET prompt_template = REPLACE(prompt_template, '""', '"')
WHERE prompt_template LIKE '%""%';

-- Also fix system prompts if affected
UPDATE fse3_system_prompts
SET content = REPLACE(content, '""', '"')
WHERE content LIKE '%""%';

-- Also fix language config dialogue examples if affected
UPDATE fse3_language_config
SET
  dialogue_example_spoken = REPLACE(dialogue_example_spoken, '""', '"'),
  dialogue_example_thought = REPLACE(dialogue_example_thought, '""', '"')
WHERE
  dialogue_example_spoken LIKE '%""%'
  OR dialogue_example_thought LIKE '%""%';
