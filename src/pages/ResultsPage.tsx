import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, BookOpen, Brain, Star, Sparkles } from "lucide-react";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";

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
  }, [user]);

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

      // Load user results filtered by user_id
      const { data: results } = await supabase
        .from("user_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (results) {
        // Calculate totals by category
        let storyPts = 0;
        let quizPts = 0;
        let storyCount = 0;
        let quizCount = 0;

        results.forEach((r: UserResult) => {
          if (r.activity_type === 'story_read') {
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

      // Load learned words count - only from user's stories
      const { data: learnedData } = await supabase
        .from("marked_words")
        .select("*, stories!inner(user_id)")
        .eq("is_learned", true);
      
      const userLearnedCount = learnedData?.filter((w: any) => w.stories?.user_id === user.id).length || 0;
      setWordsLearned(userLearnedCount);

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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-primary/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
            Mes Résultats
          </h1>
        </div>
      </div>

      <div className="container max-w-4xl p-4 md:p-8">
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
            <p className="text-lg text-muted-foreground mb-3">Points totaux</p>
            
            {/* Level Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-1.5">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-baloo font-bold">{levelInfo.title}</span>
            </div>
            
            {/* Progress to next level */}
            {!isMaxLevel && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Encore {levelInfo.nextLevel - totalPoints} points pour le niveau suivant
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
              <CardTitle className="text-lg font-baloo">Histoires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary mb-1">{storyPoints}</p>
              <p className="text-sm text-muted-foreground">{storiesRead} histoires lues</p>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card className="border-2 border-secondary/30">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-lg font-baloo">Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary mb-1">{quizPoints}</p>
              <p className="text-sm text-muted-foreground">{quizzesPassed} quiz réussis</p>
            </CardContent>
          </Card>
        </div>

        {/* Vocabulary Stats */}
        <Card className="border-2 border-lavender/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Vocabulaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-purple-700">{wordsLearned}</p>
                <p className="text-muted-foreground">mots appris</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  (3x correct de suite = appris)
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
            Lire une histoire
          </Button>
          <Button
            onClick={() => navigate("/quiz")}
            variant="outline"
            className="btn-kid"
          >
            <Brain className="h-5 w-5 mr-2" />
            Faire un quiz
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
