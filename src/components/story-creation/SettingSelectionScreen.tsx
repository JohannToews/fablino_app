import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import CharacterTile from "./CharacterTile";
import { LocationType, TimePeriod, SettingSelectionTranslations } from "./types";
import { cn } from "@/lib/utils";

// Location images
import deepseaImg from "@/assets/settings/deepsea.jpg";
import mountainsImg from "@/assets/settings/mountains.jpg";
import spaceImg from "@/assets/settings/space.jpg";
import castleImg from "@/assets/settings/castle.jpg";
import jungleImg from "@/assets/settings/jungle.jpg";
import homeImg from "@/assets/settings/home.jpg";
import surpriseBoxImg from "@/assets/characters/surprise-box.jpg";

// Timeline images
import dinosaursImg from "@/assets/timeline/dinosaurs.jpg";
import stoneageImg from "@/assets/timeline/stoneage.jpg";
import egyptImg from "@/assets/timeline/egypt.jpg";
import piratesImg from "@/assets/timeline/pirates.jpg";
import medievalImg from "@/assets/timeline/medieval.jpg";
import wildwestImg from "@/assets/timeline/wildwest.jpg";
import vintageImg from "@/assets/timeline/vintage.jpg";
import todayImg from "@/assets/timeline/today.jpg";
import nearfutureImg from "@/assets/timeline/nearfuture.jpg";
import farfutureImg from "@/assets/timeline/farfuture.jpg";

interface SettingSelectionScreenProps {
  translations: SettingSelectionTranslations;
  onComplete: (locations: LocationType[], timePeriod: TimePeriod) => void;
  onBack: () => void;
}

const MAX_LOCATIONS = 3;

const SettingSelectionScreen = ({
  translations,
  onComplete,
  onBack,
}: SettingSelectionScreenProps) => {
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(7); // "today" is index 7

  const locationTiles = [
    { type: "deepsea" as LocationType, image: deepseaImg, label: translations.deepsea },
    { type: "mountains" as LocationType, image: mountainsImg, label: translations.mountains },
    { type: "space" as LocationType, image: spaceImg, label: translations.space },
    { type: "magic" as LocationType, image: castleImg, label: translations.magicWorlds },
    { type: "nature" as LocationType, image: jungleImg, label: translations.nature },
    { type: "home" as LocationType, image: homeImg, label: translations.home },
    { type: "surprise" as LocationType, image: surpriseBoxImg, label: translations.surprise, badge: "⭐" },
  ];

  const timelineTiles = [
    { type: "dinosaurs" as TimePeriod, image: dinosaursImg, label: translations.dinosaurs, emoji: "🦕" },
    { type: "stoneage" as TimePeriod, image: stoneageImg, label: translations.stoneage, emoji: "🔥" },
    { type: "egypt" as TimePeriod, image: egyptImg, label: translations.egypt, emoji: "🏺" },
    { type: "pirates" as TimePeriod, image: piratesImg, label: translations.pirates, emoji: "🏴‍☠️" },
    { type: "medieval" as TimePeriod, image: medievalImg, label: translations.medieval, emoji: "🏰" },
    { type: "wildwest" as TimePeriod, image: wildwestImg, label: translations.wildwest, emoji: "🤠" },
    { type: "vintage" as TimePeriod, image: vintageImg, label: translations.vintage, emoji: "🚗" },
    { type: "today" as TimePeriod, image: todayImg, label: translations.today, emoji: "📱" },
    { type: "nearfuture" as TimePeriod, image: nearfutureImg, label: translations.nearfuture, emoji: "🤖" },
    { type: "farfuture" as TimePeriod, image: farfutureImg, label: translations.farfuture, emoji: "🚀" },
  ];

  const selectedTime = timelineTiles[currentTimeIndex].type;
  const selectedTimeData = timelineTiles[currentTimeIndex];

  const handleLocationClick = (type: LocationType) => {
    if (type === "surprise") {
      // Random selection
      const randomLocations = locationTiles
        .filter(t => t.type !== "surprise")
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 1)
        .map(t => t.type);
      setSelectedLocations(randomLocations);
      
      // Random time
      const randomTimeIndex = Math.floor(Math.random() * timelineTiles.length);
      setCurrentTimeIndex(randomTimeIndex);
      
      toast.success("🎲 Zufällig ausgewählt!");
      return;
    }

    setSelectedLocations(prev => {
      if (prev.includes(type)) {
        return prev.filter(l => l !== type);
      }
      if (prev.length >= MAX_LOCATIONS) {
        toast.error(translations.maxLocations);
        return prev;
      }
      return [...prev, type];
    });
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentTimeIndex(value[0]);
  };

  const handleContinue = () => {
    if (selectedLocations.length === 0) {
      toast.error("Bitte wähle mindestens einen Ort aus");
      return;
    }
    onComplete(selectedLocations, selectedTime);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-2 md:py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base md:text-lg font-baloo font-bold flex-1">
            {translations.header}
          </h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4 space-y-4 md:space-y-6">
        {/* Part A: Location Selection */}
        <section className="space-y-2 md:space-y-3">
          <h2 className="text-base md:text-lg font-baloo font-semibold text-center">
            {translations.locationHeader}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            {translations.maxLocations}
          </p>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {locationTiles.map((tile) => (
              <CharacterTile
                key={tile.type}
                image={tile.image}
                label={tile.label}
                onClick={() => handleLocationClick(tile.type)}
                selected={selectedLocations.includes(tile.type)}
                badge={tile.badge}
                size="small"
              />
            ))}
          </div>
        </section>

        {/* Part B: Time Selection with Slider */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-baloo font-semibold text-center">
            {translations.timeHeader}
          </h2>

          {/* Selected Time Display */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden shadow-lg border-2 border-primary">
              <img
                src={selectedTimeData.image}
                alt={selectedTimeData.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-sm md:text-lg">
                {selectedTimeData.emoji}
              </div>
            </div>
            <span className="font-baloo text-sm md:text-base font-semibold text-primary">
              {selectedTimeData.label}
            </span>
          </div>

          {/* Timeline Slider with Image Markers */}
          <div className="px-2">
            {/* Image markers above slider */}
            <div className="flex justify-between mb-2 md:mb-3 px-1">
              {timelineTiles.map((tile, index) => (
                <button
                  key={tile.type}
                  onClick={() => setCurrentTimeIndex(index)}
                  className={cn(
                    "relative w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg overflow-hidden transition-all duration-200",
                    "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary",
                    currentTimeIndex === index
                      ? "ring-2 ring-primary scale-110 shadow-md"
                      : "opacity-50 hover:opacity-80"
                  )}
                >
                  <img
                    src={tile.image}
                    alt={tile.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Slider */}
            <Slider
              value={[currentTimeIndex]}
              onValueChange={handleSliderChange}
              min={0}
              max={timelineTiles.length - 1}
              step={1}
              className="w-full"
            />

            {/* Labels for first and last */}
            <div className="flex justify-between mt-1.5 md:mt-2 text-[10px] md:text-xs text-muted-foreground">
              <span>{timelineTiles[0].emoji} {timelineTiles[0].label}</span>
              <span>{timelineTiles[timelineTiles.length - 1].label} {timelineTiles[timelineTiles.length - 1].emoji}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4">
          <Button
            onClick={handleContinue}
            disabled={selectedLocations.length === 0}
            className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg font-baloo bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {translations.continue} →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingSelectionScreen;

