/**
 * Comic-Strip Prompt Builder (Task 5b.2)
 * Builds story instructions for panel-based image_plan and the single image prompt for the image model.
 * Imports only from comicStrip/types.ts and comicStrip/layouts.ts.
 */

import type { ComicLayout, ComicStripPlan, ComicStripPlanPanel } from './types.ts';

// ─── Function 1: buildComicStripInstructions ───────────────────────

/**
 * Builds the section for the STORY prompt that instructs the LLM to output
 * panel descriptions instead of scenes. Uses layout.panels for narrativeRole and promptLabel.
 */
export function buildComicStripInstructions(layout: ComicLayout): string {
  const lines: string[] = [
    '## COMIC PANEL INSTRUCTIONS',
    `Generate a comic strip image_plan with exactly ${layout.panelCount} panels.`,
    'Each panel needs: camera_angle, characters_visible, action, emotion, target_paragraph.',
    '',
    'Panel roles:',
  ];

  for (const panel of layout.panels) {
    lines.push(`- ${panel.label}: ${panel.narrativeRole}`);
  }

  lines.push(
    '',
    'Distribute panels across the story (target_paragraph should spread evenly).',
    'All descriptions in ENGLISH. Describe what is VISIBLE, not what characters think.',
    '',
    'Required JSON structure for image_plan:',
    `{`,
    `  "character_anchor": "Detailed visual description of protagonist...",`,
    `  "world_anchor": "Visual description of the world/setting...",`,
    `  "panels": [`,
  );

  const panelJsonLines = layout.panels.map(
    (p) =>
      `    {"panel_position": "${p.label}", "camera_angle": "wide shot", "characters_visible": "...", "action": "...", "emotion": "...", "target_paragraph": 0}`
  );
  lines.push(panelJsonLines.join(',\n'), `  ]`, `}`);

  return lines.join('\n');
}

// ─── Function 2: buildComicStripImagePrompt ───────────────────────

const NEGATIVE_PROMPT =
  'text, words, letters, speech bubbles, captions, watermark, signature, blurry, low quality, different art styles between panels, inconsistent characters';

const NO_TEXT_RULE =
  'No text, speech bubbles, or readable writing in any panel.';
const STYLE_CONSISTENCY = 'All panels share the same art style. Thick black borders between panels.';

export interface BuildComicStripImagePromptParams {
  plan: ComicStripPlan;
  layout: ComicLayout;
  stylePrompt: string;
  ageModifier: string;
  characterSeedAppearance?: string;
  seriesStylePrefix?: string;
}

export interface ComicStripImagePromptResult {
  prompt: string;
  negativePrompt: string;
}

/**
 * Builds the single prompt for the image model (one call for the full comic strip).
 * Character seed overrides LLM character_anchor. Character anchor is repeated in every panel.
 */
export function buildComicStripImagePrompt(
  params: BuildComicStripImagePromptParams
): ComicStripImagePromptResult {
  const {
    plan,
    layout,
    stylePrompt,
    ageModifier,
    characterSeedAppearance,
    seriesStylePrefix,
  } = params;

  const characterAnchor =
    characterSeedAppearance != null && characterSeedAppearance.trim() !== ''
      ? characterSeedAppearance.trim()
      : (plan.characterAnchor ?? '').trim();

  const styleBlockParts: string[] = [];
  if (seriesStylePrefix != null && seriesStylePrefix.trim() !== '') {
    styleBlockParts.push(seriesStylePrefix.trim());
  }
  const styleContent = [stylePrompt.trim(), ageModifier.trim()].filter(Boolean).join(', ');
  const styleBlock = layout.promptTemplate.replace('{style}', styleContent);
  styleBlockParts.push(styleBlock);

  const panelBlocks: string[] = [];

  for (const layoutPanel of layout.panels) {
    const planPanel = findPanelByLabel(plan.panels, layoutPanel.label);
    const promptLabel = layoutPanel.promptLabel || `${layoutPanel.label}:`;
    const cameraAngle = planPanel?.camera_angle ?? 'medium shot';
    const action = planPanel?.action ?? planPanel?.sceneDescription ?? 'key moment';
    const charactersVisible = planPanel?.characters_visible ?? '';
    const emotion = planPanel?.emotion ?? 'neutral';

    let block = `${promptLabel} ${cameraAngle} of ${action}.`;
    if (charactersVisible) block += ` ${charactersVisible}.`;
    block += ` Mood: ${emotion}.`;
    if (characterAnchor) block += ` Character details: ${characterAnchor}.`;

    panelBlocks.push(block.trim());
  }

  const promptParts = [
    styleBlockParts.join('\n'),
    ...panelBlocks,
    STYLE_CONSISTENCY,
    NO_TEXT_RULE,
  ];
  const prompt = promptParts.join('\n');

  return {
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

function normalizePanelLabel(s: string): string {
  return s.toUpperCase().replace(/\s+/g, '-').replace(/_/g, '-');
}

function findPanelByLabel(panels: ComicStripPlanPanel[], label: string): ComicStripPlanPanel | undefined {
  const key = normalizePanelLabel(label);
  return panels.find((p) => normalizePanelLabel(p.label) === key);
}

// ─── Function 3: parseComicStripPlan ───────────────────────────

/**
 * Parses LLM image_plan into ComicStripPlan.
 * Supports new format (panels) and old format (scenes) with conversion.
 */
export function parseComicStripPlan(
  imagePlan: any,
  layout: ComicLayout
): ComicStripPlan | null {
  if (imagePlan == null || typeof imagePlan !== 'object') return null;

  const characterAnchor =
    typeof imagePlan.character_anchor === 'string'
      ? imagePlan.character_anchor.trim()
      : undefined;

  if (imagePlan.panels != null && Array.isArray(imagePlan.panels)) {
    const panels: ComicStripPlanPanel[] = imagePlan.panels.map((p: any) => {
      const label = String(p.panel_position ?? p.label ?? '').trim();
      const layoutPanel = layout.panels.find(
        (lp) => normalizePanelLabel(lp.label) === normalizePanelLabel(label)
      );
      const narrativeRole = layoutPanel?.narrativeRole ?? '';
      const sceneDesc = [p.action, p.characters_visible].filter(Boolean).join('. ') || '';
      return {
        label: String(label),
        sceneDescription: sceneDesc || (p.action ?? ''),
        narrativeRole,
        camera_angle: typeof p.camera_angle === 'string' ? p.camera_angle : undefined,
        characters_visible: typeof p.characters_visible === 'string' ? p.characters_visible : undefined,
        action: typeof p.action === 'string' ? p.action : undefined,
        emotion: typeof p.emotion === 'string' ? p.emotion : undefined,
        target_paragraph: typeof p.target_paragraph === 'number' ? p.target_paragraph : undefined,
      };
    });
    if (panels.length === 0) return null;
    return {
      layoutKey: layout.layoutKey,
      panels,
      characterAnchor,
    };
  }

  if (imagePlan.scenes != null && Array.isArray(imagePlan.scenes)) {
    const layoutPanels = layout.panels;
    const panels: ComicStripPlanPanel[] = layoutPanels.map((lp, index) => {
      const scene = imagePlan.scenes[index] ?? imagePlan.scenes.find((s: any) => s.scene_id === index + 1);
      const action =
        scene != null && (scene.setting || scene.action)
          ? [scene.setting, scene.action].filter(Boolean).join('. ')
          : scene?.description ?? '';
      const emotion = scene?.emotion ?? 'neutral';
      const charactersVisible = scene?.characters_present ?? scene?.characters_visible ?? '';
      const cameraAngle = fallbackCameraAngleForPanel(lp.label);
      return {
        label: lp.label,
        sceneDescription: action || 'key moment',
        narrativeRole: lp.narrativeRole,
        camera_angle: cameraAngle,
        characters_visible: charactersVisible || undefined,
        action: action || undefined,
        emotion,
        target_paragraph: typeof scene?.target_paragraph === 'number' ? scene.target_paragraph : undefined,
      };
    });
    return {
      layoutKey: layout.layoutKey,
      panels,
      characterAnchor,
    };
  }

  return null;
}

function fallbackCameraAngleForPanel(label: string): string {
  const u = label.toUpperCase();
  if (u.includes('LEFT') && u.includes('TOP')) return 'wide shot';
  if (u.includes('RIGHT') && u.includes('TOP')) return 'medium shot';
  if (u.includes('BOTTOM') && u.includes('LEFT')) return 'dynamic angle';
  if (u.includes('BOTTOM') && u.includes('RIGHT')) return 'medium shot';
  if (u === 'TOP' || u.includes('PANEL-1')) return 'wide shot';
  if (u === 'BOTTOM' || u.includes('PANEL-3')) return 'medium shot';
  return 'medium shot';
}
