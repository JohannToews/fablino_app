import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CharacterTile from "./CharacterTile";
import VoiceRecordButton from "./VoiceRecordButton";
import { 
  StoryType, 
  StorySubElement,
  EducationalTopic, 
  StoryTypeSelectionTranslations, 
  StoryLength, 
  StoryDifficulty,
  SpecialAttribute,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
} from "./types";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useKidProfile } from "@/hooks/useKidProfile";
import FablinoPageHeader from "@/components/FablinoPageHeader";

// Main category images
import fantasyImg from "@/assets/themes/magic.png";
import actionImg from "@/assets/themes/action.png";
import animalsImg from "@/assets/themes/animals.png";
import everydayImg from "@/assets/themes/friends.png";
import humorImg from "@/assets/themes/chaos.png";
import surpriseBoxImg from "@/assets/themes/surprise.png";

// Educational images
import educationalImg from "@/assets/story-types/educational.jpg";
import musicArtImg from "@/assets/story-types/music-art.jpg";
import otherTopicImg from "@/assets/story-types/other-topic.jpg";
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

// Attribute options for special effects
interface AttributeOption {
  id: SpecialAttribute;
  emoji: string;
  labelKey: string;
}

const attributeOptions: AttributeOption[] = [
  { id: "superpowers", emoji: "🦸", labelKey: "superpowers" },
  { id: "magic", emoji: "✨", labelKey: "magic" },
  { id: "heroes_villains", emoji: "🎭", labelKey: "heroesVillains" },
  { id: "transformations", emoji: "🔮", labelKey: "transformations" },
  { id: "talents", emoji: "🎯", labelKey: "talents" },
  { id: "normal", emoji: "❌", labelKey: "normal" },
];

// Settings translations
const settingsTranslations: Record<string, Record<string, string>> = {
  de: { lengthLabel: 'Länge', short: 'Kurz', medium: 'Mittel', long: 'Lang', difficultyLabel: 'Schwierigkeit', easy: 'Leicht', hard: 'Schwer', seriesLabel: 'Serie', seriesNo: 'Nein', seriesYes: 'Ja', languageLabel: 'Sprache' },
  fr: { lengthLabel: 'Longueur', short: 'Court', medium: 'Moyen', long: 'Long', difficultyLabel: 'Difficulté', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Série', seriesNo: 'Non', seriesYes: 'Oui', languageLabel: 'Langue' },
  en: { lengthLabel: 'Length', short: 'Short', medium: 'Medium', long: 'Long', difficultyLabel: 'Difficulty', easy: 'Easy', hard: 'Hard', seriesLabel: 'Series', seriesNo: 'No', seriesYes: 'Yes', languageLabel: 'Language' },
  es: { lengthLabel: 'Longitud', short: 'Corto', medium: 'Medio', long: 'Largo', difficultyLabel: 'Dificultad', easy: 'Fácil', hard: 'Difícil', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sí', languageLabel: 'Idioma' },
  nl: { lengthLabel: 'Lengte', short: 'Kort', medium: 'Gemiddeld', long: 'Lang', difficultyLabel: 'Moeilijkheid', easy: 'Makkelijk', hard: 'Moeilijk', seriesLabel: 'Serie', seriesNo: 'Nee', seriesYes: 'Ja', languageLabel: 'Taal' },
  it: { lengthLabel: 'Lunghezza', short: 'Breve', medium: 'Medio', long: 'Lungo', difficultyLabel: 'Difficoltà', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sì', languageLabel: 'Lingua' },
  bs: { lengthLabel: 'Dužina', short: 'Kratko', medium: 'Srednje', long: 'Dugo', difficultyLabel: 'Težina', easy: 'Lagano', hard: 'Teško', seriesLabel: 'Serija', seriesNo: 'Ne', seriesYes: 'Da', languageLabel: 'Jezik' },
};

// Attribute label translations
const attributeTranslations: Record<string, Record<string, string>> = {
  de: { superpowers: 'Superkräfte', magic: 'Magische Kräfte', heroesVillains: 'Helden & Bösewichte', transformations: 'Verwandlungen', talents: 'Besondere Talente', normal: 'Nein, ganz normal', effectsHeader: 'Sollen manche Hauptpersonen besondere Eigenschaften haben?', descriptionHeader: 'Optional: Möchtest du noch etwas zur Geschichte sagen?', descriptionPlaceholder: 'z.B. "Eine Geschichte über Piraten auf dem Mond"', voiceHint: 'Sprich deinen Wunsch!' },
  fr: { superpowers: 'Super-pouvoirs', magic: 'Pouvoirs magiques', heroesVillains: 'Héros & Méchants', transformations: 'Transformations', talents: 'Talents spéciaux', normal: 'Non, tout à fait normal', effectsHeader: 'Certains personnages principaux doivent-ils avoir des capacités spéciales?', descriptionHeader: 'Optionnel : Tu veux ajouter quelque chose ?', descriptionPlaceholder: 'p.ex. "Une histoire de pirates sur la lune"', voiceHint: 'Dis ton souhait !' },
  en: { superpowers: 'Superpowers', magic: 'Magical powers', heroesVillains: 'Heroes & Villains', transformations: 'Transformations', talents: 'Special talents', normal: 'No, completely normal', effectsHeader: 'Should some main characters have special abilities?', descriptionHeader: 'Optional: Would you like to add anything?', descriptionPlaceholder: 'e.g. "A story about pirates on the moon"', voiceHint: 'Speak your wish!' },
  es: { superpowers: 'Superpoderes', magic: 'Poderes mágicos', heroesVillains: 'Héroes y villanos', transformations: 'Transformaciones', talents: 'Talentos especiales', normal: 'No, completamente normal', effectsHeader: '¿Deberían algunos personajes principales tener habilidades especiales?', descriptionHeader: 'Opcional: ¿Quieres añadir algo?', descriptionPlaceholder: 'p.ej. "Una historia de piratas en la luna"', voiceHint: '¡Di tu deseo!' },
  nl: { superpowers: 'Superkrachten', magic: 'Magische krachten', heroesVillains: 'Helden & Schurken', transformations: 'Transformaties', talents: 'Speciale talenten', normal: 'Nee, helemaal normaal', effectsHeader: 'Moeten sommige hoofdpersonen speciale eigenschappen hebben?', descriptionHeader: 'Optioneel: Wil je nog iets toevoegen?', descriptionPlaceholder: 'bijv. "Een verhaal over piraten op de maan"', voiceHint: 'Spreek je wens uit!' },
  it: { superpowers: 'Superpoteri', magic: 'Poteri magici', heroesVillains: 'Eroi e cattivi', transformations: 'Trasformazioni', talents: 'Talenti speciali', normal: 'No, del tutto normale', effectsHeader: 'Alcuni personaggi principali dovrebbero avere abilità speciali?', descriptionHeader: 'Opzionale: Vuoi aggiungere qualcosa?', descriptionPlaceholder: 'es. "Una storia di pirati sulla luna"', voiceHint: 'Pronuncia il tuo desiderio!' },
  bs: { superpowers: 'Supermoći', magic: 'Magične moći', heroesVillains: 'Heroji i zlikovci', transformations: 'Transformacije', talents: 'Posebni talenti', normal: 'Ne, sasvim normalno', effectsHeader: 'Trebaju li neki glavni likovi imati posebne sposobnosti?', descriptionHeader: 'Opcionalno: Želiš li dodati nešto?', descriptionPlaceholder: 'npr. "Priča o piratima na mjesecu"', voiceHint: 'Izgovori svoju želju!' },
};

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
    selectedSubElements?: StorySubElement[],
    attributes?: SpecialAttribute[],
    additionalDescription?: string
  ) => void;
  onBack: () => void;
  fablinoMessage?: string;
  isAdmin?: boolean;
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
  isAdmin = false,
}: StoryTypeSelectionScreenProps) => {
  const { colors } = useColorPalette();
  const { kidAppLanguage, kidReadingLanguage } = useKidProfile();
  const [viewState, setViewState] = useState<ViewState>("main");
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  
  // Story settings
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");
  const [isSeries, setIsSeries] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<string>(defaultLanguage);

  // Special attributes & description (merged from SpecialEffectsScreen)
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState("");

  const st = settingsTranslations[kidAppLanguage] || settingsTranslations.de;
  const at = attributeTranslations[kidAppLanguage] || attributeTranslations.de;

  const mainCategoryTiles = [
    { type: "fantasy" as StoryType, image: fantasyImg, label: translations.fantasy },
    { type: "action" as StoryType, image: actionImg, label: translations.action },
    { type: "animals" as StoryType, image: animalsImg, label: translations.animals },
    { type: "everyday" as StoryType, image: everydayImg, label: translations.everyday },
    { type: "humor" as StoryType, image: humorImg, label: translations.humor },
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
    if (type === "educational") {
      setSelectedType(type);
      setViewState("educational");
    } else {
      // Select/deselect – don't immediately complete
      setSelectedType(selectedType === type ? null : type);
    }
  };

  const toggleAttribute = (attr: SpecialAttribute) => {
    if (attr === "normal") {
      setSelectedAttributes(["normal"]);
    } else {
      setSelectedAttributes((prev) => {
        const filtered = prev.filter((a) => a !== "normal");
        if (filtered.includes(attr)) {
          return filtered.filter((a) => a !== attr);
        }
        return [...filtered, attr];
      });
    }
  };

  const handleContinue = () => {
    if (!selectedType) return;
    
    const settings: StorySettings = {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
      storyLanguage,
    };

    if (selectedType === "educational" && selectedTopic) {
      onComplete(selectedType, settings, undefined, selectedTopic, customTopic.trim() || undefined, [], selectedAttributes, additionalDescription.trim());
    } else {
      onComplete(selectedType, settings, undefined, undefined, undefined, [], selectedAttributes, additionalDescription.trim());
    }
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
    if (!selectedType) return false;
    if (selectedType === "educational") {
      if (!selectedTopic) return false;
      if (selectedTopic === "other" && !customTopic.trim()) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      {/* Back button */}
      <div className="px-4 pt-3 pb-0">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-stretch px-5 max-w-[600px] mx-auto w-full gap-3 pb-6">
        {/* Fablino Header */}
        {fablinoMessage && (
          <FablinoPageHeader
            mascotImage="/mascot/6_Onboarding.png"
            message={fablinoMessage}
            mascotSize="md"
          />
        )}

        {/* Main Category Grid – 3x2 */}
        {viewState === "main" && (
          <>
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

            {/* Settings + Effects (visible after genre selected) */}
            {selectedType && (
              <div className="animate-fade-in space-y-3">
                {/* Settings Card */}
                <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-sm p-3 space-y-2">
                  {/* Length */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#92400E] w-24 shrink-0">{st.lengthLabel}</span>
                    <div className="flex-1 flex gap-1.5 bg-orange-50/60 rounded-xl p-1">
                      {(["short", "medium", "long"] as StoryLength[]).map((len) => (
                        <button
                          key={len}
                          onClick={() => setStoryLength(len)}
                          className={cn(
                            "flex-1 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium text-center",
                            storyLength === len
                              ? "bg-[#E8863A] text-white shadow-sm"
                              : "text-[#2D1810]/70 hover:text-[#2D1810] hover:bg-white/60"
                          )}
                        >
                          {len === "short" ? st.short : len === "medium" ? st.medium : st.long}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-orange-100/60" />

                  {/* Difficulty */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#92400E] w-24 shrink-0">{st.difficultyLabel}</span>
                    <div className="flex-1 flex gap-1.5 bg-orange-50/60 rounded-xl p-1">
                      {(["easy", "medium", "hard"] as StoryDifficulty[]).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setStoryDifficulty(diff)}
                          className={cn(
                            "flex-1 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium text-center",
                            storyDifficulty === diff
                              ? "bg-[#E8863A] text-white shadow-sm"
                              : "text-[#2D1810]/70 hover:text-[#2D1810] hover:bg-white/60"
                          )}
                        >
                          {diff === "easy" ? st.easy : diff === "medium" ? st.medium : st.hard}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  {availableLanguages.length > 0 && (
                    <>
                      <div className="border-t border-orange-100/60" />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#92400E] w-24 shrink-0">{st.languageLabel}</span>
                        <div className="flex-1 flex gap-1.5 flex-wrap bg-orange-50/60 rounded-xl p-1">
                          {availableLanguages.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setStoryLanguage(lang)}
                              className={cn(
                                "flex-1 min-w-0 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium text-center",
                                storyLanguage === lang
                                  ? "bg-[#E8863A] text-white shadow-sm"
                                  : "text-[#2D1810]/70 hover:text-[#2D1810] hover:bg-white/60"
                              )}
                            >
                              {LANGUAGE_FLAGS[lang] || ''} {LANGUAGE_LABELS[lang]?.[kidAppLanguage] || lang.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Series Toggle (admin only) */}
                  {isAdmin && (
                    <>
                      <div className="border-t border-orange-100/60" />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#92400E] w-24 shrink-0">{st.seriesLabel}</span>
                        <div className="flex-1 flex gap-1.5 bg-orange-50/60 rounded-xl p-1">
                          {[false, true].map((val) => (
                            <button
                              key={String(val)}
                              onClick={() => setIsSeries(val)}
                              className={cn(
                                "flex-1 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium text-center",
                                isSeries === val
                                  ? "bg-[#E8863A] text-white shadow-sm"
                                  : "text-[#2D1810]/70 hover:text-[#2D1810] hover:bg-white/60"
                              )}
                            >
                              {val ? st.seriesYes : st.seriesNo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Special Attributes */}
                <div className="w-full space-y-1.5">
                  <h2 className="text-sm font-semibold text-center text-[#2D1810]">
                    {at.effectsHeader}
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {attributeOptions.map((option) => {
                      const isSelected = selectedAttributes.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleAttribute(option.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full py-2.5 rounded-2xl",
                            "transition-all duration-150 cursor-pointer",
                            "hover:scale-105 active:scale-95",
                            "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1",
                            isSelected
                              ? "border-2 border-[#E8863A] bg-[#FFF8F0] shadow-sm"
                              : "border border-gray-200 bg-white hover:border-[#E8863A]/30"
                          )}
                        >
                          <span className="text-2xl leading-none">{option.emoji}</span>
                          <span className="text-[11px] font-medium text-center leading-tight text-[#2D1810]">
                            {at[option.labelKey] || option.labelKey}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Description */}
                <div className="w-full space-y-1.5">
                  <h2 className="text-sm font-semibold text-center text-[#2D1810]">
                    {at.descriptionHeader}
                  </h2>
                  <div className="relative">
                    <Textarea
                      value={additionalDescription}
                      onChange={(e) => setAdditionalDescription(e.target.value)}
                      placeholder={at.descriptionPlaceholder}
                      className="min-h-[56px] text-sm resize-none rounded-xl border border-gray-200 focus:border-[#E8863A] pr-16"
                    />
                    <div className="absolute right-2 bottom-2">
                      <VoiceRecordButton
                        language={storyLanguage}
                        onTranscript={(text) => {
                          setAdditionalDescription((prev) => prev ? `${prev} ${text}` : text);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!canContinue()}
                  className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors disabled:opacity-50"
                >
                  {translations.continue} →
                </button>
              </div>
            )}
          </>
        )}

        {/* Educational Topics */}
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
