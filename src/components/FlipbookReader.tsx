import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  X, 
  Loader2, 
  Save, 
  RotateCcw,
  CheckCircle2,
  MessageCircleQuestion,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlipbookReaderProps {
  content: string;
  storyId: string;
  onFinishReading: () => void;
}

// French stop words that should not be marked/highlighted
const FRENCH_STOP_WORDS = new Set([
  "le", "la", "les", "l", "un", "une", "des", "du", "de", "d",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi",
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "notre", "nos", "votre", "vos", "leur", "leurs",
  "ce", "cet", "cette", "ces", "ça", "c",
  "à", "au", "aux", "en", "dans", "sur", "sous", "avec", "sans", "pour",
  "par", "vers", "chez", "entre", "et", "ou", "mais", "donc", "car", "ni",
  "que", "qui", "quoi", "dont", "où", "si", "ne", "pas", "plus", "moins",
  "est", "sont", "a", "ai", "as", "ont", "été", "être", "avoir",
  "fait", "faire", "dit", "dire", "va", "vais", "vont", "aller",
  "y", "n", "s", "t", "qu", "j", "m"
]);

const MIN_WORD_LENGTH = 3;

const isStopWord = (word: string): boolean => {
  const clean = word.toLowerCase().replace(/[.,!?;:'"«»]/g, "");
  return FRENCH_STOP_WORDS.has(clean) || clean.length < MIN_WORD_LENGTH;
};

const FlipbookReader = ({ content, storyId, onFinishReading }: FlipbookReaderProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[][]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Word explanation state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  
  // Marked positions
  const [singleWordPositions, setSingleWordPositions] = useState<Set<string>>(new Set());
  const [phrasePositions, setPhrasePositions] = useState<Set<string>>(new Set());
  const [cachedExplanations, setCachedExplanations] = useState<Map<string, string>>(new Map());
  
  // Selection for phrases
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  // Current position for saving
  const [currentPositionKey, setCurrentPositionKey] = useState<string | null>(null);
  const [unsavedPositions, setUnsavedPositions] = useState<Set<string>>(new Set());

  // Split content into pages based on paragraphs
  useEffect(() => {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    const pagesArray: string[][] = [];
    
    // Group paragraphs into pages (2-3 paragraphs per page depending on length)
    let currentPageParagraphs: string[] = [];
    let currentWordCount = 0;
    const WORDS_PER_PAGE = 120; // Target words per page
    
    paragraphs.forEach((para) => {
      const wordCount = para.split(/\s+/).length;
      
      if (currentWordCount + wordCount > WORDS_PER_PAGE && currentPageParagraphs.length > 0) {
        pagesArray.push([...currentPageParagraphs]);
        currentPageParagraphs = [para];
        currentWordCount = wordCount;
      } else {
        currentPageParagraphs.push(para);
        currentWordCount += wordCount;
      }
    });
    
    if (currentPageParagraphs.length > 0) {
      pagesArray.push(currentPageParagraphs);
    }
    
    setPages(pagesArray);
  }, [content]);

  // Load cached explanations
  useEffect(() => {
    const loadCached = async () => {
      const { data } = await supabase
        .from("marked_words")
        .select("word, explanation")
        .eq("story_id", storyId);
      
      if (data) {
        const map = new Map<string, string>();
        data.forEach((w) => {
          if (w.explanation) {
            map.set(w.word.toLowerCase(), w.explanation);
          }
        });
        setCachedExplanations(map);
      }
    };
    loadCached();
  }, [storyId]);

  // Selection handling for phrases
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
      
      if (!selectedText || wordCount < 2) {
        setCurrentSelection(null);
        setSelectionPosition(null);
        return;
      }

      if (textContainerRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = textContainerRef.current.getBoundingClientRect();
        
        if (rect.top >= containerRect.top - 50 && rect.bottom <= containerRect.bottom + 100) {
          setCurrentSelection(selectedText);
          setSelectionRange(range.cloneRange());
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 15
          });
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    const handleTouchEnd = () => setTimeout(handleSelectionChange, 100);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      closePanel();
    }
    if (isRightSwipe && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      closePanel();
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page);
      closePanel();
    }
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelectedWord(null);
    setExplanation(null);
    setExplanationError(false);
    setIsSaved(false);
  };

  const fetchExplanation = async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: text },
      });
      if (error) return null;
      return data?.explanation || null;
    } catch {
      return null;
    }
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      return;
    }
    
    const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
    if (!cleanWord) return;

    // Clear previous unsaved
    if (unsavedPositions.size > 0) {
      setSingleWordPositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }

    const target = event.currentTarget;
    const positionKey = target.getAttribute('data-position') || `click-${Date.now()}`;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    setCurrentPositionKey(positionKey);
    setShowPanel(true);
    
    setSingleWordPositions(prev => new Set([...prev, positionKey]));
    setUnsavedPositions(new Set([positionKey]));

    const existingExplanation = cachedExplanations.get(cleanWord);
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true);
      return;
    }

    const result = await fetchExplanation(cleanWord);
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleExplainSelection = async () => {
    if (!currentSelection || !selectionRange) return;

    const cleanText = currentSelection
      .replace(/[.,!?;:'"«»\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!cleanText || cleanText.length < 3) return;

    // Clear previous unsaved
    if (unsavedPositions.size > 0) {
      setPhrasePositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }

    const selectedPositions: string[] = [];
    if (textContainerRef.current) {
      const allWordSpans = textContainerRef.current.querySelectorAll('[data-position]');
      allWordSpans.forEach(span => {
        if (selectionRange.intersectsNode(span)) {
          const position = span.getAttribute('data-position');
          if (position) selectedPositions.push(position);
        }
      });
    }
    
    window.getSelection()?.removeAllRanges();
    setCurrentSelection(null);
    setSelectionPosition(null);
    setSelectionRange(null);

    setSelectedWord(cleanText);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    setShowPanel(true);
    
    setPhrasePositions(prev => {
      const newSet = new Set(prev);
      selectedPositions.forEach(pos => newSet.add(pos));
      return newSet;
    });
    setUnsavedPositions(new Set(selectedPositions));
    
    if (selectedPositions.length > 0) {
      setCurrentPositionKey(selectedPositions[0]);
    }

    const existingExplanation = cachedExplanations.get(cleanText);
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true);
      return;
    }

    const result = await fetchExplanation(cleanText);
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleRetry = async () => {
    if (!selectedWord) return;
    setIsExplaining(true);
    setExplanationError(false);
    const result = await fetchExplanation(selectedWord);
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleSave = async () => {
    if (!selectedWord || !explanation || !storyId) return;

    const { error } = await supabase.from("marked_words").insert({
      story_id: storyId,
      word: selectedWord,
      explanation: explanation,
    });

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      return;
    }

    setCachedExplanations(prev => new Map(prev.set(selectedWord.toLowerCase(), explanation)));
    setIsSaved(true);
    setUnsavedPositions(new Set());
    toast.success("Mot sauvegardé! ⚽");
  };

  const handleDiscard = () => {
    // Remove unsaved markings
    if (unsavedPositions.size > 0) {
      setSingleWordPositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setPhrasePositions(prev => {
        const newSet = new Set(prev);
        unsavedPositions.forEach(pos => newSet.delete(pos));
        return newSet;
      });
      setUnsavedPositions(new Set());
    }
    closePanel();
  };

  const renderPage = (paragraphs: string[], pageIndex: number) => {
    return paragraphs.map((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      const globalPIndex = `${pageIndex}-${pIndex}`;
      
      return (
        <p key={pIndex} className="mb-4 leading-relaxed text-lg md:text-xl">
          {sentences.map((sentence, sIndex) => {
            const words = sentence.split(/(\s+)/);
            
            return (
              <span key={sIndex}>
                {words.map((word, wIndex) => {
                  const positionKey = `${globalPIndex}-${sIndex}-${wIndex}`;
                  const isSingleWordMarked = singleWordPositions.has(positionKey);
                  const isPhraseMarked = phrasePositions.has(positionKey);
                  const isSpace = /^\s+$/.test(word);
                  const canBeMarked = !isStopWord(word);

                  if (isSpace) {
                    const prevKey = `${globalPIndex}-${sIndex}-${wIndex - 1}`;
                    const nextKey = `${globalPIndex}-${sIndex}-${wIndex + 1}`;
                    const isInPhrase = phrasePositions.has(prevKey) && phrasePositions.has(nextKey);
                    return (
                      <span key={wIndex} className={isInPhrase ? "phrase-marked" : ""}>
                        {word}
                      </span>
                    );
                  }

                  const markingClass = isSingleWordMarked ? "word-marked" : (isPhraseMarked ? "phrase-marked" : "");

                  if (!canBeMarked) {
                    return (
                      <span key={wIndex} data-position={positionKey} className={markingClass}>
                        {word}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={wIndex}
                      data-position={positionKey}
                      onClick={(e) => handleWordClick(word, e)}
                      className={`word-highlight ${markingClass}`}
                    >
                      {word}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </p>
      );
    });
  };

  const isLastPage = currentPage === pages.length - 1;

  return (
    <div className="relative h-full flex flex-col">
      {/* Page content area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Floating button for phrase selection */}
        {currentSelection && selectionPosition && (
          <div 
            data-selection-button
            className="fixed z-50 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(Math.max(selectionPosition.x, 80), window.innerWidth - 80)}px`,
              top: `${Math.max(selectionPosition.y, 60)}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <Button
              onClick={handleExplainSelection}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExplainSelection();
              }}
              className="btn-primary-kid shadow-lg flex items-center gap-2 text-base py-3 px-5 min-h-[52px] touch-manipulation"
            >
              <MessageCircleQuestion className="h-5 w-5" />
              Expliquer
            </Button>
          </div>
        )}

        {/* Page text */}
        <div 
          ref={textContainerRef}
          className={`h-full overflow-y-auto px-4 py-6 select-text transition-opacity duration-200 ${showPanel ? 'pb-48' : 'pb-24'}`}
        >
          {pages[currentPage] && renderPage(pages[currentPage], currentPage)}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 px-4">
        {/* Page dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="flex gap-1.5">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`h-2.5 rounded-full transition-all duration-200 ${
                  idx === currentPage 
                    ? 'w-8 bg-primary' 
                    : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Page number */}
        <p className="text-center text-sm text-muted-foreground mb-3">
          Page {currentPage + 1} / {pages.length}
        </p>

        {/* Finish button on last page */}
        {isLastPage && !showPanel && (
          <div className="flex justify-center">
            <Button
              onClick={onFinishReading}
              className="btn-accent-kid flex items-center gap-2 text-lg py-3 px-6"
            >
              <CheckCircle2 className="h-5 w-5" />
              J'ai fini de lire
            </Button>
          </div>
        )}
      </div>

      {/* Explanation panel - slides up from bottom */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-card border-t-2 border-primary/30 rounded-t-3xl shadow-lg transition-transform duration-300 ease-out ${
          showPanel ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '40%' }}
      >
        <div className="p-4 overflow-y-auto h-full">
          {/* Handle bar */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-baloo text-xl font-bold break-words max-w-[200px]">
                {selectedWord}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closePanel}
              className="rounded-full -mt-1 -mr-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {isExplaining ? (
            <div className="flex items-center gap-3 text-muted-foreground py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Je réfléchis...</span>
            </div>
          ) : explanationError ? (
            <div className="space-y-3">
              <p className="text-destructive">Pas d'explication trouvée.</p>
              <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">{explanation}</p>
              
              {!isSaved && explanation && (
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1 btn-secondary-kid flex items-center justify-center gap-2">
                    <Save className="h-5 w-5" />
                    Sauvegarder
                  </Button>
                  <Button onClick={handleDiscard} variant="outline" className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Verwerfen
                  </Button>
                </div>
              )}
              
              {isSaved && (
                <div className="flex items-center gap-2 text-secondary font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Sauvegardé!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipbookReader;
