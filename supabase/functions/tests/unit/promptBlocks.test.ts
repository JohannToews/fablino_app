/**
 * Unit tests — Emotion-Flow Prompt Blocks (Phase 5)
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  buildRelationshipBlock,
  buildArcBlock,
  buildToneBlock,
  buildCharacterBlock,
  buildElementBlocks,
} from '../../_shared/emotionFlow/promptBuilder/blocks/index.ts';
import {
  getCriticalRules,
  CRITICAL_RULES_TEXT,
} from '../../_shared/emotionFlow/promptBuilder/criticalRules.ts';
import type { CharacterSeed, EmotionBlueprint, SelectedElements, StoryElement } from '../../_shared/emotionFlow/types.ts';

function makeSeed(overrides: Partial<CharacterSeed> & { seed_key: string; seed_type: CharacterSeed['seed_type'] }): CharacterSeed {
  return {
    id: overrides.id ?? overrides.seed_key,
    seed_key: overrides.seed_key,
    seed_type: overrides.seed_type,
    creature_type: overrides.creature_type ?? 'human',
    labels: overrides.labels ?? {},
    appearance_en: overrides.appearance_en ?? null,
    personality_trait_en: overrides.personality_trait_en ?? null,
    weakness_en: overrides.weakness_en ?? null,
    strength_en: overrides.strength_en ?? null,
    cultural_background: overrides.cultural_background ?? null,
    gender: overrides.gender ?? 'neutral',
    age_range: overrides.age_range ?? [],
    name_pool: overrides.name_pool ?? null,
    compatible_themes: overrides.compatible_themes ?? null,
    weight: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

function makeElement(key: string, type: StoryElement['element_type'], content: string): StoryElement {
  return {
    id: key,
    element_key: key,
    element_type: type,
    content_en: content,
    labels: null,
    compatible_themes: null,
    compatible_categories: null,
    age_groups: [],
    weight: 10,
    is_active: true,
    created_at: '',
  };
}

const sidekickSeed = makeSeed({
  seed_key: 'sk1',
  seed_type: 'sidekick_archetype',
  personality_trait_en: 'Voice of reason',
  weakness_en: 'Worries too much',
  strength_en: 'Saves the day with caution',
});

// ─── Relationship Block ─────────────────────────────────────────

describe('Relationship Block', () => {
  it('surprise Modus → enthält Protagonist Name + Appearance + Sidekick', () => {
    const prot = makeSeed({
      seed_key: 'p1',
      seed_type: 'protagonist_appearance',
      appearance_en: 'Dark curly hair, green jacket',
      personality_trait_en: 'Curious',
      weakness_en: 'Impatient',
      strength_en: 'Brave',
      name_pool: { female: ['Luna'], male: ['Kai'] },
      gender: 'female',
    });
    const out = buildRelationshipBlock({
      characterMode: 'surprise',
      kidProfile: { name: 'Emma', age: 8 },
      selectedCharacters: [],
      protagonistSeed: prot,
      sidekickSeed,
    });
    expect(out).toContain('Luna');
    expect(out).toContain('Dark curly hair, green jacket');
    expect(out).toContain('Voice of reason');
    expect(out).toContain('push-pull dynamic');
  });

  it('self Modus → enthält Kid Name + Age, NICHT Seed Appearance', () => {
    const out = buildRelationshipBlock({
      characterMode: 'self',
      kidProfile: { name: 'Liam', age: 7 },
      selectedCharacters: [],
      protagonistSeed: null,
      sidekickSeed,
    });
    expect(out).toContain('Liam');
    expect(out).toContain('7 years old');
    expect(out).toContain('real child');
  });

  it('family Modus → enthält Co-Stars', () => {
    const out = buildRelationshipBlock({
      characterMode: 'family',
      kidProfile: { name: 'Mia', age: 9 },
      selectedCharacters: [{ name: 'Anna', relationship: 'Schwester' }],
      protagonistSeed: null,
      sidekickSeed,
    });
    expect(out).toContain('Anna');
    expect(out).toContain('REAL people');
  });

  it('family mit leeren selectedCharacters → Fallback auf self', () => {
    const out = buildRelationshipBlock({
      characterMode: 'family',
      kidProfile: { name: 'Tom', age: 8 },
      selectedCharacters: [],
      protagonistSeed: null,
      sidekickSeed,
    });
    expect(out).toContain('Tom');
    expect(out).toContain('8 years old');
    expect(out).toContain('real child');
  });

  it('surprise mit protagonistSeed null → nur Sidekick', () => {
    const out = buildRelationshipBlock({
      characterMode: 'surprise',
      kidProfile: { name: 'X', age: 8 },
      selectedCharacters: [],
      protagonistSeed: null,
      sidekickSeed,
    });
    expect(out).not.toContain('PROTAGONIST:');
    expect(out).toContain('SIDEKICK:');
  });
});

// ─── Arc Block ─────────────────────────────────────────────────

describe('Arc Block', () => {
  const blueprintMedium: EmotionBlueprint = {
    id: 'b1',
    blueprint_key: 'test',
    labels: {},
    descriptions: {},
    category: 'growth',
    arc_by_age: {
      '8-9': { steps: 3, arc: [], arc_prompt: 'Test arc for 8-9.' },
    },
    arc_description_en: 'Fallback arc.',
    tone_guidance: 'Keep it warm.',
    tension_curve: null,
    surprise_moment: 'A twist.',
    ending_feeling: 'Joy.',
    compatible_themes: null,
    ideal_age_groups: ['8-9'],
    min_intensity: 'light',
    compatible_learning_themes: null,
    weight: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
  };

  it('light → leerer String', () => {
    const out = buildArcBlock({
      blueprint: blueprintMedium,
      ageGroup: '8-9',
      intensity: 'light',
    });
    expect(out).toBe('');
  });

  it('medium → kurzer Block mit arc_prompt', () => {
    const out = buildArcBlock({
      blueprint: blueprintMedium,
      ageGroup: '8-9',
      intensity: 'medium',
    });
    expect(out).toContain('Test arc for 8-9.');
    expect(out).not.toContain('SURPRISE:');
    expect(out).not.toContain('ENDING FEELING:');
  });

  it('deep → voller Block', () => {
    const out = buildArcBlock({
      blueprint: blueprintMedium,
      ageGroup: '8-9',
      intensity: 'deep',
    });
    expect(out).toContain('Test arc for 8-9.');
    expect(out).toContain('TONE WITHIN ARC');
    expect(out).toContain('Keep it warm.');
    expect(out).toContain('SURPRISE:');
    expect(out).toContain('A twist.');
    expect(out).toContain('ENDING FEELING:');
    expect(out).toContain('Joy.');
  });

  it('ageGroup Fallback: 10-11 nicht vorhanden → 8-9', () => {
    const bp: EmotionBlueprint = {
      ...blueprintMedium,
      arc_by_age: {
        '6-7': { steps: 2, arc: [], arc_prompt: 'Young arc.' },
        '8-9': { steps: 3, arc: [], arc_prompt: 'Middle arc.' },
      },
    };
    const out = buildArcBlock({
      blueprint: bp,
      ageGroup: '10-11',
      intensity: 'medium',
    });
    expect(out).toContain('Middle arc.');
  });

  it('blueprint null → leerer String', () => {
    const out = buildArcBlock({
      blueprint: null,
      ageGroup: '8-9',
      intensity: 'medium',
    });
    expect(out).toBe('');
  });
});

// ─── Tone Block ────────────────────────────────────────────────

describe('Tone Block', () => {
  it('Jeder ToneMode gibt nicht-leeren String zurück', () => {
    const modes = ['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd'] as const;
    for (const tone of modes) {
      const out = buildToneBlock(tone);
      expect(out.length).toBeGreaterThan(50);
      expect(out).toContain('## TONE');
    }
  });
});

// ─── Element Blocks ───────────────────────────────────────────

describe('Element Blocks', () => {
  it('Nur vorhandene Elemente werden gebaut', () => {
    const elements: SelectedElements = {
      opening: makeElement('o1', 'opening_style', 'Start with a sound.'),
      perspective: makeElement('p1', 'narrative_perspective', 'First person.'),
      closing: makeElement('c1', 'closing_style', 'End with an image.'),
      macguffin: null,
      settingDetail: null,
      humorTechnique: null,
      tensionTechnique: null,
    };
    const out = buildElementBlocks(elements);
    expect(out).toContain('OPENING STYLE');
    expect(out).toContain('NARRATIVE PERSPECTIVE');
    expect(out).toContain('CLOSING STYLE');
    expect(out).not.toContain('KEY OBJECT');
    expect(out).not.toContain('HUMOR TECHNIQUE');
  });

  it('Alle Elemente vorhanden → alle Blöcke', () => {
    const elements: SelectedElements = {
      opening: makeElement('o1', 'opening_style', 'Open'),
      perspective: makeElement('p1', 'narrative_perspective', 'Perspective'),
      macguffin: makeElement('m1', 'macguffin', 'Macguffin'),
      settingDetail: makeElement('s1', 'setting_detail', 'Setting'),
      humorTechnique: makeElement('h1', 'humor_technique', 'Humor'),
      tensionTechnique: makeElement('t1', 'tension_technique', 'Tension'),
      closing: makeElement('c1', 'closing_style', 'Close'),
    };
    const out = buildElementBlocks(elements);
    expect(out).toContain('OPENING STYLE');
    expect(out).toContain('NARRATIVE PERSPECTIVE');
    expect(out).toContain('KEY OBJECT');
    expect(out).toContain('SETTING');
    expect(out).toContain('HUMOR TECHNIQUE');
    expect(out).toContain('TENSION TECHNIQUE');
    expect(out).toContain('CLOSING STYLE');
  });
});

// ─── Critical Rules ───────────────────────────────────────────

describe('Critical Rules', () => {
  it('Enthält NO moral Regel', () => {
    const out = getCriticalRules();
    expect(out).toContain('NO stated moral');
    expect(out).toContain('NO lesson');
    expect(out).toContain('FEEL, not be TAUGHT');
  });

  it('getCriticalRules === CRITICAL_RULES_TEXT', () => {
    expect(getCriticalRules()).toBe(CRITICAL_RULES_TEXT);
  });

  it('getCriticalRules returns constant', () => {
    expect(getCriticalRules()).toBe(CRITICAL_RULES_TEXT);
  });
});

// ─── Character Block ─────────────────────────────────────────

describe('Character Block', () => {
  it('Mit Protagonist enthält appearance_en', () => {
    const prot = makeSeed({
      seed_key: 'p1',
      seed_type: 'protagonist_appearance',
      appearance_en: 'Brown hair, blue eyes',
    });
    const out = buildCharacterBlock({ protagonistSeed: prot, sidekickSeed });
    expect(out).toContain('PROTAGONIST APPEARANCE');
    expect(out).toContain('Brown hair, blue eyes');
    expect(out).toContain('Voice of reason');
  });

  it('Ohne Protagonist nur Sidekick', () => {
    const out = buildCharacterBlock({ protagonistSeed: null, sidekickSeed });
    expect(out).not.toContain('PROTAGONIST APPEARANCE');
    expect(out).toContain('SIDEKICK:');
  });
});

// ─── Regression ───────────────────────────────────────────────

describe('Regression', () => {
  const ROOT = path.resolve(__dirname, '../../../..');
  const PROMPT_BUILDER = path.join(ROOT, 'supabase/functions/_shared/promptBuilder.ts');
  const GENERATE_STORY = path.join(ROOT, 'supabase/functions/generate-story/index.ts');

  it('promptBuilder.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/buildRelationshipBlock|buildArcBlock|emotionFlow\/promptBuilder\/blocks/);
  });

  it('generate-story/index.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(GENERATE_STORY, 'utf-8');
    expect(content).not.toMatch(/buildRelationshipBlock|buildArcBlock|emotionFlow\/promptBuilder\/blocks/);
  });
});
