import { useEffect } from "react";
import { usePremiumUi } from "@/hooks/usePremiumUi";

const BODY_CLASS = "premium-ui";

/**
 * When premium_ui feature flag is enabled for the current user,
 * adds the class "premium-ui" to document.body so CSS can target
 * premium styles (e.g. body.premium-ui .btn-kid { ... }).
 */
export default function PremiumUiBodyClass() {
  const { premiumUiEnabled, isLoading } = usePremiumUi();

  useEffect(() => {
    console.log("[PremiumUI] enabled:", premiumUiEnabled, "loading:", isLoading);
    if (premiumUiEnabled) {
      document.body.classList.add(BODY_CLASS);
    } else {
      document.body.classList.remove(BODY_CLASS);
    }
    return () => document.body.classList.remove(BODY_CLASS);
  }, [premiumUiEnabled, isLoading]);

  return null;
}
