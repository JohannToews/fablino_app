import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import FablinoMascot from '@/components/FablinoMascot';
import { Loader2, X, BookmarkPlus, Check } from 'lucide-react';

interface ImmersiveWordSheetProps {
  word: string | null;
  storyId: string;
  storyLanguage: string;
  explanationLanguage: string;
  kidProfileId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Bottom Sheet for word explanations in the Immersive Reader.
 *
 * Uses the Vaul-based Drawer from shadcn/ui.
 * Integrates with the explain-word Edge Function and marked_words table.
 */
const ImmersiveWordSheet: React.FC<ImmersiveWordSheetProps> = ({
  word,
  storyId,
  storyLanguage,
  explanationLanguage,
  kidProfileId,
  onClose,
  onSaved,
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch explanation when word changes
  useEffect(() => {
    if (!word) {
      setExplanation(null);
      setError(false);
      setIsSaved(false);
      return;
    }

    let cancelled = false;

    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(false);
      setExplanation(null);
      setIsSaved(false);

      try {
        const cleanWord = word.replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '').toLowerCase();
        const { data, error: fnError } = await supabase.functions.invoke('explain-word', {
          body: {
            word: cleanWord,
            language: storyLanguage,
            explanationLanguage: explanationLanguage,
          },
        });

        if (cancelled) return;

        if (fnError || !data?.explanation) {
          setError(true);
        } else {
          setExplanation(data.explanation);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchExplanation();

    return () => {
      cancelled = true;
    };
  }, [word, storyLanguage, explanationLanguage]);

  const handleSave = useCallback(async () => {
    if (!word || !explanation || !storyId) return;

    const cleanWord = word.replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '').toLowerCase();

    const { error: saveError } = await supabase.from('marked_words').insert({
      story_id: storyId,
      word: cleanWord,
      explanation,
      word_language: storyLanguage,
      explanation_language: explanationLanguage,
    });

    if (saveError) {
      console.error('Failed to save word:', saveError);
      return;
    }

    setIsSaved(true);
    onSaved();
  }, [word, explanation, storyId, kidProfileId, onSaved]);

  const handleRetry = useCallback(async () => {
    if (!word) return;
    setIsLoading(true);
    setError(false);

    try {
      const cleanWord = word.replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '').toLowerCase();
      const { data, error: fnError } = await supabase.functions.invoke('explain-word', {
        body: {
          word: cleanWord,
          language: storyLanguage,
          explanationLanguage: explanationLanguage,
        },
      });

      if (fnError || !data?.explanation) {
        setError(true);
      } else {
        setExplanation(data.explanation);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [word, storyLanguage, explanationLanguage]);

  const isOpen = word !== null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="immersive-word-sheet max-h-[50vh]">
        <DrawerHeader className="flex flex-row items-start gap-3 pb-2">
          {/* Fox mascot */}
          <FablinoMascot
            src="/mascot/fablino-happy.webp"
            size="sm"
            bounce={false}
            className="flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <DrawerTitle className="text-lg font-bold text-left">
              {word && word.replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '')}
            </DrawerTitle>
            <DrawerDescription className="text-left mt-1">
              {isLoading && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              )}
              {error && !isLoading && (
                <span className="text-destructive">
                  Could not load explanation.
                </span>
              )}
              {explanation && !isLoading && (
                <span className="text-foreground text-sm leading-relaxed">
                  {explanation}
                </span>
              )}
            </DrawerDescription>
          </div>

          {/* Close button */}
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <DrawerFooter className="flex-row gap-2 pt-0">
          {error && !isLoading && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          )}
          {explanation && !isSaved && (
            <Button
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1.5"
            >
              <BookmarkPlus className="h-4 w-4" />
              Save
            </Button>
          )}
          {isSaved && (
            <Button size="sm" variant="outline" disabled className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-600" />
              Saved
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ImmersiveWordSheet;
