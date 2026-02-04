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

  useEffect(() => {
    if (open) {
      setName(existingName);
      // Auto-focus after a small delay for animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, existingName]);

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
      <DialogContent className="w-[80vw] max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-baloo text-center">
            {translations.nameModalTitle} {characterLabel}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name..."
            className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-primary"
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
