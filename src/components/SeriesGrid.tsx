import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, CheckCircle2, Loader2 } from "lucide-react";

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

// Translations
const seriesLabels: Record<string, { 
  episode: string; 
  nextEpisode: string; 
  noSeries: string;
  generating: string;
}> = {
  de: { episode: "Episode", nextEpisode: "Nächste Episode", noSeries: "Noch keine Serien", generating: "Wird erstellt..." },
  fr: { episode: "Épisode", nextEpisode: "Prochain épisode", noSeries: "Pas encore de séries", generating: "Création..." },
  en: { episode: "Episode", nextEpisode: "Next Episode", noSeries: "No series yet", generating: "Creating..." },
  es: { episode: "Episodio", nextEpisode: "Siguiente episodio", noSeries: "Aún no hay series", generating: "Creando..." },
  nl: { episode: "Aflevering", nextEpisode: "Volgende aflevering", noSeries: "Nog geen series", generating: "Maken..." },
};

const statusLabels: Record<string, { toRead: string; completed: string }> = {
  de: { toRead: "Noch zu lesen", completed: "Abgeschlossen" },
  fr: { toRead: "À lire", completed: "Terminée" },
  en: { toRead: "To read", completed: "Completed" },
  es: { toRead: "Por leer", completed: "Completada" },
  nl: { toRead: "Te lezen", completed: "Voltooid" },
};

const SeriesGrid = ({ 
  stories, 
  appLang, 
  navigate, 
  storyStatuses,
  onGenerateNextEpisode,
  isGeneratingForSeries,
}: SeriesGridProps) => {
  const labels = seriesLabels[appLang] || seriesLabels.de;
  const status = statusLabels[appLang] || statusLabels.de;

  // Group stories by series_id
  const seriesMap = new Map<string, Story[]>();
  stories.forEach(story => {
    if (story.series_id) {
      const existing = seriesMap.get(story.series_id) || [];
      existing.push(story);
      seriesMap.set(story.series_id, existing);
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
        <p className="text-lg text-muted-foreground">{labels.noSeries}</p>
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
                    src={firstEpisode.cover_image_url}
                    alt={firstEpisode.title}
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
                  {series.episodes.length} {series.episodes.length === 1 ? labels.episode : `${labels.episode}n`}
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
                          src={episode.cover_image_url}
                          alt={episode.title}
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
                      {labels.episode} {episode.episode_number || 1}
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
                      onGenerateNextEpisode(series);
                    }}
                    disabled={isGenerating}
                    className="aspect-square w-full h-auto rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs text-primary">{labels.generating}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-6 w-6 text-primary/60 group-hover:text-primary" />
                        <span className="text-xs text-primary/60 group-hover:text-primary">
                          {labels.episode} {(lastEpisode?.episode_number || 1) + 1}
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
