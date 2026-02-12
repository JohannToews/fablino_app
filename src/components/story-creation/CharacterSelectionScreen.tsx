import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CharacterTile from "./CharacterTile";
import NameInputModal from "./NameInputModal";
import FamilyMemberModal from "./FamilyMemberModal";
import SavedCharactersModal from "./SavedCharactersModal";
import SelectionSummary from "./SelectionSummary";
import {
  CharacterType,
  FamilyMember,
  SelectedCharacter,
  CharacterSelectionTranslations,
} from "./types";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { useTranslations } from "@/lib/translations";
import { useKidProfile } from "@/hooks/useKidProfile";

// Character images
import heroKidImg from "@/assets/people/me.png";
import familyImg from "@/assets/people/family.png";
import boysFriendsImg from "@/assets/people/friends.png";
import surpriseBoxImg from "@/assets/people/surprise.png";

// Family sub-tile images
import momImg from "@/assets/characters/mom.jpg";
import dadImg from "@/assets/characters/dad.jpg";
import grandmaImg from "@/assets/characters/grandma.jpg";
import grandpaImg from "@/assets/characters/grandpa.jpg";

interface KidCharacterDB {
  id: string;
  name: string;
  role: string;
  age: number | null;
  relation: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  kid_profile_id: string;
}

interface CharacterSelectionScreenProps {
  translations: CharacterSelectionTranslations;
  kidProfileId?: string;
  kidName?: string;
  kidAge?: number | null;
  onComplete: (characters: SelectedCharacter[], surpriseCharacters?: boolean) => void;
  onBack: () => void;
  fablinoMessage?: string;
}

type ViewState = "main" | "family";

const CharacterSelectionScreen = ({
  translations,
  kidProfileId,
  kidName,
  kidAge,
  onComplete,
  onBack,
  fablinoMessage,
}: CharacterSelectionScreenProps) => {
  const { kidAppLanguage } = useKidProfile();
  const t = useTranslations(kidAppLanguage);
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [surpriseCharacters, setSurpriseCharacters] = useState(false);

  // Modal state for saved characters (family/friends)
  const [savedModalCategory, setSavedModalCategory] = useState<"family" | "friends" | null>(null);
  
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

  // Saved kid_characters from DB
  const [savedCharacters, setSavedCharacters] = useState<KidCharacterDB[]>([]);
  const [charLoadKey, setCharLoadKey] = useState(0);

  const effectiveKidProfileId = kidProfileId ?? sessionStorage.getItem('selected_kid_profile_id') ?? undefined;

  // Load saved characters from DB
  useEffect(() => {
    if (!effectiveKidProfileId) return;

    const loadSavedCharacters = async () => {
      const { data, error } = await supabase
        .from('kid_characters')
        .select('*')
        .eq('kid_profile_id', effectiveKidProfileId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[CharacterSelection] Error loading characters:', error);
        return;
      }
      setSavedCharacters((data || []) as KidCharacterDB[]);
    };

    loadSavedCharacters();
  }, [effectiveKidProfileId, charLoadKey]);

  // Relation options for inline add form
  const familyRelationOptions = [
    { value: 'Mama', label: t.relationMama },
    { value: 'Papa', label: t.relationPapa },
    { value: 'Bruder', label: t.relationBrother },
    { value: 'Schwester', label: t.relationSister },
    { value: 'Oma', label: t.relationGrandma },
    { value: 'Opa', label: t.relationGrandpa },
    { value: 'Cousin', label: t.relationCousin },
    { value: 'Cousine', label: t.relationCousine },
    { value: 'Tante', label: t.relationAunt },
    { value: 'Onkel', label: t.relationUncle },
  ];

  // Filter saved characters by role
  const familyChars = savedCharacters.filter(c => c.role === 'family');
  const friendChars = savedCharacters.filter(c => c.role === 'friend');

  // "Ich" tile shows actual kid name + age
  const meLabel = kidName
    ? (kidAge ? `${kidName} (${kidAge})` : kidName)
    : translations.me;

  const mainTiles = [
    { type: "me" as CharacterType, image: heroKidImg, label: meLabel, badge: "\u2B50" },
    { type: "family" as CharacterType, image: familyImg, label: translations.family },
    { type: "friends" as CharacterType, image: boysFriendsImg, label: translations.friends },
    { type: "surprise" as CharacterType, image: surpriseBoxImg, label: translations.surprise, badge: "\u2B50" },
  ];

  const familyTiles = [
    { type: "mama" as FamilyMember, image: momImg, label: translations.mama },
    { type: "papa" as FamilyMember, image: dadImg, label: translations.papa },
    { type: "oma" as FamilyMember, image: grandmaImg, label: translations.oma },
    { type: "opa" as FamilyMember, image: grandpaImg, label: translations.opa },
  ];

  const openFamilyModal = (type: FamilyMember, label: string) => {
    setFamilyModalTarget({ type, label });
    setFamilyModalOpen(true);
  };

  // Get IDs of currently selected saved characters for a category
  const getSelectedSavedIds = (category: "family" | "friends"): string[] => {
    const chars = category === "family" ? familyChars : friendChars;
    return chars
      .filter(c => selectedCharacters.some(sc => sc.id === `saved-${c.id}`))
      .map(c => c.id);
  };

  // Handle modal confirm: sync selected saved characters
  const handleSavedModalConfirm = (category: "family" | "friends", confirmedIds: string[]) => {
    const chars = category === "family" ? familyChars : friendChars;
    const typeMap: Record<string, CharacterType> = {
      family: "family",
      friend: "friends",
      known_figure: "famous",
    };

    // Remove all saved chars of this category first
    const prefixedIds = chars.map(c => `saved-${c.id}`);
    let updated = selectedCharacters.filter(sc => !prefixedIds.includes(sc.id));

    // Add confirmed ones
    for (const id of confirmedIds) {
      const char = chars.find(c => c.id === id);
      if (!char) continue;
      const charLabel = [
        char.name,
        char.relation ? char.relation : null,
        char.age ? `${char.age} J.` : null,
      ].filter(Boolean).join(', ');

      updated.push({
        id: `saved-${char.id}`,
        type: typeMap[char.role] || "friends",
        name: char.name,
        label: charLabel,
        age: char.age || undefined,
        role: char.role,
        relation: char.relation || undefined,
        description: char.description || undefined,
      });
    }

    setSelectedCharacters(updated);
    if (confirmedIds.length > 0) {
      toast.success(`✓ ${confirmedIds.length} ${translations.nameSaved}`);
    }
  };

  const handleMainTileClick = (type: CharacterType) => {
    if (type !== "surprise" && surpriseCharacters) {
      setSurpriseCharacters(false);
    }
    
    switch (type) {
      case "me": {
        const meExists = selectedCharacters.some(c => c.type === "me");
        if (meExists) {
          setSelectedCharacters(prev => prev.filter(c => c.type !== "me"));
        } else {
          const meName = kidName || translations.me;
          const meLabelText = kidAge ? `${meName} (${kidAge})` : meName;
          const meCharacter: SelectedCharacter = {
            id: `me-${Date.now()}`,
            type: "me",
            name: meName,
            label: meLabelText,
            age: kidAge || undefined,
          };
          setSelectedCharacters((prev) => [...prev, meCharacter]);
          toast.success(`✓ ${meName} ${translations.nameSaved}`);
        }
        break;
      }
      case "family":
        // Open modal with saved family characters
        setSavedModalCategory("family");
        break;
      case "friends":
        // Open modal with saved friend characters
        setSavedModalCategory("friends");
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
    
    if (type !== "other") {
      const existingIndex = selectedCharacters.findIndex((c) => c.type === type);
      if (existingIndex >= 0) {
        setSelectedCharacters((prev) => prev.filter((c) => c.type !== type));
      } else {
        const familyCharacter: SelectedCharacter = {
          id: `${type}-${Date.now()}`,
          type: type,
          name: labels[type],
          label: labels[type],
        };
        setSelectedCharacters((prev) => [...prev, familyCharacter]);
        toast.success(`✓ ${labels[type]} ${translations.nameSaved}`);
      }
    } else {
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
    setViewState("main");
  }, [familyModalTarget, translations.nameSaved]);

  const handleRemoveCharacter = (id: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSurprise = () => {
    setSelectedCharacters([]);
    setSurpriseCharacters(true);
    onComplete([], true);
  };

  const handleContinue = () => {
    if (viewState === "family") {
      setViewState("main");
      return;
    }
    onComplete(selectedCharacters, surpriseCharacters);
  };

  const isSelected = (type: CharacterType | FamilyMember) => {
    return selectedCharacters.some((c) => c.type === type);
  };

  // Check if any saved character from a category is selected
  const hasSavedSelections = (category: "family" | "friends"): boolean => {
    const chars = category === "family" ? familyChars : friendChars;
    return chars.some(c => selectedCharacters.some(sc => sc.id === `saved-${c.id}`));
  };

  // Modal title based on category
  const getModalTitle = (category: "family" | "friends") => {
    // Use a generic "Who comes along?" phrasing
    return category === "family" ? translations.family : translations.friends;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-3 pb-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={viewState === "main" ? onBack : () => setViewState("main")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Vertically centered content */}
      <div className="flex-1 flex flex-col items-stretch px-5 max-w-[480px] mx-auto w-full gap-4 pb-20">
        {/* Fablino Header */}
        {fablinoMessage && viewState === "main" && (
          <FablinoPageHeader
            mascotImage="/mascot/4_come_back.png"
            message={fablinoMessage}
            mascotSize="md"
          />
        )}

        {/* Main Content */}
        {viewState === "main" && (
          <div className="w-full space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {mainTiles.map((tile) => {
                const isExpandable = tile.type === "family" || tile.type === "friends";
                const hasSelections = isExpandable && hasSavedSelections(tile.type as "family" | "friends");
                const isTileSelected = tile.type === "surprise"
                  ? surpriseCharacters
                  : (isSelected(tile.type) || hasSelections);
                
                return (
                  <div key={tile.type} className="relative">
                    <CharacterTile
                      image={tile.image}
                      label={tile.label}
                      onClick={() => handleMainTileClick(tile.type)}
                      selected={isTileSelected}
                      badge={tile.badge}
                      size="small"
                    />
                    {/* Hint text for surprise tile */}
                    {tile.type === "surprise" && (
                      <p className="text-[10px] text-muted-foreground text-center mt-0.5 leading-tight">
                        {translations.surpriseMeCharactersHint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewState === "family" && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {familyTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleFamilyTileClick(tile.type)}
                  selected={isSelected(tile.type)}
                  size="small"
                />
              ))}
            </div>
            
            {/* Add More Button */}
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-dashed border-2"
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

      {/* Saved Characters Modal (for family/friends) */}
      <SavedCharactersModal
        open={savedModalCategory !== null}
        onClose={() => setSavedModalCategory(null)}
        characters={savedModalCategory === "family" ? familyChars : friendChars}
        selectedIds={savedModalCategory ? getSelectedSavedIds(savedModalCategory) : []}
        onConfirm={(ids) => {
          if (savedModalCategory) {
            handleSavedModalConfirm(savedModalCategory, ids);
          }
        }}
        title={savedModalCategory ? getModalTitle(savedModalCategory) : ""}
        emptyMessage={translations.noCharactersSaved}
        doneLabel={translations.save}
        kidProfileId={effectiveKidProfileId}
        category={savedModalCategory || undefined}
        relationOptions={savedModalCategory === "family" ? familyRelationOptions : undefined}
        addNewLabel={translations.addMore}
        nameLabel={translations.characterName}
        relationLabel={translations.characterRelation}
        ageLabel={translations.characterAge}
        saveLabel={translations.save}
        cancelLabel={translations.cancel}
        onCharacterAdded={() => setCharLoadKey(k => k + 1)}
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
    </div>
  );
};

export default CharacterSelectionScreen;
