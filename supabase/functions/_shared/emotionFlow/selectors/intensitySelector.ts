/**
 * Intensity Selector — Phase 4, Task 4.1
 *
 * Selects the emotional intensity level for a story.
 * Weighted random: 30% light, 50% medium, 20% deep.
 * Anti-monotony: if last 3 intensities are identical, force a different one.
 */

import type { EmotionFlowSupabase, IntensityLevel } from '../types.ts';
import { weightedRandom } from '../utils.ts';

export const INTENSITY_WEIGHTS: Record<IntensityLevel, number> = {
  light: 30,
  medium: 50,
  deep: 20,
};

const ALL_LEVELS: IntensityLevel[] = ['light', 'medium', 'deep'];

export async function selectIntensity(
  kidProfileId: string,
  supabase: EmotionFlowSupabase
): Promise<IntensityLevel> {
  let lastThree: IntensityLevel[] = [];
  try {
    const res = await supabase
      .from('emotion_blueprint_history')
      .select('intensity_level')
      .eq('kid_profile_id', kidProfileId)
      .order('created_at', { ascending: false })
      .limit(3);
    if (res.error) return 'medium';
    const data = res.data as { intensity_level: string }[] | null;
    if (data && Array.isArray(data) && data.length > 0) {
      lastThree = data
        .map((r) => r.intensity_level as IntensityLevel)
        .filter((v): v is IntensityLevel => ALL_LEVELS.includes(v));
    }
  } catch {
    return 'medium';
  }

  if (lastThree.length < 3) {
    const items = ALL_LEVELS;
    const weights = ALL_LEVELS.map((l) => INTENSITY_WEIGHTS[l]);
    return weightedRandom(items, weights);
  }

  const a = lastThree[0];
  const b = lastThree[1];
  const c = lastThree[2];
  if (a !== b || b !== c) {
    const items = ALL_LEVELS;
    const weights = ALL_LEVELS.map((l) => INTENSITY_WEIGHTS[l]);
    return weightedRandom(items, weights);
  }

  const same = a;
  if (same === 'medium') {
    return weightedRandom(['light', 'deep'], [50, 50]);
  }
  if (same === 'light') {
    const items: IntensityLevel[] = ['medium', 'deep'];
    const weights = [INTENSITY_WEIGHTS.medium, INTENSITY_WEIGHTS.deep];
    return weightedRandom(items, weights);
  }
  const items: IntensityLevel[] = ['light', 'medium'];
  const weights = [INTENSITY_WEIGHTS.light, INTENSITY_WEIGHTS.medium];
  return weightedRandom(items, weights);
}
