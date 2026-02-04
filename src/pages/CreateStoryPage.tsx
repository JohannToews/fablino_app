import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import CharacterSelectionScreen from "@/components/story-creation/CharacterSelectionScreen";
import {
  SelectedCharacter,
  SpecialAttribute,
  characterSelectionTranslations,
} from "@/components/story-creation/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Screen states for the wizard
type WizardScreen = "characters" | "setting" | "story-type";

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage, selectedProfile } = useKidProfile();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();

  // Wizard state
  const [currentScreen, setCurrentScreen] = useState<WizardScreen>("characters");
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);

  // Translations
  const characterTranslations = characterSelectionTranslations[kidAppLanguage] || characterSelectionTranslations.de;

  // Handle character selection complete
  const handleCharactersComplete = (
    characters: SelectedCharacter[],
    attributes: SpecialAttribute[]
  ) => {
    setSelectedCharacters(characters);
    setSelectedAttributes(attributes);
    
    // TODO: Move to next screen (setting selection)
    // For now, log and show toast
    console.log("Characters:", characters);
    console.log("Attributes:", attributes);
    toast.success("Charaktere ausgewählt! 🎭");
    
    // Navigate to setting screen (to be implemented)
    setCurrentScreen("setting");
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentScreen === "characters") {
      navigate("/");
    } else if (currentScreen === "setting") {
      setCurrentScreen("characters");
    } else if (currentScreen === "story-type") {
      setCurrentScreen("setting");
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {currentScreen === "characters" && (
        <CharacterSelectionScreen
          translations={characterTranslations}
          onComplete={handleCharactersComplete}
          onBack={handleBack}
        />
      )}

      {currentScreen === "setting" && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-2xl font-baloo mb-4">Screen 2: Setting</h2>
            <p className="text-muted-foreground mb-4">
              Ausgewählte Charaktere: {selectedCharacters.map(c => c.name).join(", ")}
            </p>
            <p className="text-muted-foreground mb-6">
              Attribute: {selectedAttributes.join(", ") || "Keine"}
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl"
            >
              Zurück zu Charakteren
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStoryPage;
