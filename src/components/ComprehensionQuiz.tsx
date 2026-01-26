import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, CheckCircle2, XCircle, CircleDot, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  onComplete: (correctCount: number, totalCount: number) => void;
}

const ComprehensionQuiz = ({ storyId, storyDifficulty = "medium", onComplete }: ComprehensionQuizProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{ result: string; feedback: string } | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      // No questions available
      setQuestions([]);
    }
    setIsLoading(false);
  };

  const startRecording = async () => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Ton navigateur ne supporte pas la reconnaissance vocale");
      return;
    }

    // Request microphone permission explicitly for tablets/mobile
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone permission error:", err);
      toast.error("Autorise l'accès au microphone pour parler");
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

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
      setTranscript("");
      setCurrentFeedback(null);
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

      console.log("Speech result:", finalTranscript || interimTranscript);
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "no-speech") {
        toast.error("Je n'ai rien entendu. Essaie encore!");
      } else if (event.error === "not-allowed") {
        toast.error("Autorise l'accès au microphone pour parler");
      } else if (event.error === "aborted") {
        // Silently handle aborted - usually from stopping
      } else {
        toast.error("Erreur de reconnaissance vocale");
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    
    // Small delay for tablets to ensure audio context is ready
    setTimeout(() => {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast.error("Erreur lors du démarrage. Réessaie!");
        setIsRecording(false);
      }
    }, 100);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  };

  const evaluateAnswer = async () => {
    if (!transcript.trim()) {
      toast.error("Dis ta réponse d'abord!");
      return;
    }

    const currentQuestion = questions[currentIndex];
    setIsEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          question: currentQuestion.question,
          expectedAnswer: currentQuestion.expected_answer,
          childAnswer: transcript,
        },
      });

      if (error) {
        console.error("Evaluation error:", error);
        toast.error("Erreur lors de l'évaluation");
        setIsEvaluating(false);
        return;
      }

      const result: QuizResult = {
        questionId: currentQuestion.id,
        result: data.result,
        feedback: data.feedback,
        childAnswer: transcript,
      };

      setResults([...results, result]);
      setCurrentFeedback({ result: data.result, feedback: data.feedback });
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erreur lors de l'évaluation");
    }

    setIsEvaluating(false);
  };

  const goToNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTranscript("");
      setCurrentFeedback(null);
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
        <p className="text-muted-foreground">Pas de questions pour cette histoire</p>
        <Button onClick={() => onComplete(0, 0)} className="btn-accent-kid mt-4">
          Continuer
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
            {isRecording ? "Parle maintenant... (appuie pour arrêter)" : "Appuie pour répondre"}
          </p>

          {/* Transcript display */}
          {transcript && (
            <div className="w-full bg-card rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Ta réponse:</p>
              <p className="text-lg">{transcript}</p>
            </div>
          )}

          {/* Evaluate button */}
          {transcript && !isRecording && (
            <Button
              onClick={evaluateAnswer}
              disabled={isEvaluating}
              className="btn-accent-kid flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Je réfléchis...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Vérifier ma réponse
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
                {currentFeedback.result === "correct" && "Bravo! 🎉"}
                {currentFeedback.result === "partial" && "Presque! 👍"}
                {currentFeedback.result === "incorrect" && "Pas tout à fait 😊"}
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
                Question suivante
                <ChevronRight className="h-5 w-5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Terminer
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComprehensionQuiz;
