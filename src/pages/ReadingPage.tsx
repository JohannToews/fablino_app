import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, BookOpen, HelpCircle } from "lucide-react";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";
import FlipbookReader from "@/components/FlipbookReader";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty?: string;
}

const ReadingPage = () => {
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (id) {
      loadStory();
      checkForQuestions();
    }
  }, [id]);

  const checkForQuestions = async () => {
    const { count } = await supabase
      .from("comprehension_questions")
      .select("*", { count: "exact", head: true })
      .eq("story_id", id);
    
    setHasQuestions((count || 0) > 0);
  };

  const loadStory = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setStory(data);
      // Automatically enter fullscreen reading mode
      setIsFullscreen(true);
    } else {
      toast.error("Histoire non trouvée");
      navigate("/stories");
    }
    setIsLoading(false);
  };

  const handleFinishReading = async () => {
    if (hasQuestions) {
      setShowQuiz(true);
      setIsFullscreen(false);
    } else {
      // Save story read points
      const { data: pointData } = await supabase
        .from("point_settings")
        .select("points")
        .eq("category", "story")
        .eq("difficulty", story?.difficulty || "medium")
        .maybeSingle();
      
      const storyPoints = pointData?.points || 10;
      
      await supabase.from("user_results").insert({
        activity_type: "story_read",
        reference_id: id,
        difficulty: story?.difficulty || "medium",
        points_earned: storyPoints,
        user_id: user?.id,
      });
      
      toast.success(`Super! Tu as fini de lire! 🏆 (+${storyPoints} points)`);
      navigate("/stories");
    }
  };

  const handleQuizComplete = async (correctCount: number, totalCount: number) => {
    if (correctCount > 0) {
      const { data: pointData } = await supabase
        .from("point_settings")
        .select("points")
        .eq("category", "question")
        .eq("difficulty", story?.difficulty || "medium")
        .maybeSingle();
      
      const pointsPerQuestion = pointData?.points || 3;
      const earnedPoints = correctCount * pointsPerQuestion;
      
      await supabase.from("user_results").insert({
        activity_type: "question_answered",
        reference_id: id,
        difficulty: story?.difficulty || "medium",
        points_earned: earnedPoints,
        correct_answers: correctCount,
        total_questions: totalCount,
        user_id: user?.id,
      });
      
      toast.success(`Bravo! Tu as fini le quiz! 🏆 (+${earnedPoints} points)`);
    } else {
      toast.success("Bravo! Tu as fini le quiz! 🏆");
    }
    navigate("/stories");
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  // Fullscreen Flipbook Mode
  if (isFullscreen && story && !showQuiz) {
    return (
      <div className={`fixed inset-0 bg-gradient-to-br ${paletteColors.bg} flex flex-col`}>
        {/* Minimal header */}
        <div className="flex items-center justify-between p-4 bg-background/90 backdrop-blur-sm border-b border-border">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/stories")}
            className="h-12 w-12 rounded-full border-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl font-baloo text-foreground truncate max-w-[55%] text-center">
            {story.title}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/quiz")}
            className="h-12 w-12 rounded-full border-2 hover:bg-accent/10"
          >
            <BookOpen className="h-6 w-6" />
          </Button>
        </div>

        {/* Flipbook reader - no separate cover image display, it's now page 0 */}
        <div className="flex-1 overflow-hidden bg-card">
          <FlipbookReader 
            content={story.content}
            storyId={story.id}
            coverImageUrl={story.cover_image_url}
            onFinishReading={handleFinishReading}
          />
        </div>
      </div>
    );
  }

  // Quiz mode (after reading)
  if (showQuiz && story) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/stories")}
              className="rounded-full hover:bg-primary/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
              {story.title}
            </h1>
          </div>
        </div>

        <div className="container max-w-4xl p-4 md:p-8">
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-baloo font-bold">Questions de compréhension</h2>
            </div>
            <ComprehensionQuiz 
              storyId={id!}
              storyDifficulty={story.difficulty || "medium"}
              onComplete={handleQuizComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ReadingPage;
