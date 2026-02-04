import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterSelectionTranslations, SiblingGender } from "./types";
import { cn } from "@/lib/utils";

// Import sibling images
import boyImg from "@/assets/characters/boy.jpg";
import girlImg from "@/assets/characters/girl.jpg";

interface SiblingInputModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, gender: SiblingGender, age: number) => void;
  translations: CharacterSelectionTranslations;
}

type Step = "gender" | "name" | "age";

const SiblingInputModal = ({
  open,
  onClose,
  onSave,
  translations,
}: SiblingInputModalProps) => {
  const [step, setStep] = useState<Step>("gender");
  const [gender, setGender] = useState<SiblingGender | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep("gender");
      setGender(null);
      setName("");
      setAge("");
    }
  }, [open]);

  useEffect(() => {
    if (step === "name" || step === "age") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [step]);

  const handleInputFocus = () => {
    // Scroll the modal into view when keyboard appears
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleGenderSelect = (g: SiblingGender) => {
    setGender(g);
    setStep("name");
  };

  const handleNameContinue = () => {
    if (name.trim()) {
      setStep("age");
    }
  };

  const handleSave = () => {
    if (gender && name.trim() && age !== "") {
      onSave(name.trim(), gender, Number(age));
      onClose();
    }
  };

  const handleBack = () => {
    if (step === "name") {
      setStep("gender");
      setGender(null);
    } else if (step === "age") {
      setStep("name");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "name" && name.trim()) {
        handleNameContinue();
      } else if (step === "age" && age !== "") {
        handleSave();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        ref={contentRef}
        className="w-[85vw] max-w-[420px] rounded-2xl top-[15%] translate-y-0 data-[state=open]:slide-in-from-top-[10%]"
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-baloo text-center">
            {step === "gender" && translations.siblings}
            {step === "name" && `${translations.nameModalTitle} ${gender === "brother" ? translations.brother : translations.sister}?`}
            {step === "age" && `${translations.siblingAge} von ${name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {/* Step 1: Gender Selection */}
          {step === "gender" && (
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={() => handleGenderSelect("brother")}
                className={cn(
                  "flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl",
                  "border-2 border-border transition-all duration-200",
                  "hover:scale-105 hover:border-primary/50 active:scale-95"
                )}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden">
                  <img
                    src={boyImg}
                    alt={translations.brother}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-baloo font-medium text-sm md:text-base">
                  {translations.brother}
                </span>
              </button>

              <button
                onClick={() => handleGenderSelect("sister")}
                className={cn(
                  "flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl",
                  "border-2 border-border transition-all duration-200",
                  "hover:scale-105 hover:border-primary/50 active:scale-95"
                )}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden">
                  <img
                    src={girlImg}
                    alt={translations.sister}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-baloo font-medium text-sm md:text-base">
                  {translations.sister}
                </span>
              </button>
            </div>
          )}

          {/* Step 2: Name Input */}
          {step === "name" && (
            <div className="space-y-4">
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder="Name..."
                enterKeyHint="next"
                autoComplete="off"
                autoCorrect="off"
                className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-primary"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 rounded-xl"
                >
                  {translations.back}
                </Button>
                <Button
                  onClick={handleNameContinue}
                  disabled={!name.trim()}
                  className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-baloo"
                >
                  {translations.continue}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Age Input */}
          {step === "age" && (
            <div className="space-y-4">
              <Input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder={translations.siblingAge}
                enterKeyHint="done"
                autoComplete="off"
                className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-primary"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 rounded-xl"
                >
                  {translations.back}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={age === ""}
                  className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-baloo"
                >
                  {translations.save}
                </Button>
              </div>
            </div>
          )}

          {/* Cancel button for gender step */}
          {step === "gender" && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full mt-4 h-10 text-muted-foreground"
            >
              {translations.cancel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiblingInputModal;
