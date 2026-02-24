/**
 * Comic-Strip Prompt Builder (Task 5b.2)
 * Builds story instructions for panel-based image_plan and the single image prompt for the image model.
 * Imports only from comicStrip/types.ts and comicStrip/layouts.ts.
 */

import type { ComicLayout, ComicStripPlan, ComicStripPlanPanel } from './types.ts';
import type { ComicPanel } from './types.ts';

// ─── Function 1: buildComicStripInstructions ───────────────────────

/**
 * Builds the section for the STORY prompt that instructs the LLM to output
 * either grid_1/grid_2 (8 panels) or panels/scenes. When useGridFormat is true
 * or layout is 8-panel, returns the LLM grid-based image_plan instructions.
 */
export function buildComicStripInstructions(
  layout: ComicLayout,
  options?: { useGridFormat?: boolean }
): string {
  const useGridFormat = options?.useGridFormat ?? layout.panelCount === 8;

  if (useGridFormat) {
    return [
      '## IMAGE PLAN — COMIC STRIP (2×2 GRIDS)',
      '',
      'You must generate an image_plan with EXACTLY this structure:',
      '',
      '{',
      '  "character_anchor": "<HYPER-SPECIFIC visual description of the main character(s) — see CHARACTER ANCHOR RULES below>",',
      '  "world_anchor": "<Detailed visual description of the main setting/world. Lighting, atmosphere, color palette, key environmental details.>",',
      '  "grid_1": [',
      '    { "panel": "top_left", "role": "cover", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "top_right", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "bottom_left", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "bottom_right", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" }',
      '  ],',
      '  "grid_2": [',
      '    { "panel": "top_left", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "top_right", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "bottom_left", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" },',
      '    { "panel": "bottom_right", "role": "ending", "camera": "<your choice>", "scene_en": "<English image prompt for this panel>" }',
      '  ]',
      '}',
      '',
      '### RULES FOR THE IMAGE PLAN:',
      '',
      '**Fixed positions:**',
      '- grid_1.top_left MUST be the COVER image (establishing shot of world + characters).',
      '- grid_2.bottom_right MUST be the ENDING image (resolution, peaceful, satisfying moment).',
      '',
      '**Camera values** — choose the best fit for each scene from:',
      '- "wide_establishing" — full environment + character(s), used for opening/world-building',
      '- "medium" — character(s) from waist up with environment visible',
      '- "close_up" — face/upper body of 1-2 characters, showing emotion, soft blurred background',
      '- "action_dynamic" — characters in motion, dramatic angle (low angle, bird\'s eye, tilted)',
      '- "over_shoulder" — seen from behind one character, showing what they see',
      '- "detail_macro" — close-up on a key object (a map, a glowing stone, food, a letter)',
      '- "medium_wide" — 2+ characters interacting, showing body language and relationship',
      '- "wide_peaceful" — calm wide shot, resolution mood, warm/soft lighting',
      '',
      '## VISUAL VARIETY RULES (MANDATORY — these override narrative convenience):',
      '',
      '**RULE 1 — NO IDENTICAL PANELS:**',
      'No two adjacent panels may have the same visual composition.',
      'Every panel must look CLEARLY DIFFERENT from its neighbors.',
      'The reader must see 4 distinct images per grid, not 4 variations of the same shot.',
      '',
      '**RULE 2 — LOCATION VARIETY across grids:**',
      'Pick scenes from across the FULL story arc for each grid.',
      '- Do NOT assign grid_1 = "first half of story" and grid_2 = "second half."',
      '- Instead, distribute KEY MOMENTS evenly. Each grid should contain a mix of calm and dramatic scenes.',
      '- Grid 1 might show: setup → inciting incident → midpoint twist → climax approach',
      '- Grid 2 might show: climax peak → consequence → resolution → final image',
      '- This ensures each grid has built-in location and mood variety.',
      '',
      '**RULE 3 — WHEN SCENES SHARE A LOCATION, USE MICRO-LOCATIONS + CAMERA SHIFTS:**',
      'If two panels must be in the same general place (e.g., "garden"), they MUST differ in:',
      '  a) MICRO-LOCATION: Different part of the same place',
      '     ✅ "Under the apple tree" → "Behind the thorny hedge" → "On the wooden terrace" → "At the garden gate"',
      '     ❌ "In the garden" → "In the garden" → "In the garden" → "In the garden"',
      '  b) CAMERA: Drastically different angle and distance',
      '     ✅ wide_establishing → close_up → over_shoulder → action_dynamic',
      '     ❌ medium → medium → medium → wide_establishing',
      '  c) FOCUS SUBJECT: What is centered in the frame must change',
      '     ✅ "Two boys looking up at tree" → "Extreme close-up: glowing creature in hedge" → "Over Papa\'s shoulder, boys in background" → "Low angle: boy reaching into hedge, thorns framing shot"',
      '',
      '**RULE 4 — SCENE DESCRIPTION FORMAT:**',
      'Every scene_en MUST follow this structure:',
      '  "[MICRO-LOCATION] — [WHAT IS HAPPENING] — [VISUAL FOCUS/MOOD]"',
      '  ✅ "Behind the thorny hedge, close-up — Pix discovers a tiny glowing creature with silver fur — wonder and soft blue light"',
      '  ✅ "Wooden terrace, over-the-shoulder from Papa — the two boys freeze, hiding something — suspense, warm afternoon light"',
      '  ❌ "Pix and Mikel stand in the garden looking at something" (too generic, no micro-location, no visual focus)',
      '',
      '**RULE 5 — CAMERA VALUES within a grid:**',
      'All 4 panels in a single grid must use DIFFERENT cameras.',
      '- NEVER repeat a camera value within the same grid.',
      '- FORBIDDEN combo: same micro-location + same camera = rejected.',
      '- At least 1× close_up and 1× detail_macro across both grids.',
      '- At least 1× wide shot (wide_establishing or wide_peaceful) per grid.',
      '',
      '**RULE 6 — PICK THE MOST VISUAL MOMENTS:**',
      'Scan the full story text and identify scenes with the richest visual descriptions',
      '(colors, light effects, creatures, transformations, weather, emotions on faces).',
      'These MUST become panels.',
      '',
      'RANKING for panel selection (highest priority first):',
      '1. TRANSFORMATION / MAGIC moments (object changes, creature appears, world shifts)',
      '2. DISCOVERY / REVEAL moments (creature found, door opens, object appears)',
      '3. EMOTIONAL PEAKS (fear, wonder, triumph — shown on faces via close_up)',
      '4. ACTION moments (climbing, running, flying)',
      '5. ESTABLISHING shots (characters standing somewhere) — use MAX 1 per grid!',
      '',
      '**Scene content rules (IMPORTANT):**',
      '- Each scene_en must focus PRIMARILY on the ACTION, ENVIRONMENT, and MOOD — the scene is the star, not the character description.',
      '- Include the character_anchor text ONCE at the end of each scene_en (not at the start).',
      '- If there are multiple characters, describe ALL of them in the character_anchor.',
      '- Characters must wear the SAME clothes in all panels (unless the story involves a costume change).',
      '- Every scene_en must be in ENGLISH regardless of story language.',
      '- No text, signs, numbers, or readable writing in any scene.',
      '- Each scene_en should be 2-3 sentences, specific and visual.',
      '',
      '**CHARACTER ANCHOR RULES:**',
      'The character_anchor must be CONCISE: maximum 2 sentences, 50-60 words. Focus on the 5 most visually distinctive traits:',
      '1. Age and build',
      '2. Hair color and style',
      '3. Key accessory (glasses, hat, scarf — with color)',
      '4. Main clothing item with specific color',
      '5. One signature detail (a patch, a pin, mismatched socks, etc.)',
      '',
      'BAD anchor: "A girl with dark hair wearing a school uniform and glasses"',
      'GOOD anchor: "An 8-year-old East Asian girl with jet-black twin braids, round silver-rimmed glasses, a dark purple wizard\'s cloak with a golden crest, and a crimson-gold striped tie."',
    ].join('\n');
  }

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

/** For 4-panel (legacy): thick borders. For 2x2 grid (refined): no borders, 2px white gap. */
const COMIC_GRID_RULES_REFINED =
  'STRICT GRID RULES:\n- Exactly 4 equal-sized panels in a 2x2 grid (2 rows, 2 columns).\n- Each panel MUST be exactly 50% width and 50% height of the total image. No variation in panel dimensions.\n- Panels are separated by a thin 2-4px white gap ONLY. No black borders, no thick lines.\n- The image MUST be edge-to-edge: NO decorative border, NO frame, NO margin, NO vignette, NO rounded corners around the outer edges.\n- The panels MUST extend to the very edge of the image.\n- Every panel must be the same aspect ratio (square if the total image is square).\n- NO panel borders, NO outlines, NO dark edges, NO comic-style dividers.\n- The 4 scenes should flow visually but each be a clearly distinct scene.';
const STYLE_CONSISTENCY_LEGACY = 'All panels share the same art style. Thick black borders between panels.';

/** Camera direction per panel index (1–8) for 2×(2x2) variation. */
export const CAMERA_DIRECTIONS: Record<number, string> = {
  1: 'CAMERA: Wide establishing shot. Show the full setting and main character(s) in an inviting, atmospheric scene.',
  2: 'CAMERA: Medium shot. Character(s) beginning their journey/action. Show body language and environment.',
  3: 'CAMERA: Close-up. Focus on the protagonist\'s face — show emotion (curiosity, fear, determination). Blurred background.',
  4: 'CAMERA: Dynamic action shot. Characters in motion, dramatic angle (low angle or bird\'s eye).',
  5: 'CAMERA: Over-the-shoulder or POV shot. Show what the character sees — a discovery, a challenge, a new place.',
  6: 'CAMERA: Medium wide shot. Two or more characters interacting — show relationship and body language.',
  7: 'CAMERA: Close-up on a key object or detail (a map, a glowing stone, a letter). Macro perspective.',
  8: 'CAMERA: Wide peaceful shot. Resolution moment — characters in a calm, satisfied, or reflective pose. Warm lighting.',
};

// ─── buildComicGridPrompt (LLM grid_1 / grid_2 format) ─────────────────────

const GRID_LAYOUT_RULES =
  'STRICT GRID RULES (ABSOLUTE — MUST FOLLOW):\n- Exactly 4 equal-sized panels in a 2x2 grid (2 rows, 2 columns).\n- Each panel MUST be exactly 50% width and 50% height of the total image. No variation in panel dimensions whatsoever.\n- Panels are separated by a thin 2-4px white gap ONLY. No black borders, no thick lines, no outlines.\n- The image MUST be edge-to-edge: NO decorative border, NO frame, NO margin, NO vignette, NO rounded corners around the outer edges of the image.\n- The panels MUST extend to the very edge of the image. The outermost pixels of each corner panel must be scene content, not border/frame.\n- Every panel must be the same aspect ratio (square, since the total image is square).\n- NO panel borders, NO outlines, NO dark edges, NO comic-style dividers, NO stamp edges, NO film strip borders, NO photo frames.\n- The 4 scenes should flow visually but each be a clearly distinct scene.\n- The character(s) MUST look identical in all 4 panels.';

/**
 * Builds a single Vertex prompt for one 2x2 grid (4 panels) from the LLM-generated grid format.
 */
export function buildComicGridPrompt(
  grid: ComicPanel[],
  characterAnchor: string,
  worldAnchor: string,
  imageStylePrefix: string,
  consistencySuffix?: string,
): string {
  const panelDescriptions = grid.map((panel) => {
    // Scene first, character anchor at the end — Imagen weights prompt start more heavily
    const sceneText = panel.scene_en.trim().replace(new RegExp(`^${characterAnchor.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.?\\s*`, 'i'), '');
    const panelLabel = panel.panel.replace(/_/g, '-').toUpperCase();
    return `${panelLabel}: [${panel.camera}] ${sceneText} Character: ${characterAnchor.trim()}.`;
  }).join('\n\n');

  const suffix = consistencySuffix || 'Consistent character design across all panels.';

  return `${imageStylePrefix}

Create a 2x2 grid of 4 children's book illustrations.
Setting: ${worldAnchor}

${GRID_LAYOUT_RULES}

Panel layout (reading order: left-to-right, top-to-bottom):

${panelDescriptions}

Character reference: ${characterAnchor}
No text, signs, numbers, or readable writing in any panel.
${suffix}`;
}

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

export interface ComicStripImagePromptsResult {
  prompts: string[];
  negativePrompt: string;
}

/**
 * Builds one prompt for 4-panel layout, or two prompts for 8-panel (2×(2x2)).
 * Character seed overrides LLM character_anchor. Uses CAMERA_DIRECTIONS and refined grid rules (no borders, 2px gap).
 */
export function buildComicStripImagePrompt(
  params: BuildComicStripImagePromptParams
): ComicStripImagePromptResult {
  const result = buildComicStripImagePrompts(params);
  return {
    prompt: result.prompts[0] ?? '',
    negativePrompt: result.negativePrompt,
  };
}

/**
 * Builds one or two prompts for the image model. For 8-panel layout returns two prompts (panels 1–4 and 5–8).
 */
export function buildComicStripImagePrompts(
  params: BuildComicStripImagePromptParams
): ComicStripImagePromptsResult {
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

  const useRefinedGrid = true;
  const gridRule = useRefinedGrid ? COMIC_GRID_RULES_REFINED : STYLE_CONSISTENCY_LEGACY;

  const panelCount = layout.panels.length;
  const is8Panel = panelCount === 8;

  const buildOnePrompt = (panelStart: number, panelEnd: number): string => {
    const panelBlocks: string[] = [];
    for (let i = panelStart; i < panelEnd; i++) {
      const layoutPanel = layout.panels[i];
      const planPanel = findPanelByLabel(plan.panels, layoutPanel.label);
      const promptLabel = layoutPanel.promptLabel || `${layoutPanel.label}:`;
      const cameraDir = CAMERA_DIRECTIONS[i + 1];
      const action = planPanel?.action ?? planPanel?.sceneDescription ?? 'key moment';
      const charactersVisible = planPanel?.characters_visible ?? '';
      const emotion = planPanel?.emotion ?? 'neutral';

      let block = `${promptLabel} ${cameraDir ? cameraDir + ' ' : ''}${action}.`;
      if (charactersVisible) block += ` ${charactersVisible}.`;
      block += ` Mood: ${emotion}.`;
      if (characterAnchor) block += ` Character details: ${characterAnchor}.`;

      panelBlocks.push(block.trim());
    }

    return [
      styleBlockParts.join('\n'),
      'Create a 2x2 grid of 4 children\'s book illustrations.',
      gridRule,
      'Consistent character appearance across all 4 panels.',
      '',
      'Panel layout (left-to-right, top-to-bottom):',
      ...panelBlocks,
      '',
      'IMPORTANT: Same character(s) must look identical in all panels. Vary the camera angle and framing as specified per panel.',
      NO_TEXT_RULE,
    ].join('\n');
  };

  if (is8Panel) {
    return {
      prompts: [
        buildOnePrompt(0, 4),
        buildOnePrompt(4, 8),
      ],
      negativePrompt: NEGATIVE_PROMPT,
    };
  }

  return {
    prompts: [buildOnePrompt(0, panelCount)],
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
    const worldAnchor =
      typeof imagePlan.world_anchor === 'string' ? imagePlan.world_anchor.trim() : '';

    // 8-panel (2×(2x2)): Panel 1 = cover from anchors, Panels 2–8 = 7 scenes
    if (layoutPanels.length === 8 && imagePlan.scenes.length >= 7) {
      const panels: ComicStripPlanPanel[] = [];
      const coverDesc = [worldAnchor, characterAnchor].filter(Boolean).join('. ') || 'Establishing shot of the setting and characters.';
      panels.push({
        label: layoutPanels[0].label,
        sceneDescription: coverDesc,
        narrativeRole: layoutPanels[0].narrativeRole,
        camera_angle: 'wide shot',
        action: coverDesc,
        emotion: 'inviting',
      });
      for (let i = 1; i < 8; i++) {
        const scene = imagePlan.scenes[i - 1];
        const action =
          scene != null && (scene.setting || scene.action)
            ? [scene.setting, scene.action].filter(Boolean).join('. ')
            : scene?.description ?? '';
        const emotion = scene?.emotion ?? 'neutral';
        const charactersVisible = scene?.characters_present ?? scene?.characters_visible ?? '';
        panels.push({
          label: layoutPanels[i].label,
          sceneDescription: action || 'key moment',
          narrativeRole: layoutPanels[i].narrativeRole,
          camera_angle: fallbackCameraAngleForPanel(layoutPanels[i].label),
          characters_visible: charactersVisible || undefined,
          action: action || undefined,
          emotion,
          target_paragraph: typeof scene?.target_paragraph === 'number' ? scene.target_paragraph : undefined,
        });
      }
      return { layoutKey: layout.layoutKey, panels, characterAnchor };
    }

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
