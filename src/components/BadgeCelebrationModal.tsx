import { useState, useEffect } from "react";

export interface EarnedBadge {
  name: string;
  emoji: string;
}

interface BadgeCelebrationModalProps {
  badges: EarnedBadge[];
  onDismiss: () => void;
}

const BadgeCelebrationModal = ({ badges, onDismiss }: BadgeCelebrationModalProps) => {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  if (badges.length === 0) return null;
  const badge = badges[currentIdx];

  const handleContinue = () => {
    if (currentIdx < badges.length - 1) {
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
        {/* Badge emoji */}
        <div
          className="mx-auto mb-3"
          style={{
            fontSize: 80,
            lineHeight: 1,
            animation: "badgePop 0.6s ease-out 0.3s both",
          }}
        >
          {badge.emoji}
        </div>

        {/* Title */}
        <h2
          className="font-fredoka text-[22px] font-bold mb-1"
          style={{ color: "#2D1810" }}
        >
          Neuer Sticker!
        </h2>

        {/* Badge name */}
        <p
          className="font-nunito text-[18px] font-bold mb-2"
          style={{ color: "#F97316" }}
        >
          {badge.name}
        </p>

        {/* Fablino mini */}
        <div className="flex items-end justify-center gap-2 mt-3 mb-4">
          <img
            src="/mascot/6_Onboarding.png"
            alt="Fablino"
            className="w-[50px] h-auto"
            style={{ animation: "gentleBounce 2.5s ease-in-out infinite" }}
          />
          <div
            className="bg-orange-50 rounded-xl px-3 py-2 relative"
            style={{ border: "1px solid #FDBA74" }}
          >
            <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
              Super gemacht! 🎉
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
          {currentIdx < badges.length - 1 ? "Nächster Sticker →" : "Weiter"}
        </button>

        {/* Badge counter */}
        {badges.length > 1 && (
          <p className="text-[11px] font-medium mt-2" style={{ color: "#aaa" }}>
            {currentIdx + 1} / {badges.length}
          </p>
        )}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes badgePop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default BadgeCelebrationModal;
