import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SpecialAttribute, StoryLength, StoryDifficulty, LANGUAGE_FLAGS, LANGUAGE_LABELS } from "./types";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import FablinoMascot from "@/components/FablinoMascot";
import VoiceRecordButton from "./VoiceRecordButton";

interface SpecialEffectsTranslations {
  header: string;
  effectsHeader: string;
  effectsHint: string;
  superpowers: string;
  magic: string;
  heroesVillains: string;
  transformations: string;
  talents: string;
  normal: string;
  descriptionHeader: string;
  descriptionPlaceholder: string;
  continue: string;
  back: string;
}

const translations: Record<string, SpecialEffectsTranslations> = {
  de: {
    header: "Spezialeffekte & Details",
    effectsHeader: "Sollen manche Hauptpersonen besondere Eigenschaften haben?",
    effectsHint: "Wähle beliebig viele aus",
    superpowers: "Superkräfte",
    magic: "Magische Kräfte",
    heroesVillains: "Helden & Bösewichte",
    transformations: "Verwandlungen",
    talents: "Besondere Talente",
    normal: "Nein, ganz normal",
    descriptionHeader: "Optional: Möchtest du noch etwas zur Geschichte sagen?",
    descriptionPlaceholder: "z.B. \"Eine Geschichte über Piraten auf dem Mond\"",
    continue: "Geschichte erstellen",
    back: "Zurück",
  },
  fr: {
    header: "Effets spéciaux & Détails",
    effectsHeader: "Certains personnages principaux doivent-ils avoir des capacités spéciales?",
    effectsHint: "Choisis autant que tu veux",
    superpowers: "Super-pouvoirs",
    magic: "Pouvoirs magiques",
    heroesVillains: "Héros & Méchants",
    transformations: "Transformations",
    talents: "Talents spéciaux",
    normal: "Non, tout à fait normal",
    descriptionHeader: "Optionnel : Tu veux ajouter quelque chose ?",
    descriptionPlaceholder: "p.ex. \"Une histoire de pirates sur la lune\"",
    continue: "Créer l'histoire",
    back: "Retour",
  },
  en: {
    header: "Special Effects & Details",
    effectsHeader: "Should some main characters have special abilities?",
    effectsHint: "Choose as many as you like",
    superpowers: "Superpowers",
    magic: "Magical powers",
    heroesVillains: "Heroes & Villains",
    transformations: "Transformations",
    talents: "Special talents",
    normal: "No, completely normal",
    descriptionHeader: "Optional: Would you like to add anything?",
    descriptionPlaceholder: "e.g. \"A story about pirates on the moon\"",
    continue: "Create story",
    back: "Back",
  },
  es: {
    header: "Efectos especiales y detalles",
    effectsHeader: "¿Deberían algunos personajes principales tener habilidades especiales?",
    effectsHint: "Elige tantos como quieras",
    superpowers: "Superpoderes",
    magic: "Poderes mágicos",
    heroesVillains: "Héroes y villanos",
    transformations: "Transformaciones",
    talents: "Talentos especiales",
    normal: "No, completamente normal",
    descriptionHeader: "Opcional: ¿Quieres añadir algo?",
    descriptionPlaceholder: "p.ej. \"Una historia de piratas en la luna\"",
    continue: "Crear historia",
    back: "Atrás",
  },
  nl: {
    header: "Speciale effecten & Details",
    effectsHeader: "Moeten sommige hoofdpersonen speciale eigenschappen hebben?",
    effectsHint: "Kies er zoveel als je wilt",
    superpowers: "Superkrachten",
    magic: "Magische krachten",
    heroesVillains: "Helden & Schurken",
    transformations: "Transformaties",
    talents: "Speciale talenten",
    normal: "Nee, helemaal normaal",
    descriptionHeader: "Optioneel: Wil je nog iets toevoegen?",
    descriptionPlaceholder: "bijv. \"Een verhaal over piraten op de maan\"",
    continue: "Verhaal maken",
    back: "Terug",
  },
  it: {
    header: "Effetti speciali e dettagli",
    effectsHeader: "Alcuni personaggi principali dovrebbero avere abilità speciali?",
    effectsHint: "Scegli quanti ne vuoi",
    superpowers: "Superpoteri",
    magic: "Poteri magici",
    heroesVillains: "Eroi e cattivi",
    transformations: "Trasformazioni",
    talents: "Talenti speciali",
    normal: "No, del tutto normale",
    descriptionHeader: "Opzionale: Vuoi aggiungere qualcosa?",
    descriptionPlaceholder: "es. \"Una storia di pirati sulla luna\"",
    continue: "Crea storia",
    back: "Indietro",
  },
  bs: {
    header: "Specijalni efekti i detalji",
    effectsHeader: "Trebaju li neki glavni likovi imati posebne sposobnosti?",
    effectsHint: "Odaberi koliko želiš",
    superpowers: "Supermoći",
    magic: "Magične moći",
    heroesVillains: "Heroji i zlikovci",
    transformations: "Transformacije",
    talents: "Posebni talenti",
    normal: "Ne, sasvim normalno",
    descriptionHeader: "Opcionalno: Želiš li dodati nešto?",
    descriptionPlaceholder: "npr. \"Priča o piratima na mjesecu\"",
    continue: "Kreiraj priču",
    back: "Nazad",
  },
};

interface AttributeOption {
  id: SpecialAttribute;
  emoji: string;
  labelKey: keyof SpecialEffectsTranslations;
}

const attributeOptions: AttributeOption[] = [
  { id: "superpowers", emoji: "🦸", labelKey: "superpowers" },
  { id: "magic", emoji: "✨", labelKey: "magic" },
  { id: "heroes_villains", emoji: "🎭", labelKey: "heroesVillains" },
  { id: "transformations", emoji: "🔮", labelKey: "transformations" },
  { id: "talents", emoji: "🎯", labelKey: "talents" },
  { id: "normal", emoji: "❌", labelKey: "normal" },
];

// Settings translations (reused from StoryTypeSelectionScreen, inline for independence)
const settingsTranslations: Record<string, Record<string, string>> = {
  de: { lengthLabel: 'Länge', short: 'Kurz', medium: 'Mittel', long: 'Lang', difficultyLabel: 'Schwierigkeit', easy: 'Leicht', hard: 'Schwer', seriesLabel: 'Serie', seriesNo: 'Nein', seriesYes: 'Ja', languageLabel: 'Sprache' },
  fr: { lengthLabel: 'Longueur', short: 'Court', medium: 'Moyen', long: 'Long', difficultyLabel: 'Difficulté', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Série', seriesNo: 'Non', seriesYes: 'Oui', languageLabel: 'Langue' },
  en: { lengthLabel: 'Length', short: 'Short', medium: 'Medium', long: 'Long', difficultyLabel: 'Difficulty', easy: 'Easy', hard: 'Hard', seriesLabel: 'Series', seriesNo: 'No', seriesYes: 'Yes', languageLabel: 'Language' },
  es: { lengthLabel: 'Longitud', short: 'Corto', medium: 'Medio', long: 'Largo', difficultyLabel: 'Dificultad', easy: 'Fácil', hard: 'Difícil', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sí', languageLabel: 'Idioma' },
  nl: { lengthLabel: 'Lengte', short: 'Kort', medium: 'Gemiddeld', long: 'Lang', difficultyLabel: 'Moeilijkheid', easy: 'Makkelijk', hard: 'Moeilijk', seriesLabel: 'Serie', seriesNo: 'Nee', seriesYes: 'Ja', languageLabel: 'Taal' },
  it: { lengthLabel: 'Lunghezza', short: 'Breve', medium: 'Medio', long: 'Lungo', difficultyLabel: 'Difficoltà', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sì', languageLabel: 'Lingua' },
  bs: { lengthLabel: 'Dužina', short: 'Kratko', medium: 'Srednje', long: 'Dugo', difficultyLabel: 'Težina', easy: 'Lagano', hard: 'Teško', seriesLabel: 'Serija', seriesNo: 'Ne', seriesYes: 'Da', languageLabel: 'Jezik' },
};

export interface StorySettingsFromEffects {
  length: StoryLength;
  difficulty: StoryDifficulty;
  isSeries: boolean;
  storyLanguage: string;
}

interface SpecialEffectsScreenProps {
  onComplete: (attributes: SpecialAttribute[], additionalDescription: string, settings?: StorySettingsFromEffects) => void;
  onBack: () => void;
  /** When true, show length/difficulty/series/language settings (used by Weg A "free path") */
  showSettings?: boolean;
  availableLanguages?: string[];
  defaultLanguage?: string;
  fablinoMessage?: string;
}

const SpecialEffectsScreen = ({
  onComplete,
  onBack,
  showSettings = false,
  availableLanguages = [],
  defaultLanguage = 'fr',
  fablinoMessage,
}: SpecialEffectsScreenProps) => {
  const { kidAppLanguage, kidReadingLanguage } = useKidProfile();
  const t = translations[kidAppLanguage] || translations.de;
  const st = settingsTranslations[kidAppLanguage] || settingsTranslations.de;
  
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState("");
  
  // Settings state (only used when showSettings = true, i.e. Weg A)
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");
  const [isSeries, setIsSeries] = useState(false);
  const [storyLanguage, setStoryLanguage] = useState<string>(defaultLanguage);

  const toggleAttribute = (attr: SpecialAttribute) => {
    if (attr === "normal") {
      // "Normal" clears other selections
      setSelectedAttributes(["normal"]);
    } else {
      setSelectedAttributes((prev) => {
        // Remove "normal" if selecting something else
        const filtered = prev.filter((a) => a !== "normal");
        if (filtered.includes(attr)) {
          return filtered.filter((a) => a !== attr);
        }
        return [...filtered, attr];
      });
    }
  };

  const handleContinue = () => {
    if (showSettings) {
      onComplete(selectedAttributes, additionalDescription.trim(), {
        length: storyLength,
        difficulty: storyDifficulty,
        isSeries,
        storyLanguage,
      });
    } else {
      onComplete(selectedAttributes, additionalDescription.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      {/* Back button */}
      <div className="px-4 pt-3 pb-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Vertically centered content – consistent with all other screens */}
      <div className="flex-1 flex flex-col items-stretch px-5 max-w-[600px] mx-auto w-full gap-4 pb-6">
        {/* Fablino Header – identical to Home, Entry, Theme screens */}
        {fablinoMessage && (
          <FablinoPageHeader
            mascotImage="/mascot/5_new_story.png"
            message={fablinoMessage}
            mascotSize="md"
          />
        )}

        {/* Story Settings (only for Weg A / free path) – compact toggle rows */}
        {showSettings && (
          <div className="w-full space-y-2">
            {/* Length */}
            <div className="flex items-center gap-3 justify-between">
              <span className="text-sm font-medium text-[#2D1810] shrink-0">{st.lengthLabel}</span>
              <div className="inline-flex gap-1">
                {(["short", "medium", "long"] as StoryLength[]).map((len) => (
                  <button
                    key={len}
                    onClick={() => setStoryLength(len)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-xl transition-colors",
                      storyLength === len
                        ? "bg-[#E8863A] text-white"
                        : "bg-white border border-gray-200 text-[#2D1810] hover:border-[#E8863A]/30"
                    )}
                  >
                    {len === "short" ? st.short : len === "medium" ? st.medium : st.long}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-3 justify-between">
              <span className="text-sm font-medium text-[#2D1810] shrink-0">{st.difficultyLabel}</span>
              <div className="inline-flex gap-1">
                {(["easy", "medium", "hard"] as StoryDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setStoryDifficulty(diff)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-xl transition-colors",
                      storyDifficulty === diff
                        ? "bg-[#E8863A] text-white"
                        : "bg-white border border-gray-200 text-[#2D1810] hover:border-[#E8863A]/30"
                    )}
                  >
                    {diff === "easy" ? st.easy : diff === "medium" ? st.medium : st.hard}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            {availableLanguages.length > 0 && (
              <div className="flex items-center gap-3 justify-between">
                <span className="text-sm font-medium text-[#2D1810] shrink-0">{st.languageLabel}</span>
                <div className="inline-flex gap-1 flex-wrap">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setStoryLanguage(lang)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-xl transition-colors",
                        storyLanguage === lang
                          ? "bg-[#E8863A] text-white"
                          : "bg-white border border-gray-200 text-[#2D1810] hover:border-[#E8863A]/30"
                      )}
                    >
                      {LANGUAGE_FLAGS[lang] || ''} {LANGUAGE_LABELS[lang]?.[kidAppLanguage] || lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Attributes – compact square grid */}
        <div className="w-full space-y-2">
          <h2 className="text-sm font-semibold text-center text-[#2D1810]">
            {t.effectsHeader}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {attributeOptions.map((option) => {
              const isSelected = selectedAttributes.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleAttribute(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 w-full py-4 rounded-2xl",
                    "transition-all duration-150 cursor-pointer",
                    "hover:scale-105 active:scale-95",
                    "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1",
                    isSelected
                      ? "border-2 border-[#E8863A] bg-[#FFF8F0] shadow-sm"
                      : "border border-gray-200 bg-white hover:border-[#E8863A]/30"
                  )}
                >
                  <span className="text-3xl leading-none">{option.emoji}</span>
                  <span className="text-xs font-medium text-center leading-tight text-[#2D1810]">
                    {t[option.labelKey]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


        {/* Additional Description – compact */}
        <div className="w-full space-y-2">
          <h2 className="text-sm font-semibold text-center text-[#2D1810]">
            {t.descriptionHeader}
          </h2>
          <div className="relative">
            <Textarea
              value={additionalDescription}
              onChange={(e) => setAdditionalDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              className="min-h-[56px] text-sm resize-none rounded-xl border border-gray-200 focus:border-[#E8863A] pr-16"
            />
            <div className="absolute right-2 bottom-2">
              <VoiceRecordButton
                language={showSettings ? storyLanguage : (kidReadingLanguage || 'de')}
                onTranscript={(text) => {
                  setAdditionalDescription((prev) => prev ? `${prev} ${text}` : text);
                }}
              />
            </div>
          </div>
        </div>

        {/* Create Story Button – orange, inline (not fixed) */}
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors"
        >
          {t.continue} ✨
        </button>
      </div>
    </div>
  );
};

export default SpecialEffectsScreen;
