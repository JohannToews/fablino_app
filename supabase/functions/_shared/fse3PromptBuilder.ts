/**
 * FSE3 Prompt Builder
 *
 * Template engine for the FSE3 multi-pass story generation pipeline.
 * Handles: placeholder replacement, conditional blocks, system prompt resolution.
 *
 * IMPORTANT: Conditionals are processed BEFORE placeholders, so placeholders
 * inside removed conditional blocks are never evaluated.
 */

import type {
  FSE3PipelineContext,
  FSE3Blueprint,
  FSE3LanguageConfig,
} from './fse3Types.ts';

// =============================================================================
// Main Function
// =============================================================================

/**
 * Build the final prompt for a given pass.
 *
 * @param passName - One of: 'interpreter', 'pass_0', 'pass_1', 'pass_2', 'pass_3', 'pass_4'
 * @param ctx - The pipeline context (may have additional dynamic properties from the pipeline)
 * @param templateOverride - Optional template override (for tests)
 * @returns { systemPrompt, userPrompt }
 */
export function buildFSE3Prompt(
  passName: string,
  ctx: FSE3PipelineContext & Record<string, any>,
  templateOverride?: string,
): { systemPrompt: string; userPrompt: string } {
  // 1. Load template
  const template = templateOverride || ctx.promptTemplates[passName];
  if (!template) {
    throw new Error(`[FSE3 PromptBuilder] No template found for pass: ${passName}`);
  }

  // 2. Process conditional blocks FIRST (before placeholder replacement)
  const conditions = buildConditions(ctx);
  let prompt = processConditionals(template, conditions);

  // 3. Replace all placeholders
  const replacements = buildReplacements(passName, ctx);
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }

  // 4. Load system prompt
  const systemPromptKey =
    ctx.promptTemplates[passName + '_system_key'] || 'system_prompt_core_v3';
  const systemPrompt = ctx.systemPrompts[systemPromptKey] || '';

  return { systemPrompt, userPrompt: prompt };
}

// =============================================================================
// Conditional Block Processing
// =============================================================================

/**
 * Process {{#IF KEY}}...{{/IF}} blocks.
 * If condition is true → keep content, remove tags.
 * If condition is false → remove entire block including content.
 */
export function processConditionals(
  template: string,
  conditions: Record<string, boolean>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(conditions)) {
    const regex = new RegExp(`\\{\\{#IF ${key}\\}\\}([\\s\\S]*?)\\{\\{\\/IF\\}\\}`, 'g');
    result = result.replace(regex, value ? '$1' : '');
  }
  return result;
}

/**
 * Build the conditions map from context.
 */
function buildConditions(ctx: FSE3PipelineContext & Record<string, any>): Record<string, boolean> {
  const sidekick = getSidekick(ctx);
  return {
    VILLAIN: ctx.villain !== null && ctx.villain !== undefined,
    WORLD_RULE:
      ctx.worldRule !== undefined &&
      ctx.worldRule !== 'none' &&
      ctx.worldRule !== '',
    SPECIAL_EFFECTS:
      ctx.specialEffects !== 'none' &&
      ctx.specialEffects !== '' &&
      ctx.specialEffects !== undefined,
    SPECIAL_EFFECTS_SUPERPOWERS: ctx.specialEffects === 'superpowers',
    NO_SPECIAL_EFFECTS:
      ctx.specialEffects === 'none' ||
      ctx.specialEffects === '' ||
      ctx.specialEffects === undefined,
    SIDEKICK: ctx.characters.length > 1,
    SIDEKICK_WITH_TRAIT:
      sidekick !== undefined &&
      sidekick.description !== undefined &&
      sidekick.description !== '',
    LANGUAGE_FR: ctx.storyLanguage === 'fr',
  };
}

// =============================================================================
// Placeholder Replacement
// =============================================================================

/**
 * Build the full replacements map for a given pass.
 * Missing values resolve to '' (empty string) — no crash.
 */
function buildReplacements(
  passName: string,
  ctx: FSE3PipelineContext & Record<string, any>,
): Record<string, string> {
  const lc = ctx.languageConfig;
  const bp = ctx.blueprint;
  const cv = ctx.chosenVariant;

  // Dynamic values for Pass 0 JSON examples
  const paragraphCount = ctx.paragraphCount ?? 7;
  const setupObjectCount = paragraphCount <= 6 ? 2 : 3;

  // Determine PREVIOUS_PASS_OUTPUT based on pass
  let previousPassOutput = '';
  if (passName === 'pass_2') previousPassOutput = ctx.pass1Output || '';
  else if (passName === 'pass_3') previousPassOutput = ctx.pass2Output || '';
  else if (passName === 'pass_4') previousPassOutput = ctx.pass3Output || '';

  // Path code segments for Pass 4
  const pathSegments = bp?.path_code?.split('->') || [];

  const replacements: Record<string, string> = {
    // --- Universal (all passes) ---
    STORY_LANGUAGE: ctx.storyLanguage || '',
    STORY_LANGUAGE_NAME: mapLanguageCode(ctx.storyLanguage),
    CHILD_NAME: ctx.kidName || '',
    CHILD_AGE: String(ctx.kidAge ?? ''),
    CHILD_GENDER: ctx.kidGender || '',
    READING_LEVEL: String(ctx.readingLevel ?? ''),
    READING_LEVEL_LABEL: mapReadingLevel(ctx.readingLevel),
    THEME: ctx.theme || '',
    WORD_COUNT_TARGET: String(ctx.wordCountTarget ?? ''),
    PARAGRAPH_COUNT: String(ctx.paragraphCount ?? ''),
    WORDS_PER_PARAGRAPH: ctx.paragraphCount
      ? String(Math.round((ctx.wordCountTarget || 0) / ctx.paragraphCount))
      : '',

    // --- Pass 0 complexity constraints ---
    MAX_SETUP_OBJECTS: String(ctx.maxSetupObjects ?? 2),
    SETUP_DEADLINE: String(ctx.setupDeadline ?? 3),
    RESOLUTION_PARAGRAPH: String(ctx.resolutionParagraph ?? (paragraphCount - 1)),
    MAX_CHARACTERS: String(ctx.maxCharacters ?? 3),
    MAX_PLOT_TWISTS: String(ctx.maxPlotTwists ?? 1),
    PLOT_COMPLEXITY: ctx.plotComplexity || 'medium',

    // --- Pass 0 dynamic JSON examples (match paragraphCount) ---
    SETUP_OBJECT_COUNT: String(setupObjectCount),
    SETUP_OBJECTS_EXAMPLE: Array(setupObjectCount).fill('"..."').join(', '),
    SKELETON_EXAMPLE: Array.from(
      { length: paragraphCount },
      (_, i) => `"P${i + 1}: ..."`,
    ).join(', '),
    STATE_TRACKING_EXAMPLE: Array.from(
      { length: paragraphCount - 1 },
      (_, i) => `"after_P${i + 1}": { "...": "..." }`,
    ).join(',\n    '),

    // --- Interpreter-specific ---
    CHARACTERS_JSON: safeStringify(ctx.characters),
    VILLAIN_JSON: safeStringify(ctx.villain),
    FREE_TEXT: ctx.freeText || '',
    SPECIAL_EFFECTS: ctx.specialEffects || '',
    AVAILABLE_SUBTYPES: formatSubtypes(ctx.availableSubtypes),
    AVAILABLE_EM_DRIVERS: formatAvailableEmDrivers(
      ctx.allowedEmDrivers || [],
      ctx.emDriverConfig || {},
      ctx.storyLanguage,
    ),
    CHILD_ELEMENTS_SUMMARY: buildChildElementsSummary(ctx),
    SIDEKICK_NAME: getSidekickName(ctx) || '',
    SIDEKICK_TRAIT: getSidekickTrait(ctx) || '',

    // --- Interpreter: path labels per em_driver (set by pipeline before call) ---
    SPANNUNG_PATH_LABELS: ctx.interpreterPathLabels?.['spannung'] || '- (keine verfügbar)',
    HUMOR_PATH_LABELS: ctx.interpreterPathLabels?.['humor'] || '- (keine verfügbar)',
    SURPRISE_PATH_LABELS: ctx.interpreterPathLabels?.[
      // surprise = the third driver (not spannung, not humor)
      (ctx.allowedEmDrivers || []).find((d: string) => d !== 'spannung' && d !== 'humor') || 'staunen'
    ] || '- (keine verfügbar)',

    // --- Pass 0-specific ---
    CHOSEN_VARIANT_ROUTING: cv?.routing ? safeStringify(cv.routing) : '',
    AVAILABLE_PATHS: formatPaths(ctx.availablePaths),
    AGE_GROUP: inferAgeGroup(ctx.kidAge),
    CHARACTERS_SUMMARY: formatCharactersSummary(ctx),
    VILLAIN_DESCRIPTION: ctx.villain
      ? (ctx.villain.description && ctx.villain.description !== 'undefined'
          ? `${ctx.villain.name}: ${ctx.villain.description}`
          : ctx.villain.name)
      : '',
    PROTAGONIST_NAME_LOWER: (ctx.kidName || '').toLowerCase(),
    SIDEKICK_NAME_LOWER: (getSidekickName(ctx) || '').toLowerCase(),

    // --- Pass 0: fixed emotional coloring from em_driver config ---
    EMOTIONAL_COLORING_OPTIONS: (ctx.fixedEmotionalColoring && ctx.fixedEmotionalColoring.length > 0)
      ? formatEmCodesWithDescription(ctx.fixedEmotionalColoring, ctx.emCodeMapping)
      : 'EM-H, EM-T, EM-J, EM-W, EM-D, EM-C',

    // --- Pass 1-specific (set by pipeline code via spread) ---
    WRITING_STYLE_CONSTRAINTS: getWritingStyleConstraints(ctx.readingLevel),
    STORY_ARC_PLAINTEXT: ctx.storyArcPlaintext || '',
    EMOTIONAL_TONE_PLAINTEXT: ctx.emotionalTonePlaintext || '',
    EMOTIONAL_COLORING: resolveEmCode(bp?.emotional_coloring, ctx.emCodeMapping),
    EMOTIONAL_SECONDARY: resolveEmCode(bp?.emotional_secondary, ctx.emCodeMapping),
    WORLD_RULE_TEXT: ctx.worldRule || '',
    BLUEPRINT_PLAINTEXT: ctx.blueprintPlaintext || '',
    SETUP_OBJECTS_LIST: ctx.setupObjectsList || '',
    FORBIDDEN_LIST: ctx.forbiddenList || '',
    CHARACTERS_CONTEXT: formatCharactersContext(ctx),

    // --- Pass 2-specific ---
    LANGUAGE_CONSTRAINTS: lc ? formatLanguageConstraints(lc) : '',
    MAX_SENTENCE_LENGTH: lc ? String(lc.max_sentence_length) : '',
    PREVIOUS_PASS_OUTPUT: previousPassOutput,

    // --- Pass 3-specific ---
    DIALOGUE_EXAMPLE_SPOKEN: unescapeQuotes(lc?.dialogue_example_spoken || ''),
    DIALOGUE_EXAMPLE_THOUGHT: unescapeQuotes(lc?.dialogue_example_thought || ''),
    DIALOGUE_FORMAT: lc?.dialogue_format || '',
    RHYTHM_EXAMPLE_RIGHT: unescapeQuotes(lc?.rhythm_example_right || ''),
    RHYTHM_EXAMPLE_WRONG: unescapeQuotes(lc?.rhythm_example_wrong || ''),
    SCENIC_EXAMPLE_RIGHT: unescapeQuotes(lc?.scenic_example_right || ''),
    SCENIC_EXAMPLE_WRONG: unescapeQuotes(lc?.scenic_example_wrong || ''),

    // --- Pass 4-specific ---
    STORY_TITLE: ctx.storyTitle || '',
    STRUCTURE_BEGINNING: pathSegments[0]?.trim() || '',
    STRUCTURE_MIDDLE: pathSegments[1]?.trim() || '',
    STRUCTURE_ENDING: pathSegments[2]?.trim() || '',
    HUMOR_LEVEL: mapHumorFromDriver(cv?.routing?.primary_driver),
    EMOTIONAL_DEPTH: mapDepthFromDriver(cv?.routing?.primary_driver),
    MORAL_TOPIC: 'kindness and courage',
    CONCRETE_THEME: ctx.theme || '',
    QUESTION_COUNT: '5',
    QUESTION_DISTRIBUTION: getQuestionDistribution(ctx.readingLevel),
  };

  return replacements;
}

// =============================================================================
// Helper Functions (all exported)
// =============================================================================

/**
 * Map a language code to its English name.
 */
export function mapLanguageCode(code: string): string {
  const map: Record<string, string> = {
    de: 'German',
    fr: 'French',
    en: 'English',
    es: 'Spanish',
    tr: 'Turkish',
    ru: 'Russian',
    uk: 'Ukrainian',
    pl: 'Polish',
  };
  return map[code] || code || '';
}

/**
 * Map reading level to a human-readable label.
 */
export function mapReadingLevel(level: number): string {
  const map: Record<number, string> = {
    1: 'early reader',
    2: 'fluent reader',
    3: 'advanced reader',
  };
  return map[level] || 'fluent reader';
}

/**
 * Format subtypes as a numbered list: "1. subtype_key: description"
 */
export function formatSubtypes(subtypes: any[]): string {
  if (!subtypes || subtypes.length === 0) return '';
  return subtypes
    .map((s, i) => `${i + 1}. ${s.subtype_key || s.key || s.name}: ${s.description || ''}`)
    .join('\n');
}

/**
 * Format paths as a list: "code: label — writing_instructions"
 */
export function formatPaths(paths: any[]): string {
  if (!paths || paths.length === 0) return 'Use a standard 3-act structure: setup → escalation → resolution';
  return paths
    .map((p) => `- ${p.code || p.path_code} "${p.label}": ${p.writing_instructions || ''}`)
    .join('\n');
}

/**
 * Format EM-codes with their English label and description from emCodeMapping.
 * Example: "EM-T (Thrill — Ticking clock, mounting dread, false leads.)"
 */
export function formatEmCodesWithDescription(
  emCodes: string[],
  emCodeMapping: Record<string, { label: string; description: string }>,
): string {
  if (!emCodes || emCodes.length === 0) return '';
  return emCodes.map(code => {
    const entry = emCodeMapping[code];
    if (entry) {
      return `${code} (${entry.label} — ${entry.description})`;
    }
    return code;
  }).join(' or ');
}

/**
 * Format available emotional drivers as a numbered list for the interpreter prompt.
 * Example: "1. ⚡ Spannend (em_driver: "spannung", primary_driver: "suspense") — Nervenkitzel, Gefahr, Zeitdruck"
 */
export function formatAvailableEmDrivers(
  allowedDrivers: string[],
  emDriverConfig: Record<string, any>,
  storyLanguage: string,
): string {
  if (!allowedDrivers || allowedDrivers.length === 0) return '';
  return allowedDrivers.map((driver, i) => {
    const config = emDriverConfig[driver];
    if (!config) return '';
    const label = config.labels?.[storyLanguage] || config.labels?.['en'] || driver;
    return `${i + 1}. ${config.emoji} ${label} (em_driver: "${driver}", primary_driver: "${config.primary_driver}") — ${config.description}`;
  }).filter(Boolean).join('\n');
}

/**
 * Load path labels grouped by em_driver for the interpreter prompt.
 * Only loads labels (no writing_instructions) filtered by eligible age groups.
 *
 * @param supabase - Supabase client
 * @param kidAge - Child's age (number)
 * @param allowedEmDrivers - The allowed em_drivers for the current theme (e.g. ['spannung', 'humor', 'staunen'])
 * @returns Record with keys from allowedEmDrivers, values are formatted label lists
 */
export async function getPathLabelsForInterpreter(
  supabase: any,
  kidAge: number,
  allowedEmDrivers: string[],
): Promise<Record<string, string>> {
  const ageGroup = kidAge <= 7 ? '6-7' : kidAge <= 9 ? '8-9' : '10-11';
  const eligibleAgeGroups: Record<string, string[]> = {
    '6-7': ['CE1'],
    '8-9': ['CE1', 'CE2', 'CM1'],
    '10-11': ['CE1', 'CE2', 'CM1', 'CM2'],
  };

  const { data: pathRows } = await supabase
    .from('story_paths')
    .select('label, em_driver')
    .eq('is_active', true)
    .in('min_age_group', eligibleAgeGroups[ageGroup] || ['CE1', 'CE2', 'CM1', 'CM2'])
    .in('em_driver', allowedEmDrivers);

  // Group by em_driver
  const grouped: Record<string, string[]> = {};
  for (const driver of allowedEmDrivers) {
    grouped[driver] = [];
  }
  for (const row of (pathRows || [])) {
    if (row.em_driver && grouped[row.em_driver]) {
      grouped[row.em_driver].push(row.label);
    }
  }

  // Format as "- Label\n- Label" per driver
  const result: Record<string, string> = {};
  for (const driver of allowedEmDrivers) {
    const labels = grouped[driver] || [];
    result[driver] = labels.length > 0
      ? labels.map(l => `- ${l}`).join('\n')
      : '- (keine verfügbar)';
  }

  return result;
}

/**
 * Format characters as a plaintext summary (for Pass 0).
 * "Kid Name (protagonist, 9 years). Sidekick Name (sidekick, best friend, loves dinosaurs)."
 */
export function formatCharactersSummary(
  ctx: FSE3PipelineContext & Record<string, any>,
): string {
  if (!ctx.characters || ctx.characters.length === 0) return ctx.kidName || '';
  return ctx.characters
    .map((c: any) => {
      const parts: string[] = [c.name];
      const details: string[] = [];
      if (c.role) details.push(c.role);
      if (c.relation) details.push(c.relation);
      if (c.age) details.push(`${c.age} years`);
      if (c.description) details.push(c.description);
      if (details.length > 0) parts.push(`(${details.join(', ')})`);
      return parts.join(' ');
    })
    .join('. ') + '.';
}

/**
 * Format characters with appearance info (for Pass 1 and Pass 3).
 * Includes character anchors if available.
 */
export function formatCharactersContext(
  ctx: FSE3PipelineContext & Record<string, any>,
): string {
  const lines: string[] = [];

  // Protagonist
  lines.push(
    `${ctx.kidName} (protagonist, ${ctx.kidAge} years, ${ctx.kidGender})` +
    (ctx.kidAppearanceAnchor ? ` — Appearance: ${ctx.kidAppearanceAnchor}` : ''),
  );

  // Other characters (deduplicate protagonist by type, role, or name match)
  const kidNameLower = (ctx.kidName || '').trim().toLowerCase();
  if (ctx.characters) {
    for (const c of ctx.characters) {
      if (c.type === 'self' || c.type === 'me' || c.role === 'protagonist' || (c.name || '').trim().toLowerCase() === kidNameLower) continue;
      const parts: string[] = [c.name];
      const details: string[] = [];
      if (c.role) details.push(c.role);
      if (c.relation) details.push(c.relation);
      if (c.description) details.push(c.description);
      if (details.length > 0) parts.push(`(${details.join(', ')})`);

      // Find matching anchor
      const anchor = ctx.characterAnchors?.find(
        (a: any) => a.name === c.name || a.characterId === c.id,
      );
      if (anchor?.anchor) parts.push(`— Appearance: ${anchor.anchor}`);

      lines.push(parts.join(' '));
    }
  }

  return lines.join('\n- ');
}

/**
 * Build a summary string of all child-chosen elements.
 * "Mateo, Johann who loves dinosaurs, fire-breathing dragon, superpowers"
 */
export function buildChildElementsSummary(
  ctx: FSE3PipelineContext & Record<string, any>,
): string {
  const parts: string[] = [];

  // Kid name
  if (ctx.kidName) parts.push(ctx.kidName);

  // Characters (excluding self)
  if (ctx.characters) {
    for (const c of ctx.characters) {
      if (c.type === 'self' || c.type === 'me') continue;
      let desc = c.name;
      if (c.description) desc += ` who ${c.description}`;
      else if (c.relation) desc += ` (${c.relation})`;
      parts.push(desc);
    }
  }

  // Villain
  if (ctx.villain) {
    parts.push(ctx.villain.description || ctx.villain.name);
  }

  // Special effects
  if (ctx.specialEffects && ctx.specialEffects !== 'none') {
    parts.push(ctx.specialEffects);
  }

  return parts.join(', ');
}

/**
 * Get the first sidekick character (not type="self").
 */
function getSidekick(ctx: FSE3PipelineContext & Record<string, any>): any | undefined {
  if (!ctx.characters) return undefined;
  return ctx.characters.find((c: any) => c.type !== 'self');
}

/**
 * Get the sidekick's name.
 */
export function getSidekickName(
  ctx: FSE3PipelineContext & Record<string, any>,
): string | undefined {
  return getSidekick(ctx)?.name;
}

/**
 * Get the sidekick's description/trait.
 */
export function getSidekickTrait(
  ctx: FSE3PipelineContext & Record<string, any>,
): string | undefined {
  return getSidekick(ctx)?.description;
}

/**
 * Infer age group from age.
 */
export function inferAgeGroup(age: number): string {
  if (!age || age < 8) return '6-7';
  if (age < 10) return '8-9';
  return '10-11';
}

/**
 * Format all language constraints from the language config into a readable block.
 */
export function formatLanguageConstraints(config: FSE3LanguageConfig): string {
  const lines: string[] = [];
  lines.push(`Tense rules: ${config.tense_rules}`);
  lines.push(`Tense example: ${config.tense_example}`);
  lines.push(`Max sentence length: ${config.max_sentence_length} words`);
  lines.push(`Average sentence length: ${config.avg_sentence_length} words`);
  lines.push(`Vocabulary guidance: ${config.vocabulary_guidance}`);
  lines.push(`Max adjectives per sentence: ${config.adjective_limit}`);
  if (config.additional_rules) {
    lines.push(`Additional rules: ${config.additional_rules}`);
  }
  return lines.join('\n');
}

/**
 * Get writing style constraints for Pass 1 based on reading level.
 */
function getWritingStyleConstraints(readingLevel: number): string {
  const styles: Record<number, string> = {
    1: `WRITING STYLE — EARLY READER (CRITICAL):
Write for a child who just learned to read. Every sentence describes ONE action.
- Subject-verb-object. No subordinate clauses. No descriptions of feelings.
- Show through ACTIONS only. BAD: "Mateo was amazed." GOOD: "Mateo's eyes went wide."
- No atmosphere sentences. No inner monologue. No metaphors.
- Max 8 words per sentence. Only words a 7-year-old speaks daily.
- Dialogue: short, 3-5 words. "Da bist du!" not "Ich kann es kaum glauben, dass du hier bist!"
- Every paragraph: 3-4 sentences, each a concrete action.`,
    2: `WRITING STYLE — FLUENT READER:
Write for a confident young reader. Vary sentence length between short and medium.
- Mix action sentences with occasional short descriptions.
- Inner thoughts allowed but brief: "Das war seltsam, dachte Mia."
- Simple subordinate clauses okay (weil, dass, wenn). No nested clauses.
- Max 12 words per sentence. Vocabulary a 9-year-old knows.
- Dialogue: natural, 5-10 words. Can express feelings briefly.
- Every paragraph: 4-5 sentences, mostly action-driven.`,
    3: `WRITING STYLE — ADVANCED READER:
Write with literary quality. Vary rhythm — short punchy sentences next to longer flowing ones.
- Rich descriptions allowed but earned: each must reveal character or advance tension.
- Inner monologue and atmosphere are tools — use deliberately, not as filler.
- Complex sentences okay but one idea per sentence. No run-ons.
- Max 18 words per sentence. Extended vocabulary including abstract concepts.
- Dialogue: natural, can be longer, with subtext.
- Every paragraph: 4-6 sentences, balanced between action, dialogue, and description.`,
  };
  return styles[readingLevel] || styles[2];
}

/**
 * Get question distribution text based on reading level.
 */
export function getQuestionDistribution(level: number): string {
  if (level === 1) {
    return [
      'Q1: True/False/Not mentioned (3 options) — simple factual question',
      'Q2: What happened? (3 options) — sequence/plot question',
      'Q3: Who did what? (3 options) — character action question',
      'Q4: What was the object/item? (3 options) — detail recall',
      'Q5: How did it end? (3 options) — ending comprehension',
    ].join('\n');
  }
  if (level === 3) {
    return [
      'Q1: True/False/Not mentioned (3 options) — factual question',
      'Q2: Why did [character] do [action]? (4 options) — motivation/inference',
      'Q3: What would have happened if...? (4 options) — counterfactual reasoning',
      'Q4: What is the moral/lesson? (4 options) — theme comprehension',
      'Q5: How did [character] feel when...? (4 options) — emotional inference',
    ].join('\n');
  }
  // Level 2 (default)
  return [
    'Q1: True/False/Not mentioned (3 options) — factual question',
    'Q2: Why did [character] do [action]? (4 options) — motivation question',
    'Q3: What happened after...? (4 options) — sequence question',
    'Q4: What was the problem? (4 options) — conflict comprehension',
    'Q5: How did [character] solve it? (4 options) — resolution comprehension',
  ].join('\n');
}

/**
 * Map primary_driver to humor_level for Pass 4.
 */
function mapHumorFromDriver(driver: string | undefined): string {
  if (driver === 'humor') return 'high';
  if (driver === 'suspense') return 'low';
  return 'medium';
}

/**
 * Map primary_driver to emotional_depth for Pass 4.
 */
function mapDepthFromDriver(driver: string | undefined): string {
  if (driver === 'empathy') return 'deep';
  if (driver === 'humor') return 'light';
  return 'moderate';
}

// =============================================================================
// Blueprint Translation
// =============================================================================

/**
 * Translate blueprint codes into plaintext for Pass 1.
 *
 * - path_code → Klartext from ctx.availablePaths
 * - EM-codes → Klartext from ctx.emCodeMapping
 * - setup_objects → numbered list with introduced/payoff info
 * - plot_skeleton → numbered list
 * - forbidden_in_writer → bullet list
 */
export function translateBlueprint(
  blueprint: FSE3Blueprint,
  ctx: FSE3PipelineContext & Record<string, any>,
): {
  arc: string;
  emotion: string;
  setupObjects: string;
  skeleton: string;
  forbidden: string;
} {
  // Path code → plaintext from DB
  const pathRow = ctx.availablePaths?.find(
    (p: any) => p.code === blueprint.path_code || p.path_code === blueprint.path_code,
  );
  const arc = pathRow
    ? `${pathRow.label}: ${pathRow.writing_instructions || ''}`
    : blueprint.path_code;

  // EM-codes → plaintext from app_settings (uses resolveEmCode for robust prefix stripping)
  const primaryText = resolveEmCode(blueprint.emotional_coloring, ctx.emCodeMapping);
  const secondaryText = resolveEmCode(blueprint.emotional_secondary, ctx.emCodeMapping);
  const emotion = `Primary: ${primaryText}. Secondary: ${secondaryText}.`;

  // Setup objects → numbered list with introduced/payoff info from self_check
  const payoffMap = blueprint.self_check?.setup_payoff_map || [];
  const setupObjects = blueprint.setup_objects
    .map((obj, i) => {
      const payoff = payoffMap.find((m) => m.object === obj);
      if (payoff) {
        return `${i + 1}. ${obj} — introduced ${payoff.introduced_in}, payoff ${payoff.payoff_in}`;
      }
      return `${i + 1}. ${obj}`;
    })
    .join('\n');

  // Plot skeleton → numbered list (already has P1:, P2: prefixes)
  const skeleton = blueprint.plot_skeleton.join('\n');

  // Forbidden → bullet list
  const forbidden = blueprint.forbidden_in_writer.map((f) => `- ${f}`).join('\n');

  return { arc, emotion, setupObjects, skeleton, forbidden };
}

// =============================================================================
// Internal Utilities
// =============================================================================

/**
 * Resolve an EM-code (e.g. "EM-T") to its plaintext label + description.
 * Falls back to raw code if mapping is missing.
 */
function resolveEmCode(
  code: string | undefined,
  mapping: Record<string, { label: string; description: string }> | undefined,
): string {
  if (!code) return '';
  // Try exact match first
  let entry = mapping?.[code];
  if (entry) return `${entry.label} — ${entry.description}`;
  // LLM may output "EM-T Thrill" instead of just "EM-T" — extract the EM-X prefix
  const emMatch = code.match(/^(EM-[A-Z])/);
  if (emMatch) {
    entry = mapping?.[emMatch[1]];
    if (entry) return `${entry.label} — ${entry.description}`;
  }
  // Fallback: strip EM-X prefix if present (e.g. "EM-T Thrill" → "Thrill")
  return code.replace(/^EM-[A-Z]\s*/, '');
}

/**
 * Strip double-escaped quotes from DB text values.
 * Fixes: „Text!\"" → „Text!" (caused by JSON.stringify during DB seed).
 */
function unescapeQuotes(value: string): string {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/""/g, '"');
}

/**
 * Safe JSON.stringify that returns '' on null/undefined.
 */
function safeStringify(value: any): string {
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
