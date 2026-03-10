import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Save, Loader2, FileText, RefreshCw, BookOpen, HelpCircle, ChevronDown, ChevronRight, CheckCircle, ClipboardList, Rocket } from "lucide-react";
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
  const [writerCoreV2Prompt, setWriterCoreV2Prompt] = useState("");
  const [writerCoreV3Prompt, setWriterCoreV3Prompt] = useState("");
  const [continuationPrompt, setContinuationPrompt] = useState("");
  const [wordExplanationPrompt, setWordExplanationPrompt] = useState("");
  const [consistencyCheckPrompt, setConsistencyCheckPrompt] = useState("");
  const [consistencyCheckPromptV2, setConsistencyCheckPromptV2] = useState("");
  const [consistencyCheckSeriesAddon, setConsistencyCheckSeriesAddon] = useState("");
  const [plannerPrompt, setPlannerPrompt] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWriterCoreV2, setIsSavingWriterCoreV2] = useState(false);
  const [isSavingWriterCoreV3, setIsSavingWriterCoreV3] = useState(false);
  const [isSavingContinuation, setIsSavingContinuation] = useState(false);
  const [isSavingWordExplanation, setIsSavingWordExplanation] = useState(false);
  const [isSavingConsistencyCheck, setIsSavingConsistencyCheck] = useState(false);
  const [isSavingConsistencyCheckV2, setIsSavingConsistencyCheckV2] = useState(false);
  const [isSavingPlanner, setIsSavingPlanner] = useState(false);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    writerCoreV3: false,
    
    writerCoreV2: false,
    system: false,
    continuation: false,
    wordExplanation: false,
    consistencyCheck: false,
    consistencyCheckV2: false,
    planner: false,
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
    
    const [promptResult, continuationResult, wordExplanationResult, consistencyCheckResult, consistencyV2Result, seriesAddonResult, plannerResult, writerCoreV2Result, writerCoreV3Result] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", promptKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", continuationKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", wordExplanationKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", consistencyCheckKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "consistency_check_prompt_v2").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "consistency_check_series_addon_v2").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "system_prompt_planner").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "system_prompt_core_v2").maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "system_prompt_core_v3").maybeSingle(),
      
    ]);

    if (promptResult.data && !promptResult.error) {
      setSystemPrompt(promptResult.data.value);
    } else {
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
      setWordExplanationPrompt(DEFAULT_WORD_EXPLANATION_PROMPT);
    }

    if (consistencyCheckResult.data && !consistencyCheckResult.error) {
      setConsistencyCheckPrompt(consistencyCheckResult.data.value);
    }

    if (consistencyV2Result.data && !consistencyV2Result.error) {
      setConsistencyCheckPromptV2(consistencyV2Result.data.value);
    }
    if (seriesAddonResult.data && !seriesAddonResult.error) {
      setConsistencyCheckSeriesAddon(seriesAddonResult.data.value);
    }

    if (plannerResult.data && !plannerResult.error) {
      setPlannerPrompt(plannerResult.data.value);
    }

    if (writerCoreV2Result.data && !writerCoreV2Result.error) {
      setWriterCoreV2Prompt(writerCoreV2Result.data.value);
    }

    if (writerCoreV3Result.data && !writerCoreV3Result.error) {
      setWriterCoreV3Prompt(writerCoreV3Result.data.value);
    }

    
    setIsLoading(false);
  };

  const saveSystemPrompt = async () => {
    setIsSaving(true);
    const promptKey = `system_prompt_${language}`;
    
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey,
        promptValue: systemPrompt,
      });

      if (error) {
        toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
      } else {
        toast.success(language === 'de' ? "System-Prompt gespeichert" : "System prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  const saveContinuationPrompt = async () => {
    setIsSavingContinuation(true);
    const promptKey = `system_prompt_continuation_${language}`;
    
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey,
        promptValue: continuationPrompt,
      });

      if (error) {
        toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
      } else {
        toast.success(language === 'de' ? "Fortsetzungs-Prompt gespeichert" : "Continuation prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setIsSavingContinuation(false);
    }
  };

  const saveWordExplanationPrompt = async () => {
    setIsSavingWordExplanation(true);
    const promptKey = `system_prompt_word_explanation_${language}`;
    
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey,
        promptValue: wordExplanationPrompt,
      });

      if (error) {
        toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
      } else {
        toast.success(language === 'de' ? "Wort-Erklärungs-Prompt gespeichert" : "Word explanation prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setIsSavingWordExplanation(false);
    }
  };

  const saveConsistencyCheckPrompt = async () => {
    setIsSavingConsistencyCheck(true);
    const promptKey = `system_prompt_consistency_check_${language}`;
    
    try {
      const { error } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey,
        promptValue: consistencyCheckPrompt,
      });

      if (error) {
        toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
      } else {
        toast.success(language === 'de' ? "Consistency-Check Prompt gespeichert" : "Consistency check prompt saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setIsSavingConsistencyCheck(false);
    }
  };

  const saveConsistencyCheckPromptV2 = async () => {
    setIsSavingConsistencyCheckV2(true);
    
    try {
      const { error: error1 } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey: "consistency_check_prompt_v2",
        promptValue: consistencyCheckPromptV2,
      });

      const { error: error2 } = await invokeEdgeFunction("manage-users", {
        action: "updateSystemPrompt",
        promptKey: "consistency_check_series_addon_v2",
        promptValue: consistencyCheckSeriesAddon,
      });

      if (error1 || error2) {
        toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
      } else {
        toast.success(language === 'de' ? "Consistency-Check V2 Prompts gespeichert" : "Consistency check V2 prompts saved");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
    } finally {
      setIsSavingConsistencyCheckV2(false);
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
      {/* ══════════ 0. FSE2 Writer Prompt — system_prompt_core_v3 ══════════ */}
      <Collapsible open={openSections.writerCoreV3} onOpenChange={() => toggleSection('writerCoreV3')}>
        <Card className="border-2 border-cyan-500/50 bg-cyan-50/30 dark:bg-cyan-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.writerCoreV3 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <Rocket className="h-5 w-5 text-cyan-500" />
                  FSE2 Writer Prompt (v3)
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-cyan-500 text-white rounded-full">
                    🚀 FSE2
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({language === 'de' ? 'Alle Sprachen' : language === 'fr' ? 'Toutes langues' : 'All Languages'})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-cyan-100/50 dark:bg-cyan-900/30 rounded-md border border-cyan-300/50">
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  🚀 FSE2 Writer — verwendet von der FSE2-Pipeline (Story Engine v2) für die Story-Generierung
                </p>
                <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1 font-mono">
                  DB Key: system_prompt_core_v3
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                  {language === 'de' 
                    ? '⚡ Wird nur bei aktivem FSE2-Flag verwendet. Leer = Fallback auf Writer v2.'
                    : '⚡ Only used when FSE2 flag is active. Empty = falls back to Writer v2.'}
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
                    value={writerCoreV3Prompt}
                    onChange={(e) => setWriterCoreV3Prompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder="FSE2 Writer system prompt (system_prompt_core_v3)..."
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        setIsSavingWriterCoreV3(true);
                        try {
                          const { error } = await invokeEdgeFunction("manage-users", {
                            action: "updateSystemPrompt",
                            promptKey: "system_prompt_core_v3",
                            promptValue: writerCoreV3Prompt,
                          });
                          if (error) {
                            toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                          } else {
                            toast.success(language === 'de' ? "FSE2 Writer Prompt gespeichert" : "FSE2 Writer prompt saved");
                          }
                        } catch (err) {
                          console.error("Error:", err);
                          toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                        } finally {
                          setIsSavingWriterCoreV3(false);
                        }
                      }}
                      disabled={isSavingWriterCoreV3}
                      className="btn-primary-kid"
                    >
                      {isSavingWriterCoreV3 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={loadPrompts} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Neu laden' : 'Reload'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'de' 
                      ? '💡 Leer lassen = Writer v2 Prompt wird als Fallback verwendet.'
                      : '💡 Leave empty = Writer v2 prompt is used as fallback.'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ══════════ 1. Writer Prompt (Active) — system_prompt_core_v2 ══════════ */}
      <Collapsible open={openSections.writerCoreV2} onOpenChange={() => toggleSection('writerCoreV2')}>
        <Card className="border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.writerCoreV2 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Writer Prompt (Active)
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    ✅ AKTIV
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({language === 'de' ? 'Alle Sprachen' : language === 'fr' ? 'Toutes langues' : 'All Languages'})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-md border border-emerald-300/50">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  ✅ Active — used for all story generation (default writer)
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                  DB Key: system_prompt_core_v2
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
                    value={writerCoreV2Prompt}
                    onChange={(e) => setWriterCoreV2Prompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder="Writer system prompt (system_prompt_core_v2)..."
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        setIsSavingWriterCoreV2(true);
                        try {
                          const { error } = await invokeEdgeFunction("manage-users", {
                            action: "updateSystemPrompt",
                            promptKey: "system_prompt_core_v2",
                            promptValue: writerCoreV2Prompt,
                          });
                          if (error) {
                            toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                          } else {
                            toast.success(language === 'de' ? "Writer Prompt gespeichert" : "Writer prompt saved");
                          }
                        } catch (err) {
                          console.error("Error:", err);
                          toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                        } finally {
                          setIsSavingWriterCoreV2(false);
                        }
                      }}
                      disabled={isSavingWriterCoreV2}
                      className="btn-primary-kid"
                    >
                      {isSavingWriterCoreV2 ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={loadPrompts} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Neu laden' : 'Reload'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ══════════ 2. Planner Prompt (Active) — system_prompt_planner ══════════ */}
      <Collapsible open={openSections.planner} onOpenChange={() => toggleSection('planner')}>
        <Card className="border-2 border-violet-500/50 bg-violet-50/30 dark:bg-violet-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.planner ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <ClipboardList className="h-5 w-5 text-violet-500" />
                  Planner Prompt (Active)
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-violet-500 text-white rounded-full">
                    ✅ AKTIV
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  ({language === 'de' ? 'Alle Sprachen' : language === 'fr' ? 'Toutes langues' : 'All Languages'})
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-violet-100/50 dark:bg-violet-900/30 rounded-md border border-violet-300/50">
                <p className="text-sm text-violet-800 dark:text-violet-200">
                  ✅ Active — used for story planning (Call 1)
                </p>
                <p className="text-xs text-violet-700 dark:text-violet-300 mt-1 font-mono">
                  DB Key: system_prompt_planner
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                  {language === 'de' 
                    ? '🗺️ Der Planner erstellt VOR der Story-Generierung einen strukturierten Plan (JSON). Feature-Flag: story_planner_enabled_users'
                    : '🗺️ The Planner creates a structured plan (JSON) BEFORE story generation. Feature flag: story_planner_enabled_users'}
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
                    value={plannerPrompt}
                    onChange={(e) => setPlannerPrompt(e.target.value)}
                    className="min-h-[350px] text-sm font-mono leading-relaxed"
                    placeholder="You are a children's story architect. Your job is NOT to write a story..."
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        setIsSavingPlanner(true);
                        try {
                          const { error } = await invokeEdgeFunction("manage-users", {
                            action: "updateSystemPrompt",
                            promptKey: "system_prompt_planner",
                            promptValue: plannerPrompt,
                          });
                          if (error) {
                            toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                          } else {
                            toast.success(language === 'de' ? "Planner-Prompt gespeichert" : "Planner prompt saved");
                          }
                        } catch (err) {
                          console.error("Error:", err);
                          toast.error(language === 'de' ? "Fehler beim Speichern" : "Error saving");
                        } finally {
                          setIsSavingPlanner(false);
                        }
                      }}
                      disabled={isSavingPlanner}
                      className="btn-primary-kid"
                    >
                      {isSavingPlanner ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'de' 
                      ? '💡 Leer lassen = Hardcoded-Prompt wird verwendet.'
                      : '💡 Leave empty = hardcoded prompt is used.'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ══════════ Legacy Writer Prompt (unused) — system_prompt_{language} ══════════ */}
      <Collapsible open={openSections.system} onOpenChange={() => toggleSection('system')}>
        <Card className="border border-dashed border-muted-foreground/30 opacity-70">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.system ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Legacy Writer Prompt (unused)
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                    ⚠️ INAKTIV
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
                  ⚠️ Not active — system_prompt_core_v2 is used instead
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-mono">
                  DB Key: system_prompt_{language}
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
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[200px] text-sm font-mono leading-relaxed"
                    placeholder={language === 'de' ? "System-Prompt hier eingeben..." : "Enter system prompt here..."}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveSystemPrompt}
                      disabled={isSaving}
                      variant="outline"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={loadPrompts} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {language === 'de' ? 'Neu laden' : 'Reload'}
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
                      ? "Fortsetzungs-Prompt hier eingeben..." 
                      : "Enter continuation prompt here..."}
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
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
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

      {/* Word Explanation Prompt */}
      <Collapsible open={openSections.wordExplanation} onOpenChange={() => toggleSection('wordExplanation')}>
        <Card className="border-2 border-orange-500/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.wordExplanation ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <HelpCircle className="h-5 w-5 text-orange-500" />
                  {language === 'de' ? 'Wort-Erklärungen' : 'Word Explanations'}
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
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'de' 
                      ? 'Hinweis: Die Antwort muss als JSON mit "correctedWord" und "explanation" zurückgegeben werden.'
                      : 'Note: The response must be returned as JSON with "correctedWord" and "explanation".'}
                  </p>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Consistency Check V2 - AKTIV */}
      <Collapsible open={openSections.consistencyCheckV2} onOpenChange={() => toggleSection('consistencyCheckV2')}>
        <Card className="border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.consistencyCheckV2 ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  {language === 'de' ? 'Consistency-Check V2' : 'Consistency Check V2'}
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    AKTIV
                  </span>
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {language === 'de' ? '(Alle Sprachen)' : '(All Languages)'}
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
                      {language === 'de' ? 'Haupt-Prompt (consistency_check_prompt_v2)' : 'Main Prompt (consistency_check_prompt_v2)'}
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
                      {language === 'de' ? 'Serien-Addon (consistency_check_series_addon_v2)' : 'Series Addon (consistency_check_series_addon_v2)'}
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
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'V2 Prompts speichern' : 'Save V2 Prompts'}
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

      {/* Consistency Check Prompt - FALLBACK */}
      <Collapsible open={openSections.consistencyCheck} onOpenChange={() => toggleSection('consistencyCheck')}>
        <Card className="border-2 border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  {openSections.consistencyCheck ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CheckCircle className="h-5 w-5 text-amber-500" />
                  {language === 'de' ? 'Consistency-Check (Alt)' : 'Consistency Check (Old)'}
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
                    ? '⚠️ FALLBACK: Dieser sprachspezifische Prompt wird nur verwendet, wenn V2 nicht existiert.'
                    : '⚠️ FALLBACK: This language-specific prompt is only used if V2 doesn\'t exist.'}
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
                          {language === 'de' ? 'Speichern...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {language === 'de' ? 'Speichern' : 'Save'}
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
    </div>
  );
};

export default SystemPromptSection;