# Audit: Image-Pipeline + Emotion-Flow-Signaturen

> **Ziel:** Vollständiges Verständnis des Flows von Story-Generierung bis fertige Bilder sowie Verifikation was Phase 5 (Tasks 5.1–5.3) und 5b.1–5b.3 tatsächlich gebaut haben.  
> **Nur Analyse und Dokumentation — keine Code-Änderungen.**

---

# TEIL A: IMAGE-PROMPT-PIPELINE

## A1: Der erste LLM-Call (Story + Image Prompts)

### 1. Ein Call oder getrennte Calls?

**Ein einziger LLM-Call.** Story-Text und Image-Prompts (als `image_plan`) werden **im selben Request** abgefragt.

- **Datei:** `supabase/functions/generate-story/index.ts`
- **Stelle:** `const content = await callLovableAI(LOVABLE_API_KEY, fullSystemPrompt, promptToUse, 0.8);` (ca. Zeile 2171)
- **Input:** `fullSystemPrompt` (System) + `userPrompt` (User), darin die komplette Aufgabenstellung inkl. gewünschter JSON-Struktur mit `image_plan`.

### 2. Abschnitt im Prompt: Image-Prompts anfordern

Der User-Prompt verlangt ein **einziges JSON-Objekt** mit u.a. `image_plan`. Relevanter Ausschnitt (Zeilen 2090–2109):

```ts
userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"
...
Antworte NUR mit einem validen JSON-Objekt.
Erstelle genau ${questionCount} Multiple-Choice Fragen.
Wähle genau 10 Vokabelwörter aus.
Im image_plan MÜSSEN genau ${genConfig.scene_image_count} scenes enthalten sein (scene_id 1 bis ${genConfig.scene_image_count}).${seriesOutputInstructions}

CRITICAL: Your response must be VALID JSON only. No markdown, no backticks, no explanation.
Required JSON structure:
{
  "title": "Story title",
  "content": "The complete story text as a single string...",
  "questions": [...],
  "vocabulary": [...],
  "image_plan": {"character_anchor": "...", "world_anchor": "...", "scenes": [EXACTLY ${genConfig.scene_image_count} scene objects, one per scene image: {"scene_id": 1, "setting": "...", "characters_present": "...", "action": "...", "emotion": "...", "target_paragraph": 0}]}
}
Fields episode_summary, continuity_state, visual_style_sheet, branch_options are ONLY required for series episodes.`;
```

- **Format:** Ein einziges JSON-Objekt (kein XML/Markdown).
- **Regeln:** Genau `scene_image_count` Szenen (z.B. 3), `scene_id` 1 bis N. Pro Szene: `setting`, `characters_present`, `action`, `emotion`, `target_paragraph` (0-basiert).
- **Anzahl Bilder:** Variabel: `genConfig.scene_image_count` (z.B. 3) **+** optional 1 Cover → typisch 4 Bilder. Konfiguration aus Tabelle `generation_config` (Alter + Länge).

Zusätzlich kommt beim **CORE Slim**-Pfad aus `promptBuilder.ts` ein Block „IMAGE PLAN INSTRUCTIONS“ (ca. 1734–1739):

```ts
'## IMAGE PLAN INSTRUCTIONS',
`Generate exactly ${sceneCount} scene(s) in the image_plan.`,
sceneGuidance,
'For each scene in image_plan, include "target_paragraph": the 0-based index of the paragraph ...',
'All descriptions in ENGLISH. No text, signs, or readable writing in any scene.',
```

### 3. Was genau ist der "character_anchor"?

- **Definition (implizit):** Eine **englische, visuelle Beschreibung der Hauptfigur(en)** für die Bildgenerierung, damit die Figur über alle Bilder hinweg erkennbar bleibt.
- **Wo erklärt:** Nicht als eigener Abschnitt; das LLM lernt den Begriff nur aus der **JSON-Struktur** im User-Prompt (`"character_anchor": "..."`).
- **Wer erzeugt ihn:** **Das LLM** erfindet den Text beim Schreiben der Story; er kommt **nicht** aus unseren Daten (z.B. Character Seeds oder kid_profile).
- **Einbau in die Image-Prompts:** In `imagePromptBuilder.ts` wird `imagePlan.character_anchor` in **jeden** finalen Prompt eingebaut: Cover (Zeile 251), Szenen (Zeile 274): `Characters: ${imagePlan.character_anchor}`.

### 4. Regeln für Bild-Szenen-Auswahl

- **Anzahl:** Genau `genConfig.scene_image_count` Szenen, konfigurierbar pro Altersgruppe + Story-Länge.
- **Inhalt:** Beim CORE-Slim-Pfad gibt `sceneGuidance` die inhaltliche Rolle vor (z.B. 1 Szene: emotionaler Höhepunkt; 2 Szenen: Wendepunkt + Auflösung; 3 Szenen: Anfang → Konflikt → Auflösung).
- **Verteilung:** `target_paragraph` soll Bilder gleichmäßig über den Text verteilen.

### 5. Sprache der Image-Prompts

- **Vorgabe:** „All descriptions in ENGLISH“ (promptBuilder) und JSON-Struktur auf Englisch. `character_anchor`, `world_anchor` und Szenen-Beschreibungen werden vom LLM auf Englisch geliefert und in `imagePromptBuilder` unverändert übernommen.

---

## A2: Parsing der LLM-Response

### 1. Erwartetes Response-Format

Ein **einziges JSON-Objekt** mit mindestens:

- `title`, `content`, `questions`, `vocabulary`
- optional: `image_plan` mit `character_anchor`, `world_anchor`, `scenes` (Array von Szenen-Objekten)

Beispiel (reduziert):

```json
{
  "title": "Der Wald der Lichter",
  "content": "Die komplette Geschichte als String...",
  "questions": [...],
  "vocabulary": [...],
  "image_plan": {
    "character_anchor": "A girl with dark curly hair, green jacket...",
    "world_anchor": "A magical forest with glowing mushrooms...",
    "scenes": [
      { "scene_id": 1, "setting": "...", "characters_present": "...", "action": "...", "emotion": "curious", "target_paragraph": 0 },
      { "scene_id": 2, ... },
      { "scene_id": 3, ... }
    ]
  }
}
```

### 2. Extraktion / Parsing

- **Datei:** `supabase/functions/generate-story/index.ts`
- **Story-Parsing:** `safeParseStoryResponse(content)` (Zeilen 29–72): entfernt Markdown-Backticks, versucht `JSON.parse(cleaned)`, Fallback: erstes `{` bis letztes `}` extrahieren.
- **image_plan:** Direkt aus dem geparsten Objekt (Zeilen 2445–2460):

```ts
let imagePlan: any = null;
if ((story as any).image_plan) {
  imagePlan = (story as any).image_plan;
  // Log character_anchor, world_anchor, scenes.length
} else {
  console.log('[generate-story] No image_plan in LLM response, using fallback');
}
```

### 3. Nach dem Parsen

Die rohen Werte aus `image_plan` gehen in **imagePromptBuilder.ts**; dort werden Style-Prefix (DB), age modifier, theme/age rules und ggf. Series Visual Style Sheet hinzugefügt. Die **Struktur** (character_anchor, scenes) wird nicht geändert.

---

## A3: imagePromptBuilder.ts

### 1. Rolle der Datei

- **Baut die FINALEN Prompts**, die an das Bild-Modell (Vertex/Gemini) gehen.
- **Baut NICHT** die Instructions, die ins Story-LLM gehen (die kommen aus `promptBuilder.ts` + User-Prompt in generate-story).

### 2. Hauptfunktionen und Signaturen

**buildImagePrompts**

```ts
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge: number,
  seriesContext?: SeriesImageContext,
  imageStyleOverride?: { promptSnippet: string; ageModifier: string },
): ImagePromptResult[]
```

- **Rein:** image_plan (vom LLM), Alters-/Theme-Regeln, childAge, optional Series-Kontext, optional Style-Override aus DB.
- **Raus:** Array von `{ prompt: string, negative_prompt: string, label: string }` (z.B. `cover`, `scene_1`, `scene_2`, `scene_3`).

**buildFallbackImagePrompt** (wenn kein image_plan)

```ts
export function buildFallbackImagePrompt(
  storyTitle: string,
  characterDescription: string,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge?: number,
  seriesContext?: SeriesImageContext,
  imageStyleOverride?: { promptSnippet: string; ageModifier: string },
): ImagePromptResult
```

### 3. Einbau character_anchor

- Cover: `Characters: ${imagePlan.character_anchor}` (Zeile 251).
- Jede Szene: `Characters: ${imagePlan.character_anchor}` (Zeile 274).

### 4. image_style (image_styles Tabelle)

- Über `getStyleForAge(supabase, childAge, imageStyleKeyParam)` wird in generate-story ein `imageStyleData` geladen (`styleKey`, `promptSnippet`, `ageModifier`).
- Dies wird als `imageStyleOverride` an `buildImagePrompts` / `buildFallbackImagePrompt` übergeben.
- In buildImagePrompts: `ageModifier = imageStyleOverride ? imageStyleOverride.promptSnippet + ageModifier : getAgeModifierFallback(childAge)`; der Style-Block enthält theme/age rules und ggf. `style_prompt` aus `image_style_rules`.

---

## A4: Image-Generierung (Vertex / Gemini)

1. **Welche Datei/Funktion:** `generate-story/index.ts`: `callVertexImageAPI(serviceAccountJson, prompt)` (ca. Zeile 837) und Fallback `callLovableImageGenerate(LOVABLE_API_KEY, prompt)` (ca. Zeile 571).

2. **Modell:** Vertex AI: `gemini-2.0-flash-exp:generateContent` (europe-west1). URL:  
   `https://europe-west1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west1/publishers/google/models/gemini-2.0-flash-exp:generateContent`  
   (Nicht Imagen; es wird Gemini mit `responseModalities: ["IMAGE", "TEXT"]` genutzt.)

3. **Prompts:** Die Prompts werden 1:1 so geschickt, wie sie von `buildImagePrompts` (bzw. Fallback) kommen — keine weitere Umformung vor dem API-Call.

4. **Parallel:** Ja. Alle Bild-Requests werden mit `Promise.allSettled(imagePrompts.map(...))` parallel ausgeführt (Task 2 in generate-story, ca. 2732–2770).

5. **Fehler:** Pro Prompt: zuerst Vertex, bei Fehler Lovable Gateway. Bei 429: Retry mit Backoff (maxRetries). Einzelner Fehler → `url: null` für dieses Bild; Story wird trotzdem gespeichert; Cover-Fallback: wenn Cover fehlschlägt, wird ggf. erste Szene als Cover genutzt.

---

## A5: Image-Upload + Speicherung

### 1. Wohin werden Bilder hochgeladen?

- **Bucket:** `covers` (Name in Code: `'covers'` bei `uploadImageToStorage(..., 'covers', prefix)`).
- **Pfad/Struktur:** Kein Unterpfad nach userId/storyId; Dateiname: `{prefix}-{Date.now()}-{crypto.randomUUID()}.{ext}` mit `prefix` = `'cover'` oder `'scene-0'`, `'scene-1'`, …
- **Format:** Aus MIME abgeleitet: `webp` → .webp, `jpeg` → .jpg, sonst .png.

### 2. Öffentliche URL

- `const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);`
- Rückgabe: `urlData.publicUrl`.

### 3. Speicherung in der stories-Tabelle

- **Spalten:** `cover_image_url` (TEXT), `story_images` (TEXT[]).
- **Format:** `cover_image_url` = eine URL (oder bei Fallback base64 data URL). `story_images` = Array von URLs, eine pro Szene.
- **Hinweis:** Das Response-Objekt der Edge Function liefert `coverImageBase64` (dann die URL) und `storyImages` (Array von URLs); die persistente Speicherung in `stories` erfolgt vermutlich im Frontend oder in einem anderen Schritt (z.B. Update nach Story-Erstellung) mit `cover_image_url` und `story_images`.
- Trigger (Migration 20260214160023): Wenn `cover_image_url` gesetzt und nicht data-URL, wird `cover_image_status` auf `'complete'` gesetzt; wenn `story_images` befüllt, wird `story_images_status` auf `'complete'` gesetzt.

### 4. Cover-Bild

- Erstes Bild = Cover (label `cover` von buildImagePrompts).  
- Fallback: Wenn Cover-Generierung fehlschlägt, aber Szenen vorhanden sind, wird die erste Szene als Cover verwendet (Zeile 2846–2849).

---

## A6: Flow-Diagramm

```
User Request (generate-story Edge Function)
  ↓
[1] Load config: generation_config, kid profile, theme, language, etc.
  ↓
[2] Build Story Prompt (promptBuilder.buildStoryPrompt / CORE Slim path)
    → fullSystemPrompt, userPrompt (inkl. image_plan JSON-Struktur + scene_image_count)
  ↓
[3] callLovableAI(fullSystemPrompt, userPrompt, 0.8)
    → Ein LLM-Call: Story + image_plan im selben JSON
  ↓
[4] safeParseStoryResponse(content) → story (title, content, questions, vocabulary, image_plan)
  ↓
[5] image_plan extrahieren: imagePlan = story.image_plan (oder null)
  ↓
[6] Load Image Rules: loadImageRules(), getStyleForAge() → imageAgeRules, imageThemeRules, imageStyleData
  ↓
[7] Build Image Prompts:
    wenn imagePlan && character_anchor && scenes?.length:
      buildImagePrompts(imagePlan, imageAgeRules, imageThemeRules, childAge, seriesImageCtx, imageStyleData)
    sonst:
      buildFallbackImagePrompt(title, characterDescription, ...)
  ↓
[8] Optional: Limit auf max_images_per_story (slice)
  ↓
[9] Parallel: Consistency-Check (bei Series) + generateAllImagesTask()
    pro imagePrompts-Eintrag:
      getCachedImage(supabase, prompt) → bei Hit: cached URL
      sonst: callVertexImageAPI(GEMINI_API_KEY, prompt) bzw. callLovableImageGenerate(LOVABLE_API_KEY, prompt)
      bei Erfolg: cacheImage(supabase, prompt, imageUrl)
  ↓
[10] Sortierung: cover vs. scene_1, scene_2, …; Fallback Cover = erste Szene
  ↓
[11] Upload: uploadImageToStorage(base64, 'covers', 'cover'|'scene-0'|…)
      → supabase.storage.from('covers').upload(fileName, bytes) → getPublicUrl(fileName)
  ↓
[12] Response: story + coverImageBase64 (= URL), storyImages (= URLs), image_count, imageWarning, performance
  ↓
Frontend / DB: cover_image_url, story_images in stories-Tabelle persistieren
```

---

# TEIL B: EMOTION-FLOW-ENGINE — SIGNATUR-AUDIT

## B1: Feature-Flag

**Datei:** `supabase/functions/_shared/emotionFlow/featureFlag.ts`

| Export            | Signatur |
|-------------------|----------|
| isEmotionFlowEnabled | `(userId: string, supabaseClient: any) => Promise<boolean>` |
| resetFeatureFlagCache | `() => void` |

---

## B2: Selectors (Phase 2/4)

**Dateien unter `emotionFlow/selectors/`:**

| Datei                 | Export                    | Signatur / Typ |
|-----------------------|---------------------------|----------------|
| intensitySelector.ts   | selectIntensity           | `(kidProfileId: string, supabase: EmotionFlowSupabase) => Promise<IntensityLevel>` |
| intensitySelector.ts  | INTENSITY_WEIGHTS         | `Record<IntensityLevel, number>` |
| blueprintSelector.ts  | selectBlueprint           | `(params: BlueprintSelectorParams, supabase: EmotionFlowSupabase) => Promise<EmotionBlueprint \| null>` |
| toneSelector.ts       | selectTone                | `(params: ToneSelectorParams, supabase: EmotionFlowSupabase) => Promise<ToneMode>` |
| toneSelector.ts       | TONE_WEIGHTS              | `(tone, ageGroup, blueprintCategory?) => number` |
| characterSelector.ts  | selectCharacterSeeds      | `(params: CharacterSelectorParams, supabase: EmotionFlowSupabase) => Promise<SelectedCharacters>` |
| characterSelector.ts  | selectCreatureType        | `(ageGroup: string, theme: string) => 'human' \| 'mythical'` |
| characterSelector.ts  | CREATURE_TYPE_MYTHICAL_PERCENT | `Record<string, Record<string, number>>` |
| characterSelector.ts  | FALLBACK_SIDEKICK         | `CharacterSeed` |
| elementSelector.ts    | selectStoryElements       | `(params: ElementSelectorParams, supabase: EmotionFlowSupabase) => Promise<SelectedElements>` |
| elementSelector.ts    | shouldSelectElement       | `(elementType: ElementType, params: ShouldSelectParams) => boolean` |
| elementSelector.ts    | FALLBACK_OPENING, FALLBACK_PERSPECTIVE, FALLBACK_CLOSING | `StoryElement` |
| index.ts              | (re-exports)              | selectIntensity, selectBlueprint, selectTone, selectCharacterSeeds, selectStoryElements, weightedRandom, etc. |

---

## B3: Character Seeds

Es gibt **kein** separates Verzeichnis `emotionFlow/seeds/` oder `emotionFlow/characters/`. Die Character-Logik lebt in **selectors/characterSelector.ts** (selectCharacterSeeds, selectCreatureType, FALLBACK_SIDEKICK). Seeds kommen aus der DB-Tabelle `character_seeds` (über Supabase-Abfragen in characterSelector).

---

## B4: Story Elements

Es gibt **kein** separates Verzeichnis `emotionFlow/elements/`. Die Element-Logik lebt in **selectors/elementSelector.ts** (selectStoryElements, shouldSelectElement, FALLBACK_OPENING/PERSPECTIVE/CLOSING). Elemente kommen aus der DB (Story-Elemente-Tabelle) über Supabase in elementSelector.

---

## B5: Prompt Blocks (Phase 5, Tasks 5.1–5.3)

**Dateien unter `emotionFlow/promptBuilder/`:**

| Datei                          | Export                    | Signatur / Typ |
|--------------------------------|---------------------------|----------------|
| criticalRules.ts               | getCriticalRules          | `() => string` |
| criticalRules.ts               | buildCriticalRules        | `() => string` |
| criticalRules.ts               | CRITICAL_RULES_TEXT       | `string` |
| blocks/relationshipBlock.ts    | buildRelationshipBlock    | `(params: RelationshipBlockParams) => string` |
| blocks/relationshipBlock.ts    | RelationshipBlockParams   | `{ protagonistSeed, sidekickSeed, characterMode, ... }` |
| blocks/arcBlock.ts             | buildArcBlock             | `(params: ArcBlockParams) => string` |
| blocks/arcBlock.ts             | ArcBlockParams            | `{ blueprint, ageGroup, intensity }` |
| blocks/toneBlock.ts           | buildToneBlock            | `(toneMode: ToneMode) => string` |
| blocks/toneBlock.ts           | TONE_TEMPLATES            | `Record<ToneMode, string>` |
| blocks/characterBlock.ts      | buildCharacterBlock       | `(params: CharacterBlockParams) => string` |
| blocks/characterBlock.ts      | CharacterBlockParams      | `{ protagonistSeed, sidekickSeed }` |
| blocks/elementBlocks.ts       | buildElementBlocks        | `(elements: SelectedElements) => string` |
| blocks/index.ts               | (re-exports)              | buildRelationshipBlock, buildArcBlock, buildToneBlock, buildCharacterBlock, buildElementBlocks + Types |
| emotionFlowPromptBuilder.ts   | buildEmotionFlowPrompt    | `(params: EmotionFlowPromptParams) => string` |
| emotionFlowPromptBuilder.ts   | cleanPrompt               | `(raw: string) => string` |
| emotionFlowPromptBuilder.ts   | EmotionFlowPromptParams   | `{ ageRules, difficultyRules, themeRules, wordCounts, characters, guardrails, learningTheme, imageInstructions, arcBlock, toneBlock, characterBlock, elementBlocks, criticalRules }` |
| buildEmotionBlocks.ts         | buildEmotionPromptBlocks  | `(blueprint, tone, characters, elements, ageGroup) => PromptBlocks` — **wirft derzeit** `Error('not yet implemented')` |

**Zusammenbau des Prompts (emotionFlowPromptBuilder):**

- Reihenfolge: `ageRules` → `difficultyRules` → `themeRules` → (wenn mindestens ein Block nicht leer) `--- EMOTION FLOW ENGINE ---` → `arcBlock` → `toneBlock` → `characterBlock` → `elementBlocks` → `criticalRules` → `--- END EMOTION FLOW ---` → `wordCounts` → `characters` → `guardrails` → ggf. `learningTheme` → `imageInstructions`.
- Leere Blöcke werden weggelassen; sind alle Emotion-Flow-Blöcke leer, werden die Marker weggelassen. `cleanPrompt` reduziert auf maximal 2 aufeinanderfolgende Newlines und trimmt.

---

## B6: Types (emotionFlow/types.ts)

- **IntensityLevel:** `'light' | 'medium' | 'deep'`
- **ToneMode:** `'dramatic' | 'comedic' | 'adventurous' | 'gentle' | 'absurd'`
- **BlueprintCategory:** `'growth' | 'social' | 'courage' | 'empathy' | 'humor' | 'wonder'`
- **SeedType:** `'protagonist_appearance' | 'sidekick_archetype' | 'antagonist_archetype'`
- **CreatureType:** `'human' | 'mythical'`
- **Gender:** `'female' | 'male' | 'neutral'`
- **AgeGroup:** `'6-7' | '8-9' | '10-11' | '12+'`
- **ElementType:** `'opening_style' | 'narrative_perspective' | 'macguffin' | 'setting_detail' | 'humor_technique' | 'tension_technique' | 'closing_style'`
- **CharacterMode:** `'self' | 'family' | 'surprise'`
- **ArcByAgeEntry:** `{ steps, arc, arc_prompt }`
- **EmotionBlueprint:** (id, blueprint_key, labels, descriptions, category, arc_by_age, arc_description_en, tone_guidance, tension_curve, surprise_moment, ending_feeling, compatible_themes, ideal_age_groups, min_intensity, compatible_learning_themes, weight, is_active, created_at, updated_at)
- **CharacterSeed:** (id, seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, compatible_themes, weight, is_active, created_at, updated_at)
- **StoryElement:** (id, element_key, element_type, content_en, labels, compatible_themes, compatible_categories, age_groups, weight, is_active, created_at)
- **SelectedElements:** (opening, perspective, macguffin, settingDetail, humorTechnique, tensionTechnique, closing)
- **SelectedCharacters:** (protagonist, sidekick, antagonist)
- **PromptBlocks:** (arcBlock, toneBlock, characterBlock, elementBlocks, criticalRules)
- **EmotionFlowMetadata:** (blueprintKey, toneMode, intensityLevel, characterSeedKey, sidekickSeedKey, antagonistSeedKey, openingElementKey, perspectiveElementKey)
- **EmotionFlowResult:** (intensity, blueprint, tone, protagonistSeed, sidekickSeed, antagonistSeed, elements, promptBlocks, metadata)
- **BlueprintSelectorParams, ToneSelectorParams, CharacterSelectorParams, ElementSelectorParams, EngineParams, EmotionFlowSupabase** (wie in types.ts definiert)

---

## B7: Abweichungen Roadmap vs. Realität

| Roadmap                          | Realität |
|----------------------------------|----------|
| selectIntensity(kidProfileId, supabase) | ✅ `selectIntensity(kidProfileId: string, supabase: EmotionFlowSupabase): Promise<IntensityLevel>` |
| selectBlueprint(intensity, kidProfileId, supabase) | ⚠️ `selectBlueprint(params: BlueprintSelectorParams, supabase)` mit params: kidProfileId, ageGroup, theme, intensity, learningTheme |
| selectTone(blueprint, intensity) | ⚠️ `selectTone(params: ToneSelectorParams, supabase)` mit params: kidProfileId, ageGroup, blueprintCategory (nicht blueprint + intensity direkt) |
| selectCharacterSeeds(characterMode, kidProfile, selectedCharacters, supabase) | ⚠️ `selectCharacterSeeds(params: CharacterSelectorParams, supabase)` mit params: kidProfileId, ageGroup, theme, characterMode, blueprintCategory (kein selectedCharacters-Array im Param) |
| selectStoryElements(kidProfileId, theme, supabase) | ⚠️ `selectStoryElements(params: ElementSelectorParams, supabase)` mit params: kidProfileId, ageGroup, theme, intensity, tone, blueprintCategory |
| buildArcBlock(blueprint, intensity) | ⚠️ `buildArcBlock(params: ArcBlockParams)` mit params: blueprint, ageGroup, intensity |
| buildToneBlock(tone) | ✅ `buildToneBlock(toneMode: ToneMode): string` |
| buildCharacterBlock(protagonistSeed, sidekickSeed, antagonistSeed) | ⚠️ Zwei Varianten: `buildCharacterBlock({ protagonistSeed, sidekickSeed })` und `buildRelationshipBlock(...)` mit characterMode etc. (antagonist nicht in CharacterBlockParams) |
| buildElementBlocks(elements) | ✅ `buildElementBlocks(elements: SelectedElements): string` |
| getCriticalRules() | ✅ `getCriticalRules(): string` |
| buildEmotionFlowPrompt({...existingParams, ...promptBlocks}) | ✅ `buildEmotionFlowPrompt(params: EmotionFlowPromptParams): string` mit allen genannten Parametern (existing + Blocks als Strings) |

**Zusätzliche Funktionen (nicht in Roadmap):**

- resetFeatureFlagCache(), cleanPrompt(), COMIC_LAYOUTS, selectLayout, buildComicStripInstructions, buildComicStripImagePrompt, parseComicStripPlan, cropComicStrip, getComicStripCropData, computePanelPixelRects, isComicStripEnabled, resetComicStripFeatureFlagCache (Comic-Strip-Modul).
- Selectors: weightedRandom, INTENSITY_WEIGHTS, TONE_WEIGHTS, selectCreatureType, shouldSelectElement, FALLBACK_*.

**Fehlend / Abweichung:**

- buildEmotionPromptBlocks (buildEmotionBlocks.ts) ist exportiert, aber wirft „not yet implemented“; die tatsächliche Block-Erstellung erfolgt über die einzelnen build*Block-Funktionen und dann buildEmotionFlowPrompt.

---

## B8: Comic-Strip-Module (5b.1–5b.3)

**Dateien unter `comicStrip/`:**

| Datei                     | Export                        | Signatur / Typ |
|---------------------------|-------------------------------|----------------|
| featureFlag.ts            | isComicStripEnabled           | `(userId: string, supabaseClient: any) => Promise<boolean>` |
| featureFlag.ts            | resetComicStripFeatureFlagCache | `() => void` |
| types.ts                  | CropRegion, PanelPosition, CropMode, ComicLayout, ComicStripPlanPanel, ComicStripPlan | (Interfaces / type) |
| layouts.ts                | COMIC_LAYOUTS                 | `Record<string, ComicLayout>` |
| layouts.ts                | selectLayout                  | `(_lastLayoutKey?: string \| null) => ComicLayout` |
| comicStripPromptBuilder.ts| buildComicStripInstructions   | `(layout: ComicLayout) => string` |
| comicStripPromptBuilder.ts| buildComicStripImagePrompt    | `(params: BuildComicStripImagePromptParams) => ComicStripImagePromptResult` |
| comicStripPromptBuilder.ts| parseComicStripPlan           | `(imagePlan: any, layout: ComicLayout) => ComicStripPlan \| null` |
| comicStripPromptBuilder.ts| BuildComicStripImagePromptParams, ComicStripImagePromptResult | (Interfaces) |
| panelCropper.ts           | cropComicStrip                | `(params: CropComicStripParams) => Promise<CroppedPanel[]>` |
| panelCropper.ts           | getComicStripCropData         | `(fullImageUrl: string, layout: ComicLayout) => PanelCropData[]` |
| panelCropper.ts           | computePanelPixelRects        | `(layout: ComicLayout, imageWidth: number, imageHeight: number) => PanelPixelRect[]` |
| panelCropper.ts           | CroppedPanel, PanelCropData, PanelPixelRect, CropComicStripParams | (Interfaces / type) |

Die Signaturen und Types entsprechen den in den Tasks 5b.1–5b.3 beschriebenen Definitionen (Layouts, CropRegion, ComicStripPlan mit panels + characterAnchor, Character-Seed-Injection über characterSeedAppearance in buildComicStripImagePrompt, Fallback getComicStripCropData für Frontend-Cropping).
