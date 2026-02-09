import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useResultsPage, LevelInfo, BadgeInfo, BadgeHint } from "@/hooks/useResultsPage";
import { ArrowLeft } from "lucide-react";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";

// ── Translations ──

type Lang = string;

const resultsT: Record<string, Record<string, string>> = {
  de: {
    currentLevel: "Aktuelle Stufe",
    highestLevel: "Höchste Stufe",
    starsRemaining: "Noch {n} Sterne bis {emoji} {name}",
    highestReached: "🏆 Du hast die höchste Stufe erreicht!",
    roadmapTitle: "🗺️ Dein Weg zum Meister",
    badgesTitle: "🏷️ Sticker & Badges",
    allCollected: "🎉 Alle Sticker gesammelt!",
    firstStory: "Lies eine Geschichte, um deinen ersten Sticker zu verdienen!",
    // Fablino messages
    welcome: "Willkommen, {name}! Lies deine erste Geschichte! 📖",
    meister: "Wow, {name}! Du bist {level}! 👑",
    streakMsg: "{streak} Tage in Folge, {name}! 🔥 Noch {n} Sterne bis {level}!",
    almostThere: "Fast geschafft, {name}! 🎉 Nur noch {n} Sterne!",
    keepGoing: "Toll gemacht, {name}! Noch {n} Sterne bis {level}. Lies weiter! 🧡",
    // Badge hints
    hintStreak: "Lies {n} Tage hintereinander und bekomme den {badge} Sticker!",
    hintStories: "Noch {n} Geschichte(n) bis zum {badge} Sticker!",
    hintQuizzes: "Noch {n} Quiz(ze) bis zum {badge} Sticker!",
    hintStars: "Noch {n} Sterne bis zum {badge} Sticker!",
    hintGeneric: "Weiter so — {badge} kommt bald!",
  },
  fr: {
    currentLevel: "Niveau actuel",
    highestLevel: "Niveau maximum",
    starsRemaining: "Encore {n} étoiles pour {emoji} {name}",
    highestReached: "🏆 Tu as atteint le niveau maximum !",
    roadmapTitle: "🗺️ Ton chemin vers le sommet",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 Tous les stickers collectionnés !",
    firstStory: "Lis une histoire pour gagner ton premier sticker !",
    welcome: "Bienvenue, {name} ! Lis ta première histoire ! 📖",
    meister: "Wow, {name} ! Tu es {level} ! 👑",
    streakMsg: "{streak} jours d'affilée, {name} ! 🔥 Encore {n} étoiles pour {level} !",
    almostThere: "Presque, {name} ! 🎉 Plus que {n} étoiles !",
    keepGoing: "Bravo, {name} ! Encore {n} étoiles pour {level}. Continue ! 🧡",
    hintStreak: "Lis {n} jours d'affilée pour obtenir le sticker {badge} !",
    hintStories: "Encore {n} histoire(s) pour le sticker {badge} !",
    hintQuizzes: "Encore {n} quiz pour le sticker {badge} !",
    hintStars: "Encore {n} étoiles pour le sticker {badge} !",
    hintGeneric: "Continue — {badge} arrive bientôt !",
  },
  en: {
    currentLevel: "Current Level",
    highestLevel: "Highest Level",
    starsRemaining: "{n} more stars to {emoji} {name}",
    highestReached: "🏆 You reached the highest level!",
    roadmapTitle: "🗺️ Your path to the top",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 All stickers collected!",
    firstStory: "Read a story to earn your first sticker!",
    welcome: "Welcome, {name}! Read your first story! 📖",
    meister: "Wow, {name}! You are {level}! 👑",
    streakMsg: "{streak} days in a row, {name}! 🔥 {n} more stars to {level}!",
    almostThere: "Almost there, {name}! 🎉 Only {n} more stars!",
    keepGoing: "Well done, {name}! {n} more stars to {level}. Keep reading! 🧡",
    hintStreak: "Read {n} days in a row to earn the {badge} sticker!",
    hintStories: "{n} more story(ies) to the {badge} sticker!",
    hintQuizzes: "{n} more quiz(zes) to the {badge} sticker!",
    hintStars: "{n} more stars to the {badge} sticker!",
    hintGeneric: "Keep going — {badge} is coming soon!",
  },
  es: {
    currentLevel: "Nivel actual",
    highestLevel: "Nivel máximo",
    starsRemaining: "{n} estrellas más para {emoji} {name}",
    highestReached: "🏆 ¡Has alcanzado el nivel máximo!",
    roadmapTitle: "🗺️ Tu camino a la cima",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 ¡Todos los stickers recopilados!",
    firstStory: "¡Lee una historia para ganar tu primer sticker!",
    welcome: "¡Bienvenido, {name}! ¡Lee tu primera historia! 📖",
    meister: "¡Wow, {name}! ¡Eres {level}! 👑",
    streakMsg: "¡{streak} días seguidos, {name}! 🔥 ¡{n} estrellas más para {level}!",
    almostThere: "¡Casi, {name}! 🎉 ¡Solo {n} estrellas más!",
    keepGoing: "¡Bien hecho, {name}! {n} estrellas más para {level}. ¡Sigue leyendo! 🧡",
    hintStreak: "¡Lee {n} días seguidos para el sticker {badge}!",
    hintStories: "¡{n} historia(s) más para el sticker {badge}!",
    hintQuizzes: "¡{n} quiz(s) más para el sticker {badge}!",
    hintStars: "¡{n} estrellas más para el sticker {badge}!",
    hintGeneric: "¡Sigue así — {badge} llegará pronto!",
  },
  nl: {
    currentLevel: "Huidig niveau",
    highestLevel: "Hoogste niveau",
    starsRemaining: "Nog {n} sterren tot {emoji} {name}",
    highestReached: "🏆 Je hebt het hoogste niveau bereikt!",
    roadmapTitle: "🗺️ Jouw weg naar de top",
    badgesTitle: "🏷️ Stickers & Badges",
    allCollected: "🎉 Alle stickers verzameld!",
    firstStory: "Lees een verhaal om je eerste sticker te verdienen!",
    welcome: "Welkom, {name}! Lees je eerste verhaal! 📖",
    meister: "Wow, {name}! Je bent {level}! 👑",
    streakMsg: "{streak} dagen op rij, {name}! 🔥 Nog {n} sterren tot {level}!",
    almostThere: "Bijna, {name}! 🎉 Nog maar {n} sterren!",
    keepGoing: "Goed gedaan, {name}! Nog {n} sterren tot {level}. Blijf lezen! 🧡",
    hintStreak: "Lees {n} dagen op rij voor de {badge} sticker!",
    hintStories: "Nog {n} verhaal/verhalen tot de {badge} sticker!",
    hintQuizzes: "Nog {n} quiz(zen) tot de {badge} sticker!",
    hintStars: "Nog {n} sterren tot de {badge} sticker!",
    hintGeneric: "Ga zo door — {badge} komt eraan!",
  },
  it: {
    currentLevel: "Livello attuale",
    highestLevel: "Livello massimo",
    starsRemaining: "Ancora {n} stelle per {emoji} {name}",
    highestReached: "🏆 Hai raggiunto il livello massimo!",
    roadmapTitle: "🗺️ Il tuo percorso verso la vetta",
    badgesTitle: "🏷️ Sticker & Badge",
    allCollected: "🎉 Tutti gli sticker raccolti!",
    firstStory: "Leggi una storia per guadagnare il tuo primo sticker!",
    welcome: "Benvenuto, {name}! Leggi la tua prima storia! 📖",
    meister: "Wow, {name}! Sei {level}! 👑",
    streakMsg: "{streak} giorni di fila, {name}! 🔥 Ancora {n} stelle per {level}!",
    almostThere: "Quasi, {name}! 🎉 Solo {n} stelle ancora!",
    keepGoing: "Bravo, {name}! Ancora {n} stelle per {level}. Continua a leggere! 🧡",
    hintStreak: "Leggi {n} giorni di fila per lo sticker {badge}!",
    hintStories: "Ancora {n} storie per lo sticker {badge}!",
    hintQuizzes: "Ancora {n} quiz per lo sticker {badge}!",
    hintStars: "Ancora {n} stelle per lo sticker {badge}!",
    hintGeneric: "Continua così — {badge} sta arrivando!",
  },
};

function getT(lang: Lang) {
  return resultsT[lang] || resultsT.de;
}

// ── Helpers ──

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

function getFablinoMessage(
  t: Record<string, string>,
  name: string,
  totalStars: number,
  streak: number,
  current: LevelInfo,
  next: LevelInfo | null,
) {
  if (totalStars === 0) {
    return t.welcome.replace("{name}", name);
  }
  if (!next) {
    return t.meister.replace("{name}", name).replace("{level}", `${current.emoji} ${current.name}`);
  }
  const remaining = next.stars_required - totalStars;
  const levelStr = `${next.emoji} ${next.name}`;
  if (streak >= 5) {
    return t.streakMsg.replace("{streak}", String(streak)).replace("{name}", name).replace("{n}", String(remaining)).replace("{level}", levelStr);
  }
  if (remaining <= 10) {
    return t.almostThere.replace("{name}", name).replace("{n}", String(remaining));
  }
  return t.keepGoing.replace("{name}", name).replace("{n}", String(remaining)).replace("{level}", levelStr);
}

function getBadgeHintText(t: Record<string, string>, hint: BadgeHint): string {
  const remaining = hint.condition_value - hint.current_progress;
  const badge = `${hint.emoji} ${hint.name}`;
  switch (hint.condition_type) {
    case "streak_days":
      return t.hintStreak.replace("{n}", String(hint.condition_value)).replace("{badge}", badge);
    case "stories_total":
      return t.hintStories.replace("{n}", String(remaining)).replace("{badge}", badge);
    case "quizzes_passed":
      return t.hintQuizzes.replace("{n}", String(remaining)).replace("{badge}", badge);
    case "stars_total":
      return t.hintStars.replace("{n}", String(remaining)).replace("{badge}", badge);
    default:
      return t.hintGeneric.replace("{badge}", badge);
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
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
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
  t,
}: {
  current: LevelInfo;
  next: LevelInfo | null;
  totalStars: number;
  delay: number;
  t: Record<string, string>;
}) => {
  const progressMin = current.stars_required;
  const progressMax = next ? next.stars_required : current.stars_required;
  const targetPct = next
    ? Math.min(100, ((totalStars - progressMin) / (progressMax - progressMin)) * 100)
    : 100;

  const animatedStars = useAnimatedCounter(totalStars, 1200);
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setBarPct(targetPct), 300);
    return () => clearTimeout(timer);
  }, [targetPct]);

  const isMeister = !next;

  return (
    <div
      className="bg-white rounded-[20px] p-5 relative overflow-hidden"
      style={{
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        animation: `fadeSlideUp 0.5s ease-out ${delay}s both`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.07] rounded-[20px]" style={{ background: current.color }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: current.color }}>
              {isMeister ? t.highestLevel : t.currentLevel}
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
                {t.starsRemaining.replace("{n}", String(next.stars_required - totalStars)).replace("{emoji}", next.emoji).replace("{name}", next.name)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-[13px] font-semibold mt-3" style={{ color: current.color }}>
            {t.highestReached}
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
  t,
}: {
  levels: LevelInfo[];
  totalStars: number;
  delay: number;
  t: Record<string, string>;
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
        {t.roadmapTitle}
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
                    <span className="text-[20px]" style={{ opacity: isFuture ? 0.35 : 1 }}>
                      {level.emoji}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold mt-1.5 text-center leading-tight"
                    style={{ color: isFuture ? "#aaa" : "#2D1810", maxWidth: 60 }}
                  >
                    {level.name}
                  </span>
                  <span className="text-[9px] font-medium" style={{ color: isFuture ? "#ccc" : "#888" }}>
                    {level.stars_required}⭐
                  </span>
                </div>

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

const BadgeHintBar = ({ hint, t }: { hint: BadgeHint; t: Record<string, string> }) => {
  const targetPct = Math.min(100, (hint.current_progress / hint.condition_value) * 100);
  const [barPct, setBarPct] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setBarPct(targetPct), 400);
    return () => clearTimeout(timer);
  }, [targetPct]);

  return (
    <div className="rounded-xl p-3.5 mb-4" style={{ background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)" }}>
      <p className="text-[13px] font-semibold mb-2" style={{ color: "#92400E" }}>
        {getBadgeHintText(t, hint)}
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
  t,
}: {
  earnedBadges: BadgeInfo[];
  hints: BadgeHint[];
  allBadgeCount: number;
  delay: number;
  t: Record<string, string>;
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
        {t.badgesTitle}
      </h3>

      {allEarned && (
        <div className="text-center py-3 mb-4 rounded-xl" style={{ background: "linear-gradient(135deg, #FEF3C7, #FFF7ED)" }}>
          <p className="text-[15px] font-bold" style={{ color: "#92400E" }}>{t.allCollected}</p>
        </div>
      )}

      {earnedBadges.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className="relative flex flex-col items-center gap-1 p-3 rounded-xl border"
              style={{
                background: badge.category === "reading" ? "#FFF7ED" :
                            badge.category === "streak" ? "#FEF3C7" :
                            badge.category === "quiz" ? "#ECFDF5" : "#F0F9FF",
                borderColor: badge.category === "reading" ? "#FDBA74" :
                             badge.category === "streak" ? "#FCD34D" :
                             badge.category === "quiz" ? "#6EE7B7" : "#93C5FD",
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

      {!allEarned && primaryHint && <BadgeHintBar hint={primaryHint} t={t} />}

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
        <p className="text-center text-sm text-gray-400 py-4">{t.firstStory}</p>
      )}
    </div>
  );
};

// ── Main Page ──

const ResultsPage = () => {
  const navigate = useNavigate();
  const { selectedProfileId, kidAppLanguage } = useKidProfile();
  const { data, loading } = useResultsPage(selectedProfileId);
  const t = getT(kidAppLanguage);

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
  const fablinoMsg = getFablinoMessage(t, data.child_name, data.total_stars, data.current_streak, current, next);
  const totalBadgeCount = data.earned_badges.length + data.next_badge_hints.length +
    Math.max(0, 11 - data.earned_badges.length - data.next_badge_hints.length);

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

      <div className="max-w-lg mx-auto px-4 space-y-4 pt-1 pb-8">
        <FablinoSection message={fablinoMsg} delay={0} />
        <LevelCard current={current} next={next} totalStars={data.total_stars} delay={0.1} t={t} />
        <LevelRoadmap levels={sorted} totalStars={data.total_stars} delay={0.2} t={t} />
        <BadgesSection
          earnedBadges={data.earned_badges}
          hints={data.next_badge_hints}
          allBadgeCount={11}
          delay={0.3}
          t={t}
        />
      </div>
    </div>
  );
};

export default ResultsPage;
