/**
 * Intensity Selector — Phase 4, Task 4.1
 *
 * Selects the emotional intensity level for a story.
 * Weighted random: 30% light, 50% medium, 20% deep.
 * Anti-monotony: if last 3 intensities are identical, force a different one.
 */

import type { IntensityLevel } from '../types.ts';

export const INTENSITY_WEIGHTS: Record<IntensityLevel, number> = {
  light: 30,
  medium: 50,
  deep: 20,
};

// TODO: Implement in Phase 4, Task 4.1
export async function selectIntensity(
  _kidProfileId: string,
  _supabase: any
): Promise<IntensityLevel> {
  throw new Error('[EmotionFlow] selectIntensity() not yet implemented — Phase 4, Task 4.1');
}
