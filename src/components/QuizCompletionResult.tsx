import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizCompletionResultProps {
  correctCount: number;
  totalCount: number;
  appLanguage: string;
  onContinue: () => void;
}

// Translations for quiz completion
const quizResultLabels: Record<string, {
  passed: string;
  failed: string;
  passedMessage: string;
  failedMessage: string;
  continue: string;
}> = {
  de: {
    passed: "Geschichte erfolgreich abgeschlossen! ✅",
    failed: "Geschichte nicht bestanden",
    passedMessage: "Super! Du hast die Geschichte gemeistert!",
    failedMessage: "Du musst mindestens 50% der Fragen richtig beantworten.",
    continue: "Weiter",
  },
  fr: {
    passed: "Histoire réussie! ✅",
    failed: "Histoire non réussie",
    passedMessage: "Super! Tu as maîtrisé cette histoire!",
    failedMessage: "Tu dois répondre correctement à au moins 50% des questions.",
    continue: "Continuer",
  },
  en: {
    passed: "Story completed successfully! ✅",
    failed: "Story not passed",
    passedMessage: "Great! You have mastered this story!",
    failedMessage: "You need to answer at least 50% of the questions correctly.",
    continue: "Continue",
  },
  es: {
    passed: "¡Historia completada con éxito! ✅",
    failed: "Historia no aprobada",
    passedMessage: "¡Genial! ¡Has dominado esta historia!",
    failedMessage: "Debes responder correctamente al menos el 50% de las preguntas.",
    continue: "Continuar",
  },
  nl: {
    passed: "Verhaal succesvol afgerond! ✅",
    failed: "Verhaal niet gehaald",
    passedMessage: "Super! Je hebt dit verhaal onder de knie!",
    failedMessage: "Je moet minstens 50% van de vragen goed beantwoorden.",
    continue: "Doorgaan",
  },
};

const QuizCompletionResult = ({ 
  correctCount, 
  totalCount, 
  appLanguage, 
  onContinue 
}: QuizCompletionResultProps) => {
  const isPassed = totalCount === 0 || (correctCount / totalCount) >= 0.5;
  const labels = quizResultLabels[appLanguage] || quizResultLabels.fr;

  return (
    <div className={`rounded-2xl p-8 text-center ${isPassed ? "bg-mint/30 border-2 border-green-500" : "bg-cotton-candy/30 border-2 border-red-400"}`}>
      {isPassed ? (
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
      ) : (
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      )}
      
      <h2 className="text-2xl md:text-3xl font-baloo font-bold mb-2">
        {isPassed ? labels.passed : labels.failed}
      </h2>
      
      <p className="text-xl font-bold mb-2">
        {correctCount} / {totalCount}
      </p>
      
      <p className="text-muted-foreground mb-6">
        {isPassed ? labels.passedMessage : labels.failedMessage}
      </p>
      
      <Button onClick={onContinue} className="btn-primary-kid">
        {labels.continue}
      </Button>
    </div>
  );
};

export default QuizCompletionResult;
