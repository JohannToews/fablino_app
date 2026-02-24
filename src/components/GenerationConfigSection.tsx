import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Settings2, Clock, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  type GenerationConfigRow,
  type RateLimitRow,
  AGE_GROUPS,
  STORY_LENGTHS,
  useGenerationConfig,
} from "@/hooks/useGenerationConfig";

const LENGTH_EMOJIS: Record<string, string> = {
  short: "📖",
  medium: "📚",
  long: "📚📚",
  extra_long: "📚📚📚",
};

const LENGTH_LABELS_DE: Record<string, string> = {
  short: "Kurz",
  medium: "Mittel",
  long: "Lang",
  extra_long: "Extra Lang",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  beta: "Beta",
};

interface LengthFactors {
  short: number;
  medium: number;
  long: number;
  extra_long: number;
}

const DEFAULT_FACTORS: LengthFactors = { short: 0.7, medium: 1.0, long: 1.5, extra_long: 2.0 };

const GenerationConfigSection = () => {
  const { configs, rateLimits, isLoading, saveConfigs, saveRateLimits } = useGenerationConfig();

  const [localConfigs, setLocalConfigs] = useState<GenerationConfigRow[]>([]);
  const [localLimits, setLocalLimits] = useState<RateLimitRow[]>([]);
  const [factors, setFactors] = useState<LengthFactors>(DEFAULT_FACTORS);
  const [activeTab, setActiveTab] = useState<string>("6-7");
  const [isSaving, setIsSaving] = useState(false);
  const [factorsLoading, setFactorsLoading] = useState(true);

  // Load length factors from app_settings
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("app_settings")
          .select("value")
          .eq("key", "length_factors")
          .single();
        if (data?.value) {
          setFactors(JSON.parse(data.value));
        }
      } catch {
        // use defaults
      } finally {
        setFactorsLoading(false);
      }
    })();
  }, []);

  // Sync from DB
  useEffect(() => {
    if (!isLoading) {
      setLocalConfigs(structuredClone(configs));
      setLocalLimits(structuredClone(rateLimits));
    }
  }, [isLoading, configs, rateLimits]);

  // Get base (medium) row for age group
  const getBaseRow = (ageGroup: string) =>
    localConfigs.find((c) => c.age_group === ageGroup && c.story_length === "medium");

  const getRow = (ageGroup: string, storyLength: string) =>
    localConfigs.find((c) => c.age_group === ageGroup && c.story_length === storyLength);

  // Update base min/max for an age group (updates the medium row)
  const updateBase = (ageGroup: string, field: "min_words" | "max_words", value: number) => {
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.age_group === ageGroup && c.story_length === "medium"
          ? { ...c, [field]: value }
          : c
      )
    );
  };

  const updateConfig = (ageGroup: string, storyLength: string, field: keyof GenerationConfigRow, value: any) => {
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.age_group === ageGroup && c.story_length === storyLength
          ? { ...c, [field]: value }
          : field === "is_default" && value === true && c.age_group === ageGroup
            ? { ...c, is_default: false }
            : c
      )
    );
  };

  const updateLimit = (planType: string, field: keyof RateLimitRow, value: any) => {
    setLocalLimits((prev) =>
      prev.map((l) => (l.plan_type === planType ? { ...l, [field]: value } : l))
    );
  };

  // Compute derived word counts for preview
  const computedWords = useMemo(() => {
    const base = getBaseRow(activeTab);
    if (!base) return {};
    const result: Record<string, { min: number; max: number }> = {};
    for (const sl of STORY_LENGTHS) {
      const f = factors[sl as keyof LengthFactors] ?? 1.0;
      result[sl] = {
        min: Math.round(base.min_words * f),
        max: Math.round(base.max_words * f),
      };
    }
    return result;
  }, [localConfigs, activeTab, factors]);

  const handleSave = async () => {
    // Compute actual min/max from base * factors and update all rows
    const updatedConfigs = localConfigs.map((c) => {
      const base = localConfigs.find((b) => b.age_group === c.age_group && b.story_length === "medium");
      if (!base) return c;
      const f = factors[c.story_length as keyof LengthFactors] ?? 1.0;
      return {
        ...c,
        min_words: Math.round(base.min_words * f),
        max_words: Math.round(base.max_words * f),
      };
    });

    setIsSaving(true);
    try {
      await saveConfigs(updatedConfigs);
      await saveRateLimits(localLimits);

      // Save factors to app_settings
      await (supabase as any)
        .from("app_settings")
        .update({ value: JSON.stringify(factors), updated_at: new Date().toISOString() })
        .eq("key", "length_factors");

      setLocalConfigs(updatedConfigs);
      toast.success("Konfiguration gespeichert!");
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || factorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const baseRow = getBaseRow(activeTab);
  const tabLengths = STORY_LENGTHS.filter((sl) => getRow(activeTab, sl));

  return (
    <div className="space-y-6">
      {/* ── Text Length Base Config ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Textlänge – Basis-Konfiguration
          </CardTitle>
          <CardDescription>
            Min/Max Wörter pro Altersgruppe (Basis = „Mittel"). Andere Längen werden per Faktor berechnet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab Bar */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag}
                onClick={() => setActiveTab(ag)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  activeTab === ag
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {ag} Jahre
              </button>
            ))}
          </div>

          {/* Base min/max for selected age group */}
          {baseRow && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Wörter (Basis)</Label>
                <Input
                  type="number"
                  className="h-9 text-center"
                  value={baseRow.min_words}
                  onChange={(e) => updateBase(activeTab, "min_words", Math.max(50, Number(e.target.value) || 50))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Wörter (Basis)</Label>
                <Input
                  type="number"
                  className="h-9 text-center"
                  value={baseRow.max_words}
                  onChange={(e) => updateBase(activeTab, "max_words", Math.max(baseRow.min_words + 50, Number(e.target.value) || baseRow.min_words + 50))}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Length Factors */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Längenfaktoren
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {(["short", "long", "extra_long"] as const).map((key) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">{LENGTH_EMOJIS[key]} {LENGTH_LABELS_DE[key]}</p>
                  <Input
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={5}
                    className="h-8 text-center text-sm"
                    value={factors[key]}
                    onChange={(e) => setFactors((prev) => ({ ...prev, [key]: Math.max(0.1, Number(e.target.value) || 0.1) }))}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">{LENGTH_EMOJIS.medium} Mittel</p>
                <Input
                  type="number"
                  className="h-8 text-center text-sm bg-muted"
                  value={1.0}
                  disabled
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Computed preview */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Berechnete Wortbereiche ({activeTab} Jahre)</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              {tabLengths.map((sl) => {
                const w = computedWords[sl];
                return (
                  <div key={sl} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{LENGTH_EMOJIS[sl]} {LENGTH_LABELS_DE[sl]}</p>
                    <p className="font-mono font-bold">{w ? `${w.min}–${w.max}` : "—"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Image & Reading Config per length ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Bilder & Lesezeit
          </CardTitle>
          <CardDescription>
            Szenen-Bilder, Cover, Lesezeit und Defaults nach Länge ({activeTab} Jahre).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-32"></th>
                  {tabLengths.map((sl) => (
                    <th key={sl} className="text-center py-2 px-2 font-medium">
                      {LENGTH_EMOJIS[sl]} {LENGTH_LABELS_DE[sl]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Scene Images */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Szenen-Bilder</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input type="number" className="w-16 mx-auto text-center h-8 text-sm" min={1} max={8}
                          value={row.scene_image_count}
                          onChange={(e) => updateConfig(activeTab, sl, "scene_image_count", Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Cover */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Cover</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input type="checkbox" checked={row.include_cover}
                          onChange={(e) => updateConfig(activeTab, sl, "include_cover", e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Total Images */}
                <tr className="border-b bg-muted/30">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Gesamt Bilder</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center font-mono font-bold">
                        {row.scene_image_count + (row.include_cover ? 1 : 0)}
                      </td>
                    );
                  })}
                </tr>

                {/* Reading Time */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Lesezeit (min)</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input type="number" className="w-16 mx-auto text-center h-8 text-sm" min={1}
                          value={row.estimated_reading_minutes}
                          onChange={(e) => updateConfig(activeTab, sl, "estimated_reading_minutes", Math.max(1, Number(e.target.value) || 1))}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Active */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Aktiv</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input type="checkbox" checked={row.is_active}
                          onChange={(e) => updateConfig(activeTab, sl, "is_active", e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Default */}
                <tr>
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Vorauswahl ★</td>
                  {tabLengths.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input type="radio" name={`default-${activeTab}`} checked={row.is_default}
                          onChange={() => updateConfig(activeTab, sl, "is_default", true)}
                          className="h-4 w-4 accent-primary"
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Rate Limits ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tägliche Limits
          </CardTitle>
          <CardDescription>Maximale Stories pro Tag nach Plan-Typ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localLimits.map((limit) => (
            <div key={limit.id} className="flex items-center gap-4">
              <Label className="w-24 font-medium">{PLAN_LABELS[limit.plan_type] || limit.plan_type}</Label>
              <div className="flex items-center gap-2">
                <Input type="number" className="w-20 h-8 text-sm text-center" min={1} max={50}
                  value={limit.max_stories_per_day}
                  onChange={(e) => updateLimit(limit.plan_type, "max_stories_per_day", Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                />
                <span className="text-sm text-muted-foreground">Stories/Tag</span>
              </div>
              {limit.plan_type === "beta" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">max</span>
                  <Input type="number" className="w-16 h-8 text-sm text-center" min={1} max={20}
                    value={limit.max_stories_per_kid_per_day ?? ""}
                    onChange={(e) => updateLimit(limit.plan_type, "max_stories_per_kid_per_day", Number(e.target.value) || null)}
                  />
                  <span className="text-sm text-muted-foreground">pro Kind</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Save Button ── */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 text-base font-semibold shadow-lg" size="lg">
        {isSaving ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Speichern…</>
        ) : (
          <><Save className="h-5 w-5 mr-2" />Konfiguration speichern</>
        )}
      </Button>
    </div>
  );
};

export default GenerationConfigSection;
