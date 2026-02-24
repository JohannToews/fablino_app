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

    const adultRoles = ['papa', 'vater', 'father', 'dad', 'daddy', 'mama', 'mutter', 'mother', 'mom', 'mum', 'mummy', 'oma', 'grandma', 'grandmother', 'opa', 'grandpa', 'grandfather', 'onkel', 'uncle', 'tante', 'aunt', 'babysitter', 'teacher', 'lehrer', 'lehrerin'];
    const siblingRoles = ['bruder', 'brother', 'schwester', 'sister', 'geschwister', 'sibling', 'zwilling', 'twin'];
    const peerRoles = ['freund', 'freundin', 'friend', 'cousin', 'cousine', 'nachbar', 'nachbarin', 'neighbor', 'klassenkamerad', 'classmate'];

    function classifyRole(relationship: string): string {
      const rel = relationship.toLowerCase().trim();
      if (adultRoles.some(r => rel.includes(r))) return 'ADULT authority figure';
      if (siblingRoles.some(r => rel.includes(r))) return 'CHILD sibling';
      if (peerRoles.some(r => rel.includes(r))) return 'CHILD peer';
      return 'character';
    }

    const coStarLines = selectedCharacters
      .map((c, i) => {
        const roleClass = classifyRole(c.relationship);
        return `${i + 1}. ${c.name} — ${c.relationship} (${roleClass})`;
      })
      .join('\n');

    const lines = [
      '## CHARACTERS',
      `PROTAGONIST: ${kidProfile.name}, ${kidProfile.age} years old.`,
      '',
      `CO-STARS (ALL must appear as active characters in the story):`,
      coStarLines,
      '',
      'CRITICAL RELATIONSHIP RULES:',
      '- Every co-star listed above MUST appear in the story with dialogue and actions.',
      '- Do NOT invent new main or secondary human characters. Only the characters listed above may appear as named characters.',
      '- You may add unnamed background characters (e.g. "a shopkeeper", "passers-by") but NO new named characters.',
      "- These are REAL people in the child's life — their dynamic should feel authentic.",
      '',
      '⚠️ ABSOLUTE RULE — RESPECT RELATIONSHIP TYPES:',
      '- A "Papa/Vater/Father/Dad" is an ADULT PARENT — NOT a friend, NOT a peer, NOT a same-age companion. He speaks and acts with parental authority, care, and adult wisdom.',
      '- A "Mama/Mutter/Mother/Mom" is an ADULT PARENT with the same authority.',
      '- A "Bruder/Brother" or "Schwester/Sister" is a SIBLING — they may be younger or older but are CHILDREN, not adults.',
      '- A "Oma/Grandma" or "Opa/Grandpa" is an ELDERLY adult with grandparental warmth.',
      '- A "Freund/Friend" or "Cousin/Cousine" is a same-age PEER.',
      '- NEVER turn adult family members (parents, grandparents, aunts, uncles) into same-age friends or children.',
      '- NEVER write "three young friends" or similar when the characters include parents or other adults.',
      '- Write each character\'s behavior, dialogue, authority level, and physical description authentically for their real-world role and age.',
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
