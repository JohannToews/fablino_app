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
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
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

      // First, get the stories for the selected kid profile
      let storiesQuery = supabase
        .from("stories")
        .select("id")
        .eq("user_id", user.id);
      
      if (selectedProfileId) {
        storiesQuery = storiesQuery.or(`kid_profile_id.eq.${selectedProfileId},kid_profile_id.is.null`);
      }
      
      const { data: storiesData } = await storiesQuery;
      const storyIds = storiesData?.map(s => s.id) || [];

      // Load user results filtered by user_id AND by stories belonging to selected kid profile
      const { data: results } = await supabase
        .from("user_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (results) {
        // Calculate totals by category, filtering by kid profile's stories
        let storyPts = 0;
        let quizPts = 0;
        let storyCount = 0;
        let quizCount = 0;

        results.forEach((r: UserResult) => {
          // For story activities, check if the reference_id is in our kid's stories
          if (r.activity_type === 'story_read' || r.activity_type === 'story_completed') {
            if (!selectedProfileId || (r.reference_id && storyIds.includes(r.reference_id))) {
              storyPts += r.points_earned;
              storyCount++;
            }
          } else if (r.activity_type === 'quiz_passed') {
            // Quiz results are not directly linked to stories/kid profiles in the current schema
            // For now, show all quiz results (could be enhanced with kid_profile_id on user_results)
            if (!selectedProfileId || storyIds.length > 0) {
              quizPts += r.points_earned;
              quizCount++;
            }
          }
        });

        setStoryPoints(storyPts);
        setQuizPoints(quizPts);
        setStoriesRead(storyCount);
        setQuizzesPassed(quizCount);
        setTotalPoints(storyPts + quizPts);
      }

      // Load learned words count - only from kid's stories
      if (storyIds.length > 0) {
        const { data: learnedData } = await supabase
          .from("marked_words")
          .select("id")
          .eq("is_learned", true)
          .in("story_id", storyIds);
        
        setWordsLearned(learnedData?.length || 0);
      } else if (!selectedProfileId) {
        // If no profile selected, load all user's learned words
        const { data: learnedData } = await supabase
          .from("marked_words")
          .select("*, stories!inner(user_id)")
          .eq("is_learned", true);
        
        const userLearnedCount = learnedData?.filter((w: any) => w.stories?.user_id === user.id).length || 0;
        setWordsLearned(userLearnedCount);
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
      <PageHeader title="Mes Résultats" backTo="/" />

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
              Points totaux {selectedProfile && `- ${selectedProfile.name}`}
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
