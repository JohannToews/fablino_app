import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useTranslations, Language } from "@/lib/translations";
import heroImage from "@/assets/hero-reading.jpg";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty: string | null;
}

// Difficulty labels in different languages
const difficultyLabels: Record<string, Record<string, string>> = {
  de: { easy: "Leicht", medium: "Mittel", difficult: "Schwer" },
  fr: { easy: "Facile", medium: "Moyen", difficult: "Difficile" },
  en: { easy: "Easy", medium: "Medium", difficult: "Hard" },
  es: { easy: "Fácil", medium: "Medio", difficult: "Difícil" },
  nl: { easy: "Makkelijk", medium: "Gemiddeld", difficult: "Moeilijk" },
};

const StorySelectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const appLang = (user?.appLanguage || 'fr') as Language;
  const t = useTranslations(appLang);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) {
      setStories(data);
    }
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      {/* Header */}
      <div className="p-4 md:p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="rounded-full hover:bg-primary/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Title */}
      <div className="text-center px-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-baloo text-foreground mb-2 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-primary animate-sparkle" />
          Choisis une histoire
          <Sparkles className="h-8 w-8 text-primary animate-sparkle" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Clique sur une histoire pour la lire
        </p>
      </div>

      {/* Stories Grid */}
      <div className="container max-w-5xl px-4 pb-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce-soft">
              <BookOpen className="h-16 w-16 text-primary" />
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <img
              src={heroImage}
              alt="Reading adventure"
              className="w-64 h-40 object-cover rounded-2xl mx-auto mb-6 shadow-card"
            />
            <p className="text-xl text-muted-foreground mb-4">
              Pas encore d'histoires
            </p>
            <Button
              onClick={() => navigate("/admin")}
              className="btn-primary-kid"
            >
              Ajouter une histoire
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => navigate(`/read/${story.id}`)}
                className="card-story group"
              >
                <div className="aspect-[4/3] mb-4 rounded-xl overflow-hidden bg-muted relative">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sunshine-light to-cotton-candy">
                      <BookOpen className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                  {story.difficulty && (
                    <Badge 
                      className={`absolute top-2 right-2 text-xs font-bold ${
                        story.difficulty === 'easy' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : story.difficulty === 'medium' 
                            ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      {difficultyLabels[appLang]?.[story.difficulty] || difficultyLabels.fr[story.difficulty] || story.difficulty}
                    </Badge>
                  )}
                </div>
                <h3 className="font-baloo text-xl font-bold text-center group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorySelectPage;
