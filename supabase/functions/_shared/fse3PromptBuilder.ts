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

    // --- Interpreter-specific ---
    CHARACTERS_JSON: safeStringify(ctx.characters),
    VILLAIN_JSON: safeStringify(ctx.villain),
    FREE_TEXT: ctx.freeText || '',
    SPECIAL_EFFECTS: ctx.specialEffects || '',
    AVAILABLE_SUBTYPES: formatSubtypes(ctx.availableSubtypes),
    CHILD_ELEMENTS_SUMMARY: buildChildElementsSummary(ctx),
    SIDEKICK_NAME: getSidekickName(ctx) || '',
    SIDEKICK_TRAIT: getSidekickTrait(ctx) || '',

    // --- Pass 0-specific ---
    CHOSEN_VARIANT_ROUTING: cv?.routing ? safeStringify(cv.routing) : '',
    AVAILABLE_PATHS: formatPaths(ctx.availablePaths),
    AGE_GROUP: inferAgeGroup(ctx.kidAge),
    CHARACTERS_SUMMARY: formatCharactersSummary(ctx),
    VILLAIN_DESCRIPTION: ctx.villain
      ? (ctx.villain.description
          ? `${ctx.villain.name}: ${ctx.villain.description}`
          : ctx.villain.name)
      : '',
    PROTAGONIST_NAME_LOWER: (ctx.kidName || '').toLowerCase(),
    SIDEKICK_NAME_LOWER: (getSidekickName(ctx) || '').toLowerCase(),

    // --- Pass 1-specific (set by pipeline code via spread) ---
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
  if (!paths || paths.length === 0) return '';
  return paths
    .map((p) => `${p.code || p.path_code}: ${p.label} — ${p.writing_instructions || ''}`)
    .join('\n');
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

  // Other characters
  if (ctx.characters) {
    for (const c of ctx.characters) {
      if (c.type === 'self' || c.type === 'me' || c.name === ctx.kidName) continue; // protagonist already listed
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

  return lines.join('\n');
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

  // EM-codes → plaintext from app_settings
  const emMapping = ctx.emCodeMapping || {};
  const primary = emMapping[blueprint.emotional_coloring];
  const secondary = emMapping[blueprint.emotional_secondary];
  const emotion = [
    primary
      ? `Primary: ${primary.label} — ${primary.description}`
      : `Primary: ${blueprint.emotional_coloring}`,
    secondary
      ? `Secondary: ${secondary.label} — ${secondary.description}`
      : `Secondary: ${blueprint.emotional_secondary}`,
  ].join('. ') + '.';

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
  const entry = mapping?.[code];
  return entry ? `${entry.label} — ${entry.description}` : code;
}

/**
 * Strip double-escaped quotes from DB text values.
 * Fixes: „Text!\"" → „Text!" (caused by JSON.stringify during DB seed).
 */
function unescapeQuotes(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
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
