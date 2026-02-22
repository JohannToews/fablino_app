/**
 * Emotion Flow Prompt Builder (Orchestrator) — Task 5.3
 * Assembles all blocks into one prompt. No DB/API. String-only.
 * Imports: none from existing pipeline (promptBuilder.ts, imagePromptBuilder.ts).
 */

export interface EmotionFlowPromptParams {
  ageRules: string;
  difficultyRules: string;
  themeRules: string;
  wordCounts: string;
  characters: string;
  guardrails: string;
  learningTheme: string;
  imageInstructions: string;
  arcBlock: string;
  toneBlock: string;
  characterBlock: string;
  elementBlocks: string;
  criticalRules: string;
}

const EMOTION_FLOW_START = '--- EMOTION FLOW ENGINE ---';
const EMOTION_FLOW_END = '--- END EMOTION FLOW ---';

/**
 * Removes more than 2 consecutive newlines, trims start and end.
 * Exported for tests.
 */
export function cleanPrompt(raw: string): string {
  if (raw === '') return '';
  const normalized = raw.replace(/\n{3,}/g, '\n\n');
  return normalized.trim();
}

/**
 * Builds the full story prompt by concatenating existing pipeline params
 * and the Emotion Flow blocks. Empty blocks are omitted. If all Emotion Flow
 * blocks are empty, the EMOTION FLOW ENGINE markers are omitted.
 */
export function buildEmotionFlowPrompt(params: EmotionFlowPromptParams): string {
  const {
    ageRules,
    difficultyRules,
    themeRules,
    wordCounts,
    characters,
    guardrails,
    learningTheme,
    imageInstructions,
    arcBlock,
    toneBlock,
    characterBlock,
    elementBlocks,
    criticalRules,
  } = params;

  const emotionBlocks = [arcBlock, toneBlock, characterBlock, elementBlocks, criticalRules].filter(
    (s) => s != null && s.trim() !== ''
  );
  const hasEmotionFlow = emotionBlocks.length > 0;

  const parts: string[] = [];

  parts.push(ageRules.trim());
  parts.push(difficultyRules.trim());
  parts.push(themeRules.trim());

  if (hasEmotionFlow) {
    parts.push(EMOTION_FLOW_START);
    if (arcBlock.trim() !== '') parts.push(arcBlock.trim());
    if (toneBlock.trim() !== '') parts.push(toneBlock.trim());
    if (characterBlock.trim() !== '') parts.push(characterBlock.trim());
    if (elementBlocks.trim() !== '') parts.push(elementBlocks.trim());
    if (criticalRules.trim() !== '') parts.push(criticalRules.trim());
    parts.push(EMOTION_FLOW_END);
  }

  parts.push(wordCounts.trim());
  parts.push(characters.trim());
  parts.push(guardrails.trim());
  if (learningTheme.trim() !== '') parts.push(learningTheme.trim());
  parts.push(imageInstructions.trim());

  const raw = parts.join('\n\n');
  return cleanPrompt(raw);
}
