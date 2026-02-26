import { useState } from "react";

// Dynamically import the PWA register hook — the virtual module is provided by vite-plugin-pwa at build time
// @ts-ignore — virtual module resolved by vite-plugin-pwa
import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-3 bg-primary text-white px-4 py-2 text-sm font-semibold shadow-lg">
      <span>🔄 Neue Version verfügbar!</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1 rounded-lg bg-white text-primary font-bold text-xs"
      >
        Jetzt aktualisieren
      </button>
      <button onClick={() => setDismissed(true)} className="text-white/70 text-xs ml-1">
        ✕
      </button>
    </div>
  );
}
