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

import type { ToneMode, ToneSelectorParams } from '../types.ts';

// TODO: Implement in Phase 4, Task 4.3
export async function selectTone(
  _params: ToneSelectorParams,
  _supabase: any
): Promise<ToneMode> {
  throw new Error('[EmotionFlow] selectTone() not yet implemented — Phase 4, Task 4.3');
}
