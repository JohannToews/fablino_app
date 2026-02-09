import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";

interface StoryGenerationProgressProps {
  language: string;
}

// Cycling mascot images
const MASCOT_CYCLE = [
  "/mascot/3_wating_story_generated.png",
  "/mascot/6_Onboarding.png",
  "/mascot/5_new_story.png",
];

const SHOW_DURATION = 2500; // ms visible
const HIDE_DURATION = 800;  // ms hidden (transition)

const StoryGenerationProgress = ({ language }: StoryGenerationProgressProps) => {
  const [facts, setFacts] = useState<string[]>([]);
  const [shuffledFacts, setShuffledFacts] = useState<string[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [mascotIndex, setMascotIndex] = useState(0);

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
      // Shuffle for first round
      setShuffledFacts(shuffle(extracted));
    };
    loadFacts();
  }, [language]);

  // Shuffle helper
  const shuffle = useCallback((arr: string[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  // Cycle: show 2.5s → fade out → 0.8s hidden → next fact + mascot → fade in
  useEffect(() => {
    if (shuffledFacts.length === 0) return;

    const timer = setTimeout(() => {
      if (visible) {
        // Start hiding
        setVisible(false);
      } else {
        // Advance to next fact
        let nextIndex = factIndex + 1;
        if (nextIndex >= shuffledFacts.length) {
          // Reshuffle for new round
          setShuffledFacts(shuffle(facts));
          nextIndex = 0;
        }
        setFactIndex(nextIndex);
        setMascotIndex((prev) => (prev + 1) % MASCOT_CYCLE.length);
        setVisible(true);
      }
    }, visible ? SHOW_DURATION : HIDE_DURATION);

    return () => clearTimeout(timer);
  }, [visible, factIndex, shuffledFacts, facts, shuffle]);

  const currentFact = shuffledFacts[factIndex] || "";

  // Waiting title per language
  const title: Record<string, string> = {
    de: "Deine Geschichte wird erstellt...",
    fr: "Ton histoire est en cours de création...",
    en: "Your story is being created...",
    es: "Tu historia se está creando...",
    nl: "Je verhaal wordt gemaakt...",
    it: "La tua storia è in fase di creazione...",
    bs: "Tvoja priča se pravi...",
  };

  return (
    <div className="text-center space-y-8 p-6 max-w-sm mx-auto">
      {/* Title */}
      <h2 className="text-xl font-baloo font-bold text-foreground">
        {title[language] || title.de}
      </h2>

      {/* Fablino + Speech bubble */}
      <div
        className="flex items-center gap-3 justify-center transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <FablinoMascot
          src={MASCOT_CYCLE[mascotIndex]}
          size="md"
          bounce={visible}
        />
        {currentFact && (
          <SpeechBubble variant="hero">
            {currentFact}
          </SpeechBubble>
        )}
      </div>

      {/* Simple loading dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#E8863A] animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default StoryGenerationProgress;
