/**
 * Character Seed Selector — Phase 4, Task 4.4
 *
 * Selects character seeds (protagonist, sidekick, optional antagonist).
 *
 * For 'surprise' mode: protagonist from seed pool (human or mythical).
 * Creature-type probability varies by age × theme matrix.
 * For 'self'/'family': no protagonist seed, sidekick + antagonist only.
 * Antagonist only for 'social' or 'courage' blueprint categories.
 *
 * Diversity enforcement: if last 5 seeds share cultural_background, force different.
 */

import type { SelectedCharacters, CharacterSelectorParams } from '../types.ts';

export const CREATURE_TYPE_WEIGHTS: Record<string, Record<string, number>> = {
  'magic_fantasy':    { '6-7': 80, '8-9': 50, '10-11': 30 },
  'adventure_action': { '6-7': 60, '8-9': 30, '10-11': 15 },
  'real_life':        { '6-7': 30, '8-9': 10, '10-11': 5 },
  'surprise':         { '6-7': 60, '8-9': 30, '10-11': 20 },
};

// TODO: Implement in Phase 4, Task 4.4
export async function selectCharacterSeeds(
  _params: CharacterSelectorParams,
  _supabase: any
): Promise<SelectedCharacters> {
  throw new Error('[EmotionFlow] selectCharacterSeeds() not yet implemented — Phase 4, Task 4.4');
}
