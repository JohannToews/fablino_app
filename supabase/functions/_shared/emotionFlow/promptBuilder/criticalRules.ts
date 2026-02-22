/**
 * Critical Rules Generator — Phase 5, Task 5.2
 *
 * Generates the CRITICAL_RULES section for the LLM prompt.
 * These are absolute constraints that must NEVER be violated.
 *
 * Rules cover:
 *   - Age-appropriate content boundaries
 *   - Emotional safety (no trauma, no horror, no death for young kids)
 *   - Naming/diversity requirements
 *   - Story structure compliance
 *   - Blueprint arc adherence
 */

import type { AgeGroup, IntensityLevel } from '../types.ts';

// TODO: Implement in Phase 5, Task 5.2
export function buildCriticalRules(
  _ageGroup: AgeGroup,
  _intensity: IntensityLevel,
): string {
  throw new Error('[EmotionFlow] buildCriticalRules() not yet implemented — Phase 5, Task 5.2');
}
