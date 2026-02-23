/**
 * Comic-Strip Layout Definitions (Task 5b.1)
 * Only layout_1_2x2 is active for initial testing.
 */

import type { ComicLayout, PanelPosition } from './types.ts';

export type { ComicLayout, PanelPosition } from './types.ts';

export const COMIC_LAYOUTS: Record<string, ComicLayout> = {
  layout_0_single: {
    layoutKey: 'layout_0_single',
    panelCount: 1,
    aspectRatio: '1:1',
    cropMode: 'none',
    isActive: false,
    panels: [
      {
        label: 'FULL',
        cropRegion: { x: 0, y: 0, width: 1.0, height: 1.0 },
        promptLabel: '',
        narrativeRole: 'the key moment of the story',
      },
    ],
    promptTemplate: '{style}.',
  },

  layout_1_2x2: {
    layoutKey: 'layout_1_2x2',
    panelCount: 4,
    aspectRatio: '1:1',
    cropMode: 'grid',
    isActive: true,
    panels: [
      {
        label: 'TOP-LEFT',
        cropRegion: { x: 0, y: 0, width: 0.5, height: 0.5 },
        promptLabel: 'TOP-LEFT:',
        narrativeRole: 'establishing shot — set the scene, show the world',
      },
      {
        label: 'TOP-RIGHT',
        cropRegion: { x: 0.5, y: 0, width: 0.5, height: 0.5 },
        promptLabel: 'TOP-RIGHT:',
        narrativeRole: 'rising tension — the challenge or discovery',
      },
      {
        label: 'BOTTOM-LEFT',
        cropRegion: { x: 0, y: 0.5, width: 0.5, height: 0.5 },
        promptLabel: 'BOTTOM-LEFT:',
        narrativeRole: 'climax — the emotional peak or key action',
      },
      {
        label: 'BOTTOM-RIGHT',
        cropRegion: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        promptLabel: 'BOTTOM-RIGHT:',
        narrativeRole: 'resolution — emotional landing, new understanding',
      },
    ],
    promptTemplate:
      'Digital comic book page, 2x2 grid layout with thick black borders between panels, {style}.',
  },

  layout_2_2x1: {
    layoutKey: 'layout_2_2x1',
    panelCount: 2,
    aspectRatio: '1:1',
    cropMode: 'horizontal',
    isActive: false,
    panels: [
      {
        label: 'TOP',
        cropRegion: { x: 0, y: 0, width: 1.0, height: 0.5 },
        promptLabel: 'TOP:',
        narrativeRole: 'the setup — wide establishing shot',
      },
      {
        label: 'BOTTOM',
        cropRegion: { x: 0, y: 0.5, width: 1.0, height: 0.5 },
        promptLabel: 'BOTTOM:',
        narrativeRole: 'the payoff — emotional resolution',
      },
    ],
    promptTemplate:
      'Digital comic book page, two horizontal panels stacked vertically with thick black border between, {style}.',
  },

  layout_3_1plus2: {
    layoutKey: 'layout_3_1plus2',
    panelCount: 3,
    aspectRatio: '1:1',
    cropMode: 'mixed',
    isActive: false,
    panels: [
      {
        label: 'TOP',
        cropRegion: { x: 0, y: 0, width: 1.0, height: 0.5 },
        promptLabel: 'TOP (large):',
        narrativeRole: 'dramatic establishing wide shot',
      },
      {
        label: 'BOTTOM-LEFT',
        cropRegion: { x: 0, y: 0.5, width: 0.5, height: 0.5 },
        promptLabel: 'BOTTOM-LEFT:',
        narrativeRole: 'action close-up',
      },
      {
        label: 'BOTTOM-RIGHT',
        cropRegion: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        promptLabel: 'BOTTOM-RIGHT:',
        narrativeRole: 'emotional resolution',
      },
    ],
    promptTemplate:
      'Comic book page: one large panel spanning full width on top, two smaller panels side by side below, thick black borders, {style}.',
  },

  layout_4_2plus1: {
    layoutKey: 'layout_4_2plus1',
    panelCount: 3,
    aspectRatio: '1:1',
    cropMode: 'mixed',
    isActive: false,
    panels: [
      {
        label: 'TOP-LEFT',
        cropRegion: { x: 0, y: 0, width: 0.5, height: 0.5 },
        promptLabel: 'TOP-LEFT:',
        narrativeRole: 'introduction — character in context',
      },
      {
        label: 'TOP-RIGHT',
        cropRegion: { x: 0.5, y: 0, width: 0.5, height: 0.5 },
        promptLabel: 'TOP-RIGHT:',
        narrativeRole: 'rising tension — close-up on emotion',
      },
      {
        label: 'BOTTOM',
        cropRegion: { x: 0, y: 0.5, width: 1.0, height: 0.5 },
        promptLabel: 'BOTTOM (large):',
        narrativeRole: 'dramatic climax — wide action shot',
      },
    ],
    promptTemplate:
      'Comic book page: two panels side by side on top, one large panel spanning full width below, thick black borders, {style}.',
  },

  layout_5_3vert: {
    layoutKey: 'layout_5_3vert',
    panelCount: 3,
    aspectRatio: '2:3',
    cropMode: 'horizontal',
    isActive: false,
    panels: [
      {
        label: 'PANEL-1',
        cropRegion: { x: 0, y: 0, width: 1.0, height: 0.333 },
        promptLabel: 'TOP PANEL:',
        narrativeRole: 'opening scene',
      },
      {
        label: 'PANEL-2',
        cropRegion: { x: 0, y: 0.333, width: 1.0, height: 0.334 },
        promptLabel: 'MIDDLE PANEL:',
        narrativeRole: 'turning point',
      },
      {
        label: 'PANEL-3',
        cropRegion: { x: 0, y: 0.667, width: 1.0, height: 0.333 },
        promptLabel: 'BOTTOM PANEL:',
        narrativeRole: 'resolution',
      },
    ],
    promptTemplate:
      'Manga-style vertical page, three horizontal panels stacked, thick black borders, {style}.',
  },
};

/**
 * Selects the layout to use. Phase 1: always returns the first active layout (layout_1_2x2).
 * Later: rotation/weighting, avoid lastLayoutKey.
 */
export function selectLayout(_lastLayoutKey?: string | null): ComicLayout {
  const activeLayouts = Object.values(COMIC_LAYOUTS).filter((l) => l.isActive);
  if (activeLayouts.length === 0) return COMIC_LAYOUTS['layout_0_single'];
  return activeLayouts[0];
}
