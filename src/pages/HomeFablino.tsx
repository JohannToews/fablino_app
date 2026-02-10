import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
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
}> = {
  fr: { newStory: '📖 Nouvelle histoire', myStories: '📚 Mes histoires', myWeek: 'Ma semaine 🏆', seeAll: 'Tout voir →' },
  de: { newStory: '📖 Neue Geschichte starten', myStories: '📚 Meine Geschichten', myWeek: 'Meine Woche 🏆', seeAll: 'Alle Ergebnisse →' },
  en: { newStory: '📖 New story', myStories: '📚 My stories', myWeek: 'My week 🏆', seeAll: 'See all →' },
  es: { newStory: '📖 Nueva historia', myStories: '📚 Mis historias', myWeek: 'Mi semana 🏆', seeAll: 'Ver todo →' },
  nl: { newStory: '📖 Nieuw verhaal', myStories: '📚 Mijn verhalen', myWeek: 'Mijn week 🏆', seeAll: 'Alles bekijken →' },
  it: { newStory: '📖 Nuova storia', myStories: '📚 Le mie storie', myWeek: 'La mia settimana 🏆', seeAll: 'Vedi tutto →' },
  bs: { newStory: '📖 Nova priča', myStories: '📚 Moje priče', myWeek: 'Moja sedmica 🏆', seeAll: 'Pogledaj sve →' },
};

// Tips removed – section no longer shown on home screen

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

// ═══ Main Component ═══
const HomeFablino = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    kidProfiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    hasMultipleProfiles,
    kidAppLanguage,
  } = useKidProfile();
  const { state: gamificationState } = useGamification();

  // Profile switcher dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Weekly stats
  const [weeklyStars, setWeeklyStars] = useState(0);
  const [weeklyStories, setWeeklyStories] = useState(0);
  const [weeklyQuizzes, setWeeklyQuizzes] = useState(0);

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
        .select("activity_type, stars_earned")
        .eq("kid_profile_id", selectedProfileId)
        .gte("created_at", mondayISO);

      if (!data) return;

      let stars = 0;
      let stories = 0;
      let quizzes = 0;
      for (const row of data) {
        stars += row.stars_earned || 0;
        if (row.activity_type === "story_completed" || row.activity_type === "story_read") stories++;
        if (row.activity_type === "quiz_complete" || row.activity_type === "quiz_completed") quizzes++;
      }
      setWeeklyStars(stars);
      setWeeklyStories(stories);
      setWeeklyQuizzes(quizzes);
    };

    loadWeeklyData();
  }, [selectedProfileId]);

  // Resolve language (fallback to 'de')
  const lang = kidAppLanguage || 'de';
  const greet = GREETINGS[lang] || GREETINGS['de'];
  const ui = UI_TEXTS[lang] || UI_TEXTS['de'];

  const kidName = selectedProfile?.name || "";
  const greeting = kidName ? greet.withName(kidName) : greet.withoutName;

  // Capped values for visual display
  const starsDisplay = Math.min(weeklyStars, 15);
  const storiesDisplay = Math.min(weeklyStories, 5);
  const quizzesDisplay = Math.min(weeklyQuizzes, 5);

  return (
    <div 
      className="min-h-screen flex flex-col items-center font-nunito overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)",
      }}
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

        {/* ═══ 3. WEEKLY TRACKER CARD ═══ */}
        <div 
          className="rounded-[20px] p-5 mb-4"
          style={{
            background: "white",
            border: "1px solid #F0E8E0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Title row: heading left, "See all" link right */}
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

          {/* 2-column grid: Stars left | Stories+Quiz right */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "12px 20px",
              alignItems: "center",
            }}
          >
            {/* LEFT: 3×5 Star Grid (spans 2 rows visually via gridRow) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 24px)",
                gridTemplateRows: "repeat(3, 24px)",
                gap: "6px 4px",
                gridRow: "1 / 3",
              }}
            >
              {[...Array(15)].map((_, i) => {
                const filled = i < starsDisplay;
                return (
                  <div
                    key={`star-${i}`}
                    className="flex items-center justify-center"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: filled ? "#FFD700" : "transparent",
                      border: filled ? "1.5px solid #E5B800" : "1.5px solid #E0E0E0",
                      fontSize: 13,
                      lineHeight: 1,
                      color: filled ? "#B8860B" : "#E0E0E0",
                    }}
                  >
                    {filled ? "★" : "☆"}
                  </div>
                );
              })}
            </div>

            {/* RIGHT TOP: Stories row */}
            <div className="flex items-center gap-2.5">
              <span className="text-[24px] flex-shrink-0">📖</span>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => {
                  const filled = i < storiesDisplay;
                  return (
                    <div
                      key={`story-${i}`}
                      className="flex items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: filled ? "#FFF7ED" : "transparent",
                        border: filled ? "2px solid #FF8C42" : "2px dashed #E5E5E5",
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      {filled ? "😊" : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT BOTTOM: Quiz row */}
            <div className="flex items-center gap-2.5">
              <span className="text-[24px] flex-shrink-0">🎯</span>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => {
                  const filled = i < quizzesDisplay;
                  return (
                    <div
                      key={`quiz-${i}`}
                      className="flex items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: filled ? "#F0FFF4" : "transparent",
                        border: filled ? "2px solid #50C878" : "2px dashed #E5E5E5",
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      {filled ? "✅" : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tip section removed – saves vertical space on tablet */}
      </div>

    </div>
  );
};

export default HomeFablino;
