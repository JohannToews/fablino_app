import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, ShieldCheck, BookHeart, Check, X, AlertTriangle } from "lucide-react";
import { useTranslations, Language } from "@/lib/translations";
import { useKidProfile } from "@/hooks/useKidProfile";

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
  // Use admin language (passed via prop) for displaying labels - NOT the kid's language
  const displayLang = (language || 'de') as string;

  // Learning themes state
  const [learningThemes, setLearningThemes] = useState<LearningTheme[]>([]);
  const [activeThemes, setActiveThemes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(2);

  // Content guardrails state
  const [contentThemes, setContentThemes] = useState<ContentTheme[]>([]);
  const [safetyLevel, setSafetyLevel] = useState(2);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load reference data (themes) once
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Load per-kid config when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      loadKidConfig();
    }
  }, [selectedProfileId]);

  const loadReferenceData = async () => {
    const [themesRes, contentRes] = await Promise.all([
      supabase
        .from("learning_themes")
        .select("*")
        .order("sort_order"),
      supabase
        .from("content_themes_by_level")
        .select("*")
        .order("sort_order"),
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

    // Load parent_learning_config
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

    // Load content_safety_level from kid_profiles
    const { data: profileData } = await supabase
      .from("kid_profiles")
      .select("content_safety_level")
      .eq("id", selectedProfileId)
      .single();

    if (profileData) {
      setSafetyLevel((profileData as any).content_safety_level ?? 2);
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

  const handleSave = async () => {
    if (!selectedProfileId) {
      toast.error(t.noKidProfileSelected);
      return;
    }

    setIsSaving(true);
    try {
      // Upsert parent_learning_config
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

      // Update content_safety_level on kid_profiles
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
    { level: 1, name: t.guardrailLevel1, desc: t.guardrailLevel1Desc, color: 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700' },
    { level: 2, name: t.guardrailLevel2, desc: t.guardrailLevel2Desc, color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' },
    { level: 3, name: t.guardrailLevel3, desc: t.guardrailLevel3Desc, color: 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700' },
    { level: 4, name: t.guardrailLevel4, desc: t.guardrailLevel4Desc, color: 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700' },
  ];

  // Separate themes by level, excluding global exclusions
  const allowedThemes = contentThemes.filter((ct) => ct.min_safety_level > 0 && ct.min_safety_level <= safetyLevel);
  const notAllowedThemes = contentThemes.filter((ct) => ct.min_safety_level > safetyLevel && ct.min_safety_level > 0);
  const globalExclusions = contentThemes.filter((ct) => ct.min_safety_level === 0);

  if (!selectedProfileId) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-12 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p>{t.noKidProfileSelected}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>{t.loading}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* === Section 1: Learning Themes === */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookHeart className="h-5 w-5 text-primary" />
            {t.learningThemesTitle}
          </CardTitle>
          <CardDescription>{t.learningThemesDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme grid grouped by category */}
          {categoryOrder.map((category) => {
            const themes = learningThemes.filter((lt) => lt.category === category);
            if (themes.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
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
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : isDisabled
                            ? 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getLabel(theme.labels)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {getLabel(theme.descriptions)}
                            </p>
                          </div>
                          {isActive && (
                            <div className="flex-none mt-0.5">
                              <Check className="h-4 w-4 text-primary" />
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

          {/* Active count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t.learningThemesMax3}
            </span>
            <Badge variant={activeThemes.length >= 3 ? "destructive" : "secondary"}>
              {activeThemes.length} / 3
            </Badge>
          </div>

          {/* Frequency slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t.learningFrequency}</label>
            <Slider
              value={[frequency]}
              onValueChange={([val]) => setFrequency(val)}
              min={1}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {frequencyLabels.map((label, i) => (
                <span key={i} className={`text-center ${frequency === i + 1 ? 'text-primary font-semibold' : ''}`}>
                  <span className="block">{label}</span>
                  <span className="block text-[10px] opacity-70">
                    {i === 0 ? t.frequencyEvery4th : i === 1 ? t.frequencyEvery3rd : t.frequencyEvery2nd}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Section 2: Content Guardrails === */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t.contentGuardrailsTitle}
          </CardTitle>
          <CardDescription>{t.contentGuardrailsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level selection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guardrailLevels.map(({ level, name, desc, color }) => (
              <button
                key={level}
                onClick={() => setSafetyLevel(level)}
                className={`
                  text-left p-4 rounded-xl border-2 transition-all
                  ${safetyLevel === level
                    ? `${color} ring-2 ring-primary ring-offset-1`
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">
                    {name}
                  </span>
                  {safetyLevel === level && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>

          {/* Allowed themes for current level */}
          {allowedThemes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                {t.guardrailAllowed}
              </h4>
              <div className="flex flex-wrap gap-2">
                {allowedThemes.map((ct) => (
                  <Badge key={ct.theme_key} variant="secondary" className="text-xs py-1 px-2">
                    {getLabel(ct.labels)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Not allowed themes */}
          {notAllowedThemes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
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
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <h4 className="text-sm font-semibold text-destructive mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {t.guardrailGlobalExclusions}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">{t.guardrailGlobalExclusionsDesc}</p>
              <div className="flex flex-wrap gap-2">
                {globalExclusions.map((ct) => (
                  <Badge key={ct.theme_key} variant="destructive" className="text-xs py-1 px-2">
                    {getLabel(ct.labels)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full btn-primary-kid"
        size="lg"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? t.saving : t.save}
      </Button>
    </div>
  );
};

export default ParentSettingsPanel;
