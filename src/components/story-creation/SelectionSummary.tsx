import { X } from "lucide-react";
import { SelectedCharacter, CharacterSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";

const villainButtonLabels: Record<string, string> = {
  de: "Mit Bösewicht",
  fr: "Avec un méchant",
  en: "With a villain",
  es: "Con un villano",
  nl: "Met een schurk",
  it: "Con un cattivo",
  bs: "Sa zlikovcem",
  tr: "Bir kötü ile",
  bg: "С злодей",
  ro: "Cu un răufăcător",
  pl: "Ze złoczyńcą",
  lt: "Su piktadariu",
  hu: "Gonosszal",
  ca: "Amb un malvat",
  sl: "Z zlikovcem",
  uk: "З лиходієм",
  ru: "Со злодеем",
  pt: "Com um vilão",
  sk: "So zloduchom",
};

interface SelectionSummaryProps {
  characters: SelectedCharacter[];
  onRemove: (id: string) => void;
  onContinue: () => void;
  onContinueWithVillain?: () => void;
  translations: CharacterSelectionTranslations;
  className?: string;
}

const SelectionSummary = ({
  characters,
  onRemove,
  onContinue,
  onContinueWithVillain,
  translations,
  className,
}: SelectionSummaryProps) => {
  const { kidAppLanguage } = useKidProfile();

  const hasCharacters = characters.length > 0;

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

        {/* Continue Buttons — split if villain option available */}
        <div className="flex gap-2">
          <button
            onClick={onContinue}
            className={cn(
              "min-h-[52px] rounded-2xl text-base font-semibold transition-colors active:scale-[0.98]",
              onContinueWithVillain
                ? "flex-1 border-2 border-[#E8863A]/30 bg-white text-[#2D1810] hover:bg-orange-50 shadow-sm"
                : "w-full bg-[#E8863A] hover:bg-[#D4752E] text-white shadow-lg"
            )}
          >
            {translations.continue} →
          </button>
          {onContinueWithVillain && (
            <button
              onClick={onContinueWithVillain}
              className="flex-1 min-h-[52px] rounded-2xl text-base font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors shadow-lg active:scale-[0.98]"
            >
              😈 {villainButtonLabels[kidAppLanguage] || villainButtonLabels.de} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;
