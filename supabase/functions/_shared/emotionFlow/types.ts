/**
 * Emotion-Flow-Engine — Type Definitions
 *
 * All TypeScript interfaces for the new engine.
 * These map directly to the DB schema defined in the blueprint.
 */

// ─── Enums / Union Types ────────────────────────────────────────

export type IntensityLevel = 'light' | 'medium' | 'deep';

export type ToneMode = 'dramatic' | 'comedic' | 'adventurous' | 'gentle' | 'absurd';

export type BlueprintCategory = 'growth' | 'social' | 'courage' | 'empathy' | 'humor' | 'wonder';

export type SeedType = 'protagonist_appearance' | 'sidekick_archetype' | 'antagonist_archetype';

export type CreatureType = 'human' | 'mythical';

export type Gender = 'female' | 'male' | 'neutral';

export type AgeGroup = '6-7' | '8-9' | '10-11' | '12+';

export type ElementType =
  | 'opening_style'
  | 'narrative_perspective'
  | 'macguffin'
  | 'setting_detail'
  | 'humor_technique'
  | 'tension_technique'
  | 'closing_style';

export type CharacterMode = 'self' | 'family' | 'surprise';

// ─── DB Row Interfaces ──────────────────────────────────────────

export interface ArcByAgeEntry {
  steps: number;
  arc: string[];
  arc_prompt: string;
}

export interface EmotionBlueprint {
  id: string;
  blueprint_key: string;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  category: BlueprintCategory;
  arc_by_age: Record<string, ArcByAgeEntry>;
  arc_description_en: string;
  tone_guidance: string | null;
  tension_curve: string | null;
  surprise_moment: string | null;
  ending_feeling: string | null;
  compatible_themes: string[] | null;
  ideal_age_groups: AgeGroup[];
  min_intensity: IntensityLevel;
  compatible_learning_themes: string[] | null;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CharacterSeed {
  id: string;
  seed_key: string;
  seed_type: SeedType;
  creature_type: CreatureType;
  labels: Record<string, string>;
  appearance_en: string | null;
  personality_trait_en: string | null;
  weakness_en: string | null;
  strength_en: string | null;
  cultural_background: string | null;
  gender: Gender;
  age_range: AgeGroup[];
  name_pool: Record<string, string[]> | null;
  compatible_themes: string[] | null;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryElement {
  id: string;
  element_key: string;
  element_type: ElementType;
  content_en: string;
  labels: Record<string, string> | null;
  compatible_themes: string[] | null;
  compatible_categories: BlueprintCategory[] | null;
  age_groups: AgeGroup[];
  weight: number;
  is_active: boolean;
  created_at: string;
}

// ─── Selection Result Interfaces ────────────────────────────────

export interface SelectedElements {
  opening: StoryElement;
  perspective: StoryElement;
  macguffin: StoryElement | null;
  settingDetail: StoryElement | null;
  humorTechnique: StoryElement | null;
  tensionTechnique: StoryElement | null;
  closing: StoryElement;
}

export interface SelectedCharacters {
  protagonist: CharacterSeed | null;
  sidekick: CharacterSeed;
  antagonist: CharacterSeed | null;
}

export interface PromptBlocks {
  arcBlock: string;
  toneBlock: string;
  characterBlock: string;
  elementBlocks: string;
  criticalRules: string;
}

export interface EmotionFlowMetadata {
  blueprintKey: string | null;
  toneMode: ToneMode;
  intensityLevel: IntensityLevel;
  characterSeedKey: string | null;
  sidekickSeedKey: string;
  antagonistSeedKey: string | null;
  openingElementKey: string;
  perspectiveElementKey: string;
}

export interface EmotionFlowResult {
  intensity: IntensityLevel;
  blueprint: EmotionBlueprint | null;
  tone: ToneMode;
  protagonistSeed: CharacterSeed | null;
  sidekickSeed: CharacterSeed;
  antagonistSeed: CharacterSeed | null;
  elements: SelectedElements;
  promptBlocks: PromptBlocks;
  metadata: EmotionFlowMetadata;
}

// ─── Input Param Interfaces ─────────────────────────────────────

export interface BlueprintSelectorParams {
  kidProfileId: string;
  ageGroup: AgeGroup;
  theme: string;
  intensity: IntensityLevel;
  learningTheme?: string;
}

export interface ToneSelectorParams {
  kidProfileId: string;
  ageGroup: AgeGroup;
  blueprintCategory?: BlueprintCategory;
}

export interface CharacterSelectorParams {
  kidProfileId: string;
  ageGroup: AgeGroup;
  theme: string;
  characterMode: CharacterMode;
  blueprintCategory?: BlueprintCategory;
}

export interface ElementSelectorParams {
  kidProfileId: string;
  ageGroup: AgeGroup;
  theme: string;
  intensity: IntensityLevel;
  tone: ToneMode;
  blueprintCategory?: BlueprintCategory;
}

export interface EngineParams {
  kidProfileId: string;
  ageGroup: AgeGroup;
  theme: string;
  characterMode: CharacterMode;
  kidProfile: { name: string; age: number; appearance?: string };
  selectedCharacters: Array<{ name: string; relation?: string; description?: string }>;
  learningTheme?: string;
}

// Minimal Supabase client shape used by selectors (no import from @supabase).
// Real createClient() return value satisfies this interface.
// Chainable .eq() so select().eq().eq().eq().limit() type-checks.
export interface EmotionFlowQueryChain {
  eq(column: string, value: unknown): EmotionFlowQueryChain;
  order(column: string, options?: { ascending?: boolean }): { limit(n: number): Promise<{ data: unknown; error: unknown }> };
  limit(n: number): Promise<{ data: unknown; error: unknown }>;
  in(column: string, values: unknown[]): { limit(n: number): Promise<{ data: unknown; error: unknown }> };
}

export interface EmotionFlowSupabase {
  from(table: string): {
    select(columns?: string): {
      eq(column: string, value: unknown): EmotionFlowQueryChain;
      order(column: string, options?: { ascending?: boolean }): { limit(n: number): Promise<{ data: unknown; error: unknown }> };
      limit(n: number): Promise<{ data: unknown; error: unknown }>;
      in(column: string, values: unknown[]): { limit(n: number): Promise<{ data: unknown; error: unknown }> };
    };
  };
}
