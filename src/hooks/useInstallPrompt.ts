import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const BANNER_KEY = "fablino_install_banner_dismissed";
const MODAL_KEY = "fablino_install_modal_shown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((window.navigator as any).standalone === true) return true;
  return false;
}

export function useInstallPrompt() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem(BANNER_KEY) === "true"
  );
  const [modalShown, setModalShown] = useState(
    () => localStorage.getItem(MODAL_KEY) === "true"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Also listen for successful install
    const installed = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      navigate("/install");
    }
  }, [deferredPrompt, navigate]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    localStorage.setItem(BANNER_KEY, "true");
  }, []);

  const markModalShown = useCallback(() => {
    setModalShown(true);
    localStorage.setItem(MODAL_KEY, "true");
  }, []);

  return {
    isInstalled,
    canPromptNatively: !!deferredPrompt,
    triggerInstall,
    bannerDismissed,
    dismissBanner,
    modalShown,
    markModalShown,
  };
}
