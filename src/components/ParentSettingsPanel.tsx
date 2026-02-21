import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Check, X, AlertTriangle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslations, Language } from "@/lib/translations";
import { useKidProfile } from "@/hooks/useKidProfile";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";

interface LearningTheme {
  id: string;
  theme_key: string;
  category: string;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  sort_order: number;
}

interface ContentTheme {
  id: string;
  theme_key: string;
  labels: Record<string, string>;
  min_safety_level: number;
  min_age: number | null;
  example_texts: Record<string, string>;
  sort_order: number;
}

interface CustomTheme {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  category: string;
  story_guidance: string;
  original_input: string;
  is_active: boolean;
}

interface PreparedTheme {
  name: Record<string, string>;
  description: Record<string, string>;
  category: string;
  story_guidance: string;
}

interface ParentSettingsPanelProps {
  language: Language;
}

const categoryOrder = ['social', 'emotional', 'character', 'cognitive'] as const;

const categoryIcons: Record<string, string> = {
  social: '🤝',
  emotional: '💛',
  character: '🌟',
  cognitive: '🧠',
};

const ParentSettingsPanel = ({ language }: ParentSettingsPanelProps) => {
  const t = useTranslations(language);
  const { selectedProfileId } = useKidProfile();
  const displayLang = (language || 'de') as string;

  const [learningThemes, setLearningThemes] = useState<LearningTheme[]>([]);
  const [activeThemes, setActiveThemes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(2);

  const [contentThemes, setContentThemes] = useState<ContentTheme[]>([]);
  const [safetyLevel, setSafetyLevel] = useState(2);

  // Custom theme states
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparedTheme, setPreparedTheme] = useState<PreparedTheme | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      loadKidConfig();
      loadCustomThemes();
    }
  }, [selectedProfileId]);

  const loadReferenceData = async () => {
    const [themesRes, contentRes] = await Promise.all([
      supabase.from("learning_themes").select("*").order("sort_order"),
      supabase.from("content_themes_by_level").select("*").order("sort_order"),
    ]);

    if (themesRes.data) {
      setLearningThemes(
        themesRes.data.map((row) => ({
          ...row,
          labels: (row.labels as Record<string, string>) || {},
          descriptions: (row.descriptions as Record<string, string>) || {},
        }))
      );
    }

    if (contentRes.data) {
      setContentThemes(
        contentRes.data.map((row) => ({
          ...row,
          labels: (row.labels as Record<string, string>) || {},
          example_texts: (row.example_texts as Record<string, string>) || {},
        }))
      );
    }

    setIsLoading(false);
  };

  const loadKidConfig = async () => {
    if (!selectedProfileId) return;

    const { data: configData } = await supabase
      .from("parent_learning_config")
      .select("*")
      .eq("kid_profile_id", selectedProfileId)
      .maybeSingle();

    if (configData) {
      setActiveThemes(configData.active_themes || []);
      setFrequency(configData.frequency || 2);
    } else {
      setActiveThemes([]);
      setFrequency(2);
    }

    const { data: profileData } = await supabase
      .from("kid_profiles")
      .select("content_safety_level")
      .eq("id", selectedProfileId)
      .single();

    if (profileData) {
      setSafetyLevel((profileData as any).content_safety_level ?? 2);
    }
  };

  const loadCustomThemes = async () => {
    if (!selectedProfileId) return;
    const { data } = await (supabase
      .from("custom_learning_themes" as any)
      .select("*")
      .eq("kid_profile_id", selectedProfileId)
      .order("created_at", { ascending: false }) as any);

    if (data) {
      setCustomThemes(data.map((row: any) => ({
        ...row,
        name: row.name as Record<string, string>,
        description: row.description as Record<string, string>,
      })));
    }
  };

  const toggleTheme = useCallback((themeKey: string) => {
    setActiveThemes((prev) => {
      if (prev.includes(themeKey)) {
        return prev.filter((k) => k !== themeKey);
      }
      if (prev.length >= 3) {
        toast.warning(t.learningThemesLimitReached);
        return prev;
      }
      return [...prev, themeKey];
    });
  }, [t.learningThemesLimitReached]);

  const handlePrepareCustomTheme = async () => {
    if (!customInput.trim()) return;
    setIsPreparing(true);
    setPreparedTheme(null);

    try {
      const { data, error } = await invokeEdgeFunction("prepare-custom-theme", {
        description: customInput.trim(),
        kid_language: displayLang,
      });

      if (error) throw error;
      setPreparedTheme(data as PreparedTheme);
    } catch (err) {
      console.error("Error preparing custom theme:", err);
      toast.error(t.error);
    }
    setIsPreparing(false);
  };

  const handleAcceptCustomTheme = async () => {
    if (!preparedTheme || !selectedProfileId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("No user");

      const { data: inserted, error } = await (supabase
        .from("custom_learning_themes" as any)
        .insert({
          user_id: userId,
          kid_profile_id: selectedProfileId,
          name: preparedTheme.name,
          description: preparedTheme.description,
          category: preparedTheme.category,
          story_guidance: preparedTheme.story_guidance,
          original_input: customInput.trim(),
          is_active: true,
        })
        .select()
        .single() as any);

      if (error) throw error;

      // Add to active themes
      const customKey = `custom:${(inserted as any).id}`;
      setActiveThemes((prev) => {
        if (prev.length >= 3) {
          toast.warning(t.learningThemesLimitReached);
          return prev;
        }
        return [...prev, customKey];
      });

      setCustomThemes((prev) => [{
        ...(inserted as any),
        name: preparedTheme.name,
        description: preparedTheme.description,
      }, ...prev]);

      setPreparedTheme(null);
      setCustomInput("");
      toast.success(t.parentSettingsSaved);
    } catch (err) {
      console.error("Error saving custom theme:", err);
      toast.error(t.parentSettingsSaveError);
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    try {
      await (supabase.from("custom_learning_themes" as any).delete().eq("id", themeId) as any);
      setCustomThemes((prev) => prev.filter((ct) => ct.id !== themeId));
      setActiveThemes((prev) => prev.filter((k) => k !== `custom:${themeId}`));
      toast.success(t.storyDeleted);
    } catch (err) {
      console.error("Error deleting custom theme:", err);
      toast.error(t.error);
    }
  };

  const handleSave = async () => {
    if (!selectedProfileId) {
      toast.error(t.noKidProfileSelected);
      return;
    }

    setIsSaving(true);
    try {
      const { error: configError } = await supabase
        .from("parent_learning_config")
        .upsert(
          {
            kid_profile_id: selectedProfileId,
            active_themes: activeThemes,
            frequency,
          },
          { onConflict: "kid_profile_id" }
        );

      if (configError) {
        console.error("Config save error:", configError);
        toast.error(t.parentSettingsSaveError);
        setIsSaving(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("kid_profiles")
        .update({ content_safety_level: safetyLevel } as any)
        .eq("id", selectedProfileId);

      if (profileError) {
        console.error("Safety level save error:", profileError);
        toast.error(t.parentSettingsSaveError);
        setIsSaving(false);
        return;
      }

      toast.success(t.parentSettingsSaved);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(t.parentSettingsSaveError);
    }
    setIsSaving(false);
  };

  const getCategoryLabel = (category: string): string => {
    const map: Record<string, keyof typeof t> = {
      social: 'categorySocial',
      emotional: 'categoryEmotional',
      character: 'categoryCharacter',
      cognitive: 'categoryCognitive',
    };
    return (t as any)[map[category]] || category;
  };

  const getLabel = (labels: Record<string, string>): string => {
    return labels[displayLang] || labels.de || labels.en || Object.values(labels)[0] || '';
  };

  const frequencyLabels = [t.frequencyOccasional, t.frequencyRegular, t.frequencyFrequent];

  const guardrailLevels = [
    { level: 1, name: t.guardrailLevel1, desc: t.guardrailLevel1Desc, color: 'bg-green-50 border-green-200' },
    { level: 2, name: t.guardrailLevel2, desc: t.guardrailLevel2Desc, color: 'bg-orange-50 border-orange-200' },
    { level: 3, name: t.guardrailLevel3, desc: t.guardrailLevel3Desc, color: 'bg-amber-50 border-amber-200' },
    { level: 4, name: t.guardrailLevel4, desc: t.guardrailLevel4Desc, color: 'bg-red-50 border-red-200' },
  ];

  const allowedThemes = contentThemes.filter((ct) => ct.min_safety_level > 0 && ct.min_safety_level <= safetyLevel);
  const notAllowedThemes = contentThemes.filter((ct) => ct.min_safety_level > safetyLevel && ct.min_safety_level > 0);
  const globalExclusions = contentThemes.filter((ct) => ct.min_safety_level === 0);

  if (!selectedProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-[#2D1810]/50">
        <AlertTriangle className="h-8 w-8 mb-3 text-orange-300" />
        <p>{t.noKidProfileSelected}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#2D1810]/50">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["learning-themes"]} className="space-y-3">

        {/* ═══ Akkordeon 1: Lernthemen ═══ */}
        <AccordionItem value="learning-themes" className="border border-orange-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-orange-50/50">
            <div className="flex items-center gap-2 text-left">
              <span className="text-lg">📚</span>
              <div>
                <p className="font-semibold text-[#2D1810]">{t.learningThemesTitle}</p>
                <p className="text-xs text-[#2D1810]/50 font-normal">{t.learningThemesDescription}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="space-y-5">
              {/* Theme grid grouped by category */}
              {categoryOrder.map((category) => {
                const themes = learningThemes.filter((lt) => lt.category === category);
                if (themes.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-[#2D1810]/60 mb-2 flex items-center gap-1.5">
                      <span>{categoryIcons[category]}</span>
                      {getCategoryLabel(category)}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {themes.map((theme) => {
                        const isActive = activeThemes.includes(theme.theme_key);
                        const isDisabled = !isActive && activeThemes.length >= 3;

                        return (
                          <button
                            key={theme.theme_key}
                            onClick={() => toggleTheme(theme.theme_key)}
                            disabled={isDisabled}
                            className={`
                              text-left p-3 rounded-xl border-2 transition-all
                              ${isActive
                                ? 'border-orange-400 bg-orange-50 shadow-sm'
                                : isDisabled
                                ? 'border-gray-100 bg-gray-50/50 opacity-50 cursor-not-allowed'
                                : 'border-orange-100 hover:border-orange-300 hover:bg-orange-50/30'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-[#2D1810]">
                                  {getLabel(theme.labels)}
                                </p>
                                <p className="text-xs text-[#2D1810]/50 mt-0.5 line-clamp-2">
                                  {getLabel(theme.descriptions)}
                                </p>
                              </div>
                              {isActive && (
                                <div className="flex-none mt-0.5">
                                  <Check className="h-4 w-4 text-orange-500" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Existing custom themes */}
              {customThemes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#2D1810]/60 mb-2 flex items-center gap-1.5">
                    <span>✨</span>
                    {t.customThemeTitle}
                  </h4>
                  <div className="space-y-2">
                    {customThemes.map((ct) => {
                      const customKey = `custom:${ct.id}`;
                      const isActive = activeThemes.includes(customKey);

                      return (
                        <div
                          key={ct.id}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isActive ? 'border-orange-400 bg-orange-50' : 'border-orange-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => toggleTheme(customKey)}
                              className="flex-1 text-left min-w-0"
                            >
                              <p className="font-medium text-sm text-[#2D1810]">
                                🧡 {getLabel(ct.name)}
                              </p>
                              <p className="text-xs text-[#2D1810]/50 mt-0.5 line-clamp-2">
                                {getLabel(ct.description)}
                              </p>
                            </button>
                            <div className="flex items-center gap-1 flex-none">
                              {isActive && <Badge className="bg-orange-100 text-orange-700 text-[10px] border-0">{t.customThemeActive}</Badge>}
                              <button
                                onClick={() => handleDeleteCustomTheme(ct.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add custom theme */}
              <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/30">
                <h4 className="text-sm font-semibold text-[#2D1810] mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  {t.customThemeTitle}
                </h4>
                <Textarea
                  value={customInput}
                  onChange={(e) => { setCustomInput(e.target.value); setPreparedTheme(null); }}
                  placeholder={t.customThemePlaceholder}
                  className="min-h-[80px] border-orange-200 bg-white text-sm resize-none"
                />

                {!preparedTheme && (
                  <Button
                    onClick={handlePrepareCustomTheme}
                    disabled={!customInput.trim() || isPreparing}
                    className="mt-3 bg-orange-500 hover:bg-orange-600 text-white w-full"
                    size="sm"
                  >
                    {isPreparing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.customThemePreparing}
                      </>
                    ) : (
                      t.customThemePrepare
                    )}
                  </Button>
                )}

                {preparedTheme && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-orange-200 space-y-2">
                    <p className="font-semibold text-sm text-[#2D1810]">
                      🧡 {getLabel(preparedTheme.name)}
                    </p>
                    <p className="text-xs text-[#2D1810]/60">
                      {getLabel(preparedTheme.description)}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleAcceptCustomTheme}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        size="sm"
                      >
                        {t.customThemeAccept}
                      </Button>
                      <Button
                        onClick={() => setPreparedTheme(null)}
                        variant="outline"
                        className="flex-1 border-orange-200"
                        size="sm"
                      >
                        {t.customThemeEdit}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active count + frequency */}
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-[#2D1810]/50">
                  {t.learningThemesMax3}
                </span>
                <Badge className={`${activeThemes.length >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'} border-0`}>
                  {activeThemes.length} / 3
                </Badge>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-[#2D1810]">{t.learningFrequency}</label>
                <div className="flex gap-2">
                  {frequencyLabels.map((label, i) => {
                    const val = i + 1;
                    return (
                      <button
                        key={val}
                        onClick={() => setFrequency(val)}
                        className={`flex-1 text-center p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                          frequency === val
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-orange-100 text-[#2D1810]/60 hover:border-orange-200'
                        }`}
                      >
                        <span className="block">{label}</span>
                        <span className="block text-[10px] opacity-70 mt-0.5">
                          {i === 0 ? t.frequencyEvery4th : i === 1 ? t.frequencyEvery3rd : t.frequencyEvery2nd}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ Akkordeon 2: Schutzthemen ═══ */}
        <AccordionItem value="safety-themes" className="border border-orange-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-orange-50/50">
            <div className="flex items-center gap-2 text-left">
              <span className="text-lg">🛡️</span>
              <div>
                <p className="font-semibold text-[#2D1810]">{t.contentGuardrailsTitle}</p>
                <p className="text-xs text-[#2D1810]/50 font-normal">{t.contentGuardrailsDescription}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="space-y-4">
              {/* Level selection cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guardrailLevels.map(({ level, name, desc, color }) => (
                  <button
                    key={level}
                    onClick={() => setSafetyLevel(level)}
                    className={`
                      text-left p-4 rounded-xl border-2 transition-all
                      ${safetyLevel === level
                        ? `${color} ring-2 ring-orange-400 ring-offset-1`
                        : 'border-orange-100 hover:border-orange-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#2D1810]">{name}</span>
                      {safetyLevel === level && <Check className="h-4 w-4 text-orange-500" />}
                    </div>
                    <p className="text-xs text-[#2D1810]/50">{desc}</p>
                  </button>
                ))}
              </div>

              {/* Allowed themes */}
              {allowedThemes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                    <Check className="h-4 w-4" />
                    {t.guardrailAllowed}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allowedThemes.map((ct) => (
                      <Badge key={ct.theme_key} className="text-xs py-1 px-2 bg-green-50 text-green-700 border border-green-200">
                        {getLabel(ct.labels)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Not allowed themes */}
              {notAllowedThemes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <X className="h-4 w-4" />
                    {t.guardrailNotAllowed}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {notAllowedThemes.map((ct) => (
                      <Badge key={ct.theme_key} variant="outline" className="text-xs py-1 px-2 opacity-60">
                        {getLabel(ct.labels)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Global exclusions */}
              {globalExclusions.length > 0 && (
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-200/50">
                  <h4 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                    🛡️ {t.guardrailGlobalExclusions}
                  </h4>
                  <p className="text-xs text-[#2D1810]/50 mb-2">{t.guardrailGlobalExclusionsDesc}</p>
                  <div className="flex flex-wrap gap-2">
                    {globalExclusions.map((ct) => (
                      <Badge key={ct.theme_key} className="text-xs py-1 px-2 bg-red-100 text-red-700 border-0">
                        {getLabel(ct.labels)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl h-12"
        size="lg"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? t.saving : t.save}
      </Button>
    </div>
  );
};

export default ParentSettingsPanel;
