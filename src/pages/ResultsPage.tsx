import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Brain, Sparkles, Users, ChevronRight } from "lucide-react";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import PageHeader from "@/components/PageHeader";
import { StreakFlame, StreakMilestoneCard } from "@/components/gamification/StreakFlame";
import { LevelBadge, LevelCard } from "@/components/gamification/LevelBadge";
import { PointsDisplay } from "@/components/gamification/PointsDisplay";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";

// Translations for results page
const resultsTranslations: Record<string, {
  title: string;
  totalPoints: string;
  pointsToNext: string;
  stories: string;
  storiesRead: string;
  quiz: string;
  quizPerfect: string;
  quizPassed: string;
  vocabulary: string;
  wordsLearned: string;
  learnedHint: string;
  readStory: string;
  takeQuiz: string;
  streak: string;
  streakDays: string;
  longestStreak: string;
  streakMilestones: string;
  levels: string;
  currentLevel: string;
}> = {
  de: {
    title: "Meine Ergebnisse",
    totalPoints: "Punkte",
    pointsToNext: "Noch {n} Punkte bis {level}",
    stories: "Geschichten",
    storiesRead: "{n} gelesen",
    quiz: "Quiz",
    quizPerfect: "{n} perfekt",
    quizPassed: "{n} bestanden",
    vocabulary: "Wortschatz",
    wordsLearned: "Wörter gelernt",
    learnedHint: "(3x richtig = gelernt)",
    readStory: "Geschichte lesen",
    takeQuiz: "Quiz machen",
    streak: "Lese-Flamme",
    streakDays: "{n} Tage",
    longestStreak: "Längste Serie: {n} Tage",
    streakMilestones: "Streak-Meilensteine",
    levels: "Stufen",
    currentLevel: "Aktuelles Level"
  },
  fr: {
    title: "Mes Résultats",
    totalPoints: "Points",
    pointsToNext: "Encore {n} points pour {level}",
    stories: "Histoires",
    storiesRead: "{n} lues",
    quiz: "Quiz",
    quizPerfect: "{n} parfaits",
    quizPassed: "{n} réussis",
    vocabulary: "Vocabulaire",
    wordsLearned: "mots appris",
    learnedHint: "(3x correct = appris)",
    readStory: "Lire une histoire",
    takeQuiz: "Faire un quiz",
    streak: "Flamme de lecture",
    streakDays: "{n} jours",
    longestStreak: "Plus longue série: {n} jours",
    streakMilestones: "Jalons de série",
    levels: "Niveaux",
    currentLevel: "Niveau actuel"
  },
  en: {
    title: "My Results",
    totalPoints: "Points",
    pointsToNext: "{n} more points to {level}",
    stories: "Stories",
    storiesRead: "{n} read",
    quiz: "Quiz",
    quizPerfect: "{n} perfect",
    quizPassed: "{n} passed",
    vocabulary: "Vocabulary",
    wordsLearned: "words learned",
    learnedHint: "(3x correct = learned)",
    readStory: "Read a story",
    takeQuiz: "Take a quiz",
    streak: "Reading Flame",
    streakDays: "{n} days",
    longestStreak: "Longest streak: {n} days",
    streakMilestones: "Streak Milestones",
    levels: "Levels",
    currentLevel: "Current Level"
  },
  es: {
    title: "Mis Resultados",
    totalPoints: "Puntos",
    pointsToNext: "{n} puntos más para {level}",
    stories: "Historias",
    storiesRead: "{n} leídas",
    quiz: "Quiz",
    quizPerfect: "{n} perfectos",
    quizPassed: "{n} aprobados",
    vocabulary: "Vocabulario",
    wordsLearned: "palabras aprendidas",
    learnedHint: "(3x correcto = aprendido)",
    readStory: "Leer una historia",
    takeQuiz: "Hacer un quiz",
    streak: "Llama de lectura",
    streakDays: "{n} días",
    longestStreak: "Mayor racha: {n} días",
    streakMilestones: "Hitos de racha",
    levels: "Niveles",
    currentLevel: "Nivel actual"
  },
  nl: {
    title: "Mijn Resultaten",
    totalPoints: "Punten",
    pointsToNext: "Nog {n} punten voor {level}",
    stories: "Verhalen",
    storiesRead: "{n} gelezen",
    quiz: "Quiz",
    quizPerfect: "{n} perfect",
    quizPassed: "{n} geslaagd",
    vocabulary: "Woordenschat",
    wordsLearned: "woorden geleerd",
    learnedHint: "(3x correct = geleerd)",
    readStory: "Verhaal lezen",
    takeQuiz: "Quiz doen",
    streak: "Leesvlam",
    streakDays: "{n} dagen",
    longestStreak: "Langste reeks: {n} dagen",
    streakMilestones: "Reeks mijlpalen",
    levels: "Niveaus",
    currentLevel: "Huidig niveau"
  },
  bs: {
    title: "Moji rezultati",
    totalPoints: "Bodova",
    pointsToNext: "Još {n} bodova do {level}",
    stories: "Priče",
    storiesRead: "{n} pročitano",
    quiz: "Kviz",
    quizPerfect: "{n} savršeno",
    quizPassed: "{n} položeno",
    vocabulary: "Vokabular",
    wordsLearned: "riječi naučeno",
    learnedHint: "(3x tačno = naučeno)",
    readStory: "Čitaj priču",
    takeQuiz: "Riješi kviz",
    streak: "Plamen čitanja",
    streakDays: "{n} dana",
    longestStreak: "Najduži niz: {n} dana",
    streakMilestones: "Prekretnice niza",
    levels: "Nivoi",
    currentLevel: "Trenutni nivo"
  }
};

interface LevelSetting {
  level_number: number;
  title: string;
  min_points: number;
  icon: string | null;
}

const STREAK_MILESTONE_POINTS: Record<number, number> = {
  3: 10,
  7: 25,
  14: 50,
  30: 100
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const { progress, isLoading, pendingLevelUp, clearPendingLevelUp } = useGamification();
  const [levels, setLevels] = useState<LevelSetting[]>([]);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [claimedMilestones, setClaimedMilestones] = useState<number[]>([]);

  // Load additional data
  useEffect(() => {
    const loadData = async () => {
      if (!user || !selectedProfileId) return;

      // Load level settings
      const { data: levelData } = await supabase
        .from("level_settings")
        .select("*")
        .order("level_number");
      
      if (levelData) setLevels(levelData);

      // Load learned words count
      const { data: storiesData } = await supabase
        .from("stories")
        .select("id")
        .eq("user_id", user.id)
        .eq("kid_profile_id", selectedProfileId);
      
      const storyIds = storiesData?.map(s => s.id) || [];

      if (storyIds.length > 0) {
        const { data: learnedData } = await supabase
          .from("marked_words")
          .select("id")
          .eq("is_learned", true)
          .in("story_id", storyIds);
        
        setWordsLearned(learnedData?.length || 0);
      }

      // Load claimed streak milestones
      const { data: milestonesData } = await supabase
        .from("streak_milestones")
        .select("milestone_days")
        .eq("kid_profile_id", selectedProfileId);
      
      if (milestonesData) {
        setClaimedMilestones([...new Set(milestonesData.map(m => m.milestone_days))]);
      }
    };

    loadData();
  }, [user, selectedProfileId]);

  const t = resultsTranslations[kidAppLanguage] || resultsTranslations.de;

  if (isLoading || !progress) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-bounce-soft">
          <StreakFlame streak={3} flameType="gold" size="lg" showCount={false} />
        </div>
      </div>
    );
  }

  const pointsToNextLevel = progress.level.nextLevelPoints 
    ? progress.level.nextLevelPoints - progress.totalPoints 
    : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      <PageHeader title={t.title} backTo="/" />

      <div className="container max-w-4xl p-4 md:p-8">
        {/* Kid Profile Selector */}
        {hasMultipleProfiles && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-2">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${selectedProfileId === profile.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                  {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm">{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hero Section - Points, Level, Streak */}
        <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
          <CardContent className="p-5">
            {/* Top Row: Points and Streak */}
            <div className="flex items-center justify-between mb-4">
              <PointsDisplay points={progress.totalPoints} size="lg" />
              
              <div className="flex items-center gap-2 bg-card/60 rounded-full px-4 py-2">
                <StreakFlame 
                  streak={progress.streak.current} 
                  flameType={progress.streak.flameType}
                  size="md"
                />
                <span className="text-sm text-muted-foreground">
                  {t.streakDays.replace('{n}', String(progress.streak.current))}
                </span>
              </div>
            </div>

            {/* Level Badge and Progress */}
            <div className="text-center space-y-3">
              <LevelBadge 
                level={progress.level} 
                totalPoints={progress.totalPoints}
                size="lg"
                className="justify-center"
              />
              
              {!progress.level.isMaxLevel && (
                <div className="max-w-md mx-auto space-y-1">
                  <Progress 
                    value={((progress.totalPoints - progress.level.minPoints) / 
                      ((progress.level.nextLevelPoints || 0) - progress.level.minPoints)) * 100} 
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.pointsToNext
                      .replace('{n}', String(pointsToNextLevel))
                      .replace('{level}', levels.find(l => l.level_number === progress.level.level + 1)?.title || '')}
                  </p>
                </div>
              )}
            </div>

            {/* Profile name */}
            {selectedProfile && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                {selectedProfile.name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Stories Read */}
          <Card className="border border-primary/20">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{progress.storiesReadTotal}</p>
              <p className="text-xs text-muted-foreground">{t.stories}</p>
            </CardContent>
          </Card>

          {/* Quiz Perfect */}
          <Card className="border border-secondary/20">
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-secondary">{progress.quizzesPerfect}</p>
              <p className="text-xs text-muted-foreground">{t.quizPerfect.replace('{n}', '')}</p>
            </CardContent>
          </Card>

          {/* Words Learned */}
          <Card className="border border-accent/20">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-accent">{wordsLearned}</p>
              <p className="text-xs text-muted-foreground">{t.vocabulary}</p>
            </CardContent>
          </Card>

          {/* Longest Streak */}
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <StreakFlame 
                streak={progress.streak.longest} 
                flameType={progress.streak.longest >= 30 ? 'diamond' : progress.streak.longest >= 14 ? 'gold' : progress.streak.longest >= 7 ? 'silver' : progress.streak.longest >= 3 ? 'bronze' : 'none'}
                showCount={false}
                size="md"
                className="justify-center mb-2"
              />
              <p className="text-2xl font-bold">{progress.streak.longest}</p>
              <p className="text-xs text-muted-foreground">Beste Serie</p>
            </CardContent>
          </Card>
        </div>

        {/* Streak Milestones */}
        <Card className="mb-6 border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-baloo flex items-center gap-2">
              <StreakFlame streak={7} flameType="gold" showCount={false} size="sm" />
              {t.streakMilestones}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[3, 7, 14, 30].map((milestone) => (
                <StreakMilestoneCard
                  key={milestone}
                  milestone={milestone}
                  achieved={progress.streak.longest >= milestone}
                  points={STREAK_MILESTONE_POINTS[milestone]}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level Overview */}
        <Card className="mb-8 border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-baloo flex items-center gap-2">
              {progress.level.icon}
              {t.levels}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {levels.map((level) => (
                <LevelCard
                  key={level.level_number}
                  levelNumber={level.level_number}
                  title={level.title}
                  icon={level.icon || '🔒'}
                  minPoints={level.min_points}
                  isUnlocked={progress.totalPoints >= level.min_points}
                  isCurrent={progress.level.level === level.level_number}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/stories")}
            className="btn-primary-kid"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            {t.readStory}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            onClick={() => navigate("/quiz")}
            variant="outline"
            className="btn-kid"
          >
            <Brain className="h-5 w-5 mr-2" />
            {t.takeQuiz}
          </Button>
        </div>
      </div>

      {/* Level Up Modal */}
      <LevelUpModal
        level={pendingLevelUp}
        onClose={clearPendingLevelUp}
        language={kidAppLanguage}
      />
    </div>
  );
};

export default ResultsPage;
