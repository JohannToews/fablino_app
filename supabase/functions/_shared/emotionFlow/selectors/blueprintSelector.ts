/**
 * Blueprint Selector — Phase 4, Task 4.2
 *
 * Selects an emotion blueprint based on age, theme, intensity, and history.
 * Returns null for 'light' intensity (no blueprint needed).
 * Uses weighted random with history-based exclusion (last 5).
 * Soft-boosts blueprints that match the active learning theme.
 */

import type {
  EmotionBlueprint,
  BlueprintSelectorParams,
  EmotionFlowSupabase,
  IntensityLevel,
} from '../types.ts';
import { getRecentKeys } from '../historyTracker.ts';
import { weightedRandom } from '../utils.ts';

const INTENSITY_RANK: Record<IntensityLevel, number> = { light: 0, medium: 1, deep: 2 };

function intensityAllowed(min: IntensityLevel, chosen: IntensityLevel): boolean {
  return INTENSITY_RANK[min] <= INTENSITY_RANK[chosen];
}

export async function selectBlueprint(
  params: BlueprintSelectorParams,
  supabase: EmotionFlowSupabase
): Promise<EmotionBlueprint | null> {
  const { kidProfileId, ageGroup, theme, intensity, learningTheme } = params;
  if (intensity === 'light') return null;

  let allRows: unknown[] = [];
  try {
    const res = await supabase
      .from('emotion_blueprints')
      .select('*')
      .eq('is_active', true)
      .limit(2000);
    console.log('[EmotionFlow] Blueprint query:', { error: res.error, rowCount: Array.isArray(res.data) ? res.data.length : 0 });
    if (res.error || !res.data) return null;
    allRows = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('[EmotionFlow] Blueprint query exception:', err);
    return null;
  }

  type Row = Record<string, unknown> & {
    ideal_age_groups?: string[];
    compatible_themes?: string[] | null;
    min_intensity?: string;
    blueprint_key?: string;
    compatible_learning_themes?: string[] | null;
    weight?: number;
  };
  const baseFilter = (r: Row) =>
    Array.isArray(r.ideal_age_groups) &&
    r.ideal_age_groups.includes(ageGroup) &&
    r.min_intensity != null &&
    intensityAllowed(r.min_intensity as IntensityLevel, intensity);

  const themeFilter = (r: Row) =>
    r.compatible_themes == null ||
    !theme || theme === 'none' || theme === 'surprise' ||
    (Array.isArray(r.compatible_themes) && r.compatible_themes.includes(theme));

  let candidates = (allRows as Row[]).filter((r) => baseFilter(r) && themeFilter(r));

  if (candidates.length === 0) {
    candidates = (allRows as Row[]).filter(baseFilter);
    console.log('[EmotionFlow] Blueprint theme soft-fallback: theme', theme, 'had 0 matches, using all', candidates.length, 'age/intensity matches');
  }

  console.log('[EmotionFlow] Blueprint filter:', { totalRows: allRows.length, candidates: candidates.length, theme, ageGroup, intensity });

  let excludeKeys = await getRecentKeys(supabase, kidProfileId, 'blueprint', 5);
  if (excludeKeys.length > 0) {
    console.log('[EmotionFlow] History exclude (blueprint): [' + excludeKeys.join(', ') + ']');
  }
  let filtered = candidates.filter((b) => !excludeKeys.includes(b.blueprint_key ?? ''));

  if (filtered.length === 0) {
    excludeKeys = await getRecentKeys(supabase, kidProfileId, 'blueprint', 3);
    filtered = candidates.filter((b) => !excludeKeys.includes(b.blueprint_key ?? ''));
  }
  if (filtered.length === 0) {
    filtered = candidates;
  }
  if (filtered.length === 0) return null;

  const weights = filtered.map((b) => {
    let w = typeof b.weight === 'number' ? b.weight : 10;
    if (
      learningTheme &&
      Array.isArray(b.compatible_learning_themes) &&
      b.compatible_learning_themes.includes(learningTheme)
    ) {
      w *= 2;
    }
    return w;
  });
  const chosen = weightedRandom(filtered, weights);
  return chosen as unknown as EmotionBlueprint;
}
