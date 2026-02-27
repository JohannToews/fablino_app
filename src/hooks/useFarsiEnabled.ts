import { useState, useEffect } from "react";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

/**
 * Whether the current user has Farsi (fa) story language enabled (feature flag).
 * Used to show/hide Iran & Afghanistan school systems and Farsi in story language picker.
 */
export function useFarsiEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await invokeEdgeFunction("manage-users", { action: "getFarsiEnabled" });
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
