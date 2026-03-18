# FSE3 Implementation-Ready — Finales Handoff für Claude Code

> Stand: 2026-03-17
> Status: Alle Entscheidungen getroffen, alle Annahmen per Code-Audit validiert
> Ziel: Dieses Dokument + die 4 Seed-Dokumente (prompt-templates, language-config, findings, e2e-tests) reichen aus um FSE3 zu implementieren.

---

## 1. Was ist FSE3?

Multi-Pass Story-Generation Pipeline die das Constraint-Konkurrenz-Problem von FSE2 löst. Statt 15+ Regeln in 2 LLM-Calls werden sie auf 6 spezialisierte Calls verteilt (Interpreter + Pass 0-4), je 3-5 Regeln.

### Pipeline (final, mit Parallelisierung)

```
Frontend Wizard (effects → image-style → variant-selection → generating)
    ↓
/interpret-story-input (synchron, ~10s, Kind sieht Ladescreen)
    ↓
Kind wählt aus 3 Kacheln (Spannend / Lustig / Gefühl|Staunen)
    ↓
/generate-story mit FSE3-Flag (fire-and-forget, 202)
    ↓
Pass 0 — Blueprint + State-Tracking (~8s)
    ↓
Pass 1 — Story Writer (~10s)
    ↓
    ├── TEXT-BRANCH (sequentiell)        ├── BILD-BRANCH (parallel)
    │   Pass 2 — Language (~7s)          │   Visual Director (~8s)
    │   Pass 3 — Style + Dialog (~7s)    │   Image Generation (~15s)
    │   Pass 4 — JSON Wrapper (~4s)      │
    ↓                                     ↓
    └──────────── JOIN ──────────────────┘
                  ↓
         DB Write → status: complete
         (~41s total statt ~59s sequentiell)
```

### Warum VD nach Pass 1 parallel starten kann

Der Visual Director braucht: storyTitle, storyContent, storyLanguage, sceneCount, kidAge, kidAppearanceAnchor, characterAnchors. Alles nach Pass 1 verfügbar.

Pass 2/3 ändern nur Wörter/Grammatik/Stil — die visuellen Momente (Aktionen, Szenen, Objekte) bleiben identisch. Der VD identifiziert Szenen aus der Plot-Struktur, nicht aus dem exakten Wortlaut.

Pass 2/3 haben explizite Preservation Rules: "Plot, Charaktere, Setup/Payoff NICHT verändern." Risiko minimal.

---

## 2. Finale Entscheidungen

| # | Entscheidung | Beschluss | Begründung |
|---|-------------|-----------|------------|
| OE-1 | Interpreter Endpoint | Separater `/interpret-story-input` | generate-story hat 3800 Zeilen, nicht weiter aufblähen |
| OE-2 | Varianten-Speicherung | JSONB `fse3_interpreter_result` in stories (alle 3 Varianten) | Analytics: welche Varianten wählen Kids? |
| OE-3 | generation_status | ALTER CHECK Constraint, neue Werte hinzufügen | TEXT mit CHECK, kein ENUM — Migration einfach |
| OE-4 | Blueprint Mapping | Paths aus DB (`story_paths.label` + `writing_instructions`), EM-Codes als JSONB in `app_settings` | Nichts hardcoden |
| OE-5 | System Prompt | V3 als Basis für alle Passes, bei Bedarf pro Pass reduzieren | V3 ist plan-compliant, passt zu Pass 1. Pass 2-4 evtl. reduziert |
| OE-6 | Learning Theme | Komplett rausnehmen / Tab unsichtbar / auskommentieren | Komplexitätsreduktion, Phase 5 nachziehen |
| OE-7 | Varianten-Auswahl | 3 Kacheln, KEIN "Andere Vorschläge" Button. Var C alterniert Gefühl/Staunen | Einfach. Toggle per Story-Count (gerade/ungerade) |
| OE-8 | Pass-Timing | JSONB `fse3_pass_timing` in stories, pro Pass detailliert | Essentiell für Latenz-Optimierung |
| Flow | Wizard Reihenfolge | effects → image-style → variant-selection → generating | Bildstil vor Interpreter, Kind wartet nicht doppelt |
| Parallel | VD Start | Nach Pass 1, parallel zu Pass 2/3/4 | ~30% schneller, VD braucht nur Plot-Struktur |
| Humor | humorLevel | Raus bei FSE3 | Varianten-Auswahl steuert Tonalität direkt |
| Hobbies | kidHobbies | Erstmal raus | Kann später in Pass 1 nachgezogen werden |
| Image Pipeline | Kompatibilität | Unverändert — VD liest storyTitle + storyContent | Per Audit verifiziert: FSE3 Pass-4 liefert content + title |

---

## 3. Bestehende Architektur (Audit-verifiziert)

### Feature Flag Routing (generate-story/index.ts)

```typescript
// NEUE Reihenfolge (FSE3 VOR FSE2, ab ~Zeile 2064):
const fse3Enabled = await isFse3Enabled(userId, supabase);
if (fse3Enabled) {
  // FSE3 Pipeline (fire-and-forget, return 202)
  return runPipelineFSE3(req, supabase, body);
}

const fse2Enabled = await isFse2Enabled(userId, supabase);  // Zeile 2067
if (fse2Enabled) {
  // FSE2 Pipeline (bestehend)
}
// FSE1 weiter unten...
```

### stories.generation_status (TEXT mit CHECK)

Aktuelle Werte: `generating`, `checking`, `verified`, `error`, `text_complete`, `images_complete`, `text_failed`, `images_failed`

FSE3 fügt hinzu: `interpreter_pending`, `interpreter_done`, `variant_chosen`

HINWEIS: TypeScript-Typ in `useStoryRealtime.tsx` ist veraltet (nur 4 Werte) — MUSS repariert werden.

### Wizard Screen Flow (CreateStoryPage.tsx)

```
Aktuell (7 Screens):
"entry" | "story-type" | "characters" | "effects" | "villain" | "image-style" | "generating"

FSE3 (8 Screens):
"entry" | "story-type" | "characters" | "effects" | "villain" | "image-style" | "variant-selection" | "generating"
```

Einfügestelle: `handleImageStyleComplete` → `"variant-selection"` statt `"generating"` (wenn FSE3 Flag aktiv).

### Supabase Realtime Pattern

Fire-and-forget → Frontend wartet via `waitForStoryCompletion()` (Realtime + Polling-Fallback).

Terminal-Status in `storyGenerationHelper.ts`: `verified`, `images_partial`, `images_failed`, `text_failed`, `failed`.

FSE3: `text_complete` und `complete` als zusätzliche Terminal-Werte.

### Wiederverwendbare Shared Functions

| Funktion | Datei | FSE3 kann nutzen? |
|----------|-------|-------------------|
| `buildAppearanceAnchor()` | `_shared/appearanceAnchor.ts` | ✅ direkt importieren |
| `buildAnchorFromSlots()` | `_shared/appearanceAnchor.ts` | ✅ direkt importieren |
| `inferAgeCategory()` | `_shared/appearanceSlots.ts` | ✅ direkt importieren |
| `selectStorySubtype()` | `_shared/storySubtypeSelector.ts` | ✅ für Round-Robin nach Generierung |
| `callVisualDirector()` | `_shared/visualDirector.ts` | ✅ mit Pass-1-Output statt Story-JSON |
| `buildImagePrompts()` | `_shared/imagePromptBuilder.ts` | ✅ bekommt VD-Output wie bisher |
| Character Enrichment (DB-Queries + Anchor-Building) | `pipeline-fse2.ts` Z.645-788 | ⚠️ Inline in FSE2 — kopieren oder extrahieren |

---

## 4. Neue Dateien

### Backend (Supabase Edge Functions)

```
supabase/functions/
├── interpret-story-input/
│   └── index.ts                    # NEU: Interpreter Endpoint (synchron)
├── generate-story/
│   └── index.ts                    # EDIT: FSE3 Router-Branch einfügen (vor FSE2)
└── _shared/
    ├── pipelineFSE3.ts             # NEU: Haupt-Pipeline (orchestriert alle Passes)
    ├── fse3PromptBuilder.ts        # NEU: Template-Engine (Platzhalter + konditionale Blöcke)
    ├── fse3Types.ts                # NEU: TypeScript Interfaces
    └── fse3FeatureFlag.ts          # NEU: isFse3Enabled() (Pattern wie fse2FeatureFlag.ts)
```

### Frontend

```
src/
├── components/story-creation/
│   └── StoryVariantSelectionScreen.tsx  # NEU: 3 Kacheln
├── hooks/
│   └── useStoryFse3Enabled.ts          # NEU: Feature Flag Hook
└── pages/
    └── CreateStoryPage.tsx             # EDIT: Neuer Screen + Interpreter-Call
```

### Datenbank (Migrationen)

```
supabase/migrations/
├── 20260318_fse3_prompt_templates.sql      # NEU: Tabelle + Seed
├── 20260318_fse3_language_config.sql       # NEU: Tabelle + Seed
├── 20260318_fse3_feature_flag.sql          # NEU: app_settings Einträge
├── 20260318_fse3_stories_columns.sql       # NEU: Neue Spalten + Status-Werte
└── 20260318_fse3_em_code_mapping.sql       # NEU: app_settings JSONB
```

---

## 5. DB-Migrationen (komplett)

### Migration 1: fse3_prompt_templates

```sql
CREATE TABLE IF NOT EXISTS fse3_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_name TEXT NOT NULL UNIQUE,
  system_prompt_key TEXT NOT NULL DEFAULT 'system_prompt_core_v3',
  prompt_template TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES user_profiles(id)
);

-- Trigger für updated_at
CREATE TRIGGER update_fse3_prompt_templates_updated_at
  BEFORE UPDATE ON fse3_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE fse3_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read fse3_prompt_templates" ON fse3_prompt_templates
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin write fse3_prompt_templates" ON fse3_prompt_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed: 6 Rows (Interpreter + Pass 0-4)
-- INHALT: Siehe fse3-prompt-templates-seed.md — dort sind alle 6 Templates komplett.
-- Hier nur die INSERT-Struktur:
INSERT INTO fse3_prompt_templates (pass_name, system_prompt_key, prompt_template, description) VALUES
  ('interpreter', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'Erzeugt 3 Story-Varianten'),
  ('pass_0', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'Blueprint mit State-Tracking'),
  ('pass_1', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'Story Writer'),
  ('pass_2', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'Language Editor'),
  ('pass_3', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'Style Editor'),
  ('pass_4', 'system_prompt_core_v3', '<TEMPLATE AUS SEED-DOC>', 'JSON Wrapper');
```

### Migration 2: fse3_language_config

```sql
CREATE TABLE IF NOT EXISTS fse3_language_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  level INTEGER NOT NULL,
  tense_rules TEXT NOT NULL,
  tense_example TEXT NOT NULL,
  max_sentence_length INTEGER NOT NULL,
  avg_sentence_length INTEGER NOT NULL,
  vocabulary_guidance TEXT NOT NULL,
  adjective_limit INTEGER NOT NULL DEFAULT 2,
  additional_rules TEXT,
  dialogue_format TEXT NOT NULL,
  dialogue_example_spoken TEXT NOT NULL,
  dialogue_example_thought TEXT NOT NULL,
  rhythm_example_right TEXT NOT NULL,
  rhythm_example_wrong TEXT NOT NULL,
  scenic_example_right TEXT NOT NULL,
  scenic_example_wrong TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(language_code, level)
);

CREATE TRIGGER update_fse3_language_config_updated_at
  BEFORE UPDATE ON fse3_language_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fse3_language_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read fse3_language_config" ON fse3_language_config
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin write fse3_language_config" ON fse3_language_config
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed: 9 Rows (DE/FR/EN × L1/L2/L3)
-- INHALT: Siehe fse3-language-config-seed.md — dort sind alle 9 Rows komplett mit allen Feldern.
```

### Migration 3: Feature Flags + EM-Code Mapping

```sql
-- FSE3 Feature Flag
INSERT INTO app_settings (key, value) VALUES
  ('fse3_enabled_users', '[]')
ON CONFLICT (key) DO NOTHING;

-- Modell pro Pass (alle auf 2.5 Flash — verifiziert)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_model_interpreter', '"gemini-2.5-flash"'),
  ('fse3_model_pass0', '"gemini-2.5-flash"'),
  ('fse3_model_pass1', '"gemini-2.5-flash"'),
  ('fse3_model_pass2', '"gemini-2.5-flash"'),
  ('fse3_model_pass3', '"gemini-2.5-flash"'),
  ('fse3_model_pass4', '"gemini-2.5-flash"')
ON CONFLICT (key) DO NOTHING;

-- EM-Code Mapping (statt Hardcoding)
INSERT INTO app_settings (key, value) VALUES
  ('fse3_em_code_mapping', '{
    "EM-H": {"label": "Humor", "description": "Absurd logic, deadpan, wordplay. Humor from character and situation."},
    "EM-T": {"label": "Thrill", "description": "Ticking clock, mounting dread, false leads. Threat must feel real."},
    "EM-J": {"label": "Joy", "description": "Triumph, celebration, warmth. Earned satisfaction."},
    "EM-W": {"label": "Warmth", "description": "Connection, comfort, empathy. Relationships matter."},
    "EM-D": {"label": "Depth", "description": "Growth, reflection, moral complexity. Inner world."},
    "EM-C": {"label": "Curiosity", "description": "Discovery, wonder, mystery. What lies beyond?"}
  }')
ON CONFLICT (key) DO NOTHING;

-- Variant C Tone Alternation
INSERT INTO app_settings (key, value) VALUES
  ('fse3_variant_c_tones', '[
    {"key": "empathy", "label_de": "Gefühlvoll", "label_en": "Emotional", "description": "Emotional, touching — friendship, courage, inner growth"},
    {"key": "wonder", "label_de": "Staunend", "label_en": "Wondrous", "description": "Wondrous, mysterious — discovery, magic, the unexpected"}
  ]')
ON CONFLICT (key) DO NOTHING;
```

### Migration 4: stories Tabelle — Neue Spalten + Status

```sql
-- Neue Spalten
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS fse3_interpreter_result JSONB,
  ADD COLUMN IF NOT EXISTS fse3_chosen_variant JSONB,
  ADD COLUMN IF NOT EXISTS fse3_pass_timing JSONB;

-- generation_status: neue Werte hinzufügen
-- Aktueller CHECK: IN ('generating','checking','verified','error','text_complete','images_complete','text_failed','images_failed')
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_generation_status_check;
ALTER TABLE stories ADD CONSTRAINT stories_generation_status_check
  CHECK (generation_status IN (
    'generating', 'checking', 'verified', 'error',
    'text_complete', 'images_complete', 'text_failed', 'images_failed',
    'interpreter_pending', 'interpreter_done', 'variant_chosen'
  ));
```

---

## 6. TypeScript Interfaces (fse3Types.ts)

```typescript
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
```

---

## 7. Pipeline-Orchestrierung (pipelineFSE3.ts) — Pseudocode

```typescript
export async function runPipelineFSE3(req, supabase, body) {
  const timing: FSE3PassTiming = {};
  const storyId = body.story_id;

  // 1. Daten laden
  const ctx = await loadFSE3Context(body, supabase);
  // Lädt: kidProfile, languageSettings, levelConfig, subtypes, paths,
  //        promptTemplates (aus fse3_prompt_templates), langConfig (aus fse3_language_config),
  //        generationConfig, appearances, emCodeMapping (aus app_settings)

  // 2. Gewählte Variante aus Body extrahieren
  ctx.chosenVariant = body.fse3_chosen_variant;
  ctx.interpreterResult = body.fse3_interpreter_result;

  // 3. DB Update: status → generating
  await updateStoryStatus(storyId, 'generating');

  // 4. Pass 0 — Blueprint
  const t0 = Date.now();
  const pass0Prompt = buildFSE3Prompt('pass_0', ctx);
  const blueprintRaw = await callGemini(pass0Prompt, getModel('pass0'));
  ctx.blueprint = parseBlueprint(blueprintRaw);
  ctx.worldRule = ctx.blueprint.world_rule;
  timing.pass0_ms = Date.now() - t0;

  // 5. Blueprint-Übersetzung (Codes → Klartext)
  //    path_code "A3->M1->E5" → aus story_paths laden → label + writing_instructions
  //    EM-codes → aus app_settings fse3_em_code_mapping
  const blueprintPlaintext = translateBlueprint(ctx.blueprint, ctx);

  // 6. Pass 1 — Story Writer
  const t1 = Date.now();
  const pass1Prompt = buildFSE3Prompt('pass_1', {
    ...ctx,
    blueprintPlaintext,
    storyArcPlaintext: blueprintPlaintext.arc,
    emotionalTonePlaintext: blueprintPlaintext.emotion,
    setupObjectsList: blueprintPlaintext.setupObjects,
    forbiddenList: blueprintPlaintext.forbidden,
  });
  ctx.pass1Output = await callGemini(pass1Prompt, getModel('pass1'));
  timing.pass1_ms = Date.now() - t1;

  // 7. FORK — Text-Branch und Bild-Branch parallel
  const textBranch = runTextBranch(ctx, timing);
  const imageBranch = runImageBranch(ctx, storyId, timing);

  // 8. JOIN — beide warten
  const [finalJSON, imageResult] = await Promise.all([textBranch, imageBranch]);

  // 9. DB Write: Text + Bilder zusammenführen
  await updateStoryComplete(storyId, finalJSON, imageResult, timing);

  // 10. Subtype Usage aufzeichnen
  await recordSubtypeUsage(ctx);
}

async function runTextBranch(ctx, timing) {
  // Pass 2 — Language
  const t2 = Date.now();
  const pass2Prompt = buildFSE3Prompt('pass_2', ctx);
  ctx.pass2Output = await callGemini(pass2Prompt, getModel('pass2'));
  timing.pass2_ms = Date.now() - t2;

  // Pass 3 — Style
  const t3 = Date.now();
  const pass3Prompt = buildFSE3Prompt('pass_3', {
    ...ctx,
    previousPassOutput: ctx.pass2Output,
  });
  ctx.pass3Output = await callGemini(pass3Prompt, getModel('pass3'));
  timing.pass3_ms = Date.now() - t3;

  // Pass 4 — JSON Wrapper
  const t4 = Date.now();
  const pass4Prompt = buildFSE3Prompt('pass_4', {
    ...ctx,
    previousPassOutput: ctx.pass3Output,
  });
  const finalJSON = await callGemini(pass4Prompt, getModel('pass4'));
  timing.pass4_ms = Date.now() - t4;

  return parseAndValidateFinalJSON(finalJSON);
}

async function runImageBranch(ctx, storyId, timing) {
  // Visual Director (auf Pass-1-Output)
  const tvd = Date.now();
  const vdOutput = await callVisualDirector({
    storyTitle: ctx.storyTitle,
    storyContent: ctx.pass1Output,
    storyLanguage: ctx.storyLanguage,
    sceneCount: ctx.sceneCount,
    kidAge: ctx.kidAge,
    kidAppearanceAnchor: ctx.kidAppearanceAnchor,
    includeSelf: ctx.includeSelf,
    characterAnchors: ctx.characterAnchors,
  });
  timing.visual_director_ms = Date.now() - tvd;

  // Image Generation
  const timg = Date.now();
  const imagePlan = mapVisualDirectorToImagePlan(vdOutput, ctx.kidAppearanceAnchor);
  const imagePrompts = buildImagePrompts(imagePlan);
  const images = await generateImages(imagePrompts);
  timing.image_generation_ms = Date.now() - timg;

  return images;
}
```

---

## 8. Prompt Builder (fse3PromptBuilder.ts) — Design

### Hauptfunktion

```typescript
export function buildFSE3Prompt(
  passName: string,
  ctx: FSE3PipelineContext,
  template?: string  // Override für Tests
): { systemPrompt: string; userPrompt: string } {

  // 1. Template laden (aus DB oder Override)
  const tmpl = template || ctx.promptTemplates[passName];

  // 2. Einfache Platzhalter ersetzen
  let prompt = tmpl
    .replace(/\{\{STORY_LANGUAGE\}\}/g, ctx.storyLanguage)
    .replace(/\{\{CHILD_NAME\}\}/g, ctx.kidName)
    .replace(/\{\{CHILD_AGE\}\}/g, String(ctx.kidAge))
    // ... alle universellen Platzhalter

  // 3. Konditionale Blöcke
  prompt = processConditionals(prompt, {
    VILLAIN: ctx.villain !== null,
    WORLD_RULE: ctx.worldRule && ctx.worldRule !== 'none',
    SPECIAL_EFFECTS: ctx.specialEffects !== 'none',
    SPECIAL_EFFECTS_SUPERPOWERS: ctx.specialEffects === 'superpowers',
    SIDEKICK: ctx.characters.length > 1,
    SIDEKICK_WITH_TRAIT: hasSidekickWithTrait(ctx),
    LANGUAGE_FR: ctx.storyLanguage === 'fr',
  });

  // 4. System Prompt laden
  const systemPromptKey = ctx.promptTemplates[passName + '_system_key'] || 'system_prompt_core_v3';
  const systemPrompt = ctx.systemPrompts[systemPromptKey];

  return { systemPrompt, userPrompt: prompt };
}

function processConditionals(template: string, conditions: Record<string, boolean>): string {
  // {{#IF VILLAIN}}...{{/IF}} → einfügen oder entfernen
  for (const [key, value] of Object.entries(conditions)) {
    const regex = new RegExp(`\\{\\{#IF ${key}\\}\\}([\\s\\S]*?)\\{\\{/IF\\}\\}`, 'g');
    template = template.replace(regex, value ? '$1' : '');
  }
  return template;
}
```

### Blueprint-Übersetzung

```typescript
function translateBlueprint(blueprint: FSE3Blueprint, ctx: FSE3PipelineContext) {
  // Path-Code → Klartext aus DB
  const pathRow = ctx.availablePaths.find(p => p.code === blueprint.path_code);
  const arc = pathRow
    ? `${pathRow.label}: ${pathRow.writing_instructions}`
    : blueprint.path_code;

  // EM-Codes → Klartext aus app_settings
  const emMapping = ctx.emCodeMapping;
  const primary = emMapping[blueprint.emotional_coloring];
  const secondary = emMapping[blueprint.emotional_secondary];
  const emotion = `Primary: ${primary.label} — ${primary.description}. Secondary: ${secondary.label} — ${secondary.description}.`;

  // Setup Objects → nummerierte Liste mit Rollen
  const setupObjects = blueprint.setup_objects.map((obj, i) => {
    const payoff = blueprint.self_check.setup_payoff_map.find(m => m.object === obj);
    return `${i + 1}. ${obj} — introduced ${payoff?.introduced_in}, payoff ${payoff?.payoff_in}`;
  }).join('\n');

  // Skeleton → nummerierte Liste
  const skeleton = blueprint.plot_skeleton.join('\n');

  // Forbidden → Liste
  const forbidden = blueprint.forbidden_in_writer.map(f => `- ${f}`).join('\n');

  return { arc, emotion, setupObjects, skeleton, forbidden };
}
```

---

## 9. Interpreter Endpoint (/interpret-story-input)

### Request Body

```typescript
{
  kidName: string,
  kidAge: number,
  kidGender: string,
  storyType: string,
  characters: Array<{name, type, age?, gender?, role, relation?, description?}>,
  villain?: {name, description, type},
  additionalDescription: string,     // Freitext / Voice
  specialAttributes: string[],
  storyLanguage: string,
  readingLevel: number,
  variantCTone: "empathy" | "wonder"  // Alterniert per Story-Count
}
```

### Response

```typescript
{
  variants: FSE3Variant[]  // Genau 3
}
```

### Variant C Tone Alternation

Der Code bestimmt VOR dem Interpreter-Call welchen Tone Variante C bekommen soll:

```typescript
// Story-Count für dieses Kind laden
const storyCount = await getStoryCount(kidProfileId, supabase);
const variantCTone = storyCount % 2 === 0 ? 'empathy' : 'wonder';
```

Im Interpreter-Prompt wird `{{VARIANT_C_TONE}}` ersetzt mit:
- empathy: "Emotional, touching — friendship, courage, inner growth"
- wonder: "Wondrous, mysterious — discovery, magic, the unexpected"

---

## 10. Wizard-Input → Prompt-Platzhalter Map (komplett)

| Wizard-Feld | FSE3-Platzhalter | Wohin | Mapping |
|-------------|-----------------|-------|---------|
| `storyType` | `{{THEME}}` | Interpreter, Pass 0 | 1:1 |
| `characters` (Array mit descriptions) | `{{CHARACTERS_JSON}}`, `{{CHARACTERS_CONTEXT}}`, `{{CHARACTERS_SUMMARY}}` | Interpreter, Pass 0, Pass 1 | JSON für Interpreter, Klartext für Pass 1 |
| `villain` (name + description) | `{{VILLAIN_JSON}}`, `{{VILLAIN_DESCRIPTION}}` | Interpreter, Pass 0, Pass 1 | JSON für Interpreter, Klartext für Pass 0/1 |
| `additionalDescription` | `{{FREE_TEXT}}` | Interpreter, Pass 0 | 1:1 |
| `specialAttributes` | `{{SPECIAL_EFFECTS}}` | Interpreter, Pass 0, Pass 1 | Mapped: ["superpowers"] → "superpowers" |
| `storyLanguage` | `{{STORY_LANGUAGE}}`, `{{STORY_LANGUAGE_NAME}}` | Alle Passes | Code → Name Mapping ("fr" → "French") |
| `kidName` / `kidAge` / `kidGender` | `{{CHILD_NAME}}` / `{{CHILD_AGE}}` / `{{CHILD_GENDER}}` | Interpreter, Pass 0, Pass 1, Pass 4 | 1:1 |
| `readingLevel` | `{{READING_LEVEL}}`, `{{READING_LEVEL_LABEL}}` | Alle Passes | Level → Label Mapping (1 → "early reader") |
| `storyLength` | `{{WORD_COUNT_TARGET}}`, `{{PARAGRAPH_COUNT}}` | Pass 0, 1, 2, 3 | Aus generation_config |
| `includeSelf` | Implizit in characters | Image Pipeline | Characters hat type="self" |
| `imageStyleKey` | Nicht in Prompts | Image Pipeline | Direkt an Image Gen |

NICHT in FSE3: `humorLevel` (raus), `kidHobbies` (raus), `subElements` (ignoriert wenn leer).

---

## 11. Konditionale Blöcke — Wann welcher Block aktiv ist

| Block | Bedingung | Passes |
|-------|-----------|--------|
| `{{#IF VILLAIN}}...{{/IF}}` | villain !== null | Interpreter, Pass 0, Pass 1 |
| `{{#IF WORLD_RULE}}...{{/IF}}` | world_rule !== "none" | Pass 1, 2, 3 |
| `{{#IF SPECIAL_EFFECTS}}...{{/IF}}` | specialEffects !== "none" | Interpreter, Pass 0, Pass 1 |
| `{{#IF SPECIAL_EFFECTS_SUPERPOWERS}}...{{/IF}}` | specialEffects === "superpowers" | Interpreter |
| `{{#IF SIDEKICK}}...{{/IF}}` | characters.length > 1 | Pass 0, Pass 1 |
| `{{#IF SIDEKICK_WITH_TRAIT}}...{{/IF}}` | sidekick hat description-Feld | Interpreter, Pass 0 |
| `{{#IF LANGUAGE_FR}}...{{/IF}}` | storyLanguage === "fr" | Pass 2, Pass 3 |

---

## 12. World Rule Durchreichung (kritisches Design-Pattern)

```
Pass 0 definiert world_rule als String
    ↓
Code extrahiert: ctx.worldRule = blueprint.world_rule
    ↓
Pass 1, 2, 3 bekommen IDENTISCHEN Block:
    ---WORLD RULE (READ-ONLY)---
    {{WORLD_RULE_TEXT}}
    ---END WORLD RULE---
    ↓
Das LLM generiert die World Rule NIE neu.
Der Code ist die einzige Quelle.
```

---

## 13. Error Handling

```typescript
// Pro Pass: try/catch mit Retry
async function callPassWithRetry(passName, prompt, model, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await callGemini(prompt, model);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        // Letzter Versuch fehlgeschlagen
        await updateStoryStatus(storyId, 'error', {
          error_pass: passName,
          error_message: error.message,
        });
        throw error;
      }
      // Retry nach 1s
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Pass 4 Feldname-Fix: "definition" → "explanation"
function normalizeVocabulary(vocab) {
  return vocab.map(item => ({
    word: item.word,
    explanation: item.explanation || item.definition,
  }));
}
```

---

## 14. Implementierungsreihenfolge

### Phase 1: Infrastruktur (2-3 Tage)

- [ ] DB: Migration 1 — `fse3_prompt_templates` + Seeds aus fse3-prompt-templates-seed.md
- [ ] DB: Migration 2 — `fse3_language_config` + Seeds aus fse3-language-config-seed.md
- [ ] DB: Migration 3 — Feature Flags + EM-Code Mapping in app_settings
- [ ] DB: Migration 4 — stories Spalten + Status-Erweiterung
- [ ] Backend: `fse3Types.ts` — Interfaces (Section 6 dieses Docs)
- [ ] Backend: `fse3FeatureFlag.ts` — `isFse3Enabled()` (Pattern wie `fse2FeatureFlag.ts`)
- [ ] Backend: `fse3PromptBuilder.ts` — Template-Engine (Section 8)
- [ ] Frontend: TypeScript-Typ `generation_status` in `useStoryRealtime.tsx` reparieren (ALLE Werte)
- [ ] Frontend: Terminal-Status in `storyGenerationHelper.ts` erweitern

### Phase 2: Pipeline Backend (3-4 Tage)

- [ ] Backend: `interpret-story-input/index.ts` — Interpreter Endpoint (synchron)
- [ ] Backend: `pipelineFSE3.ts` — Haupt-Pipeline (Section 7)
- [ ] Backend: Pass 0 mit Blueprint-Parsing + State-Tracking
- [ ] Backend: Pass 1 mit Blueprint-Übersetzung (Codes → Klartext)
- [ ] Backend: Pass 2-3-4 sequentiell im Text-Branch
- [ ] Backend: VD parallel im Bild-Branch (Promise.all)
- [ ] Backend: Router in `generate-story/index.ts` (FSE3 VOR FSE2)
- [ ] Backend: Character Enrichment — shared Funktion extrahieren oder kopieren

### Phase 3: Frontend (2-3 Tage)

- [ ] Frontend: `StoryVariantSelectionScreen.tsx` — 3 Kacheln (Emoji + Titel + Teaser)
- [ ] Frontend: `useStoryFse3Enabled.ts` — Feature Flag Hook
- [ ] Frontend: `CreateStoryPage.tsx` — Neuer Screen + Interpreter-Call
- [ ] Frontend: Wizard-Flow: image-style → variant-selection → generating
- [ ] Frontend: Erweiterter Ladescreen (Status-Updates während Passes)
- [ ] Frontend: Learning Theme Tab unsichtbar/auskommentiert (OE-6)

### Phase 4: Admin Panel (1-2 Tage)

- [ ] Admin: FSE3 Prompt Editor (Textarea + Platzhalter-Sidebar)
- [ ] Admin: Language Config Editor (Sprache × Level Tabelle)
- [ ] Admin: FSE3 Feature Flag Toggle

### Phase 5: Test + Rollout (1-2 Wochen)

- [ ] Manuell: 5+ Stories pro Sprache/Level (DE/FR/EN × L1-3)
- [ ] E2E-Tests 2-5 aus sz1-e2e-test-scenarios.md
- [ ] Feature Flag: Testgruppe auf FSE3
- [ ] Vergleich: FSE2 vs FSE3 Qualität
- [ ] Latenz-Messung: Pass-Timing auswerten
- [ ] Rollout-Entscheidung

---

## 15. Referenz-Dokumente (im Projekt)

| Dokument | Was es enthält | Wann lesen |
|----------|---------------|------------|
| `fse3-prompt-templates-seed.md` | Alle 6 Prompt-Templates mit Platzhaltern | Beim Seeden der DB |
| `fse3-language-config-seed.md` | 9 Sprach-Konfigurationen (DE/FR/EN × L1-3) | Beim Seeden der DB |
| `fse3-findings-and-pass-requirements.md` | 15 Findings, detaillierte Pass-Anforderungen | Referenz bei Prompt-Optimierung |
| `sz1-e2e-test-scenarios.md` | 5 E2E-Tests | Phase 5 |
| `V3.txt` | System Prompt V3 (Basis für FSE3) | Phase 1 |
| `Architecture.md` | Bestehende Architektur | Referenz |
| `Story-Pipeline-Architecture.md` | Pipeline-Details, Feature Flags, DB-Zugriffe | Referenz |
| `data_model.md` | Alle DB-Tabellen | Referenz |

---

## 16. Bekannte Limitationen

| Limitation | Severity | Workaround |
|-----------|----------|------------|
| Gemini Flash Stakkato bei Sprach-Editing (F15) | Niedrig | Akzeptiert (3.5/5 bei 400 Wörtern) |
| Pass 0 Self-Check schummelt gelegentlich (F10) | Mittel | State-Tracking-Tabelle erzwingt konkretere Angaben |
| Vocab Feldname "definition" statt "explanation" | Niedrig | Code normalisiert: `explanation \|\| definition` |
| VD auf Pass-1-Text statt finalem Text | Niedrig | Preservation Rules verhindern Plot-Änderungen in Pass 2/3 |
