import { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, Pencil, Search, Palette, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryGenerationProgressProps {
  language: string;
}

interface ProgressStep {
  id: string;
  icon: React.ReactNode;
  label: Record<string, string>;
  duration: number; // ms to show this step
}

const progressSteps: ProgressStep[] = [
  {
    id: "writing",
    icon: <Pencil className="w-5 h-5" />,
    label: {
      de: "Geschichte wird geschrieben...",
      fr: "L'histoire est en cours d'écriture...",
      en: "Writing the story...",
    },
    duration: 8000,
  },
  {
    id: "checking",
    icon: <Search className="w-5 h-5" />,
    label: {
      de: "Qualitätsprüfung läuft...",
      fr: "Vérification de la qualité...",
      en: "Quality check in progress...",
    },
    duration: 6000,
  },
  {
    id: "images",
    icon: <Palette className="w-5 h-5" />,
    label: {
      de: "Bilder werden gemalt...",
      fr: "Les images sont en cours de création...",
      en: "Creating images...",
    },
    duration: 12000,
  },
  {
    id: "finishing",
    icon: <Sparkles className="w-5 h-5" />,
    label: {
      de: "Fast fertig...",
      fr: "Presque terminé...",
      en: "Almost done...",
    },
    duration: 60000, // Long duration - this step waits until actual completion
  },
];

const funFacts: Record<string, string[]> = {
  de: [
    "Wusstest du? Ein Oktopus hat drei Herzen! 🐙",
    "Wusstest du? Sterne funkeln, weil die Luft sie zum Tanzen bringt! ⭐",
    "Wusstest du? Elefanten können nicht springen! 🐘",
    "Wusstest du? Ein Regenbogen ist eigentlich ein Kreis! 🌈",
    "Wusstest du? Delfine schlafen mit einem Auge offen! 🐬",
    "Wusstest du? Der Eiffelturm wächst im Sommer! 🗼",
    "Wusstest du? Hunde träumen auch von Abenteuern! 🐕",
    "Wusstest du? Honig wird niemals schlecht! 🍯",
  ],
  fr: [
    "Le savais-tu ? Une pieuvre a trois cœurs ! 🐙",
    "Le savais-tu ? Les étoiles scintillent parce que l'air les fait danser ! ⭐",
    "Le savais-tu ? Les éléphants ne peuvent pas sauter ! 🐘",
    "Le savais-tu ? Un arc-en-ciel est en fait un cercle ! 🌈",
    "Le savais-tu ? Les dauphins dorment avec un œil ouvert ! 🐬",
    "Le savais-tu ? La tour Eiffel grandit en été ! 🗼",
    "Le savais-tu ? Les chiens rêvent aussi d'aventures ! 🐕",
    "Le savais-tu ? Le miel ne se périme jamais ! 🍯",
  ],
  en: [
    "Did you know? An octopus has three hearts! 🐙",
    "Did you know? Stars twinkle because the air makes them dance! ⭐",
    "Did you know? Elephants can't jump! 🐘",
    "Did you know? A rainbow is actually a circle! 🌈",
    "Did you know? Dolphins sleep with one eye open! 🐬",
    "Did you know? The Eiffel Tower grows in summer! 🗼",
    "Did you know? Dogs dream about adventures too! 🐕",
    "Did you know? Honey never goes bad! 🍯",
  ],
};

const StoryGenerationProgress = ({ language }: StoryGenerationProgressProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentFact, setCurrentFact] = useState(0);

  const facts = funFacts[language] || funFacts.de;

  // Progress through steps with timing
  useEffect(() => {
    if (currentStepIndex >= progressSteps.length - 1) return;

    const currentStep = progressSteps[currentStepIndex];
    const timer = setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      setCurrentStepIndex(prev => prev + 1);
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  // Rotate fun facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % facts.length);
    }, 5000);

    return () => clearInterval(factInterval);
  }, [facts.length]);

  return (
    <div className="text-center space-y-8 p-8 max-w-md mx-auto">
      {/* Main animation - Book icon */}
      <div className="relative">
        <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        {/* Sparkles around */}
        <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
        <Sparkles className="absolute bottom-0 left-1/4 w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: "1s" }} />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-baloo font-bold text-foreground">
        {language === "de" ? "Deine Geschichte wird erstellt..." :
         language === "fr" ? "Ton histoire est en cours de création..." :
         "Your story is being created..."}
      </h2>

      {/* Progress steps */}
      <div className="space-y-3">
        {progressSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500",
                isCompleted && "bg-green-100 dark:bg-green-900/30",
                isCurrent && "bg-primary/10 scale-105",
                isPending && "opacity-40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isCompleted && "bg-green-500 text-white",
                isCurrent && "bg-primary text-primary-foreground",
                isPending && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              <span className={cn(
                "text-sm font-medium transition-all",
                isCompleted && "text-green-700 dark:text-green-300",
                isCurrent && "text-foreground font-semibold",
                isPending && "text-muted-foreground"
              )}>
                {step.label[language] || step.label.de}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fun fact */}
      <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border/50">
        <p className="text-sm text-muted-foreground animate-fade-in" key={currentFact}>
          {facts[currentFact]}
        </p>
      </div>
    </div>
  );
};

export default StoryGenerationProgress;
