import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, X, Loader2, BookOpen, MessageCircleQuestion, CheckCircle2, HelpCircle, Save, RotateCcw } from "lucide-react";
import ComprehensionQuiz from "@/components/ComprehensionQuiz";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  difficulty?: string;
  story_images?: string[] | null;
}

// French stop words that should not be marked/highlighted
const FRENCH_STOP_WORDS = new Set([
  // Articles
  "le", "la", "les", "l", "un", "une", "des", "du", "de", "d",
  // Pronouns
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "me", "te", "se", "lui", "leur", "moi", "toi", "soi",
  // Possessives
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "notre", "nos", "votre", "vos", "leur", "leurs",
  // Demonstratives
  "ce", "cet", "cette", "ces", "ça", "c",
  // Prepositions & conjunctions
  "à", "au", "aux", "en", "dans", "sur", "sous", "avec", "sans", "pour",
  "par", "vers", "chez", "entre", "et", "ou", "mais", "donc", "car", "ni",
  "que", "qui", "quoi", "dont", "où", "si", "ne", "pas", "plus", "moins",
  // Common verbs (conjugated)
  "est", "sont", "a", "ai", "as", "ont", "été", "être", "avoir",
  "fait", "faire", "dit", "dire", "va", "vais", "vont", "aller",
  // Other common short words
  "y", "n", "s", "t", "qu", "j", "m"
]);

const MIN_WORD_LENGTH = 3;

const isStopWord = (word: string): boolean => {
  const clean = word.toLowerCase().replace(/[.,!?;:'"«»]/g, "");
  return FRENCH_STOP_WORDS.has(clean) || clean.length < MIN_WORD_LENGTH;
};

const ReadingPage = () => {
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Session-only marked positions (visual highlighting only for current session)
  const [singleWordPositions, setSingleWordPositions] = useState<Set<string>>(new Set());
  const [phrasePositions, setPhrasePositions] = useState<Set<string>>(new Set());
  const [markedTexts, setMarkedTexts] = useState<Map<string, string>>(new Map());
  // Saved positions (permanently marked after saving)
  const [savedSingleWordPositions, setSavedSingleWordPositions] = useState<Set<string>>(new Set());
  const [savedPhrasePositions, setSavedPhrasePositions] = useState<Set<string>>(new Set());
  // DB cached explanations (for avoiding re-fetching from LLM)
  const [cachedExplanations, setCachedExplanations] = useState<Map<string, string>>(new Map());
  // Total marked words count from DB (for display)
  const [totalMarkedCount, setTotalMarkedCount] = useState(0);
  // Current text selection for phrase marking
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  // Show comprehension quiz after reading
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);
  // Current word position for saving
  const [currentPositionKey, setCurrentPositionKey] = useState<string | null>(null);
  // Current unsaved positions (to clear when selecting new word)
  const [unsavedPositions, setUnsavedPositions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadStory();
      loadCachedExplanations();
      checkForQuestions();
    }
  }, [id]);

  const checkForQuestions = async () => {
    const { count } = await supabase
      .from("comprehension_questions")
      .select("*", { count: "exact", head: true })
      .eq("story_id", id);
    
    setHasQuestions((count || 0) > 0);
  };

  // Listen for selection changes - improved for tablet touch
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        // Don't hide immediately - give time for button click
        return;
      }

      const selectedText = selection.toString().trim();
      
      // Only show button for selections with at least 2 words
      const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
      if (!selectedText || wordCount < 2) {
        setCurrentSelection(null);
        setSelectionPosition(null);
        return;
      }

      // Check if selection is within our text container
      if (textContainerRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = textContainerRef.current.getBoundingClientRect();
        
        // Check if selection is inside the container
        if (rect.top >= containerRect.top - 50 && rect.bottom <= containerRect.bottom + 100) {
          setCurrentSelection(selectedText);
          setSelectionRange(range.cloneRange());
          // Position button above selection, centered
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 15
          });
        }
      }
    };

    // Use both selectionchange and mouseup/touchend for better tablet support
    document.addEventListener('selectionchange', handleSelectionChange);
    
    const handleTouchEnd = () => {
      setTimeout(handleSelectionChange, 100);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  // Clear selection button when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-button]') && !window.getSelection()?.toString().trim()) {
        setCurrentSelection(null);
        setSelectionPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const loadStory = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setStory(data);
    } else {
      toast.error("Histoire non trouvée");
      navigate("/stories");
    }
    setIsLoading(false);
  };

  const loadCachedExplanations = async () => {
    const { data, count } = await supabase
      .from("marked_words")
      .select("word, explanation", { count: "exact" })
      .eq("story_id", id);
    
    if (data) {
      const explanationMap = new Map<string, string>();
      data.forEach((w) => {
        if (w.explanation) {
          explanationMap.set(w.word.toLowerCase(), w.explanation);
        }
      });
      setCachedExplanations(explanationMap);
    }
    if (count !== null) {
      setTotalMarkedCount(count);
    }
  };

  const fetchExplanation = async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: text },
      });

      if (error) {
        console.error("Error:", error);
        return null;
      }
      
      if (data?.explanation) {
        return data.explanation;
      }
      
      return null;
    } catch (err) {
      console.error("Error:", err);
      return null;
    }
  };

  const handleExplainSelection = async () => {
    if (!currentSelection || !selectionRange) return;

    const cleanText = currentSelection
      .replace(/[.,!?;:'"«»\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!cleanText || cleanText.length < 3) return;

    // Clear previous unsaved markings
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

    // Find all word elements within the selection and get their positions
    const selectedPositions: string[] = [];
    if (textContainerRef.current) {
      const allWordSpans = textContainerRef.current.querySelectorAll('[data-position]');
      allWordSpans.forEach(span => {
        if (selectionRange.intersectsNode(span)) {
          const position = span.getAttribute('data-position');
          if (position) {
            selectedPositions.push(position);
          }
        }
      });
    }
    
    // Clear the selection UI
    window.getSelection()?.removeAllRanges();
    setCurrentSelection(null);
    setSelectionPosition(null);
    setSelectionRange(null);

    setSelectedWord(cleanText);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    
    // Mark all selected positions as phrase in current session
    setPhrasePositions(prev => {
      const newSet = new Set(prev);
      selectedPositions.forEach(pos => newSet.add(pos));
      return newSet;
    });
    // Track as unsaved
    setUnsavedPositions(new Set(selectedPositions));
    
    // Store the phrase text for the first position
    if (selectedPositions.length > 0) {
      setMarkedTexts(prev => new Map(prev.set(selectedPositions[0], cleanText)));
      setCurrentPositionKey(selectedPositions[0]);
    }

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanText);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true); // Already in DB
      return;
    }

    // Get explanation from LLM
    const result = await fetchExplanation(cleanText);
    
    if (result) {
      setExplanation(result);
    } else {
      setExplanationError(true);
    }
    setIsExplaining(false);
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    // Check if there's a text selection - if so, don't handle the click
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      return;
    }
    
    const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
    
    if (!cleanWord) return;

    // Clear previous unsaved markings
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

    // Create unique position key using event target data attributes
    const target = event.currentTarget;
    const positionKey = target.getAttribute('data-position') || `click-${Date.now()}`;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);
    setExplanationError(false);
    setIsSaved(false);
    setCurrentPositionKey(positionKey);
    
    // Mark position as single word in current session
    setSingleWordPositions(prev => new Set([...prev, positionKey]));
    setMarkedTexts(prev => new Map(prev.set(positionKey, cleanWord)));
    // Track as unsaved
    setUnsavedPositions(new Set([positionKey]));

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanWord);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      setIsSaved(true); // Already in DB
      return;
    }

    // Get explanation from LLM
    const result = await fetchExplanation(cleanWord);
    
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

  const handleSaveExplanation = async () => {
    if (!selectedWord || !explanation || !id) return;

    // Save to DB
    const { error } = await supabase.from("marked_words").insert({
      story_id: id,
      word: selectedWord,
      explanation: explanation,
    });

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      return;
    }

    setTotalMarkedCount(prev => prev + 1);
    setCachedExplanations(prev => new Map(prev.set(selectedWord.toLowerCase(), explanation)));
    setIsSaved(true);
    // Clear unsaved tracking since this is now saved
    setUnsavedPositions(new Set());
    toast.success("Explication sauvegardée! ⚽");
  };

  const closeExplanation = () => {
    setSelectedWord(null);
    setExplanation(null);
    setExplanationError(false);
    setIsSaved(false);
    setCurrentPositionKey(null);
  };

  const renderFormattedText = () => {
    if (!story) return null;

    // Split into paragraphs
    const paragraphs = story.content.split(/\n\n+/);
    const storyImages = story.story_images || [];
    const totalParagraphs = paragraphs.length;
    
    // Calculate where to insert images (evenly distributed through the text)
    const getImageInsertionPoints = () => {
      if (storyImages.length === 0) return [];
      
      const insertPoints: number[] = [];
      if (storyImages.length === 1) {
        // Insert after roughly 50% of the text
        insertPoints.push(Math.floor(totalParagraphs / 2));
      } else if (storyImages.length === 2) {
        // Insert at 33% and 66%
        insertPoints.push(Math.floor(totalParagraphs / 3));
        insertPoints.push(Math.floor((totalParagraphs * 2) / 3));
      }
      return insertPoints;
    };
    
    const imageInsertionPoints = getImageInsertionPoints();
    let imageIndex = 0;
    
    const elements: React.ReactNode[] = [];
    
    paragraphs.forEach((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      elements.push(
        <p key={`p-${pIndex}`} className="mb-6 leading-loose">
          {sentences.map((sentence, sIndex) => {
            const shouldBold = sIndex === 0 && pIndex === 0;
            const shouldItalic = sentence.includes("«") || sentence.includes("»");
            
            const words = sentence.split(/(\s+)/);
            
            return (
              <span 
                key={sIndex} 
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic text-foreground" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
                  const positionKey = `${pIndex}-${sIndex}-${wIndex}`;
                  // Check if this specific position is marked as single word or phrase
                  const isSingleWordMarked = singleWordPositions.has(positionKey);
                  const isPhraseMarked = phrasePositions.has(positionKey);
                  const isSpace = /^\s+$/.test(word);
                  const canBeMarked = !isStopWord(word);

                  // For spaces: check if adjacent words are part of same phrase
                  if (isSpace) {
                    const prevKey = `${pIndex}-${sIndex}-${wIndex - 1}`;
                    const nextKey = `${pIndex}-${sIndex}-${wIndex + 1}`;
                    const isInPhrase = phrasePositions.has(prevKey) && phrasePositions.has(nextKey);
                    return (
                      <span 
                        key={wIndex} 
                        className={isInPhrase ? "phrase-marked" : ""}
                      >
                        {word}
                      </span>
                    );
                  }

                  // Determine the marking class
                  const markingClass = isSingleWordMarked ? "word-marked" : (isPhraseMarked ? "phrase-marked" : "");

                  // Stop words: no click interaction, but still show as marked if part of a phrase
                  if (!canBeMarked) {
                    return (
                      <span 
                        key={wIndex}
                        data-position={positionKey}
                        className={markingClass}
                      >
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
      
      // Check if we should insert an image after this paragraph
      if (imageInsertionPoints.includes(pIndex) && imageIndex < storyImages.length) {
        elements.push(
          <div key={`img-${imageIndex}`} className="my-8 flex justify-center">
            <img 
              src={storyImages[imageIndex]} 
              alt={`Illustration ${imageIndex + 1}`}
              className="max-w-[70%] h-auto rounded-xl shadow-sm opacity-80 grayscale-[20%]"
              style={{ filter: 'saturate(0.7) contrast(0.95)' }}
            />
          </div>
        );
        imageIndex++;
      }
    });
    
    return elements;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      <PageHeader 
        title={story?.title || ""}
        backTo="/stories"
        rightContent={
          <Button
            onClick={() => navigate("/quiz")}
            className="btn-accent-kid flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Quiz</span>
          </Button>
        }
      />

      <div className="container max-w-7xl p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Reading Area - wider for tablets */}
          <div className="lg:col-span-3">
            {/* Cover image above the text */}
            {story?.cover_image_url && (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-card">
                <img 
                  src={story.cover_image_url} 
                  alt={story.title}
                  className="w-full h-48 md:h-64 object-cover"
                />
              </div>
            )}
            
            <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card relative">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Touche un mot ou sélectionne plusieurs mots</span>
              </div>
              
              {/* Floating button for phrase selection - optimized for touch */}
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
                    className="btn-primary-kid shadow-lg flex items-center gap-2 text-base py-3 px-5 min-h-[52px] min-w-[140px] touch-manipulation"
                  >
                    <MessageCircleQuestion className="h-5 w-5" />
                    Expliquer
                  </Button>
                </div>
              )}
              
              <div 
                ref={textContainerRef}
                className="reading-text select-text"
              >
                {renderFormattedText()}
              </div>

              {/* "Text fertig gelesen" button at the bottom */}
              <div className="mt-10 pt-6 border-t border-border flex justify-center">
                <Button
                  onClick={async () => {
                    if (hasQuestions) {
                      setShowQuiz(true);
                    } else {
                      // Save story read points
                      const { data: pointData } = await supabase
                        .from("point_settings")
                        .select("points")
                        .eq("category", "story")
                        .eq("difficulty", story?.difficulty || "medium")
                        .maybeSingle();
                      
                      const storyPoints = pointData?.points || 10;
                      
                      await supabase.from("user_results").insert({
                        activity_type: "story_read",
                        reference_id: id,
                        difficulty: story?.difficulty || "medium",
                        points_earned: storyPoints,
                        user_id: user?.id,
                      });
                      
                      toast.success(`Super! Tu as fini de lire! 🏆 (+${storyPoints} points)`);
                      navigate("/stories");
                    }
                  }}
                  onTouchEnd={async (e) => {
                    e.preventDefault();
                    if (hasQuestions) {
                      setShowQuiz(true);
                    } else {
                      // Save story read points
                      const { data: pointData } = await supabase
                        .from("point_settings")
                        .select("points")
                        .eq("category", "story")
                        .eq("difficulty", story?.difficulty || "medium")
                        .maybeSingle();
                      
                      const storyPoints = pointData?.points || 10;
                      
                      await supabase.from("user_results").insert({
                        activity_type: "story_read",
                        reference_id: id,
                        difficulty: story?.difficulty || "medium",
                        points_earned: storyPoints,
                        user_id: user?.id,
                      });
                      
                      toast.success(`Super! Tu as fini de lire! 🏆 (+${storyPoints} points)`);
                      navigate("/stories");
                    }
                  }}
                  className="btn-accent-kid flex items-center gap-3 text-lg py-4 px-8 min-h-[56px] touch-manipulation"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  J'ai fini de lire
                </Button>
              </div>

              {/* Comprehension Quiz Section */}
              {showQuiz && (
                <div className="mt-8 pt-8 border-t-2 border-primary/30">
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-baloo font-bold">Questions de compréhension</h2>
                  </div>
                  <ComprehensionQuiz 
                    storyId={id!}
                    storyDifficulty={story?.difficulty || "medium"}
                    onComplete={async (correctCount, totalCount) => {
                      // Save points for correct answers
                      if (correctCount > 0) {
                        // Load point value for questions
                        const { data: pointData } = await supabase
                          .from("point_settings")
                          .select("points")
                          .eq("category", "question")
                          .eq("difficulty", story?.difficulty || "medium")
                          .maybeSingle();
                        
                        const pointsPerQuestion = pointData?.points || 3;
                        const earnedPoints = correctCount * pointsPerQuestion;
                        
                        await supabase.from("user_results").insert({
                          activity_type: "question_answered",
                          reference_id: id,
                          difficulty: story?.difficulty || "medium",
                          points_earned: earnedPoints,
                          correct_answers: correctCount,
                          total_questions: totalCount,
                          user_id: user?.id,
                        });
                        
                        toast.success(`Bravo! Tu as fini le quiz! 🏆 (+${earnedPoints} points)`);
                      } else {
                        toast.success("Bravo! Tu as fini le quiz! 🏆");
                      }
                      navigate("/stories");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Explanation Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {selectedWord ? (
                <div className="explanation-panel animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-baloo text-2xl font-bold break-words max-w-[200px]">
                      {selectedWord}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeExplanation}
                      className="rounded-full -mt-1 -mr-1 flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {isExplaining ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Je réfléchis...</span>
                    </div>
                  ) : explanationError ? (
                    <div className="space-y-4">
                      <p className="text-destructive">Pas d'explication trouvée.</p>
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Réessayer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xl leading-relaxed">{explanation}</p>
                      
                      {!isSaved && explanation && (
                        <Button
                          onClick={handleSaveExplanation}
                          className="w-full btn-secondary-kid flex items-center gap-2"
                        >
                          <Save className="h-5 w-5" />
                          Sauvegarder
                        </Button>
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
              ) : (
                <div className="explanation-panel text-center py-12">
                  <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Touche un mot pour découvrir sa signification
                  </p>
                </div>
              )}

              {/* Marked words count */}
              <div className="mt-6 p-4 bg-card rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Explications (total)</p>
                <p className="text-3xl font-baloo font-bold text-accent-foreground">
                  {totalMarkedCount}
                </p>
                {markedTexts.size > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Aujourd'hui: <span className="font-bold text-accent-foreground">{markedTexts.size}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingPage;
