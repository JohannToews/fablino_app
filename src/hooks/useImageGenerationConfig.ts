import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Available model options ──
export const IMAGE_MODEL_OPTIONS = [
  { value: "imagen-4.0-fast-generate-001", label: "Fast", costPerImage: 0.02 },
  { value: "imagen-4.0-generate-001", label: "Standard", costPerImage: 0.04 },
  { value: "imagen-4.0-ultra-generate-001", label: "Ultra", costPerImage: 0.06 },
] as const;

export type ImageModelId = typeof IMAGE_MODEL_OPTIONS[number]["value"];

export interface ImagenModelsConfig {
  cover: { model: ImageModelId; label: string; cost_per_image: number };
  scene: { model: ImageModelId; label: string; cost_per_image: number };
}

export interface GenerationLimitsConfig {
  max_images_per_story: number;
  max_stories_per_day_free: number;
  max_stories_per_day_premium: number;
}

// ── Defaults (used when DB fetch fails) ──
const DEFAULT_MODELS: ImagenModelsConfig = {
  cover: { model: "imagen-4.0-generate-001", label: "Standard", cost_per_image: 0.04 },
  scene: { model: "imagen-4.0-fast-generate-001", label: "Fast", cost_per_image: 0.02 },
};

const DEFAULT_LIMITS: GenerationLimitsConfig = {
  max_images_per_story: 4,
  max_stories_per_day_free: 2,
  max_stories_per_day_premium: 10,
};

export function useImageGenerationConfig() {
  const [models, setModels] = useState<ImagenModelsConfig>(DEFAULT_MODELS);
  const [limits, setLimits] = useState<GenerationLimitsConfig>(DEFAULT_LIMITS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await (supabase as any)
        .from("image_generation_config")
        .select("config_key, config_value");

      if (fetchErr) {
        console.error("[ImageConfig] Fetch error:", fetchErr.message);
        setError(fetchErr.message);
        // Keep defaults
        setIsLoading(false);
        return;
      }

      if (data && Array.isArray(data)) {
        for (const row of data) {
          if (row.config_key === "imagen_models" && row.config_value) {
            setModels(row.config_value as ImagenModelsConfig);
          }
          if (row.config_key === "generation_limits" && row.config_value) {
            setLimits(row.config_value as GenerationLimitsConfig);
          }
        }
      }
    } catch (err: any) {
      console.error("[ImageConfig] Unexpected error:", err);
      setError(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Convenience accessors
  const coverModel = models.cover.model;
  const sceneModel = models.scene.model;

  // Save config to DB
  const saveModels = useCallback(async (newModels: ImagenModelsConfig) => {
    const { error: saveErr } = await (supabase as any)
      .from("image_generation_config")
      .update({
        config_value: newModels,
        updated_at: new Date().toISOString(),
      })
      .eq("config_key", "imagen_models");

    if (saveErr) throw new Error(saveErr.message);
    setModels(newModels);
  }, []);

  const saveLimits = useCallback(async (newLimits: GenerationLimitsConfig) => {
    const { error: saveErr } = await (supabase as any)
      .from("image_generation_config")
      .update({
        config_value: newLimits,
        updated_at: new Date().toISOString(),
      })
      .eq("config_key", "generation_limits");

    if (saveErr) throw new Error(saveErr.message);
    setLimits(newLimits);
  }, []);

  return {
    models,
    limits,
    coverModel,
    sceneModel,
    isLoading,
    error,
    saveModels,
    saveLimits,
    reload: loadConfig,
  };
}
