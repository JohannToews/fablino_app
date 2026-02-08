import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEdgeFunctionHeaders } from "@/hooks/useEdgeFunctionHeaders";
import { useTranslations, Language } from "@/lib/translations";

interface GeneratedQuestion {
  question: string;
  expectedAnswer: string;
}

interface GeneratedVocabulary {
  word: string;
  explanation: string;
}

interface GeneratedStory {
  title: string;
  content: string;
  questions?: GeneratedQuestion[];
  vocabulary?: GeneratedVocabulary[];
  coverImageBase64?: string;
  storyImages?: string[]; // Additional progress images (base64)
  difficulty?: string; // The difficulty level selected during generation
  textType?: string; // fiction or non-fiction
  prompt?: string; // The user's generation prompt
  textLanguage?: string; // The language of the story text (fr, de, en, etc.)
  structure_beginning?: number | null; // Story structure classification (1-6 for A1-A6)
  structure_middle?: number | null; // Story structure classification (1-6 for M1-M6)
  structure_ending?: number | null; // Story structure classification (1-6 for E1-E6)
  emotional_coloring?: string | null; // Emotional tone (e.g. "EM-T (Thrill/Spannung)")
  // Block 2.3c: Extended classification fields
  emotional_secondary?: string | null; // Secondary emotional tone
  humor_level?: number | null; // Humor intensity (1-5)
  emotional_depth?: number | null; // Emotional depth level (1-5)
  moral_topic?: string | null; // Moral/educational topic
  concrete_theme?: string | null; // Concrete story theme
  learning_theme_applied?: string | null; // Applied learning theme key
  parent_prompt_text?: string | null; // Parent module prompt text
}

interface StoryGeneratorProps {
  onStoryGenerated: (story: GeneratedStory) => void;
}

// System prompts are loaded from app_settings (system_prompt_de, system_prompt_fr, etc.)

const StoryGenerator = ({ onStoryGenerated }: StoryGeneratorProps) => {
  const { user } = useAuth();
  const { getHeaders } = useEdgeFunctionHeaders();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [length, setLength] = useState<string>("medium");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [textType, setTextType] = useState<string>("fiction");
  const [textLanguage, setTextLanguage] = useState<string>(user?.textLanguage?.toUpperCase() || "FR");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);

  // Load global system prompt from app_settings based on admin language
  useEffect(() => {
    const loadSystemPrompt = async () => {
      const promptKey = `system_prompt_${adminLang}`;
      
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", promptKey)
        .maybeSingle();

      if (data && !error) {
        setCustomSystemPrompt(data.value);
      } else {
        // Fallback to German if no prompt found
        const { data: fallbackData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "system_prompt_de")
          .maybeSingle();
        
        if (fallbackData) {
          setCustomSystemPrompt(fallbackData.value);
        }
      }
      setIsLoadingPrompt(false);
    };
    loadSystemPrompt();
  }, [adminLang]);

  // Update text language when user changes
  useEffect(() => {
    if (user?.textLanguage) {
      setTextLanguage(user.textLanguage.toUpperCase());
    }
  }, [user?.textLanguage]);

  // System prompt is loaded from database (read-only in generator)

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error(adminLang === 'de' ? "Bitte melde dich erneut an" : 
                  adminLang === 'fr' ? "Veuillez vous reconnecter" :
                  "Please log in again");
      return;
    }

    if (!description.trim()) {
      toast.error(adminLang === 'de' ? "Bitte gib eine kurze Beschreibung ein" : 
                  adminLang === 'fr' ? "Veuillez entrer une courte description" :
                  "Please enter a short description");
      return;
    }

    setIsGenerating(true);
    toast.info(t.generating + " ⚽🎨");

    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length,
          difficulty,
          description,
          textType,
          textLanguage,
          customSystemPrompt,
          userId: user?.id,
          source: 'admin', // Admin/Lehrer Modus → CORE + ELTERN-MODUL
        },
        headers: getHeaders(),
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error(t.error);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.title && data?.content) {
        toast.success(t.success + " 🏆");

        // If the story was generated but images failed, warn the user explicitly.
        if (!data?.coverImageBase64) {
          toast.warning(
            adminLang === "de"
              ? "Text erstellt, aber Bilder konnten nicht generiert werden (ggf. in deiner Region nicht verfügbar oder temporär überlastet)."
              : adminLang === "fr"
                ? "Texte créé, mais les images n'ont pas pu être générées (peut-être indisponible dans ta région ou temporairement surchargé)."
                : "Text created, but images couldn't be generated (possibly unavailable in your region or temporarily overloaded)."
          );
        }

        onStoryGenerated({ ...data, difficulty, textType, prompt: description, textLanguage: textLanguage.toLowerCase() });
      } else {
        toast.error(t.error);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getLengthLabel = (val: string) => {
    const labels: Record<string, Record<string, string>> = {
      de: { very_short: "Sehr kurz (150-200 Wörter)", short: "Kurz (250-300 Wörter)", medium: "Mittel (300-350 Wörter)", long: "Lang (350-450 Wörter)", very_long: "Sehr lang (500-600 Wörter)" },
      en: { very_short: "Very short (150-200 words)", short: "Short (250-300 words)", medium: "Medium (300-350 words)", long: "Long (350-450 words)", very_long: "Very long (500-600 words)" },
      fr: { very_short: "Très court (150-200 mots)", short: "Court (250-300 mots)", medium: "Moyen (300-350 mots)", long: "Long (350-450 mots)", very_long: "Très long (500-600 mots)" },
      es: { very_short: "Muy corto (150-200 palabras)", short: "Corto (250-300 palabras)", medium: "Medio (300-350 palabras)", long: "Largo (350-450 palabras)", very_long: "Muy largo (500-600 palabras)" },
      nl: { very_short: "Zeer kort (150-200 woorden)", short: "Kort (250-300 woorden)", medium: "Gemiddeld (300-350 woorden)", long: "Lang (350-450 woorden)", very_long: "Zeer lang (500-600 woorden)" },
      bs: { very_short: "Vrlo kratko (150-200 riječi)", short: "Kratko (250-300 riječi)", medium: "Srednje (300-350 riječi)", long: "Dugo (350-450 riječi)", very_long: "Vrlo dugo (500-600 riječi)" },
    };
    return labels[adminLang]?.[val as keyof typeof labels.de] || val;
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          {t.storyGenerator}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Text Type */}
          <div className="space-y-2">
            <Label htmlFor="textType">{t.textType}</Label>
            <Select value={textType} onValueChange={setTextType}>
              <SelectTrigger id="textType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiction">📖 {t.fiction}</SelectItem>
                <SelectItem value="non-fiction">📚 {t.nonFiction}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Language */}
          <div className="space-y-2">
            <Label htmlFor="textLanguage">{t.textLanguage}</Label>
            <Select value={textLanguage} onValueChange={setTextLanguage}>
              <SelectTrigger id="textLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 Français</SelectItem>
                <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="EN">🇬🇧 English</SelectItem>
                <SelectItem value="ES">🇪🇸 Español</SelectItem>
                <SelectItem value="NL">🇳🇱 Nederlands</SelectItem>
                <SelectItem value="IT">🇮🇹 Italiano</SelectItem>
                <SelectItem value="BS">🇧🇦 Bosanski</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <Label htmlFor="length">{t.textLength}</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger id="length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_short">{getLengthLabel("very_short")}</SelectItem>
                <SelectItem value="short">{getLengthLabel("short")}</SelectItem>
                <SelectItem value="medium">{getLengthLabel("medium")}</SelectItem>
                <SelectItem value="long">{getLengthLabel("long")}</SelectItem>
                <SelectItem value="very_long">{getLengthLabel("very_long")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">{t.difficulty}</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t.easy}</SelectItem>
                <SelectItem value="medium">{t.medium}</SelectItem>
                <SelectItem value="difficult">{t.hard}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {adminLang === 'de' ? 'Kurze Beschreibung' : adminLang === 'fr' ? 'Courte description' : 'Short description'}
          </Label>
          <Input
            id="description"
            placeholder={adminLang === 'de' ? "z.B. Eine Geschichte über einen mutigen kleinen Hund" :
                         adminLang === 'fr' ? "p.ex. Une histoire sur un petit chien courageux" :
                         "e.g. A story about a brave little dog"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Info about system prompt */}
        {!isLoadingPrompt && customSystemPrompt && (
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              ✓ {adminLang === 'de' ? 'Globaler System-Prompt geladen' : 
                 adminLang === 'fr' ? 'Prompt système global chargé' :
                 'Global system prompt loaded'}
              {' '}
              <span className="text-muted-foreground/70">
                ({adminLang === 'de' ? 'Bearbeitung im System-Tab' : 
                  adminLang === 'fr' ? 'Modification dans l\'onglet Système' :
                  'Edit in System tab'})
              </span>
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full btn-primary-kid"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              {t.generateStory}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StoryGenerator;
