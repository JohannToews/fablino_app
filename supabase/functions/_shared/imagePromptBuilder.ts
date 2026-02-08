/**
 * imagePromptBuilder.ts – Block 2.4
 * Builds final image prompts from LLM image_plan + DB style rules.
 * Handles cover + scene images with age-appropriate styling.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: Array<{
    scene_id: number;
    story_position: string;
    description: string;
    emotion: string;
    key_elements: string[];
  }>;
}

export interface ImageStyleRules {
  style_prompt?: string;
  negative_prompt?: string;
  color_palette?: string;
  character_style?: string;
  complexity_level?: string;
  forbidden_elements?: string;
}

export interface ThemeImageRules {
  image_style_prompt?: string;
  image_negative_prompt?: string;
  image_color_palette?: string;
}

export interface ImagePromptResult {
  prompt: string;
  negative_prompt: string;
  label: string;  // 'cover' | 'scene_1' | 'scene_2' | 'scene_3'
}

// ─── Constants ───────────────────────────────────────────────────

const NO_TEXT_INSTRUCTION = 'NO TEXT, NO LETTERS, NO WORDS, NO WRITING, NO NUMBERS, NO SIGNS, NO LABELS, NO CAPTIONS, NO SPEECH BUBBLES anywhere in the image.';

// ─── Age Modifier (fine-grained, per year) ───────────────────────

/**
 * Age-specific style modifier based on the EXACT age of the child.
 * The DB provides broad age groups (4-6, 7-9, 10-12), but a 6-year-old
 * should see different images than a 9-year-old.
 */
function getAgeModifier(age: number): string {
  if (age <= 5) return 'Art style: soft picture book for very young children. Extremely cute, round, simple. Bright cheerful colors. Everything looks safe and friendly.';
  if (age === 6) return 'Art style: colorful picture book illustration. Cute but not babyish. Friendly characters with big eyes. Warm bright colors.';
  if (age === 7) return 'Art style: modern children book illustration. Characters look capable and curious. Slightly dynamic poses. Vibrant rich colors.';
  if (age === 8) return 'Art style: adventure cartoon illustration. Characters look confident and cool. Action-ready poses. Bold dynamic colors with good contrast. NOT cute or babyish.';
  if (age === 9) return 'Art style: detailed cartoon with comic book influence. Characters look brave and independent. Dynamic exciting compositions. Strong confident expressions. Cool factor high.';
  if (age === 10) return 'Art style: graphic novel illustration. Characters look like real pre-teens with attitude and personality. Atmospheric moody lighting. Sophisticated color palette. Cinematic compositions.';
  if (age === 11) return 'Art style: young adult graphic novel. Semi-realistic characters with individual style. Dramatic lighting and angles. Complex emotions visible. Cool and mature aesthetic.';
  return 'Art style: young adult illustration. Realistic proportions, atmospheric, cinematic. Characters look like teenagers. Sophisticated visual storytelling.'; // 12+
}

// ─── Main: buildImagePrompts ─────────────────────────────────────

/**
 * Builds final image prompts from image_plan + DB rules.
 * Returns cover + scene prompts.
 */
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge: number,
): ImagePromptResult[] {
  const results: ImagePromptResult[] = [];

  // ═══ Age modifier (fine-grained, per year) ═══
  const ageModifier = getAgeModifier(childAge);

  // ═══ Shared style parts (same for ALL images) ═══
  const styleBlock = [
    ageModifier,  // ← Age modifier first (highest priority)
    themeImageRules.image_style_prompt,
    ageStyleRules.style_prompt,
    ageStyleRules.character_style,
    ageStyleRules.complexity_level,
    themeImageRules.image_color_palette || ageStyleRules.color_palette,
  ].filter(Boolean).join('. ');

  const negativeBlock = [
    themeImageRules.image_negative_prompt,
    ageStyleRules.negative_prompt,
    ageStyleRules.forbidden_elements,
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');

  // ═══ Cover image (atmospheric, no specific scene) ═══
  const coverPrompt = [
    'Children book cover illustration.',
    `Characters: ${imagePlan.character_anchor}`,
    `Setting: ${imagePlan.world_anchor}`,
    'The character(s) in a calm, inviting pose in their environment. Atmospheric and welcoming.',
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].join('\n');

  results.push({
    prompt: coverPrompt,
    negative_prompt: negativeBlock,
    label: 'cover',
  });

  // ═══ Scene images (1-3, showing story arc) ═══
  for (const scene of imagePlan.scenes) {
    const scenePrompt = [
      'Children book illustration, interior page.',
      `Characters: ${imagePlan.character_anchor}`,
      `Setting: ${imagePlan.world_anchor}`,
      `Scene: ${scene.description}`,
      `Emotional expression: ${scene.emotion}`,
      `Style: ${styleBlock}`,
      NO_TEXT_INSTRUCTION,
    ].join('\n');

    results.push({
      prompt: scenePrompt,
      negative_prompt: negativeBlock,
      label: `scene_${scene.scene_id}`,
    });
  }

  return results;
}

// ─── Fallback: simple cover prompt ───────────────────────────────

/**
 * Fallback: If no image_plan available, build a simple prompt
 * from the story title (previous behavior).
 */
export function buildFallbackImagePrompt(
  storyTitle: string,
  characterDescription: string,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
): ImagePromptResult {
  const styleBlock = [
    themeImageRules.image_style_prompt,
    ageStyleRules.style_prompt,
    ageStyleRules.character_style,
  ].filter(Boolean).join('. ');

  const negativeBlock = [
    themeImageRules.image_negative_prompt,
    ageStyleRules.negative_prompt,
    ageStyleRules.forbidden_elements,
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature',
  ].filter(Boolean).join(', ');

  const prompt = [
    'Children book cover illustration.',
    characterDescription,
    `Title theme: ${storyTitle}`,
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].join('\n');

  return {
    prompt,
    negative_prompt: negativeBlock,
    label: 'cover',
  };
}

// ─── DB Query Helper ─────────────────────────────────────────────

/**
 * Load image style rules from DB (age-based + theme-based).
 */
export async function loadImageRules(
  supabase: any,
  ageGroup: string,
  themeKey: string | null,
  language: string,
): Promise<{ ageRules: ImageStyleRules; themeRules: ThemeImageRules }> {

  // 1. image_style_rules by age group
  const { data: ageData } = await supabase
    .from('image_style_rules')
    .select('*')
    .eq('age_group', ageGroup)
    .is('theme_key', null)  // General rules (not theme-specific)
    .maybeSingle();

  // 2. theme_rules image columns (by theme_key + language)
  let themeData = null;
  if (themeKey && themeKey !== 'surprise') {
    const { data } = await supabase
      .from('theme_rules')
      .select('image_style_prompt, image_negative_prompt, image_color_palette')
      .eq('theme_key', themeKey)
      .eq('language', language)
      .maybeSingle();
    themeData = data;
  }

  return {
    ageRules: ageData || {},
    themeRules: themeData || {},
  };
}
