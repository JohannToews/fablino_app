/**
 * imagePromptBuilder.ts – Block 2.4 + Phase 3 (Series Visual Consistency)
 * Builds final image prompts from LLM image_plan + DB style rules.
 * Handles cover + scene images with age-appropriate styling.
 * Phase 3: Adds Visual Style Sheet prefix + Episode Mood for series consistency.
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
  style_prompt?: string;      // From image_style_rules.style_prompt (exists in DB)
  negative_prompt?: string;   // From image_style_rules.negative_prompt (exists in DB)
  color_palette?: string;     // From image_style_rules.color_palette (exists in DB)
  // Removed: character_style, complexity_level, forbidden_elements – not in DB schema
}

export interface ThemeImageRules {
  // These columns don't exist in theme_rules yet (planned for Phase 1.3).
  // Kept as optional interface fields so the code compiles, but they will
  // always be undefined/null until the DB migration adds them.
  image_style_prompt?: string;
  image_negative_prompt?: string;
  image_color_palette?: string;
}

export interface ImagePromptResult {
  prompt: string;
  negative_prompt: string;
  label: string;  // 'cover' | 'scene_1' | 'scene_2' | 'scene_3'
}

// ─── Phase 3: Visual Style Sheet for series consistency ──────────

export interface VisualStyleSheet {
  characters: Record<string, string>;  // Name → english visual description
  world_style: string;                 // World visual style
  recurring_visual: string;            // Recurring visual signature element
}

export interface SeriesImageContext {
  visualStyleSheet: VisualStyleSheet;
  episodeNumber: number;  // 1-5
}

// ─── Phase 3: Episode Mood Modifier ─────────────────────────────

const EPISODE_MOOD: Record<number, string> = {
  1: 'Bright, inviting, sense of wonder and discovery. Warm color palette.',
  2: 'Growing tension, first shadows appear. Still warm but with contrast.',
  3: 'Dramatic shift. Strong contrast between light and dark. Revelation mood.',
  4: 'Darker palette, isolation, emotional weight. Single light source, muted colors.',
  5: 'Triumphant warmth returns. Brighter than Episode 1. Transformation visible.',
};

/**
 * Build the Series Visual Consistency prefix block.
 * Prepended to every image prompt when seriesContext is provided.
 */
function buildSeriesStylePrefix(ctx: SeriesImageContext): string {
  const vss = ctx.visualStyleSheet;
  const lines: string[] = [];

  lines.push(`SERIES VISUAL CONSISTENCY (Episode ${ctx.episodeNumber} of 5):`);

  // Character descriptions
  if (vss.characters && Object.keys(vss.characters).length > 0) {
    const charDescs = Object.entries(vss.characters)
      .map(([name, desc]) => `${name}: ${desc}`)
      .join('. ');
    lines.push(`Characters: ${charDescs}`);
  }

  // World style (also in styleBlock, but included here for emphasis)
  if (vss.world_style) {
    lines.push(`World style: ${vss.world_style}`);
  }

  // Recurring visual element
  if (vss.recurring_visual) {
    lines.push(`Recurring element: ${vss.recurring_visual}`);
  }

  lines.push('CRITICAL: Maintain EXACT character appearances and world style across all images.');

  return lines.join('\n');
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
 * Phase 3: Optional seriesContext adds Visual Style Sheet prefix + Episode Mood.
 */
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge: number,
  seriesContext?: SeriesImageContext,
): ImagePromptResult[] {
  const results: ImagePromptResult[] = [];

  console.log('[IMAGE-PROMPTS] buildImagePrompts called:', JSON.stringify({
    hasSeriesContext: !!seriesContext,
    hasStyleSheet: !!seriesContext?.visualStyleSheet,
    worldStyle: seriesContext?.visualStyleSheet?.world_style?.substring(0, 80) ?? 'none',
    scenesCount: imagePlan?.scenes?.length ?? 0,
    childAge
  }));

  // ═══ Age modifier (fine-grained, per year) ═══
  const ageModifier = getAgeModifier(childAge);

  // ═══ Phase 3: Series visual consistency prefix ═══
  const seriesPrefix = seriesContext ? buildSeriesStylePrefix(seriesContext) : '';

  // ═══ Shared style parts ═══
  // For series: ageModifier + world_style from StyleSheet + color palette + episode mood
  //   → SKIP ageStyleRules.style_prompt (e.g. "Peppa Pig") which clashes with the StyleSheet
  // For single stories: full stack as before
  const styleBlock = seriesContext
    ? [
        ageModifier,                                        // ✅ Fine-grained per year (e.g. "Cute but not babyish")
        seriesContext.visualStyleSheet.world_style,          // ✅ Series world style from Ep1 StyleSheet
        ageStyleRules.color_palette,                         // ✅ Color palette is safe
        EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5], // ✅ Episode mood
      ].filter(Boolean).join('. ')
    : [
        ageModifier,                                        // Age modifier first (highest priority)
        themeImageRules.image_style_prompt,                  // Theme-specific style (null until Phase 1.3)
        ageStyleRules.style_prompt,                          // DB: image_style_rules.style_prompt
        themeImageRules.image_color_palette || ageStyleRules.color_palette,  // Color palette
      ].filter(Boolean).join('. ');

  const negativeBlock = [
    themeImageRules.image_negative_prompt,              // Theme-specific negatives (null until Phase 1.3)
    ageStyleRules.negative_prompt,                      // DB: image_style_rules.negative_prompt
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');

  // ═══ Cover image (atmospheric, no specific scene) ═══
  const coverLines = [
    // Phase 3: Series prefix first (if available)
    seriesPrefix,
    'Children book cover illustration.',
    `Characters: ${imagePlan.character_anchor}`,
    `Setting: ${imagePlan.world_anchor}`,
    'The character(s) in a calm, inviting pose in their environment. Atmospheric and welcoming.',
    // Phase 3: Series cover hint
    seriesContext
      ? `This is the Episode ${seriesContext.episodeNumber} cover of a 5-episode series. Maintain exact same visual style as all other episode covers.`
      : '',
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].filter(Boolean);

  results.push({
    prompt: coverLines.join('\n'),
    negative_prompt: negativeBlock,
    label: 'cover',
  });

  // ═══ Scene images (1-3, showing story arc) ═══
  for (const scene of imagePlan.scenes) {
    const sceneLines = [
      // Phase 3: Series prefix first (if available)
      seriesPrefix,
      'Children book illustration, interior page.',
      `Characters: ${imagePlan.character_anchor}`,
      `Setting: ${imagePlan.world_anchor}`,
      `Scene: ${scene.description}`,
      `Emotional expression: ${scene.emotion}`,
      `Style: ${styleBlock}`,
      NO_TEXT_INSTRUCTION,
    ].filter(Boolean);

    results.push({
      prompt: sceneLines.join('\n'),
      negative_prompt: negativeBlock,
      label: `scene_${scene.scene_id}`,
    });
  }

  console.log('[IMAGE-PROMPTS] Generated prompts:', JSON.stringify(
    results.map((r, i) => ({
      index: i,
      type: i === 0 ? 'COVER' : `SCENE_${i}`,
      first400chars: r.prompt?.substring(0, 400) ?? 'NO PROMPT'
    }))
  ));

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
  childAge?: number,
  seriesContext?: SeriesImageContext,
): ImagePromptResult {
  const ageModifier = childAge ? getAgeModifier(childAge) : '';

  // Same series vs. single-story logic as buildImagePrompts
  const styleBlock = seriesContext
    ? [
        ageModifier,
        seriesContext.visualStyleSheet.world_style,
        ageStyleRules.color_palette,
        EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5],
      ].filter(Boolean).join('. ')
    : [
        ageModifier,
        themeImageRules.image_style_prompt,
        ageStyleRules.style_prompt,
        ageStyleRules.color_palette,
      ].filter(Boolean).join('. ');

  const negativeBlock = [
    themeImageRules.image_negative_prompt,
    ageStyleRules.negative_prompt,
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');

  const seriesPrefix = seriesContext ? buildSeriesStylePrefix(seriesContext) : '';

  const prompt = [
    seriesPrefix,
    'Children book cover illustration.',
    characterDescription,
    `Title theme: ${storyTitle}`,
    seriesContext
      ? `This is the Episode ${seriesContext.episodeNumber} cover of a 5-episode series. Maintain exact same visual style as all other episode covers.`
      : '',
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].filter(Boolean).join('\n');

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
  // NOTE: image_style_prompt, image_negative_prompt, image_color_palette don't exist
  // in theme_rules yet (planned for Phase 1.3). This query will return null for those
  // columns but won't error since Supabase ignores missing columns in select.
  // Once the migration adds these columns, this query will automatically pick them up.
  let themeData: ThemeImageRules = {};
  if (themeKey && themeKey !== 'surprise') {
    try {
      const { data } = await supabase
        .from('theme_rules')
        .select('image_style_prompt, image_negative_prompt, image_color_palette')
        .eq('theme_key', themeKey)
        .eq('language', language)
        .maybeSingle();
      themeData = data || {};
    } catch {
      // Columns don't exist yet – expected until Phase 1.3 migration
      themeData = {};
    }
  }

  return {
    ageRules: ageData || {},
    themeRules: themeData || {},
  };
}
