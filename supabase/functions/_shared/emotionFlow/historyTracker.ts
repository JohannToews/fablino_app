/**
 * History Tracker — Phase 4
 *
 * Reads and writes the per-kid selection history to prevent
 * repetitive story elements. Used by all selectors.
 *
 * Tracks per kid_profile_id:
 *   - last N blueprint_keys used
 *   - last N tone_modes used
 *   - last N intensity_levels used
 *   - last N character seed_keys used (per type)
 *   - last N element_keys used (per element_type)
 *   - last N cultural_backgrounds used
 *
 * Storage: Reads from stories table metadata columns
 *   (emotion_blueprint_key, tone_mode, intensity_level, etc.)
 */

import type { IntensityLevel, ToneMode } from './types.ts';

export interface SelectionHistory {
  recentBlueprints: string[];
  recentTones: ToneMode[];
  recentIntensities: IntensityLevel[];
  recentProtagonistSeeds: string[];
  recentSidekickSeeds: string[];
  recentAntagonistSeeds: string[];
  recentElements: Record<string, string[]>;
  recentCulturalBackgrounds: string[];
}

// TODO: Implement in Phase 4
export async function getSelectionHistory(
  _kidProfileId: string,
  _supabase: any,
  _limit: number = 10
): Promise<SelectionHistory> {
  throw new Error('[EmotionFlow] getSelectionHistory() not yet implemented — Phase 4');
}

/**
 * Filters out recently used keys from a candidate pool.
 * Returns only candidates whose key is NOT in the recent list.
 * If all candidates would be filtered, returns the full pool (reset).
 */
export function excludeRecent<T extends { [key: string]: any }>(
  candidates: T[],
  keyField: keyof T,
  recentKeys: string[],
): T[] {
  if (candidates.length === 0) return candidates;

  const filtered = candidates.filter(
    c => !recentKeys.includes(String(c[keyField]))
  );

  return filtered.length > 0 ? filtered : candidates;
}
