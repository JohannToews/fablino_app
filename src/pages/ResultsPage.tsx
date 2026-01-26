import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, BookOpen, Brain, MessageCircleQuestion, Star, Sparkles } from "lucide-react";

interface PointSettings {
  category: string;
  difficulty: string;
  points: number;
}

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

const ResultsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [storyPoints, setStoryPoints] = useState(0);
  const [questionPoints, setQuestionPoints] = useState(0);
  const [quizPoints, setQuizPoints] = useState(0);
  const [storiesRead, setStoriesRead] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [quizzesPassed, setQuizzesPassed] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      // Load all user results
      const { data: results } = await supabase
        .from("user_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (results) {
        // Calculate totals by category
        let storyPts = 0;
        let questionPts = 0;
        let quizPts = 0;
        let storyCount = 0;
        let questionCount = 0;
        let quizCount = 0;

        results.forEach((r: UserResult) => {
          if (r.activity_type === 'story_read') {
            storyPts += r.points_earned;
            storyCount++;
          } else if (r.activity_type === 'question_answered') {
            questionPts += r.points_earned;
            questionCount++;
          } else if (r.activity_type === 'quiz_passed') {
            quizPts += r.points_earned;
            quizCount++;
          }
        });

        setStoryPoints(storyPts);
        setQuestionPoints(questionPts);
        setQuizPoints(quizPts);
        setStoriesRead(storyCount);
        setQuestionsAnswered(questionCount);
        setQuizzesPassed(quizCount);
        setTotalPoints(storyPts + questionPts + quizPts);
      }

      // Load learned words count
      const { count: learnedCount } = await supabase
        .from("marked_words")
        .select("*", { count: "exact", head: true })
        .eq("is_learned", true);

      setWordsLearned(learnedCount || 0);

    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevel = (points: number): { level: number; title: string; nextLevel: number } => {
    if (points < 50) return { level: 1, title: "Débutant", nextLevel: 50 };
    if (points < 150) return { level: 2, title: "Apprenti", nextLevel: 150 };
    if (points < 300) return { level: 3, title: "Lecteur", nextLevel: 300 };
    if (points < 500) return { level: 4, title: "Expert", nextLevel: 500 };
    if (points < 800) return { level: 5, title: "Champion", nextLevel: 800 };
    return { level: 6, title: "Maître", nextLevel: points };
  };

  const levelInfo = getLevel(totalPoints);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-bounce-soft">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
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
            Meine Resultate
          </h1>
        </div>
      </div>

      <div className="container max-w-4xl p-4 md:p-8">
        {/* Total Points Hero */}
        <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
          <CardContent className="p-8 text-center relative">
            <div className="absolute top-4 right-4">
              <Sparkles className="h-8 w-8 text-primary/30 animate-sparkle" />
            </div>
            <Trophy className="h-20 w-20 text-primary mx-auto mb-4" />
            <p className="text-7xl md:text-8xl font-baloo font-bold text-primary mb-2">
              {totalPoints}
            </p>
            <p className="text-xl text-muted-foreground mb-4">Points totaux</p>
            
            {/* Level Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-6 py-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-baloo font-bold text-lg">Niveau {levelInfo.level}: {levelInfo.title}</span>
            </div>
            
            {/* Progress to next level */}
            {levelInfo.level < 6 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Encore {levelInfo.nextLevel - totalPoints} points pour le niveau suivant
                </p>
                <div className="w-full bg-muted rounded-full h-3 max-w-xs mx-auto">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalPoints / levelInfo.nextLevel) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Stories */}
          <Card className="border-2 border-mint/50">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-mint/30 flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-green-700" />
              </div>
              <CardTitle className="text-lg font-baloo">Histoires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700 mb-1">{storyPoints}</p>
              <p className="text-sm text-muted-foreground">{storiesRead} histoires lues</p>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="border-2 border-sky-blue/50">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-sky-blue/30 flex items-center justify-center mb-2">
                <MessageCircleQuestion className="h-6 w-6 text-blue-700" />
              </div>
              <CardTitle className="text-lg font-baloo">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700 mb-1">{questionPoints}</p>
              <p className="text-sm text-muted-foreground">{questionsAnswered} réponses correctes</p>
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card className="border-2 border-cotton-candy/50">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-cotton-candy/30 flex items-center justify-center mb-2">
                <Brain className="h-6 w-6 text-pink-700" />
              </div>
              <CardTitle className="text-lg font-baloo">Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-pink-700 mb-1">{quizPoints}</p>
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
