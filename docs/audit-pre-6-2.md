# Mini-Audit: generate-story nach 5b.4 (vor Task 6.2)

> Nur Analyse, keine Code-Änderungen. Basis: generate-story/index.ts nach Task 5b.4 + Task 6.1.

---

## 1. Comic-Strip-Branch: Wo genau?

- **Feature-Flag-Check:** Zeile **1418**  
  `// ── Comic-Strip Feature Flag Check ──`  
  Danach: `let useComicStrip = false; let comicLayout: ComicLayout | null = null;`  
  Zeile **1423–1426**: `if (userId) { useComicStrip = await isComicStripEnabled(userId, supabase); if (useComicStrip) comicLayout = selectLayout(); }`

- **If/else für Comic-Strip vs. alte Pipeline:**  
  - **Zeile 2877:** Beginn des Comic-Strip-Blocks  
    `if (useComicStrip && comicLayout && comicLayout.layoutKey !== 'layout_0_single' && imagePlan)`  
  - **Zeile 2988:** Beginn der alten Pipeline  
    `if (!comicStripHandled) {`  
  - **Zeile 3088:** Ende der alten Pipeline  
    `} // ── END if (!comicStripHandled) ──`

- **Ende des Comic-Strip try/catch:** Zeile **2982**  
  `} catch (comicError: any) { ... comicStripHandled = false; }`  
  Der zugehörige `try` beginnt auf Zeile **2879**.

**Exakte Struktur (nur Bedingungen):**

- Es gibt **keinen** inneren `if (layout_0_single)`-Zweig.  
  `layout_0_single` wird ausgeschlossen durch  
  `comicLayout.layoutKey !== 'layout_0_single'` in der äußeren Bedingung (Z. 2877).  
  Wenn also Comic-Strip an ist, aber Layout `layout_0_single` ist, wird der Comic-Block gar nicht betreten und `comicStripHandled` bleibt `false` → nur die alte Pipeline läuft.

- Struktur:
  - `if (useComicStrip && comicLayout && comicLayout.layoutKey !== 'layout_0_single' && imagePlan)`  
    - `try { ... Comic-Strip: 1 Call, Crop, Upload ... comicStripHandled = true; }`  
    - `catch { comicStripHandled = false; }`
  - `if (!comicStripHandled)`  
    - alte Pipeline (Consistency + N Bild-Calls + Sort + Upload)

---

## 2. Verfügbare Variablen (zum Zeitpunkt Story-Prompt-Bau)

Zum Zeitpunkt, an dem der Story-Prompt gebaut wird (vor dem LLM-Call), sind u.a. folgende Variablen im Scope (aus `req.json()` bzw. daraus abgeleitet):

| Variable | Typ / Herkunft | Hinweis |
|----------|----------------|---------|
| `userId` | `string` (aus Body) | Optional, kann fehlen. |
| `kidProfileId` | `string` (aus Body) | Optional. |
| `themeKey` | aus Body | Request: `themeKey`. Für Prompt: `resolvedThemeKey` (Z. 1746: themeKey \|\| themeKeyMapping[inferredStoryType] \|\| …). |
| `resolvedThemeKey` | `string` | Erst im NEW-Prompt-Pfad (try-Block um buildStoryPrompt) gesetzt; für Engine = „theme“. |
| `includeSelf` | aus Body | Boolean-Flag. |
| `surprise_characters` | als `surpriseCharactersParam` | Request: `surprise_characters`. Es gibt **keine** Variable `characterMode`; Modus muss aus `includeSelf` / `surpriseCharactersParam` abgeleitet werden. |
| `selectedCharacters` | `Array<{ name, age?, relation?, description? }>` (Body) | Kommentar Z. 1387: „Array<{name, age?, relation?, description?}>“. |
| `kidProfile` | nicht als einzelne Variable | Stattdessen: `resolvedKidName`, `resolvedKidAge` (Z. 1764–1765), ggf. aus DB geladen (Z. 1748–1762). Für Engine: Objekt `{ name: resolvedKidName, age: resolvedKidAge }`; `appearance` wird im aktuellen StoryRequest nicht übergeben. |
| `learningTheme` | nicht direkt | Learning-Theme kommt von `shouldApplyLearningTheme` → `learningThemeApplied` (Z. 1892). Für Engine: `learningThemeApplied` oder vorher das Ergebnis von `shouldApplyLearningTheme`. |
| `supabase` | Supabase-Client | Z. 1416: `createClient(supabaseUrl, supabaseKey)`. |
| `useComicStrip` | `boolean` | Z. 1419. |
| `comicLayout` | `ComicLayout | null` | Z. 1420. |
| `description` | `string` (Body) | User-Beschreibung der Geschichte. |
| `textType` | z.B. `'fiction' \| 'non-fiction'` (Body) | |
| `genConfig` | Objekt | Enthält `min_words`, `max_words`, `scene_image_count`, `include_cover` (aus `generation_config`). |
| `storyRequest` | `StoryRequest` | Wird im NEW-Prompt-Pfad gebaut (Z. 1812 ff.); enthält `kid_profile`, `theme_key`, `protagonists` (include_self, characters), `surprise_characters` usw. |

**Altersgruppe für Engine:**  
Nicht als `ageGroup`-String vorhanden. Wird abgeleitet z.B. über `resolveAgeGroup(kidAge)` (Z. 1459) → `'6-7' | '8-9' | '10-11'`.  
Im NEW-Prompt-Pfad gibt es `resolvedAgeGroup` (aus `generation_config`-Logik) bzw. eine Auflösung über `kidAge`; der genaue Name für „age group“ im Prompt-Bau-Kontext ist `resolvedAgeGroup` (Z. 1465).

---

## 3. Prompt-Building: Aktueller Zustand

- **Zusammensetzung:**  
  - **NEW path (usedNewPromptPath):**  
    - System: `fullSystemPromptFinal` = CORE Slim aus `loadPrompt('system_prompt_core_v2')` (Z. 1704, 1910).  
    - User: `userMessageFinal` = `promptResult.prompt` von **buildStoryPrompt(storyRequest, supabase)** (Z. 1872–1873), danach ggf. Learning-Theme injiziert (Z. 1893–1898), dann Creative Seed angehängt (Z. 1908).  
  - **OLD path:**  
    - System: aus mehreren geladenen Prompts zusammengesetzt (Z. 1914 ff.), `fullSystemPromptFinal` = compositePrompt.  
    - User: inline gebaut (Z. 2110 ff.) inkl. `image_plan` mit „scenes“.

- **if/else für Prompt basierend auf useComicStrip:**  
  **Ja**, aber **nach** dem Setzen von `fullSystemPrompt` / `userPrompt` (Z. 2018–2131):  
  - **Zeile 2133–2144:**  
    `if (useComicStrip && comicLayout && comicLayout.layoutKey !== 'layout_0_single')`  
    - Dann: `comicInstructions = buildComicStripInstructions(comicLayout)`.  
    - Ersetzung: Regex auf `userPrompt`:  
      `## IMAGE PLAN INSTRUCTIONS[...]All descriptions in ENGLISH. No text, signs, or readable writing in any scene.`  
      wird durch `comicInstructions` ersetzt (Z. 2136–2138), falls der Regex trifft (NEW path).  
    - Sonst (old path): `userPrompt += '\n\n' + comicInstructions + ...'` (Z. 2141).

- **Welche Funktion baut den System-Prompt?**  
  - NEW path: **Nicht** eine einzelne „System-Prompt-Funktion“; System = `coreSlimData` (geladenes CORE Slim).  
  - User-Prompt für NEW path: **buildStoryPrompt(storyRequest, supabase)** aus `promptBuilder.ts`; Parameter: `storyRequest`, `supabase`.

- **Parameter von buildStoryPrompt:**  
  `storyRequest` (StoryRequest), `supabase`.  
  `storyRequest` enthält u.a. kid_profile, theme_key, length, protagonists (include_self, characters), surprise_characters, series-Felder, word_count_override (min_words, max_words, scene_image_count).

---

## 4. Abweichungen von der 5b.4-Spezifikation

- **layout_0_single:**  
  Spec: „SONDERFALL: layout_0_single = alte Pipeline, nur über neuen Code-Pfad“ mit explizitem innerem `if (comicLayout.layoutKey === 'layout_0_single') { bestehende Pipeline } else { COMIC-STRIP }`.  
  Umsetzung: Kein innerer Zweig; `layout_0_single` wird durch `comicLayout.layoutKey !== 'layout_0_single'` aus dem Comic-Block ausgeschlossen. Verhalten äquivalent: Bei layout_0_single läuft nur die alte Pipeline.

- **Character Seed / emotionFlowResult:**  
  Spec: Im Comic-Strip-Branch „Character Seed Injection (ersetzt Task 5.4)“ mit `emotionFlowResult?.protagonistSeed?.appearance_en`.  
  Umsetzung: Keine Variable `emotionFlowResult`. Stattdessen Platzhalter-Kommentar (Z. 2883–2884) und `characterSeedAppearance: undefined` (Z. 2904). Kein anderer Variablenname.

- **callVertexImageAPI:**  
  Spec: „callVertexImageAPI(serviceAccountJson, prompt)“.  
  Code: `callVertexImageAPI(GEMINI_API_KEY, comicPrompt)` (Z. 2914).  
  Abweichung: Es wird `GEMINI_API_KEY` übergeben; laut Audit kann das aus `VERTEX_API_KEY_NEW` (Service Account JSON) oder `GEMINI_API_KEY` kommen. Variablenname also anders als „serviceAccountJson“, inhaltlich je nach Env dasselbe.

- **Upload / Bucket:**  
  Wie spezifiziert: `uploadImageToStorage(..., 'covers', prefix)`, flache Struktur, gleiche Response-Felder.

---

## 5. emotionFlowResult-Referenzen

- **Vorkommen:**  
  **Keine** Treffer für `emotionFlowResult` in `generate-story/index.ts`.

- **Deklaration:**  
  Es gibt **keine** Deklaration `let emotionFlowResult = …`.

- **Comic-Strip-Branch:**  
  Statt emotionFlowResult: Kommentar „Task 6.2 will inject protagonist appearance here“ und `characterSeedAppearance: undefined` (Z. 2904).  
  Für Task 6.2: Nach Aufruf von `runEmotionFlowEngine` eine Variable (z.B. `emotionFlowResult`) setzen und im Comic-Strip-Branch `comicPlan.characterAnchor = emotionFlowResult?.protagonistSeed?.appearance_en` bzw. `characterSeedAppearance: emotionFlowResult?.protagonistSeed?.appearance_en` verwenden.

---

## 6. Speicher-Mechanismus

- **DB-Schreiben in der Edge Function:**  
  In der Hauptlogik von generate-story gibt es **keinen** INSERT in `stories`.  
  Gefundene `stories`-Nutzung: z.B. `loadSeriesContext` (select), Episode-1-Update `series_id` (Z. 1315), `consistency_check_results.insert` (Z. 2746).  
  Die **Story** wird also von der Edge Function **nicht** in `stories` persistiert.

- **Response:**  
  Die Edge Function gibt nur ein **Response-Objekt** zurück (Z. 3127):  
  `return new Response(JSON.stringify({ ...story, structure_beginning, ..., coverImageBase64: coverImageUrl, storyImages: storyImageUrls, ..., comic_layout_key, comic_full_image, ... }))`.  
  Das Frontend (oder ein anderer Dienst) übernimmt vermutlich das Speichern in `stories`.

- **Relevante Response-Felder (Auszug):**  
  `...story`, `structure_beginning`, `structure_middle`, `structure_ending`, `emotional_coloring`, `emotional_secondary`, `humor_level`, `emotional_depth`, `moral_topic`, `concrete_theme`, `summary`, `learning_theme_applied`, `parent_prompt_text`, `coverImageBase64`, `storyImages`, `image_count`, `imageWarning`, `generationTimeMs`, `performance`, `usedNewPromptPath`, `episode_summary`, `continuity_state`, `visual_style_sheet`, `branch_options`, `series_mode`, `story_subtype`, `image_style_key`, **comic_layout_key**, **comic_full_image**, `series_episode_count`, `prompt_warnings`.

- **Emotion-Flow-Metadata einfügen:**  
  **Ort:** Direkt im gleichen Response-Objekt, z.B. nach Zeile 3176 (nach `comic_full_image`, vor `series_episode_count`).  
  **Kontext:** Gleiche Ebene wie `comic_layout_key` / `comic_full_image`; neue Felder z.B. `emotion_flow_metadata` oder einzelne Keys (blueprint_key, tone_mode, intensity_level, character_seed_key, …), damit das Frontend sie in `stories` (oder eine passende Tabelle) schreiben kann.

---

## 7. Engine Orchestrator (Task 6.1)

- **Datei:**  
  **Ja**, `supabase/functions/_shared/emotionFlow/engine.ts` existiert.

- **Export:**  
  **Ja:** `runEmotionFlowEngine`, Typ `EngineParamsWithSupabase`.

- **Parameter:**  
  Erwartet `EngineParamsWithSupabase` = `EngineParams & { supabase: EmotionFlowSupabase }`.  
  **EngineParams (types.ts):**  
  `kidProfileId`, `ageGroup` (AgeGroup), `theme`, `characterMode`, `kidProfile` (`{ name, age, appearance? }`), `selectedCharacters` (Array mit `name`, `relation?`, `description?`), `learningTheme?`.  
  Zusätzlich im Aufruf: `supabase`.

- **Abgleich mit generate-story:**  
  - `kidProfileId`: vorhanden (Body).  
  - `ageGroup`: nicht wörtlich; aus `kidAge`/`resolvedKidAge` ableiten (z.B. `resolveAgeGroup(kidAge)` → `'6-7'|'8-9'|'10-11'`).  
  - `theme`: `resolvedThemeKey` (string).  
  - `characterMode`: **fehlt**; aus `includeSelf` und `surpriseCharactersParam` ableiten (z.B. includeSelf → 'self', surprise → 'surprise', sonst 'family').  
  - `kidProfile`: aus `{ name: resolvedKidName, age: resolvedKidAge }`; `appearance` ggf. aus DB (kid_profiles) nachladen, falls für Relationship-Block nötig.  
  - `selectedCharacters`: vorhanden (Array mit name, relation?, description?); Engine nutzt intern auch `relation` (RelationshipBlock erwartet `relationship` → Mapping `relation` → `relationship` im Engine-Code bereits berücksichtigt).  
  - `learningTheme`: z.B. `learningThemeApplied` oder Rückgabe von `shouldApplyLearningTheme` vor dem Prompt-Bau.  
  - `supabase`: vorhanden.

- **Naming:**  
  - generate-story: `themeKey` / `resolvedThemeKey` → Engine: `theme`.  
  - generate-story: kein `characterMode` → muss abgeleitet werden.  
  - generate-story: `kidProfile` nur indirekt (resolvedKidName, resolvedKidAge) → Objekt für Engine bauen.

---

## Kurz: Was Task 6.2 wissen muss

1. **Emotion-Flow einbauen:**  
   Feature-Flag prüfen (z.B. `isEmotionFlowEnabled(userId, supabase)`); wenn an, **vor** dem Story-Prompt-Bau (und vor dem LLM-Call) `runEmotionFlowEngine(...)` aufrufen.  
   Parameter aus vorhandenen Variablen bauen: `kidProfileId`, `ageGroup` aus `resolveAgeGroup(kidAge)` o.ä., `theme: resolvedThemeKey`, `characterMode` aus `includeSelf`/`surpriseCharactersParam`, `kidProfile: { name: resolvedKidName, age: resolvedKidAge }`, `selectedCharacters`, `learningTheme: learningThemeApplied` (oder vorher ermitteln), `supabase`.

2. **Prompt:**  
   Ergebnis von `runEmotionFlowEngine` (z.B. `emotionFlowResult`) nutzen und die Prompt-Blöcke (arcBlock, toneBlock, characterBlock, elementBlocks, criticalRules) in den bestehenden Prompt- bzw. buildStoryPrompt-Fluss integrieren (z.B. über emotionFlowPromptBuilder oder direkte Injektion je nach Architektur).

3. **Comic-Strip + Emotion-Flow:**  
   Im Comic-Strip-Branch (Z. 2880 ff.) nach `parseComicStripPlan`:  
   `comicPlan.characterAnchor = emotionFlowResult?.protagonistSeed?.appearance_en` (oder gleich den Seed in buildComicStripImagePrompt übergeben).  
   `characterSeedAppearance` in `buildComicStripImagePrompt` (Z. 2904) von `undefined` auf `emotionFlowResult?.protagonistSeed?.appearance_en` setzen.

4. **Response:**  
   Emotion-Flow-Metadaten im gleichen Response-Objekt wie `comic_layout_key` / `comic_full_image` ergänzen (z.B. nach Z. 3176), damit das Frontend sie speichern kann.

5. **Kein INSERT stories in der Function:**  
   Nur Response erweitern; Persistenz in `stories` (inkl. Emotion-Flow-Felder) vermutlich im Frontend oder separatem Schritt.
