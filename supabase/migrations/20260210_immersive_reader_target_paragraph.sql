-- Immersive Reader: Add target_paragraph to image_plan schema in CORE Slim v2 prompt
-- This tells the LLM to include a 0-based paragraph index for each scene image,
-- enabling content-aware image placement in the Immersive Reader.

-- 1. Add target_paragraph instruction to the IMAGE PLAN rules section
UPDATE app_settings
SET value = replace(
  value,
  E'- Each scene must have at least 1 new visual element not in other scenes',
  E'- Each scene must have at least 1 new visual element not in other scenes\n    - For each scene, include "target_paragraph": the 0-based index of the paragraph in the story text that this image best illustrates. Count paragraphs starting from 0. Distribute images evenly across the story — do not cluster them.'
)
WHERE key = 'system_prompt_core_v2';

-- 2. Add target_paragraph field to the JSON output format (scenes array example)
UPDATE app_settings
SET value = replace(
  value,
  E'"key_elements": ["element1", "element2", "element3"]',
  E'"key_elements": ["element1", "element2", "element3"],\n        "target_paragraph": 2'
)
WHERE key = 'system_prompt_core_v2';
