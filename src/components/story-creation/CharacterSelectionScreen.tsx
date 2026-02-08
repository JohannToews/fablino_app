import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CharacterTile from "./CharacterTile";
import NameInputModal from "./NameInputModal";
import FamilyMemberModal from "./FamilyMemberModal";
import SiblingInputModal from "./SiblingInputModal";
import SelectionSummary from "./SelectionSummary";
import {
  CharacterType,
  FamilyMember,
  SiblingGender,
  SelectedCharacter,
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
}

type ViewState = "main" | "family";

// Which category tile is expanded to show saved characters
type ExpandedCategory = "family" | "friends" | "famous" | null;

const CharacterSelectionScreen = ({
  translations,
  kidProfileId,
  kidName,
  kidAge,
  onComplete,
  onBack,
}: CharacterSelectionScreenProps) => {
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<ExpandedCategory>(null);
  const [surpriseCharacters, setSurpriseCharacters] = useState(false);
  
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

  // Saved kid_characters from DB
  const [savedCharacters, setSavedCharacters] = useState<KidCharacterDB[]>([]);

  // Load saved characters from DB
  useEffect(() => {
    const effectiveKidProfileId = kidProfileId ?? sessionStorage.getItem('selected_kid_profile_id') ?? undefined;

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
  }, [kidProfileId]);

  // Filter saved characters by role
  const familyChars = savedCharacters.filter(c => c.role === 'family');
  const friendChars = savedCharacters.filter(c => c.role === 'friend');
  const knownChars = savedCharacters.filter(c => c.role === 'known_figure');

  // "Ich" tile shows actual kid name + age
  const meLabel = kidName
    ? (kidAge ? `${kidName} (${kidAge})` : kidName)
    : translations.me;

  const mainTiles = [
    { type: "me" as CharacterType, image: heroKidImg, label: meLabel, badge: "\u2B50" },
    { type: "family" as CharacterType, image: familyImg, label: translations.family },
    { type: "siblings" as CharacterType, image: siblingsImg, label: translations.siblings },
    { type: "friends" as CharacterType, image: boysFriendsImg, label: translations.friends },
    { type: "famous" as CharacterType, image: famousCharactersImg, label: translations.famous },
    { type: "surprise" as CharacterType, image: surpriseBoxImg, label: translations.surprise, badge: "\u2B50" },
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

  // Toggle a saved character in the selection
  const toggleSavedCharacter = (char: KidCharacterDB) => {
    const charId = `saved-${char.id}`;
    const isAlreadySelected = selectedCharacters.some(c => c.id === charId);
    
    if (isAlreadySelected) {
      setSelectedCharacters(prev => prev.filter(c => c.id !== charId));
    } else {
      const charLabel = [
        char.name,
        char.relation ? char.relation : null,
        char.age ? `${char.age} J.` : null,
      ].filter(Boolean).join(', ');
      
      // Map DB role to CharacterType
      const typeMap: Record<string, CharacterType> = {
        family: "family",
        friend: "friends",
        known_figure: "famous",
      };
      
      const newChar: SelectedCharacter = {
        id: charId,
        type: typeMap[char.role] || "friends",
        name: char.name,
        label: charLabel,
        age: char.age || undefined,
        role: char.role,
        relation: char.relation || undefined,
        description: char.description || undefined,
      };
      setSelectedCharacters(prev => [...prev, newChar]);
      toast.success(`\u2713 ${char.name} ${translations.nameSaved}`);
    }
  };

  // Get saved characters for a category and render checkboxes
  const renderSavedCheckboxes = (category: ExpandedCategory) => {
    let chars: KidCharacterDB[] = [];
    if (category === "family") chars = familyChars;
    else if (category === "friends") chars = friendChars;
    else if (category === "famous") chars = knownChars;
    
    console.log('[renderSavedCheckboxes]', category, 'chars:', chars.length, chars);
    
    if (chars.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic py-2 px-1">
          {translations.noCharactersSaved}
        </p>
      );
    }

    return (
      <div className="space-y-1.5">
        {chars.map((char) => {
          const charId = `saved-${char.id}`;
          const isChecked = selectedCharacters.some(c => c.id === charId);
          const charLabel = [
            char.name,
            char.relation ? `(${char.relation})` : null,
            char.age ? `${char.age} J.` : null,
          ].filter(Boolean).join(' ');
          
          return (
            <label
              key={char.id}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleSavedCharacter(char)}
              />
              <span className="text-xs md:text-sm font-medium">{charLabel}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const handleMainTileClick = (type: CharacterType) => {
    // If user clicks any tile other than "surprise", deselect surprise mode
    if (type !== "surprise" && surpriseCharacters) {
      setSurpriseCharacters(false);
    }
    
    switch (type) {
      case "me": {
        // Toggle "me" selection
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
          toast.success(`\u2713 ${meName} ${translations.nameSaved}`);
        }
        break;
      }
      case "family":
        // Toggle expansion of saved family characters
        setExpandedCategory(prev => prev === "family" ? null : "family");
        break;
      case "siblings":
        setSiblingModalOpen(true);
        break;
      case "friends":
        // Toggle expansion of saved friend characters
        setExpandedCategory(prev => prev === "friends" ? null : "friends");
        break;
      case "famous":
        // Toggle expansion of saved known figure characters
        setExpandedCategory(prev => prev === "famous" ? null : "famous");
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
    
    // For mama, papa, oma, opa - toggle selection (multi-select)
    if (type !== "other") {
      const existingIndex = selectedCharacters.findIndex((c) => c.type === type);
      
      if (existingIndex >= 0) {
        // Already selected - remove it
        setSelectedCharacters((prev) => prev.filter((c) => c.type !== type));
      } else {
        // Not selected - add it
        const familyCharacter: SelectedCharacter = {
          id: `${type}-${Date.now()}`,
          type: type,
          name: labels[type],
          label: labels[type],
        };
        setSelectedCharacters((prev) => [...prev, familyCharacter]);
        toast.success(`\u2713 ${labels[type]} ${translations.nameSaved}`);
      }
      // Stay in family view for multi-select
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
    toast.success(`\u2713 ${name} ${translations.nameSaved}`);
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
    toast.success(`\u2713 ${name} ${translations.nameSaved}`);
    
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
    toast.success(`\u2713 ${name} ${translations.nameSaved}`);
  }, [translations.brother, translations.sister, translations.nameSaved]);

  const handleRemoveCharacter = (id: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSurprise = () => {
    // "Überrasch mich" on Screen 2 = exclusive: no real persons, only fictional characters
    // Clear all other selections and set surprise flag
    setSelectedCharacters([]);
    setSurpriseCharacters(true);
    setExpandedCategory(null);
    // Go directly to next screen with empty characters + surprise flag
    onComplete([], true);
  };

  const handleContinue = () => {
    // If in family view, go back to main view first
    if (viewState === "family") {
      setViewState("main");
      return;
    }
    // From main view, proceed directly to next screen
    onComplete(selectedCharacters, surpriseCharacters);
  };

  const isSelected = (type: CharacterType | FamilyMember) => {
    return selectedCharacters.some((c) => c.type === type);
  };

  // Check if any saved character from a category is selected
  const hasSavedSelections = (category: ExpandedCategory): boolean => {
    let chars: KidCharacterDB[] = [];
    if (category === "family") chars = familyChars;
    else if (category === "friends") chars = friendChars;
    else if (category === "famous") chars = knownChars;
    return chars.some(c => selectedCharacters.some(sc => sc.id === `saved-${c.id}`));
  };

  return (
    <div className="min-h-screen pb-24 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-2 md:py-3 flex items-center gap-4">
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
      <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4 space-y-2">
        {viewState === "main" && (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {mainTiles.map((tile) => {
                const isExpandable = tile.type === "family" || tile.type === "friends" || tile.type === "famous";
                const isExpanded = expandedCategory === tile.type;
                const hasSelections = isExpandable && hasSavedSelections(tile.type as ExpandedCategory);
                // "Überrasch mich" tile is selected when surpriseCharacters is true
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
                    {/* Expand indicator for categories with saved characters */}
                    {isExpandable && (
                      <div className="absolute bottom-6 right-1 md:bottom-7 md:right-1.5">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Expanded saved characters checkboxes */}
            {expandedCategory && (
              <div className="animate-fade-in bg-card rounded-xl border border-border p-3">
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
                  {translations.savedCharactersLabel}
                </h3>
                {renderSavedCheckboxes(expandedCategory)}
              </div>
            )}
          </>
        )}

        {viewState === "family" && (
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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
              className="w-full h-12 md:h-14 rounded-xl border-dashed border-2"
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
    </div>
  );
};

export default CharacterSelectionScreen;
