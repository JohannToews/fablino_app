/**
 * Unit tests — Story Element Selector (Phase 4, Task 4.5)
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  selectStoryElements,
  shouldSelectElement,
  FALLBACK_OPENING,
  FALLBACK_PERSPECTIVE,
  FALLBACK_CLOSING,
} from '../../_shared/emotionFlow/selectors/index.ts';
import type { StoryElement } from '../../_shared/emotionFlow/types.ts';
import type { EmotionFlowSupabase } from '../../_shared/emotionFlow/types.ts';

function makeElement(
  overrides: Partial<StoryElement> & { element_key: string; element_type: StoryElement['element_type'] }
): StoryElement {
  return {
    id: overrides.id ?? overrides.element_key,
    element_key: overrides.element_key,
    element_type: overrides.element_type,
    content_en: overrides.content_en ?? '',
    labels: overrides.labels ?? null,
    compatible_themes: overrides.compatible_themes ?? null,
    compatible_categories: overrides.compatible_categories ?? null,
    age_groups: overrides.age_groups ?? [],
    weight: overrides.weight ?? 10,
    is_active: true,
    created_at: overrides.created_at ?? '',
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

function createElementMockSupabase(overrides: {
  elements?: StoryElement[];
  usageHistory?: { element_key: string; element_type: string; created_at: string }[];
  throwAll?: boolean;
  fromCallCounter?: { count: number };
}): EmotionFlowSupabase {
  const elements = overrides.elements ?? [];
  const history = overrides.usageHistory ?? [];
  const counter = overrides.fromCallCounter;

  const historyRes = { data: history, error: null };
  const elementsRes = { data: elements.map((e) => ({ ...e })), error: null };

  return {
    from(table: string) {
      if (counter) counter.count += 1;
      if (overrides.throwAll) {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => Promise.reject(new Error('DB error')) }),
              limit: () => Promise.reject(new Error('DB error')),
              in: () => ({ limit: () => Promise.reject(new Error('DB error')) }),
            }),
          }),
        };
      }
      if (table === 'story_element_usage') {
        const p = Promise.resolve(historyRes);
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => p }),
              limit: () => p,
              in: () => ({ limit: () => p }),
            }),
          }),
        };
      }
      if (table === 'story_elements') {
        const p = Promise.resolve(elementsRes);
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => p }),
              limit: () => p,
              in: () => ({ limit: () => p }),
            }),
          }),
        };
      }
      return {
        select: () => createFullChain([]),
      };
    },
  };
}

const baseParams = {
  kidProfileId: 'kid-1',
  ageGroup: '8-9' as const,
  theme: 'magic_fantasy',
  intensity: 'medium' as const,
  tone: 'gentle' as const,
};

const requiredElements = [
  makeElement({ element_key: 'open_1', element_type: 'opening_style', age_groups: ['8-9'] }),
  makeElement({ element_key: 'persp_1', element_type: 'narrative_perspective', age_groups: ['8-9'] }),
  makeElement({ element_key: 'close_1', element_type: 'closing_style', age_groups: ['8-9'] }),
];

// ─── Element-Auswahl ─────────────────────────────────────────────

describe('Element-Auswahl', () => {
  it('Opening, Perspective, Closing werden IMMER gewählt', async () => {
    const supabase = createElementMockSupabase({ elements: requiredElements });
    const tests = [
      { ...baseParams, intensity: 'light' as const, theme: 'real_life', tone: 'gentle' as const },
      { ...baseParams, intensity: 'deep' as const, theme: 'magic_fantasy', tone: 'comedic' as const },
      { ...baseParams, intensity: 'medium' as const, theme: 'surprise', tone: 'dramatic' as const },
    ];
    for (const params of tests) {
      const result = await selectStoryElements(params, supabase);
      expect(result.opening).not.toBeNull();
      expect(result.perspective).not.toBeNull();
      expect(result.closing).not.toBeNull();
    }
  });

  it('Macguffin bei magic_fantasy', async () => {
    const mac = makeElement({ element_key: 'mac_1', element_type: 'macguffin', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [...requiredElements, mac],
    });
    const result = await selectStoryElements(
      { ...baseParams, theme: 'magic_fantasy', intensity: 'light' },
      supabase
    );
    expect(result.macguffin).not.toBeNull();
  });

  it('Macguffin bei deep intensity unabhängig vom Theme', async () => {
    const mac = makeElement({ element_key: 'mac_2', element_type: 'macguffin', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [...requiredElements, mac],
    });
    const result = await selectStoryElements(
      { ...baseParams, theme: 'real_life', intensity: 'deep' },
      supabase
    );
    expect(result.macguffin).not.toBeNull();
  });

  it('Kein Macguffin bei real_life + medium', async () => {
    const supabase = createElementMockSupabase({ elements: requiredElements });
    const result = await selectStoryElements(
      { ...baseParams, theme: 'real_life', intensity: 'medium' },
      supabase
    );
    expect(result.macguffin).toBeNull();
  });

  it('Humor nur bei comedic/absurd Tone oder humor Blueprint', async () => {
    const humor = makeElement({ element_key: 'hum_1', element_type: 'humor_technique', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [...requiredElements, humor],
    });
    const resComedic = await selectStoryElements(
      { ...baseParams, tone: 'comedic' as const },
      supabase
    );
    expect(resComedic.humorTechnique).not.toBeNull();

    const resDramaticGrowth = await selectStoryElements(
      { ...baseParams, tone: 'dramatic' as const, blueprintCategory: 'growth' },
      supabase
    );
    expect(resDramaticGrowth.humorTechnique).toBeNull();

    const resDramaticHumor = await selectStoryElements(
      { ...baseParams, tone: 'dramatic' as const, blueprintCategory: 'humor' },
      supabase
    );
    expect(resDramaticHumor.humorTechnique).not.toBeNull();
  });

  it('Tension nur bei deep + nicht 6-7', async () => {
    const tension = makeElement({ element_key: 'ten_1', element_type: 'tension_technique', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [...requiredElements, tension],
    });
    const resDeep89 = await selectStoryElements(
      { ...baseParams, intensity: 'deep', ageGroup: '8-9' },
      supabase
    );
    expect(resDeep89.tensionTechnique).not.toBeNull();

    const resDeep67 = await selectStoryElements(
      { ...baseParams, intensity: 'deep', ageGroup: '6-7' },
      supabase
    );
    expect(resDeep67.tensionTechnique).toBeNull();

    const resMedium = await selectStoryElements(
      { ...baseParams, intensity: 'medium', ageGroup: '10-11' },
      supabase
    );
    expect(resMedium.tensionTechnique).toBeNull();
  });

  it('Setting bei ~50%', async () => {
    const set = makeElement({ element_key: 'set_1', element_type: 'setting_detail', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [...requiredElements, set],
    });
    let withSetting = 0;
    for (let i = 0; i < 200; i++) {
      const result = await selectStoryElements(baseParams, supabase);
      if (result.settingDetail != null) withSetting++;
    }
    expect(withSetting).toBeGreaterThanOrEqual(70);
    expect(withSetting).toBeLessThanOrEqual(130);
  });
});

// ─── shouldSelectElement ───────────────────────────────────────

describe('shouldSelectElement', () => {
  const p = {
    ageGroup: '8-9',
    theme: 'real_life',
    intensity: 'light' as const,
    tone: 'gentle' as const,
  };

  it('opening_style/perspective/closing immer true', () => {
    expect(shouldSelectElement('opening_style', p)).toBe(true);
    expect(shouldSelectElement('narrative_perspective', p)).toBe(true);
    expect(shouldSelectElement('closing_style', p)).toBe(true);
  });

  it('intensity light + theme real_life + tone gentle + 6-7: nur opening, perspective, closing', () => {
    const params = { ...p, ageGroup: '6-7' };
    expect(shouldSelectElement('macguffin', params)).toBe(false);
    expect(shouldSelectElement('humor_technique', params)).toBe(false);
    expect(shouldSelectElement('tension_technique', params)).toBe(false);
  });
});

// ─── History-Exclude ───────────────────────────────────────────

describe('History-Exclude', () => {
  it('Letzte 3 Openings excluded', async () => {
    const openings = [
      makeElement({ element_key: 'o1', element_type: 'opening_style', age_groups: ['8-9'] }),
      makeElement({ element_key: 'o2', element_type: 'opening_style', age_groups: ['8-9'] }),
      makeElement({ element_key: 'o3', element_type: 'opening_style', age_groups: ['8-9'] }),
      makeElement({ element_key: 'o4', element_type: 'opening_style', age_groups: ['8-9'] }),
    ];
    const supabase = createElementMockSupabase({
      elements: [
        ...openings,
        makeElement({ element_key: 'p1', element_type: 'narrative_perspective', age_groups: ['8-9'] }),
        makeElement({ element_key: 'c1', element_type: 'closing_style', age_groups: ['8-9'] }),
      ],
      usageHistory: [
        { element_key: 'o1', element_type: 'opening_style', created_at: '3' },
        { element_key: 'o2', element_type: 'opening_style', created_at: '2' },
        { element_key: 'o3', element_type: 'opening_style', created_at: '1' },
      ],
    });
    const result = await selectStoryElements(baseParams, supabase);
    expect(result.opening.element_key).toBe('o4');
  });

  it('History pro Typ getrennt', async () => {
    const o1 = makeElement({ element_key: 'open_a', element_type: 'opening_style', age_groups: ['8-9'] });
    const o2 = makeElement({ element_key: 'open_b', element_type: 'opening_style', age_groups: ['8-9'] });
    const p1 = makeElement({ element_key: 'pers_a', element_type: 'narrative_perspective', age_groups: ['8-9'] });
    const p2 = makeElement({ element_key: 'pers_b', element_type: 'narrative_perspective', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [o1, o2, p1, p2, makeElement({ element_key: 'cl_1', element_type: 'closing_style', age_groups: ['8-9'] })],
      usageHistory: [
        { element_key: 'open_a', element_type: 'opening_style', created_at: '3' },
        { element_key: 'open_a', element_type: 'opening_style', created_at: '2' },
        { element_key: 'open_a', element_type: 'opening_style', created_at: '1' },
        { element_key: 'pers_a', element_type: 'narrative_perspective', created_at: '3' },
        { element_key: 'pers_a', element_type: 'narrative_perspective', created_at: '2' },
        { element_key: 'pers_a', element_type: 'narrative_perspective', created_at: '1' },
      ],
    });
    const result = await selectStoryElements(baseParams, supabase);
    expect(result.opening.element_key).toBe('open_b');
    expect(result.perspective.element_key).toBe('pers_b');
  });
});

// ─── Fallbacks ──────────────────────────────────────────────────

describe('Fallbacks', () => {
  it('0 Elements nach Filter → ignoriere History', async () => {
    const onlyOne = makeElement({ element_key: 'only_open', element_type: 'opening_style', age_groups: ['8-9'] });
    const supabase = createElementMockSupabase({
      elements: [
        onlyOne,
        makeElement({ element_key: 'p1', element_type: 'narrative_perspective', age_groups: ['8-9'] }),
        makeElement({ element_key: 'c1', element_type: 'closing_style', age_groups: ['8-9'] }),
      ],
      usageHistory: [
        { element_key: 'only_open', element_type: 'opening_style', created_at: '3' },
        { element_key: 'only_open', element_type: 'opening_style', created_at: '2' },
        { element_key: 'only_open', element_type: 'opening_style', created_at: '1' },
      ],
    });
    const result = await selectStoryElements(baseParams, supabase);
    expect(result.opening.element_key).toBe('only_open');
  });

  it('DB-Fehler → Fallback-Konstanten', async () => {
    const supabase = createElementMockSupabase({ throwAll: true });
    const result = await selectStoryElements(baseParams, supabase);
    expect(result.opening).toBe(FALLBACK_OPENING);
    expect(result.perspective).toBe(FALLBACK_PERSPECTIVE);
    expect(result.closing).toBe(FALLBACK_CLOSING);
    expect(result.macguffin).toBeNull();
    expect(result.settingDetail).toBeNull();
    expect(result.humorTechnique).toBeNull();
    expect(result.tensionTechnique).toBeNull();
  });
});

// ─── Performance: max 2 Queries ───────────────────────────────

describe('Performance: Maximal 2 DB-Queries', () => {
  it('supabase.from() maximal 2x aufgerufen', async () => {
    const fromCallCounter = { count: 0 };
    const supabase = createElementMockSupabase({
      elements: requiredElements,
      fromCallCounter,
    });
    await selectStoryElements(baseParams, supabase);
    expect(fromCallCounter.count).toBeLessThanOrEqual(2);
  });
});

// ─── Regression ────────────────────────────────────────────────

describe('Regression: Keine bestehenden Dateien verändert', () => {
  const ROOT = path.resolve(__dirname, '../../../..');
  const PROMPT_BUILDER = path.join(ROOT, 'supabase/functions/_shared/promptBuilder.ts');
  const GENERATE_STORY = path.join(ROOT, 'supabase/functions/generate-story/index.ts');

  it('promptBuilder.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/selectStoryElements|emotionFlow\/selectors/);
  });

  it('generate-story/index.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(GENERATE_STORY, 'utf-8');
    expect(content).not.toMatch(/selectStoryElements|emotionFlow\/selectors/);
  });
});
