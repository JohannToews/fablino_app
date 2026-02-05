import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Star } from "lucide-react";
import confetti from "canvas-confetti";
import type { LevelInfo } from "@/hooks/useGamification";

interface LevelUpModalProps {
  level: LevelInfo | null;
  onClose: () => void;
  language?: string;
}

const translations: Record<string, {
  congratulations: string;
  reachedLevel: string;
  newTitle: string;
  keepReading: string;
  continue: string;
}> = {
  de: {
    congratulations: "Herzlichen Glückwunsch!",
    reachedLevel: "Du hast Level {level} erreicht!",
    newTitle: "Dein neuer Titel:",
    keepReading: "Lies weiter, um noch mehr Abenteuer zu erleben!",
    continue: "Weiter"
  },
  fr: {
    congratulations: "Félicitations!",
    reachedLevel: "Tu as atteint le niveau {level}!",
    newTitle: "Ton nouveau titre:",
    keepReading: "Continue à lire pour vivre encore plus d'aventures!",
    continue: "Continuer"
  },
  en: {
    congratulations: "Congratulations!",
    reachedLevel: "You've reached Level {level}!",
    newTitle: "Your new title:",
    keepReading: "Keep reading to experience more adventures!",
    continue: "Continue"
  },
  es: {
    congratulations: "¡Felicitaciones!",
    reachedLevel: "¡Has alcanzado el nivel {level}!",
    newTitle: "Tu nuevo título:",
    keepReading: "¡Sigue leyendo para vivir más aventuras!",
    continue: "Continuar"
  },
  nl: {
    congratulations: "Gefeliciteerd!",
    reachedLevel: "Je hebt level {level} bereikt!",
    newTitle: "Je nieuwe titel:",
    keepReading: "Blijf lezen voor meer avonturen!",
    continue: "Doorgaan"
  },
  bs: {
    congratulations: "Čestitamo!",
    reachedLevel: "Dostigao/la si nivo {level}!",
    newTitle: "Tvoj novi naslov:",
    keepReading: "Nastavi čitati za još avantura!",
    continue: "Nastavi"
  }
};

export const LevelUpModal = ({ level, onClose, language = 'de' }: LevelUpModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language] || translations.de;

  useEffect(() => {
    if (level) {
      setIsOpen(true);
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [level]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!level) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center border-2 border-primary/50 bg-gradient-to-b from-background to-primary/5">
        <div className="py-6 space-y-6">
          {/* Stars animation */}
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-6 w-6 text-accent fill-accent animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
              <span className="text-6xl animate-bounce">{level.icon}</span>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="text-2xl font-baloo font-bold text-primary">
                {t.congratulations}
              </h2>
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
            
            <p className="text-lg text-foreground">
              {t.reachedLevel.replace('{level}', String(level.level))}
            </p>
          </div>

          {/* Level title */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-1">{t.newTitle}</p>
            <p className="text-xl font-baloo font-bold text-primary flex items-center justify-center gap-2">
              <span>{level.icon}</span>
              <span>{level.title}</span>
            </p>
          </div>

          {/* Encouragement */}
          <p className="text-muted-foreground">{t.keepReading}</p>

          {/* Button */}
          <Button 
            onClick={handleClose} 
            className="btn-primary-kid w-full max-w-xs mx-auto"
          >
            {t.continue}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
