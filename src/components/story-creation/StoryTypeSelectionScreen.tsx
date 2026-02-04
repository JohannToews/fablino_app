import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import CharacterTile from "./CharacterTile";
import { StoryType, StoryTypeSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";

// Story type images
import educationalImg from "@/assets/story-types/educational.jpg";
import adventureImg from "@/assets/story-types/adventure.jpg";
import detectiveImg from "@/assets/story-types/detective.jpg";
import funnyImg from "@/assets/story-types/funny.jpg";
import friendshipImg from "@/assets/story-types/friendship.jpg";
import surpriseBoxImg from "@/assets/characters/surprise-box.jpg";

interface StoryTypeSelectionScreenProps {
  translations: StoryTypeSelectionTranslations;
  onComplete: (storyType: StoryType, humorLevel?: number) => void;
  onBack: () => void;
}

const StoryTypeSelectionScreen = ({
  translations,
  onComplete,
  onBack,
}: StoryTypeSelectionScreenProps) => {
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [humorLevel, setHumorLevel] = useState(5);

  const storyTypeTiles = [
    { 
      type: "educational" as StoryType, 
      image: educationalImg, 
      label: translations.educational, 
      subtext: translations.educationalSubtext,
      emoji: "📚" 
    },
    { 
      type: "adventure" as StoryType, 
      image: adventureImg, 
      label: translations.adventure, 
      emoji: "🗺️" 
    },
    { 
      type: "detective" as StoryType, 
      image: detectiveImg, 
      label: translations.detective, 
      emoji: "🔍" 
    },
    { 
      type: "funny" as StoryType, 
      image: funnyImg, 
      label: translations.funny, 
      emoji: "😄" 
    },
    { 
      type: "friendship" as StoryType, 
      image: friendshipImg, 
      label: translations.friendship, 
      emoji: "👫" 
    },
    { 
      type: "surprise" as StoryType, 
      image: surpriseBoxImg, 
      label: translations.surprise, 
      emoji: "⭐",
      badge: "⭐"
    },
  ];

  const handleTypeClick = (type: StoryType) => {
    if (type === "surprise") {
      // Random selection
      const randomType = storyTypeTiles
        .filter(t => t.type !== "surprise")
        [Math.floor(Math.random() * 5)].type;
      setSelectedType(randomType);
      
      if (randomType === "funny") {
        setHumorLevel(Math.floor(Math.random() * 10) + 1);
      }
    } else {
      setSelectedType(type);
    }
  };

  const handleContinue = () => {
    if (!selectedType) return;
    
    if (selectedType === "funny") {
      onComplete(selectedType, humorLevel);
    } else {
      onComplete(selectedType);
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

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base md:text-lg font-baloo font-bold flex-1">
            {translations.header}
          </h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Story Type Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {storyTypeTiles.map((tile) => (
            <div key={tile.type} className="relative">
              <CharacterTile
                image={tile.image}
                label={tile.label}
                onClick={() => handleTypeClick(tile.type)}
                selected={selectedType === tile.type}
                badge={tile.badge}
              />
              {/* Emoji Badge */}
              <div className="absolute top-2 left-2 text-xl">
                {tile.emoji}
              </div>
              {/* Subtext for educational */}
              {tile.subtext && (
                <p className="text-xs text-muted-foreground text-center -mt-1">
                  {tile.subtext}
                </p>
              )}
            </div>
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
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className={cn(
              "w-full h-14 rounded-2xl text-lg font-baloo bg-accent hover:bg-accent/90 text-accent-foreground",
              selectedType && "animate-pulse"
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
