import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, X, Loader2, BookOpen } from "lucide-react";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
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
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // Session-only marked words (visual highlighting only for current session)
  const [sessionMarkedWords, setSessionMarkedWords] = useState<Set<string>>(new Set());
  // DB cached explanations (for avoiding re-fetching from LLM)
  const [cachedExplanations, setCachedExplanations] = useState<Map<string, string>>(new Map());
  // Total marked words count from DB (for display)
  const [totalMarkedCount, setTotalMarkedCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadStory();
      loadCachedExplanations();
    }
  }, [id]);

  const loadStory = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setStory(data);
    } else {
      toast.error("Geschichte nicht gefunden");
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

  const handleTextSelection = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    const cleanText = selectedText.replace(/[.,!?;:'"«»\n\r]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    
    if (!cleanText) return;

    setSelectedWord(cleanText);
    setExplanation(null);
    setIsExplaining(true);
    
    // Mark in current session
    setSessionMarkedWords(prev => new Set([...prev, cleanText]));

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanText);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      selection.removeAllRanges();
      return;
    }

    // Save to DB
    await supabase.from("marked_words").insert({
      story_id: id,
      word: cleanText,
    });
    setTotalMarkedCount(prev => prev + 1);

    // Get explanation from Gemini
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: cleanText },
      });

      if (error) {
        console.error("Error:", error);
        setExplanation("Pas d'explication disponible.");
      } else if (data?.explanation) {
        setExplanation(data.explanation);
        
        // Update DB with explanation
        await supabase
          .from("marked_words")
          .update({ explanation: data.explanation })
          .eq("story_id", id)
          .eq("word", cleanText);

        // Update cache
        setCachedExplanations(prev => new Map(prev.set(cleanText, data.explanation)));
      }
    } catch (err) {
      console.error("Error:", err);
      setExplanation("Erreur lors de la récupération.");
    }

    setIsExplaining(false);
    selection.removeAllRanges();
  }, [id, cachedExplanations]);

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
    
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);
    
    // Mark in current session
    setSessionMarkedWords(prev => new Set([...prev, cleanWord]));

    // Check if already cached
    const existingExplanation = cachedExplanations.get(cleanWord);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      return;
    }

    // Save to DB
    await supabase.from("marked_words").insert({
      story_id: id,
      word: cleanWord,
    });
    setTotalMarkedCount(prev => prev + 1);

    // Get explanation from Gemini
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: cleanWord },
      });

      if (error) {
        console.error("Error:", error);
        setExplanation("Pas d'explication disponible.");
      } else if (data?.explanation) {
        setExplanation(data.explanation);
        
        // Update DB with explanation
        await supabase
          .from("marked_words")
          .update({ explanation: data.explanation })
          .eq("story_id", id)
          .eq("word", cleanWord);

        // Update cache
        setCachedExplanations(prev => new Map(prev.set(cleanWord, data.explanation)));
      }
    } catch (err) {
      console.error("Error:", err);
      setExplanation("Erreur lors de la récupération.");
    }

    setIsExplaining(false);
  };

  const closeExplanation = () => {
    setSelectedWord(null);
    setExplanation(null);
  };

  const renderFormattedText = () => {
    if (!story) return null;

    // Split into paragraphs
    const paragraphs = story.content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIndex) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      return (
        <p key={pIndex} className="mb-6 leading-loose">
          {sentences.map((sentence, sIndex) => {
            const shouldBold = sIndex === 0 && pIndex === 0;
            const shouldItalic = sentence.includes("«") || sentence.includes("»");
            
            const words = sentence.split(/(\s+)/);
            
            return (
              <span 
                key={sIndex} 
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic text-secondary-foreground" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
                  const isMarkedInSession = sessionMarkedWords.has(cleanWord);
                  const isSpace = /^\s+$/.test(word);
                  const canBeMarked = !isStopWord(word);

                  if (isSpace) {
                    return <span key={wIndex}>{word}</span>;
                  }

                  // Stop words rendered without interaction
                  if (!canBeMarked) {
                    return <span key={wIndex}>{word}</span>;
                  }

                  return (
                    <span
                      key={wIndex}
                      onClick={() => handleWordClick(word)}
                      className={`word-highlight ${isMarkedInSession ? "word-marked" : ""}`}
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

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/stories")}
              className="rounded-full hover:bg-primary/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-baloo text-foreground truncate">
              {story?.title}
            </h1>
          </div>
          <Button
            onClick={() => navigate("/quiz")}
            className="btn-accent-kid flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Quiz</span>
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reading Area */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Tippe auf ein Wort oder markiere einen Satzteil</span>
              </div>
              
              <div 
                className="reading-text select-text"
                onMouseUp={handleTextSelection}
                onTouchEnd={handleTextSelection}
              >
                {renderFormattedText()}
              </div>
            </div>
          </div>

          {/* Explanation Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {selectedWord ? (
                <div className="explanation-panel animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-baloo text-2xl font-bold text-primary break-words max-w-[200px]">
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
                  ) : (
                    <p className="text-xl leading-relaxed font-semibold">{explanation}</p>
                  )}
                </div>
              ) : (
                <div className="explanation-panel text-center py-12">
                  <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Tippe auf ein Wort, um seine Bedeutung zu erfahren
                  </p>
                </div>
              )}

              {/* Marked words count */}
              <div className="mt-6 p-4 bg-card rounded-xl text-center">
                <p className="text-sm text-muted-foreground">Gelernte Wörter (gesamt)</p>
                <p className="text-3xl font-baloo font-bold text-primary">
                  {totalMarkedCount}
                </p>
                {sessionMarkedWords.size > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Heute: <span className="font-bold text-primary">{sessionMarkedWords.size}</span>
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
