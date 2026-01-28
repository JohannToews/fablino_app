import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Wand2, Loader2, Sparkles, Settings, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations, Language } from "@/lib/translations";

interface GeneratedQuestion {
  question: string;
  expectedAnswer: string;
}

interface GeneratedStory {
  title: string;
  content: string;
  questions?: GeneratedQuestion[];
  coverImageBase64?: string;
}

interface StoryGeneratorProps {
  onStoryGenerated: (story: GeneratedStory) => void;
}

// System prompts are loaded from app_settings (system_prompt_de, system_prompt_fr, etc.)

const StoryGenerator = ({ onStoryGenerated }: StoryGeneratorProps) => {
  const { user } = useAuth();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [length, setLength] = useState<string>("medium");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<string>("3e primaire (CE2)");
  const [textType, setTextType] = useState<string>("fiction");
  const [textLanguage, setTextLanguage] = useState<string>(user?.textLanguage?.toUpperCase() || "FR");
  const [globalLanguage, setGlobalLanguage] = useState<string>(adminLang.toUpperCase());
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

  // System prompt is global (read-only here) - editing not allowed from UI

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Read-only - global prompts are managed in database
    // setCustomSystemPrompt(e.target.value);
  };

  const handleGenerate = async () => {
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
          schoolLevel,
          textType,
          textLanguage,
          globalLanguage,
          customSystemPrompt,
        },
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
        onStoryGenerated(data);
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
    const labels = {
      de: { short: "Kurz (250-300 Wörter)", medium: "Mittel (300-350 Wörter)", long: "Lang (350-450 Wörter)" },
      en: { short: "Short (250-300 words)", medium: "Medium (300-350 words)", long: "Long (350-450 words)" },
      fr: { short: "Court (250-300 mots)", medium: "Moyen (300-350 mots)", long: "Long (350-450 mots)" },
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
        {/* Global Language Selection */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
          <Label htmlFor="globalLanguage" className="font-semibold">🌍 {t.globalLanguage}</Label>
          <Select value={globalLanguage} onValueChange={setGlobalLanguage}>
            <SelectTrigger id="globalLanguage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
              <SelectItem value="FR">🇫🇷 Français</SelectItem>
              <SelectItem value="EN">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                <SelectItem value="short">{getLengthLabel("short")}</SelectItem>
                <SelectItem value="medium">{getLengthLabel("medium")}</SelectItem>
                <SelectItem value="long">{getLengthLabel("long")}</SelectItem>
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
          {/* School Level */}
          <div className="space-y-2">
            <Label htmlFor="school">{t.schoolLevel}</Label>
            <Select value={schoolLevel} onValueChange={setSchoolLevel}>
              <SelectTrigger id="school">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1e primaire (CP)">1e primaire (CP)</SelectItem>
                <SelectItem value="2e primaire (CE1)">2e primaire (CE1)</SelectItem>
                <SelectItem value="3e primaire (CE2)">3e primaire (CE2)</SelectItem>
                <SelectItem value="4e primaire (CM1)">4e primaire (CM1)</SelectItem>
                <SelectItem value="5e primaire (CM2)">5e primaire (CM2)</SelectItem>
                <SelectItem value="6e primaire">6e primaire</SelectItem>
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

        {/* Custom System Prompt in Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="system-prompt" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                {t.systemPrompt}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {isLoadingPrompt ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.loading}</span>
                  </div>
                ) : (
                  <>
                    <Textarea
                      id="systemPrompt"
                      placeholder={adminLang === 'de' ? "Anweisungen für die KI..." : 
                                   adminLang === 'fr' ? "Instructions pour l'IA..." :
                                   "Instructions for the AI..."}
                      value={customSystemPrompt}
                      onChange={handlePromptChange}
                      className="min-h-[150px] text-sm font-mono"
                    />
                    <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground italic">
                      {adminLang === 'de' ? 'Globaler System-Prompt (nur lesen). Wird bei der Generierung an die KI übergeben.' :
                       adminLang === 'fr' ? 'Prompt système global (lecture seule). Sera transmis à l\'IA lors de la génération.' :
                       'Global system prompt (read-only). Will be passed to the AI during generation.'}
                    </p>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
