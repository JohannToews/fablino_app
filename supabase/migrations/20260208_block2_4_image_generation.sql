-- ============================================================
-- Block 2.4 Phase 1: DB-Erweiterungen für intelligente Bild-Generierung
-- ============================================================

-- ============================================================
-- 1.1 theme_rules: Bild-spezifische Spalten hinzufügen
-- ============================================================

ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_style_prompt text;
ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_negative_prompt text;
ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_color_palette text;

-- Bild-Prompts sind IMMER auf Englisch (sprachunabhängig).
-- Alle Sprach-Varianten einer theme_key bekommen den gleichen Wert.

-- Fantasy
UPDATE theme_rules SET 
  image_style_prompt = 'Magical fairy-tale illustration, enchanted atmosphere, glowing mystical elements, storybook aesthetic, soft dreamy lighting, children book watercolor style',
  image_negative_prompt = 'realistic photo, dark horror, blood, violence, scary monsters, text, letters, words, writing',
  image_color_palette = 'Deep purples, emerald greens, gold accents, moonlight silver, warm amber'
WHERE theme_key = 'fantasy';

-- Action / Adventure
UPDATE theme_rules SET 
  image_style_prompt = 'Dynamic adventure illustration, exciting action poses, epic landscapes, bold composition, vibrant energy, children book cartoon style',
  image_negative_prompt = 'realistic photo, gore, blood, weapons aimed at people, dark horror, text, letters, words, writing',
  image_color_palette = 'Bold reds, deep blues, sunset oranges, forest greens, golden highlights'
WHERE theme_key = 'action';

-- Animals / Nature
UPDATE theme_rules SET 
  image_style_prompt = 'Warm nature illustration, friendly expressive animals, natural habitats, soft golden lighting, children book style, gentle atmosphere',
  image_negative_prompt = 'realistic photo, taxidermy, hunting, blood, scary predators, text, letters, words, writing',
  image_color_palette = 'Forest greens, warm browns, sky blues, sunflower yellows, soft earth tones'
WHERE theme_key = 'animals';

-- Everyday / Slice of Life
UPDATE theme_rules SET 
  image_style_prompt = 'Cozy slice-of-life illustration, warm domestic scenes, familiar everyday settings, gentle lighting, relatable details, children book aesthetic',
  image_negative_prompt = 'fantasy elements, monsters, weapons, dark atmosphere, text, letters, words, writing',
  image_color_palette = 'Warm pastels, cozy oranges, soft blues, cream whites, gentle pinks'
WHERE theme_key = 'everyday';

-- Humor
UPDATE theme_rules SET 
  image_style_prompt = 'Playful cartoon-inspired illustration, exaggerated funny expressions, bright cheerful colors, whimsical details, comic book energy, children book style',
  image_negative_prompt = 'realistic photo, dark mood, scary, serious atmosphere, text, letters, words, writing',
  image_color_palette = 'Bright primaries, candy pinks, lime greens, sunny yellows, sky blues'
WHERE theme_key = 'humor';

-- Educational / Science
UPDATE theme_rules SET 
  image_style_prompt = 'Clear educational illustration, accurate but artistic details, curiosity-inspiring, bright and clean, children book infographic style',
  image_negative_prompt = 'fantasy creatures, magic, dark atmosphere, text, letters, words, writing',
  image_color_palette = 'Clean blues, natural greens, warm whites, accent oranges, clear yellows'
WHERE theme_key = 'educational';

-- Fallback: Für alle die NULL geblieben sind
UPDATE theme_rules SET 
  image_style_prompt = 'Warm children book illustration, soft lighting, friendly atmosphere, storybook aesthetic, watercolor style',
  image_negative_prompt = 'realistic photo, scary, violence, text, letters, words, writing',
  image_color_palette = 'Warm pastels, soft blues, gentle greens, cream whites'
WHERE image_style_prompt IS NULL;

-- ============================================================
-- 1.2 image_style_rules: Erweiterte Spalten hinzufügen
-- ============================================================

ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS character_style text;
ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS complexity_level text;
ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS forbidden_elements text;

-- 4-6 Jahre: Bilderbuch-Stil, süß, weich, einfach
UPDATE image_style_rules SET 
  character_style = 'Cute chibi-like proportions with oversized heads and big round eyes. Very simple clothing in 1-2 bright primary colors. Characters look adorable and non-threatening. Round soft body shapes. Happy friendly default expression. Simple hairstyles.',
  complexity_level = 'Very simple backgrounds with max 3-4 large elements. Single clear focal point. Flat colors, minimal shading. No perspective tricks. Large objects, no tiny details. Bright even lighting everywhere.',
  forbidden_elements = 'Scary shadows, sharp teeth, blood, weapons, skeletons, realistic fire, dark scenes, crying faces, aggressive expressions, complex textures, small details, dramatic lighting, menacing poses'
WHERE age_group = '4-6';

-- 7-9 Jahre: Cartoon/Comic-Stil, dynamisch, cool, abenteuerlich
UPDATE image_style_rules SET 
  character_style = 'Proportionate but stylized cartoon characters. Confident dynamic poses — running, jumping, pointing, exploring. Cool expressive faces showing determination and excitement. Detailed colorful clothing with personality (backpacks, sneakers, goggles, capes). Characters look capable and adventurous, NOT babyish. Styled hair, individual features.',
  complexity_level = 'Detailed cartoon backgrounds with 5-7 elements and depth. Dynamic angles allowed (slight low-angle for heroic feel). Action lines and movement effects welcome. Rich colors with good contrast. Dramatic but not dark lighting. Layered scenes with foreground and background.',
  forbidden_elements = 'Gore, weapons aimed at people, very dark scenes without any light source, realistic violence, overly cute/babyish proportions'
WHERE age_group = '7-9';

-- 10-12 Jahre: Semi-realistisch, atmosphärisch, Graphic Novel Einfluss
UPDATE image_style_rules SET 
  character_style = 'Semi-realistic proportions like graphic novel or anime style. Characters look like real pre-teens — cool, independent, with attitude. Nuanced facial expressions showing complex emotions (curiosity mixed with doubt, bravery mixed with fear). Detailed individual clothing reflecting personality and style. Realistic hairstyles. Characters can look serious, thoughtful, or intense — not just happy.',
  complexity_level = 'Rich cinematic backgrounds with atmospheric lighting and mood. Complex layered compositions with depth of field effect. Dramatic camera angles (low angle, birds eye, close-up). Sophisticated color palettes with gradients and shadows. Weather effects (rain, fog, golden hour) welcome. Environmental storytelling through background details.',
  forbidden_elements = 'Gore, explicit violence, overly sexualized poses, graphic injury, childish/babyish art style, oversimplified characters'
WHERE age_group = '10-12';

-- Default: Für alle die NULL geblieben sind (8 Jahre Stil)
UPDATE image_style_rules SET 
  character_style = 'Proportionate cartoon characters with confident poses. Cool and adventurous, not babyish. Expressive faces with personality.',
  complexity_level = 'Detailed backgrounds with depth. Dynamic composition. Rich colors with contrast.',
  forbidden_elements = 'Gore, weapons, very dark scenes, realistic violence, overly cute proportions'
WHERE character_style IS NULL;

-- ============================================================
-- 1.3 stories Tabelle: image_count Spalte hinzufügen
-- ============================================================

-- story_images text[] existiert bereits (Migration 20260128165045)
-- image_count hinzufügen
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_count integer DEFAULT 1;
