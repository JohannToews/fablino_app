import { useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Prevents accidental navigation away from a page.
 * - Blocks in-app React Router navigation (shows custom dialog via returned blocker)
 * - Blocks browser back/refresh via beforeunload event
 *
 * @param shouldBlock - Whether navigation should be blocked
 * @returns The blocker object from react-router-dom
 */
export function useNavigationGuard(shouldBlock: boolean) {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        shouldBlock && currentLocation.pathname !== nextLocation.pathname,
      [shouldBlock]
    )
  );

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
