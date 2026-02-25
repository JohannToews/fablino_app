/**
 * Character Seed Selector — Phase 4, Task 4.4
 *
 * Selects character seeds (protagonist, sidekick, optional antagonist).
 * For 'surprise' mode: protagonist from seed pool (human or mythical).
 * Creature-type probability varies by age × theme matrix.
 * For 'self'/'family': no protagonist seed, sidekick + antagonist only.
 * Antagonist only for 'social' or 'courage' blueprint categories.
 * Diversity: if last 5 protagonist seeds share cultural_background, force different.
 */

import type {
  CharacterSeed,
  SelectedCharacters,
  CharacterSelectorParams,
  EmotionFlowSupabase,
} from '../types.ts';
import { getRecentKeys } from '../historyTracker.ts';
import { weightedRandom } from '../utils.ts';

// ─── Creature-Type Matrix (ageGroup → theme → % mythical) ─────────────

export const CREATURE_TYPE_MYTHICAL_PERCENT: Record<string, Record<string, number>> = {
  '6-7': {
    magic_fantasy: 80,
    adventure_action: 60,
    real_life: 30,
    surprise: 60,
  },
  '8-9': {
    magic_fantasy: 50,
    adventure_action: 30,
    real_life: 10,
    surprise: 30,
  },
  '10-11': {
    magic_fantasy: 30,
    adventure_action: 15,
    real_life: 5,
    surprise: 20,
  },
};

const DEFAULT_MYTHICAL_PERCENT = 30;

export function selectCreatureType(ageGroup: string, theme: string): 'human' | 'mythical' {
  const byTheme = CREATURE_TYPE_MYTHICAL_PERCENT[ageGroup];
  const mythicalPercent = byTheme?.[theme] ?? DEFAULT_MYTHICAL_PERCENT;
  return Math.random() * 100 < mythicalPercent ? 'mythical' : 'human';
}

// ─── Fallback when all DB queries fail ──────────────────────────────

export const FALLBACK_SIDEKICK: CharacterSeed = {
  id: 'fallback-sidekick',
  seed_key: 'loyal_skeptic',
  seed_type: 'sidekick_archetype',
  creature_type: 'human',
  labels: { en: 'Loyal Skeptic', de: 'Loyaler Skeptiker' },
  appearance_en: null,
  personality_trait_en: 'The voice of reason who says "this is a bad idea" but comes along anyway',
  weakness_en: 'Worries too much',
  strength_en: 'Their caution saves the group when things go wrong',
  cultural_background: null,
  gender: 'neutral',
  age_range: [],
  name_pool: null,
  compatible_themes: null,
  weight: 10,
  is_active: true,
  created_at: '',
  updated_at: '',
};

// History via emotion_flow_history (getRecentKeys). Diversity uses last 5 protagonist keys.
// If the last 5 protagonist seeds (by key) all have the same cultural_background, return it.
function getDominantCulturalBackground(
  allProtagonistSeeds: CharacterSeed[],
  lastFiveSeedKeys: string[]
): string | null {
  if (lastFiveSeedKeys.length < 5) return null;
  const keyToSeed = new Map(allProtagonistSeeds.map((s) => [s.seed_key, s]));
  const used = lastFiveSeedKeys
    .map((k) => keyToSeed.get(k))
    .filter((s): s is CharacterSeed => s != null);
  if (used.length < 5) return null;
  const backgrounds = used.slice(0, 5).map((s) => s.cultural_background ?? '');
  const first = backgrounds[0];
  if (first && backgrounds.every((b) => b === first)) return first;
  return null;
}

// ─── Seed queries (2 max: protagonist by creature_type; sidekick+antagonist) ─

type SeedRow = Record<string, unknown> & {
  seed_key: string;
  seed_type: string;
  creature_type?: string;
  age_range?: string[] | null;
  cultural_background?: string | null;
  weight?: number;
  is_active?: boolean;
};

function rowToCharacterSeed(r: SeedRow): CharacterSeed {
  return {
    id: String(r.id ?? ''),
    seed_key: r.seed_key,
    seed_type: r.seed_type as import('../types.ts').SeedType,
    creature_type: (r.creature_type as 'human' | 'mythical') ?? 'human',
    labels: (r.labels as Record<string, string>) ?? {},
    appearance_en: (r.appearance_en as string | null) ?? null,
    personality_trait_en: (r.personality_trait_en as string | null) ?? null,
    weakness_en: (r.weakness_en as string | null) ?? null,
    strength_en: (r.strength_en as string | null) ?? null,
    cultural_background: (r.cultural_background as string | null) ?? null,
    gender: (r.gender as 'female' | 'male' | 'neutral') ?? 'neutral',
    age_range: Array.isArray(r.age_range) ? (r.age_range as import('../types.ts').AgeGroup[]) : [],
    name_pool: (r.name_pool as Record<string, string[]> | null) ?? null,
    compatible_themes: Array.isArray(r.compatible_themes) ? (r.compatible_themes as string[]) : null,
    weight: typeof r.weight === 'number' ? r.weight : 10,
    is_active: r.is_active !== false,
    created_at: String(r.created_at ?? ''),
    updated_at: String(r.updated_at ?? ''),
  };
}

async function fetchProtagonistSeeds(
  supabase: EmotionFlowSupabase,
  creatureType: 'human' | 'mythical'
): Promise<CharacterSeed[]> {
  try {
    const res = await supabase
      .from('character_seeds')
      .select('*')
      .eq('is_active', true)
      .eq('seed_type', 'protagonist_appearance')
      .eq('creature_type', creatureType)
      .limit(200);
    if (res.error || !res.data) return [];
    const rows = Array.isArray(res.data) ? (res.data as SeedRow[]) : [];
    return rows.map(rowToCharacterSeed);
  } catch {
    return [];
  }
}

async function fetchSidekickAndAntagonistSeeds(
  supabase: EmotionFlowSupabase
): Promise<{ sidekicks: CharacterSeed[]; antagonists: CharacterSeed[] }> {
  try {
    const res = await supabase
      .from('character_seeds')
      .select('*')
      .eq('is_active', true)
      .in('seed_type', ['sidekick_archetype', 'antagonist_archetype'])
      .limit(100);
    if (res.error || !res.data) return { sidekicks: [], antagonists: [] };
    const rows = Array.isArray(res.data) ? (res.data as SeedRow[]) : [];
    const sidekicks: CharacterSeed[] = [];
    const antagonists: CharacterSeed[] = [];
    for (const r of rows) {
      const seed = rowToCharacterSeed(r);
      if (seed.seed_type === 'sidekick_archetype') sidekicks.push(seed);
      else if (seed.seed_type === 'antagonist_archetype') antagonists.push(seed);
    }
    return { sidekicks, antagonists };
  } catch {
    return { sidekicks: [], antagonists: [] };
  }
}

// ─── Main selector ───────────────────────────────────────────────────

export async function selectCharacterSeeds(
  params: CharacterSelectorParams,
  supabase: EmotionFlowSupabase
): Promise<SelectedCharacters> {
  const { kidProfileId, ageGroup, theme, characterMode, blueprintCategory } = params;

  const [recentProtagonistKeys, recentSidekickKeys, recentAntagonistKeys] = await Promise.all([
    getRecentKeys(supabase, kidProfileId, 'protagonist', 5),
    getRecentKeys(supabase, kidProfileId, 'sidekick', 3),
    getRecentKeys(supabase, kidProfileId, 'antagonist', 3),
  ]);
  const lastProtagonistKeys = recentProtagonistKeys.slice(0, 3);
  if (lastProtagonistKeys.length > 0) {
    console.log('[EmotionFlow] History exclude (protagonist): [' + lastProtagonistKeys.join(', ') + ']');
  }
  if (recentSidekickKeys.length > 0) {
    console.log('[EmotionFlow] History exclude (sidekick): [' + recentSidekickKeys.join(', ') + ']');
  }
  if (recentAntagonistKeys.length > 0) {
    console.log('[EmotionFlow] History exclude (antagonist): [' + recentAntagonistKeys.join(', ') + ']');
  }

  let protagonist: CharacterSeed | null = null;
  let sidekick: CharacterSeed = FALLBACK_SIDEKICK;
  let antagonist: CharacterSeed | null = null;

  if (characterMode === 'surprise') {
    const creatureType = selectCreatureType(ageGroup, theme);
    let allForCreature = await fetchProtagonistSeeds(supabase, creatureType);
    if (allForCreature.length === 0 && creatureType === 'mythical') {
      allForCreature = await fetchProtagonistSeeds(supabase, 'human');
    }
    const ageFilter = (s: CharacterSeed) =>
      s.age_range.length === 0 || s.age_range.includes(ageGroup as import('../types.ts').AgeGroup);
    let candidates = allForCreature.filter(
      (s) => ageFilter(s) && !lastProtagonistKeys.includes(s.seed_key)
    );
    if (candidates.length === 0) {
      candidates = allForCreature.filter(ageFilter);
    }
    if (candidates.length > 0 && creatureType === 'human') {
      const dominantBg = getDominantCulturalBackground(allForCreature, recentProtagonistKeys);
      if (dominantBg) {
        const filtered = candidates.filter((s) => (s.cultural_background ?? '') !== dominantBg);
        if (filtered.length > 0) candidates = filtered;
      }
    }
    if (candidates.length > 0) {
      const weights = candidates.map((s) => s.weight);
      protagonist = weightedRandom(candidates, weights);
    }
  }

  const { sidekicks, antagonists } = await fetchSidekickAndAntagonistSeeds(supabase);
  let sidekickCandidates = sidekicks.filter((s) => !recentSidekickKeys.includes(s.seed_key));
  if (sidekickCandidates.length === 0) sidekickCandidates = sidekicks;
  if (sidekickCandidates.length > 0) {
    const weights = sidekickCandidates.map((s) => s.weight);
    sidekick = weightedRandom(sidekickCandidates, weights);
  }

  if (blueprintCategory === 'social' || blueprintCategory === 'courage') {
    let antCandidates = antagonists.filter((s) => !recentAntagonistKeys.includes(s.seed_key));
    if (antCandidates.length === 0) antCandidates = antagonists;
    if (antCandidates.length > 0) {
      const weights = antCandidates.map((s) => s.weight);
      antagonist = weightedRandom(antCandidates, weights);
    }
  }

  return { protagonist, sidekick, antagonist };
}
