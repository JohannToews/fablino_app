/**
 * Unit tests — Emotion-Flow-Engine Orchestrator (Task 6.1)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EmotionFlowMetadata } from '../../_shared/emotionFlow/types.ts';
import type { CharacterSeed } from '../../_shared/emotionFlow/types.ts';
import type { StoryElement } from '../../_shared/emotionFlow/types.ts';
import type { SelectedElements } from '../../_shared/emotionFlow/types.ts';

// Shared mock fns (configured per test)
const mockSelectIntensity = vi.fn();
const mockSelectBlueprint = vi.fn();
const mockSelectTone = vi.fn();
const mockSelectCharacterSeeds = vi.fn();
const mockSelectStoryElements = vi.fn();
const mockBuildArcBlock = vi.fn();
const mockBuildToneBlock = vi.fn();
const mockBuildRelationshipBlock = vi.fn();
const mockBuildCharacterBlock = vi.fn();
const mockBuildElementBlocks = vi.fn();
const mockGetCriticalRules = vi.fn();

vi.mock('../../_shared/emotionFlow/selectors/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../_shared/emotionFlow/selectors/index.ts')>();
  return {
    ...actual,
    selectIntensity: (...args: unknown[]) => mockSelectIntensity(...args),
    selectBlueprint: (...args: unknown[]) => mockSelectBlueprint(...args),
    selectTone: (...args: unknown[]) => mockSelectTone(...args),
    selectCharacterSeeds: (...args: unknown[]) => mockSelectCharacterSeeds(...args),
    selectStoryElements: (...args: unknown[]) => mockSelectStoryElements(...args),
  };
});

vi.mock('../../_shared/emotionFlow/promptBuilder/blocks/index.ts', () => ({
  buildArcBlock: (...args: unknown[]) => mockBuildArcBlock(...args),
  buildToneBlock: (...args: unknown[]) => mockBuildToneBlock(...args),
  buildRelationshipBlock: (...args: unknown[]) => mockBuildRelationshipBlock(...args),
  buildCharacterBlock: (...args: unknown[]) => mockBuildCharacterBlock(...args),
  buildElementBlocks: (...args: unknown[]) => mockBuildElementBlocks(...args),
}));

vi.mock('../../_shared/emotionFlow/promptBuilder/criticalRules.ts', () => ({
  getCriticalRules: () => mockGetCriticalRules(),
}));

function minimalSeed(overrides: Partial<CharacterSeed> & { seed_key: string }): CharacterSeed {
  return {
    id: overrides.id ?? overrides.seed_key,
    seed_key: overrides.seed_key,
    seed_type: overrides.seed_type ?? 'sidekick_archetype',
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

function minimalElement(overrides: Partial<StoryElement> & { element_key: string }): StoryElement {
  return {
    id: overrides.id ?? overrides.element_key,
    element_key: overrides.element_key,
    element_type: overrides.element_type ?? 'opening_style',
    content_en: overrides.content_en ?? '',
    labels: overrides.labels ?? null,
    compatible_themes: overrides.compatible_themes ?? null,
    compatible_categories: overrides.compatible_categories ?? null,
    age_groups: overrides.age_groups ?? [],
    weight: overrides.weight ?? 10,
    is_active: true,
    created_at: '',
  };
}

function minimalSelectedElements(): SelectedElements {
  return {
    opening: minimalElement({ element_key: 'opening_1', element_type: 'opening_style' }),
    perspective: minimalElement({ element_key: 'perspective_1', element_type: 'narrative_perspective' }),
    closing: minimalElement({ element_key: 'closing_1', element_type: 'closing_style' }),
    macguffin: null,
    settingDetail: null,
    humorTechnique: null,
    tensionTechnique: null,
  };
}

const mockSupabase = {} as any;

const defaultParams = {
  kidProfileId: 'kid-1',
  ageGroup: '8-9' as const,
  theme: 'magic_fantasy',
  characterMode: 'surprise' as const,
  kidProfile: { name: 'Test', age: 8 },
  selectedCharacters: [] as Array<{ name: string; relation?: string; description?: string }>,
  supabase: mockSupabase,
};

describe('Emotion-Flow-Engine Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectIntensity.mockResolvedValue('medium');
    mockSelectBlueprint.mockResolvedValue({
      blueprint_key: 'growth_arc',
      category: 'growth',
      arc_by_age: {},
      ideal_age_groups: ['8-9'],
      min_intensity: 'light',
    });
    mockSelectTone.mockResolvedValue('dramatic');
    mockSelectCharacterSeeds.mockResolvedValue({
      protagonist: minimalSeed({ seed_key: 'prot_1', seed_type: 'protagonist_appearance' }),
      sidekick: minimalSeed({ seed_key: 'sidekick_1', seed_type: 'sidekick_archetype' }),
      antagonist: null,
    });
    mockSelectStoryElements.mockResolvedValue(minimalSelectedElements());
    mockBuildArcBlock.mockReturnValue('## ARC');
    mockBuildToneBlock.mockReturnValue('## TONE');
    mockBuildRelationshipBlock.mockReturnValue('## RELATIONSHIP');
    mockBuildCharacterBlock.mockReturnValue('## CHARACTER');
    mockBuildElementBlocks.mockReturnValue('## ELEMENTS');
    mockGetCriticalRules.mockReturnValue('CRITICAL RULES');
  });

  it('Engine gibt vollständiges EmotionFlowResult zurück', async () => {
    const { runEmotionFlowEngine } = await import('../../_shared/emotionFlow/engine.ts');
    const result = await runEmotionFlowEngine(defaultParams);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('intensity');
    expect(result).toHaveProperty('blueprint');
    expect(result).toHaveProperty('tone');
    expect(result).toHaveProperty('protagonistSeed');
    expect(result).toHaveProperty('sidekickSeed');
    expect(result).toHaveProperty('antagonistSeed');
    expect(result).toHaveProperty('elements');
    expect(result).toHaveProperty('promptBlocks');
    expect(result).toHaveProperty('metadata');
    expect(result.promptBlocks).toHaveProperty('arcBlock');
    expect(result.promptBlocks).toHaveProperty('toneBlock');
    expect(result.promptBlocks).toHaveProperty('characterBlock');
    expect(result.promptBlocks).toHaveProperty('elementBlocks');
    expect(result.promptBlocks).toHaveProperty('criticalRules');
  });

  it('Selector-Fehler → sinnvoller Default, kein Crash', async () => {
    mockSelectIntensity.mockRejectedValueOnce(new Error('DB error'));
    mockSelectBlueprint.mockRejectedValueOnce(new Error('DB error'));
    mockSelectTone.mockResolvedValue('gentle');
    mockSelectCharacterSeeds.mockResolvedValue({
      protagonist: null,
      sidekick: minimalSeed({ seed_key: 'sidekick_1', seed_type: 'sidekick_archetype' }),
      antagonist: null,
    });
    mockSelectStoryElements.mockResolvedValue(minimalSelectedElements());

    const { runEmotionFlowEngine } = await import('../../_shared/emotionFlow/engine.ts');
    const result = await runEmotionFlowEngine(defaultParams);

    expect(result).toBeDefined();
    expect(result.intensity).toBe('light');
    expect(result.blueprint).toBeNull();
    expect(result.tone).toBe('gentle');
  });

  it('Metadata enthält alle Keys', async () => {
    const { runEmotionFlowEngine } = await import('../../_shared/emotionFlow/engine.ts');
    const result = await runEmotionFlowEngine(defaultParams);
    const m = result.metadata as EmotionFlowMetadata;

    expect(m).toHaveProperty('blueprintKey');
    expect(m).toHaveProperty('toneMode');
    expect(m).toHaveProperty('intensityLevel');
    expect(m).toHaveProperty('characterSeedKey');
    expect(m).toHaveProperty('sidekickSeedKey');
    expect(m).toHaveProperty('antagonistSeedKey');
    expect(m).toHaveProperty('openingElementKey');
    expect(m).toHaveProperty('perspectiveElementKey');
  });

  it('Logging bei jedem Schritt', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { runEmotionFlowEngine } = await import('../../_shared/emotionFlow/engine.ts');
    await runEmotionFlowEngine(defaultParams);

    const calls = logSpy.mock.calls.map((c) => c.join(' '));
    expect(calls.some((s) => s.includes('[EmotionFlow]') && s.includes('Intensity'))).toBe(true);
    expect(calls.some((s) => s.includes('[EmotionFlow]') && s.includes('Blueprint'))).toBe(true);
    expect(calls.some((s) => s.includes('[EmotionFlow]') && s.includes('Tone'))).toBe(true);
    expect(calls.some((s) => s.includes('[EmotionFlow]') && s.includes('Characters'))).toBe(true);

    logSpy.mockRestore();
  });
});
