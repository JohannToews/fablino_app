import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterSelectionTranslations } from "./types";

interface NameInputModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  characterLabel: string;
  translations: CharacterSelectionTranslations;
  existingName?: string;
}

const NameInputModal = ({
  open,
  onClose,
  onSave,
  characterLabel,
  translations,
  existingName = "",
}: NameInputModalProps) => {
  const [name, setName] = useState(existingName);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setName(existingName);
      // Auto-focus after a small delay for animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open, existingName]);

  const handleInputFocus = () => {
    // Scroll the modal into view when keyboard appears
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Also ensure the input itself is visible
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        ref={contentRef}
        className="w-[85vw] max-w-[400px] rounded-2xl sm:top-[50%] sm:translate-y-[-50%] max-sm:top-[10%] max-sm:translate-y-0 landscape:top-[5%] landscape:translate-y-0 landscape:max-h-[85vh] landscape:overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-baloo text-center">
            {translations.nameModalTitle} {characterLabel}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="Name..."
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-orange-400"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
            >
              {translations.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-baloo"
            >
              {translations.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NameInputModal;
