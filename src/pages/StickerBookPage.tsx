import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import { useColorPalette } from "@/hooks/useColorPalette";
import { getTranslations } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  text_type: string | null;
  created_at: string;
  completed: boolean | null;
}

const StickerBookPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProfileId, kidAppLanguage } = useKidProfile();
  const { state: gamification } = useGamification();
  const { colors } = useColorPalette();
  const t = getTranslations(kidAppLanguage);

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      if (!selectedProfileId) return;

      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, title, cover_image_url, text_type, created_at, completed')
          .eq('kid_profile_id', selectedProfileId)
          .eq('generation_status', 'completed')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStories(data || []);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [selectedProfileId]);

  const completedStories = stories.filter(s => s.completed);
  const totalStories = stories.length;

  // Always show 3 empty placeholders after the last sticker
  const emptySlots = 3;

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
        <Star className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} pb-safe`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-xl font-baloo font-bold text-foreground">
            {t.stickerBook}
          </h1>

          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="font-bold text-primary text-sm">
              {gamification?.stars || 0}
            </span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {/* Empty State */}
        {totalStories === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img
              src="/mascot/6_Onboarding.png"
              alt="Fablino"
              className="w-32 h-32 object-contain mb-6"
            />
            <h2 className="text-xl font-baloo font-bold text-foreground mb-2">
              {t.stickerBook}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              {t.fablinoEncourage}
            </p>
            <Button
              onClick={() => navigate('/create-story')}
              className="btn-primary-kid"
            >
              {t.createStory}
            </Button>
          </div>
        ) : (
          <>
            {/* Fablino Message */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-card rounded-xl border border-border">
              <img
                src="/mascot/1_happy_success.png"
                alt="Fablino"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <p className="text-sm font-medium text-foreground">
                {completedStories.length > 0
                  ? t.storiesCollected.replace('{count}', String(completedStories.length))
                  : t.fablinoEncourage}
              </p>
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {/* Completed Stories */}
              {completedStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => navigate(`/read/${story.id}`)}
                  className="group relative aspect-square"
                >
                  <Card className="h-full w-full overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-3xl">📖</span>
                      </div>
                    )}
                    {/* Star Badge */}
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                      <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                    </div>
                  </Card>
                  <p className="mt-1.5 text-xs font-medium text-center text-foreground line-clamp-2 leading-tight">
                    {story.title}
                  </p>
                </button>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: emptySlots }).map((_, index) => (
                index === 0 ? (
                  // First empty slot is clickable
                  <button
                    key={`empty-${index}`}
                    onClick={() => navigate('/create-story')}
                    className="group relative aspect-square"
                  >
                    <Card className="h-full w-full bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 group-hover:scale-105 flex flex-col items-center justify-center gap-1 p-2">
                      <span className="text-2xl">✨</span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {t.nextStory}
                      </span>
                    </Card>
                    <p className="mt-1.5 text-xs font-medium text-center text-muted-foreground line-clamp-2 leading-tight">
                      {t.nextStory}
                    </p>
                  </button>
                ) : (
                  // Other empty slots are not clickable
                  <div key={`empty-${index}`} className="relative aspect-square">
                    <Card className="h-full w-full bg-muted border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <span className="text-3xl text-muted-foreground/40">?</span>
                    </Card>
                  </div>
                )
              ))}
            </div>

            {/* CTA Button - only show if there's at least 1 completed story */}
            {completedStories.length > 0 && (
              <Button
                onClick={() => navigate('/create-story')}
                className="w-full btn-primary-kid flex items-center justify-center gap-2"
              >
                <span>✨</span>
                {t.createStory}
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StickerBookPage;
