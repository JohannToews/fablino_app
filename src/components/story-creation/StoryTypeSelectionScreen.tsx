import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import CharacterTile from "./CharacterTile";
import { StoryType, EducationalTopic, StoryTypeSelectionTranslations } from "./types";
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

interface StoryTypeSelectionScreenProps {
  translations: StoryTypeSelectionTranslations;
  onComplete: (storyType: StoryType, humorLevel?: number, educationalTopic?: EducationalTopic, customTopic?: string) => void;
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
    
    if (selectedType === "educational") {
      if (!selectedTopic) return;
      // Pass customTopic for any topic (optional for most, required for "other")
      onComplete(selectedType, undefined, selectedTopic, customTopic.trim() || undefined);
    } else if (selectedType === "funny") {
      onComplete(selectedType, humorLevel);
    } else {
      onComplete(selectedType);
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
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base md:text-lg font-baloo font-bold flex-1">
            {viewState === "main" ? translations.header : translations.educationalTopicHeader}
          </h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Main Story Type Grid */}
        {viewState === "main" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {storyTypeTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleTypeClick(tile.type)}
                  selected={selectedType === tile.type}
                  badge={tile.badge}
                />
              ))}
            </div>

            {/* Humor Slider (appears when "funny" is selected) */}
            {selectedType === "funny" && (
              <div className="animate-fade-in bg-card rounded-2xl p-6 border-2 border-primary/20 space-y-4">
                <h3 className="text-lg font-baloo font-semibold text-center">
                  {translations.humorSliderTitle}
                </h3>
                
                {/* Current Emoji Display */}
                <div className="flex justify-center">
                  <span className="text-6xl animate-bounce">{getHumorEmoji()}</span>
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
                <div className="flex justify-between text-sm text-muted-foreground px-1">
                  <span className="flex items-center gap-1">
                    😊 {translations.humorLow}
                  </span>
                  <span className="flex items-center gap-1">
                    🤪 {translations.humorHigh}
                  </span>
                </div>
                
                {/* Current Level */}
                <p className="text-center font-baloo font-medium text-primary">
                  {getHumorLabel()} ({humorLevel}/10)
                </p>
              </div>
            )}
          </>
        )}

        {/* Educational Topics Grid */}
        {viewState === "educational" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {educationalTopicTiles.map((tile) => (
                <CharacterTile
                  key={tile.type}
                  image={tile.image}
                  label={tile.label}
                  onClick={() => handleTopicClick(tile.type)}
                  selected={selectedTopic === tile.type}
                />
              ))}
            </div>

            {/* Custom Topic Input (appears when any topic is selected) */}
            {selectedTopic && (
              <div className="animate-fade-in bg-card rounded-2xl p-6 border-2 border-primary/20 space-y-4">
                <h3 className="text-lg font-baloo font-semibold text-center">
                  {selectedTopic === "other" 
                    ? translations.other 
                    : translations.specifyTopic}
                </h3>
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={getTopicPlaceholder(selectedTopic)}
                  className="h-14 text-lg font-medium text-center rounded-xl border-2 focus:border-primary"
                  maxLength={100}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <Button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              "w-full h-14 rounded-2xl text-lg font-baloo bg-accent hover:bg-accent/90 text-accent-foreground"
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
