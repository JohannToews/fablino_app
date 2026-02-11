import { Button } from "@/components/ui/button";
import { BookOpen, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { useTranslations, type Language } from "@/lib/translations";

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

interface Series {
  seriesId: string;
  episodes: Story[];
}

interface SeriesGridProps {
  stories: Story[];
  appLang: string;
  navigate: (path: string) => void;
  storyStatuses: Map<string, boolean>;
  onGenerateNextEpisode: (series: Series) => void;
  isGeneratingForSeries: string | null;
}

// Translations now come from central lib/translations.ts

const SeriesGrid = ({ 
  stories, 
  appLang, 
  navigate, 
  storyStatuses,
  onGenerateNextEpisode,
  isGeneratingForSeries,
}: SeriesGridProps) => {
  const t = useTranslations(appLang as Language);

  // Group stories by series
  // First episodes: series_id is null but episode_number = 1, use own id as key
  // Continuation episodes: use series_id as key
  const seriesMap = new Map<string, Story[]>();
  stories.forEach(story => {
    // Determine the series key
    let seriesKey: string | null = null;
    
    if (story.series_id) {
      // This is a continuation episode - use series_id
      seriesKey = story.series_id;
    } else if (story.episode_number !== null && story.episode_number >= 1) {
      // This is a first episode - use its own id as the series key
      seriesKey = story.id;
    }
    
    if (seriesKey) {
      const existing = seriesMap.get(seriesKey) || [];
      existing.push(story);
      seriesMap.set(seriesKey, existing);
    }
  });

  // Convert to array and sort episodes within each series
  const seriesList: Series[] = Array.from(seriesMap.entries()).map(([seriesId, episodes]) => ({
    seriesId,
    episodes: episodes.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0)),
  }));

  if (seriesList.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">{t.seriesNoSeries}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {seriesList.map((series) => {
        const firstEpisode = series.episodes[0];
        const lastEpisode = series.episodes[series.episodes.length - 1];
        const canContinue = lastEpisode?.ending_type === 'C';
        const isGenerating = isGeneratingForSeries === series.seriesId;
        const lastEpisodeCompleted = storyStatuses.get(lastEpisode?.id || '') || false;
        const canGenerateNext = canContinue && lastEpisodeCompleted;

        return (
          <div 
            key={series.seriesId} 
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
          >
            {/* Series Header */}
            <div className="flex gap-4 mb-4">
              {/* Series Cover (from first episode) */}
              <div className="w-24 h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {firstEpisode?.cover_image_url ? (
                  <img
                    src={getThumbnailUrl(firstEpisode.cover_image_url, 192, 50)}
                    alt={firstEpisode.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                    <BookOpen className="h-8 w-8 text-primary/50" />
                  </div>
                )}
              </div>
              
              {/* Series Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-baloo text-xl font-bold text-foreground mb-1 truncate">
                  {firstEpisode?.title?.split(' - ')[0] || firstEpisode?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {series.episodes.length} {series.episodes.length === 1 ? t.seriesEpisode : `${t.seriesEpisode}n`}
                </p>
              </div>
            </div>

            {/* Episodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {series.episodes.map((episode) => {
                const isCompleted = storyStatuses.get(episode.id) || false;
                
                return (
                  <div
                    key={episode.id}
                    onClick={() => navigate(`/read/${episode.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted relative border-2 border-transparent group-hover:border-primary transition-all">
                      {episode.cover_image_url ? (
                        <img
                          src={getThumbnailUrl(episode.cover_image_url, 256, 50)}
                          alt={episode.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <span className="text-2xl font-bold text-primary/50">
                            {episode.episode_number || 1}
                          </span>
                        </div>
                      )}
                      {/* Status indicator */}
                      {isCompleted && (
                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center mt-1 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {t.seriesEpisode} {episode.episode_number || 1}
                    </p>
                  </div>
                );
              })}

              {/* Next Episode Placeholder */}
              {canContinue && (
                <div className="cursor-pointer group">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canGenerateNext) {
                        onGenerateNextEpisode(series);
                      }
                    }}
                    disabled={isGenerating || !lastEpisodeCompleted}
                    className={`aspect-square w-full h-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                      lastEpisodeCompleted 
                        ? 'border-primary/30 hover:border-primary hover:bg-primary/5' 
                        : 'border-muted-foreground/20 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs text-primary">{t.seriesGenerating}</span>
                      </>
                    ) : !lastEpisodeCompleted ? (
                      <>
                        <Plus className="h-6 w-6 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground/60">
                          {t.seriesReadFirst}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-6 w-6 text-primary/60 group-hover:text-primary" />
                        <span className="text-xs text-primary/60 group-hover:text-primary">
                          {t.seriesEpisode} {(lastEpisode?.episode_number || 1) + 1}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeriesGrid;
