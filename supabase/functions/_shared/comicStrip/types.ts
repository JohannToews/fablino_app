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
