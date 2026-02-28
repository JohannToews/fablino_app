import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, BookText, GraduationCap, CheckCircle2, Users, Layers, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useTranslations, type Translations } from "@/lib/translations";
import { toast } from "sonner";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import BackButton from "@/components/BackButton";
import SeriesGrid from "@/components/SeriesGrid";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  story_length?: string | null;
  text_language?: string | null;
  series_mode?: string | null;
  branch_chosen?: string | null;
  completed?: boolean | null;
  series_episode_count?: number | null;
  has_comic_grid?: boolean | null;
  generation_status?: string | null;
}

// Difficulty, tab, and status labels are now in lib/translations.ts
// Helper to map difficulty key to translated label
const getDifficultyLabel = (t: ReturnType<typeof useTranslations>, difficulty: string): string => {
  if (difficulty === 'easy') return t.difficultyEasy;
  if (difficulty === 'medium') return t.difficultyMedium;
  if (difficulty === 'hard' || difficulty === 'difficult') return t.difficultyHard;
  return difficulty;
};

const StorySelectPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const appLang = kidAppLanguage;
  const t = useTranslations(appLang);
  const [isGeneratingForSeries, setIsGeneratingForSeries] = useState<string | null>(null);
  // AbortController for episode generation — prevents orphaned requests
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => { return () => { abortControllerRef.current?.abort(); }; }, []);

  // React Query: fetch stories + results with 5min cache
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['stories', selectedProfileId, user?.id],
    queryFn: async () => {
      const [storiesResult, completionsResult] = await Promise.all([
        supabase.rpc("get_my_stories_list", {
          p_profile_id: selectedProfileId || null,
          p_limit: 200,
          p_offset: 0,
        }),
        supabase.rpc("get_my_results"),
      ]);

      const storiesData = storiesResult.data || [];
      console.log("[StorySelect] query result:", { 
        storiesCount: storiesData.length, 
        error: storiesResult.error, 
        selectedProfileId,
      });

      const storyIdSet = new Set(storiesData.map((s: any) => s.id));
      const statusMap = new Map<string, boolean>();
      
      // Check stories.completed field first
      storiesData.forEach((s: any) => {
        if (s.completed) {
          statusMap.set(s.id, true);
        }
      });
      
      // Also check user_results for completion status
      completionsResult.data?.forEach((r: any) => {
        if (r.reference_id && storyIdSet.has(r.reference_id)) {
          const matches = !selectedProfileId ||
                         r.kid_profile_id === selectedProfileId ||
                         r.kid_profile_id === null;
          if (matches) {
            statusMap.set(r.reference_id, true);
          }
        }
      });

      return { stories: storiesData as Story[], storyStatuses: statusMap };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // keep in cache 10 minutes
  });

  const stories = queryData?.stories || [];
  const storyStatuses = queryData?.storyStatuses || new Map<string, boolean>();

  // Helper to invalidate cache after mutations
  const invalidateStories = () => {
    queryClient.invalidateQueries({ queryKey: ['stories', selectedProfileId, user?.id] });
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
      invalidateStories();
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
      const endingType = (nextEpisodeNumber >= 5 ? 'A' : 'C') as "A" | "B" | "C";

      // B-14: Placeholder story row for incremental status/metrics
      let placeholderStoryIdSelect: string | null = null;
      const { data: placeholderRowSelect, error: placeholderErrSelect } = await supabase
        .from("stories")
        .insert({
          title: "Generating...",
          content: "",
          user_id: user.id,
          kid_profile_id: selectedProfile.id,
          generation_status: "generating",
          difficulty: lastEpisode.difficulty || "medium",
          text_type: lastEpisode.text_type || "fiction",
          text_language: lastEpisode.text_language || appLang,
          prompt: fullSeriesContext.slice(0, 500),
          ending_type: endingType,
          episode_number: nextEpisodeNumber,
          story_length: lastEpisode.story_length || 'medium',
          series_id: series.seriesId,
          series_mode: lastEpisode.series_mode || null,
        })
        .select("id")
        .single();
      if (!placeholderErrSelect && placeholderRowSelect?.id) placeholderStoryIdSelect = placeholderRowSelect.id;
      
      // Call generate-story function with 120s timeout
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 120_000);

      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "medium",
          difficulty: lastEpisode.difficulty || "medium",
          description: fullSeriesContext, // All episodes as context
          textLanguage: (lastEpisode.text_language || appLang).toUpperCase(),
          schoolLevel: selectedProfile.school_class,
          textType: lastEpisode.text_type || "fiction",
          endingType,
          episodeNumber: nextEpisodeNumber,
          seriesId: series.seriesId,
          userId: user?.id,
          // Modular prompt system: CORE + KINDER-MODUL + SERIEN-MODUL
          source: 'kid',
          isSeries: true,
          seriesMode: lastEpisode.series_mode || undefined,
          storyLength: lastEpisode.story_length || 'medium',
          kidName: selectedProfile.name,
          kidHobbies: selectedProfile.hobbies,
          // Phase 2: Pass kid profile ID + language for new prompt path & series context
          kidProfileId: selectedProfile.id,
          storyLanguage: lastEpisode.text_language || appLang,
          ...(placeholderStoryIdSelect ? { story_id: placeholderStoryIdSelect } : {}),
        },
      });
      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      // Helper: if already a URL (from backend Storage upload), use directly; else upload base64
      const resolveImageUrl = async (imgData: string, prefix: string): Promise<string | null> => {
        if (imgData.startsWith('http://') || imgData.startsWith('https://')) {
          return imgData; // Already a Storage URL
        }
        try {
          let b64Data = imgData;
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

      // Resolve images: backend now returns Storage URLs, fallback to client-side upload for base64
      let coverImageUrl = null;
      if (data.coverImageBase64) {
        coverImageUrl = await resolveImageUrl(data.coverImageBase64, "cover");
      }
      
      // Resolve story images
      const storyImageUrls: string[] = [];
      if (data.storyImages && Array.isArray(data.storyImages)) {
        for (let i = 0; i < data.storyImages.length; i++) {
          const url = await resolveImageUrl(data.storyImages[i], `story-${i}`);
          if (url) storyImageUrls.push(url);
        }
      }
      
      // ── SERIES-DEBUG: Log series fields from Edge Function response ──
      console.log("[StorySelectPage] [SERIES-DEBUG] Edge Function response series fields:", {
        episode_summary: data.episode_summary ?? "MISSING",
        episode_summary_type: typeof data.episode_summary,
        continuity_state: data.continuity_state ? JSON.stringify(data.continuity_state).substring(0, 200) : "MISSING",
        continuity_state_type: typeof data.continuity_state,
        visual_style_sheet: data.visual_style_sheet ? "present" : "MISSING",
        usedNewPromptPath: data.usedNewPromptPath,
      });

      // Save the new episode (B-14: update placeholder if we created one, else insert)
      const useUpdateSelect = !!(placeholderStoryIdSelect && (data.story_id ?? placeholderStoryIdSelect));
      const storyPayloadSelect = {
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
        text_language: lastEpisode.text_language || appLang,
        ending_type: endingType,
        episode_number: nextEpisodeNumber,
        story_length: lastEpisode.story_length || 'medium',
        series_id: series.seriesId,
        series_mode: data.series_mode || lastEpisode.series_mode || null,
        episode_summary: data.episode_summary ?? null,
        continuity_state: data.continuity_state ?? null,
        visual_style_sheet: data.visual_style_sheet ?? null,
        generation_status: data.imageWarning ? (data.imageWarning === 'cover_generation_failed' ? 'images_failed' : 'images_partial') : 'verified',
      };
      const storyIdToUseSelect = (data.story_id ?? placeholderStoryIdSelect) as string | null;
      const { data: newStory, error: insertError } = useUpdateSelect && storyIdToUseSelect
        ? await supabase.from("stories").update(storyPayloadSelect).eq("id", storyIdToUseSelect).select().single()
        : await supabase.from("stories").insert(storyPayloadSelect).select().single();
      
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
      invalidateStories(); // Refresh the list
      
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

  return (
    <div className="min-h-screen flex flex-col items-center font-nunito">
      <div className="w-full max-w-[480px] px-5 pt-6">
        {/* Back button */}
        <div className="mb-1">
          <BackButton to="/" />
        </div>

        {/* Fablino header - same position as homepage */}
        <FablinoPageHeader
          mascotImage="/mascot/6_Onboarding.png"
          message={appLang === 'de' ? 'Welche Geschichte möchtest du lesen? 📚' :
                   appLang === 'fr' ? 'Quelle histoire veux-tu lire ? 📚' :
                   appLang === 'es' ? '¿Qué historia quieres leer? 📚' :
                   appLang === 'nl' ? 'Welk verhaal wil je lezen? 📚' :
                   'Which story do you want to read? 📚'}
          mascotSize="sm"
        />
      </div>

      {/* Kid Profile Selector removed – selection happens only on homepage */}

      {/* Tabs for Fiction / Non-Fiction */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-bounce-soft">
              <BookOpen className="h-16 w-16 text-primary" />
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FablinoPageHeader
              mascotImage="/mascot/6_Onboarding.png"
              message={t.emptyStateStories}
              mascotSize="sm"
              showBackButton={false}
            />
            <Button
              onClick={() => navigate("/create-story")}
              className="mt-4 btn-primary-kid"
            >
              {t.createStory}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={seriesStories.length > 0 ? "series" : "fiction"} className="w-full">
            <TabsList className="flex w-full mb-6 h-12 sm:h-14 bg-card/80 backdrop-blur-sm rounded-2xl p-1 overflow-x-auto scrollbar-hide gap-1">
              <TabsTrigger 
                value="series" 
                className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-2 sm:px-3"
              >
                <Layers className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{t.tabSeries}</span>
                {seriesStories.length > 0 && (
                  <span className="ml-0.5 bg-background/30 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {new Set(seriesStories.map(s => s.series_id)).size}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="fiction" 
                className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-2 sm:px-3"
              >
                <BookText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{t.tabFiction}</span>
                {fictionStories.length > 0 && (
                  <span className="ml-0.5 bg-background/30 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {fictionStories.length}
                  </span>
                )}
              </TabsTrigger>
              {/* Non-Fiction tab – temporarily hidden, may come back later
              <TabsTrigger 
                value="non-fiction" 
                className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-baloo rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-2 sm:px-3"
              >
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{t.tabNonFiction}</span>
                {nonFictionStories.length > 0 && (
                  <span className="ml-0.5 bg-background/30 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {nonFictionStories.length}
                  </span>
                )}
              </TabsTrigger>
              */}
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

            {/* Non-Fiction content – temporarily hidden
            <TabsContent value="non-fiction">
              <StoryGrid stories={nonFictionStories} t={t} navigate={navigate} storyStatuses={storyStatuses} />
            </TabsContent>
            */}
          </Tabs>
        )}
      </div>
    </div>
  );
};

// Sub-tab labels now come from central translations.ts

// Single story card component
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
      <div className="aspect-[3/2] sm:aspect-[4/3] mb-3 sm:mb-4 rounded-xl overflow-hidden bg-muted relative">
        {story.cover_image_url ? (
          <img
            src={getThumbnailUrl(story.cover_image_url, story.has_comic_grid ? 800 : 400, 60)}
            alt={story.title}
            loading="lazy"
            className={
              story.has_comic_grid
                ? 'w-[200%] h-[200%] max-w-none object-cover object-left-top group-hover:scale-105 transition-transform duration-300'
                : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
            }
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
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
        {/* Image warning badge */}
        {(story.generation_status === 'images_failed' || story.generation_status === 'images_partial') && (
          <Badge className="absolute bottom-2 left-2 text-xs font-bold flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white">
            <AlertTriangle className="h-3 w-3" />
            {story.generation_status === 'images_failed' ? '🖼️' : '⚠️'}
          </Badge>
        )}
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
      <h3 className="font-baloo text-base sm:text-xl font-bold text-center group-hover:text-primary transition-colors line-clamp-2" dir="auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
