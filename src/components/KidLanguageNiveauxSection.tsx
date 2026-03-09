import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Info } from "lucide-react";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS } from "@/components/story-creation/types";
import { STORY_LANGUAGES } from "@/lib/languages";
import { DEFAULT_SCHOOL_SYSTEMS } from "@/lib/schoolSystems";
import type { Language } from "@/lib/translations";

interface LangRow {
  kid_profile_id: string;
  language: string;
  language_class: number | null;
  language_level: number | null;
  content_level: number | null;
  length_level: number | null;
}

interface Props {
  kidProfileId: string;
  kidAge?: number;
  schoolClass?: string;
  language: Language;
  onSchoolLanguageChange?: (langCode: string) => void;
}

// Supported languages for the dropdown
const ALL_LANGS = STORY_LANGUAGES.filter(l => l.storySupported).map(l => l.code);

/** Extract grade number from school_class string and clamp to 1-5 */
export const extractGradeLevel = (schoolClass?: string): number => {
  if (!schoolClass) return 1;
  const match = schoolClass.match(/(\d+)/);
  const grade = match ? parseInt(match[1], 10) : 1;
  return Math.min(5, Math.max(1, grade));
};

// Map language codes to school system keys
const LANG_TO_SCHOOL: Record<string, string> = {
  fr: "fr", de: "de", es: "es", nl: "nl", en: "en", it: "it",
  pt: "pt", tr: "tr", pl: "pl", bs: "bs", uk: "uk", ru: "ru",
};

const FALLBACK_NIVEAU = [
  { value: 1, label: "Level 1" },
  { value: 2, label: "Level 2" },
  { value: 3, label: "Level 3" },
  { value: 4, label: "Level 4" },
  { value: 5, label: "Level 5" },
  { value: 6, label: "Level 6" },
];

function getNiveauOptions(lang: string) {
  const schoolKey = LANG_TO_SCHOOL[lang];
  const system = schoolKey ? DEFAULT_SCHOOL_SYSTEMS[schoolKey] : null;
  if (!system) return FALLBACK_NIVEAU;
  return system.classes.slice(0, 6).map((label, i) => ({ value: i + 1, label }));
}

const LENGTH_OPTIONS = [
  { value: 1, label: "Standard" },
  { value: 2, label: "Standard +1" },
  { value: 3, label: "Standard +2" },
  { value: 4, label: "Standard +3" },
  { value: 5, label: "Standard +4" },
];

const TYPE_OPTIONS = [
  { value: 1, labelKey: "schoolLang" },
  { value: 2, labelKey: "familyLang" },
];

const LABELS: Record<string, { title: string; langue: string; type: string; niveau: string; longueur: string; add: string; schoolLang: string; familyLang: string; tooltipLength: string }> = {
  de: { title: "Sprachen & Niveaus", langue: "Sprache", type: "Typ", niveau: "Niveau", longueur: "Länge", add: "+ Sprache hinzufügen", schoolLang: "Schulsprache", familyLang: "Familiensprache", tooltipLength: "+1 = ein Absatz mehr" },
  en: { title: "Languages & Levels", langue: "Language", type: "Type", niveau: "Level", longueur: "Length", add: "+ Add language", schoolLang: "School language", familyLang: "Home language", tooltipLength: "+1 = one extra paragraph" },
  fr: { title: "Langues & Niveaux", langue: "Langue", type: "Type", niveau: "Niveau", longueur: "Longueur", add: "+ Ajouter une langue", schoolLang: "Langue scolaire", familyLang: "Langue familiale", tooltipLength: "+1 = un paragraphe supplémentaire" },
  es: { title: "Idiomas & Niveles", langue: "Idioma", type: "Tipo", niveau: "Nivel", longueur: "Longitud", add: "+ Añadir idioma", schoolLang: "Idioma escolar", familyLang: "Idioma familiar", tooltipLength: "+1 = un párrafo más" },
  nl: { title: "Talen & Niveaus", langue: "Taal", type: "Type", niveau: "Niveau", longueur: "Lengte", add: "+ Taal toevoegen", schoolLang: "Schooltaal", familyLang: "Thuistaal", tooltipLength: "+1 = één extra paragraaf" },
  it: { title: "Lingue & Livelli", langue: "Lingua", type: "Tipo", niveau: "Livello", longueur: "Lunghezza", add: "+ Aggiungi lingua", schoolLang: "Lingua scolastica", familyLang: "Lingua familiare", tooltipLength: "+1 = un paragrafo in più" },
  tr: { title: "Diller & Seviyeler", langue: "Dil", type: "Tür", niveau: "Seviye", longueur: "Uzunluk", add: "+ Dil ekle", schoolLang: "Okul dili", familyLang: "Aile dili", tooltipLength: "+1 = bir paragraf daha" },
  pt: { title: "Línguas & Níveis", langue: "Língua", type: "Tipo", niveau: "Nível", longueur: "Comprimento", add: "+ Adicionar língua", schoolLang: "Língua escolar", familyLang: "Língua familiar", tooltipLength: "+1 = mais um parágrafo" },
  ru: { title: "Языки и уровни", langue: "Язык", type: "Тип", niveau: "Уровень", longueur: "Длина", add: "+ Добавить язык", schoolLang: "Школьный язык", familyLang: "Домашний язык", tooltipLength: "+1 = ещё один абзац" },
  uk: { title: "Мови та рівні", langue: "Мова", type: "Тип", niveau: "Рівень", longueur: "Довжина", add: "+ Додати мову", schoolLang: "Шкільна мова", familyLang: "Домашня мова", tooltipLength: "+1 = ще один абзац" },
};

const getL = (lang: string) => LABELS[lang] || LABELS.fr;

const KidLanguageNiveauxSection = ({ kidProfileId, kidAge, schoolClass, language, onSchoolLanguageChange }: Props) => {
  const [rows, setRows] = useState<LangRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const l = getL(language);
  const gradeStd = extractGradeLevel(schoolClass);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("kid_language_settings")
      .select("*")
      .eq("kid_profile_id", kidProfileId);
    const result = (data as LangRow[]) || [];
    setRows(result);
    setIsLoading(false);
  }, [kidProfileId]);

  useEffect(() => { load(); }, [load]);

  const upsertRow = async (row: LangRow) => {
    await supabase
      .from("kid_language_settings")
      .upsert({
        kid_profile_id: row.kid_profile_id,
        language: row.language,
        language_class: row.language_class,
        language_level: row.language_level,
        content_level: row.content_level,
        length_level: row.length_level,
      } as any, { onConflict: "kid_profile_id,language" });
  };

  const updateRow = (lang: string, updates: Partial<LangRow>) => {
    setRows(prev => {
      const next = prev.map(r => r.language === lang ? { ...r, ...updates } : r);
      const updated = next.find(r => r.language === lang);
      if (updated) upsertRow(updated);
      return next;
    });
  };

  const handleLanguageChange = async (oldLang: string, newLang: string) => {
    // Delete old row
    await supabase
      .from("kid_language_settings")
      .delete()
      .eq("kid_profile_id", kidProfileId)
      .eq("language", oldLang);

    const oldRow = rows.find(r => r.language === oldLang);
    const isSchool = (oldRow?.language_class ?? 2) === 1;
    const newRow: LangRow = {
      kid_profile_id: kidProfileId,
      language: newLang,
      language_class: oldRow?.language_class ?? 2,
      language_level: oldRow?.language_level ?? (isSchool ? gradeStd : Math.max(1, gradeStd - 1)),
      content_level: oldRow?.content_level ?? gradeStd,
      length_level: oldRow?.length_level ?? 1,
    };

    await upsertRow(newRow);
    setRows(prev => prev.map(r => r.language === oldLang ? newRow : r));

    // If this was the school language, update app language to the new language
    if (newRow.language_class === 1 && onSchoolLanguageChange) {
      onSchoolLanguageChange(newLang);
    }
  };

  const handleClassChange = (lang: string, newClass: number) => {
    const newLevel = newClass === 1 ? gradeStd : Math.max(1, gradeStd - 1);
    updateRow(lang, { language_class: newClass, language_level: newLevel, content_level: gradeStd });
    // If setting as school language, notify parent to update app language
    if (newClass === 1 && onSchoolLanguageChange) {
      onSchoolLanguageChange(lang);
    }
  };

  const addLanguage = async () => {
    const usedLangs = new Set(rows.map(r => r.language));
    const available = ALL_LANGS.find(code => !usedLangs.has(code));
    if (!available) { toast.error("All languages added"); return; }

    const newRow: LangRow = {
      kid_profile_id: kidProfileId,
      language: available,
      language_class: 2,
      language_level: Math.max(1, ageStd - 1),
      content_level: ageStd,
      length_level: 1,
    };
    await upsertRow(newRow);
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = async (lang: string) => {
    await supabase
      .from("kid_language_settings")
      .delete()
      .eq("kid_profile_id", kidProfileId)
      .eq("language", lang);
    setRows(prev => prev.filter(r => r.language !== lang));
  };

  const usedLangs = new Set(rows.map(r => r.language));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        {rows.map((row) => {
          const flag = LANGUAGE_FLAGS[row.language] || "";
          const langName = LANGUAGE_LABELS[row.language]?.[language] || row.language;
          const isSchool = row.language_class === 1;

          return (
            <div key={row.language} className="rounded-lg border border-orange-100 bg-orange-50/30 p-3 space-y-2.5">
              {/* Row 1: Language + Type */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[#2D1810]/50 mb-0.5 block">{l.langue}</label>
                  <Select
                    value={row.language}
                    onValueChange={(val) => handleLanguageChange(row.language, val)}
                  >
                    <SelectTrigger className="h-9 border-orange-200 text-sm">
                      <SelectValue>{flag} {langName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_LANGS.filter(code => code === row.language || !usedLangs.has(code)).map(code => (
                        <SelectItem key={code} value={code}>
                          {LANGUAGE_FLAGS[code] || ""} {LANGUAGE_LABELS[code]?.[language] || code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[#2D1810]/50 mb-0.5 block">{l.type}</label>
                  <Select
                    value={String(row.language_class ?? 2)}
                    onValueChange={(val) => handleClassChange(row.language, parseInt(val))}
                  >
                    <SelectTrigger className="h-9 border-orange-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{l.schoolLang}</SelectItem>
                      <SelectItem value="2">{l.familyLang}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rows.length > 1 && !isSchool && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 mt-3.5 shrink-0 text-[#2D1810]/30 hover:text-red-500 hover:bg-red-50"
                    onClick={() => deleteRow(row.language)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {/* Spacer when no delete icon */}
                {(rows.length <= 1 || isSchool) && (
                  <div className="w-9 shrink-0 mt-3.5" />
                )}
              </div>

              {/* Row 2: Niveau + Longueur */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[#2D1810]/50 mb-0.5 block">{l.niveau}</label>
                  <Select
                    value={String(row.language_level ?? 1)}
                    onValueChange={(val) => updateRow(row.language, { language_level: parseInt(val) })}
                  >
                    <SelectTrigger className="h-9 border-orange-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getNiveauOptions(row.language).map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[#2D1810]/50 mb-0.5 flex items-center gap-1">
                    {l.longueur}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-[#2D1810]/30 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        {l.tooltipLength}
                      </TooltipContent>
                    </Tooltip>
                  </label>
                  <Select
                    value={String(row.length_level ?? 1)}
                    onValueChange={(val) => updateRow(row.language, { length_level: parseInt(val) })}
                  >
                    <SelectTrigger className="h-9 border-orange-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Spacer to align with delete icon above */}
                <div className="w-9 shrink-0" />
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 w-full"
          onClick={addLanguage}
        >
          <Plus className="h-4 w-4 mr-1" />
          {l.add}
        </Button>
      </div>
    </TooltipProvider>
  );
};

export default KidLanguageNiveauxSection;
