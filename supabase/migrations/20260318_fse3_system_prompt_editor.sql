-- FSE3: Add minimal system prompt for editor passes and update system_prompt_key per pass
--
-- Pass 1 (Writer) keeps system_prompt_core_v3 (rich creative system prompt).
-- All other passes get a minimal editor system prompt.

-- 1. Insert the minimal editor system prompt
INSERT INTO app_settings (key, value) VALUES
  ('system_prompt_fse3_editor', '"You are editing a children''s story for a reading app. Follow the user instructions precisely. Do not add anything the user did not ask for. Do not ignore any constraint."')
ON CONFLICT (key) DO NOTHING;

-- 2. Update system_prompt_key for all passes EXCEPT pass_1
UPDATE fse3_prompt_templates
SET system_prompt_key = 'system_prompt_fse3_editor'
WHERE pass_name IN ('interpreter', 'pass_0', 'pass_2', 'pass_3', 'pass_4');
