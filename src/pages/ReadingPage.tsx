import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, X, Loader2 } from "lucide-react";

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

const ReadingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [markedWords, setMarkedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadStory();
      loadMarkedWords();
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

  const loadMarkedWords = async () => {
    const { data } = await supabase
      .from("marked_words")
      .select("word")
      .eq("story_id", id);
    
    if (data) {
      setMarkedWords(new Set(data.map((w) => w.word.toLowerCase())));
    }
  };

  const handleWordClick = async (word: string) => {
    // Clean the word from punctuation
    const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
    
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setExplanation(null);
    setIsExplaining(true);

    // Mark the word in DB
    if (!markedWords.has(cleanWord)) {
      await supabase.from("marked_words").insert({
        story_id: id,
        word: cleanWord,
      });
      setMarkedWords(new Set([...markedWords, cleanWord]));
    }

    // Get explanation from Gemini
    try {
      const { data, error } = await supabase.functions.invoke("explain-word", {
        body: { word: cleanWord },
      });

      if (error) {
        console.error("Error:", error);
        setExplanation("Pas d'explication disponible pour le moment.");
      } else if (data?.explanation) {
        setExplanation(data.explanation);
        
        // Update the marked word with explanation
        await supabase
          .from("marked_words")
          .update({ explanation: data.explanation })
          .eq("story_id", id)
          .eq("word", cleanWord);
      }
    } catch (err) {
      console.error("Error:", err);
      setExplanation("Erreur lors de la récupération de l'explication.");
    }

    setIsExplaining(false);
  };

  const closeExplanation = () => {
    setSelectedWord(null);
    setExplanation(null);
  };

  const renderText = () => {
    if (!story) return null;

    const words = story.content.split(/(\s+)/);
    
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:'"«»]/g, "").toLowerCase();
      const isMarked = markedWords.has(cleanWord);
      const isSpace = /^\s+$/.test(word);

      if (isSpace) {
        return <span key={index}>{word}</span>;
      }

      return (
        <span
          key={index}
          onClick={() => handleWordClick(word)}
          className={`word-highlight ${isMarked ? "word-marked" : ""}`}
        >
          {word}
        </span>
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
        <div className="max-w-4xl mx-auto flex items-center gap-4">
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
      </div>

      <div className="container max-w-6xl p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reading Area */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tippe auf ein Wort für eine Erklärung
              </p>
              <div className="reading-text">{renderText()}</div>
            </div>
          </div>

          {/* Explanation Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {selectedWord ? (
                <div className="explanation-panel animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-baloo text-2xl font-bold text-primary">
                      {selectedWord}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeExplanation}
                      className="rounded-full -mt-1 -mr-1"
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
                    <p className="text-lg leading-relaxed">{explanation}</p>
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
