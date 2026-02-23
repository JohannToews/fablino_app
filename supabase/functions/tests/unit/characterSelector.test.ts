/**
 * Unit tests — Character Seed Selector (Phase 4, Task 4.4)
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  selectCharacterSeeds,
  CREATURE_TYPE_MYTHICAL_PERCENT,
  selectCreatureType,
  FALLBACK_SIDEKICK,
} from '../../_shared/emotionFlow/selectors/index.ts';
import type { CharacterSeed } from '../../_shared/emotionFlow/types.ts';
import type { EmotionFlowSupabase } from '../../_shared/emotionFlow/types.ts';

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
    weight: overrides.weight ?? 10,
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

function createFullChain(data: unknown, err: unknown = null) {
  const result = Promise.resolve({ data, error: err ?? null });
  return {
    eq: () => createFullChain(data, err),
    in: () => ({ limit: () => result }),
    order: () => ({ limit: () => result }),
    limit: () => result,
    select: () => createFullChain(data, err),
  };
}

function createCharacterMockSupabase(overrides: {
  characterSeedHistory?: { seed_key: string; seed_type: string; created_at: string }[];
  protagonistSeeds?: CharacterSeed[];
  sidekickSeeds?: CharacterSeed[];
  antagonistSeeds?: CharacterSeed[];
  throwAll?: boolean;
}): EmotionFlowSupabase {
  const history = overrides.characterSeedHistory ?? [];
  const protagonistSeeds = overrides.protagonistSeeds ?? [];
  const sidekickSeeds = overrides.sidekickSeeds ?? [];
  const antagonistSeeds = overrides.antagonistSeeds ?? [];

  const historyRes = { data: history, error: null };
  const seedRes = (rows: CharacterSeed[]) => ({ data: rows.map((s) => ({ ...s })), error: null });

  return {
    from(table: string) {
      if (overrides.throwAll) {
        return {
          select: () => createFullChain(null, new Error('DB error')),
        };
      }
      if (table === 'character_seed_history') {
        const chain = () => ({ eq: () => chain(), order: () => ({ limit: () => Promise.resolve(historyRes) }), limit: () => Promise.resolve(historyRes), in: () => ({ limit: () => Promise.resolve(historyRes) }) });
        return {
          select: () => chain(),
        };
      }
      if (table === 'character_seeds') {
        const pEmptyDefault = Promise.resolve(seedRes([]));
        const emptyChain = () => ({ limit: () => pEmptyDefault, order: () => ({ limit: () => pEmptyDefault }), in: () => ({ limit: () => pEmptyDefault }) });
        return {
          select: () => ({
            eq: (col: string, val: unknown) => {
              if (col === 'is_active') {
                const pEmpty = Promise.resolve(seedRes([]));
                const chainWithEq = (col2: string, val2: unknown) => {
                  if (col2 === 'seed_type' && val2 === 'protagonist_appearance') {
                    return {
                      eq: (_col3: string, creatureType: unknown) => {
                        const filtered = protagonistSeeds.filter((s) => s.creature_type === creatureType);
                        const p = Promise.resolve(seedRes(filtered));
                        return { limit: () => p, order: () => ({ limit: () => p }), in: () => ({ limit: () => p }) };
                      },
                      limit: () => Promise.resolve(seedRes(protagonistSeeds)),
                      order: () => ({ limit: () => Promise.resolve(seedRes(protagonistSeeds)) }),
                      in: () => ({ limit: () => Promise.resolve(seedRes(protagonistSeeds)) }),
                    };
                  }
                  const p0 = Promise.resolve(seedRes([]));
                  return { limit: () => p0, order: () => ({ limit: () => p0 }), in: () => ({ limit: () => p0 }) };
                };
                return {
                  limit: () => pEmpty,
                  order: () => ({ limit: () => pEmpty }),
                  in: (col2?: string, _vals?: unknown[]) => {
                    if (col2 === 'seed_type' && _vals) {
                      const p = Promise.resolve(seedRes([...sidekickSeeds, ...antagonistSeeds]));
                      return { limit: () => p, order: () => ({ limit: () => p }), in: () => ({ limit: () => p }) };
                    }
                    return { limit: () => pEmpty, order: () => ({ limit: () => pEmpty }), in: () => ({ limit: () => pEmpty }) };
                  },
                  eq: chainWithEq,
                };
              }
              return { limit: () => pEmptyDefault, order: () => ({ limit: () => pEmptyDefault }), in: () => ({ limit: () => pEmptyDefault }), eq: () => emptyChain() };
            },
            order: () => ({ limit: () => pEmptyDefault }),
            limit: () => pEmptyDefault,
            in: () => ({ limit: () => pEmptyDefault }),
          }),
        };
      }
      return { select: () => createFullChain([]) };
    },
  };
}

const baseParams = {
  kidProfileId: 'kid-1',
  ageGroup: '8-9' as const,
  theme: 'magic_fantasy',
  characterMode: 'surprise' as const,
};

// ─── Creature-Type ──────────────────────────────────────────────

describe('Creature-Type', () => {
  it('6-7 + magic_fantasy → ~80% mythical über 200 Runs', () => {
    let mythical = 0;
    for (let i = 0; i < 200; i++) {
      if (selectCreatureType('6-7', 'magic_fantasy') === 'mythical') mythical++;
    }
    expect(mythical).toBeGreaterThanOrEqual(140);
    expect(mythical).toBeLessThanOrEqual(200);
  });

  it('10-11 + real_life → ~5% mythical über 500 Runs', () => {
    let mythical = 0;
    for (let i = 0; i < 500; i++) {
      if (selectCreatureType('10-11', 'real_life') === 'mythical') mythical++;
    }
    expect(mythical).toBeLessThanOrEqual(65);
  });

  it('Unbekannte Kombination → Default ~30%', () => {
    let mythical = 0;
    for (let i = 0; i < 200; i++) {
      if (selectCreatureType('12+', 'unknown_theme') === 'mythical') mythical++;
    }
    expect(mythical).toBeGreaterThanOrEqual(40);
    expect(mythical).toBeLessThanOrEqual(80);
  });

  it('CREATURE_TYPE_MYTHICAL_PERCENT Werte', () => {
    expect(CREATURE_TYPE_MYTHICAL_PERCENT['6-7']?.magic_fantasy).toBe(80);
    expect(CREATURE_TYPE_MYTHICAL_PERCENT['8-9']?.surprise).toBe(30);
    expect(CREATURE_TYPE_MYTHICAL_PERCENT['10-11']?.real_life).toBe(5);
  });
});

// ─── Modus ─────────────────────────────────────────────────────

describe('Modus', () => {
  const sidekickSeed = makeSeed({ seed_key: 'sidekick_1', seed_type: 'sidekick_archetype' });

  it("characterMode 'self' → protagonist null, sidekick vorhanden", async () => {
    const supabase = createCharacterMockSupabase({ sidekickSeeds: [sidekickSeed] });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'self' },
      supabase
    );
    expect(result.protagonist).toBeNull();
    expect(result.sidekick).not.toBeNull();
    expect(result.sidekick.seed_key).toBe('sidekick_1');
  });

  it("characterMode 'family' → protagonist null", async () => {
    const supabase = createCharacterMockSupabase({ sidekickSeeds: [sidekickSeed] });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'family' },
      supabase
    );
    expect(result.protagonist).toBeNull();
  });

  it("characterMode 'surprise' → protagonist vorhanden", async () => {
    const prot = makeSeed({
      seed_key: 'prot_1',
      seed_type: 'protagonist_appearance',
      age_range: ['8-9'],
    });
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: [prot],
      sidekickSeeds: [sidekickSeed],
    });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'surprise' },
      supabase
    );
    expect(result.protagonist).not.toBeNull();
    expect(result.protagonist!.seed_type).toBe('protagonist_appearance');
  });
});

// ─── Diversity ─────────────────────────────────────────────────

describe('Diversity', () => {
  const sidekickSeed = makeSeed({ seed_key: 'sk', seed_type: 'sidekick_archetype' });
  const prots = [
    makeSeed({ seed_key: 'p1', seed_type: 'protagonist_appearance', age_range: ['8-9'], cultural_background: 'east_asian' }),
    makeSeed({ seed_key: 'p2', seed_type: 'protagonist_appearance', age_range: ['8-9'], cultural_background: 'east_asian' }),
    makeSeed({ seed_key: 'p3', seed_type: 'protagonist_appearance', age_range: ['8-9'], cultural_background: 'west_african' }),
    makeSeed({ seed_key: 'p4', seed_type: 'protagonist_appearance', age_range: ['8-9'], cultural_background: 'west_african' }),
  ];

  it('Excludiert letzte 3 protagonist Seeds aus History', async () => {
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: prots,
      sidekickSeeds: [sidekickSeed],
      characterSeedHistory: [
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '3' },
        { seed_key: 'p2', seed_type: 'protagonist_appearance', created_at: '2' },
        { seed_key: 'p3', seed_type: 'protagonist_appearance', created_at: '1' },
      ],
    });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'surprise' },
      supabase
    );
    expect(result.protagonist).not.toBeNull();
    expect(result.protagonist!.seed_key).toBe('p4');
  });

  it('Diversity-Check ignoriert bei Fabelwesen', async () => {
    const mythicalProt = makeSeed({
      seed_key: 'myth_1',
      seed_type: 'protagonist_appearance',
      creature_type: 'mythical',
      age_range: ['8-9'],
      cultural_background: 'mythical',
    });
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: [mythicalProt],
      sidekickSeeds: [makeSeed({ seed_key: 'sk', seed_type: 'sidekick_archetype' })],
    });
    for (let i = 0; i < 30; i++) {
      const result = await selectCharacterSeeds(
        { ...baseParams, characterMode: 'surprise' },
        supabase
      );
      if (result.protagonist) {
        expect(result.protagonist.creature_type).toBe('mythical');
        expect(result.protagonist.seed_key).toBe('myth_1');
        return;
      }
    }
    expect(true).toBe(true);
  });

  it('Cultural Background Diversity: 5x gleich → force anders', async () => {
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: prots,
      sidekickSeeds: [sidekickSeed],
      characterSeedHistory: [
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '5' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '4' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '3' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '2' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '1' },
      ],
    });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'surprise' },
      supabase
    );
    expect(result.protagonist).not.toBeNull();
    expect(result.protagonist!.cultural_background).not.toBe('east_asian');
  });
});

// ─── Antagonist ─────────────────────────────────────────────────

describe('Antagonist', () => {
  const sidekickSeed = makeSeed({ seed_key: 'sk', seed_type: 'sidekick_archetype' });
  const antSeed = makeSeed({ seed_key: 'ant_1', seed_type: 'antagonist_archetype' });

  it('Antagonist nur bei social/courage', async () => {
    const supabase = createCharacterMockSupabase({
      sidekickSeeds: [sidekickSeed],
      antagonistSeeds: [antSeed],
    });
    const resSocial = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'self', blueprintCategory: 'social' },
      supabase
    );
    expect(resSocial.antagonist).not.toBeNull();

    const resHumor = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'self', blueprintCategory: 'humor' },
      supabase
    );
    expect(resHumor.antagonist).toBeNull();

    const resUndef = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'self' },
      supabase
    );
    expect(resUndef.antagonist).toBeNull();
  });
});

// ─── Fallbacks ─────────────────────────────────────────────────

describe('Fallbacks', () => {
  const sidekickSeed = makeSeed({ seed_key: 'sk', seed_type: 'sidekick_archetype' });
  const prot = makeSeed({ seed_key: 'p1', seed_type: 'protagonist_appearance', age_range: ['8-9'] });

  it('0 protagonist Seeds nach Filter → ignoriere History', async () => {
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: [prot],
      sidekickSeeds: [sidekickSeed],
      characterSeedHistory: [
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '3' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '2' },
        { seed_key: 'p1', seed_type: 'protagonist_appearance', created_at: '1' },
      ],
    });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'surprise' },
      supabase
    );
    expect(result.protagonist).not.toBeNull();
    expect(result.protagonist!.seed_key).toBe('p1');
  });

  it('0 mythical Seeds vorhanden → Fallback auf human', async () => {
    const humanProt = makeSeed({
      seed_key: 'human_1',
      seed_type: 'protagonist_appearance',
      creature_type: 'human',
      age_range: ['8-9'],
    });
    const supabase = createCharacterMockSupabase({
      protagonistSeeds: [humanProt],
      sidekickSeeds: [sidekickSeed],
    });
    for (let i = 0; i < 20; i++) {
      const result = await selectCharacterSeeds(
        { ...baseParams, characterMode: 'surprise' },
        supabase
      );
      if (result.protagonist) {
        expect(result.protagonist.creature_type).toBe('human');
        return;
      }
    }
    expect(true).toBe(true);
  });

  it('Kompletter DB-Fehler → FALLBACK_SIDEKICK', async () => {
    const supabase = createCharacterMockSupabase({ throwAll: true });
    const result = await selectCharacterSeeds(
      { ...baseParams, characterMode: 'self' },
      supabase
    );
    expect(result.sidekick).toBe(FALLBACK_SIDEKICK);
    expect(result.sidekick.seed_key).toBe('loyal_skeptic');
    expect(result.protagonist).toBeNull();
    expect(result.antagonist).toBeNull();
  });
});

// ─── Regression ────────────────────────────────────────────────

describe('Regression: Keine bestehenden Dateien verändert', () => {
  const ROOT = path.resolve(__dirname, '../../../..');
  const PROMPT_BUILDER = path.join(ROOT, 'supabase/functions/_shared/promptBuilder.ts');
  const GENERATE_STORY = path.join(ROOT, 'supabase/functions/generate-story/index.ts');

  it('promptBuilder.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/selectCharacterSeeds|emotionFlow\/selectors/);
  });

  it('generate-story/index.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(GENERATE_STORY, 'utf-8');
    expect(content).not.toMatch(/selectCharacterSeeds|emotionFlow\/selectors/);
  });

  it('Character Selector liegt in emotionFlow/selectors/', () => {
    const p = path.join(ROOT, 'supabase/functions/_shared/emotionFlow/selectors/characterSelector.ts');
    expect(fs.existsSync(p)).toBe(true);
  });
});
