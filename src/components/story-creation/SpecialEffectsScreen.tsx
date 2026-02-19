import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SpecialAttribute, StoryLength, StoryDifficulty, LANGUAGE_FLAGS, LANGUAGE_LABELS } from "./types";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useStoryLengthOptions } from "@/hooks/useStoryLengthOptions";
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
  continueEpisode1: string;
  seriesHint: string;
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
    continueEpisode1: "Episode 1 erstellen",
    seriesHint: "Du startest eine Serie mit 5 Episoden. Die Charaktere und die Welt bleiben gleich.",
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
    continueEpisode1: "Créer l'épisode 1",
    seriesHint: "Tu commences une série de 5 épisodes. Les personnages et le monde restent les mêmes.",
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
    continueEpisode1: "Create Episode 1",
    seriesHint: "You're starting a series with 5 episodes. Characters and the world stay the same.",
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
    continueEpisode1: "Crear episodio 1",
    seriesHint: "Comienzas una serie de 5 episodios. Los personajes y el mundo permanecen iguales.",
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
    continueEpisode1: "Maak aflevering 1",
    seriesHint: "Je start een serie van 5 afleveringen. De personages en de wereld blijven hetzelfde.",
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
    continueEpisode1: "Crea episodio 1",
    seriesHint: "Inizi una serie di 5 episodi. I personaggi e il mondo rimangono gli stessi.",
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
    continueEpisode1: "Kreiraj epizodu 1",
    seriesHint: "Pokrećeš seriju od 5 epizoda. Likovi i svijet ostaju isti.",
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
  de: { lengthLabel: 'Länge', short: 'Kurz', medium: 'Mittel', long: 'Lang', extra_long: 'Extra-Lang', difficultyLabel: 'Schwierigkeit', easy: 'Leicht', hard: 'Schwer', seriesLabel: 'Serie', seriesNo: 'Nein', seriesYes: 'Ja', languageLabel: 'Sprache', seriesModeNormal: 'Normale Serie', seriesModeNormalDesc: 'Die Geschichte fließt von Episode zu Episode', seriesModeInteractive: 'Mitgestalten', seriesModeInteractiveDesc: 'Dein Kind entscheidet am Ende jeder Episode wie es weitergeht' },
  fr: { lengthLabel: 'Longueur', short: 'Court', medium: 'Moyen', long: 'Long', extra_long: 'Très long', difficultyLabel: 'Difficulté', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Série', seriesNo: 'Non', seriesYes: 'Oui', languageLabel: 'Langue', seriesModeNormal: 'Série normale', seriesModeNormalDesc: "L'histoire suit son cours d'épisode en épisode", seriesModeInteractive: 'Participer', seriesModeInteractiveDesc: "Ton enfant décide comment l'histoire continue" },
  en: { lengthLabel: 'Length', short: 'Short', medium: 'Medium', long: 'Long', extra_long: 'Extra Long', difficultyLabel: 'Difficulty', easy: 'Easy', hard: 'Hard', seriesLabel: 'Series', seriesNo: 'No', seriesYes: 'Yes', languageLabel: 'Language', seriesModeNormal: 'Normal Series', seriesModeNormalDesc: 'The story flows from episode to episode', seriesModeInteractive: 'Co-create', seriesModeInteractiveDesc: 'Your child decides how the story continues' },
  es: { lengthLabel: 'Longitud', short: 'Corto', medium: 'Medio', long: 'Largo', extra_long: 'Extra largo', difficultyLabel: 'Dificultad', easy: 'Fácil', hard: 'Difícil', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sí', languageLabel: 'Idioma', seriesModeNormal: 'Serie normal', seriesModeNormalDesc: 'La historia fluye de episodio en episodio', seriesModeInteractive: 'Co-crear', seriesModeInteractiveDesc: 'Tu hijo decide cómo continúa la historia' },
  nl: { lengthLabel: 'Lengte', short: 'Kort', medium: 'Gemiddeld', long: 'Lang', extra_long: 'Extra lang', difficultyLabel: 'Moeilijkheid', easy: 'Makkelijk', hard: 'Moeilijk', seriesLabel: 'Serie', seriesNo: 'Nee', seriesYes: 'Ja', languageLabel: 'Taal', seriesModeNormal: 'Normale serie', seriesModeNormalDesc: 'Het verhaal vloeit van aflevering naar aflevering', seriesModeInteractive: 'Meebeslissen', seriesModeInteractiveDesc: 'Je kind beslist hoe het verder gaat' },
  it: { lengthLabel: 'Lunghezza', short: 'Breve', medium: 'Medio', long: 'Lungo', extra_long: 'Extra lungo', difficultyLabel: 'Difficoltà', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Serie', seriesNo: 'No', seriesYes: 'Sì', languageLabel: 'Lingua', seriesModeNormal: 'Serie normale', seriesModeNormalDesc: 'La storia scorre da episodio a episodio', seriesModeInteractive: 'Co-creare', seriesModeInteractiveDesc: 'Il tuo bambino decide come continua la storia' },
  bs: { lengthLabel: 'Dužina', short: 'Kratko', medium: 'Srednje', long: 'Dugo', extra_long: 'Ekstra dugo', difficultyLabel: 'Težina', easy: 'Lagano', hard: 'Teško', seriesLabel: 'Serija', seriesNo: 'Ne', seriesYes: 'Da', languageLabel: 'Jezik', seriesModeNormal: 'Normalna serija', seriesModeNormalDesc: 'Priča teče od epizode do epizode', seriesModeInteractive: 'Sustvaranje', seriesModeInteractiveDesc: 'Tvoje dijete odlučuje kako priča nastavlja' },
};

export interface StorySettingsFromEffects {
  length: StoryLength;
  difficulty: StoryDifficulty;
  isSeries: boolean;
  seriesMode?: 'normal' | 'interactive';
  storyLanguage: string;
}

interface SpecialEffectsScreenProps {
  onComplete: (attributes: SpecialAttribute[], additionalDescription: string, settings?: StorySettingsFromEffects) => void;
  onBack: () => void;
  /** When true, show length/difficulty/series/language settings (used by Weg A "free path") */
  showSettings?: boolean;
  /** When true, show series toggle (admin only) */
  isAdmin?: boolean;
  availableLanguages?: string[];
  defaultLanguage?: string;
  fablinoMessage?: string;
}

const LENGTH_CARD_EMOJIS: Record<string, string> = {
  short: "📖",
  medium: "📚",
  long: "📚📚",
  extra_long: "📚📚📚",
};

const SpecialEffectsScreen = ({
  onComplete,
  onBack,
  showSettings = false,
  isAdmin = false,
  availableLanguages = [],
  defaultLanguage = 'fr',
  fablinoMessage,
}: SpecialEffectsScreenProps) => {
  const { kidAppLanguage, kidReadingLanguage, selectedProfile } = useKidProfile();
  const t = translations[kidAppLanguage] || translations.de;
  const st = settingsTranslations[kidAppLanguage] || settingsTranslations.de;

  // Load generation config from DB based on kid's age
  const { options: lengthOptions, defaultLength, loading: lengthLoading } = useStoryLengthOptions(selectedProfile?.age);
  
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState("");
  
  // Settings state (only used when showSettings = true, i.e. Weg A)
  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");

  // Set default length from DB when loaded
  const [defaultApplied, setDefaultApplied] = useState(false);
  if (!defaultApplied && !lengthLoading && defaultLength) {
    setStoryLength(defaultLength as StoryLength);
    setDefaultApplied(true);
  }
  const [isSeries, setIsSeries] = useState(false);
  const [seriesMode, setSeriesMode] = useState<'normal' | 'interactive'>('normal');
  const [storyLanguage, setStoryLanguage] = useState<string>(defaultLanguage);

  const toggleAttribute = (attr: SpecialAttribute) => {
    if (attr === "normal") {
      // Toggle "normal": if already selected, deselect; otherwise clear others
      setSelectedAttributes((prev) =>
        prev.includes("normal") ? [] : ["normal"]
      );
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
    // Always pass settings (Length, Difficulty, Language, Series)
    onComplete(selectedAttributes, additionalDescription.trim(), {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
      seriesMode: isSeries ? seriesMode : undefined,
      storyLanguage,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-2 pb-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Vertically centered content – consistent with all other screens */}
      <div className="flex-1 flex flex-col items-stretch px-5 max-w-[600px] mx-auto w-full gap-2.5 pb-4">
        {/* Fablino Header – identical to Home, Entry, Theme screens */}
        <FablinoPageHeader
          mascotImage="/mascot/5_new_story.png"
          message={fablinoMessage || t.effectsHeader}
          mascotSize="md"
        />

        {/* Story Settings (only for Weg A / free path) – compact toggle rows */}
        {true && (
          <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-sm p-3 space-y-2">
            {/* Length — dynamic from generation_config */}
            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-[#92400E]">{st.lengthLabel}</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(lengthOptions.length > 0
                  ? lengthOptions.map((opt) => ({
                      key: opt.story_length as StoryLength,
                      label: (opt.length_labels as Record<string, string>)?.[kidAppLanguage]
                        || (opt.length_labels as Record<string, string>)?.de
                        || opt.story_length,
                      desc: (opt.length_description as Record<string, string>)?.[kidAppLanguage]
                        || (opt.length_description as Record<string, string>)?.de
                        || "",
                      images: opt.scene_image_count + (opt.include_cover ? 1 : 0),
                    }))
                  : (["short", "medium", "long", "extra_long"] as StoryLength[]).map((len) => ({
                      key: len,
                      label: len === "short" ? st.short : len === "medium" ? st.medium : len === "long" ? st.long : st.extra_long,
                      desc: "",
                      images: 0,
                    }))
                ).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStoryLength(item.key)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl transition-all duration-200 text-center",
                      storyLength === item.key
                        ? "bg-[#E8863A] text-white shadow-md scale-[1.02]"
                        : "bg-orange-50/60 text-[#2D1810]/70 hover:bg-white/80 hover:text-[#2D1810]"
                    )}
                  >
                    <span className="text-lg leading-none">{LENGTH_CARD_EMOJIS[item.key] || "📖"}</span>
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    {item.desc && <span className="text-[10px] opacity-80 leading-tight">{item.desc}</span>}
                    {item.images > 0 && (
                      <span className="text-[10px] opacity-70 leading-tight">{item.images} Bilder</span>
                    )}
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

            {/* Series Toggle – only inside settings panel */}
            {showSettings && (
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
        )}

        {/* Series Toggle for Admin (standalone, for Weg B where showSettings is false) */}
        {!showSettings && isAdmin && (
          <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-sm p-3">
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
          </div>
        )}

        {/* Series Mode Toggle (normal vs interactive) – shown when series is active */}
        {isAdmin && isSeries && (
          <div className="w-full space-y-2 animate-fade-in">
            <button
              onClick={() => setSeriesMode('normal')}
              className={cn(
                "w-full text-left p-3 rounded-2xl border-2 transition-all duration-200",
                seriesMode === 'normal'
                  ? "border-[#E8863A] bg-white shadow-md"
                  : "border-orange-100 bg-white/70 hover:border-orange-200"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">📖</span>
                <div>
                  <p className="text-sm font-semibold text-[#2D1810]">{st.seriesModeNormal}</p>
                  <p className="text-xs text-[#2D1810]/60 mt-0.5">{st.seriesModeNormalDesc}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSeriesMode('interactive')}
              className={cn(
                "w-full text-left p-3 rounded-2xl border-2 transition-all duration-200",
                seriesMode === 'interactive'
                  ? "border-[#E8863A] bg-white shadow-md"
                  : "border-orange-100 bg-white/70 hover:border-orange-200"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">✨</span>
                <div>
                  <p className="text-sm font-semibold text-[#2D1810]">
                    {st.seriesModeInteractive}
                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white">Premium</span>
                  </p>
                  <p className="text-xs text-[#2D1810]/60 mt-0.5">{st.seriesModeInteractiveDesc}</p>
                </div>
              </div>
            </button>
          </div>
        )}
        <div className="w-full space-y-1.5">
          <h2 className="text-sm font-semibold text-center text-[#2D1810]">
            {t.effectsHeader}
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
                       : "border border-gray-200 bg-white hover:border-gray-300"
                   )}
                 >
                  <span className="text-2xl leading-none">{option.emoji}</span>
                  <span className="text-[11px] font-medium text-center leading-tight text-[#2D1810]">
                    {t[option.labelKey]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


        {/* Additional Description – compact */}
        <div className="w-full space-y-1.5">
          <h2 className="text-sm font-semibold text-center text-[#2D1810]">
            {t.descriptionHeader}
          </h2>
          <Textarea
            value={additionalDescription}
            onChange={(e) => setAdditionalDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            className="min-h-[72px] text-sm resize-none rounded-xl border border-gray-200 focus:border-[#E8863A]"
          />
          <div className="flex justify-center pt-1">
            <VoiceRecordButton
              language={storyLanguage || kidReadingLanguage || 'de'}
              onTranscript={(text) => {
                setAdditionalDescription((prev) => prev ? `${prev} ${text}` : text);
              }}
            />
          </div>
        </div>

        {/* Series hint – shown when series toggle is active */}
        {isSeries && (
          <p className="text-xs text-center text-[#92400E]/70 bg-orange-50/80 rounded-xl px-3 py-2 border border-orange-100/60">
            {t.seriesHint}
          </p>
        )}

        {/* Create Story Button – orange, inline (not fixed) */}
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors"
        >
          {isSeries ? t.continueEpisode1 : t.continue} ✨
        </button>
      </div>
    </div>
  );
};

export default SpecialEffectsScreen;
