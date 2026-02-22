import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Settings2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTranslations, type Language } from "@/lib/translations";
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

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  beta: "Beta",
};

const GenerationConfigSection = () => {
  const { configs, rateLimits, isLoading, saveConfigs, saveRateLimits } = useGenerationConfig();

  const [localConfigs, setLocalConfigs] = useState<GenerationConfigRow[]>([]);
  const [localLimits, setLocalLimits] = useState<RateLimitRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>("6-7");
  const [isSaving, setIsSaving] = useState(false);

  // Sync from DB
  useEffect(() => {
    if (!isLoading) {
      setLocalConfigs(structuredClone(configs));
      setLocalLimits(structuredClone(rateLimits));
    }
  }, [isLoading, configs, rateLimits]);

  const getRow = (ageGroup: string, storyLength: string) =>
    localConfigs.find((c) => c.age_group === ageGroup && c.story_length === storyLength);

  const updateConfig = (ageGroup: string, storyLength: string, field: keyof GenerationConfigRow, value: any) => {
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.age_group === ageGroup && c.story_length === storyLength
          ? { ...c, [field]: value }
          : field === "is_default" && value === true && c.age_group === ageGroup
            ? { ...c, is_default: false } // only one default per age group
            : c
      )
    );
  };

  const updateLimit = (planType: string, field: keyof RateLimitRow, value: any) => {
    setLocalLimits((prev) =>
      prev.map((l) => (l.plan_type === planType ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async () => {
    // Validate
    for (const c of localConfigs) {
      if (c.min_words >= c.max_words) {
        toast.error(`${c.age_group} / ${c.story_length}: min_words muss < max_words sein`);
        return;
      }
      if (c.scene_image_count < 1) {
        toast.error(`${c.age_group} / ${c.story_length}: Mindestens 1 Szenen-Bild`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveConfigs(localConfigs);
      await saveRateLimits(localLimits);
      toast.success("Konfiguration gespeichert!");
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabRows = localConfigs
    .filter((c) => c.age_group === activeTab)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      {/* ── Generation Config Matrix ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Generierungs-Konfiguration
          </CardTitle>
          <CardDescription>
            Wort- und Bilderanzahl nach Altersgruppe und Story-Länge.
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

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-32"></th>
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row && sl === "extra_long" && activeTab === "6-7") {
                      return (
                        <th key={sl} className="text-center py-2 px-2 font-medium text-muted-foreground/40">
                          {LENGTH_EMOJIS[sl]} Extra Lang
                        </th>
                      );
                    }
                    return (
                      <th key={sl} className="text-center py-2 px-2 font-medium">
                        {LENGTH_EMOJIS[sl]}{" "}
                        {sl === "short" ? "Kurz" : sl === "medium" ? "Mittel" : sl === "long" ? "Lang" : "Extra Lang"}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Min Words */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Min Wörter</td>
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center h-8 text-sm"
                          value={row.min_words}
                          onChange={(e) => updateConfig(activeTab, sl, "min_words", Math.max(50, Number(e.target.value) || 50))}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Max Words */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Max Wörter</td>
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input
                          type="number"
                          className="w-20 mx-auto text-center h-8 text-sm"
                          value={row.max_words}
                          onChange={(e) => updateConfig(activeTab, sl, "max_words", Math.max(row.min_words + 50, Number(e.target.value) || row.min_words + 50))}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Scene Images */}
                <tr className="border-b">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Szenen-Bilder</td>
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input
                          type="number"
                          className="w-16 mx-auto text-center h-8 text-sm"
                          min={1}
                          max={8}
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
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input
                          type="checkbox"
                          checked={row.include_cover}
                          onChange={(e) => updateConfig(activeTab, sl, "include_cover", e.target.checked)}
                          className="h-4 w-4 accent-orange-500"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Total Images (computed) */}
                <tr className="border-b bg-muted/30">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Gesamt Bilder</td>
                  {STORY_LENGTHS.map((sl) => {
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
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <Input
                          type="number"
                          className="w-16 mx-auto text-center h-8 text-sm"
                          min={1}
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
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={(e) => updateConfig(activeTab, sl, "is_active", e.target.checked)}
                          className="h-4 w-4 accent-orange-500"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Default (radio — one per age group) */}
                <tr>
                  <td className="py-2 pr-3 font-medium text-muted-foreground">Vorauswahl ★</td>
                  {STORY_LENGTHS.map((sl) => {
                    const row = getRow(activeTab, sl);
                    if (!row) return <td key={sl} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                    return (
                      <td key={sl} className="py-2 px-1 text-center">
                        <input
                          type="radio"
                          name={`default-${activeTab}`}
                          checked={row.is_default}
                          onChange={() => updateConfig(activeTab, sl, "is_default", true)}
                          className="h-4 w-4 accent-orange-500"
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
          <CardDescription>
            Maximale Stories pro Tag nach Plan-Typ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localLimits.map((limit) => (
            <div key={limit.id} className="flex items-center gap-4">
              <Label className="w-24 font-medium">{PLAN_LABELS[limit.plan_type] || limit.plan_type}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-20 h-8 text-sm text-center"
                  min={1}
                  max={50}
                  value={limit.max_stories_per_day}
                  onChange={(e) => updateLimit(limit.plan_type, "max_stories_per_day", Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                />
                <span className="text-sm text-muted-foreground">Stories/Tag</span>
              </div>
              {limit.plan_type === "beta" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">max</span>
                  <Input
                    type="number"
                    className="w-16 h-8 text-sm text-center"
                    min={1}
                    max={20}
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
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-12 text-base font-semibold shadow-lg"
        size="lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {getTranslations('de' as Language).saving}
          </>
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            {getTranslations('de' as Language).saveConfig}
          </>
        )}
      </Button>
    </div>
  );
};

export default GenerationConfigSection;
