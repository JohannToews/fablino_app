/**
 * FSE2 — Prompt Builder V2
 *
 * Completely separate from promptBuilder.ts (FSE1).
 * Provides DB loaders and prompt construction for the FSE2 pipeline.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KidLanguageSettings {
  kid_profile_id: string;
  language: string;
  language_class: number;
  language_level: number;
  content_level: number;
  length_level: number;
}

export interface StoryLevel {
  id: number;
  max_plot_twists: number;
  max_characters: number;
  allow_subplot: boolean;
  plot_complexity: string;
  cliffhanger_allowed: boolean;
  max_sentence_length: number;
  sentence_structures: string;
  allowed_tenses: string[];
  tense_switch_allowed: boolean;
  allow_foreign_words: string;
  dialogue_ratio: string;
  paragraph_length: string;
  new_words_per_story: number;
  figurative_language: string;
  idiom_usage: string;
  repetition_strategy: string;
  narrative_perspective: string;
}

export interface StoryLengthLevel {
  complexity_level: number;
  length_level: number;
  paragraph_count: number;
  word_approx: number;
}

// ---------------------------------------------------------------------------
// DB Loader Functions
// ---------------------------------------------------------------------------

export async function loadKidLanguageSettings(
  supabase: any,
  kidProfileId: string,
  language: string,
): Promise<KidLanguageSettings | null> {
  const { data, error } = await supabase
    .from('kid_language_settings')
    .select('*')
    .eq('kid_profile_id', kidProfileId)
    .eq('language', language)
    .single();

  if (error || !data) {
    console.warn(`[FSE2] No kid_language_settings for kid=${kidProfileId}, lang=${language}:`, error?.message);
    return null;
  }
  return data as KidLanguageSettings;
}

export async function loadStoryLevel(
  supabase: any,
  level: number,
): Promise<StoryLevel | null> {
  const { data, error } = await supabase
    .from('story_levels')
    .select('*')
    .eq('id', level)
    .single();

  if (error || !data) {
    console.warn(`[FSE2] No story_level found for id=${level}:`, error?.message);
    return null;
  }
  return data as StoryLevel;
}

export async function loadStoryLengthLevel(
  supabase: any,
  complexityLevel: number,
  lengthLevel: number,
): Promise<StoryLengthLevel | null> {
  const { data, error } = await supabase
    .from('story_length_levels')
    .select('*')
    .eq('complexity_level', complexityLevel)
    .eq('length_level', lengthLevel)
    .single();

  if (error || !data) {
    console.warn(`[FSE2] No story_length_level for complexity=${complexityLevel}, length=${lengthLevel}:`, error?.message);
    return null;
  }
  return data as StoryLengthLevel;
}

export async function loadAgeLevelDefault(
  supabase: any,
  age: number,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('age_level_defaults')
    .select('default_level')
    .eq('age', age)
    .single();

  if (error || !data) {
    console.warn(`[FSE2] No age_level_default for age=${age}:`, error?.message);
    return null;
  }
  return data.default_level;
}

// ---------------------------------------------------------------------------
// Story Path Selection (mirrored from FSE1 promptBuilder.ts)
// ---------------------------------------------------------------------------

export interface StoryPathV2 {
  id: string;
  code: string;
  label: string;
  min_age_group: string;
  hook_score: number | null;
  is_onboarding: boolean;
  humor_range_min: number;
  humor_range_max: number;
  writing_instructions: string;
}

const AGE_GROUP_ORDER_V2 = ['CE1', 'CE2', 'CM1', 'CM2'] as const;
type AgeGroupV2 = typeof AGE_GROUP_ORDER_V2[number];

export function ageToAgeGroupV2(age: number): AgeGroupV2 {
  if (age <= 6) return 'CE1';
  if (age <= 8) return 'CE2';
  if (age <= 10) return 'CM1';
  return 'CM2';
}

const SAFETY_PATH_CODE_V2 = 'A3->M1->E1';

export async function selectNextPathV2(
  supabaseClient: any,
  ageGroup: AgeGroupV2,
  storyCount: number,
  recentCodes: string[],
  humorLevel?: number,
): Promise<StoryPathV2> {
  const ageIdx = AGE_GROUP_ORDER_V2.indexOf(ageGroup);
  const eligibleAgeGroups = AGE_GROUP_ORDER_V2.slice(0, ageIdx + 1);

  let query = supabaseClient
    .from('story_paths')
    .select('id, code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions')
    .eq('is_active', true)
    .in('min_age_group', eligibleAgeGroups)
    .order('hook_score', { ascending: false, nullsFirst: false });

  if (storyCount <= 5) {
    query = query.eq('is_onboarding', true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    console.warn('[selectNextPathV2] Query failed or empty, using safety path:', error?.message);
    return safetyPathV2(supabaseClient);
  }

  let candidates: StoryPathV2[] = data;

  if (storyCount <= 5) {
    return candidates[0];
  }

  if (recentCodes.length > 0) {
    const recentSet = new Set(recentCodes);
    const filtered = candidates.filter(p => !recentSet.has(p.code));
    if (filtered.length > 0) candidates = filtered;
  }

  if (humorLevel != null) {
    const humorFiltered = candidates.filter(
      p => p.humor_range_min <= humorLevel && humorLevel <= p.humor_range_max
    );
    if (humorFiltered.length > 0) candidates = humorFiltered;
  }

  if (storyCount >= 6 && storyCount <= 10) {
    candidates.sort((a, b) => {
      if (a.is_onboarding !== b.is_onboarding) return a.is_onboarding ? -1 : 1;
      return (b.hook_score ?? 0) - (a.hook_score ?? 0);
    });
  }

  if (candidates.length === 0) {
    console.warn('[selectNextPathV2] All candidates filtered out, using safety path');
    return safetyPathV2(supabaseClient);
  }

  return candidates[0];
}

async function safetyPathV2(supabaseClient: any): Promise<StoryPathV2> {
  const { data } = await supabaseClient
    .from('story_paths')
    .select('id, code, label, min_age_group, hook_score, is_onboarding, humor_range_min, humor_range_max, writing_instructions')
    .eq('code', SAFETY_PATH_CODE_V2)
    .maybeSingle();

  if (data) return data;

  return {
    id: '00000000-0000-0000-0000-000000000000',
    code: SAFETY_PATH_CODE_V2,
    label: 'Charakter-Eskalation',
    min_age_group: 'CE1',
    hook_score: 4.00,
    is_onboarding: true,
    humor_range_min: 1,
    humor_range_max: 3,
    writing_instructions: 'A: Charaktermoment – zeige die Hauptfigur in einer vertrauten Situation. | M: Eskalation – das Problem wird Schritt für Schritt größer. | E: Klassisch – befriedigende Auflösung.',
  };
}

// ---------------------------------------------------------------------------
// Prompt Builder Functions
// ---------------------------------------------------------------------------

export function buildPlanConstraints(
  storyLevel: StoryLevel,
  lengthLevel: StoryLengthLevel,
  heroesVillains = false,
  selectedPath?: StoryPathV2 | null,
): string {
  let block = `STRUCTURE CONSTRAINTS — MANDATORY:
- Paragraphs: ${lengthLevel.paragraph_count}
- Approx. words: ~${lengthLevel.word_approx}
- Max plot twists: ${storyLevel.max_plot_twists}
- Max characters: ${storyLevel.max_characters}
- Subplot allowed: ${storyLevel.allow_subplot}
- Cliffhanger allowed: ${storyLevel.cliffhanger_allowed}
- Plot complexity: ${storyLevel.plot_complexity}`;

  if (selectedPath) {
    block += `

NARRATIVE ARC (MANDATORY — do NOT deviate):
- Story path: ${selectedPath.code}
- Writing instructions: ${selectedPath.writing_instructions}
- central_conflict MUST fit the M (middle) section of writing_instructions
- resolution MUST fit the E (ending) section of writing_instructions`;
  }

  if (heroesVillains) {
    block += `

VILLAIN REQUIRED: true
- The story MUST include at least one character with role "antagonist"
- This requirement overrides any subtype hint
- forbidden_in_writer must NOT block or remove the antagonist
- The antagonist must be relevant to the conflict or resolution`;
  }

  return block;
}

export function buildGradeRulesBlock(
  writerLevel: StoryLevel,
  lengthLevel: StoryLengthLevel,
  language: string,
): string {
  return `## LANGUAGE
Language: ${language}
Write the entire story in this language.

## LANGUAGE & STYLE RULES
- Max sentence length: ${writerLevel.max_sentence_length} words
- Sentence structures: ${writerLevel.sentence_structures}
- Allowed tenses: ${writerLevel.allowed_tenses.join(', ')}
- Tense switch allowed: ${writerLevel.tense_switch_allowed}
- Foreign words: ${writerLevel.allow_foreign_words}
- Dialogue ratio: ${writerLevel.dialogue_ratio}
- Paragraph length: ${writerLevel.paragraph_length}
- New words per story: ${writerLevel.new_words_per_story}
- Figurative language: ${writerLevel.figurative_language}
- Idiom usage: ${writerLevel.idiom_usage}
- Repetition strategy: ${writerLevel.repetition_strategy}
- Narrative perspective: ${writerLevel.narrative_perspective}

## LENGTH — CRITICAL
Paragraphs: ${lengthLevel.paragraph_count} — write EXACTLY this many paragraphs, no more, no less.
Target word count: ${lengthLevel.word_approx} words — stay within ±15% of this target.
CRITICAL: Do NOT write fewer than ${Math.round(lengthLevel.word_approx * 0.85)} words.`;
}

export function buildPlanPromptV2(
  storyLevel: StoryLevel,
  lengthLevel: StoryLengthLevel,
  request: any,
  plannerPrompt: string,
  selectedSubtype?: { subtypeKey: string; promptHint: string; titleSeed: string; settingIdea: string } | null,
  heroesVillains = false,
  selectedPath?: StoryPathV2 | null,
): { systemPrompt: string; userMessage: string } {
  // Check if characters[] contains an explicit villain — if so, that takes priority over heroesVillains flag
  const chars: any[] = Array.isArray(request.characters) ? request.characters : [];
  const hasExplicitVillain = chars.some((c: any) => c.role === 'villain');
  const effectiveHeroesVillains = hasExplicitVillain ? true : heroesVillains;

  const constraints = buildPlanConstraints(storyLevel, lengthLevel, effectiveHeroesVillains, selectedPath);

  const systemPrompt = `${plannerPrompt}

${constraints}

If special_abilities or user wishes are provided, they MUST appear in magic_rules and/or character traits. Do NOT add forbidden_in_writer rules that contradict them.
If a character has role VILLAIN, they MUST appear as antagonist in characters[] with exits_at defined. Their description MUST be reflected in the conflict.`;

  // Format characters with role, description, and appearance
  const charactersBlock = chars.length > 0
    ? chars.map((c: any) => {
        const base = `${c.name} (age ${c.age ?? '?'})`;
        const role = c.role === 'villain' ? ' — VILLAIN' : '';
        const desc = c.description ? `: ${c.description}` : '';
        const appearance = c.appearance_anchor ? ` [appearance: ${c.appearance_anchor}]` : '';
        return base + role + desc + appearance;
      }).join(', ')
    : 'none';

  const specialAbilitiesBlock = Array.isArray(request.specialAbilities) && request.specialAbilities.length > 0
    ? request.specialAbilities.join(', ')
    : 'none';

  const userMessageObj: Record<string, unknown> = {
    kidName: request.kidName,
    age: request.age,
    language: request.language,
    topic: request.topic,
    characters: charactersBlock,
    genre: request.genre,
    specialAbilities: specialAbilitiesBlock,
    userWishes: request.description ?? 'none',
  };

  if (selectedPath) {
    userMessageObj.story_path = selectedPath.code;
    userMessageObj.story_path_instructions = selectedPath.writing_instructions;
    userMessageObj.story_path_echo_rule = 'echo back the mandatory path in story_path field';
  }

  if (selectedSubtype) {
    userMessageObj.subtype = selectedSubtype.subtypeKey;
    userMessageObj.subtypeHint = selectedSubtype.promptHint;
    userMessageObj.titleSeed = selectedSubtype.titleSeed;
    userMessageObj.settingIdea = selectedSubtype.settingIdea;
  }

  return { systemPrompt, userMessage: JSON.stringify(userMessageObj) };
}

export function buildStoryPromptV2(
  writerLevel: StoryLevel,
  lengthLevel: StoryLengthLevel,
  storyPlan: string,
  request: any,
  writerPrompt: string,
): { systemPrompt: string; userMessage: string } {
  const gradeRules = buildGradeRulesBlock(writerLevel, lengthLevel, request.language || 'DE');
  console.log('[FSE2-PROMPT] language param:', request.language);
  console.log('[FSE2-PROMPT] grade_rules injected:', gradeRules?.substring(0, 300));

  const systemPrompt = `${writerPrompt}

${gradeRules}`;

  const userMessage = `STORY PLAN:
${storyPlan}

REQUEST CONTEXT:
${JSON.stringify({
    kidName: request.kidName,
    age: request.age,
    language: request.language,
    topic: request.topic,
    characters: request.characters,
    genre: request.genre,
  })}`;

  return { systemPrompt, userMessage };
}
