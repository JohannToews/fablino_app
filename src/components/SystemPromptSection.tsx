import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Save, Loader2, FileText, RefreshCw, BookOpen, HelpCircle, ChevronDown, ChevronRight, CheckCircle, Wand2 } from "lucide-react";
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
  const [consistencyCheckPrompt, setConsistencyCheckPrompt] = useState("");
  const [consistencyCheckPromptV2, setConsistencyCheckPromptV2] = useState("");
  const [consistencyCheckSeriesAddon, setConsistencyCheckSeriesAddon] = useState("");
  const [elternModulPrompt, setElternModulPrompt] = useState("");
  const [kinderModulPrompt, setKinderModulPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingContinuation, setIsSavingContinuation] = useState(false);
  const [isSavingWordExplanation, setIsSavingWordExplanation] = useState(false);
  const [isSavingConsistencyCheck, setIsSavingConsistencyCheck] = useState(false);
  const [isSavingConsistencyCheckV2, setIsSavingConsistencyCheckV2] = useState(false);
  const [isSavingElternModul, setIsSavingElternModul] = useState(false);
  const [isSavingKinderModul, setIsSavingKinderModul] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    system: false,
    continuation: false,
    wordExplanation: false,
    consistencyCheck: false,
    consistencyCheckV2: false,
    elternModul: false,
    kinderModul: false,
  });

  useEffect(() => {
    loadPrompts();
  }, [language]);

  const loadPrompts = async () => {
    setIsLoading(true);
    const promptKey = `system_prompt_${language}`;
    const continuationKey = `system_prompt_continuation_${language}`;
    const wordExplanationKey = `system_prompt_word_explanation_${language}`;
    const consistencyCheckKey = `system_prompt_consistency_check_${language}`;
    const elternModulKey = `system_prompt_story_creation_${language}`;
    const kinderModulKey = `system_prompt_kid_creation_${language}`;
    
    // Load all prompts in parallel (including v2 consistency check prompts)
    const [promptResult, continuationResult, wordExplanationResult, consistencyCheckResult, elternModulResult, kinderModulResult, consistencyV2Result, seriesAddonResult] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", promptKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", continuationKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", wordExplanationKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", consistencyCheckKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", elternModulKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", kinderModulKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "consistency_check_prompt_v2").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "consistency_check_series_addon_v2").maybeSingle()
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

    if (consistencyCheckResult.data && !consistencyCheckResult.error) {
      setConsistencyCheckPrompt(consistencyCheckResult.data.value);
    }

    // Load v2 consistency check prompts (language-independent)
    if (consistencyV2Result.data && !consistencyV2Result.error) {
      setConsistencyCheckPromptV2(consistencyV2Result.data.value);
    }
    if (seriesAddonResult.data && !seriesAddonResult.error) {
      setConsistencyCheckSeriesAddon(seriesAddonResult.data.value);
    }

    if (elternModulResult.data && !elternModulResult.error) {
      setElternModulPrompt(elternModulResult.data.value);
    }

    if (kinderModulResult.data && !kinderModulResult.error) {
      setKinderModulPrompt(kinderModulResult.data.value);
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

  const saveConsistencyCheckPrompt = async () => {
    setIsSavingConsistencyCheck(true);
    const promptKey = `system_prompt_consistency_check_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: consistencyCheckPrompt,
        },
      });

      if (error) {
        console.error("Error saving consistency check prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "Consistency-Check Prompt gespeichert" : 
                      language === 'fr' ? "Prompt de vérification sauvegardé" :
                      "Consistency check prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingConsistencyCheck(false);
    }
  };

  const saveConsistencyCheckPromptV2 = async () => {
    setIsSavingConsistencyCheckV2(true);
    
    try {
      // Save both v2 prompts
      const { error: error1 } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey: "consistency_check_prompt_v2",
          promptValue: consistencyCheckPromptV2,
        },
      });

      const { error: error2 } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey: "consistency_check_series_addon_v2",
          promptValue: consistencyCheckSeriesAddon,
        },
      });

      if (error1 || error2) {
        console.error("Error saving v2 consistency check prompts:", error1, error2);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "Consistency-Check V2 Prompts gespeichert" : 
                      language === 'fr' ? "Prompts de vérification V2 sauvegardés" :
                      "Consistency check V2 prompts saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingConsistencyCheckV2(false);
    }
  };

  const saveElternModulPrompt = async () => {
    setIsSavingElternModul(true);
    const promptKey = `system_prompt_story_creation_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: elternModulPrompt,
        },
      });

      if (error) {
        console.error("Error saving Eltern-Modul prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "ELTERN-MODUL Prompt gespeichert" : 
                      language === 'fr' ? "Prompt MODUL PARENTS sauvegardé" :
                      "PARENT MODULE prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingElternModul(false);
    }
  };

  const saveKinderModulPrompt = async () => {
    setIsSavingKinderModul(true);
    const promptKey = `system_prompt_kid_creation_${language}`;
    
    try {
      const { error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "updateSystemPrompt",
          promptKey,
          promptValue: kinderModulPrompt,
        },
      });

      if (error) {
        console.error("Error saving Kinder-Modul prompt:", error);
        toast.error(language === 'de' ? "Fehler beim Speichern" : 
                    language === 'fr' ? "Erreur lors de la sauvegarde" :
                    "Error saving");
      } else {
        toast.success(language === 'de' ? "KINDER-MODUL Prompt gespeichert" : 
                      language === 'fr' ? "Prompt MODUL ENFANTS sauvegardé" :
                      "CHILD MODULE prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : 
                  language === 'fr' ? "Erreur lors de la sauvegarde" :
                  "Error saving");
    } finally {
      setIsSavingKinderModul(false);
    }
  };

  const getLanguageLabel = () => {
    const labels: Record<string, string> = {
      de: "Deutsch",
      en: "English",
      fr: "Français",
      es: "Español",
      nl: "Nederlands",
      it: "Italiano",
      bs: "Bosanski",
    };
    return labels[language] || language;
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Main System Prompt - CORE SLIM (AKTIV) */}
      <Collapsible open={openSections.system} onOpenChange={() => toggleSection('system')}>
        <Card className="border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.system ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <FileText className="h-5 w-5 text-emerald-500" />
                  {language === 'de' ? 'CORE SLIM System-Prompt' : 
                   language === 'fr' ? 'Prompt Système CORE SLIM' : 
                   'CORE SLIM System Prompt'}
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    AKTIV
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageLabel()})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-md border border-emerald-300/50">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {language === 'de' 
                    ? '✨ CORE SLIM: Kompakter Basis-Prompt für Story-Generierung. Wird mit dynamischem Kontext (Kategorien, Charaktere, Spezialeffekte) kombiniert.'
                    : language === 'fr'
                    ? '✨ CORE SLIM: Prompt de base compact pour la génération d\'histoires. Combiné avec un contexte dynamique (catégories, personnages, effets spéciaux).'
                    : '✨ CORE SLIM: Compact base prompt for story generation. Combined with dynamic context (categories, characters, special effects).'}
                </p>
              </div>
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

      {/* Consistency Check V2 - AKTIV (Language-independent with placeholders) */}
      <Collapsible open={openSections.consistencyCheckV2} onOpenChange={() => toggleSection('consistencyCheckV2')}>
        <Card className="border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.consistencyCheckV2 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  {language === 'de' ? 'Consistency-Check V2' : 
                   language === 'fr' ? 'Vérification V2' : 
                   'Consistency Check V2'}
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    AKTIV
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {language === 'de' ? '(Alle Sprachen)' : 
                   language === 'fr' ? '(Toutes langues)' : 
                   '(All Languages)'}
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-md border border-emerald-300/50">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {language === 'de' 
                    ? '✨ AKTIVER PROMPT: Dieser Template-basierte Prompt wird für ALLE Story-Sprachen verwendet. Platzhalter: {story_language}, {age_min}, {age_max}, {episode_number}, {series_context}'
                    : language === 'fr'
                    ? '✨ PROMPT ACTIF: Ce prompt basé sur template est utilisé pour TOUTES les langues. Placeholders: {story_language}, {age_min}, {age_max}, {episode_number}, {series_context}'
                    : '✨ ACTIVE PROMPT: This template-based prompt is used for ALL story languages. Placeholders: {story_language}, {age_min}, {age_max}, {episode_number}, {series_context}'}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'de' ? 'Haupt-Prompt (consistency_check_prompt_v2)' : 
                       language === 'fr' ? 'Prompt Principal (consistency_check_prompt_v2)' : 
                       'Main Prompt (consistency_check_prompt_v2)'}
                    </label>
                    <Textarea
                      value={consistencyCheckPromptV2}
                      onChange={(e) => setConsistencyCheckPromptV2(e.target.value)}
                      className="min-h-[300px] text-sm font-mono leading-relaxed"
                      placeholder="Enter v2 consistency check prompt with placeholders..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === 'de' ? 'Serien-Addon (consistency_check_series_addon_v2)' : 
                       language === 'fr' ? 'Addon Séries (consistency_check_series_addon_v2)' : 
                       'Series Addon (consistency_check_series_addon_v2)'}
                    </label>
                    <Textarea
                      value={consistencyCheckSeriesAddon}
                      onChange={(e) => setConsistencyCheckSeriesAddon(e.target.value)}
                      className="min-h-[150px] text-sm font-mono leading-relaxed"
                      placeholder="Enter series addon prompt..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveConsistencyCheckPromptV2}
                      disabled={isSavingConsistencyCheckV2}
                      className="btn-primary-kid"
                    >
                      {isSavingConsistencyCheckV2 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 
                           language === 'fr' ? 'Sauvegarde...' : 
                           'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'V2 Prompts speichern' : 
                           language === 'fr' ? 'Sauvegarder V2' : 
                           'Save V2 Prompts'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Consistency Check Prompt - FALLBACK (Language-specific, old format) */}
      <Collapsible open={openSections.consistencyCheck} onOpenChange={() => toggleSection('consistencyCheck')}>
        <Card className="border-2 border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.consistencyCheck ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CheckCircle className="h-5 w-5 text-amber-500" />
                  {language === 'de' ? 'Consistency-Check (Alt)' : 
                   language === 'fr' ? 'Vérification (Ancien)' : 
                   'Consistency Check (Old)'}
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                    FALLBACK
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageLabel()})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-md border border-amber-300/50">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {language === 'de' 
                    ? '⚠️ FALLBACK: Dieser sprachspezifische Prompt wird nur verwendet, wenn V2 nicht existiert. Der V2-Prompt oben ist jetzt aktiv für alle Sprachen.'
                    : language === 'fr'
                    ? '⚠️ FALLBACK: Ce prompt spécifique à la langue n\'est utilisé que si V2 n\'existe pas. Le prompt V2 ci-dessus est maintenant actif pour toutes les langues.'
                    : '⚠️ FALLBACK: This language-specific prompt is only used if V2 doesn\'t exist. The V2 prompt above is now active for all languages.'}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={consistencyCheckPrompt}
                    onChange={(e) => setConsistencyCheckPrompt(e.target.value)}
                    className="min-h-[250px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' 
                      ? "Consistency-Check Prompt hier eingeben..." 
                      : language === 'fr' 
                      ? "Entrez le prompt de vérification ici..."
                      : "Enter consistency check prompt here..."}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveConsistencyCheckPrompt}
                      disabled={isSavingConsistencyCheck}
                      className="btn-primary-kid"
                    >
                      {isSavingConsistencyCheck ? (
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
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ELTERN-MODUL (Admin/Lehrer Story-Erstellung) */}
      <Collapsible open={openSections.elternModul} onOpenChange={() => toggleSection('elternModul')}>
        <Card className="border-2 border-primary/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.elternModul ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <Wand2 className="h-5 w-5 text-primary" />
                  {language === 'de' ? 'ELTERN-MODUL (Admin/Lehrer)' : 
                   language === 'fr' ? 'MODULE PARENTS (Admin/Enseignant)' : 
                   'PARENT MODULE (Admin/Teacher)'}
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
                  ? 'Dieser Prompt wird verwendet, wenn Eltern/Lehrer im Admin-Bereich eine Geschichte mit einer kurzen Beschreibung erstellen. Fokus auf Leseverständnis und Inferenz-Fragen.'
                  : language === 'fr'
                  ? 'Ce prompt est utilisé quand les parents/enseignants créent une histoire avec une courte description dans l\'espace admin. Focus sur la compréhension et les questions d\'inférence.'
                  : 'This prompt is used when parents/teachers create a story with a short description in the admin area. Focus on reading comprehension and inference questions.'}
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={elternModulPrompt}
                    onChange={(e) => setElternModulPrompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' 
                      ? "ELTERN-MODUL Prompt hier eingeben...\n\nDieser Prompt wird mit dem CORE Prompt kombiniert." 
                      : language === 'fr' 
                      ? "Entrez le prompt MODULE PARENTS ici...\n\nCe prompt sera combiné avec le prompt CORE."
                      : "Enter PARENT MODULE prompt here...\n\nThis prompt will be combined with the CORE prompt."}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveElternModulPrompt}
                      disabled={isSavingElternModul}
                      className="btn-primary-kid"
                    >
                      {isSavingElternModul ? (
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
                      ? '💡 Verwendung: CORE + ELTERN-MODUL (+ optional SERIEN-MODUL)'
                      : language === 'fr'
                      ? '💡 Utilisation: CORE + MODULE PARENTS (+ optionnel MODULE SÉRIES)'
                      : '💡 Usage: CORE + PARENT MODULE (+ optional SERIES MODULE)'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* KINDER-MODUL (Kind erstellt eigene Geschichte) */}
      <Collapsible open={openSections.kinderModul} onOpenChange={() => toggleSection('kinderModul')}>
        <Card className="border-2 border-accent/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.kinderModul ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <Wand2 className="h-5 w-5 text-accent" />
                  {language === 'de' ? 'KINDER-MODUL (Kind-Wizard)' : 
                   language === 'fr' ? 'MODULE ENFANTS (Assistant Enfant)' : 
                   'CHILD MODULE (Kid Wizard)'}
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
                  ? 'Dieser Prompt wird verwendet, wenn ein Kind über den Wizard eine eigene Geschichte erstellt. Platzhalter für Charaktere, Orte und Zeitepochen werden automatisch ersetzt.'
                  : language === 'fr'
                  ? 'Ce prompt est utilisé quand un enfant crée sa propre histoire via l\'assistant. Les placeholders pour personnages, lieux et époques seront automatiquement remplacés.'
                  : 'This prompt is used when a child creates their own story via the wizard. Placeholders for characters, locations and time periods will be automatically replaced.'}
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  <Textarea
                    value={kinderModulPrompt}
                    onChange={(e) => setKinderModulPrompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' 
                      ? "KINDER-MODUL Prompt hier eingeben...\n\nVerfügbare Platzhalter:\n- {storyType} = Abenteuer/Detektiv/etc.\n- {characters} = Liste der gewählten Charaktere\n- {locations} = Gewählte Orte\n- {timePeriod} = Zeitepoche\n- {kidName} = Name des Kindes\n- {kidHobbies} = Hobbies des Kindes" 
                      : language === 'fr' 
                      ? "Entrez le prompt MODULE ENFANTS ici...\n\nPlaceholders disponibles:\n- {storyType} = Aventure/Détective/etc.\n- {characters} = Liste des personnages choisis\n- {locations} = Lieux choisis\n- {timePeriod} = Époque\n- {kidName} = Nom de l'enfant\n- {kidHobbies} = Loisirs de l'enfant"
                      : "Enter CHILD MODULE prompt here...\n\nAvailable placeholders:\n- {storyType} = Adventure/Detective/etc.\n- {characters} = List of chosen characters\n- {locations} = Chosen locations\n- {timePeriod} = Time period\n- {kidName} = Child's name\n- {kidHobbies} = Child's hobbies"}
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveKinderModulPrompt}
                      disabled={isSavingKinderModul}
                      className="btn-primary-kid"
                    >
                      {isSavingKinderModul ? (
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
                      ? '💡 Verwendung: CORE + KINDER-MODUL (+ optional SERIEN-MODUL)'
                      : language === 'fr'
                      ? '💡 Utilisation: CORE + MODULE ENFANTS (+ optionnel MODULE SÉRIES)'
                      : '💡 Usage: CORE + CHILD MODULE (+ optional SERIES MODULE)'}
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
