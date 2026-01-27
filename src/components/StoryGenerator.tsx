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

const SYSTEM_PROMPT_KEY = "story_generation_system_prompt";

const DEFAULT_SYSTEM_PROMPT = `Tu es un expert en littérature pour enfants francophones.
Crée des histoires captivantes, éducatives et adaptées à l'âge de l'enfant.
Utilise un vocabulaire riche mais accessible.
Inclus des dialogues vivants avec les guillemets français « ».
Assure-toi que l'histoire a un début, un milieu et une fin clairs.
Les histoires doivent transmettre des valeurs positives comme l'amitié, le courage ou la curiosité.`;

const StoryGenerator = ({ onStoryGenerated }: StoryGeneratorProps) => {
  const [length, setLength] = useState<string>("medium");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [childAge, setChildAge] = useState<number>(8);
  const [schoolLevel, setSchoolLevel] = useState<string>("3e primaire (CE2)");
  const [textType, setTextType] = useState<string>("fiction");
  const [textLanguage, setTextLanguage] = useState<string>("FR");
  const [globalLanguage, setGlobalLanguage] = useState<string>("DE");
  const [customSystemPrompt, setCustomSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);

  // Load saved system prompt from database
  useEffect(() => {
    const loadSystemPrompt = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SYSTEM_PROMPT_KEY)
        .single();

      if (data && !error) {
        setCustomSystemPrompt(data.value);
      }
      setIsLoadingPrompt(false);
    };
    loadSystemPrompt();
  }, []);

  // Save system prompt to database when it changes
  const saveSystemPrompt = async (prompt: string) => {
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", SYSTEM_PROMPT_KEY)
      .single();

    if (existing) {
      await supabase
        .from("app_settings")
        .update({ value: prompt, updated_at: new Date().toISOString() })
        .eq("key", SYSTEM_PROMPT_KEY);
    } else {
      await supabase
        .from("app_settings")
        .insert({ key: SYSTEM_PROMPT_KEY, value: prompt });
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomSystemPrompt(e.target.value);
  };

  const handlePromptBlur = () => {
    saveSystemPrompt(customSystemPrompt);
    toast.success("System-Prompt gespeichert");
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Bitte gib eine kurze Beschreibung ein");
      return;
    }

    setIsGenerating(true);
    toast.info("Geschichte wird generiert... ⚽🎨 (inkl. Cover-Bild)");

    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          length,
          difficulty,
          description,
          childAge,
          schoolLevel,
          textType,
          textLanguage,
          globalLanguage,
          customSystemPrompt,
        },
      });

      if (error) {
        console.error("Generation error:", error);
        toast.error("Fehler bei der Generierung");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.title && data?.content) {
        toast.success("Geschichte erfolgreich generiert! 🏆");
        onStoryGenerated(data);
      } else {
        toast.error("Ungültige Antwort vom Server");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setIsGenerating(false);
    }
  };

  const getLengthLabel = (val: string) => {
    switch (val) {
      case "short": return "Kurz (220-250 Wörter, 3 Fragen)";
      case "medium": return "Mittel (250-350 Wörter, 5 Fragen)";
      case "long": return "Lang (350-550 Wörter, 7 Fragen)";
      default: return val;
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Geschichte mit KI generieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Language Selection */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
          <Label htmlFor="globalLanguage" className="font-semibold">🌍 Globale Sprache (UI & Anweisungen)</Label>
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
            <Label htmlFor="textType">Art des Textes</Label>
            <Select value={textType} onValueChange={setTextType}>
              <SelectTrigger id="textType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiction">📖 Fiktion</SelectItem>
                <SelectItem value="non-fiction">📚 Sachgeschichte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Language */}
          <div className="space-y-2">
            <Label htmlFor="textLanguage">Sprache des Textes</Label>
            <Select value={textLanguage} onValueChange={setTextLanguage}>
              <SelectTrigger id="textLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FR">🇫🇷 Französisch</SelectItem>
                <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <Label htmlFor="length">Länge</Label>
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
            <Label htmlFor="difficulty">Schwierigkeitsgrad</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Einfach</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="difficult">Schwer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Child Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Alter des Kindes</Label>
            <Input
              id="age"
              type="number"
              min={5}
              max={14}
              value={childAge}
              onChange={(e) => setChildAge(parseInt(e.target.value) || 8)}
            />
          </div>

          {/* School Level */}
          <div className="space-y-2">
            <Label htmlFor="school">Schulniveau</Label>
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
            Kurze Beschreibung (auf Deutsch)
          </Label>
          <Input
            id="description"
            placeholder="z.B. Eine Geschichte über einen mutigen kleinen Hund, der sich im Wald verirrt"
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
                System-Prompt anpassen (optional)
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {isLoadingPrompt ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Lade gespeicherten Prompt...</span>
                  </div>
                ) : (
                  <>
                    <Textarea
                      id="systemPrompt"
                      placeholder="Anweisungen für die KI..."
                      value={customSystemPrompt}
                      onChange={handlePromptChange}
                      className="min-h-[150px] text-sm font-mono"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        Dieser Prompt wird bei der Generierung an die KI übergeben.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePromptBlur}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Speichern
                      </Button>
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
              Generiere Geschichte & Cover...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Geschichte generieren
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StoryGenerator;