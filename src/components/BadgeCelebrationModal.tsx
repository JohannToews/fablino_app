import { useState, useEffect, useMemo } from "react";
import { translateBadgeName, translateBadgeMessage } from "@/lib/levelTranslations";
import FablinoMascot from "./FablinoMascot";

export interface EarnedBadge {
  name: string;
  emoji: string;
  category?: "milestone" | "weekly" | "streak" | "special";
  bonus_stars?: number;
  fablino_message?: string;
  frame_color?: string;
}

interface BadgeCelebrationModalProps {
  badges: EarnedBadge[];
  onDismiss: () => void;
  language?: string;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  milestone: { de: "Meilenstein", fr: "Étape", en: "Milestone", es: "Hito", nl: "Mijlpaal", it: "Traguardo", bs: "Prekretnica" },
  weekly:    { de: "Wochen-Badge", fr: "Badge semaine", en: "Weekly", es: "Semanal", nl: "Week-badge", it: "Settimanale", bs: "Sedmični" },
  streak:    { de: "Serie", fr: "Série", en: "Streak", es: "Racha", nl: "Reeks", it: "Serie", bs: "Serija" },
  special:   { de: "Spezial", fr: "Spécial", en: "Special", es: "Especial", nl: "Speciaal", it: "Speciale", bs: "Poseban" },
};

const CATEGORY_COLORS: Record<string, string> = {
  milestone: "#F59E0B",
  weekly:    "#F97316",
  streak:    "#A855F7",
  special:   "#3B82F6",
};

const t: Record<string, { newSticker: string; wellDone: string; next: string; done: string }> = {
  de: { newSticker: "Neuer Sticker!", wellDone: "Super gemacht! 🎉", next: "Nächster Sticker →", done: "Weiter" },
  fr: { newSticker: "Nouveau sticker !", wellDone: "Bravo ! 🎉", next: "Sticker suivant →", done: "Continuer" },
  en: { newSticker: "New Sticker!", wellDone: "Well done! 🎉", next: "Next Sticker →", done: "Continue" },
  es: { newSticker: "¡Nuevo sticker!", wellDone: "¡Bien hecho! 🎉", next: "Siguiente sticker →", done: "Continuar" },
  nl: { newSticker: "Nieuwe sticker!", wellDone: "Goed gedaan! 🎉", next: "Volgende sticker →", done: "Verder" },
  it: { newSticker: "Nuovo sticker!", wellDone: "Ben fatto! 🎉", next: "Prossimo sticker →", done: "Continua" },
  bs: { newSticker: "Novi stiker!", wellDone: "Odlično! 🎉", next: "Sljedeći stiker →", done: "Nastavi" },
};

const BadgeCelebrationModal = ({ badges, onDismiss, language = "de" }: BadgeCelebrationModalProps) => {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const tr = t[language] || t.de;
  const lang = language || "de";

  // Translate badge names and messages
  const translatedBadges = useMemo(() =>
    badges.map(b => ({
      ...b,
      name: translateBadgeName(b.name, lang),
      fablino_message: translateBadgeMessage(b.name, lang) || b.fablino_message,
    })),
    [badges, lang]
  );

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (translatedBadges.length === 0) return null;
  const badge = translatedBadges[currentIdx];
  const frameColor = badge.frame_color || "#F97316";
  const categoryLabel = badge.category
    ? CATEGORY_LABELS[badge.category]?.[lang] || CATEGORY_LABELS[badge.category]?.de || ""
    : "";
  const categoryColor = badge.category ? CATEGORY_COLORS[badge.category] || "#F97316" : "#F97316";

  const handleContinue = () => {
    if (currentIdx < translatedBadges.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setVisible(false);
      setTimeout(onDismiss, 250);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-6"
      style={{
        background: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        transition: "background 0.3s ease",
      }}
      onClick={handleContinue}
    >
      {/* Falling stars animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["⭐", "🌟", "✨", "⭐", "🌟", "✨"].map((star, i) => (
          <span
            key={i}
            className="absolute text-[24px]"
            style={{
              left: `${12 + i * 15}%`,
              animation: `confettiFall ${2 + i * 0.3}s ease-in ${i * 0.15}s infinite`,
              opacity: 0,
            }}
          >
            {star}
          </span>
        ))}
      </div>

      {/* Modal card */}
      <div
        className="relative bg-white rounded-[24px] max-w-[320px] w-full p-6 text-center"
        style={{
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
          transform: visible ? "scale(1)" : "scale(0.5)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category pill */}
        {categoryLabel && (
          <div className="flex justify-center mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
              style={{ background: categoryColor }}
            >
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Badge emoji with frame_color ring */}
        <div
          className="mx-auto mb-3 flex items-center justify-center"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: `4px solid ${frameColor}`,
            boxShadow: `0 0 20px ${frameColor}44`,
            animation: "badgePop 0.6s ease-out 0.3s both",
          }}
        >
          <span style={{ fontSize: 56, lineHeight: 1 }}>{badge.emoji}</span>
        </div>

        {/* Title */}
        <h2 className="font-fredoka text-[22px] font-bold mb-1" style={{ color: "#2D1810" }}>
          {tr.newSticker}
        </h2>

        {/* Badge name */}
        <p className="font-nunito text-[18px] font-bold mb-1" style={{ color: frameColor }}>
          {badge.name}
        </p>

        {/* Bonus stars */}
        {badge.bonus_stars && badge.bonus_stars > 0 && (
          <p className="text-[15px] font-bold mb-2" style={{ color: "#F59E0B" }}>
            +{badge.bonus_stars} ⭐
          </p>
        )}

        {/* Fablino mini with fablino_message */}
        <div className="flex items-end justify-center gap-2 mt-2 mb-4">
          <FablinoMascot src="/mascot/6_Onboarding.png" size="sm" className="!max-h-[50px]" />
          <div className="bg-orange-50 rounded-xl px-3 py-2 relative" style={{ border: "1px solid #FDBA74" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
              {badge.fablino_message || tr.wellDone}
            </p>
            <div
              className="absolute -bottom-1.5 left-4"
              style={{
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "7px solid #FFF7ED",
              }}
            />
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl font-bold text-white text-[16px] active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #FF8C42, #FF6B00)" }}
        >
          {currentIdx < translatedBadges.length - 1 ? tr.next : tr.done}
        </button>

        {/* Badge counter */}
        {translatedBadges.length > 1 && (
          <p className="text-[11px] font-medium mt-2" style={{ color: "#aaa" }}>
            {currentIdx + 1} / {translatedBadges.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default BadgeCelebrationModal;
