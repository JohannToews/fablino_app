/**
 * FablinoMascot – Reusable mascot image component with consistent sizing.
 * Use this on every page that shows the Fablino fox.
 *
 * Sizes (max-height, sourced from design tokens):
 *   sm  = 64px   → inline-Nutzung, kleine Hinweise
 *   md  = 100px  (default) → Standard auf allen Seiten
 *   lg  = 130px  → nur Home-Screen Hero
 *
 * On a tablet (1024×768) the fox should never exceed ~15% viewport height.
 */
import { FABLINO_SIZES } from "@/constants/design-tokens";

type FablinoSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<FablinoSize, { maxHeight: string; width: string }> = {
  sm: { maxHeight: `${FABLINO_SIZES.mascot.sm}px`, width: "auto" },
  md: { maxHeight: `${FABLINO_SIZES.mascot.md}px`, width: "auto" },
  lg: { maxHeight: `${FABLINO_SIZES.mascot.lg}px`, width: "auto" },
};

interface FablinoMascotProps {
  src: string;
  size?: FablinoSize;
  className?: string;
  bounce?: boolean;
}

const FablinoMascot = ({
  src,
  size = "md",
  className = "",
  bounce = true,
}: FablinoMascotProps) => {
  const sizeStyle = SIZE_MAP[size];

  return (
    <img
      src={src}
      alt="Fablino"
      data-mascot
      className={`flex-shrink-0 object-contain drop-shadow-md ${className}`}
      style={{
        maxHeight: sizeStyle.maxHeight,
        width: sizeStyle.width,
        height: "auto",
        animation: bounce ? "gentleBounce 2.2s ease-in-out infinite" : "none",
      }}
    />
  );
};

export default FablinoMascot;
export type { FablinoSize };
