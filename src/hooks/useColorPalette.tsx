import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// 5 distinct design palettes
export const PALETTE_COLORS: Record<string, { primary: string; accent: string; bg: string }> = {
  ocean: { primary: 'from-blue-500/30', accent: 'bg-blue-500/20', bg: 'from-blue-50 via-cyan-50 to-sky-50' },
  sunset: { primary: 'from-orange-400/30', accent: 'bg-rose-400/20', bg: 'from-orange-50 via-rose-50 to-pink-50' },
  forest: { primary: 'from-emerald-600/30', accent: 'bg-emerald-500/20', bg: 'from-emerald-50 via-teal-50 to-green-50' },
  lavender: { primary: 'from-purple-400/30', accent: 'bg-indigo-400/20', bg: 'from-purple-50 via-violet-50 to-indigo-50' },
  sunshine: { primary: 'from-amber-400/30', accent: 'bg-yellow-400/20', bg: 'from-amber-50 via-yellow-50 to-orange-50' },
};

const DEFAULT_PALETTE = 'ocean';

export interface ColorPaletteData {
  palette: string;
  colors: { primary: string; accent: string; bg: string };
  isLoading: boolean;
}

export const useColorPalette = (): ColorPaletteData => {
  const { user } = useAuth();
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPalette = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("kid_profiles")
        .select("color_palette")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.color_palette) {
        setPalette(data.color_palette);
      }
      setIsLoading(false);
    };

    loadPalette();
  }, [user]);

  return {
    palette,
    colors: PALETTE_COLORS[palette] || PALETTE_COLORS[DEFAULT_PALETTE],
    isLoading,
  };
};
