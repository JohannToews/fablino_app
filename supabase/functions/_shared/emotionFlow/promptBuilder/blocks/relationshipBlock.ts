/**
 * Relationship Context Block — Phase 5, Task 5.1
 * Builds the CHARACTERS / RELATIONSHIP section for the LLM prompt.
 * Three modes: surprise (all fictional), self (kid as protagonist), family (kid + real people).
 */

import type { CharacterSeed } from '../../types.ts';

export interface RelationshipBlockParams {
  characterMode: 'self' | 'family' | 'surprise';
  kidProfile: { name: string; age: number; appearance?: string };
  selectedCharacters: Array<{ name: string; relationship: string }>;
  protagonistSeed: CharacterSeed | null;
  sidekickSeed: CharacterSeed;
  blueprintCategory?: string;
}

function pickNameFromPool(seed: CharacterSeed): string {
  const pool = seed.name_pool;
  if (!pool || typeof pool !== 'object') return 'The protagonist';
  const gender = seed.gender;
  if (gender === 'female' && Array.isArray(pool.female) && pool.female.length > 0) {
    return pool.female[Math.floor(Math.random() * pool.female.length)];
  }
  if (gender === 'male' && Array.isArray(pool.male) && pool.male.length > 0) {
    return pool.male[Math.floor(Math.random() * pool.male.length)];
  }
  const all: string[] = [];
  if (Array.isArray(pool.female)) all.push(...pool.female);
  if (Array.isArray(pool.male)) all.push(...pool.male);
  if (all.length > 0) return all[Math.floor(Math.random() * all.length)];
  return 'The protagonist';
}

export function buildRelationshipBlock(params: RelationshipBlockParams): string {
  const { characterMode, kidProfile, selectedCharacters, protagonistSeed, sidekickSeed } = params;

  const sidekickLines = [
    `SIDEKICK: ${sidekickSeed.personality_trait_en ?? ''}.`,
    sidekickSeed.weakness_en ? `FLAW: ${sidekickSeed.weakness_en}.` : '',
    sidekickSeed.strength_en ? `STRENGTH: ${sidekickSeed.strength_en}.` : '',
  ].filter(Boolean);

  if (characterMode === 'surprise') {
    if (protagonistSeed) {
      const name = pickNameFromPool(protagonistSeed);
      const lines = [
        '## CHARACTERS',
        `PROTAGONIST: ${name}.`,
        protagonistSeed.appearance_en ?? '',
        protagonistSeed.personality_trait_en ? `PERSONALITY: ${protagonistSeed.personality_trait_en}.` : '',
        protagonistSeed.weakness_en ? `FLAW: ${protagonistSeed.weakness_en}.` : '',
        protagonistSeed.strength_en ? `STRENGTH: ${protagonistSeed.strength_en}.` : '',
        '',
        sidekickLines.join(' '),
        '',
        'RELATIONSHIP DYNAMIC: The protagonist and sidekick have a push-pull dynamic. Their strengths complement each other. Their weaknesses create conflict that the emotional arc resolves.',
      ].filter(Boolean);
      return lines.join('\n');
    }
    const lines = [
      '## CHARACTERS',
      sidekickLines.join(' '),
      '',
      'RELATIONSHIP DYNAMIC: The protagonist and sidekick have a push-pull dynamic. Their strengths complement each other. Their weaknesses create conflict that the emotional arc resolves.',
    ].filter(Boolean);
    return lines.join('\n');
  }

  if (characterMode === 'self') {
    const appearanceLine = kidProfile.appearance?.trim() ? `\n${kidProfile.appearance}.` : '';
    const lines = [
      '## CHARACTERS',
      `PROTAGONIST: ${kidProfile.name}, ${kidProfile.age} years old.${appearanceLine}`,
      'This is a real child — make the emotional journey feel authentic to their age.',
      '',
      `SIDEKICK: A new character with this personality: ${sidekickSeed.personality_trait_en ?? ''}.`,
      sidekickSeed.weakness_en ? `FLAW: ${sidekickSeed.weakness_en}.` : '',
      sidekickSeed.strength_en ? `STRENGTH: ${sidekickSeed.strength_en}.` : '',
      '',
      `RELATIONSHIP: The sidekick complements the protagonist. If the arc involves conflict, the conflict should feel realistic for a ${kidProfile.age}-year-old.`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  if (characterMode === 'family') {
    if (!selectedCharacters || selectedCharacters.length === 0) {
      return buildRelationshipBlock({
        ...params,
        characterMode: 'self',
        selectedCharacters: [],
      });
    }
    const coStarLines = selectedCharacters
      .map((c) => `- ${c.name} (${c.relationship})`)
      .join('\n');
    const lines = [
      '## CHARACTERS',
      `PROTAGONIST: ${kidProfile.name}, ${kidProfile.age} years old.`,
      '',
      `CO-STARS (ALL must appear as active characters in the story):`,
      coStarLines,
      '',
      'CRITICAL RULES:',
      '- Every co-star listed above MUST appear in the story with dialogue and actions.',
      '- Do NOT invent new main or secondary human characters. Only the characters listed above may appear as named characters.',
      '- You may add unnamed background characters (e.g. "a shopkeeper", "passers-by") but NO new named characters.',
      "- These are REAL people in the child's life — their dynamic should feel authentic.",
      '',
      `SIDEKICK PERSONALITY: Apply this personality trait to whichever co-star fits best: "${sidekickSeed.personality_trait_en ?? ''}".`,
      sidekickSeed.weakness_en ? `Give that co-star this flaw: ${sidekickSeed.weakness_en}.` : '',
      sidekickSeed.strength_en ? `Give that co-star this strength: ${sidekickSeed.strength_en}.` : '',
      'Do NOT create a new character for the sidekick role — assign it to one of the real co-stars above.',
      '',
      'RELATIONSHIP DYNAMIC: Apply the emotional arc to the relationships between these characters. If the blueprint is about conflict resolution, the conflict should involve the protagonist and one of the co-stars. If it\'s about courage, the protagonist might find courage through or for one of the co-stars.',
    ].filter(Boolean);
    return lines.join('\n');
  }

  return '';
}
