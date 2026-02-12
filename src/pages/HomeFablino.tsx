import { useNavigate, useLocation } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import MigrationBanner from "@/components/MigrationBanner";
import { Settings, BarChart3 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { FABLINO_STYLES } from "@/constants/design-tokens";

// ═══ Localized texts ═══

const GREETINGS: Record<string, { withName: (name: string) => string; withoutName: string }> = {
  fr: { withName: (n) => `Salut ${n} ! 😊 Envie d'une chouette histoire ?`, withoutName: "Salut ! 😊 Envie d'une chouette histoire ?" },
  de: { withName: (n) => `Hey ${n}! 😊 Lust auf eine tolle Geschichte?`, withoutName: "Hey! 😊 Lust auf eine tolle Geschichte?" },
  en: { withName: (n) => `Hey ${n}! 😊 Ready for an awesome story?`, withoutName: "Hey! 😊 Ready for an awesome story?" },
  es: { withName: (n) => `¡Hola ${n}! 😊 ¿Quieres una historia genial?`, withoutName: "¡Hola! 😊 ¿Quieres una historia genial?" },
  nl: { withName: (n) => `Hoi ${n}! 😊 Zin in een gaaf verhaal?`, withoutName: "Hoi! 😊 Zin in een gaaf verhaal?" },
  it: { withName: (n) => `Ciao ${n}! 😊 Voglia di una bella storia?`, withoutName: "Ciao! 😊 Voglia di una bella storia?" },
  bs: { withName: (n) => `Hej ${n}! 😊 Želiš li super priču?`, withoutName: "Hej! 😊 Želiš li super priču?" },
};

const UI_TEXTS: Record<string, {
  newStory: string;
  myStories: string;
  myWeek: string;
  seeAll: string;
  stars: string;
  daysInARow: string;
}> = {
  fr: { newStory: '📖 Nouvelle histoire', myStories: '📚 Mes histoires', myWeek: 'Ma semaine 🏆', seeAll: 'Tout voir →', stars: 'Étoiles', daysInARow: 'Jours de suite' },
  de: { newStory: '📖 Neue Geschichte starten', myStories: '📚 Meine Geschichten', myWeek: 'Meine Woche 🏆', seeAll: 'Alle Ergebnisse →', stars: 'Sterne', daysInARow: 'Tage in Folge' },
  en: { newStory: '📖 New story', myStories: '📚 My stories', myWeek: 'My week 🏆', seeAll: 'See all →', stars: 'Stars', daysInARow: 'Days in a row' },
  es: { newStory: '📖 Nueva historia', myStories: '📚 Mis historias', myWeek: 'Mi semana 🏆', seeAll: 'Ver todo →', stars: 'Estrellas', daysInARow: 'Días seguidos' },
  nl: { newStory: '📖 Nieuw verhaal', myStories: '📚 Mijn verhalen', myWeek: 'Mijn week 🏆', seeAll: 'Alles bekijken →', stars: 'Sterren', daysInARow: 'Dagen op rij' },
  it: { newStory: '📖 Nuova storia', myStories: '📚 Le mie storie', myWeek: 'La mia settimana 🏆', seeAll: 'Vedi tutto →', stars: 'Stelle', daysInARow: 'Giorni di fila' },
  bs: { newStory: '📖 Nova priča', myStories: '📚 Moje priče', myWeek: 'Moja sedmica 🏆', seeAll: 'Pogledaj sve →', stars: 'Zvijezde', daysInARow: 'Dana zaredom' },
};

// Weekday labels per language (Mon–Sun)
const WEEKDAY_LABELS: Record<string, string[]> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  nl: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
  it: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
  bs: ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'],
};

// ═══ Helper: Monday 00:00 of current week ═══
function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // distance to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ═══ Helper: Current weekday index (0=Mon, 6=Sun) ═══
function getCurrentWeekdayIndex(): number {
  const day = new Date().getDay(); // 0=Sun, 1=Mon
  return day === 0 ? 6 : day - 1;
}

// ═══ Streak diamond config ═══
function getDiamondStyle(streak: number): { size: number; color: string; glow: string; animate: boolean } {
  if (streak >= 14) return { size: 32, color: '#FFD700', glow: '0 0 12px rgba(255,215,0,0.5)', animate: true };
  if (streak >= 7)  return { size: 32, color: '#B9F2FF', glow: '0 0 10px rgba(185,242,255,0.5)', animate: true };
  if (streak >= 4)  return { size: 24, color: '#B9F2FF', glow: '0 0 6px rgba(185,242,255,0.3)', animate: false };
  if (streak >= 1)  return { size: 16, color: '#B9F2FF', glow: 'none', animate: false };
  return { size: 16, color: '#D1D5DB', glow: 'none', animate: false };
}

// ═══ Main Component ═══
const HomeFablino = () => {
  const navigate = useNavigate();
  const { user, needsMigration } = useAuth();
  const {
    kidProfiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    hasMultipleProfiles,
    kidAppLanguage,
  } = useKidProfile();
  const location = useLocation();
  const { state: gamificationState, refreshProgress } = useGamification();

  // Refresh gamification data every time we navigate to this page
  useEffect(() => {
    if (location.pathname === '/') {
      refreshProgress();
    }
  }, [location.key]); // location.key changes on every navigation

  // Profile switcher dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Weekly stats
  const [weeklyStories, setWeeklyStories] = useState(0);
  // Per-day story tracking (Mon=0 .. Sun=6)
  const [storyDays, setStoryDays] = useState<boolean[]>([false, false, false, false, false, false, false]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  // Load weekly data from user_results
  useEffect(() => {
    if (!selectedProfileId) return;
    const mondayISO = getMondayOfCurrentWeek();

    const loadWeeklyData = async () => {
      const { data } = await supabase
        .from("user_results")
        .select("activity_type, created_at")
        .eq("kid_profile_id", selectedProfileId)
        .gte("created_at", mondayISO);

      if (!data) return;

      let stories = 0;
      const days = [false, false, false, false, false, false, false];

      for (const row of data) {
        if (row.activity_type === "story_completed" || row.activity_type === "story_read") {
          stories++;
          // Mark which day of the week this story was read
          const d = new Date(row.created_at);
          const dayOfWeek = d.getDay(); // 0=Sun
          const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // convert to Mon=0
          days[idx] = true;
        }
      }
      setWeeklyStories(stories);
      setStoryDays(days);
    };

    loadWeeklyData();
  }, [selectedProfileId, location.key]); // re-fetch when navigating back to homepage

  // Resolve language (fallback to 'de')
  const lang = kidAppLanguage || 'de';
  const greet = GREETINGS[lang] || GREETINGS['de'];
  const ui = UI_TEXTS[lang] || UI_TEXTS['de'];
  const weekdays = WEEKDAY_LABELS[lang] || WEEKDAY_LABELS['de'];

  const kidName = selectedProfile?.name || "";
  const greeting = kidName ? greet.withName(kidName) : greet.withoutName;

  // Streak from gamification state (state has .currentStreak directly, not .streak.current)
  const currentStreak = gamificationState?.currentStreak ?? 0;
  const diamondStyle = getDiamondStyle(currentStreak);
  const todayIdx = getCurrentWeekdayIndex();

  return (
    <div 
      className="min-h-screen flex flex-col items-center font-nunito overflow-hidden"
    >
      <div className="w-full max-w-[480px] px-5 py-6 flex flex-col relative" style={{ minHeight: "100dvh" }}>

        {/* ═══ TOP BAR: Profile Switcher (left) + Admin Controls (right) ═══ */}
        <div className="flex items-center justify-between z-10 mb-1">
          {/* Profile Switcher (only if multiple kids) */}
          {hasMultipleProfiles ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-[20px] bg-white border border-orange-100 transition-colors hover:bg-orange-50"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              >
                <span className="font-nunito text-[14px] font-bold" style={{ color: "#92400E" }}>
                  {selectedProfile?.name || ""} ▼
                </span>
              </button>

              {/* Dropdown */}
              {showProfileDropdown && (
                <div
                  className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-orange-100 py-1 min-w-[160px] z-20"
                  style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                  {kidProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfileId(profile.id);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-orange-50 transition-colors"
                    >
                      <span
                        className="font-nunito text-[14px] font-semibold flex-1"
                        style={{ color: profile.id === selectedProfileId ? "#FF8C42" : "#2D1810" }}
                      >
                        {profile.name}
                      </span>
                      {profile.id === selectedProfileId && (
                        <span className="text-[14px]" style={{ color: "#FF8C42" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div /> /* empty spacer */
          )}

          {/* Admin Controls */}
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate("/feedback-stats")}
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100 hover:bg-orange-50 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-orange-400" />
              </button>
            )}
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100 hover:bg-orange-50 transition-colors"
            >
              <Settings className="h-5 w-5 text-orange-400" />
            </button>
          </div>
        </div>

        {/* ═══ MIGRATION BANNER for legacy users ═══ */}
        {needsMigration && (
          <div className="w-full mb-3">
            <MigrationBanner language={kidAppLanguage} />
          </div>
        )}

        {/* ═══ 1. FABLINO GREETING (Hero) — uses shared FablinoPageHeader ═══ */}
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={greeting}
          mascotSize="md"
        />

        {/* ═══ 2. MAIN ACTIONS ═══ */}
        <div className="flex flex-col gap-3 mb-4 items-center">
          {/* Primary Button - New Story */}
          <button
            onClick={() => navigate("/create-story")}
            className={FABLINO_STYLES.primaryButton}
          >
            {ui.newStory}
          </button>

          {/* Secondary Button - My Stories */}
          <button
            onClick={() => navigate("/stories")}
            className={FABLINO_STYLES.secondaryButton}
          >
            {ui.myStories}
          </button>
        </div>

        {/* ═══ 3. WEEKLY TRACKER CARD (Redesigned) ═══ */}
        <div 
          className="rounded-[20px] p-5 mb-4"
          style={{
            background: "white",
            border: "1px solid #F0E8E0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-[18px]" style={{ color: "#2D1810" }}>
              {ui.myWeek}
            </h3>
            <button
              onClick={() => navigate("/results")}
              className="font-semibold text-[13px] hover:underline"
              style={{ color: "#FF8C42" }}
            >
              {ui.seeAll}
            </button>
          </div>

          {/* Story tracker: 7 circles = 7 days */}
          <div className="flex justify-between mb-4 px-1">
            {weekdays.map((dayLabel, i) => {
              const filled = storyDays[i];
              const isToday = i === todayIdx;
              return (
                <div key={`day-${i}`} className="flex flex-col items-center gap-1">
                  <div
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: 36,
                      height: 36,
                      background: filled ? '#E8863A' : 'transparent',
                      border: isToday && !filled
                        ? '2.5px solid #E8863A'
                        : filled
                          ? '2px solid #D4752E'
                          : '2px solid #E0E0E0',
                      boxShadow: isToday ? '0 0 0 3px rgba(232,134,58,0.15)' : 'none',
                    }}
                  >
                    {filled && (
                      <span style={{ fontSize: 16, lineHeight: 1, color: 'white' }}>✓</span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isToday ? '#E8863A' : filled ? '#2D1810' : '#aaa' }}
                  >
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats row: Stars + Streak side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stars mini-card */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>⭐</span>
              <div>
                <p className="font-extrabold text-[22px] leading-tight" style={{ color: '#2D1810' }}>
                  {gamificationState?.stars ?? 0}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#92400E' }}>
                  {ui.stars}
                </p>
              </div>
            </div>

            {/* Streak diamond mini-card */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: '#F0F9FF', border: '1px solid #93C5FD' }}
            >
              <span
                style={{
                  fontSize: diamondStyle.size,
                  lineHeight: 1,
                  filter: currentStreak === 0 ? 'grayscale(1) opacity(0.4)' : 'none',
                  boxShadow: diamondStyle.glow,
                  borderRadius: '50%',
                  animation: diamondStyle.animate ? 'gentleBounce 2s ease-in-out infinite' : 'none',
                }}
              >
                💎
              </span>
              <div>
                <p className="font-extrabold text-[22px] leading-tight" style={{ color: '#2D1810' }}>
                  {currentStreak}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#1E40AF' }}>
                  {ui.daysInARow}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default HomeFablino;
