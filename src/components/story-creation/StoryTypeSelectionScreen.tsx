import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CharacterTile from "./CharacterTile";
import { 
  StoryType, 
  StorySubElement,
  EducationalTopic, 
  StoryTypeSelectionTranslations, 
  StoryLength, 
  StoryDifficulty,
} from "./types";
import { cn } from "@/lib/utils";
import { useColorPalette } from "@/hooks/useColorPalette";

// Main category images
import fantasyImg from "@/assets/story-types/fantasy.jpg";
import actionImg from "@/assets/story-types/action.jpg";
import animalsImg from "@/assets/story-types/animals-new.jpg";
import everydayImg from "@/assets/story-types/everyday.jpg";
import humorImg from "@/assets/story-types/humor.jpg";
import educationalImg from "@/assets/story-types/educational.jpg";
import musicArtImg from "@/assets/story-types/music-art.jpg";
import surpriseBoxImg from "@/assets/characters/surprise-box.jpg";

// Educational topic images
import natureAnimalsImg from "@/assets/story-types/nature-animals.jpg";
import monumentsImg from "@/assets/story-types/monuments.jpg";
import countriesImg from "@/assets/story-types/countries.jpg";
import scienceImg from "@/assets/story-types/science-new.jpg";

export interface StorySettings {
  length: StoryLength;
  difficulty: StoryDifficulty;
  isSeries: boolean;
}

interface StoryTypeSelectionScreenProps {
  translations: StoryTypeSelectionTranslations;
  onComplete: (
    storyType: StoryType,
    settings: StorySettings,
    humorLevel?: number,
    educationalTopic?: EducationalTopic,
    customTopic?: string,
    selectedSubElements?: StorySubElement[]
  ) => void;
  onBack: () => void;
}

type ViewState = "main" | "educational";

const StoryTypeSelectionScreen = ({
  translations,
  onComplete,
  onBack,
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

  const mainCategoryTiles = [
    { type: "fantasy" as StoryType, image: fantasyImg, label: translations.fantasy },
    { type: "action" as StoryType, image: actionImg, label: translations.action },
    { type: "animals" as StoryType, image: animalsImg, label: translations.animals },
    { type: "everyday" as StoryType, image: everydayImg, label: translations.everyday },
    { type: "humor" as StoryType, image: humorImg, label: translations.humor },
    { type: "music" as StoryType, image: musicArtImg, label: translations.music },
    { type: "educational" as StoryType, image: educationalImg, label: translations.educational },
  ];

  const educationalTopicTiles = [
    { type: "nature" as EducationalTopic, image: natureAnimalsImg, label: translations.natureAnimals },
    { type: "monuments" as EducationalTopic, image: monumentsImg, label: translations.monumentsHistory },
    { type: "countries" as EducationalTopic, image: countriesImg, label: translations.countriesCities },
    { type: "science" as EducationalTopic, image: scienceImg, label: translations.science },
    { type: "other" as EducationalTopic, image: educationalImg, label: translations.other },
  ];

  const handleTypeClick = (type: StoryType) => {
    if (type === "educational") {
      setSelectedType(type);
      setViewState("educational");
    } else {
      // Go directly to character selection for non-educational types
      const settings: StorySettings = {
        length: storyLength,
        difficulty: storyDifficulty,
        isSeries,
      };
      onComplete(type, settings, undefined, undefined, undefined, []);
    }
  };

  const handleSurpriseClick = () => {
    // Random selection from main categories (excluding educational)
    const randomCategories = mainCategoryTiles.filter(t => t.type !== "educational");
    const randomCategory = randomCategories[Math.floor(Math.random() * randomCategories.length)].type;
    
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
    };
    
    // Go directly to character selection with random category
    onComplete(randomCategory, settings, undefined, undefined, undefined, []);
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
    <div className="min-h-screen pb-24 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-2 md:py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base md:text-lg font-baloo font-bold flex-1">
            {getHeaderForView()}
          </h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4 space-y-3 md:space-y-4">
        {/* Story Settings (Length, Difficulty, Series) - Only on main view */}
        {viewState === "main" && (
          <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-4 border border-border space-y-3 md:space-y-4">
            {/* Length Selection */}
            <div className="flex items-center gap-3">
              <Label className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap min-w-fit">{translations.lengthLabel}</Label>
              <div className="flex gap-1.5 md:gap-2 flex-1">
                {(["short", "medium", "long"] as StoryLength[]).map((len) => (
                  <Button
                    key={len}
                    variant={storyLength === len ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 md:h-9 rounded-lg md:rounded-xl font-medium text-xs md:text-sm",
                      storyLength === len && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setStoryLength(len)}
                  >
                    {len === "short" ? translations.lengthShort : len === "medium" ? translations.lengthMedium : translations.lengthLong}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="flex items-center gap-3">
              <Label className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap min-w-fit">{translations.difficultyLabel}</Label>
              <div className="flex gap-1.5 md:gap-2 flex-1">
                {(["easy", "medium", "hard"] as StoryDifficulty[]).map((diff) => (
                  <Button
                    key={diff}
                    variant={storyDifficulty === diff ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1 h-8 md:h-9 rounded-lg md:rounded-xl font-medium text-xs md:text-sm",
                      storyDifficulty === diff && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setStoryDifficulty(diff)}
                  >
                    {diff === "easy" ? translations.difficultyEasy : diff === "medium" ? translations.difficultyMedium : translations.difficultyHard}
                  </Button>
                ))}
              </div>
            </div>

            {/* Series Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs md:text-sm font-medium text-muted-foreground">{translations.seriesLabel}</Label>
              <div className="flex items-center gap-2 md:gap-3">
                <span className={cn("text-xs md:text-sm", !isSeries && "font-semibold text-foreground")}>{translations.seriesNo}</span>
                <Switch
                  checked={isSeries}
                  onCheckedChange={setIsSeries}
                  className="scale-90 md:scale-100"
                />
                <span className={cn("text-xs md:text-sm", isSeries && "font-semibold text-foreground")}>{translations.seriesYes}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Category Grid */}
        {viewState === "main" && (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
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

            {/* Surprise Me Button - Separate */}
            <Button
              onClick={handleSurpriseClick}
              variant="outline"
              className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden">
                  <img 
                    src={surpriseBoxImg} 
                    alt="Surprise" 
                    className="w-full h-full object-cover"
                  />
                  <div className={cn("absolute inset-0 pointer-events-none", colors.overlay)} />
                </div>
                <span className="text-base md:text-lg font-baloo font-semibold">
                  {translations.surprise}
                </span>
                <Sparkles className="h-5 w-5 text-primary group-hover:animate-pulse" />
              </div>
            </Button>
          </>
        )}

        {/* Educational Topics Grid */}
        {viewState === "educational" && (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
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
              <div className="animate-fade-in bg-card rounded-xl md:rounded-2xl p-4 md:p-5 border-2 border-primary/20 space-y-3">
                <h3 className="text-base md:text-lg font-baloo font-semibold text-center">
                  {selectedTopic === "other" 
                    ? translations.other 
                    : translations.specifyTopic}
                </h3>
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={getTopicPlaceholder(selectedTopic)}
                  className="h-12 md:h-14 text-base md:text-lg font-medium text-center rounded-xl border-2 focus:border-primary"
                  maxLength={100}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Continue Button - Only show for educational */}
      {viewState === "educational" && (
        <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
          <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4">
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className={cn(
                "w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg font-baloo bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
            >
              {translations.continue} →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryTypeSelectionScreen;
