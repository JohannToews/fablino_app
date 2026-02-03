import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Save, Loader2, FileText, RefreshCw, BookOpen, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface SystemPromptSectionProps {
  language: Language;
}

const DEFAULT_WORD_EXPLANATION_PROMPT = `Du bist ein lebendiges Wörterbuch für 8-jährige Kinder.

Das zu erklärende Wort oder Ausdruck: "{word}"
{context}

AUFGABE:
1. Falls das Wort falsch geschrieben ist, korrigiere es
2. Gib eine EINFACHE und KLARE Erklärung in maximal 8 Wörtern

STRENGE REGELN:
1. Maximal 8 Wörter für die Erklärung, nicht mehr
2. Verwende sehr einfache Wörter, die ein 8-jähriges Kind kennt
3. Keine Satzzeichen am Ende (kein Punkt, kein Komma)
4. Keine Wiederholung des zu erklärenden Wortes
5. Bei Verben: erkläre die Handlung
6. Bei Nomen: sage konkret, was es ist
7. Bei Adjektiven: gib ein einfaches Synonym oder beschreibe es

PERFEKTE BEISPIELE:
- "mutig" → "Jemand der keine Angst hat"
- "verschlingen" → "Sehr schnell und gierig essen"
- "wunderschön" → "Ganz besonders schön"

ANTWORTE NUR mit gültigem JSON:
{"correctedWord": "korrigiertes_oder_originales_wort", "explanation": "kurze erklärung"}`;

const SystemPromptSection = ({ language }: SystemPromptSectionProps) => {
  const t = useTranslations(language);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [continuationPrompt, setContinuationPrompt] = useState("");
  const [wordExplanationPrompt, setWordExplanationPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingContinuation, setIsSavingContinuation] = useState(false);
  const [isSavingWordExplanation, setIsSavingWordExplanation] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    system: false,
    continuation: false,
    wordExplanation: false,
  });

  useEffect(() => {
    loadPrompts();
  }, [language]);

  const loadPrompts = async () => {
    setIsLoading(true);
    const promptKey = `system_prompt_${language}`;
    const continuationKey = `system_prompt_continuation_${language}`;
    const wordExplanationKey = `system_prompt_word_explanation_${language}`;
    
    // Load all prompts in parallel
    const [promptResult, continuationResult, wordExplanationResult] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", promptKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", continuationKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", wordExplanationKey).maybeSingle()
    ]);

    if (promptResult.data && !promptResult.error) {
      setSystemPrompt(promptResult.data.value);
    } else {
      // Fallback to German if no prompt found
      const { data: fallbackData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "system_prompt_de")
        .maybeSingle();
      
      if (fallbackData) {
        setSystemPrompt(fallbackData.value);
      }
    }

    if (continuationResult.data && !continuationResult.error) {
      setContinuationPrompt(continuationResult.data.value);
    }

    if (wordExplanationResult.data && !wordExplanationResult.error) {
      setWordExplanationPrompt(wordExplanationResult.data.value);
    } else {
      // Use default prompt if none saved
      setWordExplanationPrompt(DEFAULT_WORD_EXPLANATION_PROMPT);
    }
    
    setIsLoading(false);
  };

  const saveSystemPrompt = async () => {
    setIsSaving(true);
    const promptKey = `system_prompt_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: systemPrompt,
        },
      });

      if (error) {
        console.error("Error saving system prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "System-Prompt gespeichert" : 
                      language === 'fr' ? "Prompt système sauvegardé" :
                      "System prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  const saveContinuationPrompt = async () => {
    setIsSavingContinuation(true);
    const promptKey = `system_prompt_continuation_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: continuationPrompt,
        },
      });

      if (error) {
        console.error("Error saving continuation prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "Fortsetzungs-Prompt gespeichert" : 
                      language === 'fr' ? "Prompt de continuation sauvegardé" :
                      "Continuation prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingContinuation(false);
    }
  };

  const saveWordExplanationPrompt = async () => {
    setIsSavingWordExplanation(true);
    const promptKey = `system_prompt_word_explanation_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: wordExplanationPrompt,
        },
      });

      if (error) {
        console.error("Error saving word explanation prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "Wort-Erklärungs-Prompt gespeichert" : 
                      language === 'fr' ? "Prompt d'explication sauvegardé" :
                      "Word explanation prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingWordExplanation(false);
    }
  };

  const getLanguageLabel = () => {
    const labels: Record<string, string> = {
      de: "Deutsch",
      en: "English",
      fr: "Français",
      es: "Español",
      nl: "Nederlands",
      bs: "Bosanski",
    };
    return labels[language] || language;
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Main System Prompt */}
      <Collapsible open={openSections.system} onOpenChange={() => toggleSection('system')}>
        <Card className="border-2 border-primary/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.system ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <FileText className="h-5 w-5 text-primary" />
                  {language === 'de' ? 'System-Prompt' : 
                   language === 'fr' ? 'Prompt Système' : 
                   'System Prompt'}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageLabel()})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                {language === 'de' 
                  ? 'Dieser globale System-Prompt wird bei der Generierung aller Lesetexte verwendet. Er definiert die pädagogischen Richtlinien für verschiedene Schulklassen und Schwierigkeitsgrade. Fordere explizit den Ende-Typ an (A=Abgeschlossen, B=Offen, C=Cliffhanger).'
                  : language === 'fr'
                  ? 'Ce prompt système global est utilisé lors de la génération de tous les textes de lecture. Il définit les directives pédagogiques. Demandez explicitement le type de fin (A=Terminé, B=Ouvert, C=Cliffhanger).'
                  : 'This global system prompt is used when generating all reading texts. It defines the pedagogical guidelines. Explicitly request the ending type (A=Complete, B=Open, C=Cliffhanger).'}
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' ? "System-Prompt hier eingeben..." : 
                                language === 'fr' ? "Entrez le prompt système ici..." :
                                "Enter system prompt here..."}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveSystemPrompt}
                      disabled={isSaving}
                      className="btn-primary-kid"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 
                           language === 'fr' ? 'Sauvegarde...' : 
                           'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 
                           language === 'fr' ? 'Sauvegarder' : 
                           'Save'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={loadPrompts}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Neu laden' : 
                       language === 'fr' ? 'Recharger' : 
                       'Reload'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Continuation System Prompt for Series */}
      <Collapsible open={openSections.continuation} onOpenChange={() => toggleSection('continuation')}>
        <Card className="border-2 border-accent/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.continuation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <BookOpen className="h-5 w-5 text-accent" />
                  {language === 'de' ? 'Fortsetzungs-Prompt (Serien)' : 
                   language === 'fr' ? 'Prompt de Continuation (Séries)' : 
                   'Continuation Prompt (Series)'}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageLabel()})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                {language === 'de' 
                  ? 'Dieser Prompt wird verwendet, wenn eine Fortsetzung zu einer bestehenden Serie generiert wird. Die vorherige Episode wird automatisch beigefügt.'
                  : language === 'fr'
                  ? 'Ce prompt est utilisé lors de la génération d\'une suite à une série existante. L\'épisode précédent sera automatiquement inclus.'
                  : 'This prompt is used when generating a continuation to an existing series. The previous episode will be automatically included.'}
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={continuationPrompt}
                    onChange={(e) => setContinuationPrompt(e.target.value)}
                    className="min-h-[200px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' 
                      ? "Fortsetzungs-Prompt hier eingeben... z.B. 'Schreibe eine Fortsetzung zur folgenden Geschichte. Behalte den Stil bei und führe die Handlung weiter.'" 
                      : language === 'fr' 
                      ? "Entrez le prompt de continuation ici... par ex. 'Écrivez une suite à l'histoire suivante. Gardez le même style et continuez l'intrigue.'"
                      : "Enter continuation prompt here... e.g. 'Write a continuation to the following story. Keep the same style and continue the plot.'"}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveContinuationPrompt}
                      disabled={isSavingContinuation}
                      className="btn-primary-kid"
                    >
                      {isSavingContinuation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 
                           language === 'fr' ? 'Sauvegarde...' : 
                           'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 
                           language === 'fr' ? 'Sauvegarder' : 
                           'Save'}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {language === 'de' 
                      ? 'Tipp: Der Fortsetzungs-Prompt erhält automatisch die vorherige Episode. Definiere hier nur die Anweisungen für die Fortsetzung.'
                      : language === 'fr'
                      ? 'Astuce: Le prompt de continuation reçoit automatiquement l\'épisode précédent. Définissez ici uniquement les instructions pour la suite.'
                      : 'Tip: The continuation prompt automatically receives the previous episode. Only define the continuation instructions here.'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Word Explanation Prompt */}
      <Collapsible open={openSections.wordExplanation} onOpenChange={() => toggleSection('wordExplanation')}>
        <Card className="border-2 border-orange-500/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.wordExplanation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <HelpCircle className="h-5 w-5 text-orange-500" />
                  {language === 'de' ? 'Wort-Erklärungen' : 
                   language === 'fr' ? 'Explications de Mots' : 
                   'Word Explanations'}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageLabel()})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm text-muted-foreground">
                {language === 'de' 
                  ? 'Dieser Prompt wird verwendet, wenn ein Kind beim Lesen auf ein unbekanntes Wort tippt. Nutze {word} als Platzhalter für das Wort und {context} für den optionalen Satzkontext.'
                  : language === 'fr'
                  ? 'Ce prompt est utilisé lorsqu\'un enfant clique sur un mot inconnu pendant la lecture. Utilisez {word} comme placeholder pour le mot et {context} pour le contexte optionnel.'
                  : 'This prompt is used when a child taps on an unknown word while reading. Use {word} as placeholder for the word and {context} for the optional sentence context.'}
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={wordExplanationPrompt}
                    onChange={(e) => setWordExplanationPrompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' 
                      ? "Wort-Erklärungs-Prompt hier eingeben..." 
                      : language === 'fr' 
                      ? "Entrez le prompt d'explication de mots ici..."
                      : "Enter word explanation prompt here..."}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveWordExplanationPrompt}
                      disabled={isSavingWordExplanation}
                      className="btn-primary-kid"
                    >
                      {isSavingWordExplanation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 
                           language === 'fr' ? 'Sauvegarde...' : 
                           'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 
                           language === 'fr' ? 'Sauvegarder' : 
                           'Save'}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {language === 'de' 
                      ? 'Hinweis: Die Antwort muss als JSON mit "correctedWord" und "explanation" zurückgegeben werden.'
                      : language === 'fr'
                      ? 'Note: La réponse doit être retournée en JSON avec "correctedWord" et "explanation".'
                      : 'Note: The response must be returned as JSON with "correctedWord" and "explanation".'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SystemPromptSection;
