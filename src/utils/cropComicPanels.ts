/**
 * Frontend Comic-Strip Panel Cropper
 * Crops a full 2x2 comic-strip image into individual panels using Canvas API.
 */

const GRID_CONFIGS: Record<string, { rows: number; cols: number }> = {
  'layout_1_2x2': { rows: 2, cols: 2 },
  'layout_2x2_equal': { rows: 2, cols: 2 },
};

/**
 * Crop a full comic-strip image into individual panel data URLs.
 * Panel order: top-left, top-right, bottom-left, bottom-right.
 */
export async function cropComicPanels(
  imageUrl: string,
  layoutKey: string,
): Promise<string[]> {
  const grid = GRID_CONFIGS[layoutKey] || { rows: 2, cols: 2 };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const panelW = Math.floor(img.width / grid.cols);
      const panelH = Math.floor(img.height / grid.rows);
      const panels: string[] = [];

      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = panelW;
          canvas.height = panelH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              c * panelW, r * panelH, panelW, panelH,
              0, 0, panelW, panelH,
            );
            panels.push(canvas.toDataURL('image/webp', 0.9));
          }
        }
      }
      resolve(panels);
    };
    img.onerror = () => reject(new Error('Failed to load comic image for cropping'));
    img.src = imageUrl;
  });
}
