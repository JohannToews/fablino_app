/**
 * SpeechBubble – Reusable speech bubble next to Fablino mascot.
 * Consistent styling across all pages.
 *
 * Variants:
 *   hero – large white bubble with left-pointing triangle (default)
 *   tip  – smaller orange-tinted bubble, no triangle
 */
import { FABLINO_SIZES, FABLINO_COLORS } from "@/constants/design-tokens";

interface SpeechBubbleProps {
  children: React.ReactNode;
  variant?: "hero" | "tip";
}

const SpeechBubble = ({ children, variant = "hero" }: SpeechBubbleProps) => {
  const isHero = variant === "hero";

  return (
    <div
      className="relative"
      style={{
        minWidth: FABLINO_SIZES.speechBubble.minWidth,
        maxWidth: FABLINO_SIZES.speechBubble.maxWidth,
      }}
    >
      <div
        className={`
          relative rounded-2xl
          ${isHero
            ? "px-5 py-3 bg-white"
            : "px-5 py-3 bg-orange-50 border border-orange-100 text-center"
          }
        `}
        style={isHero ? { boxShadow: "0 3px 16px rgba(0,0,0,0.08)" } : undefined}
      >
        <span
          className={`font-nunito leading-snug ${
            isHero
              ? "text-lg font-medium"
              : "text-[13px] font-semibold"
          }`}
          style={{ color: FABLINO_COLORS.text }}
        >
          {children}
        </span>
      </div>
      {/* Triangle pointing LEFT toward Fablino */}
      {isHero && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-2"
          style={{
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "10px solid white",
          }}
        />
      )}
    </div>
  );
};

export default SpeechBubble;
