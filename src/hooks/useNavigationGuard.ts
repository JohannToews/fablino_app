import { useEffect, useCallback, useRef } from "react";
import { useBlocker } from "react-router-dom";

type NavigationBlocker = {
  state: "unblocked" | "blocked" | "proceeding";
  proceed?: () => void;
  reset?: () => void;
};

const FALLBACK_BLOCKER: NavigationBlocker = {
  state: "unblocked",
};

/**
 * Prevents accidental navigation away from a page.
 * - Blocks in-app React Router navigation when available
 * - Falls back gracefully when blocker API is unavailable
 * - Blocks browser back/refresh via beforeunload event
 */
export function useNavigationGuard(shouldBlock: boolean): NavigationBlocker {
  const warnedRef = useRef(false);
  let blocker: NavigationBlocker = FALLBACK_BLOCKER;

  try {
    blocker = useBlocker(
      useCallback(
        ({ currentLocation, nextLocation }) =>
          shouldBlock && currentLocation.pathname !== nextLocation.pathname,
        [shouldBlock]
      )
    ) as NavigationBlocker;
  } catch (error) {
    if (!warnedRef.current) {
      warnedRef.current = true;
      console.warn("[useNavigationGuard] Blocker API unavailable, using fallback guard.", error);
    }
  }

  // Browser back / refresh / tab close
  useEffect(() => {
    if (!shouldBlock) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message; custom text is ignored
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldBlock]);

  return blocker;
}

