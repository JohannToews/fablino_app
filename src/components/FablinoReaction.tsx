import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import FablinoMascot from "./FablinoMascot";

// ═══ Types ═══

export interface FablinoReactionProps {
  type: 'celebrate' | 'encourage' | 'welcome' | 'levelUp' | 'perfect';
  message: string;
  stars?: number;
  levelEmoji?: string;   // For levelUp: the level emoji (e.g. "🔍")
  levelTitle?: string;   // For levelUp: the level name (e.g. "Geschichtenentdecker")
  onClose: () => void;
  autoClose?: number;
  buttonLabel?: string;
}

// ═══ Constants ═══

const FABLINO_IMAGES: Record<FablinoReactionProps['type'], string> = {
  celebrate: '/mascot/1_happy_success.png',
  encourage: '/mascot/2_encouriging_wrong_answer.png',
  welcome:   '/mascot/6_Onboarding.png',
  levelUp:   '/mascot/7_Level_up.png',
  perfect:   '/mascot/1_happy_success.png',
};

const ACCENT_COLORS: Record<FablinoReactionProps['type'], string> = {
  celebrate: 'from-amber-200/60 to-transparent',
  perfect:   'from-amber-200/60 to-transparent',
  encourage: 'from-blue-200/60 to-transparent',
  levelUp:   'from-purple-200/60 to-transparent',
  welcome:   'from-green-200/60 to-transparent',
};

const SHOW_PARTICLES = new Set<FablinoReactionProps['type']>(['celebrate', 'perfect', 'levelUp']);

// ═══ Particle component (pure CSS) ═══

function FallingParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(i => (
        <span
          key={i}
          className="absolute text-lg animate-particle-fall"
          style={{
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 0.6}s`,
            animationDuration: `${1.2 + Math.random() * 0.8}s`,
          }}
        >
          ⭐
        </span>
      ))}
      <style>{`
        @keyframes particleFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(calc(100vh * 0.5)) rotate(360deg); opacity: 0; }
        }
        .animate-particle-fall {
          animation: particleFall 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ═══ Star fly animation (subtle) ═══

function StarFlyEffect({ count }: { count: number }) {
  if (count <= 0) return null;
  const starCount = Math.min(count, 3);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: starCount }, (_, i) => (
        <span
          key={`fly-${i}`}
          className="absolute text-[22px]"
          style={{
            left: '50%',
            top: '45%',
            marginLeft: `${(i - 1) * 12}px`,
            '--fly-x': `${40 + i * 20}px`,
            '--fly-y': `${-100 - i * 15}px`,
            animation: `starFly 0.8s ease-in-out ${0.3 + i * 0.15}s forwards`,
            opacity: 0,
          } as React.CSSProperties}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

// ═══ Animated star counter ═══

function StarCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 800; // ms
    const steps = Math.min(target, 30);
    const interval = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += Math.ceil(target / steps);
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCount(current);
    }, interval);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex items-center justify-center gap-2 text-lg font-bold text-amber-600">
      <span className="text-2xl">⭐</span>
      <span>+{count}</span>
    </div>
  );
}

// ═══ Main component ═══

// ═══ Level-Up confetti (CSS-only, more prominent) ═══

function LevelUpConfetti() {
  const emojis = ['🎉', '✨', '⭐', '🌟', '🎊', '✨', '⭐', '🎉', '🌟', '🎊'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {emojis.map((emoji, i) => (
        <span
          key={`conf-${i}`}
          className="absolute"
          style={{
            left: `${5 + i * 10}%`,
            fontSize: `${14 + Math.random() * 10}px`,
            animation: `confettiFall ${2 + Math.random() * 1.5}s ease-in ${i * 0.1}s infinite`,
            opacity: 0,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

export default function FablinoReaction({
  type,
  message,
  stars,
  levelEmoji,
  levelTitle,
  onClose,
  autoClose,
  buttonLabel = 'Weiter',
}: FablinoReactionProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Entrance animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-close countdown
  useEffect(() => {
    if (!autoClose) return;

    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoClose) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      onClose();
    }, autoClose);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoClose, onClose]);

  const handleOverlayClick = () => {
    if (autoClose) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          relative max-w-sm w-[90%] mx-auto bg-white rounded-2xl p-6 shadow-xl
          transition-all duration-500 ease-out
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent gradient */}
        <div
          className={`absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b ${ACCENT_COLORS[type]} pointer-events-none`}
        />

        {/* Particles / Confetti */}
        {type === 'levelUp' ? <LevelUpConfetti /> : SHOW_PARTICLES.has(type) && <FallingParticles />}

        {/* Star fly effect */}
        {stars != null && stars > 0 && (type === 'celebrate' || type === 'perfect') && (
          <StarFlyEffect count={stars} />
        )}

        {/* Content */}
        <div className="relative flex flex-col items-center gap-4 pt-2">
          {/* Level-Up: Big emoji badge first */}
          {type === 'levelUp' && levelEmoji && (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #FEF3C7, #FFF7ED)',
                border: '3px solid #FBBF24',
                boxShadow: '0 0 20px rgba(251,191,36,0.3)',
                animation: 'badgePop 0.6s ease-out 0.2s both',
              }}
            >
              <span style={{ fontSize: 44, lineHeight: 1 }}>{levelEmoji}</span>
            </div>
          )}

          {/* Fablino image */}
          <div className={`transition-all duration-700 ease-out ${visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <FablinoMascot
              src={FABLINO_IMAGES[type]}
              size={type === 'levelUp' ? 'md' : 'lg'}
              bounce={false}
            />
          </div>

          {/* Level-Up title */}
          {type === 'levelUp' && levelTitle && (
            <div className="text-center">
              <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#92400E' }}>
                Level Up!
              </p>
              <p className="text-[20px] font-extrabold" style={{ color: '#2D1810' }}>
                {levelEmoji} {levelTitle}
              </p>
            </div>
          )}

          {/* Message */}
          <p className="text-lg font-bold text-center text-gray-800 leading-snug">
            {message}
          </p>

          {/* Star counter */}
          {stars != null && stars > 0 && <StarCounter target={stars} />}

          {/* Button or auto-close progress bar */}
          {autoClose ? (
            <div className="w-full mt-2">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <Button
              onClick={onClose}
              className="mt-2 rounded-full px-8 py-2 text-base font-semibold"
            >
              {buttonLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
