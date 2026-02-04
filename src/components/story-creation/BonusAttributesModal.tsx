import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpecialAttribute, CharacterSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";

interface AttributeOption {
  id: SpecialAttribute;
  emoji: string;
  labelKey: keyof CharacterSelectionTranslations;
}

const attributeOptions: AttributeOption[] = [
  { id: "superpowers", emoji: "🦸", labelKey: "superpowers" },
  { id: "magic", emoji: "✨", labelKey: "magic" },
  { id: "heroes_villains", emoji: "🎭", labelKey: "heroesVillains" },
  { id: "transformations", emoji: "🔮", labelKey: "transformations" },
  { id: "talents", emoji: "🎯", labelKey: "talents" },
  { id: "normal", emoji: "❌", labelKey: "normal" },
];

interface BonusAttributesModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (attributes: SpecialAttribute[]) => void;
  translations: CharacterSelectionTranslations;
}

const BonusAttributesModal = ({
  open,
  onClose,
  onContinue,
  translations,
}: BonusAttributesModalProps) => {
  const [selected, setSelected] = useState<SpecialAttribute[]>([]);

  const toggleAttribute = (attr: SpecialAttribute) => {
    if (attr === "normal") {
      // "Normal" clears other selections
      setSelected(["normal"]);
    } else {
      setSelected((prev) => {
        // Remove "normal" if selecting something else
        const filtered = prev.filter((a) => a !== "normal");
        if (filtered.includes(attr)) {
          return filtered.filter((a) => a !== attr);
        }
        return [...filtered, attr];
      });
    }
  };

  const handleContinue = () => {
    onContinue(selected);
    onClose();
  };

  const handleSkip = () => {
    onContinue([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[90vw] max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-baloo text-center px-4">
            {translations.bonusQuestion}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Attribute Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attributeOptions.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleAttribute(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl",
                    "border-2 transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium text-center">
                    {translations[option.labelKey]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 h-11 text-muted-foreground"
            >
              {translations.skip}
            </Button>
            <Button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className="flex-1 h-11 rounded-xl btn-primary-kid"
            >
              {translations.continue}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BonusAttributesModal;
