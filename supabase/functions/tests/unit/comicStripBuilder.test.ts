/**
 * Unit tests — Comic-Strip Prompt Builder (Task 5b.2)
 */

import { describe, it, expect } from 'vitest';
import {
  buildComicStripInstructions,
  buildComicStripImagePrompt,
  parseComicStripPlan,
} from '../../_shared/comicStrip/comicStripPromptBuilder.ts';
import { COMIC_LAYOUTS } from '../../_shared/comicStrip/layouts.ts';
import type { ComicStripPlan } from '../../_shared/comicStrip/types.ts';

const LAYOUT_2X2 = COMIC_LAYOUTS['layout_1_2x2'];

function makePlan(overrides: Partial<ComicStripPlan> & { panels: ComicStripPlan['panels'] }): ComicStripPlan {
  return {
    layoutKey: 'layout_1_2x2',
    panels: overrides.panels,
    characterAnchor: overrides.characterAnchor,
  };
}

describe('buildComicStripInstructions', () => {
  it('für 2x2 → enthält 4 Panel-Rollen', () => {
    const out = buildComicStripInstructions(LAYOUT_2X2);
    expect(out).toContain('TOP-LEFT');
    expect(out).toContain('TOP-RIGHT');
    expect(out).toContain('BOTTOM-LEFT');
    expect(out).toContain('BOTTOM-RIGHT');
    expect(out).toContain('exactly 4 panels');
  });
});

describe('buildComicStripImagePrompt', () => {
  const fourPanels = [
    { label: 'TOP-LEFT', sceneDescription: 'a', narrativeRole: 'establishing', action: 'standing', emotion: 'curious', characters_visible: 'girl', camera_angle: 'wide shot' },
    { label: 'TOP-RIGHT', sceneDescription: 'b', narrativeRole: 'tension', action: 'discovering', emotion: 'wonder', characters_visible: 'girl', camera_angle: 'close-up' },
    { label: 'BOTTOM-LEFT', sceneDescription: 'c', narrativeRole: 'climax', action: 'running', emotion: 'excited', characters_visible: 'girl', camera_angle: 'medium' },
    { label: 'BOTTOM-RIGHT', sceneDescription: 'd', narrativeRole: 'resolution', action: 'sitting', emotion: 'peaceful', characters_visible: 'girl', camera_angle: 'medium' },
  ];

  it('Character Seed überschreibt LLM-Anchor', () => {
    const plan = makePlan({
      panels: fourPanels,
      characterAnchor: 'LLM description',
    });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 'watercolor',
      ageModifier: 'bright',
      characterSeedAppearance: 'Seed description with dark skin',
    });
    expect(prompt).toContain('Seed description with dark skin');
    expect(prompt).not.toContain('LLM description');
  });

  it('Character Anchor in jedem Panel', () => {
    const anchor = 'dark brown skin, yellow raincoat';
    const plan = makePlan({
      panels: fourPanels,
      characterAnchor: anchor,
    });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 'watercolor',
      ageModifier: 'bright',
      characterSeedAppearance: anchor,
    });
    const count = (prompt.match(/Character details:/g) ?? []).length;
    expect(count).toBe(4);
  });

  it('kein characterSeed → nutzt LLM-Anchor', () => {
    const plan = makePlan({
      panels: fourPanels,
      characterAnchor: 'LLM_ANCHOR_TEXT',
    });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 'watercolor',
      ageModifier: 'bright',
    });
    expect(prompt).toContain('LLM_ANCHOR_TEXT');
  });

  it('Style + Age eingebaut', () => {
    const plan = makePlan({ panels: fourPanels });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 'TEST_STYLE',
      ageModifier: 'TEST_AGE',
    });
    expect(prompt).toContain('TEST_STYLE');
    expect(prompt).toContain('TEST_AGE');
  });

  it('nur 3 Panels (LLM vergisst eines) → graceful handling', () => {
    const threePanels = fourPanels.slice(0, 3);
    const plan = makePlan({ panels: threePanels });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 's',
      ageModifier: 'a',
    });
    expect(prompt).toContain('TOP-LEFT:');
    expect(prompt).toContain('BOTTOM-RIGHT:');
    expect((prompt.match(/TOP-LEFT:|TOP-RIGHT:|BOTTOM-LEFT:|BOTTOM-RIGHT:/g) ?? []).length).toBe(4);
  });

  it("'No text' Regel enthalten", () => {
    const plan = makePlan({ panels: fourPanels });
    const { prompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 's',
      ageModifier: 'a',
    });
    expect(prompt).toContain('No text, speech bubbles');
  });

  it('Negative Prompt enthält Konsistenz-Regeln', () => {
    const plan = makePlan({ panels: fourPanels });
    const { negativePrompt } = buildComicStripImagePrompt({
      plan,
      layout: LAYOUT_2X2,
      stylePrompt: 's',
      ageModifier: 'a',
    });
    expect(negativePrompt).toContain('inconsistent characters');
    expect(negativePrompt).toContain('text, words, letters');
  });
});

describe('parseComicStripPlan', () => {
  it('neues panels-Format', () => {
    const imagePlan = {
      character_anchor: 'A girl with curly hair',
      world_anchor: 'A forest',
      panels: [
        { panel_position: 'TOP-LEFT', camera_angle: 'wide', characters_visible: 'girl', action: 'walking', emotion: 'curious', target_paragraph: 0 },
        { panel_position: 'TOP-RIGHT', camera_angle: 'close-up', characters_visible: 'girl', action: 'finding', emotion: 'wonder', target_paragraph: 1 },
        { panel_position: 'BOTTOM-LEFT', camera_angle: 'medium', characters_visible: 'girl', action: 'running', emotion: 'excited', target_paragraph: 2 },
        { panel_position: 'BOTTOM-RIGHT', camera_angle: 'medium', characters_visible: 'girl', action: 'sitting', emotion: 'peaceful', target_paragraph: 3 },
      ],
    };
    const result = parseComicStripPlan(imagePlan, LAYOUT_2X2);
    expect(result).not.toBeNull();
    expect(result!.layoutKey).toBe('layout_1_2x2');
    expect(result!.panels).toHaveLength(4);
    expect(result!.panels[0].label).toBe('TOP-LEFT');
    expect(result!.panels[0].action).toBe('walking');
    expect(result!.characterAnchor).toBe('A girl with curly hair');
  });

  it('altes scenes-Format → Konvertierung', () => {
    const imagePlan = {
      character_anchor: 'Hero boy',
      world_anchor: 'City',
      scenes: [
        { scene_id: 1, setting: 'Street', characters_present: 'boy', action: 'running', emotion: 'scared', target_paragraph: 0 },
        { scene_id: 2, setting: 'Alley', characters_present: 'boy', action: 'hiding', emotion: 'relief', target_paragraph: 1 },
        { scene_id: 3, setting: 'Roof', characters_present: 'boy', action: 'looking', emotion: 'hopeful', target_paragraph: 2 },
      ],
    };
    const layout = COMIC_LAYOUTS['layout_2_2x1'];
    const result = parseComicStripPlan(imagePlan, layout);
    expect(result).not.toBeNull();
    expect(result!.panels).toHaveLength(2);
    expect(result!.panels[0].label).toBe('TOP');
    expect(result!.panels[0].action).toContain('Street');
    expect(result!.panels[0].emotion).toBe('scared');
    expect(result!.panels[1].emotion).toBe('relief');
  });

  it('kaputtes Format → null', () => {
    expect(parseComicStripPlan(null, LAYOUT_2X2)).toBeNull();
    expect(parseComicStripPlan(undefined, LAYOUT_2X2)).toBeNull();
    expect(parseComicStripPlan({}, LAYOUT_2X2)).toBeNull();
  });
});
