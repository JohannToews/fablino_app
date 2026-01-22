import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react";

interface QuizWord {
  id: string;
  word: string;
  explanation: string;
  story_id: string;
}

interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
}

const VocabularyQuizPage = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<QuizWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const { data, error } = await supabase
      .from("marked_words")
      .select("*")
      .not("explanation", "is", null)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Filter words that have explanations
      const validWords = data.filter(w => w.explanation && w.explanation.trim().length > 0);
      setWords(validWords as QuizWord[]);
      setTotalQuestions(Math.min(validWords.length, 10)); // Max 10 questions
    }
    setIsLoading(false);
  };

  const generateQuizQuestion = async (word: QuizWord) => {
    setIsGeneratingQuiz(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { 
          word: word.word, 
          correctExplanation: word.explanation 
        },
      });

      if (data?.wrongOptions) {
        // Shuffle options
        const allOptions = [word.explanation, ...data.wrongOptions];
        const shuffled = allOptions.sort(() => Math.random() - 0.5);
        
        setCurrentQuestion({
          word: word.word,
          correctAnswer: word.explanation,
          options: shuffled,
        });
      } else {
        // Fallback with simple wrong options
        const fallbackOptions = [
          word.explanation,
          "Un animal mignon",
          "Une couleur belle",
          "Quelque chose de grand"
        ].sort(() => Math.random() - 0.5);
        
        setCurrentQuestion({
          word: word.word,
          correctAnswer: word.explanation,
          options: fallbackOptions,
        });
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      toast.error("Fehler beim Generieren der Frage");
    }

    setIsGeneratingQuiz(false);
  };

  const startQuiz = () => {
    if (words.length === 0) return;
    
    setQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    // Shuffle words and pick first one
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    generateQuizQuestion(shuffled[0]);
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex >= totalQuestions || nextIndex >= words.length) {
      setQuizComplete(true);
      return;
    }
    
    setQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setIsCorrect(null);
    generateQuizQuestion(words[nextIndex]);
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

  if (words.length === 0) {
    return (
      <div className="min-h-screen gradient-hero">
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
            <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
              Vokabel-Quiz
            </h1>
          </div>
        </div>

        <div className="container max-w-2xl p-8 text-center">
          <div className="bg-card rounded-2xl p-12 shadow-card">
            <Sparkles className="h-16 w-16 text-primary/40 mx-auto mb-6" />
            <h2 className="text-2xl font-baloo mb-4">Noch keine Vokabeln!</h2>
            <p className="text-muted-foreground mb-8">
              Lies zuerst eine Geschichte und tippe auf Wörter, um sie zu lernen.
            </p>
            <Button
              onClick={() => navigate("/stories")}
              className="btn-primary-kid"
            >
              Zu den Geschichten
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/stories")}
              className="rounded-full hover:bg-primary/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
              Vokabel-Quiz
            </h1>
          </div>
          
          {currentQuestion && !quizComplete && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Frage {questionIndex + 1} / {totalQuestions}
              </span>
              <div className="bg-primary/20 rounded-full px-4 py-1">
                <span className="font-baloo font-bold text-primary">{score} Punkte</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-2xl p-4 md:p-8">
        {/* Quiz not started */}
        {!currentQuestion && !quizComplete && (
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card text-center">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 animate-sparkle" />
            <h2 className="text-3xl font-baloo mb-4">Bereit zum Üben?</h2>
            <p className="text-lg text-muted-foreground mb-2">
              Du hast <strong>{words.length}</strong> Wörter gelernt!
            </p>
            <p className="text-muted-foreground mb-8">
              Das Quiz testet {totalQuestions} zufällige Wörter.
            </p>
            <Button
              onClick={startQuiz}
              className="btn-primary-kid text-xl px-8 py-4"
            >
              Quiz starten! 🚀
            </Button>
          </div>
        )}

        {/* Quiz question */}
        {currentQuestion && !quizComplete && (
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
            {isGeneratingQuiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Nächste Frage wird vorbereitet...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Was bedeutet...</p>
                  <h2 className="text-4xl md:text-5xl font-baloo font-bold text-primary">
                    {currentQuestion.word}
                  </h2>
                </div>

                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectOption = option === currentQuestion.correctAnswer;
                    const showResult = selectedAnswer !== null;
                    
                    let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ";
                    
                    if (showResult) {
                      if (isCorrectOption) {
                        buttonClass += "bg-mint border-green-500 text-green-800";
                      } else if (isSelected && !isCorrectOption) {
                        buttonClass += "bg-red-100 border-red-400 text-red-800";
                      } else {
                        buttonClass += "bg-muted border-border opacity-50";
                      }
                    } else {
                      buttonClass += "bg-card border-border hover:border-primary hover:bg-primary/10 cursor-pointer";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={selectedAnswer !== null}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-lg">{option}</span>
                          {showResult && isCorrectOption && (
                            <CheckCircle2 className="ml-auto h-6 w-6 text-green-600" />
                          )}
                          {showResult && isSelected && !isCorrectOption && (
                            <XCircle className="ml-auto h-6 w-6 text-red-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className="mt-8 text-center">
                    <div className={`mb-4 p-4 rounded-xl ${isCorrect ? "bg-mint" : "bg-cotton-candy"}`}>
                      {isCorrect ? (
                        <p className="text-lg font-bold text-green-800">🎉 Super! Das ist richtig!</p>
                      ) : (
                        <p className="text-lg font-bold text-red-800">
                          Nicht ganz! Die richtige Antwort war oben markiert.
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={nextQuestion}
                      className="btn-primary-kid"
                    >
                      {questionIndex + 1 >= totalQuestions ? "Ergebnis anzeigen" : "Nächste Frage →"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quiz complete */}
        {quizComplete && (
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card text-center">
            <Trophy className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-baloo mb-4">Quiz beendet!</h2>
            
            <div className="bg-primary/20 rounded-2xl p-6 mb-8">
              <p className="text-6xl font-baloo font-bold text-primary mb-2">
                {score} / {totalQuestions}
              </p>
              <p className="text-muted-foreground">
                {score === totalQuestions 
                  ? "Perfekt! Du bist ein Vokabel-Champion! 🏆" 
                  : score >= totalQuestions / 2 
                    ? "Gut gemacht! Weiter üben! 💪"
                    : "Übung macht den Meister! 📚"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={startQuiz}
                className="btn-primary-kid flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Nochmal spielen
              </Button>
              <Button
                onClick={() => navigate("/stories")}
                variant="outline"
                className="btn-kid"
              >
                Zurück zu den Geschichten
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyQuizPage;
