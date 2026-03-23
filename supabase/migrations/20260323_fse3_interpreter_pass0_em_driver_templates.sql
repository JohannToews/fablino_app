-- =============================================================================
-- Update interpreter + pass_0 templates for em_driver-based variant generation
-- =============================================================================

-- 1. Update INTERPRETER template: dynamic em_drivers instead of hardcoded A/B/C tones
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  'Create exactly 3 variants:.*?Variant C:[^\n]*',
  E'Create exactly 3 variants. Each variant represents a DIFFERENT emotional direction for the story.\n\nAVAILABLE EMOTIONAL DRIVERS FOR THIS THEME:\n{{AVAILABLE_EM_DRIVERS}}\n\nYou MUST use each driver exactly once — one variant per driver.',
  'ns'
)
WHERE pass_name = 'interpreter' AND is_active = true;

-- 2. Update INTERPRETER template: update VISIBLE section (fixed emoji + label from driver)
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  'VISIBLE \(in \{\{STORY_LANGUAGE_NAME\}\} — \{\{STORY_LANGUAGE\}\}\):\n- emoji: one emoji that fits the tone\n- title: max 6 words, in \{\{STORY_LANGUAGE_NAME\}\}\n- teaser: max 2 sentences in \{\{STORY_LANGUAGE_NAME\}\}, speaks to the child, creates curiosity',
  E'VISIBLE (in {{STORY_LANGUAGE_NAME}} — {{STORY_LANGUAGE}}):\n- emoji: use the FIXED emoji from the driver list above. Do NOT choose your own.\n- label: use the FIXED label from the driver list above in {{STORY_LANGUAGE_NAME}}.\n- title: max 6 words, in {{STORY_LANGUAGE_NAME}}\n- teaser: exactly 1 sentence in {{STORY_LANGUAGE_NAME}}, max 15 words, speaks directly to the child',
  'n'
)
WHERE pass_name = 'interpreter' AND is_active = true;

-- 3. Update INTERPRETER template: add em_driver to ROUTING section
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  'ROUTING \(in English\):\n- primary_driver: one of "humor" \| "suspense" \| "empathy" \| "adventure"\n- subtype_key: pick the best matching subtype from the available list\n- conflict_type: "villain" \| "external_obstacle" \| "internal_growth" \| "mystery" \| "race_against_time"\n- one_line_summary: one sentence describing the core story idea',
  E'ROUTING (in English):\n- em_driver: the driver key from the list above (e.g. "spannung")\n- primary_driver: the primary_driver value from the list above (e.g. "suspense")\n- subtype_key: pick the best matching subtype from the available list\n- conflict_type: "villain" | "external_obstacle" | "internal_growth" | "mystery" | "race_against_time"\n- one_line_summary: one sentence describing the core story idea',
  'n'
)
WHERE pass_name = 'interpreter' AND is_active = true;

-- 4. Update INTERPRETER template: add em_driver to JSON example
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  '"routing": \{ "primary_driver": "\.\.\.", "subtype_key": "\.\.\.", "conflict_type": "\.\.\.", "one_line_summary": "\.\.\." \}',
  '"routing": { "em_driver": "...", "primary_driver": "...", "subtype_key": "...", "conflict_type": "...", "one_line_summary": "..." }',
  'gn'
)
WHERE pass_name = 'interpreter' AND is_active = true;

-- Also update the first (expanded) JSON example
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  '"routing": \{ "primary_driver": "\.\.\.", "subtype_key": "\.\.\.", "conflict_type": "\.\.\.", "one_line_summary": "\.\.\." \}',
  '"routing": { "em_driver": "...", "primary_driver": "...", "subtype_key": "...", "conflict_type": "...", "one_line_summary": "..." }',
  'gn'
)
WHERE pass_name = 'interpreter' AND is_active = true;

-- 5. Update PASS 0 template: fix emotional_coloring to use driver-based constraint
UPDATE fse3_prompt_templates
SET prompt_template = regexp_replace(
  prompt_template,
  '- emotional_coloring: primary EM-code \(EM-H Humor, EM-T Thrill, EM-J Joy, EM-W Warmth, EM-D Depth, EM-C Curiosity\)\n- emotional_secondary: secondary EM-code',
  E'- emotional_coloring: pick ONE from {{EMOTIONAL_COLORING_OPTIONS}}. This is FIXED based on the chosen emotional driver. Only these options are valid.\n- emotional_secondary: pick a secondary EM-code that supports the primary. Choose from: EM-H, EM-T, EM-J, EM-W, EM-D, EM-C',
  'n'
)
WHERE pass_name = 'pass_0' AND is_active = true;
