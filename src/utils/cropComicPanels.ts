/**
 * Frontend Comic-Strip Panel Cropper
 * Crops full 2x2 comic-strip images into individual panels using Canvas API.
 * Supports both single-grid (4 panels) and dual-grid (8 panels) layouts.
 */

export interface ComicGridPanelInfo {
  panel: string;
  role?: 'cover' | 'ending';
  camera: string;
  scene_en?: string;
}

export interface ComicGridPlan {
  character_anchor?: string;
  world_anchor?: string;
  grid_1: ComicGridPanelInfo[];
  grid_2?: ComicGridPanelInfo[];
}

export interface CroppedPanel {
  dataUrl: string;
  position: number;     // 1-8 (order in text)
  role?: 'cover' | 'ending';
  camera: string;
}

const GRID_CONFIGS: Record<string, { rows: number; cols: number }> = {
  'layout_1_2x2': { rows: 2, cols: 2 },
  'layout_2x2_equal': { rows: 2, cols: 2 },
  'layout_2x_2x2': { rows: 2, cols: 2 },
};

/**
 * Crop a single 2x2 grid image into 4 panel data URLs.
 * Panel order: top-left, top-right, bottom-left, bottom-right.
 * Applies an inset of 3px per side to remove the white gap between panels.
 */
async function cropSingleGrid(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const panelW = Math.floor(img.width / 2);
      const panelH = Math.floor(img.height / 2);
      // Inset: 3px per side to remove the 2px white gap + safety margin
      const inset = 3;
      const results: string[] = [];

      const positions = [
        [0, 0],           // top-left
        [panelW, 0],      // top-right
        [0, panelH],      // bottom-left
        [panelW, panelH], // bottom-right
      ];

      for (const [x, y] of positions) {
        const canvas = document.createElement('canvas');
        canvas.width = panelW - (inset * 2);
        canvas.height = panelH - (inset * 2);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            x + inset, y + inset,
            panelW - (inset * 2), panelH - (inset * 2),
            0, 0,
            canvas.width, canvas.height,
          );
          results.push(canvas.toDataURL('image/webp', 0.9));
        }
      }
      resolve(results);
    };
    img.onerror = () => reject(new Error('Failed to load comic grid image'));
    img.src = imageUrl;
  });
}

/**
 * Crop two 2x2 grid images into 8 individual CroppedPanel objects.
 * If only one image is provided, returns 4 panels.
 * Uses comic_grid_plan for role/camera metadata.
 */
export async function cropComicGrids(
  imageUrl1: string,
  imageUrl2: string | null,
  gridPlan: ComicGridPlan,
): Promise<CroppedPanel[]> {
  const panels: CroppedPanel[] = [];

  // Grid 1 → Panels 1-4
  const grid1Panels = await cropSingleGrid(imageUrl1);
  const grid1Info = gridPlan.grid_1 || [];
  grid1Panels.forEach((dataUrl, i) => {
    panels.push({
      dataUrl,
      position: i + 1,
      role: grid1Info[i]?.role,
      camera: grid1Info[i]?.camera || 'medium',
    });
  });

  // Grid 2 → Panels 5-8 (if second image exists)
  if (imageUrl2 && gridPlan.grid_2) {
    const grid2Panels = await cropSingleGrid(imageUrl2);
    const grid2Info = gridPlan.grid_2;
    grid2Panels.forEach((dataUrl, i) => {
      panels.push({
        dataUrl,
        position: i + 5,
        role: grid2Info[i]?.role,
        camera: grid2Info[i]?.camera || 'medium',
      });
    });
  }

  return panels;
}

/**
 * Legacy: Crop a single 2x2 grid into panel data URLs (no metadata).
 * Kept for backward compatibility with old stories that have comic_full_image but no comic_grid_plan.
 */
export async function cropComicPanels(
  imageUrl: string,
  layoutKey: string,
): Promise<string[]> {
  // Use the new cropSingleGrid internally
  return cropSingleGrid(imageUrl);
}
