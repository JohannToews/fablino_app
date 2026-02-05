import { useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CharacterTile from "./CharacterTile";
import { 
  StoryType, 
  StorySubElement,
  EducationalTopic, 
  StoryTypeSelectionTranslations, 
  StoryLength, 
  StoryDifficulty,
  getCategorySubElements
} from "./types";
import { cn } from "@/lib/utils";

// Main category images
import fantasyImg from "@/assets/story-types/fantasy.jpg";
import actionImg from "@/assets/story-types/action.jpg";
import animalsImg from "@/assets/story-types/animals.jpg";
import everydayImg from "@/assets/story-types/everyday.jpg";
import humorImg from "@/assets/story-types/humor.jpg";
import educationalImg from "@/assets/story-types/educational.jpg";
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
    customTopic?: string,
    selectedSubElements?: StorySubElement[]
  ) => void;
  onBack: () => void;
}

type ViewState = "main" | "subelements" | "educational";

const StoryTypeSelectionScreen = ({
  translations,
  onComplete,
  onBack,
}: StoryTypeSelectionScreenProps) => {
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [selectedSubElements, setSelectedSubElements] = useState<StorySubElement[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [humorLevel, setHumorLevel] = useState(5);
  
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
      setSelectedType(type);
      setSelectedSubElements([]);
      setViewState("subelements");
    }
  };

  const handleSurpriseClick = () => {
    // Random selection from main categories (excluding educational)
    const randomCategories = mainCategoryTiles.filter(t => t.type !== "educational");
    const randomCategory = randomCategories[Math.floor(Math.random() * randomCategories.length)].type;
    
    // Get random sub-elements for that category
    const subElements = getCategorySubElements(randomCategory);
    const numElements = Math.floor(Math.random() * 2) + 1; // 1-2 elements
    const shuffled = [...subElements].sort(() => Math.random() - 0.5);
    const randomElements = shuffled.slice(0, numElements);
    
    setSelectedType(randomCategory);
    setSelectedSubElements(randomElements);
    
    if (randomCategory === "humor") {
      setHumorLevel(Math.floor(Math.random() * 10) + 1);
    }
    
    // Go directly to confirmation with random selections
    setViewState("subelements");
  };

  const handleSubElementToggle = (element: StorySubElement) => {
    setSelectedSubElements(prev => {
      if (prev.includes(element)) {
        return prev.filter(e => e !== element);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 elements
      }
      return [...prev, element];
    });
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
    if (!selectedType) return;
    
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
    };
    
    if (selectedType === "educational") {
      if (!selectedTopic) return;
      onComplete(selectedType, settings, undefined, selectedTopic, customTopic.trim() || undefined);
    } else if (selectedType === "humor") {
      onComplete(selectedType, settings, humorLevel, undefined, undefined, selectedSubElements);
    } else {
      onComplete(selectedType, settings, undefined, undefined, undefined, selectedSubElements);
    }
  };

  const handleBack = () => {
    if (viewState === "educational") {
      setViewState("main");
      setSelectedTopic(null);
      setCustomTopic("");
    } else if (viewState === "subelements") {
      setViewState("main");
      setSelectedSubElements([]);
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
    // For other types, sub-elements are optional
    return true;
  };

  const getSubElementLabel = (element: StorySubElement): string => {
    // Get translation for sub-element
    const key = `subElement_${element}` as keyof StoryTypeSelectionTranslations;
    return (translations[key] as string) || element;
  };

  const currentSubElements = selectedType && selectedType !== "educational" 
    ? getCategorySubElements(selectedType) 
    : [];

  const getHeaderForView = () => {
    if (viewState === "main") return translations.header;
    if (viewState === "educational") return translations.educationalTopicHeader;
    // For subelements, show category name
    const category = mainCategoryTiles.find(t => t.type === selectedType);
    return `${category?.label || ""} - ${translations.subElementHeader}`;
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
                <img 
                  src={surpriseBoxImg} 
                  alt="Surprise" 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover"
                />
                <span className="text-base md:text-lg font-baloo font-semibold">
                  {translations.surprise}
                </span>
                <Sparkles className="h-5 w-5 text-primary group-hover:animate-pulse" />
              </div>
            </Button>
          </>
        )}

        {/* Sub-Elements Selection */}
        {viewState === "subelements" && selectedType && selectedType !== "educational" && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              {translations.subElementHint}
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {currentSubElements.map((element) => (
                <Badge
                  key={element}
                  variant={selectedSubElements.includes(element) ? "default" : "outline"}
                  className={cn(
                    "px-3 py-2 text-sm md:text-base cursor-pointer transition-all",
                    selectedSubElements.includes(element) 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-primary/10 hover:border-primary"
                  )}
                  onClick={() => handleSubElementToggle(element)}
                >
                  {getSubElementLabel(element)}
                </Badge>
              ))}
            </div>

            {/* Selected elements display */}
            {selectedSubElements.length > 0 && (
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-primary">
                  {translations.selectedElements}: {selectedSubElements.map(e => getSubElementLabel(e)).join(", ")}
                </p>
              </div>
            )}

            {/* Humor Slider (appears when "humor" is selected) */}
            {selectedType === "humor" && (
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
