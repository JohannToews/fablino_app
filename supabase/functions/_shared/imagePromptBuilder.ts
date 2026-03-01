/**
 * imagePromptBuilder.ts – Block 2.4 + Phase 3 (Series Visual Consistency)
 * Builds final image prompts from LLM image_plan + DB style rules.
 * Handles cover + scene images with age-appropriate styling.
 * Phase 3: Adds Visual Style Sheet prefix + Episode Mood for series consistency.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface CharacterSheetEntry {
  name: string;
  role: 'protagonist' | 'sidekick' | 'villain' | 'family' | 'friend' | 'secondary';
  full_anchor: string;
  props?: string[];
}

export interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: Array<{
    scene_id: number;
    story_position?: string;
    description: string;
    emotion: string;
    key_elements?: string[];
    target_paragraph?: number;
    characters_present?: string[];
    camera?: string;
  }>;
  character_sheet?: CharacterSheetEntry[];
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

/** Appended to every image negative prompt so Imagen does not render a physical book (spine, pages, borders). */
const NO_PHYSICAL_BOOK_NEGATIVE = 'Do NOT render as a physical book, open book, book pages, or book spread. No book spine, page edges, white borders, grey background, or any frame. Fill the entire square canvas edge-to-edge with no margins.';

// ─── Age Modifier (fine-grained, per year) ───────────────────────

/**
 * Age-specific style modifier based on the EXACT age of the child.
 * The DB provides broad age groups (4-6, 7-9, 10-12), but a 6-year-old
 * should see different images than a 9-year-old.
 */
function getAgeModifierFallback(age: number): string {
  if (age <= 5) return 'Art style: soft children\'s illustration for very young children. Extremely cute, round, simple. Bright cheerful colors. Everything looks safe and friendly.';
  if (age === 6) return 'Art style: colorful children\'s illustration style. Cute but not babyish. Friendly characters with big eyes. Warm bright colors.';
  if (age === 7) return 'Art style: modern digital illustration for children. Characters look capable and curious. Slightly dynamic poses. Vibrant rich colors.';
  if (age === 8) return 'Art style: adventure cartoon illustration. Characters look confident and cool. Action-ready poses. Bold dynamic colors with good contrast. NOT cute or babyish.';
  if (age === 9) return 'Art style: detailed cartoon with comic influence. Characters look brave and independent. Dynamic exciting compositions. Strong confident expressions. Cool factor high.';
  if (age === 10) return 'Art style: graphic novel illustration. Characters look like real pre-teens with attitude and personality. Atmospheric moody lighting. Sophisticated color palette. Cinematic compositions.';
  if (age === 11) return 'Art style: young adult graphic novel. Semi-realistic characters with individual style. Dramatic lighting and angles. Complex emotions visible. Cool and mature aesthetic.';
  return 'Art style: young adult illustration. Realistic proportions, atmospheric, cinematic. Characters look like teenagers. Sophisticated visual storytelling.'; // 12+
}

// ─── DB-backed style resolver ────────────────────────────────────

/**
 * Resolves image style from the image_styles DB table.
 * Priority: preferredStyleKey (if age-appropriate) → default for age → fallback.
 */
export async function getStyleForAge(
  supabase: any,
  age: number,
  preferredStyleKey?: string | null
): Promise<{
  styleKey: string;
  promptSnippet: string;
  ageModifier: string;
  negative_prompt?: string;
  consistency_suffix?: string;
}> {
  const ageGroup = age <= 7 ? '6-7' : age <= 9 ? '8-9' : '10-11';

  try {
    // 1. If kid has a preference AND the style is age-appropriate
    if (preferredStyleKey) {
      const { data: preferred } = await supabase
        .from('image_styles')
        .select('*')
        .eq('style_key', preferredStyleKey)
        .eq('is_active', true)
        .contains('age_groups', [ageGroup])
        .maybeSingle();

      if (preferred) {
        return {
          styleKey: preferred.style_key,
          promptSnippet: preferred.imagen_prompt_snippet,
          ageModifier: preferred.age_modifiers?.[ageGroup] || '',
          negative_prompt: preferred.negative_prompt || undefined,
          consistency_suffix: preferred.consistency_suffix || undefined,
        };
      }
    }

    // 2. Default style for this age group
    const { data: defaultStyle } = await supabase
      .from('image_styles')
      .select('*')
      .eq('is_active', true)
      .contains('default_for_ages', [ageGroup])
      .order('sort_order')
      .limit(1)
      .maybeSingle();

    if (defaultStyle) {
      return {
        styleKey: defaultStyle.style_key,
        promptSnippet: defaultStyle.imagen_prompt_snippet,
        ageModifier: defaultStyle.age_modifiers?.[ageGroup] || '',
        negative_prompt: defaultStyle.negative_prompt || undefined,
        consistency_suffix: defaultStyle.consistency_suffix || undefined,
      };
    }
  } catch (err) {
    console.error('[imagePromptBuilder] DB lookup failed:', err);
  }

  // 3. Hardcoded fallback (uses renamed old function)
  return {
    styleKey: 'fallback',
    promptSnippet: getAgeModifierFallback(age),
    ageModifier: '',
  };
}

// ─── V2: Character sheet + story moments + camera ─────────────────

/**
 * Build a single scene image prompt using character_sheet and camera.
 */
export function buildSceneImagePromptV2(
  scene: {
    description: string;
    characters_present?: string[];
    camera: string;
    emotion?: string;
  },
  characterSheet: CharacterSheetEntry[],
  worldAnchor: string,
  styleBlock: string,
  negativePrompt: string,
  ageModifier: string,
  protagonistGender?: string
): string {
  const characters_present = scene.characters_present ?? [];
  const characterLines = characters_present
    .map((name) => {
      const char = characterSheet.find((c) => c.name === name);
      if (!char) return null;
      return `${char.role.toUpperCase()} — ${char.name}:\n${char.full_anchor}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const protagonistInScene = characters_present.some((name) => {
    const char = characterSheet.find((c) => c.name === name);
    return char?.role === 'protagonist';
  });
  const genderClarity =
    protagonistInScene && protagonistGender
      ? `\nThe protagonist must be clearly recognizable as a ${protagonistGender} regardless of hair length or hairstyle.`
      : '';

  return `=== CHARACTER REFERENCE (MUST MATCH EXACTLY) ===
${characterLines}

CRITICAL: Every character MUST look EXACTLY as described above.
Do not modify, add, or omit any visual detail — especially clothing, hair, and skin tone.
Characters not listed above must NOT appear in the image.${genderClarity}
=== END CHARACTER REFERENCE ===

CAMERA: ${scene.camera}

SCENE: ${scene.description}

ATMOSPHERE: ${worldAnchor}

STYLE: ${styleBlock}
${NO_TEXT_INSTRUCTION}

NEGATIVE: ${negativePrompt}, inconsistent character appearance, different clothing than described, wrong hair color, wrong skin tone, wrong eye color, extra characters not in scene`;
}

/**
 * Build cover image prompt using character_sheet.
 */
export function buildCoverImagePromptV2(
  title: string,
  characterSheet: CharacterSheetEntry[],
  worldAnchor: string,
  styleBlock: string,
  negativePrompt: string,
  ageModifier: string,
  protagonistGender?: string
): string {
  const protagonist = characterSheet.find((c) => c.role === 'protagonist');
  const sidekick = characterSheet.find((c) => c.role === 'sidekick');

  let charLines = '';
  if (protagonist) charLines += `PROTAGONIST — ${protagonist.name}:\n${protagonist.full_anchor}\n\n`;
  if (sidekick) charLines += `SIDEKICK — ${sidekick.name}:\n${sidekick.full_anchor}\n\n`;

  const genderClarity = protagonistGender
    ? `\nThe protagonist must be clearly recognizable as a ${protagonistGender}.`
    : '';

  return `=== CHARACTER REFERENCE (MUST MATCH EXACTLY) ===
${charLines}CRITICAL: Characters MUST look EXACTLY as described above.${genderClarity}
=== END CHARACTER REFERENCE ===

CAMERA: medium wide shot, slight low angle

BOOK COVER for "${title}".
Composition: Character(s) prominent in foreground, setting visible behind.
Setting atmosphere: ${worldAnchor}
Mood: Inviting, adventurous, age-appropriate. The image should make a child want to read this story.

STYLE: ${styleBlock}
${NO_TEXT_INSTRUCTION}

NEGATIVE: ${negativePrompt}, inconsistent character appearance, text, title, letters, words`;
}

// ─── Main: buildImagePrompts ─────────────────────────────────────

/**
 * Builds final image prompts from image_plan + DB rules.
 * When image_plan.character_sheet is present, uses V2 path (character sheet + camera).
 * Otherwise uses legacy path (character_anchor + scenes).
 * Phase 3: Optional seriesContext adds Visual Style Sheet prefix + Episode Mood.
 */
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules | null | undefined,
  childAge: number,
  seriesContext?: SeriesImageContext,
  imageStyleOverride?: { promptSnippet: string; ageModifier: string; negative_prompt?: string; consistency_suffix?: string },
  options?: { title?: string; protagonistGender?: string },
): ImagePromptResult[] {
  const characterSheet = (imagePlan as any).character_sheet as CharacterSheetEntry[] | undefined;
  const hasCharacterSheet = Array.isArray(characterSheet) && characterSheet.length > 0;

  if (hasCharacterSheet && imagePlan.scenes?.length) {
    // V2 path: character sheet + story moments + camera
    const ageModifier = imageStyleOverride
      ? `${imageStyleOverride.promptSnippet}. ${imageStyleOverride.ageModifier}`.replace(/\.\s*$/, '')
      : getAgeModifierFallback(childAge);
    const seriesPrefix = seriesContext ? buildSeriesStylePrefix(seriesContext) : '';
    const styleBlock = seriesContext
      ? [
          ageModifier,
          seriesContext.visualStyleSheet.world_style,
          ...(imageStyleOverride ? [] : [ageStyleRules.color_palette]),
          EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5],
        ].filter(Boolean).join('. ')
      : [
          ageModifier,
          ...(imageStyleOverride ? [] : [ageStyleRules.style_prompt, ageStyleRules.color_palette]),
        ].filter(Boolean).join('. ');
    const negativeBlock = [
      NO_PHYSICAL_BOOK_NEGATIVE,
      imageStyleOverride?.negative_prompt,
      ...(imageStyleOverride ? [] : [ageStyleRules.negative_prompt]),
      'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
    ].filter(Boolean).join(', ');

    const title = options?.title ?? 'Untitled Story';
    const protagonistGender = options?.protagonistGender;
    const worldAnchor = imagePlan.world_anchor ?? '';

    const results: ImagePromptResult[] = [];

    const coverPrompt = buildCoverImagePromptV2(
      title,
      characterSheet,
      worldAnchor,
      seriesPrefix ? `${seriesPrefix}\n\n${styleBlock}` : styleBlock,
      negativeBlock,
      ageModifier,
      protagonistGender
    );
    results.push({ prompt: coverPrompt, negative_prompt: negativeBlock, label: 'cover' });

    for (const scene of imagePlan.scenes) {
      const scenePrompt = buildSceneImagePromptV2(
        {
          description: scene.description,
          characters_present: scene.characters_present,
          camera: scene.camera ?? 'medium shot, eye level',
          emotion: scene.emotion,
        },
        characterSheet,
        worldAnchor,
        seriesPrefix ? `${seriesPrefix}\n\n${styleBlock}` : styleBlock,
        negativeBlock,
        ageModifier,
        protagonistGender
      );
      results.push({
        prompt: scenePrompt,
        negative_prompt: negativeBlock,
        label: `scene_${scene.scene_id}`,
      });
    }

    console.log('[IMAGE-PROMPTS] V2 path:', results.length, 'prompts (character_sheet + camera)');
    return results;
  }

  // ═══ LEGACY PATH ═══
  const results: ImagePromptResult[] = [];

  console.log('[IMAGE-PROMPTS] buildImagePrompts called (legacy):', JSON.stringify({
    hasSeriesContext: !!seriesContext,
    hasStyleSheet: !!seriesContext?.visualStyleSheet,
    worldStyle: seriesContext?.visualStyleSheet?.world_style?.substring(0, 80) ?? 'none',
    scenesCount: imagePlan?.scenes?.length ?? 0,
    childAge
  }));

  const ageModifier = imageStyleOverride
    ? `${imageStyleOverride.promptSnippet}. ${imageStyleOverride.ageModifier}`.replace(/\.\s*$/, '')
    : getAgeModifierFallback(childAge);

  const seriesPrefix = seriesContext ? buildSeriesStylePrefix(seriesContext) : '';

  const styleBlock = seriesContext
    ? [
        ageModifier,
        seriesContext.visualStyleSheet.world_style,
        ...(imageStyleOverride ? [] : [ageStyleRules.color_palette]),
        EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5],
      ].filter(Boolean).join('. ')
    : [
        ageModifier,
        ...(imageStyleOverride ? [] : [ageStyleRules.style_prompt, ageStyleRules.color_palette]),
      ].filter(Boolean).join('. ');

  const negativeBlock = [
    NO_PHYSICAL_BOOK_NEGATIVE,
    imageStyleOverride?.negative_prompt,
    ...(imageStyleOverride ? [] : [ageStyleRules.negative_prompt]),
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');

  // ═══ Cover image (atmospheric, no specific scene) ═══
  const coverLines = [
    // Phase 3: Series prefix first (if available)
    seriesPrefix,
    'Children book cover illustration.',
      `Characters: ${imagePlan.character_anchor}`,
      `IMPORTANT: The child must be clearly recognizable as the described gender regardless of hair length or hairstyle. Maintain gender-typical facial features, body shape, and overall appearance.`,
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
      'Children\'s illustration, full-bleed interior scene. Single image filling the entire square frame, no borders or book frame.',
      `Characters: ${imagePlan.character_anchor}`,
      `IMPORTANT: The child must be clearly recognizable as the described gender regardless of hair length or hairstyle. Maintain gender-typical facial features, body shape, and overall appearance.`,
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
  themeImageRules: ThemeImageRules | null | undefined,
  childAge?: number,
  seriesContext?: SeriesImageContext,
  imageStyleOverride?: { promptSnippet: string; ageModifier: string; negative_prompt?: string; consistency_suffix?: string },
): ImagePromptResult {
  const ageModifier = imageStyleOverride
    ? `${imageStyleOverride.promptSnippet}. ${imageStyleOverride.ageModifier}`.replace(/\.\s*$/, '')
    : (childAge ? getAgeModifierFallback(childAge) : '');

  // Same series vs. single-story logic as buildImagePrompts (image_style_rules only when no override)
  const styleBlock = seriesContext
    ? [
        ageModifier,
        seriesContext.visualStyleSheet.world_style,
        ...(imageStyleOverride ? [] : [ageStyleRules.color_palette]),
        EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5],
      ].filter(Boolean).join('. ')
    : [
        ageModifier,
        ...(imageStyleOverride ? [] : [ageStyleRules.style_prompt, ageStyleRules.color_palette]),
      ].filter(Boolean).join('. ');

  const negativeBlock = [
    NO_PHYSICAL_BOOK_NEGATIVE,
    imageStyleOverride?.negative_prompt,
    ...(imageStyleOverride ? [] : [ageStyleRules.negative_prompt]),
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');

  const seriesPrefix = seriesContext ? buildSeriesStylePrefix(seriesContext) : '';

  const prompt = [
    seriesPrefix,
    'Children\'s illustration, full-bleed cover art. Single image filling the entire square frame, no borders or book frame.',
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
): Promise<{ ageRules: ImageStyleRules }> {

  // 1. image_style_rules by age group
  const { data: ageData } = await supabase
    .from('image_style_rules')
    .select('*')
    .eq('age_group', ageGroup)
    .is('theme_key', null)  // General rules (not theme-specific)
    .maybeSingle();

  // theme_rules image columns (image_style_prompt, etc.) removed: in live DB they are
  // nonexistent or always null; image style comes from image_styles + image_style_rules only.
  return {
    ageRules: ageData || {},
  };
}
