import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectedCharacter, CharacterSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";

const villainButtonLabels: Record<string, { without: string; with: string }> = {
  de: { without: "Ohne Bösewicht", with: "Mit Bösewicht 😈" },
  fr: { without: "Sans méchant", with: "Avec un méchant 😈" },
  en: { without: "Without villain", with: "With a villain 😈" },
  es: { without: "Sin villano", with: "Con un villano 😈" },
  nl: { without: "Zonder schurk", with: "Met een schurk 😈" },
  it: { without: "Senza cattivo", with: "Con un cattivo 😈" },
  bs: { without: "Bez zlikovca", with: "Sa zlikovcem 😈" },
  tr: { without: "Kötü olmadan", with: "Bir kötü ile 😈" },
  bg: { without: "Без злодей", with: "С злодей 😈" },
  ro: { without: "Fără răufăcător", with: "Cu un răufăcător 😈" },
  pl: { without: "Bez złoczyńcy", with: "Ze złoczyńcą 😈" },
  lt: { without: "Be piktadario", with: "Su piktadariu 😈" },
  hu: { without: "Gonosz nélkül", with: "Gonosszal 😈" },
  ca: { without: "Sense malvat", with: "Amb un malvat 😈" },
  sl: { without: "Brez zlikovca", with: "Z zlikovcem 😈" },
  uk: { without: "Без лиходія", with: "З лиходієм 😈" },
  ru: { without: "Без злодея", with: "Со злодеем 😈" },
  pt: { without: "Sem vilão", with: "Com um vilão 😈" },
  sk: { without: "Bez zloducha", with: "So zloduchom 😈" },
};

interface SelectionSummaryProps {
  characters: SelectedCharacter[];
  onRemove: (id: string) => void;
  onContinue: () => void;
  onContinueWithVillain?: () => void;
  translations: CharacterSelectionTranslations;
  uiLanguage?: string;
  className?: string;
}

const SelectionSummary = ({
  characters,
  onRemove,
  onContinue,
  onContinueWithVillain,
  translations,
  uiLanguage = "de",
  className,
}: SelectionSummaryProps) => {
  if (characters.length === 0) return null;

  const vLabels = villainButtonLabels[uiLanguage] || villainButtonLabels.de;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-md border-t-2 border-border",
        "p-4 pb-safe animate-slide-up",
        className
      )}
    >
      <div className="container max-w-lg mx-auto space-y-3">
        {/* Label */}
        <p className="text-sm font-bold text-foreground">
          {translations.yourCharacters}
        </p>

        {/* Character Bubbles */}
        <div className="flex flex-wrap gap-2">
          {characters.map((char) => (
            <div
              key={char.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-200"
            >
              <span className="text-sm font-medium text-foreground">
                {char.name || char.label}
              </span>
              <button
                onClick={() => onRemove(char.id)}
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                aria-label={`Remove ${char.name || char.label}`}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Buttons */}
        {onContinueWithVillain ? (
          <div className="flex gap-2">
            <button
              onClick={onContinue}
              className="flex-1 min-h-[48px] rounded-xl text-sm font-semibold border-2 border-[#E8863A]/30 bg-white text-[#2D1810] hover:bg-orange-50 transition-colors shadow-sm active:scale-[0.98]"
            >
              {vLabels.without} →
            </button>
            <button
              onClick={onContinueWithVillain}
              data-premium-button="primary"
              className="flex-1 min-h-[48px] rounded-xl text-sm font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors shadow-lg active:scale-[0.98]"
            >
              {vLabels.with} →
            </button>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            className="w-full h-12 text-base font-baloo rounded-xl btn-primary-kid"
          >
            {translations.continue}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SelectionSummary;
