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
import { useTranslations, Language } from "@/lib/translations";

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

const AGES = [6, 7, 8, 9, 10, 11, 12];

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
  const [displayName, setDisplayName] = useState("");
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
  const uiLang = (adminLang || 'en') as Language;
  const t = useTranslations(uiLang);

  const GENDERS_TRANSLATED = [
    { value: "girl", label: t.onboardingGenderGirl, emoji: "👧" },
    { value: "boy", label: t.onboardingGenderBoy, emoji: "👦" },
    { value: "other", label: t.onboardingGenderOther, emoji: "🧒" },
  ];

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
      toast({ title: t.onboardingNotSupported, description: t.onboardingSpeechNotSupported, variant: "destructive" });
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
        toast({ title: t.onboardingNoMicAccess, description: t.onboardingMicDenied, variant: "destructive" });
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
      toast({ title: t.authError, description: t.onboardingSelectLangFirst, variant: "destructive" });
      return;
    }
    setStep("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileNext = () => {
    if (!name.trim()) {
      toast({ title: t.authError, description: t.onboardingSelectName, variant: "destructive" });
      return;
    }
    if (!selectedAge) {
      toast({ title: t.authError, description: t.onboardingSelectAge, variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: t.authError, description: t.onboardingSelectGender, variant: "destructive" });
      return;
    }
    if (!schoolLang) {
      toast({ title: t.authError, description: t.onboardingSelectSchoolLang, variant: "destructive" });
      return;
    }
    setStep("storyType");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!selectedSubtype) {
      toast({ title: t.authError, description: t.onboardingSelectStory, variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const age = selectedAge!;
      const storyLanguages = Array.from(new Set([schoolLang!, ...extraLangs]));

      // Save admin language + display name to user_profiles
      if (user.id) {
        const profileUpdate: Record<string, string> = {};
        if (adminLang) {
          profileUpdate.app_language = adminLang;
          profileUpdate.admin_language = adminLang;
        }
        if (displayName.trim()) {
          profileUpdate.display_name = displayName.trim();
        }
        if (Object.keys(profileUpdate).length > 0) {
          await supabase
            .from("user_profiles")
            .update(profileUpdate)
            .eq("auth_id", user.id);
        }
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
        toast({ title: t.authError, description: t.onboardingProfileSaveError, variant: "destructive" });
        return;
      }

      const storyLang = selectedStoryLang || schoolLang!;
      const detailParam = customDetail.trim() ? `&detail=${encodeURIComponent(customDetail.trim())}` : "";
      navigate(`/onboarding/story?kid=${savedProfile.id}&storyType=${selectedCategory!}&subtype=${selectedSubtype}&lang=${storyLang}${detailParam}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast({ title: t.authError, description: t.authGenericError, variant: "destructive" });
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
      <div className={`flex flex-col items-center mb-6 w-full ${step === "profile" ? "max-w-2xl" : "max-w-md"}`}>
        <img
          src="/mascot/6_Onboarding.png"
          alt="Fablino"
          className="h-24 w-auto drop-shadow-md"
          style={{ animation: "gentleBounce 2.5s ease-in-out infinite" }}
        />
        <h1 className="text-2xl font-bold mt-3 text-center" style={{ color: "#E8863A" }}>
          {step === "adminLang" ? t.onboardingWelcomeTitle : step === "profile" ? t.onboardingProfileTitle : t.onboardingStoryTypeTitle}
        </h1>
        <p className="text-sm mt-1 text-center" style={{ color: "rgba(45,24,16,0.6)" }}>
          {step === "adminLang" ? t.onboardingAdminLangSub : step === "profile" ? t.onboardingProfileSub : `${t.onboardingStoryTypeTitle} – ${name} ✨`}
        </p>
      </div>

      {/* === STEP 0: Admin Language === */}
      {step === "adminLang" && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg px-6 py-7 space-y-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{t.onboardingDisplayName}</Label>
            <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
              {t.onboardingDisplayNameHint}
            </p>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
              placeholder={t.onboardingDisplayNamePlaceholder}
              className="h-12 rounded-xl border-2 px-4 text-sm bg-white"
              style={{ borderColor: displayName ? "#E8863A" : "rgba(232,134,58,0.3)" }}
            />
          </div>

          {/* Admin Language */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{t.onboardingAdminLangLabel}</Label>
            <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
              {t.onboardingAdminLangHint}
            </p>
          <SingleSelect
              options={UI_LANGUAGES.map((l) => ({ code: l.code, label: l.nameNative, flag: l.flag }))}
              value={adminLang}
              onChange={setAdminLang}
              placeholder={t.onboardingSelectLang}
            />
          </div>

          <Button
            type="button"
            onClick={handleAdminLangNext}
            className="w-full font-semibold rounded-2xl text-white shadow-md"
            style={{ backgroundColor: "#E8863A", height: "52px", fontSize: "1rem" }}
          >
            {t.onboardingNext}
          </Button>
        </div>
      )}

      {/* === STEP 1: Profile === */}
      {step === "profile" && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg px-6 py-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t.onboardingChildName}</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                placeholder={t.onboardingChildNamePlaceholder}
                className="h-12 rounded-xl border-2 text-base"
                style={{ borderColor: "rgba(232,134,58,0.3)" }}
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Geschlecht – dropdown */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t.onboardingGender}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('gender-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="w-full flex items-center justify-between h-12 rounded-xl border-2 px-4 text-sm bg-white"
                  style={{
                    borderColor: gender ? "#E8863A" : "rgba(232,134,58,0.3)",
                    color: gender ? "rgba(45,24,16,0.9)" : "rgba(45,24,16,0.45)",
                  }}
                >
                  <span>
                    {gender
                      ? `${GENDERS_TRANSLATED.find(g => g.value === gender)?.emoji} ${GENDERS_TRANSLATED.find(g => g.value === gender)?.label}`
                      : t.onboardingGender}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                <div
                  id="gender-dropdown"
                  className="hidden absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-y-auto"
                  style={{ borderColor: "rgba(232,134,58,0.25)", maxHeight: "220px" }}
                >
                  {GENDERS_TRANSLATED.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setGender(g.value);
                        document.getElementById('gender-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-orange-50 transition-colors"
                      style={{ color: "rgba(45,24,16,0.85)" }}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <span>{g.label}</span>
                      {g.value === gender && <Check className="h-4 w-4 ml-auto" style={{ color: "#E8863A" }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alter – dropdown */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t.onboardingAge}</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('age-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="w-full flex items-center justify-between h-12 rounded-xl border-2 px-4 text-sm bg-white"
                  style={{
                    borderColor: selectedAge ? "#E8863A" : "rgba(232,134,58,0.3)",
                    color: selectedAge ? "rgba(45,24,16,0.9)" : "rgba(45,24,16,0.45)",
                  }}
                >
                  <span>{selectedAge ? `${selectedAge} Jahre` : t.onboardingAge}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                <div
                  id="age-dropdown"
                  className="hidden absolute z-50 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-y-auto"
                  style={{ borderColor: "rgba(232,134,58,0.25)", maxHeight: "220px" }}
                >
                  {AGES.map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => {
                        setSelectedAge(age);
                        document.getElementById('age-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-orange-50 transition-colors"
                      style={{ color: "rgba(45,24,16,0.85)" }}
                    >
                      <span className="font-medium">{age} Jahre</span>
                      {age === selectedAge && <Check className="h-4 w-4 ml-auto" style={{ color: "#E8863A" }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schulsprache (single dropdown) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t.onboardingSchoolLang}</Label>
              <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
                {t.onboardingSchoolLangHint}
              </p>
              <SingleSelect
                options={langOptions}
                value={schoolLang}
                onChange={setSchoolLang}
                placeholder={t.onboardingSelectLang}
              />
            </div>

            {/* Weitere Lesesprachen (multi dropdown) – spans full width on md */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-semibold">{t.onboardingExtraLangs} <span className="font-normal text-xs">{t.onboardingExtraLangsOptional}</span></Label>
              <p className="text-xs" style={{ color: "rgba(45,24,16,0.45)" }}>
                {t.onboardingExtraLangsHint}
              </p>
              <MultiSelect
                options={langOptions}
                values={extraLangs}
                onChange={setExtraLangs}
                placeholder={t.onboardingExtraLangsPlaceholder}
                excludeCode={schoolLang}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleProfileNext}
            className="w-full font-semibold rounded-2xl text-white shadow-md mt-6"
            style={{ backgroundColor: "#E8863A", height: "52px", fontSize: "1rem" }}
          >
            {t.onboardingNext}
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
                  {t.onboardingStoryLang}
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
                  {t.onboardingStoryLangHint}
                </p>
              </div>
            );
          })()}

          {/* Two main category tiles – click picks a random subtype */}
          <div className="grid grid-cols-2 gap-3">
            {STORY_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    const randomSub = cat.subtypes[Math.floor(Math.random() * cat.subtypes.length)];
                    setSelectedCategory(cat.key);
                    setSelectedSubtype(randomSub.key);
                    setCustomDetail("");
                  }}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 py-8 px-4 transition-all duration-150 active:scale-95"
                  style={{
                    background: isSelected ? "#FFF3E8" : "white",
                    borderColor: isSelected ? "#E8863A" : "rgba(232,134,58,0.15)",
                    boxShadow: isSelected ? "0 4px 16px rgba(232,134,58,0.25)" : "0 2px 8px rgba(45,24,16,0.06)",
                  }}
                >
                  <span className="text-5xl">{cat.emoji}</span>
                  <span className="font-bold text-base" style={{ color: isSelected ? "#E8863A" : "rgba(45,24,16,0.85)" }}>
                    {cat.label}
                  </span>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ background: "#E8863A" }}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>


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
              t.onboardingLetsGo
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep("profile")}
            className="w-full text-sm text-center mt-1 py-2"
            style={{ color: "rgba(45,24,16,0.4)" }}
          >
            {t.onboardingBack}
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
