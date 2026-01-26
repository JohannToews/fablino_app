import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizWord {
  id: string;
  word: string;
  explanation: string;
  story_id: string;
  quiz_history?: string[];
  is_learned?: boolean;
}

interface QuizQuestion {
  wordId: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

const VocabularyQuizPage = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<QuizWord[]>([]);
  const [quizWords, setQuizWords] = useState<QuizWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<"5" | "10">("5");
  const [quizStarted, setQuizStarted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [quizPointValue, setQuizPointValue] = useState(2); // default points per correct answer
  const [scoreAnimation, setScoreAnimation] = useState(false);

  // Confetti effect for correct answers
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
    });
  }, []);

  // Big confetti for quiz passed
  const triggerBigConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#95E1D3', '#F38181', '#AA96DA'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    loadWords();
    loadQuizPointValue();
  }, []);

  const loadQuizPointValue = async () => {
    // Load quiz point value for medium difficulty (default)
    const { data } = await supabase
      .from("point_settings")
      .select("points")
      .eq("category", "quiz")
      .eq("difficulty", "medium")
      .maybeSingle();

    if (data) {
      setQuizPointValue(data.points);
    }
  };

  const loadWords = async () => {
    // Only load words that are NOT marked as "easy" and NOT learned
    const { data, error } = await supabase
      .from("marked_words")
      .select("*")
      .not("explanation", "is", null)
      .or("difficulty.is.null,difficulty.neq.easy")
      .or("is_learned.is.null,is_learned.eq.false")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Filter words that have explanations and are not learned
      const validWords = data.filter(w => 
        w.explanation && 
        w.explanation.trim().length > 0 &&
        !w.is_learned
      );
      setWords(validWords as QuizWord[]);
    }
    setIsLoading(false);
  };

  const generateQuizQuestion = async (word: QuizWord, retryCount = 0) => {
    setIsGeneratingQuiz(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { 
          word: word.word, 
          correctExplanation: word.explanation 
        },
      });

      if (error) {
        console.error("Quiz generation error:", error);
        
        // If rate limited, wait and retry up to 2 times
        if (error.message?.includes("429") && retryCount < 2) {
          toast.info("Chargement... un moment s'il te plaît");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return generateQuizQuestion(word, retryCount + 1);
        }
        
        // Use fallback options
        const fallbackOptions = [
          word.explanation,
          "Un animal mignon",
          "Une couleur belle",
          "Quelque chose de grand"
        ].sort(() => Math.random() - 0.5);
        
        setCurrentQuestion({
          wordId: word.id,
          word: word.word,
          correctAnswer: word.explanation,
          options: fallbackOptions,
        });
        setIsGeneratingQuiz(false);
        return;
      }

      if (data?.wrongOptions) {
        // Check if using fallback
        if (data.fallback) {
          toast.info("Mode simplifié activé");
        }
        
        // Use infinitive form if returned by the API, otherwise use original word
        const displayWord = data.infinitive || word.word;
        
        // Shuffle options
        const allOptions = [word.explanation, ...data.wrongOptions];
        const shuffled = allOptions.sort(() => Math.random() - 0.5);
        
        setCurrentQuestion({
          wordId: word.id,
          word: displayWord,
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
          wordId: word.id,
          word: word.word,
          correctAnswer: word.explanation,
          options: fallbackOptions,
        });
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      // Use fallback on any error
      const fallbackOptions = [
        word.explanation,
        "Un animal mignon",
        "Une couleur belle",
        "Quelque chose de grand"
      ].sort(() => Math.random() - 0.5);
      
      setCurrentQuestion({
        wordId: word.id,
        word: word.word,
        correctAnswer: word.explanation,
        options: fallbackOptions,
      });
    }

    setIsGeneratingQuiz(false);
  };

  const startQuiz = () => {
    if (words.length === 0) return;
    
    const questionCount = parseInt(selectedQuestionCount);
    const actualQuestionCount = Math.min(questionCount, words.length);
    
    setTotalQuestions(actualQuestionCount);
    setQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuizStarted(true);
    
    // Shuffle words and pick the needed amount
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, actualQuestionCount);
    setQuizWords(selectedWords);
    generateQuizQuestion(selectedWords[0]);
  };

  const updateWordQuizHistory = async (wordId: string, isCorrectAnswer: boolean) => {
    // Get current word to access its quiz_history
    const currentWord = quizWords.find(w => w.id === wordId);
    const currentHistory = currentWord?.quiz_history || [];
    
    // Add new result and keep only last 3
    const newHistory = [...currentHistory, isCorrectAnswer ? 'correct' : 'incorrect'].slice(-3);
    
    const { error } = await supabase
      .from("marked_words")
      .update({ quiz_history: newHistory } as any)
      .eq("id", wordId);

    if (error) {
      console.error("Error updating quiz history:", error);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      // Trigger celebrations!
      triggerConfetti();
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 600);
    }
    
    // Update quiz history for this word
    if (currentQuestion?.wordId) {
      await updateWordQuizHistory(currentQuestion.wordId, correct);
    }
  };

  const nextQuestion = async () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex >= totalQuestions || nextIndex >= quizWords.length) {
      setQuizComplete(true);
      // Save result if passed
      if (score >= getPassThreshold()) {
        const earnedPoints = score * quizPointValue;
        setPointsEarned(earnedPoints);
        
        // Trigger big celebration!
        setTimeout(() => triggerBigConfetti(), 300);
        
        await supabase.from("user_results").insert({
          activity_type: "quiz_passed",
          difficulty: "medium",
          points_earned: earnedPoints,
          correct_answers: score,
          total_questions: totalQuestions,
        });
      }
      return;
    }
    
    setQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setIsCorrect(null);
    generateQuizQuestion(quizWords[nextIndex]);
  };

  const getPassThreshold = () => {
    return totalQuestions === 10 ? 8 : 4;
  };

  const isPassed = () => {
    return score >= getPassThreshold();
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(null);
    setQuizComplete(false);
    loadWords(); // Reload words to get updated learned status
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
              Quiz des Mots
            </h1>
          </div>
        </div>

        <div className="container max-w-2xl p-8 text-center">
          <div className="bg-card rounded-2xl p-12 shadow-card">
            <Sparkles className="h-16 w-16 text-primary/40 mx-auto mb-6" />
            <h2 className="text-2xl font-baloo mb-4">Pas encore de mots!</h2>
            <p className="text-muted-foreground mb-8">
              Lis d'abord une histoire et touche les mots pour les apprendre.
            </p>
            <Button
              onClick={() => navigate("/stories")}
              className="btn-primary-kid"
            >
              Vers les histoires
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
              Quiz des Mots
            </h1>
          </div>
          
          {currentQuestion && !quizComplete && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Question {questionIndex + 1} / {totalQuestions}
              </span>
              <div className={`bg-primary/20 rounded-full px-4 py-1 transition-transform ${scoreAnimation ? 'animate-bounce scale-125' : ''}`}>
                <span className="font-baloo font-bold text-primary">{score} Points</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-2xl p-4 md:p-8">
        {/* Quiz not started */}
        {!quizStarted && !quizComplete && (
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card text-center">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 animate-sparkle" />
            <h2 className="text-3xl font-baloo mb-4">Prêt à jouer?</h2>
            <p className="text-lg text-muted-foreground mb-2">
              Tu as <strong>{words.length}</strong> mots à apprendre!
            </p>
            
            {/* Question count selection */}
            <div className="my-8 flex flex-col items-center gap-4">
              <label className="text-lg font-medium">Combien de questions?</label>
              <Select 
                value={selectedQuestionCount} 
                onValueChange={(value: "5" | "10") => setSelectedQuestionCount(value)}
              >
                <SelectTrigger className="w-32 text-center text-xl font-baloo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-lg">5 questions</SelectItem>
                  <SelectItem value="10" className="text-lg">10 questions</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Pour réussir: {selectedQuestionCount === "5" ? "4/5" : "8/10"} bonnes réponses
              </p>
            </div>

            <Button
              onClick={startQuiz}
              className="btn-primary-kid text-xl px-8 py-4"
              disabled={words.length === 0}
            >
              Commencer le quiz! 🚀
            </Button>
          </div>
        )}

        {/* Quiz question */}
        {quizStarted && currentQuestion && !quizComplete && (
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
            {isGeneratingQuiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Prochaine question en préparation...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Que signifie...</p>
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
                        <p className="text-lg font-bold text-green-800">🎉 Super! C'est correct!</p>
                      ) : (
                        <p className="text-lg font-bold text-red-800">
                          Pas tout à fait! La bonne réponse est marquée au-dessus.
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={nextQuestion}
                      className="btn-primary-kid"
                    >
                      {questionIndex + 1 >= totalQuestions ? "Voir le résultat" : "Question suivante →"}
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
            <Trophy className={`h-20 w-20 mx-auto mb-6 ${isPassed() ? "text-primary" : "text-muted-foreground"}`} />
            <h2 className="text-4xl font-baloo mb-4">
              {isPassed() ? "Quiz réussi! 🎉" : "Quiz terminé!"}
            </h2>
            
            <div className={`rounded-2xl p-6 mb-8 ${isPassed() ? "bg-mint" : "bg-cotton-candy/30"}`}>
              <p className="text-6xl font-baloo font-bold mb-2" style={{ color: isPassed() ? '#166534' : '#991b1b' }}>
                {score} / {totalQuestions}
              </p>
              {isPassed() && (
                <p className="text-2xl font-baloo text-green-700 mb-2">
                  +{pointsEarned} points! 🎯
                </p>
              )}
              <p className="text-muted-foreground mb-2">
                {isPassed() 
                  ? "Bravo! Tu as réussi le quiz! 🏆" 
                  : `Il te fallait ${getPassThreshold()} bonnes réponses pour réussir. (0 points)`}
              </p>
              <p className="text-sm text-muted-foreground">
                Les mots répondus 3 fois correctement de suite sont marqués comme appris!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={resetQuiz}
                className="btn-primary-kid flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Nouveau quiz
              </Button>
              <Button
                onClick={() => navigate("/stories")}
                variant="outline"
                className="btn-kid"
              >
                Retour aux histoires
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyQuizPage;
