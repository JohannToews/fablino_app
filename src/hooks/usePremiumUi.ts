import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

/**
 * Reads and updates the premium_ui feature flag for the current user.
 * Flag is stored in app_settings (key: premium_ui_enabled_users) as JSON array of user IDs.
 * Default: false. Toggle in Admin (Parent Settings) or via setPremiumUiEnabled.
 */
export function usePremiumUi() {
  const { user, isAuthenticated } = useAuth();
  const [premiumUiEnabled, setPremiumUiEnabledState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnabled = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setPremiumUiEnabledState(false);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await invokeEdgeFunction("manage-users", {
        action: "getPremiumUi",
      });
      if (error) {
        setPremiumUiEnabledState(false);
        return;
      }
      const enabled = (data as { enabled?: boolean })?.enabled === true;
      setPremiumUiEnabledState(enabled);
    } catch {
      setPremiumUiEnabledState(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    fetchEnabled();
  }, [fetchEnabled]);

  const setPremiumUiEnabled = useCallback(
    async (enabled: boolean) => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const { error } = await invokeEdgeFunction("manage-users", {
          action: "setPremiumUi",
          enabled,
        });
        if (error) throw new Error(String(error));
        setPremiumUiEnabledState(enabled);
      } catch {
        // Keep previous state on error
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  return {
    premiumUiEnabled,
    setPremiumUiEnabled,
    isLoading,
  };
}
