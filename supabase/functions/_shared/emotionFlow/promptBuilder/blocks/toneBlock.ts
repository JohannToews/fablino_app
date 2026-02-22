/**
 * Tone Block — Phase 5, Task 5.2
 * Returns a predefined tone instruction string per ToneMode.
 */

import type { ToneMode } from '../../types.ts';

export const TONE_TEMPLATES: Record<ToneMode, string> = {
  dramatic: `## TONE
Tell this story in a DRAMATIC tone. Let emotions breathe.
Use sensory details — what does fear feel like in the stomach?
What does relief sound like? Short sentences for tension,
longer flowing ones for emotional moments.`,

  comedic: `## TONE
Tell this story in a COMEDIC tone. Use exaggeration, funny mishaps,
and lighthearted chaos. The humor should feel like a cartoon —
physical, visual, absurd. If something goes wrong, it goes
SPECTACULARLY wrong.`,

  adventurous: `## TONE
Tell this story in an ADVENTUROUS tone. Fast-paced, exciting,
with a sense of discovery. Short punchy sentences during action,
longer ones during quiet moments. The world should feel big
and full of possibility.`,

  gentle: `## TONE
Tell this story in a GENTLE tone. Warm, quiet, intimate.
Like a story told by firelight. Focus on small moments —
a look, a touch, a shared silence. Emotions are felt deeply
but expressed softly.`,

  absurd: `## TONE
Tell this story in an ABSURD tone. Logic is optional.
Animals might talk, gravity might take a day off, soup might
be the answer to everything. But underneath the absurdity,
the emotional core must still ring true.`,
};

export function buildToneBlock(toneMode: ToneMode): string {
  return TONE_TEMPLATES[toneMode] ?? '';
}
