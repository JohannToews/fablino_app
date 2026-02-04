import { useState, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CharacterTile from "./CharacterTile";
import NameInputModal from "./NameInputModal";
import FamilyMemberModal from "./FamilyMemberModal";
import SiblingInputModal from "./SiblingInputModal";
import SelectionSummary from "./SelectionSummary";
import BonusAttributesModal from "./BonusAttributesModal";
import {
  CharacterType,
  FamilyMember,
  SiblingGender,
  SelectedCharacter,
  SpecialAttribute,
  CharacterSelectionTranslations,
} from "./types";

// Import images
import heroKidImg from "@/assets/characters/hero-kid.jpg";
import familyImg from "@/assets/characters/family.jpg";
import siblingsImg from "@/assets/characters/siblings.jpg";
import boysFriendsImg from "@/assets/characters/boys-friends.jpg";
import famousCharactersImg from "@/assets/characters/famous-characters.jpg";
import surpriseBoxImg from "@/assets/characters/surprise-box.jpg";
import momImg from "@/assets/characters/mom.jpg";
import dadImg from "@/assets/characters/dad.jpg";
import grandmaImg from "@/assets/characters/grandma.jpg";
import grandpaImg from "@/assets/characters/grandpa.jpg";

interface CharacterSelectionScreenProps {
  translations: CharacterSelectionTranslations;
  onComplete: (characters: SelectedCharacter[], attributes: SpecialAttribute[]) => void;
  onBack: () => void;
}

type ViewState = "main" | "family";

const CharacterSelectionScreen = ({
  translations,
  onComplete,
  onBack,
}: CharacterSelectionScreenProps) => {
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  
  // Modal states
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameModalTarget, setNameModalTarget] = useState<{
    type: CharacterType;
    label: string;
  } | null>(null);
  
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyModalTarget, setFamilyModalTarget] = useState<{
    type: FamilyMember;
    label: string;
  } | null>(null);
  
  const [siblingModalOpen, setSiblingModalOpen] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);

  const mainTiles = [
    { type: "me" as CharacterType, image: heroKidImg, label: translations.me },
    { type: "family" as CharacterType, image: familyImg, label: translations.family },
    { type: "siblings" as CharacterType, image: siblingsImg, label: translations.siblings },
    { type: "friends" as CharacterType, image: boysFriendsImg, label: translations.friends },
    { type: "famous" as CharacterType, image: famousCharactersImg, label: translations.famous },
    { type: "surprise" as CharacterType, image: surpriseBoxImg, label: translations.surprise, badge: "⭐" },
  ];

  const familyTiles = [
    { type: "mama" as FamilyMember, image: momImg, label: translations.mama },
    { type: "papa" as FamilyMember, image: dadImg, label: translations.papa },
    { type: "oma" as FamilyMember, image: grandmaImg, label: translations.oma },
    { type: "opa" as FamilyMember, image: grandpaImg, label: translations.opa },
  ];

  const openNameModal = (type: CharacterType, label: string) => {
    setNameModalTarget({ type, label });
    setNameModalOpen(true);
  };

  const openFamilyModal = (type: FamilyMember, label: string) => {
    setFamilyModalTarget({ type, label });
    setFamilyModalOpen(true);
  };

  const handleMainTileClick = (type: CharacterType) => {
    switch (type) {
      case "me":
        // Direct selection - name comes from kid profile
        const meCharacter: SelectedCharacter = {
          id: `me-${Date.now()}`,
          type: "me",
          name: translations.me, // Will be replaced with actual kid name from profile
          label: translations.me,
        };
        setSelectedCharacters((prev) => [...prev, meCharacter]);
        toast.success(`✓ ${translations.me} ${translations.nameSaved}`);
        break;
      case "family":
        setViewState("family");
        break;
      case "siblings":
        setSiblingModalOpen(true);
        break;
      case "friends":
        openNameModal("friends", translations.friends);
        break;
      case "famous":
        openNameModal("famous", translations.famous);
        break;
      case "surprise":
        handleSurprise();
        break;
    }
  };

  const handleFamilyTileClick = (type: FamilyMember) => {
    const labels: Record<FamilyMember, string> = {
      mama: translations.mama,
      papa: translations.papa,
      oma: translations.oma,
      opa: translations.opa,
      other: translations.other,
    };
    
    // For mama, papa, oma, opa - direct selection with 1 click
    if (type !== "other") {
      const familyCharacter: SelectedCharacter = {
        id: `${type}-${Date.now()}`,
        type: type,
        name: labels[type],
        label: labels[type],
      };
      setSelectedCharacters((prev) => [...prev, familyCharacter]);
      toast.success(`✓ ${labels[type]} ${translations.nameSaved}`);
      setViewState("main");
    } else {
      // "Other" still opens name modal
      openFamilyModal(type, labels[type]);
    }
  };

  const handleSaveName = useCallback((name: string) => {
    if (!nameModalTarget) return;

    const newCharacter: SelectedCharacter = {
      id: `${nameModalTarget.type}-${Date.now()}`,
      type: nameModalTarget.type,
      name,
      label: nameModalTarget.label,
    };

    setSelectedCharacters((prev) => [...prev, newCharacter]);
    toast.success(`✓ ${name} ${translations.nameSaved}`);
  }, [nameModalTarget, translations.nameSaved]);

  const handleSaveFamilyMember = useCallback((name: string, useDefault: boolean) => {
    if (!familyModalTarget) return;

    const newCharacter: SelectedCharacter = {
      id: `${familyModalTarget.type}-${Date.now()}`,
      type: familyModalTarget.type,
      name,
      label: useDefault ? familyModalTarget.label : name,
    };

    setSelectedCharacters((prev) => [...prev, newCharacter]);
    toast.success(`✓ ${name} ${translations.nameSaved}`);
    
    // Return to main view
    setViewState("main");
  }, [familyModalTarget, translations.nameSaved]);

  const handleSaveSibling = useCallback((name: string, gender: SiblingGender, age: number) => {
    const genderLabel = gender === "brother" ? translations.brother : translations.sister;
    
    const newCharacter: SelectedCharacter = {
      id: `sibling-${Date.now()}`,
      type: gender,
      name,
      label: `${name} (${genderLabel}, ${age})`,
      age,
      gender,
    };

    setSelectedCharacters((prev) => [...prev, newCharacter]);
    toast.success(`✓ ${name} ${translations.nameSaved}`);
  }, [translations.brother, translations.sister, translations.nameSaved]);

  const handleRemoveCharacter = (id: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSurprise = () => {
    const surpriseCharacter: SelectedCharacter = {
      id: `surprise-${Date.now()}`,
      type: "surprise",
      name: "???",
      label: translations.surprise,
    };
    setSelectedCharacters([surpriseCharacter]);
    setBonusModalOpen(true);
  };

  const handleContinue = () => {
    setBonusModalOpen(true);
  };

  const handleBonusComplete = (attributes: SpecialAttribute[]) => {
    onComplete(selectedCharacters, attributes);
  };

  const isSelected = (type: CharacterType | FamilyMember) => {
    return selectedCharacters.some((c) => c.type === type);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={viewState === "main" ? onBack : () => setViewState("main")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base md:text-lg font-baloo font-bold flex-1">
            {translations.header}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-lg mx-auto px-4 py-6">
        {viewState === "main" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mainTiles.map((tile) => (
              <CharacterTile
                key={tile.type}
                image={tile.image}
                label={tile.label}
                onClick={() => handleMainTileClick(tile.type)}
                selected={isSelected(tile.type)}
                badge={tile.badge}
              />
            ))}
          </div>
        )}

        {viewState === "family" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {familyTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleFamilyTileClick(tile.type)}
                  selected={isSelected(tile.type)}
                />
              ))}
            </div>
            
            {/* Add More Button */}
            <Button
              variant="outline"
              className="w-full h-14 rounded-xl border-dashed border-2"
              onClick={() => openFamilyModal("other", translations.other)}
            >
              <Plus className="w-5 h-5 mr-2" />
              {translations.other}
            </Button>
          </div>
        )}
      </div>

      {/* Selection Summary (Bottom Sheet) */}
      <SelectionSummary
        characters={selectedCharacters}
        onRemove={handleRemoveCharacter}
        onContinue={handleContinue}
        translations={translations}
      />

      {/* Name Input Modal (for me, friends, famous) */}
      <NameInputModal
        open={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        onSave={handleSaveName}
        characterLabel={nameModalTarget?.label || ""}
        translations={translations}
      />

      {/* Family Member Modal (for mama, papa, oma, opa, other) */}
      <FamilyMemberModal
        open={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        onSave={handleSaveFamilyMember}
        memberType={familyModalTarget?.type || "other"}
        defaultLabel={familyModalTarget?.label || ""}
        translations={translations}
      />

      {/* Sibling Input Modal */}
      <SiblingInputModal
        open={siblingModalOpen}
        onClose={() => setSiblingModalOpen(false)}
        onSave={handleSaveSibling}
        translations={translations}
      />

      {/* Bonus Attributes Modal */}
      <BonusAttributesModal
        open={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        onContinue={handleBonusComplete}
        translations={translations}
      />
    </div>
  );
};

export default CharacterSelectionScreen;
