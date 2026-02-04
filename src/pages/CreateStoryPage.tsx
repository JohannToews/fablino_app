import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import StoryTypeSelectionScreen from "@/components/story-creation/StoryTypeSelectionScreen";
import CharacterSelectionScreen from "@/components/story-creation/CharacterSelectionScreen";
import SettingSelectionScreen from "@/components/story-creation/SettingSelectionScreen";
import {
  StoryType,
  SelectedCharacter,
  SpecialAttribute,
  LocationType,
  TimePeriod,
  storyTypeSelectionTranslations,
  characterSelectionTranslations,
  settingSelectionTranslations,
} from "@/components/story-creation/types";
import { toast } from "sonner";

// Screen states for the wizard (new order: story-type first!)
type WizardScreen = "story-type" | "characters" | "setting";

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage } = useKidProfile();
  const { colors: paletteColors } = useColorPalette();

  // Wizard state
  const [currentScreen, setCurrentScreen] = useState<WizardScreen>("story-type");
  const [selectedStoryType, setSelectedStoryType] = useState<StoryType | null>(null);
  const [humorLevel, setHumorLevel] = useState<number | undefined>(undefined);
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimePeriod>("today");

  // Translations
  const storyTypeTranslations = storyTypeSelectionTranslations[kidAppLanguage] || storyTypeSelectionTranslations.de;
  const characterTranslations = characterSelectionTranslations[kidAppLanguage] || characterSelectionTranslations.de;
  const settingTranslations = settingSelectionTranslations[kidAppLanguage] || settingSelectionTranslations.de;

  // Handle story type selection complete
  const handleStoryTypeComplete = (storyType: StoryType, humor?: number) => {
    setSelectedStoryType(storyType);
    setHumorLevel(humor);
    setCurrentScreen("characters");
  };

  // Handle character selection complete
  const handleCharactersComplete = (
    characters: SelectedCharacter[],
    attributes: SpecialAttribute[]
  ) => {
    setSelectedCharacters(characters);
    setSelectedAttributes(attributes);
    setCurrentScreen("setting");
  };

  // Handle setting selection complete
  const handleSettingComplete = (
    locations: LocationType[],
    timePeriod: TimePeriod
  ) => {
    setSelectedLocations(locations);
    setSelectedTime(timePeriod);
    
    // All selections complete - ready for story generation
    console.log("Story Type:", selectedStoryType, humorLevel ? `(Humor: ${humorLevel})` : "");
    console.log("Characters:", selectedCharacters);
    console.log("Attributes:", selectedAttributes);
    console.log("Locations:", locations);
    console.log("Time:", timePeriod);
    
    toast.success("Alle Einstellungen fertig! 🎉");
    
    // TODO: Call story generation API
    // For now, navigate back to home or show confirmation
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentScreen === "story-type") {
      navigate("/");
    } else if (currentScreen === "characters") {
      setCurrentScreen("story-type");
    } else if (currentScreen === "setting") {
      setCurrentScreen("characters");
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {currentScreen === "story-type" && (
        <StoryTypeSelectionScreen
          translations={storyTypeTranslations}
          onComplete={handleStoryTypeComplete}
          onBack={handleBack}
        />
      )}

      {currentScreen === "characters" && (
        <CharacterSelectionScreen
          translations={characterTranslations}
          onComplete={handleCharactersComplete}
          onBack={handleBack}
        />
      )}

      {currentScreen === "setting" && (
        <SettingSelectionScreen
          translations={settingTranslations}
          onComplete={handleSettingComplete}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default CreateStoryPage;
