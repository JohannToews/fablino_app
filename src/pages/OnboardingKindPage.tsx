import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

const STORY_TYPES = [
  { key: "adventure", emoji: "🏰", label: "Abenteuer", description: "Mutige Helden & spannende Quests" },
  { key: "fantasy", emoji: "🧚", label: "Märchen & Magie", description: "Zauber, Feen & Wunderwelten" },
  { key: "animals", emoji: "🐾", label: "Tiergeschichte", description: "Niedliche Tiere & ihre Freundschaften" },
];

const AGES = [6, 7, 8, 9, 10];

type Step = "profile" | "storyType";

const OnboardingKindPage = () => {
  const [step, setStep] = useState<Step>("profile");
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [readingLang, setReadingLang] = useState<string | null>(null);
  const [selectedStoryType, setSelectedStoryType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Guard: not logged in → /welcome
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated]);

  // Guard: already has kid profiles → /
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: kids } = await supabase
        .from("kid_profiles")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (kids && kids.length > 0) {
        navigate("/", { replace: true });
      }
    })();
  }, [user]);

  const handleProfileNext = () => {
    if (!name.trim()) {
      toast({ title: "Fehler", description: "Bitte einen Namen eingeben.", variant: "destructive" });
      return;
    }
    if (!selectedAge) {
      toast({ title: "Fehler", description: "Bitte ein Alter auswählen.", variant: "destructive" });
      return;
    }
    if (!readingLang) {
      toast({ title: "Fehler", description: "Bitte eine Lesesprache auswählen.", variant: "destructive" });
      return;
    }
    setStep("storyType");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!selectedStoryType) {
      toast({ title: "Fehler", description: "Bitte eine Geschichte wählen.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const schoolSystem = readingLang!;
      const age = selectedAge!;

      const { data: savedProfile, error } = await supabase
        .from("kid_profiles")
        .insert({
          user_id: user.id,
          name: name.trim().slice(0, 30),
          age,
          reading_language: readingLang!,
          home_languages: [readingLang!],
          ui_language: readingLang!,
          school_system: schoolSystem,
          school_class: getSchoolClass(age),
          difficulty_level: getDifficultyLevel(age),
          content_safety_level: 2,
          color_palette: "warm",
          hobbies: "",
          story_languages: [readingLang!],
          explanation_language: "de",
        })
        .select()
        .single();

      if (error || !savedProfile) {
        console.error("Kid profile save error:", error);
        toast({ title: "Fehler", description: "Profil konnte nicht gespeichert werden.", variant: "destructive" });
        return;
      }

      navigate(`/onboarding/story?kid=${savedProfile.id}&storyType=${selectedStoryType}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Ein Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#E8863A" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 overflow-y-auto" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
      {/* Header */}
      <div className="flex flex-col items-center mb-6 w-full max-w-md">
        <img
          src="/mascot/6_Onboarding.png"
          alt="Fablino"
          className="h-24 w-auto drop-shadow-md"
          style={{ animation: "gentleBounce 2.5s ease-in-out infinite" }}
        />
        <h1 className="text-2xl font-bold mt-3 text-center" style={{ color: "#E8863A" }}>
          {step === "profile" ? "Wer liest mit Fablino? 🦊" : "Was für eine Geschichte? 📖"}
        </h1>
        <p className="text-sm mt-1 text-center" style={{ color: "rgba(45,24,16,0.6)" }}>
          {step === "profile" ? "Erstelle ein Profil für dein Kind" : `Eine Geschichte für ${name} ✨`}
        </p>
      </div>

      {/* === STEP 1: Profile === */}
      {step === "profile" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg px-6 py-7 space-y-6">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Name des Kindes</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              placeholder="Vorname..."
              className="h-12 rounded-xl border-2 text-base"
              style={{ borderColor: "rgba(232,134,58,0.3)" }}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Alter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Alter</Label>
            <div className="flex gap-3">
              {AGES.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setSelectedAge(age)}
                  className="flex-1 h-14 rounded-xl text-base font-bold transition-all border-2"
                  style={{
                    background: selectedAge === age ? "#E8863A" : "transparent",
                    color: selectedAge === age ? "white" : "rgba(45,24,16,0.7)",
                    borderColor: selectedAge === age ? "#E8863A" : "rgba(232,134,58,0.25)",
                  }}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Lesesprache */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Lesesprache 📚</Label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setReadingLang(lang.code)}
                  className="flex items-center gap-2.5 py-3 px-4 rounded-xl border-2 transition-all"
                  style={{
                    background: readingLang === lang.code ? "#E8863A" : "transparent",
                    color: readingLang === lang.code ? "white" : "rgba(45,24,16,0.75)",
                    borderColor: readingLang === lang.code ? "#E8863A" : "rgba(232,134,58,0.25)",
                  }}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-semibold">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleProfileNext}
            className="w-full font-semibold rounded-2xl text-white shadow-md"
            style={{ backgroundColor: "#E8863A", height: "52px", fontSize: "1rem" }}
          >
            Weiter →
          </Button>
        </div>
      )}

      {/* === STEP 2: Story Type === */}
      {step === "storyType" && (
        <div className="w-full max-w-md space-y-4">
          {STORY_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setSelectedStoryType(type.key)}
              className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 text-left transition-all shadow-sm"
              style={{
                background: selectedStoryType === type.key ? "#FFF3E8" : "white",
                borderColor: selectedStoryType === type.key ? "#E8863A" : "rgba(232,134,58,0.2)",
                transform: selectedStoryType === type.key ? "scale(1.02)" : "scale(1)",
              }}
            >
              <span className="text-5xl flex-shrink-0">{type.emoji}</span>
              <div>
                <p className="text-base font-bold" style={{ color: "rgba(45,24,16,0.9)" }}>{type.label}</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(45,24,16,0.5)" }}>{type.description}</p>
              </div>
              {selectedStoryType === type.key && (
                <span className="ml-auto text-xl flex-shrink-0">✅</span>
              )}
            </button>
          ))}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedStoryType}
            className="w-full font-bold rounded-2xl text-white shadow-lg mt-2"
            style={{
              backgroundColor: selectedStoryType ? "#E8863A" : "rgba(232,134,58,0.4)",
              height: "56px",
              fontSize: "1.05rem",
            }}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Los geht's! 🦊"
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep("profile")}
            className="w-full text-sm text-center mt-1 py-2"
            style={{ color: "rgba(45,24,16,0.4)" }}
          >
            ← Zurück
          </button>
        </div>
      )}

      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

function getSchoolClass(age: number): string {
  if (age <= 6) return "1";
  if (age <= 7) return "2";
  if (age <= 8) return "3";
  if (age <= 9) return "4";
  return "5";
}

function getDifficultyLevel(age: number): number {
  if (age <= 6) return 1;
  if (age <= 8) return 2;
  if (age <= 10) return 3;
  return 4;
}

export default OnboardingKindPage;
