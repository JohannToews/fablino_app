import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePremiumUi } from "@/hooks/usePremiumUi";

/**
 * Wraps route content in a Framer Motion transition when premium_ui is enabled.
 * Use as layout route: <Route element={<PremiumRouteTransition />}> ... child routes ... </Route>
 */
export default function PremiumRouteTransition() {
  const outlet = <Outlet />;
  const location = useLocation();
  const { premiumUiEnabled } = usePremiumUi();

  if (!premiumUiEnabled) {
    return <>{outlet}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
