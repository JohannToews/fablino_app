import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, X, Loader2, Star, BookOpen } from "lucide-react";

interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
}

interface MarkedWord {
  word: string;
  explanation: string | null;
}

interface SpecialExpression {
  phrase: string;
  type: "idiom" | "metaphor" | "difficult";
  hint: string;
}

const ReadingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [markedWords, setMarkedWords] = useState<Map<string, string | null>>(new Map());
  const [specialExpressions, setSpecialExpressions] = useState<SpecialExpression[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      loadStory();
      loadMarkedWords();
    }
  }, [id]);

  // Analyze text for special expressions when story loads
  useEffect(() => {
    if (story?.content && specialExpressions.length === 0) {
      analyzeTextForSpecialExpressions();
    }
  }, [story?.content]);

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

  const loadMarkedWords = async () => {
    const { data } = await supabase
      .from("marked_words")
      .select("word, explanation")
      .eq("story_id", id);
    
    if (data) {
      const wordMap = new Map<string, string | null>();
      data.forEach((w) => wordMap.set(w.word.toLowerCase(), w.explanation));
      setMarkedWords(wordMap);
    }
  };

  const analyzeTextForSpecialExpressions = async () => {
    if (!story?.content) return;
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-text", {
        body: { text: story.content },
      });

      if (data?.specialExpressions) {
        setSpecialExpressions(data.specialExpressions);
      }
    } catch (err) {
      console.error("Error analyzing text:", err);
    }
    
    setIsAnalyzing(false);
  };

  const handleTextSelection = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    // Clean the selection
    const cleanText = selectedText.replace(/[.,!?;:'"«»\n\r]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    
    if (!cleanText) return;

    setSelectedWord(cleanText);
    setExplanation(null);
    setIsExplaining(true);

    // Check if already in DB
    const existingExplanation = markedWords.get(cleanText);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      return;
    }

    // Mark in DB
    if (!markedWords.has(cleanText)) {
      await supabase.from("marked_words").insert({
        story_id: id,
        word: cleanText,
      });
    }

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
        
        // Update marked word with explanation
        await supabase
          .from("marked_words")
          .update({ explanation: data.explanation })
          .eq("story_id", id)
          .eq("word", cleanText);

        // Update local state
        setMarkedWords(new Map(markedWords.set(cleanText, data.explanation)));
      }
    } catch (err) {
      console.error("Error:", err);
      setExplanation("Erreur lors de la récupération.");
    }

    setIsExplaining(false);
    selection.removeAllRanges();
  }, [id, markedWords]);

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
    
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);

    // Check if already in DB with explanation
    const existingExplanation = markedWords.get(cleanWord);
    
    if (existingExplanation) {
      setExplanation(existingExplanation);
      setIsExplaining(false);
      return;
    }

    // Mark in DB if not exists
    if (!markedWords.has(cleanWord)) {
      await supabase.from("marked_words").insert({
        story_id: id,
        word: cleanWord,
      });
    }

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
        
        // Update marked word with explanation
        await supabase
          .from("marked_words")
          .update({ explanation: data.explanation })
          .eq("story_id", id)
          .eq("word", cleanWord);

        // Update local state
        setMarkedWords(new Map(markedWords.set(cleanWord, data.explanation)));
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

  const isSpecialExpression = (text: string): SpecialExpression | undefined => {
    const lowerText = text.toLowerCase();
    return specialExpressions.find(expr => 
      lowerText.includes(expr.phrase.toLowerCase()) || 
      expr.phrase.toLowerCase().includes(lowerText)
    );
  };

  const renderFormattedText = () => {
    if (!story) return null;

    // Split into paragraphs
    const paragraphs = story.content.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIndex) => {
      // Split paragraph into sentences for varied formatting
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      return (
        <p key={pIndex} className="mb-6 leading-loose">
          {sentences.map((sentence, sIndex) => {
            // Add some formatting variety
            const shouldBold = sIndex === 0 && pIndex === 0; // First sentence bold
            const shouldItalic = sentence.includes("«") || sentence.includes("»"); // Dialogue italic
            
            const words = sentence.split(/(\s+)/);
            
            return (
              <span 
                key={sIndex} 
                className={`${shouldBold ? "font-bold" : ""} ${shouldItalic ? "italic text-secondary-foreground" : ""}`}
              >
                {words.map((word, wIndex) => {
                  const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
                  const isMarked = markedWords.has(cleanWord);
                  const isSpace = /^\s+$/.test(word);
                  const special = isSpecialExpression(cleanWord);

                  if (isSpace) {
                    return <span key={wIndex}>{word}</span>;
                  }

                  return (
                    <span
                      key={wIndex}
                      onClick={() => handleWordClick(word)}
                      className={`word-highlight ${isMarked ? "word-marked" : ""} ${
                        special ? "special-expression" : ""
                      }`}
                      title={special?.hint}
                    >
                      {word}
                      {special && (
                        <Star className="inline-block h-3 w-3 ml-0.5 text-primary opacity-60" />
                      )}
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
                {isAnalyzing && (
                  <span className="flex items-center gap-1 text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analysiere...
                  </span>
                )}
              </div>
              
              {/* Special expressions legend */}
              {specialExpressions.length > 0 && (
                <div className="mb-6 p-3 bg-sunshine/20 rounded-xl flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span>Wörter mit Stern sind besondere Ausdrücke</span>
                </div>
              )}
              
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
                <p className="text-sm text-muted-foreground">Gelernte Wörter</p>
                <p className="text-3xl font-baloo font-bold text-primary">
                  {markedWords.size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingPage;
