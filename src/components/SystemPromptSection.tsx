import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, FileText, RefreshCw, BookOpen } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";

interface SystemPromptSectionProps {
  language: Language;
}

const SystemPromptSection = ({ language }: SystemPromptSectionProps) => {
  const t = useTranslations(language);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [continuationPrompt, setContinuationPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingContinuation, setIsSavingContinuation] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, [language]);

  const loadPrompts = async () => {
    setIsLoading(true);
    const promptKey = `system_prompt_${language}`;
    const continuationKey = `system_prompt_continuation_${language}`;
    
    // Load both prompts in parallel
    const [promptResult, continuationResult] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", promptKey).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", continuationKey).maybeSingle()
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

  const getLanguageLabel = () => {
    const labels: Record<string, string> = {
      de: "Deutsch",
      en: "English",
      fr: "Français",
      es: "Español",
      nl: "Nederlands",
    };
    return labels[language] || language;
  };

  return (
    <div className="space-y-6">
      {/* Main System Prompt */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
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
        <CardContent className="space-y-4">
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
      </Card>

      {/* Continuation System Prompt for Series */}
      <Card className="border-2 border-accent/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
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
        <CardContent className="space-y-4">
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
      </Card>
    </div>
  );
};

export default SystemPromptSection;
