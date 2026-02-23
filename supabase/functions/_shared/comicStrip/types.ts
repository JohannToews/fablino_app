/**
 * Comic-Strip — Type Definitions (Task 5b.1)
 */

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelPosition {
  label: string;
  cropRegion: CropRegion;
  promptLabel: string;
  narrativeRole: string;
}

export type CropMode = 'none' | 'grid' | 'horizontal' | 'mixed';

export interface ComicLayout {
  layoutKey: string;
  panelCount: number;
  panels: PanelPosition[];
  aspectRatio: string;
  promptTemplate: string;
  cropMode: CropMode;
  isActive: boolean;
}

/** Panel data for ComicStripPlan (from LLM or converted from scenes). */
export interface ComicStripPlanPanel {
  label: string;
  sceneDescription: string;
  narrativeRole: string;
  camera_angle?: string;
  characters_visible?: string;
  action?: string;
  emotion?: string;
  target_paragraph?: number;
}

export interface ComicStripPlan {
  layoutKey: string;
  panels: ComicStripPlanPanel[];
  characterAnchor?: string;
}

/** LLM-generated panel for grid-based image_plan (grid_1 / grid_2). */
export interface ComicPanel {
  panel: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  role?: 'cover' | 'ending';
  camera: string;
  scene_en: string;
}

/** Image plan format when LLM returns grid_1 + grid_2 (8 panels in 2 grids). */
export interface ComicImagePlan {
  character_anchor: string;
  world_anchor: string;
  grid_1: ComicPanel[];
  grid_2: ComicPanel[];
}
