import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookText, GraduationCap, CheckCircle2, Users, Layers, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, type Translations } from "@/lib/translations";
import { toast } from "sonner";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import { ArrowLeft } from "lucide-react";
import SeriesGrid from "@/components/SeriesGrid";

const PAGE_SIZE = 20;

interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  difficulty: string | null;
  text_type: string | null;
  kid_profile_id: string | null;
  series_id: string | null;
  episode_number: number | null;
  ending_type: string | null;
}

// Difficulty, tab, and status labels are now in lib/translations.ts
// Helper to map difficulty key to translated label
const getDifficultyLabel = (t: ReturnType<typeof useTranslations>, difficulty: string): string => {
  if (difficulty === 'easy') return t.difficultyEasy;
  if (difficulty === 'medium') return t.difficultyMedium;
  if (difficulty === 'hard' || difficulty === 'difficult') return t.difficultyHard;
  return difficulty;
};

// ── Skeleton Card ──────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="card-story">
    <div className="aspect-[4/3] mb-4 rounded-xl overflow-hidden bg-muted animate-pulse" />
    <div className="space-y-2 px-1">
      <div className="h-5 bg-muted rounded-lg animate-pulse w-3/4 mx-auto" />
      <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2 mx-auto" />
    </div>
  </div>
);

const StorySelectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const appLang = kidAppLanguage;
  const t = useTranslations(appLang);
  const [stories, setStories] = useState<Story[]>([]);
  const [storyStatuses, setStoryStatuses] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isGeneratingForSeries, setIsGeneratingForSeries] = useState<string | null>(null);

  // ── Initial load + reload on user/profile change ──
  useEffect(() => {
    console.log('[StorySelect] useEffect fired, user:', user?.id, 'profile:', selectedProfileId);
    if (!user) {
      console.log('[StorySelect] No user yet, skipping');
      return;
    }

    const fetchStories = async () => {
      console.log('[StorySelect] fetchStories START');
      setIsLoading(true);

      try {
        // Build stories query — NO content field (saves large text transfer)
        let query = supabase
          .from("stories")
          .select("id, title, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (selectedProfileId) {
          query = query.eq("kid_profile_id", selectedProfileId);
        }

        console.log('[StorySelect] Executing stories query...');
        const storiesResult = await query;
        console.log('[StorySelect] Stories result:', {
          data: storiesResult.data?.length,
          error: storiesResult.error,
          status: storiesResult.status,
          statusText: storiesResult.statusText,
        });
        const storiesData: Story[] = storiesResult.data || [];

        // Build completions query filtered by loaded story IDs
        const storyIds = storiesData.map(s => s.id);
        const statusMap = new Map<string, boolean>();

        if (storyIds.length > 0) {
          console.log('[StorySelect] Fetching completions for', storyIds.length, 'stories...');
          const completionsResult = await supabase
            .from("user_results")
            .select("reference_id, kid_profile_id")
            .eq("user_id", user.id)
            .in("activity_type", ["story_read", "story_completed"])
            .in("reference_id", storyIds);

          console.log('[StorySelect] Completions result:', {
            data: completionsResult.data?.length,
            error: completionsResult.error,
          });

          completionsResult.data?.forEach(r => {
            if (r.reference_id && storyIds.includes(r.reference_id)) {
              const matches = !selectedProfileId ||
                             r.kid_profile_id === selectedProfileId ||
                             r.kid_profile_id === null;
              if (matches) {
                statusMap.set(r.reference_id, true);
              }
            }
          });
        }

        console.log('[StorySelect] Setting state:', storiesData.length, 'stories, hasMore:', storiesData.length === PAGE_SIZE);
        setStories(storiesData);
        setStoryStatuses(statusMap);
        setHasMore(storiesData.length === PAGE_SIZE);
      } catch (err) {
        console.error("[StorySelect] CATCH Error loading stories:", err);
      } finally {
        console.log('[StorySelect] FINALLY - setIsLoading(false)');
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [user?.id, selectedProfileId]);

  // ── Load more (append next page) ──
  const loadMore = async () => {
    if (!user || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      let query = supabase
        .from("stories")
        .select("id, title, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(stories.length, stories.length + PAGE_SIZE - 1);

      if (selectedProfileId) {
        query = query.eq("kid_profile_id", selectedProfileId);
      }

      const storiesResult = await query;
      const newStories: Story[] = storiesResult.data || [];
      const allStories = [...stories, ...newStories];
      const allStoryIds = allStories.map(s => s.id);

      // Re-fetch completions for all loaded stories
      const statusMap = new Map<string, boolean>();
      if (allStoryIds.length > 0) {
        const completionsResult = await supabase
          .from("user_results")
          .select("reference_id, kid_profile_id")
          .eq("user_id", user.id)
          .in("activity_type", ["story_read", "story_completed"])
          .in("reference_id", allStoryIds);

        completionsResult.data?.forEach(r => {
          if (r.reference_id && allStoryIds.includes(r.reference_id)) {
            const matches = !selectedProfileId ||
                           r.kid_profile_id === selectedProfileId ||
                           r.kid_profile_id === null;
            if (matches) {
              statusMap.set(r.reference_id, true);
            }
          }
        });
      }

      setStories(allStories);
      setStoryStatuses(statusMap);
      setHasMore(newStories.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more stories:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Manual refresh (e.g. after generating an episode)
  const refreshStories = async () => {
    if (!user) return;
    setIsLoading(true);
    setStories([]);
    setStoryStatuses(new Map());

    try {
      let query = supabase
        .from("stories")
        .select("id, title, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (selectedProfileId) {
        query = query.eq("kid_profile_id", selectedProfileId);
      }

      const storiesResult = await query;
      const storiesData: Story[] = storiesResult.data || [];
      const storyIds = storiesData.map(s => s.id);
      const statusMap = new Map<string, boolean>();

      if (storyIds.length > 0) {
        const completionsResult = await supabase
          .from("user_results")
          .select("reference_id, kid_profile_id")
          .eq("user_id", user.id)
          .in("activity_type", ["story_read", "story_completed"])
          .in("reference_id", storyIds);

        completionsResult.data?.forEach(r => {
          if (r.reference_id && storyIds.includes(r.reference_id)) {
            const matches = !selectedProfileId ||
                           r.kid_profile_id === selectedProfileId ||
                           r.kid_profile_id === null;
            if (matches) {
              statusMap.set(r.reference_id, true);
            }
          }
        });
      }

      setStories(storiesData);
      setStoryStatuses(statusMap);
      setHasMore(storiesData.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error refreshing stories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate next episode for a series
  const handleGenerateNextEpisode = async (series: { seriesId: string; episodes: Story[] }) => {
    // Prevent double-clicks - check if already generating
    if (isGeneratingForSeries) {
      console.log("Already generating, ignoring duplicate click");
      return;
    }
    
    if (!user?.id) {
      toast.error("Bitte melde dich erneut an");
      return;
    }
    if (!selectedProfile) return;
    
    const lastEpisode = series.episodes[series.episodes.length - 1];
    if (!lastEpisode) return;
    
    const nextEpisodeNumber = (lastEpisode.episode_number || series.episodes.length) + 1;
    
    // Check if episode with this number already exists in database (race condition protection)
    const { data: existingEpisode } = await supabase
      .from("stories")
      .select("id")
      .eq("series_id", series.seriesId)
      .eq("episode_number", nextEpisodeNumber)
      .maybeSingle();
    
    if (existingEpisode) {
      console.log("Episode already exists, reloading stories");
      toast.info("Diese Episode existiert bereits");
      refreshStories();
      return;
    }
    
    setIsGeneratingForSeries(series.seriesId);
    
    try {
      // Fetch content for previous episodes on-demand (not stored in list)
      const episodeIds = series.episodes.map(ep => ep.id);
      const { data: episodesWithContent } = await supabase
        .from("stories")
        .select("id, title, content, episode_number")
        .in("id", episodeIds);

      // Build context from ALL previous episodes
      // For each episode: Title + first 800 chars of content
      const episodeContexts = (episodesWithContent || [])
        .sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0))
        .map((ep, idx) => {
          const episodeNum = ep.episode_number || (idx + 1);
          const contentPreview = (ep.content || '').substring(0, 800);
          return `--- Episode ${episodeNum}: "${ep.title}" ---\n${contentPreview}${(ep.content || '').length > 800 ? '...' : ''}`;
        });
      
      const fullSeriesContext = episodeContexts.join('\n\n');
      
      // Determine ending type based on episode number (max 5 episodes typically)
      // Episode 5 should be final (ending type A), others are cliffhangers (C)
      const endingType = nextEpisodeNumber >= 5 ? 'A' : 'C';
      
      // Call generate-story function with modular prompt system
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: lastEpisode.difficulty || "medium",
          description: fullSeriesContext, // All episodes as context
          textLanguage: appLang.toUpperCase(),
          schoolLevel: selectedProfile.school_class,
          textType: lastEpisode.text_type || "fiction",
          endingType,
          episodeNumber: nextEpisodeNumber,
          seriesId: series.seriesId,
          userId: user?.id,
          // Modular prompt system: CORE + KINDER-MODUL + SERIEN-MODUL
          source: 'kid',
          isSeries: true,
          kidName: selectedProfile.name,
          kidHobbies: selectedProfile.hobbies,
        },
      });
      
      if (error) throw error;
      
      // Helper to upload base64 image to storage
      const uploadBase64Image = async (base64: string, prefix: string): Promise<string | null> => {
        try {
          let b64Data = base64;
          if (b64Data.startsWith('data:')) {
            b64Data = b64Data.split(',')[1];
          }
          const imageData = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
          const fileName = `${prefix}-${crypto.randomUUID()}.png`;
          const { error: uploadError } = await supabase.storage
            .from("covers")
            .upload(fileName, imageData, { contentType: "image/png" });
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("covers").getPublicUrl(fileName);
            return urlData.publicUrl;
          } else {
            console.error(`Upload error for ${prefix}:`, uploadError);
          }
        } catch (imgErr) {
          console.error(`Error uploading ${prefix} image:`, imgErr);
        }
        return null;
      };

      // Upload cover image if present
      let coverImageUrl = null;
      if (data.coverImageBase64) {
        coverImageUrl = await uploadBase64Image(data.coverImageBase64, "cover");
      }
      
      // Upload story images if present
      const storyImageUrls: string[] = [];
      if (data.storyImages && Array.isArray(data.storyImages)) {
        for (let i = 0; i < data.storyImages.length; i++) {
          const url = await uploadBase64Image(data.storyImages[i], `story-${i}`);
          if (url) storyImageUrls.push(url);
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
          cover_image_status: coverImageUrl ? 'complete' : 'pending',
          story_images: storyImageUrls.length > 0 ? storyImageUrls : null,
          story_images_status: storyImageUrls.length > 0 ? 'complete' : 'pending',
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
        const questionsToInsert = data.questions.map((q: { question: string; correctAnswer: string; options?: string[] }, idx: number) => ({
          story_id: newStory.id,
          question: q.question,
          expected_answer: q.correctAnswer,
          options: q.options || [],
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
      refreshStories(); // Refresh the list
      
    } catch (err) {
      console.error("Error generating episode:", err);
      toast.error(appLang === 'de' ? 'Fehler beim Erstellen der Episode' : 'Error creating episode');
    } finally {
      setIsGeneratingForSeries(null);
    }
  };

  // Filter stories by type
  // A story is part of a series if it has series_id OR episode_number (first episodes have episode_number but no series_id)
  const isPartOfSeries = (s: Story) => s.series_id !== null || s.episode_number !== null;
  const fictionStories = stories.filter(s => (!s.text_type || s.text_type === 'fiction') && !isPartOfSeries(s));
  const nonFictionStories = stories.filter(s => s.text_type === 'non-fiction' && !isPartOfSeries(s));
  const seriesStories = stories.filter(s => isPartOfSeries(s));

  // ── Load More button ──
  const LoadMoreButton = () => {
    if (!hasMore) return null;
    return (
      <div className="flex justify-center pt-8 pb-4">
        <Button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="btn-primary-kid px-8 py-3 text-base font-baloo"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {t.loadingMore || (appLang === 'de' ? 'Wird geladen...' : 'Loading...')}
            </>
          ) : (
            t.loadMoreStories || (appLang === 'de' ? 'Mehr Geschichten laden' : 'Load more stories')
          )}
        </Button>
      </div>
    );
  };

  // ── Skeleton grid for "load more" ──
  const LoadMoreSkeletons = () => {
    if (!isLoadingMore) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map(i => <SkeletonCard key={`more-skel-${i}`} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center font-nunito" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      <div className="w-full max-w-[480px] px-5 pt-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="rounded-full hover:bg-primary/20 h-10 w-10 mb-1"
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </Button>

        {/* Fablino header - same position as homepage */}
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={appLang === 'de' ? 'Welche Geschichte möchtest du lesen? 📚' :
                   appLang === 'fr' ? 'Quelle histoire veux-tu lire ? 📚' :
                   appLang === 'es' ? '¿Qué historia quieres leer? 📚' :
                   appLang === 'nl' ? 'Welk verhaal wil je lezen? 📚' :
                   'Which story do you want to read? 📚'}
          mascotSize="md"
        />
      </div>

      {/* Kid Profile Selector removed – selection happens only on homepage */}

      {/* Tabs for Fiction / Non-Fiction */}
      <div className="container max-w-5xl px-4 pb-12">
        {isLoading ? (
          /* ── Fix 3: Skeleton loader instead of spinner ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={`skel-${i}`} />)}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <p className="text-xl text-muted-foreground mb-4">
              {t.noStoriesForProfile}
              {selectedProfile && ` ${appLang === 'fr' ? 'pour' : appLang === 'de' ? 'für' : 'for'} ${selectedProfile.name}`}
            </p>
            <Button
              onClick={() => navigate("/admin")}
              className="btn-primary-kid"
            >
              {t.addStory}
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue={seriesStories.length > 0 ? "series" : "fiction"} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-card/80 backdrop-blur-sm rounded-2xl p-1">
                <TabsTrigger 
                  value="series" 
                  className="flex items-center gap-2 text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Layers className="h-5 w-5" />
                  {t.tabSeries}
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
                  {t.tabFiction}
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
                  {t.tabNonFiction}
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
                <StoryGrid stories={fictionStories} t={t} navigate={navigate} storyStatuses={storyStatuses} />
              </TabsContent>

              <TabsContent value="non-fiction">
                <StoryGrid stories={nonFictionStories} t={t} navigate={navigate} storyStatuses={storyStatuses} />
              </TabsContent>
            </Tabs>

            {/* Load more button + skeletons */}
            <LoadMoreSkeletons />
            <LoadMoreButton />
          </>
        )}
      </div>
    </div>
  );
};

// Sub-tab labels now come from central translations.ts

// Single story card component with improved image lazy loading
const StoryCard = ({ 
  story, 
  t, 
  navigate, 
  isCompleted 
}: { 
  story: Story; 
  t: Translations; 
  navigate: (path: string) => void; 
  isCompleted: boolean;
}) => {
  
  return (
    <div
      onClick={() => navigate(`/read/${story.id}`)}
      className="card-story group"
    >
      <div className="aspect-[4/3] mb-4 rounded-xl overflow-hidden bg-muted relative">
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt={story.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundColor: '#FDE68A' }}
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
          {isCompleted ? t.statusCompleted : t.statusToRead}
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
            {getDifficultyLabel(t, story.difficulty)}
          </Badge>
        )}
      </div>
      <h3 className="font-baloo text-xl font-bold text-center group-hover:text-primary transition-colors">
        {story.title}
      </h3>
    </div>
  );
};

// Extracted StoryGrid component with sub-tabs for read/unread
const StoryGrid = ({ 
  stories, 
  t, 
  navigate,
  storyStatuses,
}: { 
  stories: Story[]; 
  t: Translations; 
  navigate: (path: string) => void;
  storyStatuses: Map<string, boolean>;
}) => {
  
  // Separate stories into unread and completed
  const unreadStories = stories.filter(s => !storyStatuses.get(s.id));
  const completedStories = stories.filter(s => storyStatuses.get(s.id));

  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          {t.noCategoryStories}
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="unread" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50 rounded-xl p-1">
        <TabsTrigger 
          value="unread" 
          className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          {t.statusToRead}
          <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {unreadStories.length}
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="completed" 
          className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          {t.statusAlreadyRead}
          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {completedStories.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="unread">
        {unreadStories.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-xl">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg text-muted-foreground">
              {t.allStoriesRead}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unreadStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                t={t} 
                navigate={navigate} 
                isCompleted={false} 
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completedStories.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-xl">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-lg text-muted-foreground">
              {t.noStoriesRead}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                t={t} 
                navigate={navigate} 
                isCompleted={true} 
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default StorySelectPage;
