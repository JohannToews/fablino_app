import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, CircleDot, ChevronRight, Keyboard } from "lucide-react";
import { toast } from "sonner";

// Localized labels for comprehension quiz
const quizLabels: Record<string, {
  speak: string;
  write: string;
  speakNow: string;
  tapToAnswer: string;
  yourAnswer: string;
  typeHere: string;
  thinking: string;
  checkAnswer: string;
  bravo: string;
  almost: string;
  notQuite: string;
  nextQuestion: string;
  finish: string;
  noQuestions: string;
  continue: string;
  noSpeechSupport: string;
  micPermission: string;
  sayAnswerFirst: string;
  evalError: string;
  noSpeechHeard: string;
  startError: string;
}> = {
  de: {
    speak: "Sprechen",
    write: "Schreiben",
    speakNow: "Sprich jetzt... (tippe zum Stoppen)",
    tapToAnswer: "Tippe zum Antworten",
    yourAnswer: "Deine Antwort:",
    typeHere: "Schreibe deine Antwort hier...",
    thinking: "Ich denke nach...",
    checkAnswer: "Antwort prüfen",
    bravo: "Bravo! 🎉",
    almost: "Fast! 👍",
    notQuite: "Nicht ganz 😊",
    nextQuestion: "Nächste Frage",
    finish: "Fertig",
    noQuestions: "Keine Fragen für diese Geschichte",
    continue: "Weiter",
    noSpeechSupport: "Dein Browser unterstützt keine Spracherkennung",
    micPermission: "Erlaube Mikrofon-Zugriff zum Sprechen",
    sayAnswerFirst: "Sag zuerst deine Antwort!",
    evalError: "Fehler bei der Auswertung",
    noSpeechHeard: "Ich habe nichts gehört. Versuch es nochmal!",
    startError: "Fehler beim Starten. Versuch es nochmal!",
  },
  fr: {
    speak: "Parler",
    write: "Écrire",
    speakNow: "Parle maintenant... (appuie pour arrêter)",
    tapToAnswer: "Appuie pour répondre",
    yourAnswer: "Ta réponse:",
    typeHere: "Écris ta réponse ici...",
    thinking: "Je réfléchis...",
    checkAnswer: "Vérifier ma réponse",
    bravo: "Bravo! 🎉",
    almost: "Presque! 👍",
    notQuite: "Pas tout à fait 😊",
    nextQuestion: "Question suivante",
    finish: "Terminer",
    noQuestions: "Pas de questions pour cette histoire",
    continue: "Continuer",
    noSpeechSupport: "Ton navigateur ne supporte pas la reconnaissance vocale",
    micPermission: "Autorise l'accès au microphone pour parler",
    sayAnswerFirst: "Dis ta réponse d'abord!",
    evalError: "Erreur lors de l'évaluation",
    noSpeechHeard: "Je n'ai rien entendu. Essaie encore!",
    startError: "Erreur lors du démarrage. Réessaie!",
  },
  en: {
    speak: "Speak",
    write: "Write",
    speakNow: "Speak now... (tap to stop)",
    tapToAnswer: "Tap to answer",
    yourAnswer: "Your answer:",
    typeHere: "Type your answer here...",
    thinking: "Thinking...",
    checkAnswer: "Check my answer",
    bravo: "Well done! 🎉",
    almost: "Almost! 👍",
    notQuite: "Not quite 😊",
    nextQuestion: "Next question",
    finish: "Finish",
    noQuestions: "No questions for this story",
    continue: "Continue",
    noSpeechSupport: "Your browser doesn't support speech recognition",
    micPermission: "Allow microphone access to speak",
    sayAnswerFirst: "Say your answer first!",
    evalError: "Error during evaluation",
    noSpeechHeard: "I didn't hear anything. Try again!",
    startError: "Error starting. Try again!",
  },
  es: {
    speak: "Hablar",
    write: "Escribir",
    speakNow: "Habla ahora... (toca para parar)",
    tapToAnswer: "Toca para responder",
    yourAnswer: "Tu respuesta:",
    typeHere: "Escribe tu respuesta aquí...",
    thinking: "Pensando...",
    checkAnswer: "Verificar mi respuesta",
    bravo: "¡Bravo! 🎉",
    almost: "¡Casi! 👍",
    notQuite: "No del todo 😊",
    nextQuestion: "Siguiente pregunta",
    finish: "Terminar",
    noQuestions: "No hay preguntas para esta historia",
    continue: "Continuar",
    noSpeechSupport: "Tu navegador no soporta reconocimiento de voz",
    micPermission: "Permite acceso al micrófono para hablar",
    sayAnswerFirst: "¡Di tu respuesta primero!",
    evalError: "Error en la evaluación",
    noSpeechHeard: "No escuché nada. ¡Intenta de nuevo!",
    startError: "Error al iniciar. ¡Intenta de nuevo!",
  },
  nl: {
    speak: "Spreken",
    write: "Schrijven",
    speakNow: "Spreek nu... (tik om te stoppen)",
    tapToAnswer: "Tik om te antwoorden",
    yourAnswer: "Jouw antwoord:",
    typeHere: "Typ je antwoord hier...",
    thinking: "Ik denk na...",
    checkAnswer: "Controleer mijn antwoord",
    bravo: "Goed gedaan! 🎉",
    almost: "Bijna! 👍",
    notQuite: "Niet helemaal 😊",
    nextQuestion: "Volgende vraag",
    finish: "Klaar",
    noQuestions: "Geen vragen voor dit verhaal",
    continue: "Doorgaan",
    noSpeechSupport: "Je browser ondersteunt geen spraakherkenning",
    micPermission: "Sta microfoontoegang toe om te spreken",
    sayAnswerFirst: "Zeg eerst je antwoord!",
    evalError: "Fout bij evaluatie",
    noSpeechHeard: "Ik hoorde niets. Probeer het opnieuw!",
    startError: "Fout bij starten. Probeer opnieuw!",
  },
  it: {
    speak: "Parlare",
    write: "Scrivere",
    speakNow: "Parla ora... (tocca per fermare)",
    tapToAnswer: "Tocca per rispondere",
    yourAnswer: "La tua risposta:",
    typeHere: "Scrivi la tua risposta qui...",
    thinking: "Sto pensando...",
    checkAnswer: "Verifica la mia risposta",
    bravo: "Bravo! 🎉",
    almost: "Quasi! 👍",
    notQuite: "Non proprio 😊",
    nextQuestion: "Prossima domanda",
    finish: "Fine",
    noQuestions: "Nessuna domanda per questa storia",
    continue: "Continua",
    noSpeechSupport: "Il tuo browser non supporta il riconoscimento vocale",
    micPermission: "Consenti l'accesso al microfono per parlare",
    sayAnswerFirst: "Di' prima la tua risposta!",
    evalError: "Errore nella valutazione",
    noSpeechHeard: "Non ho sentito niente. Riprova!",
    startError: "Errore all'avvio. Riprova!",
  },
  bs: {
    speak: "Govori",
    write: "Piši",
    speakNow: "Govori sada... (dodirni za zaustavljanje)",
    tapToAnswer: "Dodirni za odgovor",
    yourAnswer: "Tvoj odgovor:",
    typeHere: "Napiši svoj odgovor ovdje...",
    thinking: "Razmišljam...",
    checkAnswer: "Provjeri moj odgovor",
    bravo: "Bravo! 🎉",
    almost: "Skoro! 👍",
    notQuite: "Ne baš 😊",
    nextQuestion: "Sljedeće pitanje",
    finish: "Završi",
    noQuestions: "Nema pitanja za ovu priču",
    continue: "Nastavi",
    noSpeechSupport: "Tvoj pretraživač ne podržava prepoznavanje govora",
    micPermission: "Dozvoli pristup mikrofonu za govor",
    sayAnswerFirst: "Prvo reci svoj odgovor!",
    evalError: "Greška pri procjeni",
    noSpeechHeard: "Nisam ništa čuo/la. Pokušaj ponovo!",
    startError: "Greška pri pokretanju. Pokušaj ponovo!",
  },
};

// Map language code to speech recognition locale
const speechLocales: Record<string, string> = {
  de: "de-DE",
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  nl: "nl-NL",
  it: "it-IT",
  bs: "bs-BA",
};

interface Question {
  id: string;
  question: string;
  expected_answer: string;
  order_index: number;
}

interface QuizResult {
  questionId: string;
  result: "correct" | "partial" | "incorrect";
  feedback: string;
  childAnswer: string;
}

interface ComprehensionQuizProps {
  storyId: string;
  storyDifficulty?: string;
  storyLanguage?: string;
  onComplete: (correctCount: number, totalCount: number) => void;
}

const ComprehensionQuiz = ({ storyId, storyDifficulty = "medium", storyLanguage = "fr", onComplete }: ComprehensionQuizProps) => {
  const t = quizLabels[storyLanguage] || quizLabels.fr;
  const speechLocale = speechLocales[storyLanguage] || "fr-FR";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{ result: string; feedback: string } | null>(null);
  const [useTextInput, setUseTextInput] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  useEffect(() => {
    loadQuestions();
  }, [storyId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("comprehension_questions")
      .select("*")
      .eq("story_id", storyId)
      .order("order_index");
    
    if (data && data.length > 0) {
      setQuestions(data);
    } else {
      // No questions available
      setQuestions([]);
    }
    setIsLoading(false);
  };

  const startRecording = async () => {
    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error(t.noSpeechSupport);
      return;
    }

    // Request microphone permission explicitly for tablets/mobile
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone permission error:", err);
      toast.error(t.micPermission);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    shouldRestartRef.current = true;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setCurrentFeedback(null);
    createAndStartRecognition();
  };

  const createAndStartRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = speechLocale;
    recognition.continuous = false; // Use non-continuous for better reliability with auto-restart
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Append final results to accumulated transcript
      if (finalTranscript) {
        accumulatedTranscriptRef.current = accumulatedTranscriptRef.current 
          ? `${accumulatedTranscriptRef.current} ${finalTranscript}`.trim()
          : finalTranscript;
        setTranscript(accumulatedTranscriptRef.current);
      } else if (interimTranscript) {
        // Show accumulated + interim
        const display = accumulatedTranscriptRef.current 
          ? `${accumulatedTranscriptRef.current} ${interimTranscript}`.trim()
          : interimTranscript;
        setTranscript(display);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "no-speech") {
        // No speech detected - just restart silently if still recording
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current) {
              createAndStartRecognition();
            }
          }, 100);
        }
        return;
      }
      
      if (event.error === "aborted") {
        // Silently handle aborted - usually from manual stop
        return;
      }
      
      if (event.error === "not-allowed") {
        toast.error(t.micPermission);
      } else {
        toast.error(t.evalError);
      }
      
      shouldRestartRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Auto-restart if user hasn't stopped
      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current) {
            createAndStartRecognition();
          }
        }, 100);
      } else {
        setIsRecording(false);
        // Keep the accumulated transcript
        setTranscript(accumulatedTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;
    
    // Small delay for tablets to ensure audio context is ready
    setTimeout(() => {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast.error(t.startError);
        setIsRecording(false);
        shouldRestartRef.current = false;
      }
    }, 100);
  };

  const stopRecording = () => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    setIsRecording(false);
    // Keep the accumulated transcript for evaluation
    setTranscript(accumulatedTranscriptRef.current);
  };

  const evaluateAnswer = async (answerOverride?: string) => {
    const answerToEvaluate = answerOverride || transcript;
    
    if (!answerToEvaluate.trim()) {
      toast.error(t.sayAnswerFirst);
      return;
    }

    const currentQuestion = questions[currentIndex];
    setIsEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          question: currentQuestion.question,
          expectedAnswer: currentQuestion.expected_answer,
          childAnswer: answerToEvaluate,
          language: storyLanguage,
        },
      });

      if (error) {
        console.error("Evaluation error:", error);
        toast.error(t.evalError);
        setIsEvaluating(false);
        return;
      }

      const result: QuizResult = {
        questionId: currentQuestion.id,
        result: data.result,
        feedback: data.feedback,
        childAnswer: answerToEvaluate,
      };

      setResults([...results, result]);
      setCurrentFeedback({ result: data.result, feedback: data.feedback });
      setTranscript(answerToEvaluate);
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.evalError);
    }

    setIsEvaluating(false);
  };

  const goToNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript("");
      setTextAnswer("");
      setCurrentFeedback(null);
      accumulatedTranscriptRef.current = "";
    } else {
      // Quiz complete - count correct answers
      const correctCount = results.filter(r => r.result === "correct").length;
      // Include current feedback if it exists
      const finalCorrectCount = currentFeedback?.result === "correct" 
        ? correctCount + 1 
        : correctCount;
      
      onComplete(finalCorrectCount, questions.length);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "correct":
        return <CheckCircle2 className="h-8 w-8 text-mint" />;
      case "partial":
        return <CircleDot className="h-8 w-8 text-sunshine" />;
      default:
        return <XCircle className="h-8 w-8 text-cotton-candy" />;
    }
  };

  const getResultBg = (result: string) => {
    switch (result) {
      case "correct":
        return "bg-mint/20 border-mint";
      case "partial":
        return "bg-sunshine/20 border-sunshine";
      default:
        return "bg-cotton-candy/20 border-cotton-candy";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">{t.noQuestions}</p>
        <Button onClick={() => onComplete(0, 0)} className="btn-accent-kid mt-4">
          {t.continue}
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-primary/10 rounded-2xl p-6 text-center">
        <p className="text-xl md:text-2xl font-nunito font-medium">
          {currentQuestion.question}
        </p>
      </div>

      {/* Recording section */}
      {!currentFeedback && (
        <div className="flex flex-col items-center gap-4">
          {/* Toggle between voice and text input */}
          <div className="flex gap-2 mb-2">
            <Button
              variant={!useTextInput ? "default" : "outline"}
              size="sm"
              onClick={() => setUseTextInput(false)}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              {t.speak}
            </Button>
            <Button
              variant={useTextInput ? "default" : "outline"}
              size="sm"
              onClick={() => setUseTextInput(true)}
              className="flex items-center gap-2"
            >
              <Keyboard className="h-4 w-4" />
              {t.write}
            </Button>
          </div>

          {!useTextInput ? (
            <>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isEvaluating}
                className={`rounded-full h-20 w-20 ${
                  isRecording 
                    ? "bg-cotton-candy hover:bg-cotton-candy/80 animate-pulse" 
                    : "btn-primary-kid"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>
              <p className="text-muted-foreground text-sm">
                {isRecording ? t.speakNow : t.tapToAnswer}
              </p>

              {/* Transcript display */}
              {transcript && (
                <div className="w-full bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{t.yourAnswer}</p>
                  <p className="text-lg">{transcript}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-full space-y-3">
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={t.typeHere}
                  className="text-lg py-6"
                  disabled={isEvaluating}
                />
                {textAnswer && (
                  <div className="w-full bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">{t.yourAnswer}</p>
                    <p className="text-lg">{textAnswer}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Evaluate button */}
          {((transcript && !isRecording && !useTextInput) || (textAnswer && useTextInput)) && (
            <Button
              onClick={() => {
                if (useTextInput) {
                  evaluateAnswer(textAnswer);
                } else {
                  evaluateAnswer();
                }
              }}
              disabled={isEvaluating}
              className="btn-accent-kid flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.thinking}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {t.checkAnswer}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Feedback */}
      {currentFeedback && (
        <div className={`rounded-2xl p-6 border-2 ${getResultBg(currentFeedback.result)}`}>
          <div className="flex items-start gap-4">
            {getResultIcon(currentFeedback.result)}
            <div className="flex-1">
              <p className="text-lg font-medium mb-2">
                {currentFeedback.result === "correct" && t.bravo}
                {currentFeedback.result === "partial" && t.almost}
                {currentFeedback.result === "incorrect" && t.notQuite}
              </p>
              <p className="text-muted-foreground">{currentFeedback.feedback}</p>
            </div>
          </div>

          <Button
            onClick={goToNextQuestion}
            className="btn-primary-kid w-full mt-4 flex items-center justify-center gap-2"
          >
            {currentIndex < questions.length - 1 ? (
              <>
                {t.nextQuestion}
                <ChevronRight className="h-5 w-5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {t.finish}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComprehensionQuiz;
