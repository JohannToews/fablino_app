/**
 * Unit tests — Emotion Flow Prompt Builder Orchestrator (Task 5.3)
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  buildEmotionFlowPrompt,
  cleanPrompt,
  type EmotionFlowPromptParams,
} from '../../_shared/emotionFlow/promptBuilder/emotionFlowPromptBuilder.ts';

function fullParams(overrides: Partial<EmotionFlowPromptParams> = {}): EmotionFlowPromptParams {
  return {
    ageRules: 'AGE_RULES',
    difficultyRules: 'DIFFICULTY_RULES',
    themeRules: 'THEME_RULES',
    wordCounts: 'WORD_COUNTS',
    characters: 'CHARACTERS',
    guardrails: 'GUARDRAILS',
    learningTheme: '',
    imageInstructions: 'IMAGE_INSTRUCTIONS',
    arcBlock: '## EMOTIONAL ARC\nTest arc.',
    toneBlock: '## TONE\nDramatic.',
    characterBlock: '## CHARACTER\nProtagonist.',
    elementBlocks: '## ELEMENTS\nOpening style.',
    criticalRules: 'CRITICAL: No moral.',
    ...overrides,
  };
}

describe('Prompt Builder Orchestrator', () => {
  it('Deep intensity → alle Blöcke im Prompt', () => {
    const params = fullParams();
    const result = buildEmotionFlowPrompt(params);

    expect(result).toContain('--- EMOTION FLOW ENGINE ---');
    expect(result).toContain('--- END EMOTION FLOW ---');
    expect(result).toContain('## EMOTIONAL ARC');
    expect(result).toContain('Test arc.');
    expect(result).toContain('## TONE');
    expect(result).toContain('Dramatic.');
    expect(result).toContain('CRITICAL: No moral.');
  });

  it('Light intensity → Emotion Flow Section minimal oder weg', () => {
    const params = fullParams({
      arcBlock: '',
      elementBlocks: '## OPENING\n## PERSPECTIVE\n## CLOSING',
      toneBlock: '',
      characterBlock: '',
      criticalRules: 'CRITICAL: rules.',
    });
    const result = buildEmotionFlowPrompt(params);

    expect(result).toContain('--- EMOTION FLOW ENGINE ---');
    expect(result).toContain('CRITICAL: rules.');
    expect(result).toContain('## OPENING');
    expect(result).not.toMatch(/\n\n\n\n/);
  });

  it('Bestehende Params werden 1:1 durchgereicht', () => {
    const params = fullParams({ ageRules: 'TEST_AGE_RULES_MARKER' });
    const result = buildEmotionFlowPrompt(params);
    expect(result).toContain('TEST_AGE_RULES_MARKER');
  });

  it('Reihenfolge korrekt', () => {
    const params = fullParams({
      ageRules: 'MARKER_AGE',
      themeRules: 'MARKER_THEME',
      wordCounts: 'MARKER_WORDCOUNTS',
      guardrails: 'MARKER_GUARDRAILS',
    });
    const result = buildEmotionFlowPrompt(params);

    const agePos = result.indexOf('MARKER_AGE');
    const themePos = result.indexOf('MARKER_THEME');
    const flowStart = result.indexOf('--- EMOTION FLOW ENGINE ---');
    const wordPos = result.indexOf('MARKER_WORDCOUNTS');
    const guardPos = result.indexOf('MARKER_GUARDRAILS');

    expect(agePos).toBeGreaterThanOrEqual(0);
    expect(themePos).toBeGreaterThanOrEqual(0);
    expect(flowStart).toBeGreaterThanOrEqual(0);
    expect(wordPos).toBeGreaterThanOrEqual(0);
    expect(guardPos).toBeGreaterThanOrEqual(0);

    expect(agePos).toBeLessThan(themePos);
    expect(themePos).toBeLessThan(flowStart);
    expect(flowStart).toBeLessThan(wordPos);
    expect(wordPos).toBeLessThan(guardPos);
  });

  it('cleanPrompt entfernt überschüssige Newlines', () => {
    const input = 'Block1\n\n\n\n\nBlock2';
    const output = cleanPrompt(input);
    expect(output).not.toMatch(/\n\n\n/);
    expect(output).toContain('Block1');
    expect(output).toContain('Block2');
  });

  it('Komplett leere Emotion-Flow Blocks → keine Marker', () => {
    const params = fullParams({
      arcBlock: '',
      toneBlock: '',
      characterBlock: '',
      elementBlocks: '',
      criticalRules: '',
    });
    const result = buildEmotionFlowPrompt(params);
    expect(result).not.toContain('--- EMOTION FLOW ENGINE ---');
    expect(result).not.toContain('--- END EMOTION FLOW ---');
  });
});

describe('Regression', () => {
  const ROOT = path.resolve(__dirname, '../..');
  const PROMPT_BUILDER = path.join(ROOT, '_shared/promptBuilder.ts');
  const IMAGE_PROMPT_BUILDER = path.join(ROOT, '_shared/imagePromptBuilder.ts');
  const GENERATE_STORY = path.join(ROOT, 'generate-story/index.ts');

  it('promptBuilder.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/emotionFlowPromptBuilder|buildEmotionFlowPrompt/);
  });

  it('imagePromptBuilder.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(IMAGE_PROMPT_BUILDER, 'utf-8');
    expect(content).not.toMatch(/emotionFlowPromptBuilder|buildEmotionFlowPrompt/);
  });

  it('generate-story/index.ts UNVERÄNDERT', () => {
    const content = fs.readFileSync(GENERATE_STORY, 'utf-8');
    expect(content).not.toMatch(/emotionFlowPromptBuilder|buildEmotionFlowPrompt/);
  });
});
