import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutMode,
  BREAKPOINT_PHONE_MAX,
  BREAKPOINT_SMALL_TABLET_MAX,
  BREAKPOINT_LANDSCAPE_MIN_SHORT_SIDE,
} from './constants';

function detectLayoutMode(): LayoutMode {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isLandscape = w > h;
  const shortSide = Math.min(w, h);

  // Large tablet landscape: >=1025px OR landscape with short side >= 600px
  if (w >= BREAKPOINT_SMALL_TABLET_MAX + 1 || (isLandscape && shortSide >= BREAKPOINT_LANDSCAPE_MIN_SHORT_SIDE)) {
    return 'landscape-spread';
  }

  // Phone: width <= 640px
  if (w <= BREAKPOINT_PHONE_MAX) {
    return 'phone';
  }

  // Small tablet portrait: 641-1024px
  return 'small-tablet';
}

const DEBOUNCE_MS = 100;

/**
 * Detects the current layout mode and updates on resize / orientation change.
 *
 * Returns: 'phone' | 'small-tablet' | 'landscape-spread'
 */
export function useImmersiveLayout(): LayoutMode {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(detectLayoutMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLayoutMode(detectLayoutMode());
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleChange]);

  return layoutMode;
}
