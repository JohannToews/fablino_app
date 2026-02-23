/**
 * Emotion-Flow-Engine Orchestrator — Task 6.1
 *
 * Runs the full selection pipeline: intensity → blueprint → tone → characters → elements,
 * then builds all prompt blocks. Each selector is wrapped in try/catch with sensible defaults.
 */

import type {
  EngineParams,
  EmotionFlowResult,
  EmotionFlowMetadata,
  PromptBlocks,
  IntensityLevel,
  ToneMode,
  EmotionBlueprint,
  SelectedCharacters,
  SelectedElements,
  EmotionFlowSupabase,
  CharacterMode,
  BlueprintCategory,
  AgeGroup,
} from './types.ts';
import {
  selectIntensity,
  selectBlueprint,
  selectTone,
  selectCharacterSeeds,
  selectStoryElements,
} from './selectors/index.ts';
import {
  buildArcBlock,
  buildToneBlock,
  buildRelationshipBlock,
  buildCharacterBlock,
  buildElementBlocks,
} from './promptBuilder/blocks/index.ts';
import { getCriticalRules } from './promptBuilder/criticalRules.ts';

/** Params for runEmotionFlowEngine: EngineParams + supabase (required at runtime). */
export type EngineParamsWithSupabase = EngineParams & {
  supabase: EmotionFlowSupabase;
};

/**
 * Runs the Emotion-Flow-Engine: selectors in order, then build prompt blocks.
 * Each selector has its own try/catch; failures yield defaults (e.g. intensity 'light', blueprint null).
 */
export async function runEmotionFlowEngine(
  params: EngineParamsWithSupabase
): Promise<EmotionFlowResult> {
  const {
    kidProfileId,
    ageGroup,
    theme,
    characterMode,
    kidProfile,
    selectedCharacters,
    learningTheme,
    supabase,
  } = params;

  let intensity: IntensityLevel = 'light';
  let blueprint: EmotionBlueprint | null = null;
  let tone: ToneMode = 'gentle';
  let characters: SelectedCharacters = {
    protagonist: null,
    sidekick: null as any,
    antagonist: null,
  };
  let elements: SelectedElements = null as any;

  // ─── 1. Intensity ─────────────────────────────────────────────────────
  try {
    intensity = await selectIntensity(kidProfileId, supabase);
  } catch (error) {
    console.error('[EmotionFlow] selectIntensity failed, defaulting to light:', error);
    intensity = 'light';
  }
  console.log('[EmotionFlow] Intensity:', intensity);

  // ─── 2. Blueprint ───────────────────────────────────────────────────
  try {
    blueprint = await selectBlueprint(
      {
        kidProfileId,
        ageGroup: ageGroup as AgeGroup,
        theme,
        intensity,
        learningTheme,
      },
      supabase
    );
  } catch (error) {
    console.error('[EmotionFlow] selectBlueprint failed:', error);
    blueprint = null;
  }
  console.log('[EmotionFlow] Blueprint:', blueprint?.blueprint_key ?? 'none');

  // ─── 3. Tone ─────────────────────────────────────────────────────────
  try {
    tone = await selectTone(
      {
        kidProfileId,
        ageGroup: ageGroup as AgeGroup,
        blueprintCategory: blueprint?.category,
      },
      supabase
    );
  } catch (error) {
    console.error('[EmotionFlow] selectTone failed, defaulting to gentle:', error);
    tone = 'gentle';
  }
  console.log('[EmotionFlow] Tone:', tone);

  // ─── 4. Character Seeds ───────────────────────────────────────────────
  try {
    characters = await selectCharacterSeeds(
      {
        kidProfileId,
        ageGroup: ageGroup as AgeGroup,
        theme,
        characterMode,
        blueprintCategory: blueprint?.category,
      },
      supabase
    );
  } catch (error) {
    console.error('[EmotionFlow] selectCharacterSeeds failed:', error);
    throw error;
  }
  console.log('[EmotionFlow] Characters:', {
    protagonist: characters.protagonist?.seed_key ?? null,
    sidekick: characters.sidekick?.seed_key ?? null,
    antagonist: characters.antagonist?.seed_key ?? null,
  });

  // ─── 5. Story Elements ───────────────────────────────────────────────
  try {
    elements = await selectStoryElements(
      {
        kidProfileId,
        ageGroup: ageGroup as AgeGroup,
        theme,
        intensity,
        tone,
        blueprintCategory: blueprint?.category,
      },
      supabase
    );
  } catch (error) {
    console.error('[EmotionFlow] selectStoryElements failed:', error);
    throw error;
  }

  // ─── 6. Prompt Blocks ────────────────────────────────────────────────
  let arcBlock = '';
  let toneBlock = '';
  let characterBlock = '';
  let elementBlocks = '';
  let criticalRules = '';

  try {
    arcBlock = buildArcBlock({
      blueprint,
      ageGroup: ageGroup as AgeGroup,
      intensity,
    });
  } catch (error) {
    console.error('[EmotionFlow] buildArcBlock failed:', error);
    arcBlock = '';
  }

  try {
    toneBlock = buildToneBlock(tone);
  } catch (error) {
    console.error('[EmotionFlow] buildToneBlock failed:', error);
    toneBlock = '';
  }

  try {
    if (characterMode === 'self' || characterMode === 'family') {
      characterBlock = buildRelationshipBlock({
        characterMode,
        kidProfile,
        selectedCharacters: selectedCharacters.map((c) => ({
          name: c.name,
          relationship: (c as { relation?: string }).relation ?? '',
        })),
        protagonistSeed: characters.protagonist,
        sidekickSeed: characters.sidekick,
        blueprintCategory: blueprint?.category,
      });
    } else {
      characterBlock = buildCharacterBlock({
        protagonistSeed: characters.protagonist,
        sidekickSeed: characters.sidekick,
      });
    }
  } catch (error) {
    console.error('[EmotionFlow] character block build failed:', error);
    characterBlock = '';
  }

  try {
    elementBlocks = buildElementBlocks(elements);
  } catch (error) {
    console.error('[EmotionFlow] buildElementBlocks failed:', error);
    elementBlocks = '';
  }

  try {
    criticalRules = getCriticalRules();
  } catch (error) {
    console.error('[EmotionFlow] getCriticalRules failed:', error);
    criticalRules = '';
  }

  const promptBlocks: PromptBlocks = {
    arcBlock,
    toneBlock,
    characterBlock,
    elementBlocks,
    criticalRules,
  };

  const metadata: EmotionFlowMetadata = {
    blueprintKey: blueprint?.blueprint_key ?? null,
    toneMode: tone,
    intensityLevel: intensity,
    characterSeedKey: characters.protagonist?.seed_key ?? null,
    sidekickSeedKey: characters.sidekick.seed_key,
    antagonistSeedKey: characters.antagonist?.seed_key ?? null,
    openingElementKey: elements.opening?.element_key ?? '',
    perspectiveElementKey: elements.perspective?.element_key ?? '',
  };

  const result: EmotionFlowResult = {
    intensity,
    blueprint,
    tone,
    protagonistSeed: characters.protagonist,
    sidekickSeed: characters.sidekick,
    antagonistSeed: characters.antagonist,
    elements,
    promptBlocks,
    metadata,
  };

  return result;
}
