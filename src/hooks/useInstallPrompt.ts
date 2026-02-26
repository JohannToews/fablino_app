import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

    const installed = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const isSamsungBrowser =
    typeof navigator !== "undefined" && /samsungbrowser/i.test(navigator.userAgent);
  const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      toast("Tippe auf das Teilen-Symbol und dann auf 'Zum Home-Bildschirm'", { duration: 7000 });
    } else if (isSamsungBrowser) {
      toast("Samsung Browser: Menü (☰) → 'Seite hinzufügen zu' → 'Startbildschirm'", {
        duration: 8000,
      });
    } else if (isFirefox) {
      toast("Firefox: Menü (⋮) → 'Zum Startbildschirm hinzufügen'", { duration: 8000 });
    } else if (isAndroid) {
      toast("Suche im Menü nach 'Zum Startbildschirm hinzufügen' (nicht immer 'App installieren').", {
        duration: 8000,
      });
    } else {
      toast("Öffne das Browser-Menü und füge die Seite zum Startbildschirm hinzu.", {
        duration: 7000,
      });
    }
  }, [deferredPrompt, isIOS, isAndroid, isSamsungBrowser, isFirefox]);

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
