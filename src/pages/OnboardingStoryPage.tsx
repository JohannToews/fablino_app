import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, RefreshCw } from "lucide-react";
import FablinoMascot from "@/components/FablinoMascot";
import SpeechBubble from "@/components/SpeechBubble";
import confetti from "canvas-confetti";

// Subtype-specific themes for onboarding
const SUBTYPE_THEMES: Record<string, Record<string, string>> = {
  adventure: {
    heroes: "Superhelden, geheime Kräfte, einen Bösewicht besiegen",
    detective: "Geheimnisse lösen, versteckte Hinweise, ein mysteriöser Fall",
    space: "Weltraumreise, fremde Planeten, unbekannte Welten entdecken",
  },
  animals: {
    forest: "Waldtiere erleben ein Abenteuer",
    pets: "Haustiere auf einem besonderen Ausflug",
    safari: "Wildtiere in der Savanne",
  },
  fantasy: {
    magic: "Magische Kräfte und Zauberwelten",
    dragons: "Freundliche Drachen und Abenteuer",
    fairy: "Feen, Elfen und verzauberte Wälder",
  },
};

// Fallback theme per story type and age (only if no subtype)
const getThemeForStoryType = (storyType: string, age: number, subtype?: string, detail?: string): string => {
  // If user provided custom detail, use it as primary theme
  if (detail) return detail;
  
  // If subtype exists, use subtype-specific theme
  if (subtype && SUBTYPE_THEMES[storyType]?.[subtype]) {
    return SUBTYPE_THEMES[storyType][subtype];
  }

  if (storyType === "adventure") {
    if (age <= 7) return "Ein mutiger kleiner Held rettet ein magisches Dorf";
    if (age <= 9) return "Ein Abenteuer mit einer geheimnisvollen Schatzkarte";
    return "Ein episches Abenteuer in einem fernen Königreich";
  }
  if (storyType === "animals") {
    if (age <= 7) return "Ein niedlicher Fuchs und seine Waldfreunde";
    if (age <= 9) return "Ein sprechendes Tier löst ein großes Rätsel im Wald";
    return "Eine Tierexpedition durch den Dschungel";
  }
  // fantasy (default)
  if (age <= 7) return "Ein magisches Tier im Wald";
  if (age <= 9) return "Ein Abenteuer mit einem freundlichen Drachen";
  return "Eine geheimnisvolle Begegnung mit einer Fee";
};

// Default image style per age
const getDefaultImageStyle = (age: number): string => {
  if (age <= 6) return "storybook_soft";
  if (age <= 8) return "storybook_vibrant";
  if (age <= 10) return "adventure_cartoon";
  return "graphic_novel";
};

const PROGRESS_TEXTS = [
  "Fablino denkt sich eine Geschichte aus... 🦊",
  "Die Charaktere werden lebendig... 🌟",
  "Fablino malt die Bilder... 🎨",
  "Fast fertig! 🎉",
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

type Status = "generating" | "done" | "error";

const OnboardingStoryPage = () => {
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get("kid");
  const storyTypeParam = searchParams.get("storyType");
  const subtypeParam = searchParams.get("subtype");
  const storyLangParam = searchParams.get("lang");
  const detailParam = searchParams.get("detail");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [status, setStatus] = useState<Status>("generating");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [kidName, setKidName] = useState<string>("");
  const [progressTextIdx, setProgressTextIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const hasStarted = useRef(false);

  // Fun facts from DB (same as StoryGenerationProgress)
  const [facts, setFacts] = useState<string[]>([]);
  const [shuffledFacts, setShuffledFacts] = useState<string[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [mascotIndex, setMascotIndex] = useState(0);

  // Guard: not logged in → /welcome
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated]);

   // Guard: no kidId → /onboarding/child
  useEffect(() => {
    if (!authLoading && !kidId) {
      navigate("/onboarding/child", { replace: true });
    }
  }, [authLoading, kidId]);

  // Progress text cycle
  useEffect(() => {
    if (status !== "generating") return;
    const intervals = [5000, 10000, 10000];
    const timers: NodeJS.Timeout[] = [];
    intervals.forEach((delay, i) => {
      const t = setTimeout(() => setProgressTextIdx(i + 1), intervals.slice(0, i + 1).reduce((a, b) => a + b, 0));
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [status]);

  // Dots animation
  useEffect(() => {
    if (status !== "generating") return;
    const timer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(timer);
  }, [status]);

  // Load fun facts from DB
  useEffect(() => {
    const loadFacts = async () => {
      const lang = storyLangParam || "de";
      const { data, error } = await supabase
        .from("fun_facts")
        .select("translations, emoji");
      if (error || !data?.length) return;

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
  }, [storyLangParam]);

  // Fun fact cycling (same as StoryGenerationProgress)
  useEffect(() => {
    if (shuffledFacts.length === 0 || status !== "generating") return;
    const timer = setTimeout(() => {
      if (factVisible) {
        setFactVisible(false);
      } else {
        let nextIndex = factIndex + 1;
        if (nextIndex >= shuffledFacts.length) {
          setShuffledFacts(shuffle(facts));
          nextIndex = 0;
        }
        setFactIndex(nextIndex);
        setMascotIndex((prev) => (prev + 1) % MASCOT_CYCLE.length);
        setFactVisible(true);
      }
    }, factVisible ? SHOW_DURATION : HIDE_DURATION);
    return () => clearTimeout(timer);
  }, [factVisible, factIndex, shuffledFacts, facts, status]);

  // Load kid profile and start generation
  useEffect(() => {
    if (!kidId || !user || hasStarted.current) return;
    hasStarted.current = true;
    generateFirstStory();
  }, [kidId, user]);

  const generateFirstStory = async () => {
    if (!kidId || !user) return;

    // Load kid profile
    const { data: kid, error: kidError } = await supabase
      .from("kid_profiles")
      .select("*")
      .eq("id", kidId)
      .single();

    if (kidError || !kid) {
      console.error("Kid profile not found:", kidError);
      setStatus("error");
      return;
    }

    setKidName(kid.name || "");

    const age = kid.age || 8;
    const resolvedStoryType = storyTypeParam || "fantasy";
    const theme = getThemeForStoryType(resolvedStoryType, age, subtypeParam || undefined, detailParam || undefined);
    const imageStyle = getDefaultImageStyle(age);
    const readingLang = storyLangParam || kid.reading_language || kid.school_system || "fr";
    const difficulty = getDifficultyForAge(age);

    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length: "short",
          difficulty,
          description: theme,
          textType: "fiction",
          textLanguage: readingLang.toUpperCase(),
          globalLanguage: readingLang,
          userId: user.id,
          source: "onboarding",
          isSeries: false,
          storyType: resolvedStoryType,
          kidName: kid.name,
          kidHobbies: kid.hobbies || "",
          storyLanguage: readingLang,
          kidProfileId: kidId,
          kidAge: age,
          difficultyLevel: kid.difficulty_level || 2,
          contentSafetyLevel: kid.content_safety_level || 2,
          image_style_key: imageStyle,
          story_length: "short",
        },
      });

      if (error || data?.error) {
        console.error("Generation error:", error || data?.error);
        setStatus("error");
        return;
      }

      if (!data?.title || !data?.content) {
        setStatus("error");
        return;
      }

      // Resolve cover image
      let coverImageUrl: string | null = null;
      if (data.coverImageBase64) {
        if (data.coverImageBase64.startsWith("http")) {
          coverImageUrl = data.coverImageBase64;
        } else {
          try {
            let b64 = data.coverImageBase64;
            if (b64.includes(",")) b64 = b64.split(",")[1];
            b64 = b64.replace(/\s/g, "");
            const imageData = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const fileName = `cover-onboarding-${Date.now()}.png`;
            const { error: upErr } = await supabase.storage.from("covers").upload(fileName, imageData, { contentType: "image/png" });
            if (!upErr) {
              const { data: urlData } = supabase.storage.from("covers").getPublicUrl(fileName);
              coverImageUrl = urlData.publicUrl;
            }
          } catch {
            // ignore image upload error — story still works
          }
        }
      }

      // Resolve scene images
      let storyImageUrls: string[] | null = null;
      if (data.storyImages && Array.isArray(data.storyImages) && data.storyImages.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < data.storyImages.length; i++) {
          const img = data.storyImages[i];
          if (img?.startsWith("http")) {
            urls.push(img);
          }
        }
        if (urls.length > 0) storyImageUrls = urls;
      }

      // Save story
      const { data: saved, error: saveErr } = await supabase
        .from("stories")
        .insert({
          title: data.title,
          content: data.content,
          cover_image_url: coverImageUrl,
          cover_image_status: coverImageUrl ? "complete" : "pending",
          story_images: storyImageUrls,
          story_images_status: storyImageUrls ? "complete" : "pending",
          image_count: data.image_count || 1,
          difficulty,
          text_type: "fiction",
          text_language: readingLang,
          prompt: theme,
          user_id: user.id,
          kid_profile_id: kidId,
          generation_status: "verified",
          ending_type: "A",
          story_length: "short",
          image_style_key: imageStyle,
          emotional_coloring: data.emotional_coloring ?? null,
          learning_theme_applied: data.learning_theme_applied ?? null,
          generation_time_ms: data.performance?.total_ms ?? null,
        })
        .select()
        .single();

      if (saveErr || !saved) {
        console.error("Save error:", saveErr);
        setStatus("error");
        return;
      }

      // Save comprehension questions
      if (data.questions?.length > 0) {
        const qs = data.questions.map((q: any, idx: number) => ({
          story_id: saved.id,
          question: q.question,
          expected_answer: q.correctAnswer || q.expectedAnswer || "",
          options: q.options || [],
          order_index: idx,
          question_language: readingLang,
        }));
        await supabase.from("comprehension_questions").insert(qs);
      }

      setStoryId(saved.id);
      setStatus("done");

      // 🎉 Confetti!
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#E8863A", "#FFC87A", "#FF6B35", "#FFE4B5"] });
    } catch (err) {
      console.error("Unexpected error:", err);
      setStatus("error");
    }
  };

  const handleReadStory = () => {
    if (storyId) {
      // Replace current history with home so browser-back goes to "/" not onboarding
      window.history.replaceState(null, "", "/");
      navigate(`/read/${storyId}`);
    }
  };

  const handleRetry = () => {
    hasStarted.current = false;
    setStatus("generating");
    setProgressTextIdx(0);
    setStoryId(null);
    generateFirstStory();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#E8863A" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFECD2 100%)" }}>
      {/* Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 rounded-full" style={{ background: "#E8863A" }} />
          <div className="flex-1 h-2 rounded-full" style={{ background: status === "done" ? "#E8863A" : "rgba(232,134,58,0.2)" }} />
        </div>
        <p className="text-xs text-center" style={{ color: "rgba(45,24,16,0.5)" }}>Schritt 2 von 2</p>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Mascot + Fun fact speech bubble */}
        {status === "generating" && (
          <div
            className="flex items-center gap-3 justify-center mb-4 min-h-[120px] transition-opacity duration-500"
            style={{ opacity: factVisible ? 1 : 0 }}
          >
            <FablinoMascot
              src={MASCOT_CYCLE[mascotIndex]}
              size="md"
              bounce={factVisible}
            />
            {shuffledFacts[factIndex] && (
              <SpeechBubble variant="hero">
                {(DID_YOU_KNOW[storyLangParam || "de"] || DID_YOU_KNOW.de)} {shuffledFacts[factIndex]}
              </SpeechBubble>
            )}
          </div>
        )}

        {/* Done/Error mascot */}
        {status !== "generating" && (
          <div className="relative mb-4">
            <img
              src={status === "done" ? "/mascot/1_happy_success.png" : "/mascot/2_encouriging_wrong_answer.png"}
              alt="Fablino"
              className="h-36 w-auto drop-shadow-lg"
              style={{ animation: "gentleBounce 1.5s ease-in-out infinite" }}
            />
          </div>
        )}

        {/* Headline */}
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: "#E8863A" }}>
          {status === "done"
            ? `Die Geschichte ist fertig! 🎉`
            : kidName
            ? `Fablino erstellt eine Geschichte für ${kidName}! ✨`
            : "Fablino erstellt eine Geschichte... ✨"}
        </h1>

        {/* Status content */}
        {status === "generating" && (
          <div className="w-full mt-5 flex flex-col items-center gap-4">
            {/* Progress text */}
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm w-full text-center">
              <p className="text-sm font-medium" style={{ color: "rgba(45,24,16,0.8)" }}>
                {PROGRESS_TEXTS[Math.min(progressTextIdx, PROGRESS_TEXTS.length - 1)]}{dots}
              </p>
            </div>

            {/* Loading bar */}
            <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: "#E8863A",
                  animation: "loadingBar 60s linear forwards",
                }}
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="w-full mt-5 flex flex-col items-center gap-4">
            <p className="text-sm text-center" style={{ color: "rgba(45,24,16,0.65)" }}>
              Bereit zum Lesen! Viel Spaß beim Abtauchen in die Geschichte.
            </p>
            <Button
              onClick={handleReadStory}
              className="w-full font-bold rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: "#E8863A", height: "56px", fontSize: "1.1rem", animation: "fadeSlideIn 0.5s ease-out" }}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Geschichte lesen! 📖
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="w-full mt-5 flex flex-col items-center gap-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 w-full text-center">
              <p className="text-sm font-medium text-red-700">
                Es gab ein Problem beim Erstellen der Geschichte. 😕
              </p>
              <p className="text-xs text-red-500 mt-1">Bitte versuche es nochmal.</p>
            </div>
            <Button
              onClick={handleRetry}
              className="w-full font-semibold rounded-2xl text-white"
              style={{ backgroundColor: "#E8863A", height: "52px" }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Nochmal versuchen
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fablinoFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes loadingBar {
          0% { width: 5%; }
          20% { width: 30%; }
          50% { width: 60%; }
          80% { width: 85%; }
          100% { width: 95%; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

function getDifficultyForAge(age: number): string {
  if (age <= 6) return "easy";
  if (age <= 9) return "medium";
  return "hard";
}

export default OnboardingStoryPage;
