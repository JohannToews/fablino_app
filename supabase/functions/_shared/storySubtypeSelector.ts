/**
 * Story Subtype Selector
 * 
 * Selects a random story subtype based on:
 * 1. Theme category (mapped from theme_key)
 * 2. Child's age group
 * 3. Exclusion of recently used subtypes (round-robin)
 * 4. Weighted randomization
 * 
 * Performance: ~100ms (2 DB calls, indexed)
 */

// ── Theme → Category mapping ──
const THEME_TO_CATEGORY: Record<string, string> = {
  'fantasy': 'magic_fantasy',
  'magic': 'magic_fantasy',
  'action': 'adventure_action',
  'adventure': 'adventure_action',
  'animals': 'real_life',
  'everyday': 'real_life',
  'friends': 'real_life',
  'humor': 'surprise',
  'educational': 'real_life',
  'surprise': 'surprise',
};

export interface SelectedSubtype {
  subtypeKey: string;
  promptHint: string;
  titleSeed: string;
  settingIdea: string;
  category: string;
  label: string; // localized label
  emDriver: string;
}

// DB row shape from story_subtypes table
interface StorySubtypeRow {
  subtype_key: string;
  theme_key: string;
  labels: Record<string, string>;
  prompt_hint_en: string;
  title_seeds: string[];
  setting_ideas: string[];
  age_groups: string[];
  weight: number;
  is_active: boolean;
  [key: string]: unknown; // allow extra DB columns
}

function getAgeGroup(age: number): string {
  if (age <= 7) return '6-7';
  if (age <= 9) return '8-9';
  return '10-11';
}

/**
 * Pick a random element from an array.
 */
function randomPick<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Weighted random selection from an array of items with a `weight` field.
 */
function weightedRandomPick<T extends { weight: number }>(items: T[]): T | null {
  if (!items || items.length === 0) return null;

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight || 1;
    if (roll <= 0) return item;
  }

  return items[items.length - 1]; // fallback
}

/**
 * Select a story subtype for the given theme, kid profile, and age.
 * Returns null if no subtypes are available (graceful fallback).
 */
export async function selectStorySubtype(
  supabase: any,
  themeKey: string,
  kidProfileId: string | undefined,
  kidAge: number,
  language: string = 'de',
): Promise<SelectedSubtype | null> {
  // 1. Map theme_key to category
  const category = THEME_TO_CATEGORY[themeKey] || THEME_TO_CATEGORY['surprise'];
  if (!category) {
    console.warn(`[SubtypeSelector] Unknown theme_key: ${themeKey}, defaulting to 'surprise'`);
  }
  const effectiveCategory = category || 'surprise';

  // 2. Determine age group
  const ageGroup = getAgeGroup(kidAge);

  // 3. Load all active subtypes for this category + age group
  const { data: subtypes, error: subtypeErr } = await supabase
    .from('story_subtypes')
    .select('*')
    .eq('theme_key', effectiveCategory)
    .eq('is_active', true)
    .contains('age_groups', [ageGroup]);

  if (subtypeErr) {
    console.error('[SubtypeSelector] DB error loading subtypes:', subtypeErr.message);
    return null;
  }

  if (!subtypes || subtypes.length === 0) {
    console.warn(`[SubtypeSelector] No subtypes found for category=${effectiveCategory}, ageGroup=${ageGroup}`);
    return null;
  }

  console.log(`[SubtypeSelector] Found ${subtypes.length} subtypes for ${effectiveCategory} / ${ageGroup}`);

  // 4. Load recent history for this kid + category (last 5)
  let recentKeys: string[] = [];
  if (kidProfileId) {
    const { data: history, error: histErr } = await supabase
      .from('story_subtype_history')
      .select('subtype_key')
      .eq('kid_profile_id', kidProfileId)
      .eq('theme_key', effectiveCategory)
      .order('created_at', { ascending: false })
      .limit(5);

    if (histErr) {
      console.warn('[SubtypeSelector] History load failed, continuing without exclusion:', histErr.message);
    } else if (history) {
      recentKeys = history.map((h: any) => h.subtype_key);
      console.log(`[SubtypeSelector] Recent subtypes to exclude: [${recentKeys.join(', ')}]`);
    }
  }

  // 5. Filter out recently used (but keep at least 3 options)
  const typedSubtypes = subtypes as StorySubtypeRow[];
  let candidates: StorySubtypeRow[] = typedSubtypes.filter(s => !recentKeys.includes(s.subtype_key));

  if (candidates.length < 3 && typedSubtypes.length >= 3) {
    // Too aggressive filtering — reduce exclusion to last 2 only
    const shorterExclusion = recentKeys.slice(0, 2);
    candidates = typedSubtypes.filter(s => !shorterExclusion.includes(s.subtype_key));
    console.log(`[SubtypeSelector] Reduced exclusion to last 2, candidates: ${candidates.length}`);
  }

  if (candidates.length === 0) {
    // Fallback: use all subtypes (no exclusion)
    candidates = typedSubtypes;
    console.log(`[SubtypeSelector] No candidates after exclusion, using all ${typedSubtypes.length} subtypes`);
  }

  // 6. Weighted random selection
  const selected = weightedRandomPick<StorySubtypeRow>(candidates);
  if (!selected) {
    console.error('[SubtypeSelector] weightedRandomPick returned null');
    return null;
  }

  // 7. Pick random title_seed and setting_idea
  const titleSeeds = Array.isArray(selected.title_seeds) ? selected.title_seeds : [];
  const settingIdeas = Array.isArray(selected.setting_ideas) ? selected.setting_ideas : [];
  const titleSeed = randomPick(titleSeeds) || '';
  const settingIdea = randomPick(settingIdeas) || '';

  // 8. Get localized label
  const labels = selected.labels || {};
  const label = labels[language] || labels['en'] || labels['de'] || selected.subtype_key;

  const result: SelectedSubtype = {
    subtypeKey: selected.subtype_key,
    promptHint: selected.prompt_hint_en,
    titleSeed,
    settingIdea,
    category: effectiveCategory,
    label,
    emDriver: (selected as any).em_driver ?? 'gefühl',
  };

  console.log(`[SubtypeSelector] Selected: ${result.subtypeKey} (${result.label}) for ${effectiveCategory}/${ageGroup}`);

  return result;
}

/**
 * Record a subtype usage in history (for round-robin).
 */
export async function recordSubtypeUsage(
  supabase: any,
  kidProfileId: string | undefined,
  category: string,
  subtypeKey: string,
  storyId: string | undefined,
): Promise<void> {
  if (!kidProfileId) {
    console.log('[SubtypeSelector] No kid_profile_id, skipping history write');
    return;
  }

  const { error } = await supabase
    .from('story_subtype_history')
    .insert({
      kid_profile_id: kidProfileId,
      theme_key: category,
      subtype_key: subtypeKey,
      story_id: storyId || null,
    });

  if (error) {
    console.warn('[SubtypeSelector] Failed to record history:', error.message);
    // Non-fatal — don't crash story generation
  } else {
    console.log(`[SubtypeSelector] History recorded: ${subtypeKey} for kid=${kidProfileId}`);
  }
}
