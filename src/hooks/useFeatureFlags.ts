import { useState, useEffect } from "react";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

/**
 * Whether the current user has Avatar v2 enabled (feature flag).
 * Reads avatar_v2_enabled_users via manage-users edge function.
 * Same pattern as useFarsiEnabled / useAvatarBuilderEnabled.
 */
export function useAvatarV2(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await invokeEdgeFunction("manage-users", { action: "getAvatarV2Enabled" });
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
