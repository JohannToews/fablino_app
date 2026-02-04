import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectedCharacter, CharacterSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";

interface SelectionSummaryProps {
  characters: SelectedCharacter[];
  onRemove: (id: string) => void;
  onContinue: () => void;
  translations: CharacterSelectionTranslations;
  className?: string;
}

const SelectionSummary = ({
  characters,
  onRemove,
  onContinue,
  translations,
  className,
}: SelectionSummaryProps) => {
  if (characters.length === 0) return null;

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
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20"
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

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          className="w-full h-12 text-base font-baloo rounded-xl btn-primary-kid"
        >
          {translations.continue}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default SelectionSummary;
