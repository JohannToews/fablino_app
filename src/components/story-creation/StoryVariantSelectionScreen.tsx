import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FablinoPageHeader from "@/components/FablinoPageHeader";

// ---------------------------------------------------------------------------
// FSE3 Variant type (mirrors backend FSE3Variant from fse3Types.ts)
// ---------------------------------------------------------------------------

export interface FSE3Variant {
  id: "A" | "B" | "C";
  visible: {
    emoji: string;
    title: string;
    teaser: string;
  };
  routing: {
    primary_driver: "humor" | "suspense" | "empathy" | "adventure";
    subtype_key: string;
    conflict_type: string;
    one_line_summary: string;
  };
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const translations: Record<string, {
  header: string;
  loading: string;
}> = {
  de: { header: "Welche Geschichte soll es werden?", loading: "Deine Geschichten werden vorbereitet..." },
  fr: { header: "Quelle histoire veux-tu ?", loading: "Tes histoires sont en pr\u00e9paration..." },
  en: { header: "Which story do you want?", loading: "Your stories are being prepared..." },
  es: { header: "\u00bfQu\u00e9 historia quieres?", loading: "Tus historias se est\u00e1n preparando..." },
  nl: { header: "Welk verhaal wil je?", loading: "Je verhalen worden voorbereid..." },
  it: { header: "Quale storia vuoi?", loading: "Le tue storie vengono preparate..." },
  bs: { header: "Koju pri\u010du \u017eeli\u0161?", loading: "Tvoje pri\u010de se pripremaju..." },
  tr: { header: "Hangi hikayeyi istiyorsun?", loading: "Hikayelerin haz\u0131rlan\u0131yor..." },
  bg: { header: "\u041a\u043e\u044f \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u0438\u0441\u043a\u0430\u0448?", loading: "\u0422\u0432\u043e\u0438\u0442\u0435 \u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0441\u0435 \u043f\u043e\u0434\u0433\u043e\u0442\u0432\u044f\u0442..." },
  ro: { header: "Ce poveste vrei?", loading: "Pove\u0219tile tale se preg\u0103tesc..." },
  pl: { header: "Kt\u00f3r\u0105 histori\u0119 wybierasz?", loading: "Twoje historie s\u0105 przygotowywane..." },
  lt: { header: "Kuri\u0105 istorij\u0105 nori?", loading: "Tavo istorijos ruo\u0161iamos..." },
  hu: { header: "Melyik t\u00f6rt\u00e9netet szeretn\u00e9d?", loading: "A t\u00f6rt\u00e9neteid k\u00e9sz\u00fclnek..." },
  ca: { header: "Quina hist\u00f2ria vols?", loading: "Les teves hist\u00f2ries s'estan preparant..." },
  sl: { header: "Katero zgodbo \u017eeli\u0161?", loading: "Tvoje zgodbe se pripravljajo..." },
  pt: { header: "Que hist\u00f3ria queres?", loading: "As tuas hist\u00f3rias est\u00e3o a ser preparadas..." },
  sk: { header: "Ktor\u00fd pr\u00edbeh chce\u0161?", loading: "Tvoje pr\u00edbehy sa pripravuj\u00fa..." },
  uk: { header: "\u042f\u043a\u0443 \u0456\u0441\u0442\u043e\u0440\u0456\u044e \u0445\u043e\u0447\u0435\u0448?", loading: "\u0422\u0432\u043e\u0457 \u0456\u0441\u0442\u043e\u0440\u0456\u0457 \u0433\u043e\u0442\u0443\u044e\u0442\u044c\u0441\u044f..." },
  ru: { header: "\u041a\u0430\u043a\u0443\u044e \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u0445\u043e\u0447\u0435\u0448\u044c?", loading: "\u0422\u0432\u043e\u0438 \u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0433\u043e\u0442\u043e\u0432\u044f\u0442\u0441\u044f..." },
};

// Subtle tint per card to make them visually distinct
const CARD_TINTS = [
  "border-amber-200/80 bg-amber-50/40",
  "border-sky-200/80 bg-sky-50/40",
  "border-rose-200/80 bg-rose-50/40",
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StoryVariantSelectionScreenProps {
  variants: FSE3Variant[];
  onVariantSelected: (variant: FSE3Variant) => void;
  onBack: () => void;
  isLoading?: boolean;
  storyLanguage: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StoryVariantSelectionScreen = ({
  variants,
  onVariantSelected,
  onBack,
  isLoading = false,
  storyLanguage,
}: StoryVariantSelectionScreenProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const t = translations[storyLanguage] || translations.de;

  const handleTap = (variant: FSE3Variant) => {
    if (selectedId) return; // prevent double-tap
    setSelectedId(variant.id);

    // Short highlight delay, then callback
    setTimeout(() => {
      onVariantSelected(variant);
    }, 350);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-stretch px-4 max-w-[480px] mx-auto w-full gap-3 pb-4">
        {/* Fablino Header with back button */}
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={t.header}
          mascotSize="sm"
          showBackButton
          onBack={onBack}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border-2 border-border/50 p-5",
                  "bg-muted/30 animate-pulse",
                )}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Emoji skeleton */}
                  <div className="w-10 h-10 rounded-xl bg-muted/60 shrink-0" />
                  <div className="flex-1 space-y-2">
                    {/* Title skeleton */}
                    <div className="h-5 bg-muted/60 rounded-lg w-3/4" />
                    {/* Teaser skeleton */}
                    <div className="h-4 bg-muted/50 rounded-lg w-full" />
                    <div className="h-4 bg-muted/50 rounded-lg w-2/3" />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.loading}
            </p>
          </div>
        )}

        {/* Variant Cards */}
        {!isLoading && variants.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {variants.map((variant, index) => {
              const isSelected = selectedId === variant.id;
              const isOther = selectedId !== null && !isSelected;

              return (
                <button
                  key={variant.id}
                  onClick={() => handleTap(variant)}
                  disabled={selectedId !== null}
                  aria-label={`${variant.visible.emoji} ${variant.visible.title}: ${variant.visible.teaser}`}
                  className={cn(
                    // Base
                    "w-full text-left rounded-2xl border-2 p-4 sm:p-5",
                    "transition-all duration-300 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
                    // Tint
                    CARD_TINTS[index] || CARD_TINTS[0],
                    // Staggered entrance
                    "animate-fade-in opacity-0",
                    // Interaction states
                    !selectedId && "hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] cursor-pointer",
                    // Selected state
                    isSelected && "ring-2 ring-[#E8863A] border-[#E8863A] scale-[1.03] shadow-xl bg-orange-50/60",
                    // Dimmed state (other cards when one is selected)
                    isOther && "opacity-40 scale-[0.97]",
                  )}
                  style={{
                    animationDelay: `${index * 120}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji */}
                    <span
                      className={cn(
                        "text-3xl sm:text-4xl shrink-0 leading-none mt-0.5",
                        "transition-transform duration-300",
                        isSelected && "scale-110",
                      )}
                      aria-hidden="true"
                    >
                      {variant.visible.emoji}
                    </span>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          "font-baloo font-bold text-base sm:text-lg leading-snug",
                          isSelected ? "text-[#E8863A]" : "text-foreground",
                        )}
                      >
                        {variant.visible.title}
                      </h3>
                      <p className="font-nunito text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
                        {variant.visible.teaser}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryVariantSelectionScreen;
