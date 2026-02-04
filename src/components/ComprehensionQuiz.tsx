import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, CircleDot, ChevronRight, Loader2 } from "lucide-react";

// Localized labels for comprehension quiz
const quizLabels: Record<string, {
  bravo: string;
  notQuite: string;
  nextQuestion: string;
  finish: string;
  noQuestions: string;
  loading: string;
}> = {
  de: {
    bravo: "Richtig! 🎉",
    notQuite: "Leider falsch 😊",
    nextQuestion: "Nächste Frage",
    finish: "Fertig",
    noQuestions: "Keine Fragen für diese Geschichte",
    loading: "Lade Fragen...",
  },
  fr: {
    bravo: "Bravo! 🎉",
    notQuite: "Pas tout à fait 😊",
    nextQuestion: "Question suivante",
    finish: "Terminer",
    noQuestions: "Pas de questions pour cette histoire",
    loading: "Chargement des questions...",
  },
  en: {
    bravo: "Correct! 🎉",
    notQuite: "Not quite 😊",
    nextQuestion: "Next question",
    finish: "Finish",
    noQuestions: "No questions for this story",
    loading: "Loading questions...",
  },
  es: {
    bravo: "¡Correcto! 🎉",
    notQuite: "No del todo 😊",
    nextQuestion: "Siguiente pregunta",
    finish: "Terminar",
    noQuestions: "No hay preguntas para esta historia",
    loading: "Cargando preguntas...",
  },
  nl: {
    bravo: "Goed! 🎉",
    notQuite: "Niet helemaal 😊",
    nextQuestion: "Volgende vraag",
    finish: "Klaar",
    noQuestions: "Geen vragen voor dit verhaal",
    loading: "Vragen laden...",
  },
  it: {
    bravo: "Corretto! 🎉",
    notQuite: "Non proprio 😊",
    nextQuestion: "Prossima domanda",
    finish: "Fine",
    noQuestions: "Nessuna domanda per questa storia",
    loading: "Caricamento domande...",
  },
  bs: {
    bravo: "Tačno! 🎉",
    notQuite: "Ne baš 😊",
    nextQuestion: "Sljedeće pitanje",
    finish: "Završi",
    noQuestions: "Nema pitanja za ovu priču",
    loading: "Učitavanje pitanja...",
  },
};

interface Question {
  id: string;
  question: string;
  expected_answer: string;
  options: string[] | null;
  order_index: number;
}

interface QuizResult {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
}

interface ComprehensionQuizProps {
  storyId: string;
  storyDifficulty?: string;
  storyLanguage?: string;
  onComplete: (correctCount: number, totalCount: number) => void;
}

const ComprehensionQuiz = ({ storyId, storyDifficulty = "medium", storyLanguage = "fr", onComplete }: ComprehensionQuizProps) => {
  const t = quizLabels[storyLanguage] || quizLabels.fr;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [storyId]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("comprehension_questions")
      .select("*")
      .eq("story_id", storyId)
      .order("order_index");
    
    if (data && data.length > 0) {
      setQuestions(data);
    } else {
      setQuestions([]);
    }
    setIsLoading(false);
  };

  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return; // Don't allow changes after selection
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.expected_answer;
    
    setResults([...results, {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: answer,
    }]);
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz complete
      const correctCount = results.filter(r => r.correct).length;
      // Include current answer if it exists
      const currentCorrect = selectedAnswer === questions[currentIndex]?.expected_answer;
      const finalCorrectCount = currentCorrect ? correctCount + 1 : correctCount;
      onComplete(finalCorrectCount, questions.length);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t.loading}</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t.noQuestions}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion.options || [];
  const isCorrect = selectedAnswer === currentQuestion.expected_answer;

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {questions.map((_, idx) => {
          const result = results.find(r => r.questionId === questions[idx]?.id);
          return (
            <div key={idx} className="relative">
              {result ? (
                result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )
              ) : (
                <CircleDot 
                  className={`h-5 w-5 ${idx === currentIndex ? 'text-primary' : 'text-muted-foreground/30'}`} 
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Question */}
      <div className="text-center">
        <h3 className="text-xl font-baloo font-semibold mb-6">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === currentQuestion.expected_answer;
          
          let buttonVariant: "outline" | "default" | "destructive" = "outline";
          let extraClasses = "text-left justify-start h-auto py-4 px-4 text-base";
          
          if (showFeedback) {
            if (isCorrectOption) {
              extraClasses += " bg-accent/50 border-accent text-accent-foreground hover:bg-accent/50";
            } else if (isSelected && !isCorrectOption) {
              extraClasses += " bg-destructive/20 border-destructive text-destructive hover:bg-destructive/20";
            } else {
              extraClasses += " opacity-50";
            }
          } else {
            extraClasses += " hover:bg-primary/10 hover:border-primary";
          }
          
          return (
            <Button
              key={idx}
              variant={buttonVariant}
              className={extraClasses}
              onClick={() => handleSelectAnswer(option)}
              disabled={showFeedback}
            >
              <span className="font-medium mr-2 text-muted-foreground">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
              {showFeedback && isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 ml-auto text-accent-foreground" />
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <XCircle className="h-5 w-5 ml-auto text-destructive" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Feedback and Next button */}
      {showFeedback && (
        <div className="text-center space-y-4">
          <p className={`text-lg font-semibold ${isCorrect ? 'text-accent-foreground' : 'text-destructive'}`}>
            {isCorrect ? t.bravo : t.notQuite}
          </p>
          
          <Button onClick={goToNextQuestion} size="lg" className="gap-2">
            {currentIndex < questions.length - 1 ? t.nextQuestion : t.finish}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComprehensionQuiz;
