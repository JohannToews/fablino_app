/**
 * Critical Rules — Phase 5, Task 5.2
 * Returns the CRITICAL rules block (no moral, no lesson, feel not taught).
 */

export const CRITICAL_RULES_TEXT =
  `CRITICAL: The emotional development must emerge ORGANICALLY from the plot.
NO stated moral. NO lesson at the end. NO "and they learned that..."
The child should FEEL, not be TAUGHT. The meaning lives in the experience,
not in the explanation.

EMOTIONAL PACING: The emotional arc must develop GRADUALLY. Never jump from one emotion to its opposite without bridging sentences in between. If the protagonist is afraid, they don't become brave in the next sentence — they first hesitate, then take a small step, then find courage. Each emotion needs at least 2-3 sentences to breathe before shifting. The reader must feel WHY the emotion changes, not just THAT it changes. Transitions between emotional beats should feel like walking down stairs — one step at a time — not like jumping off a cliff.

VISUAL STORYTELLING: The story MUST move through at least 3 visually distinct settings or moments. Change location, time of day, weather, lighting, or scale between scenes. A story that stays in one room with unchanged lighting will produce boring, identical images. Think cinematically: every key moment should LOOK different from the last. Examples of visual contrast: indoors → outdoors, day → night, close intimate moment → vast landscape, calm → chaos, bright colors → muted tones. Note: Visual variety and emotional pacing are NOT contradictory. Change the SETTING between emotional beats — but let the EMOTION transition smoothly WITHIN each new setting. A character can walk from a dark forest into bright sunlight while their fear only slowly fades across several paragraphs.`.trim();

export function getCriticalRules(): string {
  return CRITICAL_RULES_TEXT;
}

/** Alias for compatibility with buildEmotionPromptBlocks etc. */
export function buildCriticalRules(): string {
  return getCriticalRules();
}
