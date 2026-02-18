import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { cn } from "@/lib/utils";

interface ImageStyle {
  id: string;
  style_key: string;
  labels: Record<string, string>;
  description: Record<string, string>;
  preview_image_url: string | null;
  age_groups: string[];
  default_for_ages: string[];
  sort_order: number;
}

interface ImageStylePickerProps {
  kidAge: number;
  kidProfileImageStyle: string | null | undefined;
  uiLanguage: string;
  onSelect: (styleKey: string) => void;
  onBack: () => void;
}

const STYLE_EMOJIS: Record<string, string> = {
  storybook_soft: "🎨",
  storybook_vibrant: "🌈",
  manga_anime: "⚡",
  adventure_cartoon: "🦸",
  graphic_novel: "🎬",
  semi_realistic: "✨",
};

const translations: Record<string, {
  header: string;
  recommended: string;
  select: string;
  back: string;
  loading: string;
}> = {
  de: { header: "Welchen Bildstil magst du?", recommended: "Empfohlen", select: "Weiter", back: "Zurück", loading: "Stile laden..." },
  fr: { header: "Quel style d'images préfères-tu ?", recommended: "Recommandé", select: "Continuer", back: "Retour", loading: "Chargement..." },
  en: { header: "Which picture style do you like?", recommended: "Recommended", select: "Continue", back: "Back", loading: "Loading styles..." },
  es: { header: "¿Qué estilo de imágenes te gusta?", recommended: "Recomendado", select: "Continuar", back: "Volver", loading: "Cargando estilos..." },
  nl: { header: "Welke afbeeldingsstijl vind je leuk?", recommended: "Aanbevolen", select: "Verder", back: "Terug", loading: "Stijlen laden..." },
  it: { header: "Quale stile di immagini preferisci?", recommended: "Consigliato", select: "Continua", back: "Indietro", loading: "Caricamento stili..." },
  bs: { header: "Koji stil slika ti se sviđa?", recommended: "Preporučeno", select: "Nastavi", back: "Nazad", loading: "Učitavanje stilova..." },
};

function getAgeGroup(age: number): string {
  if (age <= 7) return "6-7";
  if (age <= 9) return "8-9";
  return "10-11";
}

const ImageStylePicker: React.FC<ImageStylePickerProps> = ({
  kidAge,
  kidProfileImageStyle,
  uiLanguage,
  onSelect,
  onBack,
}) => {
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const t = translations[uiLanguage] || translations.de;
  const ageGroup = getAgeGroup(kidAge);

  useEffect(() => {
    const loadStyles = async () => {
      const { data, error } = await supabase
        .from("image_styles")
        .select("id, style_key, labels, description, preview_image_url, age_groups, default_for_ages, sort_order")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("[ImageStylePicker] Error loading styles:", error);
        setLoading(false);
        return;
      }

      const filtered = (data || []).filter((s: any) =>
        s.age_groups?.includes(ageGroup)
      );

      setStyles(filtered);

      const preferredMatch = kidProfileImageStyle
        ? filtered.find((s: any) => s.style_key === kidProfileImageStyle)
        : null;

      if (preferredMatch) {
        setSelectedKey(preferredMatch.style_key);
      } else {
        const defaultMatch = filtered.find((s: any) =>
          s.default_for_ages?.includes(ageGroup)
        );
        setSelectedKey(defaultMatch?.style_key || filtered[0]?.style_key || null);
      }

      setLoading(false);
    };

    loadStyles();
  }, [ageGroup, kidProfileImageStyle]);

  const defaultStyleKey = useMemo(() => {
    const match = styles.find(s => s.default_for_ages?.includes(ageGroup));
    return match?.style_key || null;
  }, [styles, ageGroup]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-3 px-4 max-w-lg mx-auto w-full">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#2D1810]" />
        </button>
      </div>

      <div className="px-4 max-w-lg mx-auto w-full">
        <FablinoPageHeader
          mascotImage="/mascot/5_Story_erstellen.png"
          message={t.header}
          mascotSize="sm"
        />
      </div>

      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => {
            const isSelected = selectedKey === style.style_key;
            const isDefault = style.style_key === defaultStyleKey;
            const label = style.labels?.[uiLanguage] || style.labels?.de || style.style_key;
            const desc = style.description?.[uiLanguage] || style.description?.de || "";
            const emoji = STYLE_EMOJIS[style.style_key] || "🖼️";

            return (
              <button
                key={style.style_key}
                onClick={() => setSelectedKey(style.style_key)}
                className={cn(
                  "relative rounded-2xl p-4 text-left transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98] focus:outline-none",
                  isSelected
                    ? "bg-white ring-2 ring-primary shadow-md"
                    : "bg-white/70 hover:bg-white shadow-sm"
                )}
              >
                {isDefault && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {t.recommended}
                  </div>
                )}

                <div className="flex items-center justify-center h-16 mb-2">
                  {style.preview_image_url ? (
                    <img
                      src={style.preview_image_url}
                      alt={label}
                      className="h-16 w-16 object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-4xl">{emoji}</span>
                  )}
                </div>

                <h3
                  className="font-baloo font-bold text-sm leading-tight"
                  style={{ color: "#2D1810" }}
                >
                  {label}
                </h3>

                <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: "#6B7280" }}>
                  {desc}
                </p>

                {isSelected && (
                  <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6 max-w-lg mx-auto w-full">
        <Button
          onClick={() => selectedKey && onSelect(selectedKey)}
          disabled={!selectedKey}
          className="w-full btn-primary-kid text-base py-5"
        >
          {t.select}
        </Button>
      </div>
    </div>
  );
};

export default ImageStylePicker;
