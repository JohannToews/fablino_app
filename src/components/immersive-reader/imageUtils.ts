import { IMAGE_LIMITS } from './constants';

/**
 * ImagePlan interface matching the LLM's response structure.
 * Mirrors the backend ImagePlan from imagePromptBuilder.ts.
 */
export interface ImagePlanScene {
  scene_id: number;
  story_position: string;
  description: string;
  emotion: string;
  key_elements: string[];
  target_paragraph?: number; // NEW: 0-based paragraph index (may be missing on old stories)
}

export interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: ImagePlanScene[];
}

/**
 * Extract image positions (paragraph indices) from an ImagePlan.
 *
 * Uses `target_paragraph` if available (new stories).
 * Falls back to even distribution if any scene lacks target_paragraph.
 */
export function getImagePositionsFromPlan(
  imagePlan: ImagePlan | null | undefined,
  paragraphCount: number,
  imageCount: number,
): number[] {
  if (!imagePlan || !imagePlan.scenes || imagePlan.scenes.length === 0) {
    return distributeImagesEvenly(paragraphCount, imageCount);
  }

  // Check if ALL scenes have target_paragraph
  const allHaveTarget = imagePlan.scenes.every(
    s => typeof s.target_paragraph === 'number'
  );

  if (!allHaveTarget) {
    return distributeImagesEvenly(paragraphCount, imageCount);
  }

  // Build positions: cover goes to paragraph 0, then scene target_paragraphs
  const positions: number[] = [0]; // cover always goes to first paragraph
  for (const scene of imagePlan.scenes) {
    const targetPara = scene.target_paragraph!;
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(targetPara, paragraphCount - 1));
    // Avoid duplicates — if already taken, find the next free paragraph
    if (!positions.includes(clamped)) {
      positions.push(clamped);
    } else {
      // Find nearest unused paragraph
      for (let offset = 1; offset < paragraphCount; offset++) {
        const tryAfter = clamped + offset;
        const tryBefore = clamped - offset;
        if (tryAfter < paragraphCount && !positions.includes(tryAfter)) {
          positions.push(tryAfter);
          break;
        }
        if (tryBefore >= 0 && !positions.includes(tryBefore)) {
          positions.push(tryBefore);
          break;
        }
      }
    }
  }

  return positions;
}

/**
 * Fallback: Distribute images evenly across paragraphs.
 *
 * Used for existing stories that don't have target_paragraph data.
 * Cover always goes to paragraph 0.
 */
export function distributeImagesEvenly(
  totalParagraphs: number,
  imageCount: number,
): number[] {
  if (imageCount <= 0 || totalParagraphs <= 0) return [];
  if (imageCount === 1) return [0];

  const positions: number[] = [0]; // Cover at first paragraph
  const remainingImages = imageCount - 1;

  if (remainingImages > 0 && totalParagraphs > 1) {
    const step = (totalParagraphs - 1) / (remainingImages + 1);
    for (let i = 1; i <= remainingImages; i++) {
      positions.push(Math.round(i * step));
    }
  }

  return positions;
}

/**
 * Get the visible images based on account tier.
 */
export function getVisibleImages(
  allImages: string[],
  accountTier: string,
): string[] {
  const maxImages = IMAGE_LIMITS[accountTier] || IMAGE_LIMITS.standard;
  return allImages.slice(0, maxImages);
}

/**
 * Build the full image array from cover + story_images.
 */
export function buildImageArray(
  coverImageUrl: string | null | undefined,
  storyImages: string[] | null | undefined,
): string[] {
  const images: string[] = [];
  if (coverImageUrl) images.push(coverImageUrl);
  if (storyImages && Array.isArray(storyImages)) {
    images.push(...storyImages);
  }
  return images;
}

/**
 * Determine image side for landscape-spread layout.
 *
 * Alternates: 0 → left, 1 → right, 2 → left, ...
 */
export function getImageSide(imagePageIndex: number): 'left' | 'right' {
  return imagePageIndex % 2 === 0 ? 'left' : 'right';
}

/**
 * Parse image_plan from a story record.
 *
 * The image_plan may be stored as a JSON string or object.
 */
export function parseImagePlan(raw: unknown): ImagePlan | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && Array.isArray(parsed.scenes)) {
      return parsed as ImagePlan;
    }
    return null;
  } catch {
    return null;
  }
}
