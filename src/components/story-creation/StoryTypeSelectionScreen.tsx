import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CharacterTile from "./CharacterTile";
import { StoryType, EducationalTopic, StoryTypeSelectionTranslations, StoryLength, StoryDifficulty } from "./types";
import { cn } from "@/lib/utils";

// Story type images
import educationalImg from "@/assets/story-types/educational.jpg";
import adventureImg from "@/assets/story-types/adventure.jpg";
import detectiveImg from "@/assets/story-types/detective.jpg";
import funnyImg from "@/assets/story-types/funny.jpg";
import friendshipImg from "@/assets/story-types/friendship.jpg";
import surpriseBoxImg from "@/assets/characters/surprise-box.jpg";

// Educational topic images
import natureAnimalsImg from "@/assets/story-types/nature-animals.jpg";
import monumentsImg from "@/assets/story-types/monuments.jpg";
import countriesImg from "@/assets/story-types/countries.jpg";
import scienceImg from "@/assets/story-types/science.jpg";

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
    customTopic?: string
  ) => void;
  onBack: () => void;
}

type ViewState = "main" | "educational";

const StoryTypeSelectionScreen = ({
  translations,
  onComplete,
  onBack,
}: StoryTypeSelectionScreenProps) => {
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [humorLevel, setHumorLevel] = useState(5);
  
  // Story settings
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");
  const [isSeries, setIsSeries] = useState(false);

  const storyTypeTiles = [
    { type: "educational" as StoryType, image: educationalImg, label: translations.educational },
    { type: "adventure" as StoryType, image: adventureImg, label: translations.adventure },
    { type: "detective" as StoryType, image: detectiveImg, label: translations.detective },
    { type: "funny" as StoryType, image: funnyImg, label: translations.funny },
    { type: "friendship" as StoryType, image: friendshipImg, label: translations.friendship },
    { type: "surprise" as StoryType, image: surpriseBoxImg, label: translations.surprise, badge: "⭐" },
  ];

  const educationalTopicTiles = [
    { type: "nature" as EducationalTopic, image: natureAnimalsImg, label: translations.natureAnimals },
    { type: "monuments" as EducationalTopic, image: monumentsImg, label: translations.monumentsHistory },
    { type: "countries" as EducationalTopic, image: countriesImg, label: translations.countriesCities },
    { type: "science" as EducationalTopic, image: scienceImg, label: translations.science },
    { type: "other" as EducationalTopic, image: educationalImg, label: translations.other },
  ];

  const handleTypeClick = (type: StoryType) => {
    if (type === "surprise") {
      // Random selection (excluding surprise and educational)
      const randomTypes = storyTypeTiles.filter(t => t.type !== "surprise" && t.type !== "educational");
      const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)].type;
      setSelectedType(randomType);
      
      if (randomType === "funny") {
        setHumorLevel(Math.floor(Math.random() * 10) + 1);
      }
    } else if (type === "educational") {
      setSelectedType(type);
      setViewState("educational");
    } else {
      setSelectedType(type);
    }
  };

  const handleTopicClick = (topic: EducationalTopic) => {
    if (selectedTopic === topic) {
      // Deselect if clicking same topic
      return;
    }
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
    if (!selectedType) return;
    
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
    };
    
    if (selectedType === "educational") {
      if (!selectedTopic) return;
      // Pass customTopic for any topic (optional for most, required for "other")
      onComplete(selectedType, settings, undefined, selectedTopic, customTopic.trim() || undefined);
    } else if (selectedType === "funny") {
      onComplete(selectedType, settings, humorLevel);
    } else {
      onComplete(selectedType, settings);
    }
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

  const getHumorEmoji = () => {
    if (humorLevel <= 3) return "😊";
    if (humorLevel <= 6) return "😆";
    return "🤪";
  };

  const getHumorLabel = () => {
    if (humorLevel <= 3) return translations.humorLow;
    if (humorLevel <= 6) return translations.humorMid;
    return translations.humorHigh;
  };

  const canContinue = () => {
    if (!selectedType) return false;
    if (selectedType === "educational") {
      if (!selectedTopic) return false;
      if (selectedTopic === "other" && !customTopic.trim()) return false;
    }
    return true;
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
            {viewState === "main" ? translations.header : translations.educationalTopicHeader}
          </h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4 space-y-3 md:space-y-4">
        {/* Story Settings (Length, Difficulty, Series) - Compact for tablets */}
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
        {/* Main Story Type Grid - 3 columns on tablet */}
        {viewState === "main" && (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {storyTypeTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleTypeClick(tile.type)}
                  selected={selectedType === tile.type}
                  badge={tile.badge}
                  size="small"
                />
              ))}
            </div>

            {/* Humor Slider (appears when "funny" is selected) */}
            {selectedType === "funny" && (
              <div className="animate-fade-in bg-card rounded-xl md:rounded-2xl p-4 md:p-5 border-2 border-primary/20 space-y-3">
                <h3 className="text-base md:text-lg font-baloo font-semibold text-center">
                  {translations.humorSliderTitle}
                </h3>
                
                {/* Current Emoji Display */}
                <div className="flex justify-center">
                  <span className="text-4xl md:text-5xl animate-bounce">{getHumorEmoji()}</span>
                </div>
                
                {/* Slider */}
                <div className="px-2">
                  <Slider
                    value={[humorLevel]}
                    onValueChange={(value) => setHumorLevel(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                {/* Labels */}
                <div className="flex justify-between text-xs md:text-sm text-muted-foreground px-1">
                  <span className="flex items-center gap-1">
                    😊 {translations.humorLow}
                  </span>
                  <span className="flex items-center gap-1">
                    🤪 {translations.humorHigh}
                  </span>
                </div>
                
                {/* Current Level */}
                <p className="text-center text-sm md:text-base font-baloo font-medium text-primary">
                  {getHumorLabel()} ({humorLevel}/10)
                </p>
              </div>
            )}
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

      {/* Bottom Continue Button */}
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
    </div>
  );
};

export default StoryTypeSelectionScreen;
