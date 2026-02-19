import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, Check, Mic, MicOff } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";

// All supported languages alphabetically sorted by native name
const ALL_LANGUAGES = [...LANGUAGES]
  .filter((l) => l.storySupported)
  .sort((a, b) => a.nameNative.localeCompare(b.nameNative));

// Story categories and subtypes
const STORY_CATEGORIES = [
  {
    key: "adventure",
    emoji: "🏰",
    label: "Abenteuer",
    subtypes: [
      {
        key: "heroes",
        emoji: "🦸",
        label: "Helden & Schurken",
        description: "Superhelden, geheime Kräfte, Bösewichte besiegen",
        placeholder: "z.B. Ein Mädchen entdeckt, dass sie unsichtbar werden kann...",
        voicePrompt: "Du hast Helden & Schurken gewählt – möchtest du noch mehr erzählen? 🎤",
      },
      {
        key: "detective",
        emoji: "🔍",
        label: "Geheimnisse & Detektive",
        description: "Rätsel lösen, versteckte Hinweise, mysteriöse Fälle",
        placeholder: "z.B. Im Schulkeller verschwindet jede Nacht etwas...",
        voicePrompt: "Du hast Geheimnisse & Detektive gewählt – möchtest du noch mehr erzählen? 🎤",
      },
      {
        key: "space",
        emoji: "🚀",
        label: "Weltraum & Entdecker",
        description: "Fremde Planeten, Zeitreisen, unbekannte Welten",
        placeholder: "z.B. Auf dem Weg zum Mars entdecken sie einen geheimen Planeten...",
        voicePrompt: "Du hast Weltraum & Entdecker gewählt – möchtest du noch mehr erzählen? 🎤",
      },
    ],
  },
  {
    key: "fantasy",
    emoji: "🧚",
    label: "Fantasie",
    subtypes: [
      {
        key: "wizards",
        emoji: "🧙",
        label: "Zauberer & Hexen",
        description: "Magie, Zaubertränke, Sprüche",
        placeholder: "z.B. Ein junger Zauberlehrling braut seinen ersten Trank...",
        voicePrompt: "Du hast Zauberei & Hexen gewählt – möchtest du noch mehr erzählen? 🎤",
      },
      {
        key: "dragons",
        emoji: "🐉",
        label: "Drachen & Fabelwesen",
        description: "Einhörner, Phönixe, magische Tiere",
        placeholder: "z.B. Ein kleiner Drache, der kein Feuer spucken kann...",
        voicePrompt: "Du hast Drachen & Fabelwesen gewählt – möchtest du noch mehr erzählen? 🎤",
      },
      {
        key: "enchanted",
        emoji: "🌿",
        label: "Verwunschene Welten",
        description: "Geheime Portale, verzauberte Wälder, verborgene Königreiche",
        placeholder: "z.B. Hinter dem alten Baum öffnet sich ein Portal in eine andere Welt...",
        voicePrompt: "Du hast Verwunschene Welten gewählt – möchtest du noch mehr erzählen? 🎤",
      },
    ],
  },
];

const AGES = [5, 6, 7, 8, 9, 10, 11, 12];

const GENDERS = [
  { value: "girl", label: "Mädchen", emoji: "👧" },
  { value: "boy", label: "Junge", emoji: "👦" },
  { value: "other", label: "Divers", emoji: "🧒" },
];

// UI-supported languages for admin language selection
const UI_LANGUAGES = LANGUAGES.filter((l) => l.uiSupported).sort((a, b) => a.nameNative.localeCompare(b.nameNative));

type Step = "adminLang" | "profile" | "storyType";

// Helper: get flag+native name for a language code
function getLangMeta(code: string) {
  const found = ALL_LANGUAGES.find((l) => l.code === code);
  return found ? { flag: found.flag, label: found.nameNative } : { flag: "🌐", label: code.toUpperCase() };
}

// ── Single-select dropdown ──────────────────────────────────────
function SingleSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { code: string; label: string; flag: string }[];
  value: string | null;
  onChange: (code: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.code === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-12 rounded-xl border-2 px-4 text-sm bg-white"
        style={{
          borderColor: value ? "#E8863A" : "rgba(232,134,58,0.3)",
          color: value ? "rgba(45,24,16,0.9)" : "rgba(45,24,16,0.45)",
        }}
      >
        <span>
          {selected ? `${selected.flag} ${selected.label}` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-y-auto"
          style={{ borderColor: "rgba(232,134,58,0.25)", maxHeight: "220px" }}
        >
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { onChange(opt.code); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-orange-50 transition-colors"
              style={{ color: "rgba(45,24,16,0.85)" }}
            >
              <span className="text-lg">{opt.flag}</span>
              <span>{opt.label}</span>
              {opt.code === value && <Check className="h-4 w-4 ml-auto" style={{ color: "#E8863A" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Multi-select dropdown ───────────────────────────────────────
function MultiSelect({
  options,
  values,
  onChange,
  placeholder,
  excludeCode,
}: {
  options: { code: string; label: string; flag: string }[];
  values: string[];
  onChange: (codes: string[]) => void;
  placeholder: string;
  excludeCode?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const available = options.filter((o) => o.code !== excludeCode);

  const toggle = (code: string) => {
    if (values.includes(code)) {
      onChange(values.filter((v) => v !== code));
    } else {
      onChange([...values, code]);
    }
  };

  const selectedLabels = available
    .filter((o) => values.includes(o.code))
    .map((o) => `${o.flag} ${o.label}`)
    .join(", ");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between min-h-12 rounded-xl border-2 px-4 py-3 text-sm bg-white text-left"
        style={{
          borderColor: values.length > 0 ? "#E8863A" : "rgba(232,134,58,0.3)",
          color: values.length > 0 ? "rgba(45,24,16,0.9)" : "rgba(45,24,16,0.45)",
        }}
      >
        <span className="line-clamp-2">{selectedLabels || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-y-auto"
          style={{ borderColor: "rgba(232,134,58,0.25)", maxHeight: "220px" }}
        >
          {available.map((opt) => {
            const checked = values.includes(opt.code);
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => toggle(opt.code)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-orange-50 transition-colors"
                style={{ color: "rgba(45,24,16,0.85)" }}
              >
                <span className="text-lg">{opt.flag}</span>
                <span className="flex-1">{opt.label}</span>
                <div
                  className="h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: checked ? "#E8863A" : "rgba(232,134,58,0.35)",
                    background: checked ? "#E8863A" : "transparent",
                  }}
                >
                  {checked && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
const OnboardingKindPage = () => {
  const [step, setStep] = useState<Step>("adminLang");
  const [adminLang, setAdminLang] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [schoolLang, setSchoolLang] = useState<string | null>(null);
  const [extraLangs, setExtraLangs] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [customDetail, setCustomDetail] = useState("");
  const [selectedStoryLang, setSelectedStoryLang] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
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

  // Voice recognition
  const initRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Nicht unterstützt", description: "Spracheingabe wird von diesem Browser nicht unterstützt.", variant: "destructive" });
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = schoolLang || adminLang || "de-DE";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setCustomDetail(transcript.slice(0, 200));
    };
    recognition.onend = () => {
      if (isListeningRef.current) recognition.start();
    };
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({ title: "Kein Zugriff", description: "Mikrofon-Berechtigung verweigert.", variant: "destructive" });
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    return recognition;
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) recognitionRef.current = initRecognition();
    if (recognitionRef.current && !isListeningRef.current) {
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleStopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // Build the dropdown option list from LANGUAGES
  const langOptions = ALL_LANGUAGES.map((l) => ({
    code: l.code,
    label: l.nameNative,
    flag: l.flag,
  }));


  const handleAdminLangNext = () => {
    if (!adminLang) {
      toast({ title: "Fehler", description: "Bitte eine Sprache auswählen.", variant: "destructive" });
      return;
    }
    setStep("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileNext = () => {
    if (!name.trim()) {
      toast({ title: "Fehler", description: "Bitte einen Namen eingeben.", variant: "destructive" });
      return;
    }
    if (!selectedAge) {
      toast({ title: "Fehler", description: "Bitte ein Alter auswählen.", variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: "Fehler", description: "Bitte ein Geschlecht auswählen.", variant: "destructive" });
      return;
    }
    if (!schoolLang) {
      toast({ title: "Fehler", description: "Bitte eine Schulsprache auswählen.", variant: "destructive" });
      return;
    }
    setStep("storyType");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!selectedSubtype) {
      toast({ title: "Fehler", description: "Bitte eine Geschichte wählen.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const age = selectedAge!;
      const storyLanguages = Array.from(new Set([schoolLang!, ...extraLangs]));

      // Save admin language to user_profiles
      if (adminLang && user.id) {
        await supabase
          .from("user_profiles")
          .update({ app_language: adminLang, admin_language: adminLang })
          .eq("auth_id", user.id);
      }

      const { data: savedProfile, error } = await supabase
        .from("kid_profiles")
        .insert({
          user_id: user.id,
          name: name.trim().slice(0, 30),
          age,
          gender,
          reading_language: schoolLang!,
          home_languages: storyLanguages,
          ui_language: schoolLang!,
          school_system: schoolLang!,
          school_class: getSchoolClass(age),
          difficulty_level: getDifficultyLevel(age),
          content_safety_level: 2,
          color_palette: "warm",
          hobbies: customDetail.trim() || "",
          story_languages: storyLanguages,
          explanation_language: adminLang || "de",
        })
        .select()
        .single();

      if (error || !savedProfile) {
        console.error("Kid profile save error:", error);
        toast({ title: "Fehler", description: "Profil konnte nicht gespeichert werden.", variant: "destructive" });
        return;
      }

      const storyLang = selectedStoryLang || schoolLang!;
      const detailParam = customDetail.trim() ? `&detail=${encodeURIComponent(customDetail.trim())}` : "";
      navigate(`/onboarding/story?kid=${savedProfile.id}&storyType=${selectedCategory!}&subtype=${selectedSubtype}&lang=${storyLang}${detailParam}`, { replace: true });
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
          {step === "adminLang" ? "Willkommen bei Fablino! 🦊" : step === "profile" ? "Wer liest mit Fablino? 🦊" : "Was für eine Geschichte? 📖"}
        </h1>
        <p className="text-sm mt-1 text-center" style={{ color: "rgba(45,24,16,0.6)" }}>
          {step === "adminLang" ? "In welcher Sprache möchtest du Fablino verwalten?" : step === "profile" ? "Erstelle ein Profil für dein Kind" : `Eine Geschichte für ${name} ✨`}
        </p>
      </div>

      {/* === STEP 0: Admin Language === */}
      {step === "adminLang" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg px-6 py-7 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">🌐 Sprache für App-Administration</Label>
            <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
              In dieser Sprache siehst du Menüs, Einstellungen und Benachrichtigungen
            </p>
          <SingleSelect
              options={UI_LANGUAGES.map((l) => ({ code: l.code, label: l.nameNative, flag: l.flag }))}
              value={adminLang}
              onChange={setAdminLang}
              placeholder="Sprache auswählen..."
            />
          </div>

          <Button
            type="button"
            onClick={handleAdminLangNext}
            className="w-full font-semibold rounded-2xl text-white shadow-md"
            style={{ backgroundColor: "#E8863A", height: "52px", fontSize: "1rem" }}
          >
            Weiter →
          </Button>
        </div>
      )}

      {/* === STEP 1: Profile === */}
      {step === "profile" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg px-6 py-7 space-y-5">
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
            <div className="flex flex-wrap gap-2">
              {AGES.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setSelectedAge(age)}
                  className="h-12 w-12 rounded-xl text-base font-bold transition-all border-2 flex-shrink-0"
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

          {/* Geschlecht */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Geschlecht</Label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all"
                  style={{
                    background: gender === g.value ? "#E8863A" : "transparent",
                    color: gender === g.value ? "white" : "rgba(45,24,16,0.75)",
                    borderColor: gender === g.value ? "#E8863A" : "rgba(232,134,58,0.25)",
                  }}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-xs font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Schulsprache (single dropdown) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Schulsprache 📚</Label>
            <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
              Die Hauptsprache, in der dein Kind liest
            </p>
            <SingleSelect
              options={langOptions}
              value={schoolLang}
              onChange={setSchoolLang}
              placeholder="Sprache auswählen..."
            />
          </div>

          {/* Weitere Lesesprachen (multi dropdown) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Weitere Lesesprachen <span className="font-normal text-xs">(optional)</span></Label>
            <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
              Mehrere Sprachen möglich
            </p>
            <MultiSelect
              options={langOptions}
              values={extraLangs}
              onChange={setExtraLangs}
              placeholder="Weitere Sprachen..."
              excludeCode={schoolLang}
            />
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

          {/* Language toggle – shows only when multiple languages */}
          {(() => {
            const allLangs = Array.from(new Set([schoolLang!, ...extraLangs]));
            if (allLangs.length <= 1) return null;
            return (
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border" style={{ borderColor: "rgba(232,134,58,0.15)" }}>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "rgba(45,24,16,0.5)" }}>
                  📚 Sprache der Geschichte
                </p>
                <div className="flex flex-wrap gap-2">
                  {allLangs.map((code) => {
                    const meta = getLangMeta(code);
                    const isActive = selectedStoryLang === code || (!selectedStoryLang && code === schoolLang);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedStoryLang(code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all"
                        style={{
                          background: isActive ? "#E8863A" : "transparent",
                          color: isActive ? "white" : "rgba(45,24,16,0.7)",
                          borderColor: isActive ? "#E8863A" : "rgba(232,134,58,0.25)",
                        }}
                      >
                        <span className="text-base">{meta.flag}</span>
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: "rgba(45,24,16,0.4)" }}>
                  In welcher Sprache soll die erste Geschichte sein?
                </p>
              </div>
            );
          })()}

          {/* Two main categories with subtypes */}
          {STORY_CATEGORIES.map((cat) => (
            <div key={cat.key} className="bg-white rounded-2xl shadow-sm overflow-hidden border" style={{ borderColor: "rgba(232,134,58,0.15)" }}>
              {/* Category header */}
              <div className="px-5 py-3 flex items-center gap-2.5" style={{ background: "rgba(232,134,58,0.08)" }}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className="font-bold text-base" style={{ color: "rgba(45,24,16,0.85)" }}>{cat.label}</span>
              </div>

              {/* Subtypes */}
              <div className="divide-y" style={{ borderColor: "rgba(232,134,58,0.1)" }}>
                {cat.subtypes.map((sub) => {
                  const isSelected = selectedCategory === cat.key && selectedSubtype === sub.key;
                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setSelectedSubtype(sub.key);
                        setCustomDetail("");
                      }}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
                      style={{
                        background: isSelected ? "#FFF3E8" : "transparent",
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">{sub.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "rgba(45,24,16,0.9)" }}>{sub.label}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(45,24,16,0.5)" }}>{sub.description}</p>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8863A" }}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Voice / text detail input – appears after a subtype is picked */}
          {selectedSubtype && (() => {
            const cat = STORY_CATEGORIES.find(c => c.key === selectedCategory);
            const sub = cat?.subtypes.find(s => s.key === selectedSubtype);
            if (!sub) return null;
            return (
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border animate-fade-in" style={{ borderColor: "rgba(232,134,58,0.2)" }}>
                <p className="text-sm font-semibold mb-3" style={{ color: "rgba(45,24,16,0.75)" }}>
                  {sub.voicePrompt}
                </p>
                <div className="relative">
                  <textarea
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                    placeholder={sub.placeholder}
                    maxLength={200}
                    rows={3}
                    className="w-full rounded-xl border-2 px-4 py-3 pr-14 text-sm resize-none outline-none transition-colors"
                    style={{
                      borderColor: isListening ? "#E8863A" : customDetail ? "#E8863A" : "rgba(232,134,58,0.25)",
                      color: "rgba(45,24,16,0.85)",
                      background: isListening ? "rgba(232,134,58,0.04)" : "transparent",
                    }}
                  />
                  <button
                    type="button"
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className="absolute right-3 top-3 p-2 rounded-xl transition-all"
                    style={{
                      background: isListening ? "#E8863A" : "rgba(232,134,58,0.1)",
                      color: isListening ? "white" : "#E8863A",
                    }}
                    title={isListening ? "Aufnahme stoppen" : "Spracheingabe starten"}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                </div>
                {isListening && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: "#E8863A" }}>
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "#E8863A" }} />
                    Zuhören…
                  </p>
                )}
                <p className="text-xs mt-1 text-right" style={{ color: "rgba(45,24,16,0.35)" }}>
                  {customDetail.length}/200
                </p>
              </div>
            );
          })()}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedSubtype}
            className="w-full font-bold rounded-2xl text-white shadow-lg mt-2"
            style={{
              backgroundColor: selectedSubtype ? "#E8863A" : "rgba(232,134,58,0.4)",
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
  if (age <= 10) return "5";
  if (age <= 11) return "6";
  return "7";
}

function getDifficultyLevel(age: number): number {
  if (age <= 6) return 1;
  if (age <= 8) return 2;
  return 3; // max is 3 (constraint: difficulty_level between 1 and 3)
}

export default OnboardingKindPage;
