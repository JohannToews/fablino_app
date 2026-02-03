import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Book, Star } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useColorPalette } from "@/hooks/useColorPalette";
import SelectableTile from "@/components/create-story/SelectableTile";
import TileGrid from "@/components/create-story/TileGrid";
import SectionHeader from "@/components/create-story/SectionHeader";
import SegmentButton from "@/components/create-story/SegmentButton";
import CustomInputDialog from "@/components/create-story/CustomInputDialog";
import { storyCreatorTranslations } from "@/components/create-story/storyCreatorTranslations";

// Character options with emojis
const characterOptions = [
  { id: "boy", icon: "👦" },
  { id: "girl", icon: "👧" },
  { id: "dog", icon: "🐕" },
  { id: "hero", icon: "🦸" },
  { id: "wizard", icon: "🧙" },
  { id: "family", icon: "👨‍👩‍👧" },
  { id: "robot", icon: "🤖" },
  { id: "other", icon: "➕" },
];

// Location options
const locationOptions = [
  { id: "home", icon: "🏠" },
  { id: "school", icon: "🏫" },
  { id: "forest", icon: "🌳" },
  { id: "castle", icon: "🏰" },
  { id: "space", icon: "🚀" },
  { id: "beach", icon: "🏖️" },
  { id: "dream", icon: "🌙" },
  { id: "other", icon: "➕" },
];

// Theme options
const themeOptions = [
  { id: "adventure", icon: "🔍" },
  { id: "dragon", icon: "🐉" },
  { id: "surprise", icon: "🎁" },
  { id: "mystery", icon: "👻" },
  { id: "race", icon: "🏆" },
  { id: "magic", icon: "💫" },
  { id: "circus", icon: "🎪" },
  { id: "other", icon: "➕" },
];

interface SelectedCharacter {
  id: string;
  name?: string;
  customLabel?: string;
}

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { kidAppLanguage } = useKidProfile();
  const { colors: paletteColors } = useColorPalette();
  const t = storyCreatorTranslations[kidAppLanguage] || storyCreatorTranslations.de;

  // State
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState<string>("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [customTheme, setCustomTheme] = useState<string>("");
  const [length, setLength] = useState("medium");
  const [difficulty, setDifficulty] = useState("easy");

  // Dialog state
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  // Handlers
  const toggleCharacter = (id: string) => {
    if (id === "other") {
      setCharacterDialogOpen(true);
      return;
    }
    
    setSelectedCharacters((prev) => {
      const exists = prev.find((c) => c.id === id);
      if (exists) {
        return prev.filter((c) => c.id !== id);
      }
      if (prev.length >= 3) return prev; // Max 3 characters
      return [...prev, { id }];
    });
  };

  const updateCharacterName = (id: string, name: string) => {
    setSelectedCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const addCustomCharacter = (label: string) => {
    if (selectedCharacters.length >= 3) return;
    const customId = `custom-${Date.now()}`;
    setSelectedCharacters((prev) => [...prev, { id: customId, customLabel: label }]);
  };

  const selectLocation = (id: string) => {
    if (id === "other") {
      setLocationDialogOpen(true);
      return;
    }
    setSelectedLocation(id);
    setCustomLocation("");
  };

  const addCustomLocation = (label: string) => {
    setCustomLocation(label);
    setSelectedLocation("custom");
  };

  const toggleTheme = (id: string) => {
    if (id === "other") {
      setThemeDialogOpen(true);
      return;
    }
    
    setSelectedThemes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((t) => t !== id);
      }
      if (prev.length >= 2) return prev; // Max 2 themes
      return [...prev, id];
    });
  };

  const addCustomTheme = (label: string) => {
    if (selectedThemes.length >= 2) return;
    setCustomTheme(label);
    setSelectedThemes((prev) => [...prev.filter(t => t !== "custom"), "custom"]);
  };

  // Can create story?
  const canCreate = selectedCharacters.length > 0 && (selectedLocation || customLocation) && selectedThemes.length > 0;

  // Get label for option
  const getCharacterLabel = (id: string) => {
    const custom = selectedCharacters.find(c => c.id === id && c.customLabel);
    if (custom?.customLabel) return custom.customLabel;
    return t[id as keyof typeof t] as string || id;
  };

  const getLocationLabel = (id: string) => {
    if (id === "custom") return customLocation;
    return t[id as keyof typeof t] as string || id;
  };

  const getThemeLabel = (id: string) => {
    if (id === "custom") return customTheme;
    return t[id as keyof typeof t] as string || id;
  };

  // Length options with icons
  const lengthOptions = [
    { value: "short", label: <><Book className="h-4 w-4" /><span className="sr-only">{t.short}</span></> },
    { value: "medium", label: <><Book className="h-5 w-5" /><span className="sr-only">{t.medium}</span></> },
    { value: "long", label: <><Book className="h-6 w-6" /><span className="sr-only">{t.long}</span></> },
  ];

  // Difficulty options with stars
  const difficultyOptions = [
    { value: "easy", label: <Star className="h-4 w-4 fill-current" /> },
    { value: "medium", label: <div className="flex gap-0.5"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div> },
    { value: "difficult", label: <div className="flex gap-0.5"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div> },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-baloo font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t.title}
          </h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Characters Section */}
        <section className="bg-card/50 rounded-3xl p-4 shadow-soft">
          <SectionHeader icon="🎭" title={t.charactersTitle} />
          <TileGrid>
            {characterOptions.map((opt) => {
              const isCustom = opt.id.startsWith("custom-");
              const selected = selectedCharacters.some((c) => c.id === opt.id);
              return (
                <SelectableTile
                  key={opt.id}
                  icon={opt.icon}
                  label={getCharacterLabel(opt.id)}
                  selected={selected}
                  onClick={() => toggleCharacter(opt.id)}
                  disabled={!selected && selectedCharacters.length >= 3 && opt.id !== "other"}
                />
              );
            })}
            {/* Show custom characters */}
            {selectedCharacters
              .filter((c) => c.id.startsWith("custom-"))
              .map((c) => (
                <SelectableTile
                  key={c.id}
                  icon="✨"
                  label={c.customLabel || ""}
                  selected={true}
                  onClick={() => setSelectedCharacters((prev) => prev.filter((x) => x.id !== c.id))}
                />
              ))}
          </TileGrid>

          {/* Name inputs for selected characters */}
          {selectedCharacters.filter(c => !c.id.startsWith("custom-")).length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedCharacters.filter(c => !c.id.startsWith("custom-")).map((char) => (
                <div key={char.id} className="flex items-center gap-2 bg-background/50 rounded-xl p-2">
                  <span className="text-lg">
                    {characterOptions.find((o) => o.id === char.id)?.icon}
                  </span>
                  <Input
                    placeholder={t.namePlaceholder}
                    value={char.name || ""}
                    onChange={(e) => updateCharacterName(char.id, e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm h-8"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Location Section */}
        <section className="bg-card/50 rounded-3xl p-4 shadow-soft">
          <SectionHeader icon="🌍" title={t.locationTitle} />
          <TileGrid>
            {locationOptions.map((opt) => (
              <SelectableTile
                key={opt.id}
                icon={opt.icon}
                label={getLocationLabel(opt.id)}
                selected={selectedLocation === opt.id}
                onClick={() => selectLocation(opt.id)}
              />
            ))}
            {/* Show custom location if set */}
            {customLocation && (
              <SelectableTile
                icon="📍"
                label={customLocation}
                selected={selectedLocation === "custom"}
                onClick={() => {
                  setCustomLocation("");
                  setSelectedLocation(null);
                }}
              />
            )}
          </TileGrid>
        </section>

        {/* Theme Section */}
        <section className="bg-card/50 rounded-3xl p-4 shadow-soft">
          <SectionHeader icon="⚡" title={t.themeTitle} />
          <TileGrid>
            {themeOptions.map((opt) => (
              <SelectableTile
                key={opt.id}
                icon={opt.icon}
                label={getThemeLabel(opt.id)}
                selected={selectedThemes.includes(opt.id)}
                onClick={() => toggleTheme(opt.id)}
                disabled={!selectedThemes.includes(opt.id) && selectedThemes.length >= 2 && opt.id !== "other"}
              />
            ))}
            {/* Show custom theme if set */}
            {customTheme && (
              <SelectableTile
                icon="🌟"
                label={customTheme}
                selected={selectedThemes.includes("custom")}
                onClick={() => {
                  setCustomTheme("");
                  setSelectedThemes((prev) => prev.filter((t) => t !== "custom"));
                }}
              />
            )}
          </TileGrid>
        </section>

        {/* Settings Section */}
        <section className="bg-card/50 rounded-3xl p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t.length}</span>
              <SegmentButton
                options={lengthOptions}
                value={length}
                onChange={setLength}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t.difficulty}</span>
              <SegmentButton
                options={difficultyOptions}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>
        </section>

        {/* Create Button */}
        <Button
          onClick={() => {
            // Build the story prompt from selections
            const characterDescriptions = selectedCharacters.map((c) => {
              if (c.customLabel) return c.customLabel;
              const label = t[c.id as keyof typeof t] as string;
              return c.name ? `${label} namens ${c.name}` : label;
            }).join(", ");
            
            const locationDesc = customLocation || (t[selectedLocation as keyof typeof t] as string);
            
            const themeDescs = selectedThemes.map((th) => 
              th === "custom" ? customTheme : (t[th as keyof typeof t] as string)
            ).join(" und ");

            console.log({
              characters: characterDescriptions,
              location: locationDesc,
              themes: themeDescs,
              length,
              difficulty,
            });
            // TODO: Navigate to story generation with these params
          }}
          disabled={!canCreate}
          className="w-full h-16 text-xl font-baloo bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-105 shadow-lg rounded-2xl"
        >
          <Sparkles className="h-6 w-6 mr-2" />
          {t.createStory}
        </Button>
      </div>

      {/* Custom Input Dialogs */}
      <CustomInputDialog
        open={characterDialogOpen}
        onOpenChange={setCharacterDialogOpen}
        title={t.customCharacterTitle}
        placeholder={t.customCharacterPlaceholder}
        onSubmit={addCustomCharacter}
        submitLabel={t.add}
      />
      <CustomInputDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        title={t.customLocationTitle}
        placeholder={t.customLocationPlaceholder}
        onSubmit={addCustomLocation}
        submitLabel={t.add}
      />
      <CustomInputDialog
        open={themeDialogOpen}
        onOpenChange={setThemeDialogOpen}
        title={t.customThemeTitle}
        placeholder={t.customThemePlaceholder}
        onSubmit={addCustomTheme}
        submitLabel={t.add}
      />
    </div>
  );
};

export default CreateStoryPage;
