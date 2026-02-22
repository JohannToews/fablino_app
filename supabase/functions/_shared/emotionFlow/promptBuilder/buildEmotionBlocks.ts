/**
 * Emotion Prompt Block Builder — Phase 5, Task 5.1
 *
 * Converts selected blueprint + tone + characters + elements into
 * prompt text blocks that get injected into the system prompt.
 *
 * Block types:
 *   arcBlock       — emotional arc steps (from blueprint.arc_by_age)
 *   toneBlock      — tone guidance + tension curve + surprise moment
 *   characterBlock — protagonist seed + sidekick + antagonist descriptions
 *   elementBlocks  — opening style, perspective, macguffin, setting detail, etc.
 */

import type {
  EmotionBlueprint,
  ToneMode,
  SelectedCharacters,
  SelectedElements,
  AgeGroup,
  PromptBlocks,
} from '../types.ts';

// TODO: Implement in Phase 5, Task 5.1
export function buildEmotionPromptBlocks(
  _blueprint: EmotionBlueprint | null,
  _tone: ToneMode,
  _characters: SelectedCharacters,
  _elements: SelectedElements,
  _ageGroup: AgeGroup,
): PromptBlocks {
  throw new Error('[EmotionFlow] buildEmotionPromptBlocks() not yet implemented — Phase 5, Task 5.1');
}
