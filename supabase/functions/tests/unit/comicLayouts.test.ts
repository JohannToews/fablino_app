/**
 * Unit tests — Comic-Strip Layouts & Feature Flag (Task 5b.1)
 */

import { describe, it, expect } from 'vitest';
import { COMIC_LAYOUTS, selectLayout } from '../../_shared/comicStrip/layouts.ts';
import type { PanelPosition } from '../../_shared/comicStrip/types.ts';
import {
  isComicStripEnabled,
  resetComicStripFeatureFlagCache,
} from '../../_shared/comicStrip/featureFlag.ts';

function mockSupabase(value: string | null, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: value !== null ? { value } : null, error }),
        }),
      }),
    }),
  };
}

describe('selectLayout', () => {
  it('gibt aktives Layout zurück', () => {
    const layout = selectLayout();
    expect(layout.layoutKey).toBe('layout_1_2x2');
    expect(layout.isActive).toBe(true);
    expect(layout.panelCount).toBe(4);
  });

  it('Fallback auf layout_0_single wenn nichts aktiv', () => {
    const inactive = { ...COMIC_LAYOUTS['layout_1_2x2'], isActive: false };
    const orig = COMIC_LAYOUTS['layout_1_2x2'];
    COMIC_LAYOUTS['layout_1_2x2'] = inactive;
    const layout = selectLayout();
    expect(layout.layoutKey).toBe('layout_0_single');
    COMIC_LAYOUTS['layout_1_2x2'] = orig;
  });
});

describe('Layout cropRegions', () => {
  it('alle Layouts haben valide cropRegions (Fläche deckt 100% ab)', () => {
    for (const [key, layout] of Object.entries(COMIC_LAYOUTS)) {
      const totalArea = layout.panels.reduce(
        (sum: number, p: PanelPosition) => sum + p.cropRegion.width * p.cropRegion.height,
        0
      );
      expect(totalArea).toBeCloseTo(1.0, 3);
    }
  });
});

describe('Comic-Strip Feature Flag', () => {
  it('leeres Array → false', async () => {
    resetComicStripFeatureFlagCache();
    const result = await isComicStripEnabled('user-any', mockSupabase('[]'));
    expect(result).toBe(false);
  });

  it("['*'] → true für jeden User", async () => {
    resetComicStripFeatureFlagCache();
    const result = await isComicStripEnabled('any-user-id', mockSupabase('["*"]'));
    expect(result).toBe(true);
  });

  it("['user-123'] → true nur für user-123", async () => {
    resetComicStripFeatureFlagCache();
    const r1 = await isComicStripEnabled('user-123', mockSupabase('["user-123"]'));
    expect(r1).toBe(true);
    resetComicStripFeatureFlagCache();
    const r2 = await isComicStripEnabled('other-user', mockSupabase('["user-123"]'));
    expect(r2).toBe(false);
  });
});
