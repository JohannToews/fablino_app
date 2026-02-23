/**
 * Unit tests — Comic-Strip Panel Cropper (Task 5b.3)
 */

import { describe, it, expect } from 'vitest';
import {
  cropComicStrip,
  getComicStripCropData,
  computePanelPixelRects,
  type PanelPixelRect,
  type CroppedPanel,
} from '../../_shared/comicStrip/panelCropper.ts';
import { COMIC_LAYOUTS } from '../../_shared/comicStrip/layouts.ts';

const LAYOUT_2X2 = COMIC_LAYOUTS['layout_1_2x2'];

async function createTestImageBase64(width: number, height: number): Promise<string> {
  const { Jimp } = await import('jimp');
  const image = new Jimp({ width, height, color: 0xffffffff });
  let withPrefix: string;
  const out = image.getBase64('image/png');
  if (out != null && typeof (out as Promise<string>).then === 'function') {
    withPrefix = await (out as Promise<string>);
  } else {
    withPrefix = await new Promise<string>((resolve, reject) => {
      image.getBase64('image/png', (err: Error | null, data: string) => (err ? reject(err) : resolve(data)));
    });
  }
  return withPrefix.replace(/^data:image\/\w+;base64,/, '');
}

describe('computePanelPixelRects', () => {
  it('Crop-Koordinaten für 2×2 sind pixelgenau, keine Lücken', () => {
    const rects = computePanelPixelRects(LAYOUT_2X2, 1024, 1024);
    expect(rects).toHaveLength(4);
    expect(rects[0]).toEqual({ label: 'panel_1', position: 'TOP-LEFT', x: 0, y: 0, width: 512, height: 512 });
    expect(rects[1]).toEqual({ label: 'panel_2', position: 'TOP-RIGHT', x: 512, y: 0, width: 512, height: 512 });
    expect(rects[2]).toEqual({ label: 'panel_3', position: 'BOTTOM-LEFT', x: 0, y: 512, width: 512, height: 512 });
    expect(rects[3]).toEqual({ label: 'panel_4', position: 'BOTTOM-RIGHT', x: 512, y: 512, width: 512, height: 512 });
    const totalCover = 512 * 512 * 4;
    expect(totalCover).toBe(1024 * 1024);
  });

  it('1000×1000 → keine Überlappung, Summe deckt ab', () => {
    const rects = computePanelPixelRects(LAYOUT_2X2, 1000, 1000);
    expect(rects).toHaveLength(4);
    expect(rects[0].width).toBe(500);
    expect(rects[0].height).toBe(500);
    const totalArea = rects.reduce((s: number, r: PanelPixelRect) => s + r.width * r.height, 0);
    expect(totalArea).toBe(1000 * 1000);
  });

  it('Panel-Labels: panel_1 = TOP-LEFT, panel_2 = TOP-RIGHT, etc.', () => {
    const rects = computePanelPixelRects(LAYOUT_2X2, 100, 100);
    expect(rects[0].label).toBe('panel_1');
    expect(rects[0].position).toBe('TOP-LEFT');
    expect(rects[1].label).toBe('panel_2');
    expect(rects[1].position).toBe('TOP-RIGHT');
    expect(rects[2].position).toBe('BOTTOM-LEFT');
    expect(rects[3].position).toBe('BOTTOM-RIGHT');
  });
});

describe('getComicStripCropData', () => {
  it('gibt PanelCropData mit fullImageUrl und cropRegion zurück', () => {
    const data = getComicStripCropData('https://example.com/image.png', LAYOUT_2X2);
    expect(data).toHaveLength(4);
    expect(data[0].fullImageUrl).toBe('https://example.com/image.png');
    expect(data[0].cropRegion).toEqual({ x: 0, y: 0, width: 0.5, height: 0.5 });
    expect(data[0].position).toBe('TOP-LEFT');
  });
});

describe('cropComicStrip', () => {
  it('Crop 2×2 → 4 Panels korrekte Größe', async () => {
    const imageBase64 = await createTestImageBase64(1024, 1024);
    const panels = await cropComicStrip({ imageBase64, layout: LAYOUT_2X2 });
    expect(panels).toHaveLength(4);
    expect(panels.every((p: CroppedPanel) => p.width === 512 && p.height === 512)).toBe(true);
  });

  it('Panel-Labels und position korrekt', async () => {
    const imageBase64 = await createTestImageBase64(64, 64);
    const panels = await cropComicStrip({ imageBase64, layout: LAYOUT_2X2 });
    expect(panels[0].label).toBe('panel_1');
    expect(panels[0].position).toBe('TOP-LEFT');
    expect(panels[1].position).toBe('TOP-RIGHT');
    expect(panels[2].position).toBe('BOTTOM-LEFT');
    expect(panels[3].position).toBe('BOTTOM-RIGHT');
  });

  it('Fehler bei ungültigem Bild → aussagekräftiger Fehler', async () => {
    await expect(cropComicStrip({ imageBase64: '', layout: LAYOUT_2X2 })).rejects.toThrow(
      /imageBase64 must be a non-empty string/
    );
    await expect(cropComicStrip({ imageBase64: 'not-valid-base64!!!', layout: LAYOUT_2X2 })).rejects.toThrow();
  });
});
