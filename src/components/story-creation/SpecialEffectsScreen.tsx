import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VoiceInputField from "@/components/VoiceInputField";
import { SpecialAttribute } from "./types";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";

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
    descriptionHeader: "Möchtest du noch etwas zur Geschichte sagen?",
    descriptionPlaceholder: "z.B. Es soll um einen verlorenen Schatz gehen...",
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
    descriptionHeader: "Tu veux ajouter quelque chose à l'histoire?",
    descriptionPlaceholder: "p.ex. Il devrait s'agir d'un trésor perdu...",
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
    descriptionHeader: "Would you like to add anything to the story?",
    descriptionPlaceholder: "e.g. It should be about a lost treasure...",
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
    descriptionHeader: "¿Quieres añadir algo a la historia?",
    descriptionPlaceholder: "p.ej. Debería tratarse de un tesoro perdido...",
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
    descriptionHeader: "Wil je nog iets toevoegen aan het verhaal?",
    descriptionPlaceholder: "bijv. Het moet gaan over een verloren schat...",
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
    descriptionHeader: "Vuoi aggiungere qualcosa alla storia?",
    descriptionPlaceholder: "es. Dovrebbe riguardare un tesoro perduto...",
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
    descriptionHeader: "Želiš li dodati nešto priči?",
    descriptionPlaceholder: "npr. Trebalo bi biti o izgubljenom blagu...",
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

interface SpecialEffectsScreenProps {
  onComplete: (attributes: SpecialAttribute[], additionalDescription: string) => void;
  onBack: () => void;
}

const SpecialEffectsScreen = ({
  onComplete,
  onBack,
}: SpecialEffectsScreenProps) => {
  const { kidAppLanguage } = useKidProfile();
  const t = translations[kidAppLanguage] || translations.de;
  
  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState("");

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
    onComplete(selectedAttributes, additionalDescription.trim());
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
            {t.header}
          </h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-4 md:py-6 space-y-6 md:space-y-8">
        {/* Special Effects Checkboxes */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-baloo font-semibold text-center">
            {t.effectsHeader}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            {t.effectsHint}
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {attributeOptions.map((option) => {
              const isSelected = selectedAttributes.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleAttribute(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl md:rounded-2xl",
                    "border-2 transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-3xl md:text-4xl">{option.emoji}</span>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={isSelected} 
                      className="pointer-events-none"
                    />
                    <span className="text-xs md:text-sm font-medium text-center">
                      {t[option.labelKey]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Additional Description with Voice Input */}
        <section className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-baloo font-semibold text-center">
            {t.descriptionHeader}
          </h2>
          
          <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-5 border border-border">
            <VoiceInputField
              value={additionalDescription}
              onChange={setAdditionalDescription}
              placeholder={t.descriptionPlaceholder}
              language={kidAppLanguage}
              multiline
            />
          </div>
        </section>
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <div className="container max-w-3xl mx-auto px-4 py-3 md:py-4">
          <Button
            onClick={handleContinue}
            className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg font-baloo bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {t.continue} ✨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpecialEffectsScreen;
