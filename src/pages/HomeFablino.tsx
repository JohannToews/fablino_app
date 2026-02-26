import { useNavigate, useLocation } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import MigrationBanner from "@/components/MigrationBanner";
import { Settings, BarChart3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { FABLINO_STYLES } from "@/constants/design-tokens";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { getTranslations } from "@/lib/translations";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ═══ Localized texts ═══

const GREETINGS: Record<string, { withName: (name: string) => string; withoutName: string }> = {
  fr: { withName: (n) => `Salut ${n} ! 😊 Envie d'une chouette histoire ?`, withoutName: "Salut ! 😊 Envie d'une chouette histoire ?" },
  de: { withName: (n) => `Hey ${n}! 😊 Lust auf eine tolle Geschichte?`, withoutName: "Hey! 😊 Lust auf eine tolle Geschichte?" },
  en: { withName: (n) => `Hey ${n}! 😊 Ready for an awesome story?`, withoutName: "Hey! 😊 Ready for an awesome story?" },
  es: { withName: (n) => `¡Hola ${n}! 😊 ¿Quieres una historia genial?`, withoutName: "¡Hola! 😊 ¿Quieres una historia genial?" },
  nl: { withName: (n) => `Hoi ${n}! 😊 Zin in een gaaf verhaal?`, withoutName: "Hoi! 😊 Zin in een gaaf verhaal?" },
  it: { withName: (n) => `Ciao ${n}! 😊 Voglia di una bella storia?`, withoutName: "Ciao! 😊 Voglia di una bella storia?" },
  bs: { withName: (n) => `Hej ${n}! 😊 Želiš li super priču?`, withoutName: "Hej! 😊 Želiš li super priču?" },
  tr: { withName: (n) => `Merhaba ${n}! 😊 Harika bir hikâye ister misin?`, withoutName: "Merhaba! 😊 Harika bir hikâye ister misin?" },
  bg: { withName: (n) => `Здравей ${n}! 😊 Искаш ли страхотна история?`, withoutName: "Здравей! 😊 Искаш ли страхотна история?" },
  ro: { withName: (n) => `Salut ${n}! 😊 Vrei o poveste grozavă?`, withoutName: "Salut! 😊 Vrei o poveste grozavă?" },
  pl: { withName: (n) => `Hej ${n}! 😊 Chcesz super historię?`, withoutName: "Hej! 😊 Chcesz super historię?" },
  lt: { withName: (n) => `Sveikas ${n}! 😊 Nori nuostabios istorijos?`, withoutName: "Sveikas! 😊 Nori nuostabios istorijos?" },
  hu: { withName: (n) => `Szia ${n}! 😊 Szeretnél egy klassz történetet?`, withoutName: "Szia! 😊 Szeretnél egy klassz történetet?" },
  ca: { withName: (n) => `Hola ${n}! 😊 Vols una història genial?`, withoutName: "Hola! 😊 Vols una història genial?" },
  sl: { withName: (n) => `Živjo ${n}! 😊 Bi rad/a super zgodbo?`, withoutName: "Živjo! 😊 Bi rad/a super zgodbo?" },
  pt: { withName: (n) => `Olá ${n}! 😊 Queres uma história incrível?`, withoutName: "Olá! 😊 Queres uma história incrível?" },
  sk: { withName: (n) => `Ahoj ${n}! 😊 Chceš super príbeh?`, withoutName: "Ahoj! 😊 Chceš super príbeh?" },
  uk: { withName: (n) => `Привіт ${n}! 😊 Хочеш класну історію?`, withoutName: "Привіт! 😊 Хочеш класну історію?" },
  ru: { withName: (n) => `Привет ${n}! 😊 Хочешь классную историю?`, withoutName: "Привет! 😊 Хочешь классную историю?" },
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
  tr: { newStory: '📖 Yeni hikâye', myStories: '📚 Hikâyelerim', myWeek: 'Haftam 🏆', seeAll: 'Tümünü gör →', stars: 'Yıldızlar', daysInARow: 'Gün üst üste' },
  bg: { newStory: '📖 Нова история', myStories: '📚 Моите истории', myWeek: 'Моята седмица 🏆', seeAll: 'Виж всичко →', stars: 'Звезди', daysInARow: 'Дни подред' },
  ro: { newStory: '📖 Poveste nouă', myStories: '📚 Poveștile mele', myWeek: 'Săptămâna mea 🏆', seeAll: 'Vezi tot →', stars: 'Stele', daysInARow: 'Zile la rând' },
  pl: { newStory: '📖 Nowa historia', myStories: '📚 Moje historie', myWeek: 'Mój tydzień 🏆', seeAll: 'Zobacz wszystko →', stars: 'Gwiazdki', daysInARow: 'Dni z rzędu' },
  lt: { newStory: '📖 Nauja istorija', myStories: '📚 Mano istorijos', myWeek: 'Mano savaitė 🏆', seeAll: 'Žiūrėti viską →', stars: 'Žvaigždės', daysInARow: 'Dienos iš eilės' },
  hu: { newStory: '📖 Új történet', myStories: '📚 Történeteim', myWeek: 'Hetem 🏆', seeAll: 'Összes →', stars: 'Csillagok', daysInARow: 'Nap egymás után' },
  ca: { newStory: '📖 Nova història', myStories: '📚 Les meves històries', myWeek: 'La meva setmana 🏆', seeAll: 'Veure tot →', stars: 'Estrelles', daysInARow: 'Dies seguits' },
  sl: { newStory: '📖 Nova zgodba', myStories: '📚 Moje zgodbe', myWeek: 'Moj teden 🏆', seeAll: 'Poglej vse →', stars: 'Zvezdice', daysInARow: 'Dni zapored' },
  pt: { newStory: '📖 Nova história', myStories: '📚 As minhas histórias', myWeek: 'Minha semana 🏆', seeAll: 'Ver tudo →', stars: 'Estrelas', daysInARow: 'Dias seguidos' },
  sk: { newStory: '📖 Nový príbeh', myStories: '📚 Moje príbehy', myWeek: 'Môj týždeň 🏆', seeAll: 'Zobraziť všetko →', stars: 'Hviezdičky', daysInARow: 'Dní v rade' },
  uk: { newStory: '📖 Нова історія', myStories: '📚 Мої історії', myWeek: 'Мій тиждень 🏆', seeAll: 'Усі результати →', stars: 'Зірки', daysInARow: 'Днів поспіль' },
  ru: { newStory: '📖 Новая история', myStories: '📚 Мои истории', myWeek: 'Моя неделя 🏆', seeAll: 'Все результаты →', stars: 'Звёзды', daysInARow: 'Дней подряд' },
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
  tr: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'],
  bg: ['По', 'Вт', 'Ср', 'Че', 'Пе', 'Съ', 'Не'],
  ro: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'],
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
  lt: ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'],
  hu: ['Hé', 'Ke', 'Sze', 'Cs', 'Pé', 'Szo', 'Va'],
  ca: ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'],
  sl: ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'],
  pt: ['Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá', 'Do'],
  sk: ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
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

  const {
    isInstalled,
    canPromptNatively,
    triggerInstall,
    bannerDismissed,
    dismissBanner,
    modalShown,
    markModalShown,
  } = useInstallPrompt();

  const t = getTranslations(kidAppLanguage);

  // Install modal state
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Refresh gamification data every time we navigate to this page
  useEffect(() => {
    if (location.pathname === '/') {
      refreshProgress();
    }
  }, [location.key]); // location.key changes on every navigation

  // One-time install modal: show after first story exists
  useEffect(() => {
    if (isInstalled || modalShown || !selectedProfileId) return;

    const checkStories = async () => {
      const { count } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("kid_profile_id", selectedProfileId)
        .eq("is_deleted", false);

      if (count && count > 0) {
        setShowInstallModal(true);
        markModalShown();
      }
    };

    checkStories();
  }, [isInstalled, modalShown, selectedProfileId, markModalShown]);

  // Profile switcher dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Weekly stats
  const [weeklyStories, setWeeklyStories] = useState(0);
  // Per-day story tracking (Mon=0 .. Sun=6)
  const [storyDays, setStoryDays] = useState<boolean[]>([false, false, false, false, false, false, false]);

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
      <div className="w-full max-w-[480px] px-4 py-4 sm:px-5 sm:py-6 flex flex-col relative" style={{ minHeight: "100dvh" }}>

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
            <div
              className="flex items-center px-3.5 py-1.5 rounded-[20px] bg-white border border-orange-100"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <span className="font-nunito text-[14px] font-bold" style={{ color: "#92400E" }}>
                {selectedProfile?.name || ""}
              </span>
            </div>
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

        {/* ═══ INSTALL BANNER (soft, dismissable) ═══ */}
        {!isInstalled && !bannerDismissed && (
          <div className="mx-0 mt-1 mb-2 p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/20 shadow-sm flex items-center gap-3">
            <img src="/mascot/1_happy_success.png" className="w-10 h-10" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#2D1810' }}>
                {t.installBannerTitle}
              </p>
              <p className="text-xs" style={{ color: 'rgba(45,24,16,0.6)' }}>
                {t.installBannerSubtitle}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissBanner} className="text-muted-foreground/40 px-1.5">✕</Button>
            <Button size="sm" onClick={triggerInstall} className="bg-primary text-primary-foreground rounded-xl px-4">
              {t.installBannerButton}
            </Button>
          </div>
        )}

        {/* ═══ 1. FABLINO GREETING (Hero) — uses shared FablinoPageHeader ═══ */}
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={greeting}
          mascotSize="sm"
        />

        {/* ═══ 2. MAIN ACTIONS ═══ */}
        <div className="flex flex-col gap-3 mb-4 items-center">
          {/* Primary Button - New Story */}
          <button
            onClick={() => navigate("/create-story")}
            data-premium-button="primary"
            className={FABLINO_STYLES.primaryButton + " !bg-blue-500 !hover:bg-blue-600"}
          >
            {ui.newStory}
          </button>

          {/* Secondary Button - My Stories */}
          <button
            onClick={() => navigate("/stories")}
            data-premium-button="secondary"
            className={FABLINO_STYLES.secondaryButton}
          >
            {ui.myStories}
          </button>
        </div>

        {/* ═══ 3. WEEKLY TRACKER CARD (Redesigned) ═══ */}
        <div 
          data-premium-card
          className="rounded-[20px] p-4 sm:p-5 mb-4"
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
                      width: 32,
                      height: 32,
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
              className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
              style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}
            >
              <span className="text-[22px] sm:text-[28px]" style={{ lineHeight: 1 }}>⭐</span>
              <div>
                <p className="font-extrabold text-[18px] sm:text-[22px] leading-tight" style={{ color: '#2D1810' }}>
                  {gamificationState?.stars ?? 0}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#92400E' }}>
                  {ui.stars}
                </p>
              </div>
            </div>

            {/* Streak diamond mini-card */}
            <div
              className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
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
                <p className="font-extrabold text-[18px] sm:text-[22px] leading-tight" style={{ color: '#2D1810' }}>
                  {currentStreak}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#1E40AF' }}>
                  {ui.daysInARow}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ INSTALL MODAL (one-time after first story) ═══ */}
        <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
          <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
            <img
              src="/mascot/1_happy_success.png"
              className="w-24 h-24 mx-auto mb-4 drop-shadow-md"
              alt=""
            />
            <h2 className="text-xl font-baloo font-bold mb-2" style={{ color: '#2D1810' }}>
              {t.installModalTitle}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(45,24,16,0.7)' }}>
              {t.installModalDescription}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { setShowInstallModal(false); triggerInstall(); }}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-md"
              >
                {t.installModalYes}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowInstallModal(false)}
                className="text-muted-foreground/50"
              >
                {t.installModalLater}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

    </div>
  );
};

export default HomeFablino;
