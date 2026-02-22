/**
 * Unit tests — Emotion-Flow Selectors (Phase 4)
 * intensitySelector, blueprintSelector, toneSelector
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  selectIntensity,
  INTENSITY_WEIGHTS,
  selectBlueprint,
  selectTone,
  TONE_WEIGHTS,
  weightedRandom,
} from '../../_shared/emotionFlow/selectors/index';

type EmotionFlowSupabase = import('../../_shared/emotionFlow/types').EmotionFlowSupabase;

function createMockSupabase(overrides: {
  historyIntensity?: { intensity_level: string }[];
  historyBlueprintKeys?: string[];
  historyToneModes?: (string | null)[];
  blueprints?: unknown[];
  throwOnHistory?: boolean;
  throwOnBlueprints?: boolean;
  historyError?: unknown;
}): EmotionFlowSupabase {
  const chain = (result: Promise<{ data: unknown; error: unknown }>) => ({
    order: () => ({ limit: () => result }),
    limit: () => result,
  });
  return {
    from(table: string) {
      if (table === 'emotion_blueprint_history') {
        if (overrides.throwOnHistory) {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({ limit: () => Promise.reject(new Error('DB error')) }),
              }),
            }),
          };
        }
        const intensityData = overrides.historyIntensity ?? [];
        const keysData = (overrides.historyBlueprintKeys ?? []).map((k) => ({ blueprint_key: k }));
        const toneData = (overrides.historyToneModes ?? []).map((t) => ({ tone_mode: t }));
        return {
          select(columns?: string) {
            const res =
              columns === 'intensity_level'
                ? { data: intensityData, error: null }
                : columns === 'blueprint_key'
                  ? { data: keysData, error: null }
                  : { data: toneData, error: overrides.historyError ?? null };
            return {
              eq: () => ({
                order: () => ({ limit: () => Promise.resolve(res) }),
              }),
            };
          },
        };
      }
      if (table === 'emotion_blueprints') {
        if (overrides.throwOnBlueprints) {
          return {
            select: () => ({
              eq: () => ({ limit: () => Promise.reject(new Error('DB error')) }),
            }),
          };
        }
        const data = overrides.blueprints ?? [];
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }) };
    },
  };
}

// ─── Intensity Selector ─────────────────────────────────────────

describe('Intensity Selector', () => {
  it('Verteilung über 1000 Aufrufe ohne History ≈ 30/50/20 (±8%)', async () => {
    const supabase = createMockSupabase({ historyIntensity: [] });
    const counts = { light: 0, medium: 0, deep: 0 };
    for (let i = 0; i < 1000; i++) {
      const level = await selectIntensity('kid-1', supabase);
      counts[level]++;
    }
    expect(counts.light).toBeGreaterThanOrEqual(220);
    expect(counts.light).toBeLessThanOrEqual(380);
    expect(counts.medium).toBeGreaterThanOrEqual(420);
    expect(counts.medium).toBeLessThanOrEqual(580);
    expect(counts.deep).toBeGreaterThanOrEqual(120);
    expect(counts.deep).toBeLessThanOrEqual(280);
  });

  it('Anti-Monotonie: 3x gleiche Intensity → nächste ist anders', async () => {
    const supabase = createMockSupabase({
      historyIntensity: [
        { intensity_level: 'medium' },
        { intensity_level: 'medium' },
        { intensity_level: 'medium' },
      ],
    });
    let mediumCount = 0;
    for (let i = 0; i < 100; i++) {
      const level = await selectIntensity('kid-1', supabase);
      if (level === 'medium') mediumCount++;
    }
    expect(mediumCount).toBe(0);
  });

  it('DB-Fehler → Default medium', async () => {
    const supabase = createMockSupabase({ throwOnHistory: true });
    const level = await selectIntensity('kid-1', supabase);
    expect(level).toBe('medium');
  });
});

// ─── Blueprint Selector ─────────────────────────────────────────

describe('Blueprint Selector', () => {
  const baseParams = {
    kidProfileId: 'kid-1',
    ageGroup: '8-9' as const,
    theme: 'magic_fantasy',
    intensity: 'medium' as const,
  };

  it('Light intensity → return null', async () => {
    const supabase = createMockSupabase({});
    const result = await selectBlueprint(
      { ...baseParams, intensity: 'light' },
      supabase
    );
    expect(result).toBeNull();
  });

  it('Filtert nach ageGroup und theme', async () => {
    const blueprints = [
      {
        id: 'a',
        blueprint_key: 'bp-a',
        ideal_age_groups: ['8-9'],
        compatible_themes: ['magic_fantasy'],
        min_intensity: 'light',
        weight: 10,
        labels: {},
        descriptions: {},
        category: 'growth',
        arc_by_age: {},
        arc_description_en: '',
        compatible_learning_themes: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'b',
        blueprint_key: 'bp-b',
        ideal_age_groups: ['8-9'],
        compatible_themes: ['magic_fantasy'],
        min_intensity: 'medium',
        weight: 10,
        labels: {},
        descriptions: {},
        category: 'growth',
        arc_by_age: {},
        arc_description_en: '',
        compatible_learning_themes: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'c',
        blueprint_key: 'bp-c',
        ideal_age_groups: ['10-11'],
        compatible_themes: ['magic_fantasy'],
        min_intensity: 'light',
        weight: 10,
        labels: {},
        descriptions: {},
        category: 'growth',
        arc_by_age: {},
        arc_description_en: '',
        compatible_learning_themes: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    ];
    const supabase = createMockSupabase({ blueprints, historyBlueprintKeys: [] });
    const result = await selectBlueprint({ ...baseParams }, supabase);
    expect(result).not.toBeNull();
    expect(['bp-a', 'bp-b']).toContain(result!.blueprint_key);
  });

  it('Excludiert letzte 5 aus History', async () => {
    const blueprints = [
      { id: '1', blueprint_key: 'key-a', ideal_age_groups: ['8-9'], compatible_themes: ['magic_fantasy'], min_intensity: 'light', weight: 10, labels: {}, descriptions: {}, category: 'growth', arc_by_age: {}, arc_description_en: '', compatible_learning_themes: null, is_active: true, created_at: '', updated_at: '' },
      { id: '2', blueprint_key: 'key-b', ideal_age_groups: ['8-9'], compatible_themes: ['magic_fantasy'], min_intensity: 'light', weight: 10, labels: {}, descriptions: {}, category: 'growth', arc_by_age: {}, arc_description_en: '', compatible_learning_themes: null, is_active: true, created_at: '', updated_at: '' },
      { id: '3', blueprint_key: 'key-c', ideal_age_groups: ['8-9'], compatible_themes: ['magic_fantasy'], min_intensity: 'light', weight: 10, labels: {}, descriptions: {}, category: 'growth', arc_by_age: {}, arc_description_en: '', compatible_learning_themes: null, is_active: true, created_at: '', updated_at: '' },
    ];
    const supabase = createMockSupabase({
      blueprints,
      historyBlueprintKeys: ['key-a', 'key-b'],
    });
    const result = await selectBlueprint({ ...baseParams }, supabase);
    expect(result).not.toBeNull();
    expect(result!.blueprint_key).toBe('key-c');
  });

  it('Fallback bei 0 Ergebnissen nach Filter', async () => {
    const blueprints = [
      { id: '1', blueprint_key: 'only-one', ideal_age_groups: ['8-9'], compatible_themes: ['magic_fantasy'], min_intensity: 'light', weight: 10, labels: {}, descriptions: {}, category: 'growth', arc_by_age: {}, arc_description_en: '', compatible_learning_themes: null, is_active: true, created_at: '', updated_at: '' },
    ];
    const supabase = createMockSupabase({
      blueprints,
      historyBlueprintKeys: ['only-one'],
    });
    const result = await selectBlueprint({ ...baseParams }, supabase);
    expect(result).not.toBeNull();
    expect(result!.blueprint_key).toBe('only-one');
  });
});

// ─── Tone Selector ──────────────────────────────────────────────

describe('Tone Selector', () => {
  const baseParams = { kidProfileId: 'kid-1', ageGroup: '6-7' as const };

  it("'absurd' nur bei humor + junge Kids", async () => {
    const supabase = createMockSupabase({ historyToneModes: [] });
    let absurdCount = 0;
    for (let i = 0; i < 100; i++) {
      const tone = await selectTone(
        { ...baseParams, blueprintCategory: 'humor' },
        supabase
      );
      if (tone === 'absurd') absurdCount++;
    }
    expect(absurdCount).toBeGreaterThanOrEqual(1);
  });

  it("'absurd' NIE bei non-humor oder ältere Kids", async () => {
    const supabase = createMockSupabase({ historyToneModes: [] });
    let absurdCount = 0;
    for (let i = 0; i < 100; i++) {
      const tone = await selectTone(
        { ...baseParams, ageGroup: '10-11', blueprintCategory: 'growth' },
        supabase
      );
      if (tone === 'absurd') absurdCount++;
    }
    expect(absurdCount).toBe(0);
  });

  it('History-Exclude für letzte 2 Tones', async () => {
    const supabase = createMockSupabase({
      historyToneModes: ['dramatic', 'comedic'],
    });
    for (let i = 0; i < 100; i++) {
      const tone = await selectTone({ ...baseParams }, supabase);
      expect(tone).not.toBe('dramatic');
      expect(tone).not.toBe('comedic');
    }
  });

  it('Alle Tones excluded → Reset auf vollen Pool', async () => {
    const supabase = createMockSupabase({
      historyToneModes: ['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd'],
    });
    const tone = await selectTone({ ...baseParams, blueprintCategory: 'humor' }, supabase);
    expect(['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd']).toContain(tone);
  });
});

// ─── weightedRandom & Exports ───────────────────────────────────

describe('weightedRandom and exports', () => {
  it('weightedRandom returns one of items', () => {
    const items = ['a', 'b', 'c'];
    const weights = [1, 2, 3];
    for (let i = 0; i < 50; i++) {
      const r = weightedRandom(items, weights);
      expect(items).toContain(r);
    }
  });

  it('INTENSITY_WEIGHTS has light/medium/deep', () => {
    expect(INTENSITY_WEIGHTS.light).toBe(30);
    expect(INTENSITY_WEIGHTS.medium).toBe(50);
    expect(INTENSITY_WEIGHTS.deep).toBe(20);
  });

  it('TONE_WEIGHTS is a function', () => {
    expect(typeof TONE_WEIGHTS).toBe('function');
    expect(TONE_WEIGHTS('absurd', '6-7', 'humor')).toBe(10);
    expect(TONE_WEIGHTS('absurd', '10-11', 'growth')).toBe(0);
  });
});

// ─── Regression: Bestehende Pipeline nicht berührt ───────────────

describe('Bestehende Pipeline nicht berührt', () => {
  const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
  const PROMPT_BUILDER = path.join(WORKSPACE_ROOT, 'supabase/functions/_shared/promptBuilder.ts');
  const GENERATE_STORY = path.join(WORKSPACE_ROOT, 'supabase/functions/generate-story/index.ts');
  const EMOTION_FLOW_SELECTORS = path.join(WORKSPACE_ROOT, 'supabase/functions/_shared/emotionFlow/selectors');

  it('promptBuilder.ts ist UNVERÄNDERT (kein Import von emotionFlow selectors)', () => {
    const content = fs.readFileSync(PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/selectIntensity|selectBlueprint|selectTone|emotionFlow\/selectors/);
  });

  it('generate-story/index.ts ist UNVERÄNDERT (kein Import von emotionFlow selectors)', () => {
    const content = fs.readFileSync(GENERATE_STORY, 'utf-8');
    expect(content).not.toMatch(/selectIntensity|selectBlueprint|selectTone|emotionFlow\/selectors/);
  });

  it('Alle neuen Selector-Dateien liegen in emotionFlow/selectors/', () => {
    expect(fs.existsSync(path.join(EMOTION_FLOW_SELECTORS, 'intensitySelector.ts'))).toBe(true);
    expect(fs.existsSync(path.join(EMOTION_FLOW_SELECTORS, 'blueprintSelector.ts'))).toBe(true);
    expect(fs.existsSync(path.join(EMOTION_FLOW_SELECTORS, 'toneSelector.ts'))).toBe(true);
  });
});
