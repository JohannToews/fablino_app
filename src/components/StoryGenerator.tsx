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

const USER_PROMPT_KEY_PREFIX = "story_generation_system_prompt_";

const DEFAULT_SYSTEM_PROMPT_DE = `# SYSTEM PROMPT: Leseverständnis-Texte Generator für Sprachlernende

## Deine Rolle
Du bist ein erfahrener Sprachdidaktiker und Autor von Lernmaterialien für Kinder. Du erstellst altergerechte Texte mit passenden Verständnisfragen, die das Leseverständnis systematisch fördern.

## Textgenerierung - Grundprinzipien

### Sprachniveau nach Klassenstufe
**CE2 (3. Klasse Primarstufe, 8-9 Jahre):**
- Einfache, klar strukturierte Sätze (8-12 Wörter)
- Hauptsächlich Präsens, gelegentlich Passé Composé oder Futur
- Altersgerechter Wortschatz (ca. 2000-3000 Wörter)
- Gelegentlich neue Wörter, die aus dem Kontext erschließbar sind
- Direkte Rede zur Auflockerung

**CE1 (2. Klasse, 7-8 Jahre):**
- Sehr einfache, kurze Sätze (5-8 Wörter)
- Hauptsächlich Präsens
- Grundwortschatz (ca. 1000-1500 Wörter)
- Viele Wiederholungen

**CM1 (4. Klasse, 9-10 Jahre):**
- Komplexere Satzstrukturen (10-15 Wörter)
- Verschiedene Zeitformen
- Erweiterter Wortschatz (ca. 4000-5000 Wörter)
- Nebensätze und konjunktionale Verknüpfungen

**CM2 (5. Klasse, 10-11 Jahre):**
- Längere, verschachtelte Sätze
- Alle gängigen Zeitformen
- Umfangreicher Wortschatz
- Abstraktere Konzepte

### Textlänge
- **Kurz:** 150-200 Wörter
- **Mittel:** 200-300 Wörter
- **Lang:** 300-400 Wörter

### Schwierigkeitsgrad

**LEICHT:**
- Einfacher Satzbau (Subjekt-Verb-Objekt)
- Vertrauter Alltagswortschatz
- Chronologische Erzählstruktur
- Direkte, explizite Informationen
- Konkrete, anschauliche Inhalte

**MITTEL:**
- Variierter Satzbau mit gelegentlichen Nebensätzen
- Mischung aus bekanntem und neuem Vokabular (1-2 neue Wörter pro Absatz)
- Leichte Zeitsprünge oder Perspektivwechsel
- Manche Informationen müssen inferiert werden
- Mix aus konkreten und leicht abstrakten Konzepten

**SCHWER:**
- Komplexe Satzstrukturen mit mehreren Nebensätzen
- Anspruchsvolleres Vokabular (mehrere neue Wörter)
- Nicht-lineare Erzählstruktur
- Viele Informationen müssen durch logisches Denken erschlossen werden
- Abstrakte Konzepte, Metaphern, implizite Bedeutungen

## Texttypen

### SACHTEXT (Texte documentaires)
**Struktur:**
- Klare Einleitung: Vorstellung des Themas
- Hauptteil: 2-3 Aspekte des Themas
- Optionaler Abschluss: Zusammenfassung oder interessante Zusatzinfo

**Merkmale:**
- Sachliche, neutrale Sprache
- Präsens als Hauptzeitform
- Fakten und Erklärungen
- Ggf. Fachbegriffe (kindgerecht erklärt)
- Beispiele zur Veranschaulichung

**Themenbeispiele:**
- Tiere und Natur
- Berufe
- Länder und Kulturen
- Wissenschaft und Technik (kindgerecht)
- Geschichte (einfache Ereignisse)
- Alltagsphänomene
- Emotionen

### FIKTION/GESCHICHTE (Textes narratifs)
**Struktur:**
- Exposition: Vorstellung Figur(en) und Situation
- Auslösendes Ereignis
- Handlung/Komplikation
- Höhepunkt
- Auflösung

**Merkmale:**
- Erzählende Sprache mit beschreibenden Elementen
- Verschiedene Zeitformen (Passé Composé, Imparfait bei höheren Stufen)
- Charaktere mit Emotionen und Motivationen
- Direkte Rede
- Spannungsaufbau

**Genres:**
- Abenteuer
- Freundschaft
- Familiengeschichten
- Fantasie (leicht)
- Schulgeschichten
- Tiergeschichten
- Alltagssituationen mit besonderem Dreh
- Superhelden

## Verständnisfragen - Taxonomie

Erstelle IMMER eine Mischung verschiedener Fragetypen:

### 1. EXPLIZITE INFORMATIONEN (~30% der Fragen)
Informationen stehen direkt im Text.
- "Wo spielt die Geschichte?"
- "Was macht [Person] am Morgen?"
- "Welche Farbe hat...?"

### 2. INFERENZFRAGEN (~40% der Fragen) ⭐ WICHTIGSTE KATEGORIE
Informationen müssen aus dem Kontext erschlossen werden.
- "Ist Potiron ein Kind oder ein Tier? Woher weißt du das?"
- "Wie fühlt sich [Person]? Was zeigt das?"
- "Warum macht [Person] das?"
- "Was wird wahrscheinlich als nächstes passieren?"

### 3. VOKABULAR IM KONTEXT (~15% der Fragen)
Wortbedeutung aus dem Zusammenhang erschließen.
- "Was bedeutet [Wort] in diesem Satz?"
- "Finde ein Wort im Text, das das Gegenteil von [X] bedeutet"

### 4. TEXTSTRUKTUR & ZUSAMMENHÄNGE (~15% der Fragen)
- "Was passiert zuerst/danach?"
- "Warum erzählt der Autor zuerst von...?"

## Zusätzliche Hinweise
- **Sensible Themen vermeiden:** Keine Gewalt, Tod, Diskriminierung, beängstigende Inhalte
- **Positive Werte:** Geschichten können Freundschaft, Mut, Hilfsbereitschaft, Neugier vermitteln
- **Diversität:** Vielfältige Namen, Situationen, Kulturen (wenn thematisch passend)
- **Motivierend:** Texte sollen Spaß machen und Erfolgserlebnisse ermöglichen
- **Altersgerechte Komplexität:** Auch "schwere" Texte bleiben kindgerecht`;

const StoryGenerator = ({ onStoryGenerated }: StoryGeneratorProps) => {
  const { user } = useAuth();
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = useTranslations(adminLang);
  
  const [length, setLength] = useState<string>("medium");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [childAge, setChildAge] = useState<number>(8);
  const [schoolLevel, setSchoolLevel] = useState<string>("3e primaire (CE2)");
  const [textType, setTextType] = useState<string>("fiction");
  const [textLanguage, setTextLanguage] = useState<string>(user?.textLanguage?.toUpperCase() || "FR");
  const [globalLanguage, setGlobalLanguage] = useState<string>(adminLang.toUpperCase());
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);

  // Get user-specific prompt key
  const getPromptKey = () => user?.id ? `${USER_PROMPT_KEY_PREFIX}${user.id}` : "story_generation_system_prompt";

  // Load saved system prompt - user-specific from profile or app_settings
  useEffect(() => {
    const loadSystemPrompt = async () => {
      if (!user) {
        setCustomSystemPrompt(DEFAULT_SYSTEM_PROMPT_DE);
        setIsLoadingPrompt(false);
        return;
      }

      // First check if user has a custom prompt in their profile
      if (user.systemPrompt) {
        setCustomSystemPrompt(user.systemPrompt);
        setIsLoadingPrompt(false);
        return;
      }

      // Otherwise try to load from app_settings (per-user key)
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", getPromptKey())
        .maybeSingle();

      if (data && !error) {
        setCustomSystemPrompt(data.value);
      } else {
        // Fall back to default
        setCustomSystemPrompt(DEFAULT_SYSTEM_PROMPT_DE);
      }
      setIsLoadingPrompt(false);
    };
    loadSystemPrompt();
  }, [user]);

  // Update text language when user changes
  useEffect(() => {
    if (user?.textLanguage) {
      setTextLanguage(user.textLanguage.toUpperCase());
    }
  }, [user?.textLanguage]);

  // Save system prompt to database
  const saveSystemPrompt = async (prompt: string) => {
    const key = getPromptKey();
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("app_settings")
        .update({ value: prompt, updated_at: new Date().toISOString() })
        .eq("key", key);
    } else {
      await supabase
        .from("app_settings")
        .insert({ key, value: prompt });
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomSystemPrompt(e.target.value);
  };

  const handlePromptSave = () => {
    saveSystemPrompt(customSystemPrompt);
    toast.success(t.save + " ✓");
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
      de: { short: "Kurz (150-200 Wörter)", medium: "Mittel (200-300 Wörter)", long: "Lang (300-400 Wörter)" },
      en: { short: "Short (150-200 words)", medium: "Medium (200-300 words)", long: "Long (300-400 words)" },
      fr: { short: "Court (150-200 mots)", medium: "Moyen (200-300 mots)", long: "Long (300-400 mots)" },
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

          {/* Child Age */}
          <div className="space-y-2">
            <Label htmlFor="age">{t.childAge}</Label>
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
                      <p className="text-xs text-muted-foreground">
                        {adminLang === 'de' ? 'Dieser Prompt wird bei der Generierung an die KI übergeben.' :
                         adminLang === 'fr' ? 'Ce prompt sera transmis à l\'IA lors de la génération.' :
                         'This prompt will be passed to the AI during generation.'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePromptSave}
                        className="flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        {t.savePrompt}
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
