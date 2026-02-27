import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, CircleDot, ChevronRight, Loader2 } from "lucide-react";
import { isRTL, rtlProps, rtlClasses } from "@/lib/rtlUtils";

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
  bs: { bravo: "Tačno! 🎉", notQuite: "Ne baš 😊", nextQuestion: "Sljedeće pitanje", finish: "Završi", noQuestions: "Nema pitanja za ovu priču", loading: "Učitavanje pitanja..." },
  tr: { bravo: "Doğru! 🎉", notQuite: "Tam değil 😊", nextQuestion: "Sonraki soru", finish: "Bitir", noQuestions: "Bu hikâye için soru yok", loading: "Sorular yükleniyor..." },
  bg: { bravo: "Вярно! 🎉", notQuite: "Не точно 😊", nextQuestion: "Следващ въпрос", finish: "Край", noQuestions: "Няма въпроси за тази история", loading: "Зареждане на въпроси..." },
  ro: { bravo: "Corect! 🎉", notQuite: "Nu chiar 😊", nextQuestion: "Următoarea întrebare", finish: "Gata", noQuestions: "Nu există întrebări pentru această poveste", loading: "Se încarcă întrebările..." },
  pl: { bravo: "Dobrze! 🎉", notQuite: "Nie do końca 😊", nextQuestion: "Następne pytanie", finish: "Koniec", noQuestions: "Brak pytań do tej historii", loading: "Ładowanie pytań..." },
  lt: { bravo: "Teisingai! 🎉", notQuite: "Ne visai 😊", nextQuestion: "Kitas klausimas", finish: "Baigti", noQuestions: "Šiai istorijai klausimų nėra", loading: "Kraunami klausimai..." },
  hu: { bravo: "Helyes! 🎉", notQuite: "Nem egészen 😊", nextQuestion: "Következő kérdés", finish: "Kész", noQuestions: "Nincs kérdés ehhez a történethez", loading: "Kérdések betöltése..." },
  ca: { bravo: "Correcte! 🎉", notQuite: "No del tot 😊", nextQuestion: "Següent pregunta", finish: "Acabar", noQuestions: "No hi ha preguntes per a aquesta història", loading: "Carregant preguntes..." },
  sl: { bravo: "Pravilno! 🎉", notQuite: "Ne povsem 😊", nextQuestion: "Naslednje vprašanje", finish: "Konec", noQuestions: "Za to zgodbo ni vprašanj", loading: "Nalaganje vprašanj..." },
  pt: { bravo: "Correto! 🎉", notQuite: "Não exatamente 😊", nextQuestion: "Próxima pergunta", finish: "Terminar", noQuestions: "Sem perguntas para esta história", loading: "A carregar perguntas..." },
  sk: { bravo: "Správne! 🎉", notQuite: "Nie celkom 😊", nextQuestion: "Ďalšia otázka", finish: "Koniec", noQuestions: "Pre tento príbeh nie sú otázky", loading: "Načítavanie otázok..." },
  uk: { bravo: "Правильно! 🎉", notQuite: "Не зовсім 😊", nextQuestion: "Наступне питання", finish: "Готово", noQuestions: "Немає питань для цієї історії", loading: "Завантаження питань..." },
  ru: { bravo: "Правильно! 🎉", notQuite: "Не совсем 😊", nextQuestion: "Следующий вопрос", finish: "Готово", noQuestions: "Нет вопросов для этой истории", loading: "Загрузка вопросов..." },
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
  onWrongAnswer?: () => void;
}

const ComprehensionQuiz = ({ storyId, storyDifficulty = "medium", storyLanguage = "fr", onComplete, onWrongAnswer }: ComprehensionQuizProps) => {
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

    if (!isCorrect && onWrongAnswer) {
      onWrongAnswer();
    }
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz complete - results already contains ALL answers including current one
      // (added in handleSelectAnswer before this function is called)
      const correctCount = results.filter(r => r.correct).length;
      onComplete(correctCount, questions.length);
    }
  };

  const currentQuestion = questions[currentIndex] || null;
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion?.options) return [];
    const opts = [...currentQuestion.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [currentIndex, currentQuestion?.id]);

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

  const options = shuffledOptions;
  const isCorrect = selectedAnswer === currentQuestion.expected_answer;

  return (
    <div className={`space-y-6 ${isRTL(storyLanguage) ? 'quiz-container' : ''}`} {...rtlProps(storyLanguage)}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {questions.map((_, idx) => {
          const result = results.find(r => r.questionId === questions[idx]?.id);
          return (
            <div key={idx} className="relative">
              {result ? (
                result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )
              ) : (
                <CircleDot 
                  className={`h-5 w-5 ${idx === currentIndex ? 'text-orange-400' : 'text-gray-300'}`} 
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
      <div className="grid grid-cols-1 gap-3 w-full max-w-lg mx-auto">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === currentQuestion.expected_answer;
          
          let buttonVariant: "outline" | "default" | "destructive" = "outline";
          const rtlClass = isRTL(storyLanguage) ? "text-right justify-end" : "text-left justify-start";
          let extraClasses = `${rtlClass} h-auto min-h-[48px] py-3 sm:py-4 px-4 text-sm sm:text-base w-full`;
          
          if (showFeedback) {
            if (isSelected && isCorrectOption) {
              extraClasses += " bg-green-100 border-green-500 text-green-800 hover:bg-green-100";
            } else if (isCorrectOption) {
              extraClasses += " bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-50";
            } else if (isSelected && !isCorrectOption) {
              extraClasses += " bg-red-50 border-red-400 text-red-700 hover:bg-red-50";
            } else {
              extraClasses += " opacity-40";
            }
          } else {
            extraClasses += " hover:bg-orange-50 hover:border-orange-300";
          }
          
          return (
            <Button
              key={idx}
              variant={buttonVariant}
              className={extraClasses}
              {...rtlProps(storyLanguage)}
              onClick={() => handleSelectAnswer(option)}
              disabled={showFeedback}
            >
              <span className={`font-medium text-muted-foreground ${isRTL(storyLanguage) ? 'ml-2' : 'mr-2'}`}>
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
              {showFeedback && isSelected && isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 ml-auto text-green-600" />
              )}
              {showFeedback && !isSelected && isCorrectOption && (
                <CheckCircle2 className="h-5 w-5 ml-auto text-blue-500" />
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <XCircle className="h-5 w-5 ml-auto text-red-500" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Feedback and Next button */}
      {showFeedback && (
        <div className="text-center space-y-4">
          <div className={`rounded-xl py-3 px-4 ${isCorrect ? 'bg-green-50' : 'bg-orange-50'}`}>
            <p className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-orange-600'}`}>
              {isCorrect ? t.bravo : t.notQuite}
            </p>
          </div>
          
          <Button
            onClick={goToNextQuestion}
            size="lg"
            className="gap-2 bg-[#E8863A] hover:bg-[#D4752E] text-white"
          >
            {currentIndex < questions.length - 1 ? t.nextQuestion : t.finish}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComprehensionQuiz;
