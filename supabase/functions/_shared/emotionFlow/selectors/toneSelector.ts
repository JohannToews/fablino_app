/**
 * Tone Selector — Phase 4, Task 4.3
 *
 * Selects a narrative tone mode for the story.
 * Pool: dramatic, comedic, adventurous, gentle, absurd.
 * Excludes last 2 tones from history.
 * 'absurd' only for humor blueprints + age 6-9.
 * 'gentle' weighted higher for age 6-7.
 * 'dramatic' weighted higher for age 10-11.
 */

import type { ToneMode, ToneSelectorParams, EmotionFlowSupabase, BlueprintCategory } from '../types.ts';
import { weightedRandom } from '../utils.ts';

const TONE_POOL: ToneMode[] = ['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd'];

function getToneWeight(
  tone: ToneMode,
  ageGroup: string,
  blueprintCategory?: BlueprintCategory
): number {
  if (tone === 'absurd') {
    if (blueprintCategory === 'humor' && (ageGroup === '6-7' || ageGroup === '8-9')) return 10;
    return 0;
  }
  if (tone === 'gentle') return ageGroup === '6-7' ? 15 : 8;
  if (tone === 'dramatic') return ageGroup === '10-11' ? 15 : 8;
  if (tone === 'comedic') return 12;
  if (tone === 'adventurous') return 12;
  return 8;
}

export const TONE_WEIGHTS = getToneWeight;

async function getLastToneModes(
  supabase: EmotionFlowSupabase,
  kidProfileId: string,
  limit: number
): Promise<ToneMode[]> {
  try {
    const res = await supabase
      .from('emotion_blueprint_history')
      .select('tone_mode')
      .eq('kid_profile_id', kidProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (res.error || !res.data) return [];
    const data = res.data as { tone_mode: string | null }[];
    if (!Array.isArray(data)) return [];
    return data
      .map((r) => r.tone_mode as ToneMode | null)
      .filter((v): v is ToneMode => v != null && TONE_POOL.includes(v));
  } catch {
    return [];
  }
}

export async function selectTone(
  params: ToneSelectorParams,
  supabase: EmotionFlowSupabase
): Promise<ToneMode> {
  const { kidProfileId, ageGroup, blueprintCategory } = params;
  const excluded = await getLastToneModes(supabase, kidProfileId, 2);
  let pool = TONE_POOL.filter((t) => !excluded.includes(t));
  if (pool.length === 0) pool = [...TONE_POOL];

  let weights = pool.map((t) => getToneWeight(t, ageGroup, blueprintCategory));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const fallback = pool.filter((t) => t !== 'absurd');
    if (fallback.length > 0) {
      const w = fallback.map((t) => getToneWeight(t, ageGroup, blueprintCategory));
      return weightedRandom(fallback, w);
    }
    return pool[0];
  }
  const valid = pool.filter((_, i) => weights[i] > 0);
  const validWeights = weights.filter((w) => w > 0);
  if (valid.length === 0) return pool[0];
  return weightedRandom(valid, validWeights);
}
