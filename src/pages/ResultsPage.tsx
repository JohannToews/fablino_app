import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, BookOpen, Brain, Star, Sparkles, Users } from "lucide-react";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import PageHeader from "@/components/PageHeader";

// Translations for results page
const resultsTranslations: Record<string, {
  title: string;
  totalPoints: string;
  pointsToNext: string;
  stories: string;
  storiesRead: string;
  quiz: string;
  quizPassed: string;
  vocabulary: string;
  wordsLearned: string;
  learnedHint: string;
  readStory: string;
  takeQuiz: string;
}> = {
  de: {
    title: "Meine Ergebnisse",
    totalPoints: "Gesamtpunkte",
    pointsToNext: "Noch {n} Punkte bis zum nächsten Level",
    stories: "Geschichten",
    storiesRead: "{n} Geschichten gelesen",
    quiz: "Quiz",
    quizPassed: "{n} Quiz bestanden",
    vocabulary: "Wortschatz",
    wordsLearned: "Wörter gelernt",
    learnedHint: "(3x richtig = gelernt)",
    readStory: "Geschichte lesen",
    takeQuiz: "Quiz machen",
  },
  fr: {
    title: "Mes Résultats",
    totalPoints: "Points totaux",
    pointsToNext: "Encore {n} points pour le niveau suivant",
    stories: "Histoires",
    storiesRead: "{n} histoires lues",
    quiz: "Quiz",
    quizPassed: "{n} quiz réussis",
    vocabulary: "Vocabulaire",
    wordsLearned: "mots appris",
    learnedHint: "(3x correct de suite = appris)",
    readStory: "Lire une histoire",
    takeQuiz: "Faire un quiz",
  },
  en: {
    title: "My Results",
    totalPoints: "Total Points",
    pointsToNext: "{n} more points to next level",
    stories: "Stories",
    storiesRead: "{n} stories read",
    quiz: "Quiz",
    quizPassed: "{n} quizzes passed",
    vocabulary: "Vocabulary",
    wordsLearned: "words learned",
    learnedHint: "(3x correct in a row = learned)",
    readStory: "Read a story",
    takeQuiz: "Take a quiz",
  },
  es: {
    title: "Mis Resultados",
    totalPoints: "Puntos totales",
    pointsToNext: "{n} puntos más para el siguiente nivel",
    stories: "Historias",
    storiesRead: "{n} historias leídas",
    quiz: "Quiz",
    quizPassed: "{n} quiz aprobados",
    vocabulary: "Vocabulario",
    wordsLearned: "palabras aprendidas",
    learnedHint: "(3x correcto seguido = aprendido)",
    readStory: "Leer una historia",
    takeQuiz: "Hacer un quiz",
  },
  nl: {
    title: "Mijn Resultaten",
    totalPoints: "Totale punten",
    pointsToNext: "Nog {n} punten voor het volgende niveau",
    stories: "Verhalen",
    storiesRead: "{n} verhalen gelezen",
    quiz: "Quiz",
    quizPassed: "{n} quizzen geslaagd",
    vocabulary: "Woordenschat",
    wordsLearned: "woorden geleerd",
    learnedHint: "(3x correct achter elkaar = geleerd)",
    readStory: "Verhaal lezen",
    takeQuiz: "Quiz doen",
  },
};

interface UserResult {
  id: string;
  activity_type: string;
  reference_id: string | null;
  difficulty: string | null;
  points_earned: number;
  correct_answers: number | null;
  total_questions: number | null;
  created_at: string;
}

interface LevelSetting {
  level_number: number;
  title: string;
  min_points: number;
}

const ResultsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [storyPoints, setStoryPoints] = useState(0);
  const [quizPoints, setQuizPoints] = useState(0);
  const [storiesRead, setStoriesRead] = useState(0);
  const [quizzesPassed, setQuizzesPassed] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [levels, setLevels] = useState<LevelSetting[]>([]);

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user, selectedProfileId]);

  const loadResults = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Load level settings
      const { data: levelData } = await supabase
        .from("level_settings")
        .select("*")
        .order("level_number");

      if (levelData) {
        setLevels(levelData);
      }

      // Load user results filtered by kid_profile_id
      let resultsQuery = supabase
        .from("user_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      // Filter by kid profile if selected
      if (selectedProfileId) {
        resultsQuery = resultsQuery.eq("kid_profile_id", selectedProfileId);
      }
      
      const { data: results } = await resultsQuery;

      if (results) {
        // Calculate totals by category
        let storyPts = 0;
        let quizPts = 0;
        let storyCount = 0;
        let quizCount = 0;

        results.forEach((r: UserResult) => {
          if (r.activity_type === 'story_read' || r.activity_type === 'story_completed') {
            storyPts += r.points_earned;
            storyCount++;
          } else if (r.activity_type === 'quiz_passed') {
            quizPts += r.points_earned;
            quizCount++;
          }
        });

        setStoryPoints(storyPts);
        setQuizPoints(quizPts);
        setStoriesRead(storyCount);
        setQuizzesPassed(quizCount);
        setTotalPoints(storyPts + quizPts);
      }

      // Load learned words count - filter by kid profile's stories
      let storiesQuery = supabase
        .from("stories")
        .select("id")
        .eq("user_id", user.id);
      
      if (selectedProfileId) {
        storiesQuery = storiesQuery.eq("kid_profile_id", selectedProfileId);
      }
      
      const { data: storiesData } = await storiesQuery;
      const storyIds = storiesData?.map(s => s.id) || [];

      if (storyIds.length > 0) {
        const { data: learnedData } = await supabase
          .from("marked_words")
          .select("id")
          .eq("is_learned", true)
          .in("story_id", storyIds);
        
        setWordsLearned(learnedData?.length || 0);
      } else {
        setWordsLearned(0);
      }

    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevel = (points: number): { level: number; title: string; nextLevel: number } => {
    if (levels.length === 0) {
      return { level: 1, title: "Débutant", nextLevel: 50 };
    }

    // Find current level based on points
    let currentLevel = levels[0];
    let nextLevelPoints = levels[1]?.min_points || points;

    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].min_points) {
        currentLevel = levels[i];
        nextLevelPoints = levels[i + 1]?.min_points || points;
        break;
      }
    }

    return {
      level: currentLevel.level_number,
      title: currentLevel.title,
      nextLevel: nextLevelPoints
    };
  };

  const levelInfo = getLevel(totalPoints);
  const isMaxLevel = levels.length > 0 && levelInfo.level === levels[levels.length - 1]?.level_number;
  const t = resultsTranslations[kidAppLanguage] || resultsTranslations.de;

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-bounce-soft">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

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

        {/* Total Points Hero - More Compact */}
        <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
          <CardContent className="p-5 text-center relative">
            <div className="absolute top-3 right-3">
              <Sparkles className="h-6 w-6 text-primary/30 animate-sparkle" />
            </div>
            <Trophy className="h-14 w-14 text-primary mx-auto mb-2" />
            <p className="text-5xl md:text-6xl font-baloo font-bold text-primary mb-1">
              {totalPoints}
            </p>
            <p className="text-lg text-muted-foreground mb-3">
              {t.totalPoints} {selectedProfile && `- ${selectedProfile.name}`}
            </p>
            
            {/* Level Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-baloo font-bold">{levelInfo.title}</span>
            </div>
            
            {/* Progress to next level */}
            {!isMaxLevel && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {t.pointsToNext.replace('{n}', String(levelInfo.nextLevel - totalPoints))}
                </p>
                <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalPoints / levelInfo.nextLevel) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Stories */}
          <Card className="border-2 border-primary/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg font-baloo">{t.stories}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary mb-1">{storyPoints}</p>
              <p className="text-sm text-muted-foreground">{t.storiesRead.replace('{n}', String(storiesRead))}</p>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card className="border-2 border-secondary/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-lg font-baloo">{t.quiz}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary mb-1">{quizPoints}</p>
              <p className="text-sm text-muted-foreground">{t.quizPassed.replace('{n}', String(quizzesPassed))}</p>
            </CardContent>
          </Card>
        </div>

        {/* Vocabulary Stats */}
        <Card className="border-2 border-lavender/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {t.vocabulary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-purple-700">{wordsLearned}</p>
                <p className="text-muted-foreground">{t.wordsLearned}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {t.learnedHint}
                </p>
              </div>
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
    </div>
  );
};

export default ResultsPage;
