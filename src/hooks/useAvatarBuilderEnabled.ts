import { useState, useEffect } from "react";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

/**
 * Whether the current user has Avatar Builder (Mein Look) enabled (feature flag).
 * Used to show/hide the "Mein Look" button on the Home page.
 */
export function useAvatarBuilderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await invokeEdgeFunction("manage-users", { action: "getAvatarBuilderEnabled" });
        if (!cancelled && !error && data?.enabled === true) {
          setEnabled(true);
        }
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
