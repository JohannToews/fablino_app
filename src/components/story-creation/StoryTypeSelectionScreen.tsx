import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CharacterTile from "./CharacterTile";
import { 
  StoryType, 
  StorySubElement,
  EducationalTopic, 
  StoryTypeSelectionTranslations, 
  StoryLength, 
  StoryDifficulty,
} from "./types";
import { useColorPalette } from "@/hooks/useColorPalette";
import FablinoPageHeader from "@/components/FablinoPageHeader";

// Main category images (Vite imports – reliable with Dropbox Smart Sync)
import fantasyImg from "@/assets/themes/magic.png";
import actionImg from "@/assets/themes/action.png";
import animalsImg from "@/assets/themes/animals.png";
import everydayImg from "@/assets/themes/friends.png";
import humorImg from "@/assets/themes/chaos.png";
import surpriseBoxImg from "@/assets/themes/surprise.png";

// Educational images (kept as asset imports)
import educationalImg from "@/assets/story-types/educational.jpg";
import musicArtImg from "@/assets/story-types/music-art.jpg";
import otherTopicImg from "@/assets/story-types/other-topic.jpg";

// Educational topic images
import natureAnimalsImg from "@/assets/story-types/nature-animals.jpg";
import monumentsImg from "@/assets/story-types/monuments.jpg";
import countriesImg from "@/assets/story-types/countries.jpg";
import scienceImg from "@/assets/story-types/science-new.jpg";

export interface StorySettings {
  length: StoryLength;
  difficulty: StoryDifficulty;
  isSeries: boolean;
  storyLanguage: string;
}

interface StoryTypeSelectionScreenProps {
  translations: StoryTypeSelectionTranslations;
  availableLanguages: string[];
  defaultLanguage: string;
  uiLanguage: string;
  onComplete: (
    storyType: StoryType,
    settings: StorySettings,
    humorLevel?: number,
    educationalTopic?: EducationalTopic,
    customTopic?: string,
    selectedSubElements?: StorySubElement[]
  ) => void;
  onBack: () => void;
  fablinoMessage?: string;
}

type ViewState = "main" | "educational";

const StoryTypeSelectionScreen = ({
  translations,
  availableLanguages,
  defaultLanguage,
  uiLanguage,
  onComplete,
  onBack,
  fablinoMessage,
}: StoryTypeSelectionScreenProps) => {
  const { colors } = useColorPalette();
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  
  // Story settings
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");
  const [isSeries, setIsSeries] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<string>(defaultLanguage);

  const mainCategoryTiles = [
    { type: "fantasy" as StoryType, image: fantasyImg, label: translations.fantasy },
    { type: "action" as StoryType, image: actionImg, label: translations.action },
    { type: "animals" as StoryType, image: animalsImg, label: translations.animals },
    { type: "everyday" as StoryType, image: everydayImg, label: translations.everyday },
    { type: "humor" as StoryType, image: humorImg, label: translations.humor },
    // Educational temporarily disabled - will be re-enabled later
    // { type: "educational" as StoryType, image: educationalImg, label: translations.educational },
    // Surprise Me as 6th tile in the grid
    { type: "surprise" as StoryType, image: surpriseBoxImg, label: translations.surprise, isSurprise: true },
  ];

  const educationalTopicTiles = [
    { type: "nature" as EducationalTopic, image: natureAnimalsImg, label: translations.natureAnimals },
    { type: "monuments" as EducationalTopic, image: monumentsImg, label: translations.monumentsHistory },
    { type: "countries" as EducationalTopic, image: countriesImg, label: translations.countriesCities },
    { type: "science" as EducationalTopic, image: scienceImg, label: translations.science },
    { type: "music" as EducationalTopic, image: musicArtImg, label: translations.musicArt },
    { type: "other" as EducationalTopic, image: otherTopicImg, label: translations.other },
  ];

  const handleTypeClick = (type: StoryType) => {
    if (type === "surprise") {
      // Handle surprise directly
      handleSurpriseClick();
    } else if (type === "educational") {
      setSelectedType(type);
      setViewState("educational");
    } else {
      // Go directly to character selection for non-educational types
      const settings: StorySettings = {
        length: storyLength,
        difficulty: storyDifficulty,
        isSeries,
        storyLanguage,
      };
      onComplete(type, settings, undefined, undefined, undefined, []);
    }
  };

  const handleSurpriseClick = () => {
    // "Überrasch mich" – don't reveal which theme, pass 'surprise' as storyType
    // The promptBuilder will instruct the LLM to choose a creative theme
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
      storyLanguage,
    };
    
    // Go directly to character selection with 'surprise' storyType
    onComplete("surprise" as StoryType, settings, undefined, undefined, undefined, []);
  };

  const handleTopicClick = (topic: EducationalTopic) => {
    if (selectedTopic === topic) return;
    setSelectedTopic(topic);
    setCustomTopic("");
  };

  const getTopicPlaceholder = (topic: EducationalTopic): string => {
    switch (topic) {
      case "nature": return translations.placeholderNature;
      case "monuments": return translations.placeholderMonuments;
      case "countries": return translations.placeholderCountries;
      case "science": return translations.placeholderScience;
      case "music": return translations.placeholderMusic;
      case "other": return translations.placeholderOther;
      default: return "";
    }
  };

  const handleContinue = () => {
    if (selectedType !== "educational" || !selectedTopic) return;
    
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
      storyLanguage,
    };
    
    onComplete(selectedType, settings, undefined, selectedTopic, customTopic.trim() || undefined);
  };

  const handleBack = () => {
    if (viewState === "educational") {
      setViewState("main");
      setSelectedTopic(null);
      setCustomTopic("");
    } else {
      onBack();
    }
  };

  const canContinue = () => {
    if (selectedType !== "educational") return false;
    if (!selectedTopic) return false;
    if (selectedTopic === "other" && !customTopic.trim()) return false;
    return true;
  };

  const getHeaderForView = () => {
    if (viewState === "main") return translations.header;
    return translations.educationalTopicHeader;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      {/* Back button */}
      <div className="px-4 pt-3 pb-0">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Vertically centered content */}
      <div className="flex-1 flex flex-col items-stretch px-5 max-w-[480px] mx-auto w-full gap-4 pb-6">
        {/* Fablino Header */}
        {fablinoMessage && (
          <FablinoPageHeader
            mascotImage="/mascot/6_Onboarding.png"
            message={fablinoMessage}
            mascotSize="md"
          />
        )}

        {/* Main Category Grid – 2x3 with larger tiles */}
        {viewState === "main" && (
          <div className="grid grid-cols-3 gap-4 w-full">
            {mainCategoryTiles.map((tile) => (
              <CharacterTile
                key={tile.type}
                image={tile.image}
                label={tile.label}
                onClick={() => handleTypeClick(tile.type)}
                selected={selectedType === tile.type}
                size="small"
                overlayClass={colors.overlay}
              />
            ))}
          </div>
        )}

        {/* Educational Topics Grid – 3 columns on tablet, 2 on mobile */}
        {viewState === "educational" && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {educationalTopicTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleTopicClick(tile.type)}
                  selected={selectedTopic === tile.type}
                  size="small"
                  overlayClass={colors.overlay}
                />
              ))}
            </div>

            {/* Custom Topic Input (appears when any topic is selected) */}
            {selectedTopic && (
              <div className="animate-fade-in bg-card rounded-xl p-4 border-2 border-[#F0E8E0] space-y-3">
                <h3 className="text-base font-baloo font-semibold text-center">
                  {selectedTopic === "other" 
                    ? translations.other 
                    : translations.specifyTopic}
                </h3>
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={getTopicPlaceholder(selectedTopic)}
                  className="h-12 text-base font-medium text-center rounded-xl border-2 focus:border-orange-400"
                  maxLength={100}
                />
              </div>
            )}

            {/* Continue Button (inline, not fixed) */}
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors"
            >
              {translations.continue} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryTypeSelectionScreen;
