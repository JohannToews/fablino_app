/**
 * Immersive Reader — Constants, Types & Configuration
 */

// ── Page Types ──────────────────────────────────────────────

export type PageType = 'text-only' | 'image-text' | 'chapter-title' | 'quiz' | 'end-screen';

export interface ImmersivePage {
  paragraphs: string[];
  hasImage: boolean;
  imageIndex?: number;
  type: PageType;
}

export type LayoutMode = 'phone' | 'small-tablet' | 'landscape-spread';

export type FontSizeSetting = 'small' | 'medium' | 'large';

// ── Breakpoints ─────────────────────────────────────────────

export const BREAKPOINT_PHONE_MAX = 640;
export const BREAKPOINT_SMALL_TABLET_MAX = 1024;
export const BREAKPOINT_LANDSCAPE_MIN_SHORT_SIDE = 600;

// ── Theme Gradients (for text-only pages) ───────────────────

export const THEME_GRADIENTS: Record<string, string> = {
  magic_fantasy:    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  adventure_action: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  real_life:        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  surprise:         'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
};

// Mapping from concrete_theme / theme_key to gradient category
export const THEME_TO_GRADIENT: Record<string, string> = {
  fantasy: 'magic_fantasy',
  magic: 'magic_fantasy',
  action: 'adventure_action',
  adventure: 'adventure_action',
  animals: 'real_life',
  everyday: 'real_life',
  friends: 'real_life',
  educational: 'real_life',
  humor: 'surprise',
  surprise: 'surprise',
};

export function getThemeGradient(themeKey?: string | null): string {
  if (!themeKey) return THEME_GRADIENTS.surprise;
  const category = THEME_TO_GRADIENT[themeKey] || 'surprise';
  return THEME_GRADIENTS[category] || THEME_GRADIENTS.surprise;
}

// ── Colors ──────────────────────────────────────────────────

export const FABLINO_TEAL = '#1A9A8A';

export const SYLLABLE_COLORS = {
  even: '#2563EB', // blue
  odd: '#DC2626',  // red
} as const;

// ── Typography by Age ───────────────────────────────────────

export interface TypographyConfig {
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
}

const AGE_TYPOGRAPHY_DEFAULTS: Record<string, TypographyConfig> = {
  '5-7':  { fontSize: 24, lineHeight: 1.8, letterSpacing: '0.3px' },
  '8-9':  { fontSize: 21, lineHeight: 1.7, letterSpacing: '0.2px' },
  '10-11': { fontSize: 19, lineHeight: 1.65, letterSpacing: '0.1px' },
  '12+':  { fontSize: 17, lineHeight: 1.6, letterSpacing: '0' },
};

const FONT_SIZE_OFFSET: Record<FontSizeSetting, number> = {
  small: -3,
  medium: 0,
  large: 3,
};

export function getTypographyForAge(age: number, setting: FontSizeSetting = 'medium'): TypographyConfig {
  let key: string;
  if (age <= 7) key = '5-7';
  else if (age <= 9) key = '8-9';
  else if (age <= 11) key = '10-11';
  else key = '12+';

  const base = AGE_TYPOGRAPHY_DEFAULTS[key];
  return {
    fontSize: base.fontSize + FONT_SIZE_OFFSET[setting],
    lineHeight: base.lineHeight,
    letterSpacing: base.letterSpacing,
  };
}

// ── Words per Page by Age ───────────────────────────────────

const WORDS_PER_PAGE_BASE: Record<string, number> = {
  '5-7': 70,
  '8-9': 100,
  '10-11': 130,
  '12+': 170,
};

const FONT_SIZE_WORD_MULTIPLIER: Record<FontSizeSetting, number> = {
  small: 1.3,   // +30% more words (smaller text fits more)
  medium: 1.0,
  large: 0.6,   // only 60% of words (large text needs much more space)
};

export function getMaxWordsPerPage(age: number, fontSizeSetting: FontSizeSetting = 'medium'): number {
  let key: string;
  if (age <= 7) key = '5-7';
  else if (age <= 9) key = '8-9';
  else if (age <= 11) key = '10-11';
  else key = '12+';

  const base = WORDS_PER_PAGE_BASE[key];
  return Math.round(base * FONT_SIZE_WORD_MULTIPLIER[fontSizeSetting]);
}

// ── Image Limits by Account Tier ────────────────────────────

export const IMAGE_LIMITS: Record<string, number> = {
  free: 4,
  standard: 4,
  premium: 6,
};

// ── Spread (landscape double-page) ──────────────────────────

export interface Spread {
  left: ImmersivePage;
  right: ImmersivePage | null;
  leftPageIndex: number;         // index into allPages
  rightPageIndex: number | null; // index into allPages (null if single)
}

/**
 * Group individual pages into landscape spreads (book-style double pages).
 *
 * Rules:
 *  - Page 0 (cover / chapter title) always stands alone as the first spread
 *  - Pages 1+ are paired: [1,2], [3,4], [5,6], ...
 *  - If the total is odd, the last page stands alone
 *
 * In non-landscape modes, each page becomes its own "spread" (left only).
 */
export function buildSpreads(pages: ImmersivePage[], isLandscape: boolean): Spread[] {
  if (!isLandscape || pages.length === 0) {
    return pages.map((p, i) => ({
      left: p,
      right: null,
      leftPageIndex: i,
      rightPageIndex: null,
    }));
  }

  const spreads: Spread[] = [];

  // Page 0 stands alone (cover, chapter title, or first content page)
  if (pages.length > 0) {
    spreads.push({
      left: pages[0],
      right: null,
      leftPageIndex: 0,
      rightPageIndex: null,
    });
  }

  // Pages 1+ paired
  for (let i = 1; i < pages.length; i += 2) {
    const hasRight = i + 1 < pages.length;
    spreads.push({
      left: pages[i],
      right: hasRight ? pages[i + 1] : null,
      leftPageIndex: i,
      rightPageIndex: hasRight ? i + 1 : null,
    });
  }

  return spreads;
}

// ── Page Transition ─────────────────────────────────────────

export const PAGE_TRANSITION_MS = 300;
export const PAGE_TRANSITION_EASING = 'ease-out';

// ── Navigation Hint ─────────────────────────────────────────

export const NAV_HINT_TIMEOUT_MS = 5000;
export const NAV_HINT_STORAGE_KEY = 'fablino_immersive_hint_shown';

// ── Minimum pages ───────────────────────────────────────────

export const MIN_PAGES = 3;
export const MIN_PAGES_REDUCTION_FACTOR = 0.7; // reduce maxWords by 30% if < MIN_PAGES
export const MAX_PAGES = 8;
export const MAX_PAGES_INCREASE_FACTOR = 1.3;  // increase maxWords by 30% if > MAX_PAGES
