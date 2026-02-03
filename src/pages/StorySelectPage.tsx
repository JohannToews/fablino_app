import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookText, GraduationCap, CheckCircle2, Users, Layers } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations } from "@/lib/translations";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import SeriesGrid from "@/components/SeriesGrid";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty: string | null;
  text_type: string | null;
  kid_profile_id: string | null;
  series_id: string | null;
  episode_number: number | null;
  ending_type: string | null;
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
const tabLabels: Record<string, { fiction: string; nonFiction: string; series: string }> = {
  de: { fiction: "Geschichten", nonFiction: "Sachgeschichten", series: "Serien" },
  fr: { fiction: "Histoires", nonFiction: "Documentaires", series: "Séries" },
  en: { fiction: "Stories", nonFiction: "Non-Fiction", series: "Series" },
  es: { fiction: "Historias", nonFiction: "No Ficción", series: "Series" },
  nl: { fiction: "Verhalen", nonFiction: "Non-Fictie", series: "Series" },
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
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const appLang = kidAppLanguage;
  const t = useTranslations(appLang);
  const [stories, setStories] = useState<Story[]>([]);
  const [storyStatuses, setStoryStatuses] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingForSeries, setIsGeneratingForSeries] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, selectedProfileId]);

  const loadStories = async () => {
    if (!user) return;
    
    // Build query - filter strictly by kid_profile_id
    let query = supabase
      .from("stories")
      .select("id, title, content, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    
    // Filter strictly by selected kid profile
    if (selectedProfileId) {
      query = query.eq("kid_profile_id", selectedProfileId);
    }
    
    const { data: storiesData } = await query;
    
    if (storiesData) {
      setStories(storiesData);
      
      // Load completion status for all stories
      const storyIds = storiesData.map(s => s.id);
      if (storyIds.length > 0) {
        let resultsQuery = supabase
          .from("user_results")
          .select("reference_id")
          .eq("user_id", user.id)
          .eq("activity_type", "story_completed")
          .in("reference_id", storyIds);
        
        // Filter by kid profile if selected
        if (selectedProfileId) {
          resultsQuery = resultsQuery.eq("kid_profile_id", selectedProfileId);
        }
        
        const { data: results } = await resultsQuery;
        
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

  // Generate next episode for a series
  const handleGenerateNextEpisode = async (series: { seriesId: string; episodes: Story[] }) => {
    if (!user || !selectedProfile) return;
    
    const lastEpisode = series.episodes[series.episodes.length - 1];
    if (!lastEpisode) return;
    
    setIsGeneratingForSeries(series.seriesId);
    
    try {
      // Get app settings for continuation prompt
      const { data: settings } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "continuation_prompt")
        .single();
      
      const continuationPrompt = settings?.value || "";
      
      // Build context from previous episode
      const previousContext = `Vorherige Episode "${lastEpisode.title}": ${lastEpisode.content.substring(0, 1500)}...`;
      
      // Call generate-story function
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: lastEpisode.difficulty || "medium",
          description: `${continuationPrompt}\n\n${previousContext}`,
          textLanguage: appLang.toUpperCase(),
          endingType: "C", // Continue as cliffhanger
          episodeNumber: (lastEpisode.episode_number || 1) + 1,
          seriesId: series.seriesId,
        },
      });
      
      if (error) throw error;
      
      // Upload cover image if present
      let coverImageUrl = null;
      if (data.coverImageBase64) {
        const imageData = Uint8Array.from(atob(data.coverImageBase64), c => c.charCodeAt(0));
        const fileName = `${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(fileName, imageData, { contentType: "image/png" });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(fileName);
          coverImageUrl = urlData.publicUrl;
        }
      }
      
      // Save the new episode
      const { data: newStory, error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          kid_profile_id: selectedProfile.id,
          title: data.title,
          content: data.content,
          cover_image_url: coverImageUrl,
          difficulty: lastEpisode.difficulty || "medium",
          text_type: lastEpisode.text_type || "fiction",
          text_language: appLang,
          ending_type: "C",
          episode_number: (lastEpisode.episode_number || 1) + 1,
          series_id: series.seriesId,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Save comprehension questions
      if (data.questions?.length > 0 && newStory) {
        const questionsToInsert = data.questions.map((q: { question: string; expected_answer: string }, idx: number) => ({
          story_id: newStory.id,
          question: q.question,
          expected_answer: q.expected_answer,
          order_index: idx,
        }));
        await supabase.from("comprehension_questions").insert(questionsToInsert);
      }
      
      // Save vocabulary words
      if (data.vocabulary?.length > 0 && newStory) {
        const wordsToInsert = data.vocabulary.map((w: { word: string; explanation: string }) => ({
          story_id: newStory.id,
          word: w.word,
          explanation: w.explanation,
        }));
        await supabase.from("marked_words").insert(wordsToInsert);
      }
      
      toast.success(appLang === 'de' ? 'Neue Episode erstellt!' : 'New episode created!');
      loadStories(); // Refresh the list
      
    } catch (err) {
      console.error("Error generating episode:", err);
      toast.error(appLang === 'de' ? 'Fehler beim Erstellen der Episode' : 'Error creating episode');
    } finally {
      setIsGeneratingForSeries(null);
    }
  };

  // Filter stories by type
  const fictionStories = stories.filter(s => (!s.text_type || s.text_type === 'fiction') && !s.series_id);
  const nonFictionStories = stories.filter(s => s.text_type === 'non-fiction' && !s.series_id);
  const seriesStories = stories.filter(s => s.series_id !== null);

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
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
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
          <Tabs defaultValue={seriesStories.length > 0 ? "series" : "fiction"} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-card/80 backdrop-blur-sm rounded-2xl p-1">
              <TabsTrigger 
                value="series" 
                className="flex items-center gap-2 text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Layers className="h-5 w-5" />
                {tabLabels[appLang]?.series || tabLabels.de.series}
                {seriesStories.length > 0 && (
                  <span className="ml-1 bg-background/30 text-xs px-2 py-0.5 rounded-full">
                    {new Set(seriesStories.map(s => s.series_id)).size}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="fiction" 
                className="flex items-center gap-2 text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookText className="h-5 w-5" />
                {tabLabels[appLang]?.fiction || tabLabels.de.fiction}
                {fictionStories.length > 0 && (
                  <span className="ml-1 bg-background/30 text-xs px-2 py-0.5 rounded-full">
                    {fictionStories.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="non-fiction" 
                className="flex items-center gap-2 text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GraduationCap className="h-5 w-5" />
                {tabLabels[appLang]?.nonFiction || tabLabels.de.nonFiction}
                {nonFictionStories.length > 0 && (
                  <span className="ml-1 bg-background/30 text-xs px-2 py-0.5 rounded-full">
                    {nonFictionStories.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="series">
              <SeriesGrid 
                stories={seriesStories} 
                appLang={appLang} 
                navigate={navigate} 
                storyStatuses={storyStatuses}
                onGenerateNextEpisode={handleGenerateNextEpisode}
                isGeneratingForSeries={isGeneratingForSeries}
              />
            </TabsContent>

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
