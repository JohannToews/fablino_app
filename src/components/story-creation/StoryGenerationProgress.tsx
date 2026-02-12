import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Sparkles, Pencil, Search, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";

export interface PerformanceData {
  story_generation_ms: number;
  image_generation_ms: number;
  consistency_check_ms: number;
  total_ms: number;
}

interface StoryGenerationProgressProps {
  language: string;
  isAdmin?: boolean;
  performanceData?: PerformanceData | null;
}

interface ProgressStep {
  id: string;
  icon: React.ReactNode;
  label: Record<string, string>;
  duration: number;
}

const progressSteps: ProgressStep[] = [
  {
    id: "writing",
    icon: <Pencil className="w-5 h-5" />,
    label: {
      de: "Geschichte wird geschrieben...",
      fr: "L'histoire est en cours d'écriture...",
      en: "Writing the story...",
      es: "Escribiendo la historia...",
      nl: "Het verhaal wordt geschreven...",
      it: "La storia è in fase di scrittura...",
      bs: "Priča se piše...",
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
      es: "Control de calidad...",
      nl: "Kwaliteitscontrole...",
      it: "Controllo qualità...",
      bs: "Provjera kvaliteta...",
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
      es: "Creando imágenes...",
      nl: "Afbeeldingen worden gemaakt...",
      it: "Creazione immagini...",
      bs: "Slike se crtaju...",
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
      es: "Casi listo...",
      nl: "Bijna klaar...",
      it: "Quasi pronto...",
      bs: "Skoro gotovo...",
    },
    duration: 60000,
  },
];

const MASCOT_CYCLE = [
  "/mascot/3_wating_story_generated.png",
  "/mascot/6_Onboarding.png",
  "/mascot/5_new_story.png",
];

const DID_YOU_KNOW: Record<string, string> = {
  de: "Wusstest du, dass",
  fr: "Savais-tu que",
  en: "Did you know that",
  es: "¿Sabías que",
  nl: "Wist je dat",
  it: "Lo sapevi che",
  bs: "Jesi li znao/la da",
};

const SHOW_DURATION = 4500;
const HIDE_DURATION = 800;

const shuffle = (arr: string[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const StoryGenerationProgress = ({ language, isAdmin, performanceData }: StoryGenerationProgressProps) => {
  // Progress steps state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Fun facts state
  const [facts, setFacts] = useState<string[]>([]);
  const [shuffledFacts, setShuffledFacts] = useState<string[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mascotIndex, setMascotIndex] = useState(0);

  // Progress step timing
  useEffect(() => {
    if (currentStepIndex >= progressSteps.length - 1) return;
    const currentStep = progressSteps[currentStepIndex];
    const timer = setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, currentStep.id]));
      setCurrentStepIndex((prev) => prev + 1);
    }, currentStep.duration);
    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  // Load fun facts from DB
  useEffect(() => {
    const loadFacts = async () => {
      const { data, error } = await supabase
        .from("fun_facts")
        .select("translations, emoji");
      if (error || !data?.length) return;

      const lang = language || "de";
      const extracted = data
        .map((row) => {
          const translations = row.translations as Record<string, string>;
          const text = translations?.[lang] || translations?.de || translations?.en;
          return text ? `${text} ${row.emoji}` : null;
        })
        .filter(Boolean) as string[];

      setFacts(extracted);
      setShuffledFacts(shuffle(extracted));
    };
    loadFacts();
  }, [language]);

  // Cycle: show 3.5s → fade out 0.8s → next
  useEffect(() => {
    if (shuffledFacts.length === 0) return;
    const timer = setTimeout(() => {
      if (visible) {
        setVisible(false);
      } else {
        let nextIndex = factIndex + 1;
        if (nextIndex >= shuffledFacts.length) {
          setShuffledFacts(shuffle(facts));
          nextIndex = 0;
        }
        setFactIndex(nextIndex);
        setMascotIndex((prev) => (prev + 1) % MASCOT_CYCLE.length);
        setVisible(true);
      }
    }, visible ? SHOW_DURATION : HIDE_DURATION);
    return () => clearTimeout(timer);
  }, [visible, factIndex, shuffledFacts, facts]);

  const prefix = DID_YOU_KNOW[language] || DID_YOU_KNOW.de;
  const currentFact = shuffledFacts[factIndex] || "";

  return (
    <div className="text-center space-y-6 p-6 max-w-md mx-auto">
      {/* Fablino + Speech bubble on top */}
      <div
        className="flex items-center gap-3 justify-center transition-opacity duration-500 min-h-[120px]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <FablinoMascot
          src={MASCOT_CYCLE[mascotIndex]}
          size="md"
          bounce={visible}
        />
        {currentFact && (
          <SpeechBubble variant="hero">
            {prefix} {currentFact}
          </SpeechBubble>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl font-baloo font-bold text-foreground">
        {progressSteps[currentStepIndex]?.label[language] ||
          progressSteps[currentStepIndex]?.label.de ||
          "..."}
      </h2>

      {/* Progress steps */}
      <div className="space-y-2">
        {progressSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500",
                isCompleted && "bg-orange-100 dark:bg-orange-900/30",
                isCurrent && "bg-orange-50 scale-[1.03]",
                isPending && "opacity-40"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-orange-500 text-white",
                  isCurrent && "bg-orange-400 text-white",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-all",
                  isCompleted && "text-orange-700 dark:text-orange-300",
                  isCurrent && "text-foreground font-semibold",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label[language] || step.label.de}
              </span>
            </div>
          );
        })}
      </div>
      {/* Admin Performance Breakdown */}
      {isAdmin && performanceData && (
        <div className="mt-4 p-3 rounded-xl bg-muted/60 border border-border/50 text-xs font-mono text-muted-foreground">
          <span>⏱️ Story: {(performanceData.story_generation_ms / 1000).toFixed(1)}s</span>
          <span className="mx-1.5">|</span>
          <span>🖼️ Bilder: {(performanceData.image_generation_ms / 1000).toFixed(1)}s</span>
          <span className="mx-1.5">|</span>
          <span>✅ Check: {(performanceData.consistency_check_ms / 1000).toFixed(1)}s</span>
          <span className="mx-1.5">|</span>
          <span className="font-semibold text-foreground">Gesamt: {(performanceData.total_ms / 1000).toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
};

export default StoryGenerationProgress;
