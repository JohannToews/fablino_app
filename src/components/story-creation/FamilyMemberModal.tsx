import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterSelectionTranslations, FamilyMember } from "./types";

interface FamilyMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, useDefault: boolean) => void;
  memberType: FamilyMember;
  defaultLabel: string;
  translations: CharacterSelectionTranslations;
}

const FamilyMemberModal = ({
  open,
  onClose,
  onSave,
  memberType,
  defaultLabel,
  translations,
}: FamilyMemberModalProps) => {
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUseCustomName(false);
      setCustomName("");
    }
  }, [open]);

  useEffect(() => {
    if (useCustomName) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [useCustomName]);

  const handleInputFocus = () => {
    // Scroll the modal into view when keyboard appears
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleSaveDefault = () => {
    onSave(defaultLabel, true);
    onClose();
  };

  const handleSaveCustom = () => {
    if (customName.trim()) {
      onSave(customName.trim(), false);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customName.trim()) {
      handleSaveCustom();
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
            {defaultLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!useCustomName ? (
            <>
              {/* Option 1: Use default name */}
              <Button
                onClick={handleSaveDefault}
                className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-baloo text-base md:text-lg"
              >
                {translations.useDefaultName} "{defaultLabel}" {translations.save.toLowerCase()}
              </Button>

              {/* Option 2: Enter custom name */}
              <Button
                variant="outline"
                onClick={() => setUseCustomName(true)}
                className="w-full h-14 rounded-xl border-2 border-dashed text-sm md:text-base"
              >
                ✏️ {translations.enterCustomName}
              </Button>

              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full h-10 text-muted-foreground"
              >
                {translations.cancel}
              </Button>
            </>
          ) : (
            <>
              {/* Custom name input */}
              <Input
                ref={inputRef}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder={`${translations.nameModalTitle} ${defaultLabel}?`}
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-orange-400"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setUseCustomName(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  {translations.back}
                </Button>
                <Button
                  onClick={handleSaveCustom}
                  disabled={!customName.trim()}
                  className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-baloo"
                >
                  {translations.save}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyMemberModal;
