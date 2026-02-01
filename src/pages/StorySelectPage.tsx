import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sparkles, BookText, GraduationCap, CheckCircle2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, Language } from "@/lib/translations";
import heroImage from "@/assets/hero-reading.jpg";
import PageHeader from "@/components/PageHeader";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty: string | null;
  text_type: string | null;
  kid_profile_id: string | null;
}

// Difficulty labels in different languages
const difficultyLabels: Record<string, Record<string, string>> = {
  de: { easy: "Leicht", medium: "Mittel", difficult: "Schwer" },
  fr: { easy: "Facile", medium: "Moyen", difficult: "Difficile" },
  en: { easy: "Easy", medium: "Medium", difficult: "Hard" },
  es: { easy: "Fácil", medium: "Medio", difficult: "Difícil" },
  nl: { easy: "Makkelijk", medium: "Gemiddeld", difficult: "Moeilijk" },
};

// Tab labels in different languages
const tabLabels: Record<string, { fiction: string; nonFiction: string }> = {
  de: { fiction: "Geschichten", nonFiction: "Sachgeschichten" },
  fr: { fiction: "Histoires", nonFiction: "Documentaires" },
  en: { fiction: "Stories", nonFiction: "Non-Fiction" },
  es: { fiction: "Historias", nonFiction: "No Ficción" },
  nl: { fiction: "Verhalen", nonFiction: "Non-Fictie" },
};

// Status labels in different languages
const statusLabels: Record<string, { toRead: string; completed: string }> = {
  de: { toRead: "Noch zu lesen", completed: "Abgeschlossen" },
  fr: { toRead: "À lire", completed: "Terminée" },
  en: { toRead: "To read", completed: "Completed" },
  es: { toRead: "Por leer", completed: "Completada" },
  nl: { toRead: "Te lezen", completed: "Voltooid" },
};

const StorySelectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId } = useKidProfile();
  const appLang = (user?.textLanguage || 'fr') as Language;
  const t = useTranslations(appLang);
  const [stories, setStories] = useState<Story[]>([]);
  const [storyStatuses, setStoryStatuses] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, selectedProfileId]);

  const loadStories = async () => {
    if (!user) return;
    
    // Build query - filter by kid_profile_id if selected, but also include stories without a kid profile (legacy)
    let query = supabase
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    // Filter by selected kid profile OR stories without a kid profile (legacy stories)
    if (selectedProfileId) {
      query = query.or(`kid_profile_id.eq.${selectedProfileId},kid_profile_id.is.null`);
    }
    
    const { data: storiesData } = await query;
    
    if (storiesData) {
      setStories(storiesData);
      
      // Load completion status for all stories
      const storyIds = storiesData.map(s => s.id);
      if (storyIds.length > 0) {
        const { data: results } = await supabase
          .from("user_results")
          .select("reference_id")
          .eq("user_id", user.id)
          .eq("activity_type", "story_completed")
          .in("reference_id", storyIds);
        
        const statusMap = new Map<string, boolean>();
        results?.forEach(r => {
          if (r.reference_id) {
            statusMap.set(r.reference_id, true);
          }
        });
        setStoryStatuses(statusMap);
      }
    }
    setIsLoading(false);
  };

  // Filter stories by type
  const fictionStories = stories.filter(s => !s.text_type || s.text_type === 'fiction');
  const nonFictionStories = stories.filter(s => s.text_type === 'non-fiction');

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      <PageHeader 
        title={appLang === 'de' ? 'Wähle eine Geschichte' : 
               appLang === 'fr' ? 'Choisis une histoire' :
               appLang === 'es' ? 'Elige una historia' :
               appLang === 'nl' ? 'Kies een verhaal' :
               'Choose a story'} 
        backTo="/" 
      />

      {/* Kid Profile Selector */}
      {hasMultipleProfiles && (
        <div className="container max-w-5xl px-4 pb-4">
          <div className="flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-2">
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
        </div>
      )}

      {/* Tabs for Fiction / Non-Fiction */}
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
              {appLang === 'de' ? 'Noch keine Geschichten' :
               appLang === 'fr' ? "Pas encore d'histoires" :
               appLang === 'es' ? 'Aún no hay historias' :
               appLang === 'nl' ? 'Nog geen verhalen' :
               'No stories yet'}
              {selectedProfile && ` ${appLang === 'fr' ? 'pour' : appLang === 'de' ? 'für' : 'for'} ${selectedProfile.name}`}
            </p>
            <Button
              onClick={() => navigate("/admin")}
              className="btn-primary-kid"
            >
              {appLang === 'de' ? 'Geschichte hinzufügen' :
               appLang === 'fr' ? 'Ajouter une histoire' :
               appLang === 'es' ? 'Añadir historia' :
               appLang === 'nl' ? 'Verhaal toevoegen' :
               'Add a story'}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="fiction" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-14 bg-card/80 backdrop-blur-sm rounded-2xl p-1">
              <TabsTrigger 
                value="fiction" 
                className="flex items-center gap-2 text-lg font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookText className="h-5 w-5" />
                {tabLabels[appLang]?.fiction || tabLabels.fr.fiction}
                {fictionStories.length > 0 && (
                  <span className="ml-1 bg-background/30 text-xs px-2 py-0.5 rounded-full">
                    {fictionStories.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="non-fiction" 
                className="flex items-center gap-2 text-lg font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GraduationCap className="h-5 w-5" />
                {tabLabels[appLang]?.nonFiction || tabLabels.fr.nonFiction}
                {nonFictionStories.length > 0 && (
                  <span className="ml-1 bg-background/30 text-xs px-2 py-0.5 rounded-full">
                    {nonFictionStories.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fiction">
              <StoryGrid stories={fictionStories} appLang={appLang} navigate={navigate} storyStatuses={storyStatuses} />
            </TabsContent>

            <TabsContent value="non-fiction">
              <StoryGrid stories={nonFictionStories} appLang={appLang} navigate={navigate} storyStatuses={storyStatuses} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

// Extracted StoryGrid component for reuse
const StoryGrid = ({ 
  stories, 
  appLang, 
  navigate,
  storyStatuses,
}: { 
  stories: Story[]; 
  appLang: string; 
  navigate: (path: string) => void;
  storyStatuses: Map<string, boolean>;
}) => {
  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {appLang === 'de' ? 'Keine Geschichten in dieser Kategorie' :
           appLang === 'fr' ? 'Aucune histoire dans cette catégorie' :
           appLang === 'es' ? 'No hay historias en esta categoría' :
           appLang === 'nl' ? 'Geen verhalen in deze categorie' :
           'No stories in this category'}
        </p>
      </div>
    );
  }

  const statusLabel = statusLabels[appLang] || statusLabels.fr;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => {
        const isCompleted = storyStatuses.get(story.id) || false;
        
        return (
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
              {/* Status badge */}
              <Badge 
                className={`absolute top-2 left-2 text-xs font-bold flex items-center gap-1 ${
                  isCompleted 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                {isCompleted ? statusLabel.completed : statusLabel.toRead}
              </Badge>
              {/* Difficulty badge */}
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
        );
      })}
    </div>
  );
};

export default StorySelectPage;
