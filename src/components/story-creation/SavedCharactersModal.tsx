import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";

interface SavedCharacter {
  id: string;
  name: string;
  role: string;
  age: number | null;
  relation: string | null;
  description: string | null;
}

interface SavedCharactersModalProps {
  open: boolean;
  onClose: () => void;
  characters: SavedCharacter[];
  selectedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  title: string;
  emptyMessage: string;
  doneLabel: string;
}

const SavedCharactersModal = ({
  open,
  onClose,
  characters,
  selectedIds,
  onConfirm,
  title,
  emptyMessage,
  doneLabel,
}: SavedCharactersModalProps) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
    }
  }, [open, selectedIds]);

  const toggleCharacter = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDone = () => {
    onConfirm(localSelected);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[85vw] max-w-[400px] rounded-2xl max-h-[60vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-baloo text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
          {characters.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              {emptyMessage}
            </p>
          ) : (
            characters.map((char) => {
              const isChecked = localSelected.includes(char.id);
              const charLabel = [
                char.name,
                char.relation ? `(${char.relation})` : null,
                char.age ? `${char.age} J.` : null,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <label
                  key={char.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCharacter(char.id)}
                    className="border-[#E8863A] data-[state=checked]:bg-[#E8863A] data-[state=checked]:border-[#E8863A]"
                  />
                  <span className="text-sm font-medium">{charLabel}</span>
                </label>
              );
            })
          )}
        </div>

        <Button
          onClick={handleDone}
          className="w-full h-12 rounded-2xl bg-[#E8863A] hover:bg-[#D4752E] text-white font-baloo text-base mt-2"
        >
          <Check className="w-4 h-4 mr-2" />
          {doneLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SavedCharactersModal;
