import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useGamification } from "@/hooks/useGamification";
import FablinoReaction from "@/components/FablinoReaction";
import BadgeCelebrationModal, { EarnedBadge } from "@/components/BadgeCelebrationModal";
import QuizCompletionResult from "@/components/QuizCompletionResult";
import { getTranslations, Language } from "@/lib/translations";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const quizTranslations: Record<string, {
  title: string;
  noWordsTitle: string;
  noWordsText: string;
  toStories: string;
  readyToPlay: string;
  chooseStory: string;
  allStories: string;
  quizHasWords: string;
  words: string;
  toPass: string;
  goodAnswers: string;
  startQuiz: string;
  nextQuestion: string;
  question: string;
  points: string;
  whatMeans: string;
  correct: string;
  notQuite: string;
  seeResult: string;
  nextQuestionBtn: string;
  quizPassed: string;
  quizDone: string;
  bravo: string;
  needed: string;
  learnedInfo: string;
  newQuiz: string;
  backToStories: string;
}> = {
  de: {
    title: "Wörter-Quiz",
    noWordsTitle: "Noch keine Wörter!",
    noWordsText: "Lies zuerst eine Geschichte und tippe auf Wörter, um sie zu lernen.",
    toStories: "Zu den Geschichten",
    readyToPlay: "Bereit zu spielen",
    chooseStory: "Geschichte wählen:",
    allStories: "Alle Geschichten",
    quizHasWords: "Dieses Quiz hat",
    words: "Wörter",
    toPass: "Zum Bestehen: ~80% richtige Antworten",
    goodAnswers: "richtige Antworten",
    startQuiz: "Quiz starten! 🚀",
    nextQuestion: "Nächste Frage wird vorbereitet...",
    question: "Frage",
    points: "Punkte",
    whatMeans: "Was bedeutet...",
    correct: "🎉 Super! Das ist richtig!",
    notQuite: "Nicht ganz! Die richtige Antwort ist oben markiert.",
    seeResult: "Ergebnis ansehen",
    nextQuestionBtn: "Nächste Frage →",
    quizPassed: "Quiz bestanden! 🎉",
    quizDone: "Quiz beendet!",
    bravo: "Bravo! Du hast das Quiz bestanden! 🏆",
    needed: "Du brauchtest {threshold} richtige Antworten zum Bestehen. (0 Punkte)",
    learnedInfo: "Wörter, die 3x hintereinander richtig beantwortet wurden, sind als gelernt markiert!",
    newQuiz: "Neues Quiz",
    backToStories: "Zurück zu den Geschichten",
  },
  fr: {
    title: "Quiz des Mots",
    noWordsTitle: "Pas encore de mots!",
    noWordsText: "Lis d'abord une histoire et touche les mots pour les apprendre.",
    toStories: "Vers les histoires",
    readyToPlay: "Prêt à jouer",
    chooseStory: "Choisir une histoire:",
    allStories: "Toutes les histoires",
    quizHasWords: "Ce quiz a",
    words: "mots",
    toPass: "Pour réussir: ~80% de bonnes réponses",
    goodAnswers: "bonnes réponses",
    startQuiz: "Commencer le quiz! 🚀",
    nextQuestion: "Prochaine question en préparation...",
    question: "Question",
    points: "Points",
    whatMeans: "Que signifie...",
    correct: "🎉 Super! C'est correct!",
    notQuite: "Pas tout à fait! La bonne réponse est marquée au-dessus.",
    seeResult: "Voir le résultat",
    nextQuestionBtn: "Question suivante →",
    quizPassed: "Quiz réussi! 🎉",
    quizDone: "Quiz terminé!",
    bravo: "Bravo! Tu as réussi le quiz! 🏆",
    needed: "Il te fallait {threshold} bonnes réponses pour réussir. (0 points)",
    learnedInfo: "Les mots répondus 3 fois correctement de suite sont marqués comme appris!",
    newQuiz: "Nouveau quiz",
    backToStories: "Retour aux histoires",
  },
  en: {
    title: "Word Quiz",
    noWordsTitle: "No words yet!",
    noWordsText: "First read a story and tap on words to learn them.",
    toStories: "Go to stories",
    readyToPlay: "Ready to play",
    chooseStory: "Choose a story:",
    allStories: "All stories",
    quizHasWords: "This quiz has",
    words: "words",
    toPass: "To pass: ~80% correct answers",
    goodAnswers: "correct answers",
    startQuiz: "Start quiz! 🚀",
    nextQuestion: "Next question loading...",
    question: "Question",
    points: "Points",
    whatMeans: "What does this mean...",
    correct: "🎉 Great! That's correct!",
    notQuite: "Not quite! The correct answer is marked above.",
    seeResult: "See result",
    nextQuestionBtn: "Next question →",
    quizPassed: "Quiz passed! 🎉",
    quizDone: "Quiz done!",
    bravo: "Bravo! You passed the quiz! 🏆",
    needed: "You needed {threshold} correct answers to pass. (0 points)",
    learnedInfo: "Words answered correctly 3 times in a row are marked as learned!",
    newQuiz: "New quiz",
    backToStories: "Back to stories",
  },
  es: {
    title: "Quiz de Palabras",
    noWordsTitle: "¡Aún no hay palabras!",
    noWordsText: "Primero lee una historia y toca las palabras para aprenderlas.",
    toStories: "Ir a las historias",
    readyToPlay: "Listo para jugar",
    chooseStory: "Elegir una historia:",
    allStories: "Todas las historias",
    quizHasWords: "Este quiz tiene",
    words: "palabras",
    toPass: "Para aprobar: ~80% respuestas correctas",
    goodAnswers: "respuestas correctas",
    startQuiz: "¡Comenzar quiz! 🚀",
    nextQuestion: "Preparando siguiente pregunta...",
    question: "Pregunta",
    points: "Puntos",
    whatMeans: "¿Qué significa...",
    correct: "🎉 ¡Genial! ¡Es correcto!",
    notQuite: "¡No del todo! La respuesta correcta está marcada arriba.",
    seeResult: "Ver resultado",
    nextQuestionBtn: "Siguiente pregunta →",
    quizPassed: "¡Quiz aprobado! 🎉",
    quizDone: "¡Quiz terminado!",
    bravo: "¡Bravo! ¡Has aprobado el quiz! 🏆",
    needed: "Necesitabas {threshold} respuestas correctas para aprobar. (0 puntos)",
    learnedInfo: "¡Las palabras respondidas correctamente 3 veces seguidas se marcan como aprendidas!",
    newQuiz: "Nuevo quiz",
    backToStories: "Volver a las historias",
  },
  nl: {
    title: "Woordenquiz",
    noWordsTitle: "Nog geen woorden!",
    noWordsText: "Lees eerst een verhaal en tik op woorden om ze te leren.",
    toStories: "Naar de verhalen",
    readyToPlay: "Klaar om te spelen",
    chooseStory: "Kies een verhaal:",
    allStories: "Alle verhalen",
    quizHasWords: "Deze quiz heeft",
    words: "woorden",
    toPass: "Om te slagen: ~80% goede antwoorden",
    goodAnswers: "goede antwoorden",
    startQuiz: "Start quiz! 🚀",
    nextQuestion: "Volgende vraag wordt voorbereid...",
    question: "Vraag",
    points: "Punten",
    whatMeans: "Wat betekent...",
    correct: "🎉 Super! Dat is correct!",
    notQuite: "Niet helemaal! Het juiste antwoord staat hierboven.",
    seeResult: "Bekijk resultaat",
    nextQuestionBtn: "Volgende vraag →",
    quizPassed: "Quiz geslaagd! 🎉",
    quizDone: "Quiz klaar!",
    bravo: "Bravo! Je hebt de quiz gehaald! 🏆",
    needed: "Je had {threshold} goede antwoorden nodig om te slagen. (0 punten)",
    learnedInfo: "Woorden die 3x achter elkaar goed beantwoord zijn, worden als geleerd gemarkeerd!",
    newQuiz: "Nieuwe quiz",
    backToStories: "Terug naar verhalen",
  },
  it: {
    title: "Quiz delle Parole",
    noWordsTitle: "Nessuna parola ancora!",
    noWordsText: "Prima leggi una storia e tocca le parole per impararle.",
    toStories: "Vai alle storie",
    readyToPlay: "Pronto a giocare",
    chooseStory: "Scegli una storia:",
    allStories: "Tutte le storie",
    quizHasWords: "Questo quiz ha",
    words: "parole",
    toPass: "Per superare: ~80% risposte corrette",
    goodAnswers: "risposte corrette",
    startQuiz: "Inizia quiz! 🚀",
    nextQuestion: "Prossima domanda in preparazione...",
    question: "Domanda",
    points: "Punti",
    whatMeans: "Cosa significa...",
    correct: "🎉 Super! È corretto!",
    notQuite: "Non proprio! La risposta corretta è segnata sopra.",
    seeResult: "Vedi risultato",
    nextQuestionBtn: "Prossima domanda →",
    quizPassed: "Quiz superato! 🎉",
    quizDone: "Quiz terminato!",
    bravo: "Bravo! Hai superato il quiz! 🏆",
    needed: "Ti servivano {threshold} risposte corrette per superare. (0 punti)",
    learnedInfo: "Le parole risposte correttamente 3 volte di seguito sono segnate come imparate!",
    newQuiz: "Nuovo quiz",
    backToStories: "Torna alle storie",
  },
  bs: {
    title: "Kviz Riječi",
    noWordsTitle: "Još nema riječi!",
    noWordsText: "Prvo pročitaj priču i dodirni riječi da ih naučiš.",
    toStories: "Idi na priče",
    readyToPlay: "Spreman za igru",
    chooseStory: "Izaberi priču:",
    allStories: "Sve priče",
    quizHasWords: "Ovaj kviz ima",
    words: "riječi",
    toPass: "Za prolaz: ~80% tačnih odgovora",
    goodAnswers: "tačnih odgovora",
    startQuiz: "Započni kviz! 🚀",
    nextQuestion: "Priprema sljedećeg pitanja...",
    question: "Pitanje",
    points: "Bodovi",
    whatMeans: "Šta znači...",
    correct: "🎉 Super! To je tačno!",
    notQuite: "Nije baš! Tačan odgovor je označen gore.",
    seeResult: "Pogledaj rezultat",
    nextQuestionBtn: "Sljedeće pitanje →",
    quizPassed: "Kviz položen! 🎉",
    quizDone: "Kviz završen!",
    bravo: "Bravo! Položio/la si kviz! 🏆",
    needed: "Trebalo ti je {threshold} tačnih odgovora za prolaz. (0 bodova)",
    learnedInfo: "Riječi odgovorene 3 puta zaredom tačno označene su kao naučene!",
    newQuiz: "Novi kviz",
    backToStories: "Nazad na priče",
  },
};

interface QuizWord {
  id: string;
  word: string;
  explanation: string;
  story_id: string;
  quiz_history?: string[];
  is_learned?: boolean;
  text_language?: string;
}

interface QuizQuestion {
  wordId: string;
  word: string;
  correctAnswer: string;
  options: string[];
  language?: string;
}

interface Story {
  id: string;
  title: string;
  text_language?: string;
}

const VocabularyQuizPage = () => {
  const { user } = useAuth();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const { actions, pendingLevelUp, clearPendingLevelUp, starRewards } = useGamification();
  const tGlobal = getTranslations(kidAppLanguage as Language);
  const navigate = useNavigate();
  const [allWords, setAllWords] = useState<QuizWord[]>([]);
  const [words, setWords] = useState<QuizWord[]>([]);
  const [quizWords, setQuizWords] = useState<QuizWord[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [quizPointValue, setQuizPointValue] = useState(2);
  const [preGeneratedQuestions, setPreGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [fablinoReaction, setFablinoReaction] = useState<{
    type: 'celebrate' | 'encourage' | 'perfect';
    message: string;
    stars?: number;
    autoClose?: number;
  } | null>(null);
  // Badge celebration
  const [pendingBadges, setPendingBadges] = useState<EarnedBadge[]>([]);

  // Get translations based on kid's school system language
  const t = quizTranslations[kidAppLanguage] || quizTranslations.fr;

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
    if (user) {
      loadWordsAndStories();
    }
    loadQuizPointValue();
  }, [user, selectedProfileId]);

  // Filter words when story selection changes
  useEffect(() => {
    if (selectedStoryId === "all") {
      setWords(allWords);
    } else {
      setWords(allWords.filter(w => w.story_id === selectedStoryId));
    }
  }, [selectedStoryId, allWords]);

  const loadQuizPointValue = async () => {
    // Load quiz point value from point_settings
    const { data } = await supabase
      .from("point_settings")
      .select("setting_key, value")
      .eq("setting_key", "stars_quiz_perfect")
      .maybeSingle();

    if (data) {
      setQuizPointValue(parseInt(data.value, 10) || 2);
    }
  };

  const loadWordsAndStories = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // Use RPC to bypass RLS overhead
    const { data: storiesData } = await supabase
      .rpc("get_my_stories", {
        p_profile_id: selectedProfileId || null,
        p_limit: 500,
        p_offset: 0,
      })
      .select("id, title, text_language");
    
    // Create a map of story_id -> text_language
    const storyLanguageMap = new Map<string, string>();
    if (storiesData) {
      storiesData.forEach((s: any) => {
        storyLanguageMap.set(s.id, s.text_language || 'fr');
      });
      setStories(storiesData);
    }
    
    // Get story IDs for filtering words
    const storyIds = storiesData?.map((s: any) => s.id) || [];
    
    if (storyIds.length === 0) {
      setAllWords([]);
      setWords([]);
      setIsLoading(false);
      return;
    }
    
    // Load words only from filtered stories
    const { data, error } = await supabase
      .from("marked_words")
      .select("*, stories!inner(user_id, kid_profile_id, text_language)")
      .in("story_id", storyIds)
      .not("explanation", "is", null)
      .or("difficulty.is.null,difficulty.neq.easy")
      .or("is_learned.is.null,is_learned.eq.false")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Filter words that have explanations and add text_language from stories
      const validWords = data.filter((w: any) => 
        w.explanation && 
        w.explanation.trim().length > 0 &&
        !w.is_learned
      ).map((w: any) => ({
        ...w,
        text_language: w.stories?.text_language || 'fr'
      }));
      setAllWords(validWords as QuizWord[]);
      setWords(validWords as QuizWord[]);
    } else {
      setAllWords([]);
      setWords([]);
    }
    setIsLoading(false);
  };

  // Generate a single quiz question (returns the question object)
  const generateSingleQuestion = async (word: QuizWord): Promise<QuizQuestion> => {
    const wordLanguage = word.text_language || 'fr';
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { 
          word: word.word, 
          correctExplanation: word.explanation,
          language: wordLanguage,
        },
      });

      if (error || !data?.wrongOptions) {
        // Return fallback question
        const fallbackOptions = [
          word.explanation,
          "Un animal mignon",
          "Une couleur belle",
          "Quelque chose de grand"
        ].sort(() => Math.random() - 0.5);
        
        return {
          wordId: word.id,
          word: word.word,
          correctAnswer: word.explanation,
          options: fallbackOptions,
        };
      }

      const displayWord = data.infinitive || word.word;
      const allOptions = [word.explanation, ...data.wrongOptions];
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      
      return {
        wordId: word.id,
        word: displayWord,
        correctAnswer: word.explanation,
        options: shuffled,
      };
    } catch (err) {
      console.error("Error generating quiz:", err);
      const fallbackOptions = [
        word.explanation,
        "Un animal mignon",
        "Une couleur belle",
        "Quelque chose de grand"
      ].sort(() => Math.random() - 0.5);
      
      return {
        wordId: word.id,
        word: word.word,
        correctAnswer: word.explanation,
        options: fallbackOptions,
      };
    }
  };

  const startQuiz = async () => {
    if (words.length === 0) return;
    
    setIsGeneratingQuiz(true);
    setQuizStarted(true);
    
    // Shuffle words and use all of them
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQuizWords(shuffled);
    
    const actualQuestionCount = shuffled.length;
    setTotalQuestions(actualQuestionCount);
    setQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    // Generate ALL questions in parallel (much faster!)
    const questionPromises = shuffled.map(word => generateSingleQuestion(word));
    const generatedQuestions = await Promise.all(questionPromises);
    
    setPreGeneratedQuestions(generatedQuestions);
    setCurrentQuestion(generatedQuestions[0]);
    setIsGeneratingQuiz(false);
  };

  const updateWordQuizHistory = async (wordId: string, isCorrectAnswer: boolean) => {
    // Get current word to access its quiz_history
    const currentWord = quizWords.find(w => w.id === wordId);
    const currentHistory = currentWord?.quiz_history || [];
    
    // Add new result and keep only last 3
    const newHistory = [...currentHistory, isCorrectAnswer ? 'correct' : 'incorrect'].slice(-3);
    
    // Check if word just became learned (3 consecutive corrects)
    const justLearned = newHistory.length >= 3 &&
      newHistory.slice(-3).every(r => r === 'correct') &&
      !currentWord?.is_learned;
    
    const updateData: Record<string, unknown> = { quiz_history: newHistory };
    if (justLearned) {
      updateData.is_learned = true;
    }

    const { error } = await supabase
      .from("marked_words")
      .update(updateData as any)
      .eq("id", wordId);

    if (error) {
      console.error("Error updating quiz history:", error);
    }

    // Fablino feedback for newly learned word
    if (justLearned) {
      await actions.markWordLearned();
      await actions.awardStars(1, 'word_learned');
      setFablinoReaction({
        type: 'celebrate',
        message: tGlobal.fablinoWordLearned,
        stars: 1,
      });
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
    } else {
      // Fablino encouragement on wrong answer
      setFablinoReaction({
        type: 'encourage',
        message: tGlobal.fablinoEncourage,
        autoClose: 1500,
      });
    }
    
    // Update quiz history for this word
    if (currentQuestion?.wordId) {
      await updateWordQuizHistory(currentQuestion.wordId, correct);
    }
  };

  const nextQuestion = async () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex >= totalQuestions || nextIndex >= preGeneratedQuestions.length) {
      setQuizComplete(true);

      const passed = score >= getPassThreshold();
      const isPerfect = score === totalQuestions;
      const stars = !passed ? starRewards.stars_quiz_failed : isPerfect ? starRewards.stars_quiz_perfect : starRewards.stars_quiz_passed;
      const totalStars = stars;
      setPointsEarned(totalStars);

      // Log activity via RPC (handles stars, streak, badges, user_results)
      try {
        const result = await supabase.rpc('log_activity', {
          p_child_id: selectedProfileId,
          p_activity_type: 'quiz_complete',
          p_stars: stars,
          p_metadata: { score, max_score: totalQuestions },
        });

        const data = result.data as any;
        if (data?.new_badges?.length > 0) {
          setPendingBadges(data.new_badges);
        }
      } catch (e) {
        // Silent fail – gamification should not block UX
      }

      if (passed) {
        // Trigger big celebration!
        setTimeout(() => triggerBigConfetti(), 300);

        // Fablino feedback
        if (isPerfect) {
          setFablinoReaction({
            type: 'perfect',
            message: tGlobal.fablinoQuizPerfect,
            stars: totalStars,
          });
        } else {
          setFablinoReaction({
            type: 'celebrate',
            message: tGlobal.fablinoQuizGood
              .replace('{correct}', String(score))
              .replace('{total}', String(totalQuestions)),
            stars: totalStars,
          });
        }
      }
      return;
    }
    
    setQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setIsCorrect(null);
    // Use pre-generated question (instant!)
    setCurrentQuestion(preGeneratedQuestions[nextIndex]);
  };

  const getPassThreshold = () => {
    return Math.ceil(totalQuestions * 0.8); // 80%
  };

  const isPassed = () => {
    return score >= getPassThreshold();
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(null);
    setQuizComplete(false);
    setPreGeneratedQuestions([]);
    loadWordsAndStories(); // Reload words to get updated learned status
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
        <PageHeader title={t.title} backTo="/stories" />

        <div className="container max-w-2xl p-8 text-center">
          <div className="bg-card rounded-2xl p-12 shadow-card">
            <Sparkles className="h-16 w-16 text-primary/40 mx-auto mb-6" />
            <h2 className="text-2xl font-baloo mb-4">{t.noWordsTitle}</h2>
            <p className="text-muted-foreground mb-8">
              {t.noWordsText}
            </p>
            <Button
              onClick={() => navigate("/stories")}
              className="btn-primary-kid"
            >
              {t.toStories}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #FFF7ED 0%, #FEF3C7 50%, #EFF6FF 100%)" }}>
      <PageHeader 
        title={t.title} 
        backTo="/stories"
        rightContent={
          currentQuestion && !quizComplete && (
            <>
              <span className="text-sm text-muted-foreground">
                {t.question} {questionIndex + 1} / {totalQuestions}
              </span>
              <div className={`bg-primary/20 rounded-full px-4 py-1 transition-transform ${scoreAnimation ? 'animate-bounce scale-125' : ''}`}>
                <span className="font-baloo font-bold text-primary">{score} {t.points}</span>
              </div>
            </>
          )
        }
      />

      <div className="container max-w-2xl p-4 md:p-8">
        {/* Kid Profile Selector */}
        {hasMultipleProfiles && !quizStarted && !quizComplete && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-2">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  ${selectedProfileId === profile.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                  {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm">{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quiz not started */}
        {!quizStarted && !quizComplete && (
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-card text-center">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 animate-sparkle" />
            <h2 className="text-3xl font-baloo mb-4">
              {t.readyToPlay}{selectedProfile ? `, ${selectedProfile.name}` : ''}?
            </h2>
            
            {/* Story selection */}
            <div className="my-6 flex flex-col items-center gap-4">
              <label className="text-lg font-medium">{t.chooseStory}</label>
              <Select 
                value={selectedStoryId} 
                onValueChange={setSelectedStoryId}
              >
                <SelectTrigger className="w-64 text-center text-lg">
                  <SelectValue placeholder={t.allStories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-lg">{t.allStories}</SelectItem>
                  {stories.map(story => (
                    <SelectItem key={story.id} value={story.id} className="text-base">
                      {story.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-primary/10 rounded-xl p-4 my-4">
              <p className="text-lg font-medium">
                {t.quizHasWords} <strong className="text-primary">{words.length}</strong> {t.words}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t.toPass} ({Math.ceil(words.length * 0.8)}/{words.length})
              </p>
            </div>

            <Button
              onClick={startQuiz}
              className="btn-primary-kid text-xl px-8 py-4 mt-4"
              disabled={words.length === 0}
            >
              {t.startQuiz}
            </Button>
          </div>
        )}

        {/* Quiz question */}
        {quizStarted && currentQuestion && !quizComplete && (
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-card">
            {isGeneratingQuiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">{t.nextQuestion}</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">{t.whatMeans}</p>
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
                        <p className="text-lg font-bold text-green-800">{t.correct}</p>
                      ) : (
                        <p className="text-lg font-bold text-red-800">
                          {t.notQuite}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={nextQuestion}
                      className="btn-primary-kid"
                    >
                      {questionIndex + 1 >= totalQuestions ? t.seeResult : t.nextQuestionBtn}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quiz complete */}
        {quizComplete && (
          <div className="space-y-4">
            <QuizCompletionResult
              correctCount={score}
              totalCount={totalQuestions}
              starsEarned={pointsEarned}
              appLanguage={kidAppLanguage}
              onContinue={() => navigate("/stories")}
            />

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
              <Button
                onClick={resetQuiz}
                className="btn-primary-kid flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                {t.newQuiz}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fablino Feedback Overlay */}
      {fablinoReaction && (
        <FablinoReaction
          type={fablinoReaction.type}
          message={fablinoReaction.message}
          stars={fablinoReaction.stars}
          autoClose={fablinoReaction.autoClose}
          buttonLabel={tGlobal.continueButton}
          onClose={() => setFablinoReaction(null)}
        />
      )}

      {/* Badge Celebration Modal – shows after Fablino reward is dismissed */}
      {pendingBadges.length > 0 && !fablinoReaction && (
        <BadgeCelebrationModal
          badges={pendingBadges}
          onDismiss={() => setPendingBadges([])}
          language={kidAppLanguage}
        />
      )}

      {/* Level Up Overlay – shows last, after badges are dismissed */}
      {pendingLevelUp && !fablinoReaction && pendingBadges.length === 0 && (
        <FablinoReaction
          type="levelUp"
          message={tGlobal.fablinoLevelUp.replace('{title}', pendingLevelUp.title)}
          levelEmoji={pendingLevelUp.icon}
          levelTitle={pendingLevelUp.title}
          buttonLabel={tGlobal.continueButton}
          onClose={clearPendingLevelUp}
        />
      )}
    </div>
  );
};

export default VocabularyQuizPage;
