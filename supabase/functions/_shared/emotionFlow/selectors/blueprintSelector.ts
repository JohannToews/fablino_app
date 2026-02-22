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
import { weightedRandom } from '../utils.ts';

const INTENSITY_RANK: Record<IntensityLevel, number> = { light: 0, medium: 1, deep: 2 };

function intensityAllowed(min: IntensityLevel, chosen: IntensityLevel): boolean {
  return INTENSITY_RANK[min] <= INTENSITY_RANK[chosen];
}

async function getLastBlueprintKeys(
  supabase: EmotionFlowSupabase,
  kidProfileId: string,
  limit: number
): Promise<string[]> {
  try {
    const res = await supabase
      .from('emotion_blueprint_history')
      .select('blueprint_key')
      .eq('kid_profile_id', kidProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (res.error || !res.data) return [];
    const data = res.data as { blueprint_key: string }[];
    return Array.isArray(data) ? data.map((r) => r.blueprint_key) : [];
  } catch {
    return [];
  }
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
    if (res.error || !res.data) return null;
    allRows = Array.isArray(res.data) ? res.data : [];
  } catch {
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
  let candidates = allRows as Row[];
  candidates = candidates.filter(
    (r) =>
      Array.isArray(r.ideal_age_groups) &&
      r.ideal_age_groups.includes(ageGroup) &&
      (r.compatible_themes == null || (Array.isArray(r.compatible_themes) && r.compatible_themes.includes(theme))) &&
      r.min_intensity != null &&
      intensityAllowed(r.min_intensity as IntensityLevel, intensity)
  );

  let excludeKeys = await getLastBlueprintKeys(supabase, kidProfileId, 5);
  let filtered = candidates.filter((b) => !excludeKeys.includes(b.blueprint_key ?? ''));

  if (filtered.length === 0) {
    excludeKeys = await getLastBlueprintKeys(supabase, kidProfileId, 3);
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
