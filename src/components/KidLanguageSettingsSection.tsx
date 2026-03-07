import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS } from "@/components/story-creation/types";
import type { Language } from "@/lib/translations";

interface LanguageSetting {
  kid_profile_id: string;
  language: string;
  language_class: number | null;
  language_level: number | null;
  content_level: number | null;
  length_level: number | null;
}

interface KidLanguageSettingsSectionProps {
  kidProfileId: string;
  language: Language;
}

const LEVEL_LABELS: Record<string, string[]> = {
  de: ["Anfänger", "Grundlagen", "Mittel", "Fortgeschritten", "Experte"],
  en: ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"],
  fr: ["Débutant", "Base", "Intermédiaire", "Avancé", "Expert"],
  es: ["Principiante", "Básico", "Intermedio", "Avanzado", "Experto"],
};

const LENGTH_LABELS: Record<string, string[]> = {
  de: ["Sehr kurz", "Kurz", "Mittel", "Lang", "Sehr lang"],
  en: ["Very short", "Short", "Medium", "Long", "Very long"],
  fr: ["Très court", "Court", "Moyen", "Long", "Très long"],
  es: ["Muy corto", "Corto", "Medio", "Largo", "Muy largo"],
};

const SECTION_LABELS: Record<string, { title: string; langLevel: string; textLength: string; langType: string; schoolLang: string }> = {
  de: { title: "Spracheinstellungen", langLevel: "Sprachniveau", textLength: "Textlänge", langType: "Typ", schoolLang: "Schulsprache" },
  en: { title: "Language Settings", langLevel: "Language Level", textLength: "Text Length", langType: "Type", schoolLang: "School language" },
  fr: { title: "Paramètres de langue", langLevel: "Niveau de langue", textLength: "Longueur du texte", langType: "Type", schoolLang: "Langue scolaire" },
  es: { title: "Configuración de idioma", langLevel: "Nivel de idioma", textLength: "Longitud del texto", langType: "Tipo", schoolLang: "Idioma escolar" },
};

const getLabels = (lang: string) => SECTION_LABELS[lang] || SECTION_LABELS.en;
const getLevelLabel = (lang: string, level: number) => (LEVEL_LABELS[lang] || LEVEL_LABELS.en)[Math.max(0, Math.min(4, level - 1))];
const getLengthLabel = (lang: string, level: number) => (LENGTH_LABELS[lang] || LENGTH_LABELS.en)[Math.max(0, Math.min(4, level - 1))];

const KidLanguageSettingsSection = ({ kidProfileId, language }: KidLanguageSettingsSectionProps) => {
  const [settings, setSettings] = useState<LanguageSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const labels = getLabels(language);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("kid_language_settings")
      .select("*")
      .eq("kid_profile_id", kidProfileId);
    setSettings((data as LanguageSetting[]) || []);
    setIsLoading(false);
    setDirty(false);
  }, [kidProfileId]);

  useEffect(() => { load(); }, [load]);

  const updateSetting = (lang: string, field: "language_level" | "length_level", value: number) => {
    setSettings(prev =>
      prev.map(s => s.language === lang ? { ...s, [field]: value } : s)
    );
    setDirty(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      for (const s of settings) {
        await supabase
          .from("kid_language_settings")
          .update({
            language_level: s.language_level,
            length_level: s.length_level,
          } as any)
          .eq("kid_profile_id", s.kid_profile_id)
          .eq("language", s.language);
      }
      setDirty(false);
      toast.success("✓");
    } catch {
      toast.error("Error");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        {language === "de" ? "Keine Spracheinstellungen vorhanden." : "No language settings available."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {settings.map(s => {
        const flag = LANGUAGE_FLAGS[s.language] || "";
        const langName = LANGUAGE_LABELS[s.language]?.[language] || s.language;

        return (
          <div key={s.language} className="rounded-lg border border-orange-100 bg-orange-50/30 p-3 space-y-3">
            {/* Language header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2D1810]">
                {flag} {langName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {s.language_class === 1 ? labels.schoolLang : labels.langType}
              </span>
            </div>

            {/* Language level slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#2D1810]/70">{labels.langLevel}</Label>
                <span className="text-xs font-medium text-orange-600">
                  {s.language_level ?? 1}/5 — {getLevelLabel(language, s.language_level ?? 1)}
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[s.language_level ?? 1]}
                onValueChange={([v]) => updateSetting(s.language, "language_level", v)}
                className="w-full"
              />
            </div>

            {/* Text length slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#2D1810]/70">{labels.textLength}</Label>
                <span className="text-xs font-medium text-orange-600">
                  {s.length_level ?? 1}/5 — {getLengthLabel(language, s.length_level ?? 1)}
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[s.length_level ?? 1]}
                onValueChange={([v]) => updateSetting(s.language, "length_level", v)}
                className="w-full"
              />
            </div>
          </div>
        );
      })}

      {dirty && (
        <Button
          size="sm"
          onClick={save}
          disabled={isSaving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {labels.title}
        </Button>
      )}
    </div>
  );
};

export default KidLanguageSettingsSection;
