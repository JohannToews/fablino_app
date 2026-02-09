import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useResultsPage, LevelInfo, BadgeInfo, BadgeHint } from "@/hooks/useResultsPage";
import { ArrowLeft } from "lucide-react";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";

// ── Helpers ──

/** Find the current level and next level from sorted levels array */
function getLevelProgress(levels: LevelInfo[], totalStars: number) {
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);
  let current = sorted[0];
  let next: LevelInfo | null = null;

  for (let i = 0; i < sorted.length; i++) {
    if (totalStars >= sorted[i].stars_required) {
      current = sorted[i];
      next = sorted[i + 1] || null;
    }
  }
  return { current, next, sorted };
}

/** Build Fablino's motivational message */
function getFablinoMessage(
  name: string,
  totalStars: number,
  streak: number,
  current: LevelInfo,
  next: LevelInfo | null,
) {
  // Edge case: brand new user with 0 stars
  if (totalStars === 0) {
    return `Willkommen, ${name}! Lies deine erste Geschichte! 📖`;
  }
  // Edge case: Meister reached (no next level)
  if (!next) {
    return `Wow, ${name}! Du bist ${current.emoji} ${current.name}! 👑`;
  }
  const remaining = next.stars_required - totalStars;
  if (streak >= 5) {
    return `${streak} Tage in Folge, ${name}! 🔥 Noch ${remaining} Sterne bis ${next.emoji} ${next.name}!`;
  }
  if (remaining <= 10) {
    return `Fast geschafft, ${name}! 🎉 Nur noch ${remaining} Sterne!`;
  }
  return `Toll gemacht, ${name}! Noch ${remaining} Sterne bis ${next.emoji} ${next.name}. Lies weiter! 🧡`;
}

/** Build hint text for a badge */
function getBadgeHintText(hint: BadgeHint): string {
  const remaining = hint.condition_value - hint.current_progress;
  switch (hint.condition_type) {
    case "streak_days":
      return `Lies ${hint.condition_value} Tage hintereinander und bekomme den ${hint.emoji} ${hint.name} Sticker!`;
    case "stories_total":
      return `Noch ${remaining} Geschichte${remaining !== 1 ? "n" : ""} bis zum ${hint.emoji} ${hint.name} Sticker!`;
    case "quizzes_passed":
      return `Noch ${remaining} Quiz${remaining !== 1 ? "ze" : ""} bis zum ${hint.emoji} ${hint.name} Sticker!`;
    case "stars_total":
      return `Noch ${remaining} Sterne bis zum ${hint.emoji} ${hint.name} Sticker!`;
    default:
      return `Weiter so — ${hint.emoji} ${hint.name} kommt bald!`;
  }
}

// ── Animated Counter Hook ──

function useAnimatedCounter(target: number, duration = 1000, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return value;
}

// ── Skeleton Loader ──

const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`bg-white rounded-[20px] p-5 animate-pulse ${className}`} style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
    <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-2/3 mb-3" />
    <div className="h-3 bg-gray-100 rounded w-full mb-2" />
    <div className="h-3 bg-gray-100 rounded w-4/5" />
  </div>
);

// ── Section 1: Fablino Message ──

const FablinoSection = ({ message, delay }: { message: string; delay: number }) => (
  <div
    className="flex items-center gap-4 px-1"
    style={{ animation: `fadeSlideUp 0.5s ease-out ${delay}s both` }}
  >
    <FablinoMascot src="/mascot/6_Onboarding.png" size="md" />
    <div className="flex-1 min-w-0">
      <SpeechBubble>{message}</SpeechBubble>
    </div>
  </div>
);

// ── Section 2: Level Card ──

const LevelCard = ({
  current,
  next,
  totalStars,
  delay,
}: {
  current: LevelInfo;
  next: LevelInfo | null;
  totalStars: number;
  delay: number;
}) => {
  const progressMin = current.stars_required;
  const progressMax = next ? next.stars_required : current.stars_required;
  const targetPct = next
    ? Math.min(100, ((totalStars - progressMin) / (progressMax - progressMin)) * 100)
    : 100;

  // Animated counter for total stars
  const animatedStars = useAnimatedCounter(totalStars, 1200);

  // Animated progress bar (0 → target %)
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarPct(targetPct), 300);
    return () => clearTimeout(t);
  }, [targetPct]);

  // Edge case: Meister reached
  const isMeister = !next;

  return (
    <div
      className="bg-white rounded-[20px] p-5 relative overflow-hidden"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      {/* Faint level-colored background */}
      <div
        className="absolute inset-0 opacity-[0.07] rounded-[20px]"
        style={{ background: current.color }}
      />
      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: current.color }}
            >
              {isMeister ? "Höchste Stufe" : "Aktuelle Stufe"}
            </span>
            <h2 className="font-fredoka text-[24px] font-bold leading-tight" style={{ color: "#2D1810" }}>
              {current.emoji} {current.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <span className="text-[15px]">⭐</span>
            <span className="font-bold text-[15px]" style={{ color: "#2D1810" }}>{animatedStars}</span>
          </div>
        </div>

        {/* Progress bar – hidden when Meister */}
        {!isMeister ? (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: "#888" }}>
              <span>{current.emoji} {current.stars_required}⭐</span>
              {next && <span>{next.emoji} {next.stars_required}⭐</span>}
            </div>
            <div className="relative h-[14px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${barPct}%`,
                  background: next
                    ? `linear-gradient(90deg, ${current.color}, ${next.color})`
                    : current.color,
                  transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* Shimmer */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  animation: "shimmer 2.5s infinite",
                }}
              />
            </div>
            {next && (
              <p className="text-center text-[12px] font-medium mt-2" style={{ color: "#888" }}>
                Noch {next.stars_required - totalStars} Sterne bis {next.emoji} {next.name}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-[13px] font-semibold mt-3" style={{ color: current.color }}>
            🏆 Du hast die höchste Stufe erreicht!
          </p>
        )}
      </div>
    </div>
  );
};

// ── Section 3: Level Roadmap ──

const LevelRoadmap = ({
  levels,
  totalStars,
  delay,
}: {
  levels: LevelInfo[];
  totalStars: number;
  delay: number;
}) => {
  const sorted = [...levels].sort((a, b) => a.sort_order - b.sort_order);
  const currentIdx = sorted.reduce((acc, l, i) => (totalStars >= l.stars_required ? i : acc), 0);

  return (
    <div
      className="bg-white rounded-[20px] p-5"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <h3 className="font-fredoka text-[17px] font-bold mb-4" style={{ color: "#2D1810" }}>
        🗺️ Dein Weg zum Meister
      </h3>

      <div className="overflow-x-auto pb-2 -mx-1">
        <div className="flex items-center gap-0 min-w-max px-1">
          {sorted.map((level, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            const isLast = idx === sorted.length - 1;

            return (
              <div
                key={level.id}
                className="flex items-center"
                style={{ animation: `fadeSlideUp 0.4s ease-out ${delay + 0.1 * idx}s both` }}
              >
                {/* Level circle + label */}
                <div className="flex flex-col items-center" style={{ width: 64 }}>
                  <div
                    className="relative flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: isCurrent ? 52 : 42,
                      height: isCurrent ? 52 : 42,
                      background: isFuture ? "#F3F4F6" : level.color,
                      border: isFuture ? "2px dashed #D1D5DB" : `3px solid ${level.color}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${level.color}33` : "none",
                      animation: isCurrent ? "pulse-ring 2s infinite" : "none",
                    }}
                  >
                    <span
                      className="text-[20px]"
                      style={{ opacity: isFuture ? 0.35 : 1 }}
                    >
                      {level.emoji}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold mt-1.5 text-center leading-tight"
                    style={{ color: isFuture ? "#aaa" : "#2D1810", maxWidth: 60 }}
                  >
                    {level.name}
                  </span>
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: isFuture ? "#ccc" : "#888" }}
                  >
                    {level.stars_required}⭐
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="relative w-8 h-[3px] mx-0.5" style={{ background: "#E5E7EB" }}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                        background: sorted[idx].color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Section 4: Badges ──

const BadgeHintBar = ({ hint }: { hint: BadgeHint }) => {
  const targetPct = Math.min(100, (hint.current_progress / hint.condition_value) * 100);
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarPct(targetPct), 400);
    return () => clearTimeout(t);
  }, [targetPct]);

  return (
    <div
      className="rounded-xl p-3.5 mb-4"
      style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)" }}
    >
      <p className="text-[13px] font-semibold mb-2" style={{ color: "#92400E" }}>
        {getBadgeHintText(hint)}
      </p>
      <div className="relative h-[10px] bg-white/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${barPct}%`,
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium mt-1" style={{ color: "#92400E" }}>
        <span>{hint.current_progress}</span>
        <span>{hint.condition_value}</span>
      </div>
    </div>
  );
};

const BadgesSection = ({
  earnedBadges,
  hints,
  allBadgeCount,
  delay,
}: {
  earnedBadges: BadgeInfo[];
  hints: BadgeHint[];
  allBadgeCount: number;
  delay: number;
}) => {
  const lockedCount = Math.max(0, allBadgeCount - earnedBadges.length);
  const primaryHint = hints[0] || null;
  const allEarned = earnedBadges.length >= allBadgeCount;

  return (
    <div
      className="bg-white rounded-[20px] p-5"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <h3 className="font-fredoka text-[17px] font-bold mb-4" style={{ color: "#2D1810" }}>
        🏷️ Sticker & Badges
      </h3>

      {/* All earned celebration */}
      {allEarned && (
        <div className="text-center py-3 mb-4 rounded-xl" style={{ background: "linear-gradient(135deg, #FEF3C7, #FFF7ED)" }}>
          <p className="text-[15px] font-bold" style={{ color: "#92400E" }}>
            🎉 Alle Sticker gesammelt!
          </p>
        </div>
      )}

      {/* Earned badges grid */}
      {earnedBadges.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="relative flex flex-col items-center gap-1 p-3 rounded-xl border"
              style={{
                background: badge.category === "reading" ? "#FFF7ED" :
                            badge.category === "streak" ? "#FEF3C7" :
                            badge.category === "quiz" ? "#ECFDF5" :
                            "#F0F9FF",
                borderColor: badge.category === "reading" ? "#FDBA74" :
                             badge.category === "streak" ? "#FCD34D" :
                             badge.category === "quiz" ? "#6EE7B7" :
                             "#93C5FD",
              }}
            >
              {badge.is_new && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
              )}
              <span className="text-[28px]">{badge.emoji}</span>
              <span className="text-[10px] font-bold text-center leading-tight" style={{ color: "#2D1810" }}>
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Next badge hint – only if not all earned */}
      {!allEarned && primaryHint && (
        <BadgeHintBar hint={primaryHint} />
      )}

      {/* Locked badges – only if not all earned */}
      {!allEarned && lockedCount > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: lockedCount }).map((_, i) => (
            <div
              key={`locked-${i}`}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50"
              style={{ opacity: 0.5 }}
            >
              <span className="text-[24px]">🔒</span>
              <span className="text-[10px] font-medium text-gray-400">???</span>
            </div>
          ))}
        </div>
      )}

      {earnedBadges.length === 0 && !primaryHint && lockedCount === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          Lies eine Geschichte, um deinen ersten Sticker zu verdienen!
        </p>
      )}
    </div>
  );
};

// ── Main Page ──

const ResultsPage = () => {
  const navigate = useNavigate();
  const { selectedProfileId } = useKidProfile();
  const { data, loading } = useResultsPage(selectedProfileId);

  // Mark all is_new badges as read after 2 seconds on the page
  useEffect(() => {
    if (!selectedProfileId || !data || data.earned_badges.every((b) => !b.is_new)) return;
    const timer = setTimeout(async () => {
      try {
        await supabase
          .from("user_badges")
          .update({ is_new: false })
          .eq("child_id", selectedProfileId)
          .eq("is_new", true);
      } catch {
        // Silent fail
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [selectedProfileId, data]);

  // Loading
  if (loading || !data) {
    return (
      <div
        className="min-h-screen pb-safe"
        style={{ background: "linear-gradient(180deg, #FFF7ED 0%, #FFFBF5 40%, #F0F9FF 100%)" }}
      >
        <div className="px-4 pt-3 pb-0">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 space-y-4 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard className="h-[120px]" />
          <SkeletonCard className="h-[200px]" />
        </div>
      </div>
    );
  }

  const { current, next, sorted } = getLevelProgress(data.levels, data.total_stars);
  const fablinoMsg = getFablinoMessage(data.child_name, data.total_stars, data.current_streak, current, next);
  // Total badge count = earned + hints remaining (hints are next 3, but total locked = all badges - earned)
  const totalBadgeCount = data.earned_badges.length + data.next_badge_hints.length +
    Math.max(0, 11 - data.earned_badges.length - data.next_badge_hints.length); // 11 total badges seeded

  return (
    <div
      className="min-h-screen pb-safe"
      style={{ background: "linear-gradient(180deg, #FFF7ED 0%, #FFFBF5 40%, #F0F9FF 100%)" }}
    >
      {/* Back button */}
      <div className="px-4 pt-3 pb-0">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-white/30 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 pt-1 pb-8">
        {/* Section 1: Fablino */}
        <FablinoSection message={fablinoMsg} delay={0} />

        {/* Section 2: Level Card */}
        <LevelCard current={current} next={next} totalStars={data.total_stars} delay={0.1} />

        {/* Section 3: Roadmap */}
        <LevelRoadmap levels={sorted} totalStars={data.total_stars} delay={0.2} />

        {/* Section 4: Badges */}
        <BadgesSection
          earnedBadges={data.earned_badges}
          hints={data.next_badge_hints}
          allBadgeCount={11}
          delay={0.3}
        />
      </div>

    </div>
  );
};

export default ResultsPage;
