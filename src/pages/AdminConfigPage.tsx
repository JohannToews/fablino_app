import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Image, Save, Loader2, DollarSign, Gauge, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useImageGenerationConfig,
  IMAGE_MODEL_OPTIONS,
  ImageModelId,
  ImagenModelsConfig,
  GenerationLimitsConfig,
} from "@/hooks/useImageGenerationConfig";

const AdminConfigPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const {
    models,
    limits,
    isLoading: configLoading,
    saveModels,
    saveLimits,
  } = useImageGenerationConfig();

  // ── Local form state (initialized from DB) ──
  const [coverModel, setCoverModel] = useState<ImageModelId>("imagen-4.0-generate-001");
  const [sceneModel, setSceneModel] = useState<ImageModelId>("imagen-4.0-fast-generate-001");
  const [maxImages, setMaxImages] = useState(4);
  const [maxFree, setMaxFree] = useState(2);
  const [maxPremium, setMaxPremium] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  // Sync DB → local state when config loads
  useEffect(() => {
    if (!configLoading) {
      setCoverModel(models.cover.model);
      setSceneModel(models.scene.model);
      setMaxImages(limits.max_images_per_story);
      setMaxFree(limits.max_stories_per_day_free);
      setMaxPremium(limits.max_stories_per_day_premium);
    }
  }, [configLoading, models, limits]);

  // ── Cost calculations ──
  const getModelCost = (modelId: ImageModelId) =>
    IMAGE_MODEL_OPTIONS.find((m) => m.value === modelId)?.costPerImage ?? 0.04;

  const getModelLabel = (modelId: ImageModelId) =>
    IMAGE_MODEL_OPTIONS.find((m) => m.value === modelId)?.label ?? "Unknown";

  const costPerStory = useMemo(() => {
    const coverCost = getModelCost(coverModel) * 1;
    const sceneCost = getModelCost(sceneModel) * Math.max(0, maxImages - 1);
    return coverCost + sceneCost;
  }, [coverModel, sceneModel, maxImages]);

  const costPerUserMonth = useMemo(() => {
    return costPerStory * 20; // estimated 20 stories/month
  }, [costPerStory]);

  // ── Save handler ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newModels: ImagenModelsConfig = {
        cover: {
          model: coverModel,
          label: getModelLabel(coverModel),
          cost_per_image: getModelCost(coverModel),
        },
        scene: {
          model: sceneModel,
          label: getModelLabel(sceneModel),
          cost_per_image: getModelCost(sceneModel),
        },
      };

      const newLimits: GenerationLimitsConfig = {
        max_images_per_story: maxImages,
        max_stories_per_day_free: maxFree,
        max_stories_per_day_premium: maxPremium,
      };

      await saveModels(newModels);
      await saveLimits(newLimits);

      toast.success("Konfiguration gespeichert!");
    } catch (err: any) {
      console.error("[AdminConfig] Save error:", err);
      toast.error("Fehler beim Speichern: " + (err.message || "Unbekannt"));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading state ──
  if (authLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Access denied ──
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Zugriff verweigert</p>
        <p className="text-sm text-muted-foreground">Nur Admins können diese Seite sehen.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Zurück zur Startseite
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Bildgenerierung – Konfiguration</h1>
          <p className="text-xs text-muted-foreground">Modelle, Kosten & Limits</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* ── Section 1: Imagen Model Configuration ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagen Modell-Konfiguration
            </CardTitle>
            <CardDescription>
              Wähle die Modelle für Cover- und Szenen-Bilder. Höhere Qualität = höhere Kosten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Model */}
            <div className="space-y-2">
              <Label htmlFor="cover-model">Cover-Bild Modell</Label>
              <Select value={coverModel} onValueChange={(v) => setCoverModel(v as ImageModelId)}>
                <SelectTrigger id="cover-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — ${opt.costPerImage.toFixed(2)}/Bild
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                1× Cover pro Story
              </p>
            </div>

            {/* Scene Model */}
            <div className="space-y-2">
              <Label htmlFor="scene-model">Szenen-Bild Modell</Label>
              <Select value={sceneModel} onValueChange={(v) => setSceneModel(v as ImageModelId)}>
                <SelectTrigger id="scene-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — ${opt.costPerImage.toFixed(2)}/Bild
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {Math.max(0, maxImages - 1)}× Szenen pro Story
              </p>
            </div>

            <Separator />

            {/* Cost estimation */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Geschätzte Kosten
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Pro Story</p>
                  <p className="font-mono font-bold text-lg">${costPerStory.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pro User/Monat (≈20 Stories)</p>
                  <p className="font-mono font-bold text-lg">${costPerUserMonth.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Berechnung: 1× Cover ({getModelLabel(coverModel)} ${getModelCost(coverModel).toFixed(2)}) + {Math.max(0, maxImages - 1)}× Szene ({getModelLabel(sceneModel)} ${getModelCost(sceneModel).toFixed(2)})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Generation Limits ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Generierungs-Limits
            </CardTitle>
            <CardDescription>
              Begrenze die Nutzung pro Story und pro Tag.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="max-images">Max Bilder pro Story</Label>
              <Input
                id="max-images"
                type="number"
                min={1}
                max={6}
                value={maxImages}
                onChange={(e) => setMaxImages(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">1 Cover + {Math.max(0, maxImages - 1)} Szenen (1–6)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-free">Max Stories/Tag (Free)</Label>
              <Input
                id="max-free"
                type="number"
                min={1}
                max={10}
                value={maxFree}
                onChange={(e) => setMaxFree(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Kostenlose User (1–10)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-premium">Max Stories/Tag (Premium)</Label>
              <Input
                id="max-premium"
                type="number"
                min={1}
                max={50}
                value={maxPremium}
                onChange={(e) => setMaxPremium(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">Premium User (1–50)</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Save Button ── */}
        <div className="sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 text-base font-semibold shadow-lg"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Speichern…
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Konfiguration speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfigPage;
