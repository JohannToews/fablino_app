import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Settings, Sparkles, Star, Users, BarChart3, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useKidProfile } from "@/hooks/useKidProfile";
import { getTranslations } from "@/lib/translations";
import { useGamification } from "@/hooks/useGamification";
import FablinoReaction from "@/components/FablinoReaction";
import MigrationBanner from "@/components/MigrationBanner";

const Index = () => {
  const navigate = useNavigate();
  const { user, needsMigration } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const {
    kidProfiles,
    selectedProfileId,
    selectedProfile,
    setSelectedProfileId,
    hasMultipleProfiles,
    kidAppLanguage,
    isLoading,
  } = useKidProfile();

  const {
    state: gamification,
    isLoading: gamLoading,
    pendingLevelUp,
    clearPendingLevelUp,
  } = useGamification();

  const t = getTranslations(kidAppLanguage);
  const childName = selectedProfile?.name || '';

  // ═══ Fablino greeting (contextual) ═══

  const getFablinoGreeting = (): string => {
    if (!gamification || !childName) {
      return t.fablinoWelcome.replace('{name}', childName);
    }
    if (gamification.isStreakDay) {
      return t.fablinoAlreadyRead;
    }
    if (gamification.currentStreak === 0 && gamification.storiesCompleted > 0) {
      return t.fablinoWelcomeBack.replace('{name}', childName);
    }
    if (gamification.currentStreak > 0) {
      return t.fablinoStreak
        .replace('{days}', String(gamification.currentStreak))
        .replace('{name}', childName);
    }
    return t.fablinoWelcome.replace('{name}', childName);
  };

  // ═══ Level title translation ═══

  const getTranslatedLevelTitle = (titleKey: string): string => {
    const key = `level${titleKey.charAt(0).toUpperCase() + titleKey.slice(1)}` as keyof typeof t;
    return (t[key] as string) || titleKey;
  };

  // ═══ Loading ═══

  if (isLoading || gamLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Star className="h-12 w-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} overflow-hidden`}>
      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-20 h-20 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} />
        <div className={`absolute top-40 right-20 w-32 h-32 ${paletteColors.accent} rounded-full blur-3xl animate-bounce-soft`} style={{ animationDelay: "0.5s" }} />
        <div className={`absolute bottom-40 left-1/4 w-24 h-24 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative container max-w-2xl mx-auto px-4 py-3 flex flex-col items-center">
        {/* Migration Banner */}
        {needsMigration && (
          <div className="w-full mb-3">
            <MigrationBanner language={kidAppLanguage} />
          </div>
        )}

        {/* Top Right Icons */}
        <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate("/feedback-stats")}
              className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => navigate("/admin")}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Profile Selector (multiple kids) */}
        {hasMultipleProfiles && (
          <div className="flex items-center justify-center gap-2 mt-12 mb-3 w-full">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200
                  ${selectedProfileId === profile.id
                    ? 'bg-primary/20 ring-2 ring-primary'
                    : 'bg-card/60 hover:bg-card/80'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0
                  ${selectedProfileId === profile.id ? 'border-primary' : 'border-border'}
                `}>
                  {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className={`
                  text-sm font-medium whitespace-nowrap
                  ${selectedProfileId === profile.id ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ═══ BEREICH 1: Profil + Fablino (horizontal) ═══ */}
        <div className={`flex items-center gap-5 w-full mb-8 ${hasMultipleProfiles ? '' : 'mt-14'}`}>
          {/* Profilbild – GROSS */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary/30 flex-shrink-0 shadow-lg">
            {selectedProfile?.cover_image_url ? (
              <img
                src={selectedProfile.cover_image_url}
                alt={childName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Rechte Seite: Name + Stats + Fablino-Sprechblase */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-baloo font-bold text-foreground leading-tight truncate">
              {t.fablinoWelcome.replace('{name}', childName)}
            </h1>

            {gamification && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                <span>⭐ {gamification.stars}</span>
                <span>📖 {getTranslatedLevelTitle(gamification.levelTitle)}</span>
                {gamification.currentStreak > 0 && (
                  <span>🔥 {gamification.currentStreak}</span>
                )}
              </div>
            )}

            {/* Fablino-Sprechblase */}
            <div className="flex items-end gap-2 mt-3">
              <img
                src="/mascot/6_Onboarding.png"
                alt="Fablino"
                className="w-12 h-12 object-contain flex-shrink-0"
              />
              <div className="bg-primary/10 rounded-xl rounded-bl-none px-3 py-2 max-w-[220px]">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {getFablinoGreeting()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BEREICH 2: Vier Kacheln (grid 2x2) ═══ */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Créer une histoire */}
          <Card
            onClick={() => navigate("/create-story")}
            className="cursor-pointer border-2 border-primary/30 hover:border-primary hover:shadow-lg transition-all group touch-manipulation"
          >
            <CardContent className="flex items-center gap-3 p-3 md:p-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-baloo font-bold text-sm md:text-base leading-tight">{t.createStory}</h3>
            </CardContent>
          </Card>

          {/* Lire une histoire */}
          <Card
            onClick={() => navigate("/stories")}
            className="cursor-pointer border-2 border-sky-200 hover:border-sky-400 hover:shadow-lg transition-all group touch-manipulation"
          >
            <CardContent className="flex items-center gap-3 p-3 md:p-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-sky-600" />
              </div>
              <h3 className="font-baloo font-bold text-sm md:text-base leading-tight">{t.readStory}</h3>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card
            onClick={() => navigate("/quiz")}
            className="cursor-pointer border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all group touch-manipulation"
          >
            <CardContent className="flex items-center gap-3 p-3 md:p-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
              </div>
              <h3 className="font-baloo font-bold text-sm md:text-base leading-tight">{t.wordQuiz}</h3>
            </CardContent>
          </Card>

          {/* Mon album de stickers */}
          <Card
            onClick={() => navigate("/sticker-buch")}
            className="cursor-pointer border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all group touch-manipulation"
          >
            <CardContent className="flex items-center gap-3 p-3 md:p-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-lg md:text-xl">📖</span>
              </div>
              <h3 className="font-baloo font-bold text-sm md:text-base leading-tight">{t.stickerBook}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Level Up Overlay */}
        {pendingLevelUp && (
          <FablinoReaction
            type="levelUp"
            message={t.fablinoLevelUp.replace('{title}', getTranslatedLevelTitle(pendingLevelUp.title))}
            onClose={clearPendingLevelUp}
            buttonLabel={t.continueButton}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
