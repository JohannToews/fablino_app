/**
 * Comic-Strip Panel Cropper (Task 5b.3)
 * Crops a full comic-strip image into panels using layout.cropRegion (0–1).
 * Fallback: getComicStripCropData returns crop regions for frontend cropping.
 *
 * Edge Functions (Deno): Use getComicStripCropData if no image lib is available.
 * Node/tests: cropComicStrip uses jimp when available (npm install jimp).
 */

import type { ComicLayout } from './types.ts';
import type { CropRegion } from './types.ts';

export interface CroppedPanel {
  label: string;
  position: string;
  base64: string;
  width: number;
  height: number;
}

export interface PanelCropData {
  label: string;
  position: string;
  fullImageUrl: string;
  cropRegion: CropRegion;
}

export interface PanelPixelRect {
  label: string;
  position: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute pixel rectangles for each panel from layout and image dimensions.
 * Used by cropComicStrip and testable without any image library.
 */
export function computePanelPixelRects(
  layout: ComicLayout,
  imageWidth: number,
  imageHeight: number
): PanelPixelRect[] {
  return layout.panels.map((panel, index) => {
    const r = panel.cropRegion;
    const x = Math.round(r.x * imageWidth);
    const y = Math.round(r.y * imageHeight);
    const width = Math.round(r.width * imageWidth);
    const height = Math.round(r.height * imageHeight);
    return {
      label: `panel_${index + 1}`,
      position: panel.label,
      x,
      y,
      width,
      height,
    };
  });
}

/**
 * Fallback when server-side cropping is not available (e.g. Deno without image lib).
 * Returns crop regions so the frontend can crop via Canvas or CSS.
 */
export function getComicStripCropData(
  fullImageUrl: string,
  layout: ComicLayout
): PanelCropData[] {
  return layout.panels.map((panel, index) => ({
    label: `panel_${index + 1}`,
    position: panel.label,
    fullImageUrl,
    cropRegion: { ...panel.cropRegion },
  }));
}

export type CropComicStripParams = {
  imageBase64: string;
  layout: ComicLayout;
  outputFormat?: 'base64' | 'buffer';
};

/**
 * Crops the full comic-strip image into one panel per layout.panels.
 * Requires an image library (e.g. jimp in Node). In Deno/Edge, use getComicStripCropData instead.
 */
export async function cropComicStrip(
  params: CropComicStripParams
): Promise<CroppedPanel[]> {
  const { imageBase64, layout } = params;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('cropComicStrip: imageBase64 must be a non-empty string');
  }

  const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawBase64, 'base64');
  } catch {
    throw new Error('cropComicStrip: invalid base64 string');
  }
  if (buffer.length === 0) {
    throw new Error('cropComicStrip: decoded image buffer is empty');
  }

  const Jimp = await loadJimp();
  const image = await Jimp.read(buffer);
  const imageWidth = image.bitmap?.width ?? image.width ?? 0;
  const imageHeight = image.bitmap?.height ?? image.height ?? 0;
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('cropComicStrip: could not read image dimensions');
  }

  const rects = computePanelPixelRects(layout, imageWidth, imageHeight);
  const results: CroppedPanel[] = [];

  const MIME_PNG = 'image/png';

  for (const rect of rects) {
    const cropped = image.clone().crop({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    const base64WithPrefix = await getBase64Async(cropped, MIME_PNG);
    const base64 = base64WithPrefix.replace(/^data:image\/\w+;base64,/, '');
    results.push({
      label: rect.label,
      position: rect.position,
      base64,
      width: rect.width,
      height: rect.height,
    });
  }

  return results;
}

function getBase64Async(image: any, mimePng: string): Promise<string> {
  const p = image.getBase64(mimePng);
  if (p && typeof p.then === 'function') return p;
  return new Promise((resolve, reject) => {
    image.getBase64(mimePng, (err: Error | null, data: string) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function loadJimp(): Promise<{ read: (buf: Buffer) => Promise<any> }> {
  try {
    const jimp = await import('jimp');
    const Jimp = jimp.Jimp ?? jimp.default;
    if (!Jimp || typeof Jimp.read !== 'function') {
      throw new Error('Jimp.read not available');
    }
    return Jimp;
  } catch (err) {
    throw new Error(
      'cropComicStrip requires the jimp package. Install with: npm install jimp. Or use getComicStripCropData for frontend cropping.'
    );
  }
}
