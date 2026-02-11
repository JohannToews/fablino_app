import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedCharacter {
  id: string;
  name: string;
  role: string;
  age: number | null;
  relation: string | null;
  description: string | null;
}

interface RelationOption {
  value: string;
  label: string;
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
  // New props for inline add
  kidProfileId?: string;
  category?: "family" | "friends";
  relationOptions?: RelationOption[];
  addNewLabel?: string;
  nameLabel?: string;
  relationLabel?: string;
  ageLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  onCharacterAdded?: () => void;
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
  kidProfileId,
  category,
  relationOptions,
  addNewLabel,
  nameLabel,
  relationLabel,
  ageLabel,
  saveLabel,
  cancelLabel,
  onCharacterAdded,
}: SavedCharactersModalProps) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAge, setNewAge] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setShowAddForm(false);
      setNewName("");
      setNewRelation("");
      setNewAge("");
    }
  }, [open, selectedIds]);

  // Auto-show add form if no characters exist
  const showFormByDefault = characters.length === 0 && kidProfileId;

  const toggleCharacter = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDone = () => {
    onConfirm(localSelected);
    onClose();
  };

  const handleAddCharacter = async () => {
    if (!newName.trim() || !kidProfileId) return;

    setIsSaving(true);
    try {
      const role = category === "family" ? "family" : "friend";
      const { data, error } = await supabase
        .from("kid_characters")
        .insert({
          kid_profile_id: kidProfileId,
          name: newName.trim(),
          role,
          relation: category === "family" ? (newRelation || null) : null,
          age: newAge ? parseInt(newAge) : null,
          is_active: true,
          sort_order: characters.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-select the newly added character
      if (data) {
        setLocalSelected((prev) => [...prev, data.id]);
      }

      toast.success(`✓ ${newName.trim()}`);
      setNewName("");
      setNewRelation("");
      setNewAge("");
      setShowAddForm(false);
      onCharacterAdded?.();
    } catch (err) {
      console.error("[SavedCharactersModal] Error adding character:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const canAdd = kidProfileId && category;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[85vw] max-w-[420px] rounded-2xl max-h-[70vh] flex flex-col p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-baloo text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-1">
          {/* Existing characters list */}
          {characters.length > 0 ? (
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
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
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
          ) : !showFormByDefault ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              {emptyMessage}
            </p>
          ) : null}

          {/* Add new character section */}
          {canAdd && (
            <div className="pt-2">
              {!showAddForm && !showFormByDefault ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 rounded-xl border-dashed border-2 border-[#E8863A]/40 text-[#E8863A] hover:bg-[#E8863A]/5"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {addNewLabel || "Neu hinzufügen"}
                </Button>
              ) : (showAddForm || showFormByDefault) ? (
                <div className="bg-orange-50/60 rounded-xl p-3 space-y-2.5 border border-orange-100">
                  {/* Name */}
                  <Input
                    placeholder={nameLabel || "Name"}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 rounded-lg text-sm"
                    autoFocus
                  />

                  {/* Relation dropdown (only for family) */}
                  {category === "family" && relationOptions && relationOptions.length > 0 && (
                    <Select value={newRelation} onValueChange={setNewRelation}>
                      <SelectTrigger className="h-9 rounded-lg text-sm">
                        <SelectValue placeholder={relationLabel || "Beziehung"} />
                      </SelectTrigger>
                      <SelectContent>
                        {relationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Age (optional) */}
                  <Input
                    type="number"
                    placeholder={ageLabel || "Alter (optional)"}
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="h-9 rounded-lg text-sm"
                    min={0}
                    max={99}
                  />

                  {/* Save / Cancel buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-9 rounded-lg text-sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewName("");
                        setNewRelation("");
                        setNewAge("");
                      }}
                    >
                      {cancelLabel || "Abbrechen"}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-9 rounded-lg text-sm bg-[#E8863A] hover:bg-[#D4752E] text-white"
                      onClick={handleAddCharacter}
                      disabled={!newName.trim() || isSaving}
                    >
                      {isSaving ? "..." : (saveLabel || "Speichern")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <Button
          onClick={handleDone}
          className="w-full h-11 rounded-2xl bg-[#E8863A] hover:bg-[#D4752E] text-white font-baloo text-base mt-1"
        >
          <Check className="w-4 h-4 mr-2" />
          {doneLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SavedCharactersModal;
