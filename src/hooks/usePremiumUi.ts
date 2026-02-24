import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

/**
 * Reads and updates the premium_ui feature flag for the current user.
 * Flag is stored in app_settings (key: premium_ui_enabled_users) as JSON array of user IDs.
 * Toggle in Admin → Feature Flags or Parent Settings. Refetches on route change and window focus
 * so changes (e.g. toggled on Feature Flags page) are picked up without full reload.
 */
export function usePremiumUi() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
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

  // Refetch when user navigates (e.g. back from Feature Flags) or tab gets focus
  useEffect(() => {
    const onFocus = () => fetchEnabled();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchEnabled]);

  useEffect(() => {
    fetchEnabled();
  }, [location.pathname, fetchEnabled]);

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
