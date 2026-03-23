/**
 * FSE3 TypeScript Interfaces
 *
 * All type definitions for the FSE3 multi-pass story generation pipeline.
 * Covers: Interpreter, Blueprint, Pipeline Context, Language Config, Pass Timing.
 */

// --- Interpreter ---

export interface FSE3InterpreterRequest {
  kidName: string;
  kidAge: number;
  kidGender: string;
  storyType: string;
  characters: Array<{
    name: string;
    type: string;
    age?: string;
    gender?: string;
    role: string;
    relation?: string;
    description?: string;
  }>;
  villain?: {
    name: string;
    description: string;
    type: string;
  };
  additionalDescription: string;
  specialAttributes: string[];
  storyLanguage: string;
  readingLevel: number;
}

export interface FSE3Variant {
  id: "A" | "B" | "C";
  visible: {
    emoji: string;
    title: string;
    teaser: string;
  };
  routing: {
    em_driver: string; // "spannung" | "humor" | "gefühl" | "staunen"
    primary_driver: "humor" | "suspense" | "empathy" | "adventure";
    subtype_key: string;
    conflict_type: string;
    one_line_summary: string;
  };
}

export interface FSE3InterpreterResult {
  variants: FSE3Variant[];
}

// --- Blueprint (Pass 0 Output) ---

export interface FSE3Blueprint {
  path_code: string;
  emotional_coloring: string;
  emotional_secondary: string;
  world_rule: string;
  setup_objects: string[];
  plot_skeleton: string[];
  forbidden_in_writer: string[];
  state_tracking: Record<string, Record<string, string>>;
  causality_check: {
    p6_resolution_steps: string;
    fire_trajectory: string;
    defeat_mechanism: string;
  };
  self_check: {
    setup_payoff_map: Array<{
      object: string;
      introduced_in: string;
      payoff_in: string;
    }>;
    p6_resolver: string;
    all_state_transitions_consistent: boolean;
    p6_physically_possible: boolean;
  };
}

// --- Pipeline Context ---

export interface FSE3PipelineContext {
  // From Wizard
  kidProfileId: string;
  storyLanguage: string;
  readingLevel: number;
  theme: string;
  characters: any[];
  villain: any | null;
  freeText: string;
  specialEffects: string;
  storyLength: string;
  includeSelf: boolean;
  imageStyleKey: string;

  // From DB
  kidName: string;
  kidAge: number;
  kidGender: string;
  kidAppearanceAnchor: string;
  characterAnchors: any[];
  languageConfig: FSE3LanguageConfig;
  availableSubtypes: any[];
  availablePaths: any[];
  wordCountTarget: number;
  paragraphCount: number;
  sceneCount: number;
  generationConfig: any;
  promptTemplates: Record<string, string>;
  systemPrompts: Record<string, string>;
  emCodeMapping: Record<string, { label: string; description: string }>;

  // From Interpreter
  chosenVariant: FSE3Variant;
  interpreterResult: FSE3InterpreterResult;

  // From Pipeline (accumulated)
  blueprint?: FSE3Blueprint;
  worldRule?: string;
  pass1Output?: string;
  pass2Output?: string;
  pass3Output?: string;
  storyTitle?: string;
}

// --- Language Config ---

export interface FSE3LanguageConfig {
  language_code: string;
  level: number;
  tense_rules: string;
  tense_example: string;
  max_sentence_length: number;
  avg_sentence_length: number;
  vocabulary_guidance: string;
  adjective_limit: number;
  additional_rules: string;
  dialogue_format: string;
  dialogue_example_spoken: string;
  dialogue_example_thought: string;
  rhythm_example_right: string;
  rhythm_example_wrong: string;
  scenic_example_right: string;
  scenic_example_wrong: string;
}

// --- Pass Timing ---

export interface FSE3PassTiming {
  interpreter_ms: number;
  pass0_ms: number;
  pass1_ms: number;
  pass2_ms: number;
  pass3_ms: number;
  pass4_ms: number;
  visual_director_ms: number;
  image_generation_ms: number;
  total_ms: number;
}
