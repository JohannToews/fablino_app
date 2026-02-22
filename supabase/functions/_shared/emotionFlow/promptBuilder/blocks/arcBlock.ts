/**
 * Arc Block — Phase 5, Task 5.2
 * Builds the EMOTIONAL ARC section from blueprint + ageGroup + intensity.
 */

import type { EmotionBlueprint, IntensityLevel } from '../../types.ts';

const AGE_ORDER: string[] = ['10-11', '8-9', '6-7'];

function resolveArcForAge(
  blueprint: EmotionBlueprint,
  ageGroup: string
): {
  arc_prompt: string;
  tone_guidance: string | null;
  surprise_moment: string | null;
  ending_feeling: string | null;
} | null {
  const arcByAge = blueprint.arc_by_age as Record<string, { arc_prompt: string }>;
  if (arcByAge[ageGroup]) {
    const e = arcByAge[ageGroup];
    return {
      arc_prompt: e.arc_prompt,
      tone_guidance: blueprint.tone_guidance ?? null,
      surprise_moment: blueprint.surprise_moment ?? null,
      ending_feeling: blueprint.ending_feeling ?? null,
    };
  }
  const idx = AGE_ORDER.indexOf(ageGroup);
  if (idx >= 0) {
    for (let i = idx + 1; i < AGE_ORDER.length; i++) {
      const ag = AGE_ORDER[i];
      if (arcByAge[ag]) {
        const e = arcByAge[ag];
        return {
          arc_prompt: e.arc_prompt,
          tone_guidance: blueprint.tone_guidance ?? null,
          surprise_moment: blueprint.surprise_moment ?? null,
          ending_feeling: blueprint.ending_feeling ?? null,
        };
      }
    }
  }
  return {
    arc_prompt: blueprint.arc_description_en,
    tone_guidance: blueprint.tone_guidance ?? null,
    surprise_moment: blueprint.surprise_moment ?? null,
    ending_feeling: blueprint.ending_feeling ?? null,
  };
}

export interface ArcBlockParams {
  blueprint: EmotionBlueprint | null;
  ageGroup: string;
  intensity: IntensityLevel;
}

export function buildArcBlock(params: ArcBlockParams): string {
  const { blueprint, ageGroup, intensity } = params;

  if (intensity === 'light') return '';
  if (!blueprint) return '';

  const resolved = resolveArcForAge(blueprint, ageGroup);
  if (!resolved) return '';

  const { arc_prompt, tone_guidance, surprise_moment, ending_feeling } = resolved;

  if (intensity === 'medium') {
    return (
      '## EMOTIONAL ARC (weave naturally into the plot — NO moral, NO lesson stated):\n' +
      arc_prompt +
      '\n\nEach emotional beat should happen in a VISUALLY DIFFERENT context — different location, lighting, or time of day. The fear looks different from the courage. Show this through the world, not just the character\'s face.'
    );
  }

  const parts: string[] = [
    '## EMOTIONAL ARC (follow this blueprint — the emotional journey IS the story):\n' + arc_prompt,
  ];
  if (tone_guidance) parts.push('TONE WITHIN ARC: ' + tone_guidance);
  if (surprise_moment) parts.push('SURPRISE: ' + surprise_moment);
  if (ending_feeling) parts.push('ENDING FEELING: ' + ending_feeling);
  parts.push(
    'VISUAL PROGRESSION: Each step of the emotional arc MUST take place in a visually distinct setting. The opening fear should look different from the climax courage — different place, different light, different scale. The reader should be able to FEEL the emotional shift by looking at the illustrations alone, even without reading the text.'
  );
  return parts.join('\n');
}
