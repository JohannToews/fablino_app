import { useState, useEffect, useMemo } from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { cn } from "@/lib/utils";

// Style preview images
import previewStorybookSoft from "@/assets/style-previews/storybook_soft.jpg";
import previewStorybookVibrant from "@/assets/style-previews/storybook_vibrant.jpg";
import previewMangaAnime from "@/assets/style-previews/manga_anime.jpg";
import previewAdventureCartoon from "@/assets/style-previews/adventure_cartoon.jpg";
import previewGraphicNovel from "@/assets/style-previews/graphic_novel.jpg";
import previewSemiRealistic from "@/assets/style-previews/semi_realistic.jpg";
import preview3dAdventure from "@/assets/style-previews/3d_adventure.jpg";
import previewVintageRetro from "@/assets/style-previews/vintage_retro.jpg";

const LOCAL_STYLE_PREVIEWS: Record<string, string> = {
  storybook_soft: previewStorybookSoft,
  storybook_vibrant: previewStorybookVibrant,
  manga_anime: previewMangaAnime,
  adventure_cartoon: previewAdventureCartoon,
  graphic_novel: previewGraphicNovel,
  semi_realistic: previewSemiRealistic,
  "3d_adventure": preview3dAdventure,
  vintage_retro: previewVintageRetro,
};

interface ImageStyle {
  id: string;
  style_key: string;
  labels: Record<string, string>;
  description: Record<string, string>;
  preview_image_url: string | null;
  age_groups: string[];
  default_for_ages: string[] | null;
  sort_order: number | null;
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
  "3d_adventure": "🎥",
  pixel_art: "👾",
  brick_block: "🧱",
  vintage_retro: "📺",
};

const translations: Record<string, {
  header: string;
  recommended: string;
  loading: string;
}> = {
  de: { header: "Welchen Bildstil magst du? 🎨", recommended: "★ Empfohlen", loading: "Stile laden..." },
  fr: { header: "Quel style d'images préfères-tu ? 🎨", recommended: "★ Recommandé", loading: "Chargement..." },
  en: { header: "Which picture style do you like? 🎨", recommended: "★ Recommended", loading: "Loading styles..." },
  es: { header: "¿Qué estilo de imágenes te gusta? 🎨", recommended: "★ Recomendado", loading: "Cargando estilos..." },
  nl: { header: "Welke afbeeldingsstijl vind je leuk? 🎨", recommended: "★ Aanbevolen", loading: "Stijlen laden..." },
  it: { header: "Quale stile di immagini preferisci? 🎨", recommended: "★ Consigliato", loading: "Caricamento stili..." },
  bs: { header: "Koji stil slika ti se sviđa? 🎨", recommended: "★ Preporučeno", loading: "Učitavanje stilova..." },
  tr: { header: "Hangi resim tarzını beğeniyorsun? 🎨", recommended: "★ Önerilen", loading: "Stiller yükleniyor..." },
  bg: { header: "Кой стил на картините харесваш? 🎨", recommended: "★ Препоръчано", loading: "Зареждане на стилове..." },
  ro: { header: "Ce stil de imagini îți place? 🎨", recommended: "★ Recomandat", loading: "Se încarcă stiluri..." },
  pl: { header: "Jaki styl obrazków lubisz? 🎨", recommended: "★ Polecany", loading: "Ładowanie stylów..." },
  lt: { header: "Koks paveikslėlių stilius tau patinka? 🎨", recommended: "★ Rekomenduojama", loading: "Kraunami stiliai..." },
  hu: { header: "Melyik képstílus tetszik? 🎨", recommended: "★ Ajánlott", loading: "Stílusok betöltése..." },
  ca: { header: "Quin estil d'imatges t'agrada? 🎨", recommended: "★ Recomanat", loading: "Carregant estils..." },
  sl: { header: "Kateri slog slik ti je všeč? 🎨", recommended: "★ Priporočeno", loading: "Nalaganje stilov..." },
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

      const filtered = (data || [])
        .filter((s) => (s.age_groups as string[])?.includes(ageGroup))
        .map((s) => ({
          ...s,
          labels: (s.labels ?? {}) as Record<string, string>,
          description: (s.description ?? {}) as Record<string, string>,
          age_groups: s.age_groups as string[],
          default_for_ages: s.default_for_ages as string[] | null,
        }));

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

  const handleTileClick = (styleKey: string) => {
    setSelectedKey(styleKey);
    onSelect(styleKey);
  };

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
      <div className="flex-1 flex flex-col items-stretch px-4 max-w-[480px] mx-auto w-full gap-3 pb-4">
        {/* Fablino Header with inline back button */}
        <FablinoPageHeader
          mascotImage="/mascot/5_Story_erstellen.png"
          message={t.header}
          mascotSize="md"
          showBackButton
          onBack={onBack}
        />

        {/* Style Grid — consistent with theme/character tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
          {styles.map((style) => {
            const isSelected = selectedKey === style.style_key;
            const isDefault = style.style_key === defaultStyleKey;
            const label = style.labels?.[uiLanguage] || style.labels?.de || style.style_key;
            const emoji = STYLE_EMOJIS[style.style_key] || "🖼️";

            return (
              <button
                key={style.style_key}
                onClick={() => handleTileClick(style.style_key)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 p-2.5 rounded-2xl",
                  "bg-white border transition-all duration-200 cursor-pointer",
                  "shadow-[0_2px_12px_-4px_rgba(45,24,16,0.1)]",
                  "hover:shadow-[0_4px_20px_-4px_rgba(45,24,16,0.15)] active:scale-[0.97]",
                  "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2",
                  isSelected
                    ? "ring-2 ring-[#E8863A] border-[#E8863A] bg-orange-50 shadow-[0_4px_20px_-4px_rgba(232,134,58,0.25)]"
                    : "border-[#E8863A]/10 hover:border-[#E8863A]/30"
                )}
              >
                {/* Image / Emoji container — square, same as CharacterTile */}
                <div className="relative w-full overflow-hidden rounded-xl aspect-square">
                  {(LOCAL_STYLE_PREVIEWS[style.style_key] || style.preview_image_url) ? (
                    <img
                      src={LOCAL_STYLE_PREVIEWS[style.style_key] || style.preview_image_url!}
                      alt={label}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : null}
                  {/* Emoji fallback — shown when no preview available */}
                  <div
                    className={cn(
                      "absolute inset-0 items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50",
                      (LOCAL_STYLE_PREVIEWS[style.style_key] || style.preview_image_url) ? "hidden" : "flex"
                    )}
                  >
                    <span className="text-4xl">{emoji}</span>
                  </div>

                  {/* Selection checkmark */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-orange-400/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Recommended badge */}
                  {isDefault && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Label — single line */}
                <span className="font-baloo font-semibold text-center text-[#2D1810] leading-tight text-sm line-clamp-1">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageStylePicker;
