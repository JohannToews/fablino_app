import { useState } from "react";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";
import FablinoPageHeader from "@/components/FablinoPageHeader";

// Direction → emoji mapping
const DIRECTION_ICONS: Record<string, string> = {
  brave: "🦁",
  clever: "🧠",
  surprising: "🌟",
};

export interface BranchOption {
  option_id: string; // "A" | "B" | "C"
  title: string;
  preview: string;
  direction: string; // "brave" | "clever" | "surprising"
  image_hint?: string;
}

interface BranchDecisionTranslations {
  header: string;
  confirmButton: string;
  loadingText: string;
}

const translations: Record<string, BranchDecisionTranslations> = {
  de: {
    header: "Wie soll es weitergehen?",
    confirmButton: "Das will ich! 🎉",
    loadingText: "Fablino schreibt dein Abenteuer weiter... 🦊✨",
  },
  fr: {
    header: "Comment l'histoire continue-t-elle ?",
    confirmButton: "C'est ce que je veux ! 🎉",
    loadingText: "Fablino écrit la suite de ton aventure... 🦊✨",
  },
  en: {
    header: "What happens next?",
    confirmButton: "I want this! 🎉",
    loadingText: "Fablino is writing your adventure... 🦊✨",
  },
  es: {
    header: "¿Cómo sigue la historia?",
    confirmButton: "¡Eso quiero! 🎉",
    loadingText: "Fablino escribe tu aventura... 🦊✨",
  },
  nl: {
    header: "Hoe gaat het verder?",
    confirmButton: "Dat wil ik! 🎉",
    loadingText: "Fablino schrijft je avontuur verder... 🦊✨",
  },
  it: {
    header: "Come continua la storia?",
    confirmButton: "Voglio questo! 🎉",
    loadingText: "Fablino scrive la tua avventura... 🦊✨",
  },
  bs: {
    header: "Kako priča nastavlja?",
    confirmButton: "To želim! 🎉",
    loadingText: "Fablino piše tvoju avanturu... 🦊✨",
  },
};

interface BranchDecisionScreenProps {
  options: BranchOption[];
  onSelect: (option: BranchOption) => void;
  isLoading?: boolean;
}

const BranchDecisionScreen = ({
  options,
  onSelect,
  isLoading = false,
}: BranchDecisionScreenProps) => {
  const { kidAppLanguage } = useKidProfile();
  const t = translations[kidAppLanguage] || translations.de;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleConfirm = () => {
    const chosen = options.find((o) => o.option_id === selectedOption);
    if (chosen) {
      onSelect(chosen);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6">
        <div className="animate-bounce text-5xl">🦊</div>
        <p className="text-base font-medium text-[#92400E] text-center animate-pulse">
          {t.loadingText}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-[#FFF8F0] via-[#FEF1E1] to-[#FDE8D0] rounded-2xl p-4 space-y-4">
      {/* Header */}
      <FablinoPageHeader
        mascotImage="/mascot/6_Onboarding.png"
        message={t.header}
        mascotSize="sm"
      />

      {/* Option Cards */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.option_id;
          const icon = DIRECTION_ICONS[option.direction] || "✨";

          return (
            <button
              key={option.option_id}
              onClick={() => setSelectedOption(option.option_id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all duration-200",
                "bg-white shadow-sm",
                isSelected
                  ? "border-2 border-[#E8863A] shadow-md scale-[1.02]"
                  : "border border-orange-100 hover:border-orange-200 hover:shadow"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5 shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2D1810] leading-snug">
                    {option.title}
                  </p>
                  <p className="text-xs text-[#2D1810]/60 mt-1 leading-relaxed">
                    {option.preview}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Button – only visible when an option is selected */}
      {selectedOption && (
        <button
          onClick={handleConfirm}
          data-premium-button="primary"
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-all duration-200 animate-fade-in shadow-md"
        >
          {t.confirmButton}
        </button>
      )}
    </div>
  );
};

export default BranchDecisionScreen;
