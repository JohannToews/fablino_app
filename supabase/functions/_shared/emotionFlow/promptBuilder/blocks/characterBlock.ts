/**
 * Character Block — Phase 5, Task 5.2
 * Builds PROTAGONIST APPEARANCE + SIDEKICK block for image/story consistency.
 * Used in 'surprise' mode; for 'self'/'family' the relationshipBlock is used instead.
 */

import type { CharacterSeed } from '../../types.ts';

export interface CharacterBlockParams {
  protagonistSeed: CharacterSeed | null;
  sidekickSeed: CharacterSeed;
}

export function buildCharacterBlock(params: CharacterBlockParams): string {
  const { protagonistSeed, sidekickSeed } = params;

  const parts: string[] = [];

  if (protagonistSeed?.appearance_en) {
    parts.push(`## PROTAGONIST APPEARANCE (use for IMAGE GENERATION — maintain across all scenes):
${protagonistSeed.appearance_en}`);
  }

  const sidekickLines = [
    '## SIDEKICK:',
    `The protagonist has a companion: ${sidekickSeed.personality_trait_en ?? ''}.`,
    sidekickSeed.weakness_en ? `FLAW: ${sidekickSeed.weakness_en}.` : '',
    sidekickSeed.strength_en ? `STRENGTH: ${sidekickSeed.strength_en}.` : '',
  ].filter(Boolean);

  parts.push(sidekickLines.join(' '));

  return parts.join('\n\n');
}
