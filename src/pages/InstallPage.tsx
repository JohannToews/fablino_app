import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Share, Download, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const installLabels = {
  de: {
    title: "App installieren",
    subtitle: "Für das beste Erlebnis",
    alreadyInstalled: "App ist bereits installiert!",
    openApp: "App öffnen",
    installButton: "Jetzt installieren",
    iosInstructions: "Auf iOS-Geräten",
    iosStep1: "Tippe auf das Teilen-Symbol",
    iosStep2: 'Wähle "Zum Home-Bildschirm"',
    androidInstructions: "Auf Android-Geräten",
    androidStep1: "Tippe auf die drei Punkte oben rechts",
    androidStep2: 'Wähle "App installieren" oder "Zum Startbildschirm"',
    benefits: [
      "Schnellerer Zugriff",
      "Funktioniert auch offline",
      "Wie eine echte App",
      "Keine App-Store nötig",
    ],
    back: "Zurück",
  },
  fr: {
    title: "Installer l'application",
    subtitle: "Pour la meilleure expérience",
    alreadyInstalled: "L'application est déjà installée!",
    openApp: "Ouvrir l'app",
    installButton: "Installer maintenant",
    iosInstructions: "Sur les appareils iOS",
    iosStep1: "Appuyez sur le bouton de partage",
    iosStep2: '"Sur l\'écran d\'accueil"',
    androidInstructions: "Sur les appareils Android",
    androidStep1: "Appuyez sur les trois points en haut",
    androidStep2: '"Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
    benefits: [
      "Accès plus rapide",
      "Fonctionne hors ligne",
      "Comme une vraie app",
      "Pas d'App Store nécessaire",
    ],
    back: "Retour",
  },
  en: {
    title: "Install App",
    subtitle: "For the best experience",
    alreadyInstalled: "App is already installed!",
    openApp: "Open App",
    installButton: "Install Now",
    iosInstructions: "On iOS devices",
    iosStep1: "Tap the Share button",
    iosStep2: 'Select "Add to Home Screen"',
    androidInstructions: "On Android devices",
    androidStep1: "Tap the three dots menu",
    androidStep2: 'Select "Install app" or "Add to Home Screen"',
    benefits: [
      "Faster access",
      "Works offline",
      "Like a real app",
      "No App Store needed",
    ],
    back: "Back",
  },
};

const InstallPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage } = useKidProfile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  
  const t = installLabels[kidAppLanguage as keyof typeof installLabels] || installLabels.de;

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-baloo font-bold">{t.title}</h1>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Icon and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-baloo font-bold">{t.title}</h2>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <p className="font-semibold text-primary">
              {t.alreadyInstalled}
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              {t.openApp}
            </Button>
          </div>
        )}

        {/* Install Button (for Android with prompt) */}
        {!isInstalled && deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="lg"
            className="w-full h-14 rounded-2xl text-lg font-baloo bg-primary hover:bg-primary/90"
          >
            <Download className="w-5 h-5 mr-2" />
            {t.installButton}
          </Button>
        )}

        {/* iOS Instructions */}
        {!isInstalled && isIOS && (
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-baloo font-semibold text-lg">{t.iosInstructions}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm pt-1.5">{t.iosStep1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  2
                </div>
                <p className="text-sm pt-1.5">{t.iosStep2}</p>
              </div>
            </div>
          </div>
        )}

        {/* Android Manual Instructions (if prompt not available) */}
        {!isInstalled && isAndroid && !deferredPrompt && (
          <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <h3 className="font-baloo font-semibold text-lg">{t.androidInstructions}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  1
                </div>
                <p className="text-sm pt-1.5">{t.androidStep1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  2
                </div>
                <p className="text-sm pt-1.5">{t.androidStep2}</p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        {!isInstalled && (
          <div className="space-y-3">
            {t.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPage;
