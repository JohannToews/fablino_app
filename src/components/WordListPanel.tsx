import { useState, useEffect } from "react";
import { X, Check, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SavedWord {
  id: string;
  word: string;
  explanation: string | null;
  is_learned: boolean | null;
}

const panelLabels: Record<string, {
  title: string;
  empty: string;
  known: string;
  close: string;
  loading: string;
}> = {
  de: { title: "Deine Wörter aus dieser Geschichte", empty: "Tippe auf ein Wort in der Geschichte um es zu speichern! 📖", known: "Kenne ich", close: "Schließen", loading: "Laden..." },
  fr: { title: "Tes mots de cette histoire", empty: "Touche un mot dans l'histoire pour le sauvegarder ! 📖", known: "Je connais", close: "Fermer", loading: "Chargement..." },
  en: { title: "Your words from this story", empty: "Tap a word in the story to save it! 📖", known: "I know this", close: "Close", loading: "Loading..." },
  es: { title: "Tus palabras de esta historia", empty: "¡Toca una palabra en la historia para guardarla! 📖", known: "La conozco", close: "Cerrar", loading: "Cargando..." },
  nl: { title: "Jouw woorden uit dit verhaal", empty: "Tik op een woord in het verhaal om het op te slaan! 📖", known: "Ken ik", close: "Sluiten", loading: "Laden..." },
  it: { title: "Le tue parole da questa storia", empty: "Tocca una parola nella storia per salvarla! 📖", known: "La conosco", close: "Chiudi", loading: "Caricamento..." },
  bs: { title: "Tvoje riječi iz ove priče", empty: "Dodirni riječ u priči da je sačuvaš! 📖", known: "Znam", close: "Zatvori", loading: "Učitavanje..." },
};

interface WordListPanelProps {
  storyId: string;
  language: string;
  open: boolean;
  onClose: () => void;
}

const WordListPanel = ({ storyId, language, open, onClose }: WordListPanelProps) => {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const t = panelLabels[language] || panelLabels.de;

  useEffect(() => {
    if (open) {
      loadWords();
    }
  }, [open, storyId]);

  const loadWords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marked_words")
      .select("id, word, explanation, is_learned")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });

    setWords((data || []).filter(w => !w.is_learned) as SavedWord[]);
    setLoading(false);
  };

  const markAsLearned = async (wordId: string) => {
    setDismissingIds(prev => new Set(prev).add(wordId));

    console.log("[Analytics] word_marked_learned", { wordId, storyId, language });

    await supabase
      .from("marked_words")
      .update({ is_learned: true })
      .eq("id", wordId);

    setTimeout(() => {
      setWords(prev => prev.filter(w => w.id !== wordId));
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(wordId);
        return next;
      });
    }, 400);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, side panel on desktop */}
      <div className={cn(
        "fixed z-50 bg-white shadow-xl overflow-hidden flex flex-col",
        "animate-in duration-300",
        "inset-x-0 bottom-0 rounded-t-2xl max-h-[70vh]",
        "xl:inset-y-0 xl:right-0 xl:left-auto xl:bottom-auto xl:top-0 xl:w-[380px] xl:max-h-none xl:rounded-t-none xl:rounded-l-2xl",
        "slide-in-from-bottom xl:slide-in-from-right"
      )}>
        {/* Drag handle (mobile) */}
        <div className="xl:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-orange-100">
          <h2 className="text-base font-baloo font-bold text-[#2D1810]">
            📚 {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-orange-50 transition-colors"
          >
            <X className="h-5 w-5 text-[#2D1810]/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              <span className="ml-2 text-sm text-muted-foreground">{t.loading}</span>
            </div>
          ) : words.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-orange-200 mb-4" />
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {t.empty}
              </p>
            </div>
          ) : (
            words.map((w) => (
              <div
                key={w.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl bg-orange-50/60 border border-orange-100 transition-all duration-400",
                  dismissingIds.has(w.id) && "opacity-0 -translate-y-2 scale-95"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-baloo font-bold text-sm text-[#2D1810] break-words">
                    {w.word}
                  </p>
                  {w.explanation && (
                    <p className="text-xs text-[#2D1810]/60 mt-0.5 leading-relaxed">
                      {w.explanation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => markAsLearned(w.id)}
                  disabled={dismissingIds.has(w.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-600 hover:bg-green-50 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 min-h-[36px]"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t.known}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default WordListPanel;
