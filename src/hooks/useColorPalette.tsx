import { useKidProfile } from "@/hooks/useKidProfile";

// 5 distinct design palettes
export const PALETTE_COLORS: Record<string, { primary: string; accent: string; bg: string; overlay: string }> = {
  ocean: { primary: 'from-blue-500/30', accent: 'bg-blue-500/20', bg: 'from-blue-50 via-cyan-50 to-sky-50', overlay: 'bg-blue-200/15' },
  sunset: { primary: 'from-orange-400/30', accent: 'bg-rose-400/20', bg: 'from-orange-50 via-rose-50 to-pink-50', overlay: 'bg-rose-200/15' },
  forest: { primary: 'from-emerald-600/30', accent: 'bg-emerald-500/20', bg: 'from-emerald-50 via-teal-50 to-green-50', overlay: 'bg-emerald-200/15' },
  lavender: { primary: 'from-purple-400/30', accent: 'bg-indigo-400/20', bg: 'from-purple-50 via-violet-50 to-indigo-50', overlay: 'bg-violet-200/15' },
  sunshine: { primary: 'from-amber-400/30', accent: 'bg-yellow-400/20', bg: 'from-amber-50 via-yellow-50 to-orange-50', overlay: 'bg-amber-200/15' },
};

const DEFAULT_PALETTE = 'ocean';

export interface ColorPaletteData {
  palette: string;
  colors: { primary: string; accent: string; bg: string; overlay: string };
  isLoading: boolean;
}

export const useColorPalette = (): ColorPaletteData => {
  const { selectedProfile, isLoading } = useKidProfile();
  
  const palette = selectedProfile?.color_palette || DEFAULT_PALETTE;

  return {
    palette,
    colors: PALETTE_COLORS[palette] || PALETTE_COLORS[DEFAULT_PALETTE],
    isLoading,
  };
};
