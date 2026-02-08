import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useKidProfile } from "@/hooks/useKidProfile";
import { getTranslations } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  created_at: string;
}

const StickerBookPage = () => {
  const navigate = useNavigate();
  const { selectedProfileId, kidAppLanguage, isLoading: isProfilesLoading } = useKidProfile();
  const t = getTranslations(kidAppLanguage);

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      if (isProfilesLoading) return;

      if (!selectedProfileId) {
        setStories([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, title, cover_image_url, created_at')
          .eq('kid_profile_id', selectedProfileId)
          .in('generation_status', ['completed', 'verified'])
          .eq('completed', true)
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
  }, [selectedProfileId, isProfilesLoading]);

  // Calculate grid slots - fill current row + one extra row
  const { totalSlots, emptySlots, nextGoal, progressPercent } = useMemo(() => {
    const count = stories.length;
    const cols = 3; // mobile default, but we calculate for worst case
    
    // Round up to next 5 for the goal
    const goal = count === 0 ? 5 : Math.ceil((count + 1) / 5) * 5;
    
    // Calculate slots: fill to complete rows + 1 extra row
    const currentRowEnd = Math.ceil(count / cols) * cols;
    const total = Math.max(currentRowEnd + cols, cols * 2); // minimum 2 rows
    const empty = total - count;
    
    const percent = count === 0 ? 0 : Math.min((count / goal) * 100, 100);
    
    return { totalSlots: total, emptySlots: empty, nextGoal: goal, progressPercent: percent };
  }, [stories.length]);

  // Rotation patterns for stickers
  const getRotation = (index: number) => {
    const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0'];
    return rotations[index % rotations.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Star className="h-10 w-10 text-amber-500 animate-pulse" />
          <p className="text-amber-700 font-medium">{t.loading || "Laden..."}</p>
        </div>
      </div>
    );
  }

  const showEmptyState = stories.length === 0;

  return (
    <div className="min-h-screen bg-amber-50/50 pb-safe">
      {/* Subtle grid texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(217, 119, 6, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(217, 119, 6, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-amber-50/95 backdrop-blur-sm border-b border-amber-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="text-xl font-baloo font-bold text-amber-900">
              {t.stickerBook}
            </h1>

            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Fablino + Message + Progress */}
          {!showEmptyState && (
            <div className="flex items-start gap-3">
              <img
                src="/mascot/1_happy_success.png"
                alt="Fablino"
                className="w-16 h-16 object-contain flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-100 relative">
                  {/* Speech bubble tail */}
                  <div className="absolute left-0 top-4 -translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
                  <p className="text-sm font-medium text-amber-800">
                    {t.storiesCollected?.replace('{count}', String(stories.length)) || 
                      `${stories.length} Geschichten gesammelt! Weiter so!`}
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <Progress 
                    value={progressPercent} 
                    className="h-3 flex-1 bg-amber-200"
                  />
                  <span className="text-xs font-bold text-amber-700 whitespace-nowrap">
                    {stories.length} / {nextGoal}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto relative">
        {/* Empty State */}
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img
              src="/mascot/6_Onboarding.png"
              alt="Fablino"
              className="w-32 h-32 object-contain mb-6"
            />
            <h2 className="text-xl font-baloo font-bold text-amber-900 mb-2">
              {t.stickerBook}
            </h2>
            <p className="text-amber-700 mb-6 max-w-xs">
              {t.fablinoEncourage}
            </p>
            <button
              onClick={() => navigate('/create-story')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {t.createStory}
            </button>
          </div>
        ) : (
          /* Sticker Grid */
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {/* Completed Stickers */}
            {stories.map((story, index) => (
              <button
                key={story.id}
                onClick={() => navigate(`/read/${story.id}`)}
                className="group flex flex-col items-center"
                style={{
                  animation: `stickerReveal 300ms ease-out ${index * 80}ms both`
                }}
              >
                <div 
                  className={`
                    relative aspect-square w-full p-1.5 bg-white rounded-xl shadow-md
                    transition-all duration-200 
                    group-hover:scale-105 group-hover:shadow-lg
                    ${getRotation(index)}
                  `}
                >
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📖</span>
                    </div>
                  )}
                  
                  {/* Star badge */}
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-sm">
                    <Star className="h-3 w-3 text-white fill-white" />
                  </div>
                </div>
                
                <p className="mt-2 text-xs font-medium text-center text-amber-900 line-clamp-2 leading-tight max-w-full px-1">
                  {story.title}
                </p>
              </button>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: emptySlots }).map((_, index) => (
              index === 0 ? (
                /* First empty slot - clickable "next story" */
                <button
                  key={`empty-${index}`}
                  onClick={() => navigate('/create-story')}
                  className="group flex flex-col items-center"
                  style={{
                    animation: `stickerReveal 300ms ease-out ${(stories.length + index) * 80}ms both`
                  }}
                >
                  <div className="aspect-square w-full border-2 border-dashed border-amber-400 bg-amber-100/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group-hover:bg-amber-200/50 group-hover:border-amber-500 group-hover:scale-105">
                    <Plus className="h-8 w-8 text-amber-500" />
                    <span className="text-[10px] font-medium text-amber-600 text-center px-1 leading-tight">
                      {t.nextStory || "Nächste Geschichte"}
                    </span>
                  </div>
                </button>
              ) : (
                /* Other empty slots */
                <div 
                  key={`empty-${index}`} 
                  className="flex flex-col items-center"
                  style={{
                    animation: `stickerReveal 300ms ease-out ${(stories.length + index) * 80}ms both`
                  }}
                >
                  <div className="aspect-square w-full border-2 border-dashed border-amber-300 bg-amber-100/50 rounded-xl flex items-center justify-center">
                    <span className="text-4xl font-bold text-amber-300">?</span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </main>

      {/* Animation keyframes */}
      <style>{`
        @keyframes stickerReveal {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default StickerBookPage;
