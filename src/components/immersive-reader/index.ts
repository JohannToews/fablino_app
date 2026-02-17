// Immersive Reader — Public API

// Phase 1: Hooks & Utilities
export { useImmersiveLayout } from './useImmersiveLayout';
export { useContentSplitter } from './useContentSplitter';
export { usePagePosition } from './usePagePosition';
export { useSyllableColoring, isSyllableColoringSupported } from './useSyllableColoring';
export { getImmersiveLabels, t } from './labels';
export {
  getImagePositionsFromPlan,
  distributeImagesEvenly,
  getVisibleImages,
  buildImageArray,
  getImageSide,
  parseImagePlan,
} from './imageUtils';
export {
  getTypographyForAge,
  getMaxWordsPerPage,
  getThemeGradient,
  FABLINO_TEAL,
  SYLLABLE_COLORS,
  PAGE_TRANSITION_MS,
  PAGE_TRANSITION_EASING,
  NAV_HINT_TIMEOUT_MS,
  NAV_HINT_STORAGE_KEY,
  IMAGE_LIMITS,
  THEME_GRADIENTS,
} from './constants';

// Phase 2: Components
export { default as ImmersivePageRenderer } from './ImmersivePageRenderer';
export { default as ImmersiveNavigation } from './ImmersiveNavigation';
export { default as ImmersiveProgressBar } from './ImmersiveProgressBar';
export { default as ImmersiveWordSheet } from './ImmersiveWordSheet';
export { default as ImmersiveToolbar } from './ImmersiveToolbar';

// Phase 3: Orchestrator + Chapter Title
export { default as ImmersiveReader } from './ImmersiveReader';
export { default as ImmersiveChapterTitle } from './ImmersiveChapterTitle';

// Types
export type {
  ImmersivePage,
  LayoutMode,
  FontSizeSetting,
  PageType,
  TypographyConfig,
} from './constants';
export type { ImagePlan, ImagePlanScene } from './imageUtils';
export type { ImmersiveLabels } from './labels';
