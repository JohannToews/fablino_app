# AUDIT: Image Prompt Style Assembly (no code changes)

Trace of every place style/art-direction text is appended to image prompts, with line numbers, sources, fallbacks, code paths, and dependency map.

---

## 1. imagePromptBuilder.ts — style locations

### 1.1 Constants (hardcoded)

| Line(s) | Literal / variable | Source | Used in |
|--------|---------------------|--------|---------|
| 69–75 | `EPISODE_MOOD` (Record<number, string>) | **(b) hardcoded** | `buildSeriesStylePrefix` not used directly; used in styleBlock when seriesContext |
| 80–108 | `buildSeriesStylePrefix(ctx)` — builds string from `ctx.visualStyleSheet` (characters, world_style, recurring_visual) + hardcoded "CRITICAL: Maintain EXACT..." | **(d) series context (from LLM/Ep1)** + **(b) hardcoded** | Prepended to prompt when series |
| 112 | `NO_TEXT_INSTRUCTION` | **(b) hardcoded** | Every scene/cover (V2 + legacy) |
| 114 | `NO_PHYSICAL_BOOK_NEGATIVE` | **(b) hardcoded** | negativeBlock (all paths) |

### 1.2 Age modifier (hardcoded fallback)

| Line(s) | Literal / variable | Source | Used in |
|--------|---------------------|--------|---------|
| 124–132 | `getAgeModifierFallback(age)` | **(b) hardcoded** (per-age strings) | Used when **no** imageStyleOverride (i.e. when getStyleForAge fails or returns fallback) |

**Fallback logic:**  
- `getStyleForAge` (lines 140–208): returns DB row from `image_styles` (imagen_prompt_snippet, age_modifiers, negative_prompt, consistency_suffix).  
- If DB lookup fails or no matching row, line 203–207: returns `{ styleKey: 'fallback', promptSnippet: getAgeModifierFallback(age), ageModifier: '' }`.  
- So **when DB is empty/fail, promptSnippet is the hardcoded age string** (e.g. "Art style: colorful children's illustration style...").

### 1.3 styleBlock assembly (V2 and legacy)

| Line(s) | Expression | Source of each part |
|--------|------------|----------------------|
| 329–331 | `ageModifier` (V2) | **(a)** imageStyleOverride = getStyleForAge → promptSnippet + ageModifier **or** **(b)** getAgeModifierFallback(childAge) |
| 333–339 | `styleBlock` (V2, series) | ageModifier, seriesContext.visualStyleSheet.world_style **(d)**, ageStyleRules.color_palette **(a)**, EPISODE_MOOD **(b)** |
| 334–345 | `styleBlock` (V2, non-series) | ageModifier, themeImageRules.image_style_prompt **(a)**, ageStyleRules.style_prompt **(a)**, themeImageRules.image_color_palette \|\| ageStyleRules.color_palette **(a)** |
| 341–345 | `negativeBlock` | NO_PHYSICAL_BOOK_NEGATIVE **(b)**, imageStyleOverride?.negative_prompt **(a)**, themeImageRules.image_negative_prompt **(a)**, ageStyleRules.negative_prompt **(a)**, + hardcoded "text, letters..." **(b)** |

Same pattern for **legacy** at 408–419 (ageModifier), 414–424 (styleBlock), 421–427 (negativeBlock).

### 1.4 Where style appears in the final prompt (V2 scene)

**buildSceneImagePromptV2** (lines 215–268) builds one scene. Concatenation order:

| Order | Section | Content source |
|-------|---------|----------------|
| 1 | `=== CHARACTER REFERENCE ... ===` | characterSheet (LLM) + optional protagonistGender |
| 2 | `CAMERA: ${scene.camera}` | LLM scene |
| 3 | `SCENE: ${scene.description}` | LLM scene |
| 4 | `ATMOSPHERE: ${worldAnchor}` | LLM image_plan.world_anchor |
| 5 | `STYLE: ${styleBlock}` | **styleBlock** (see 1.3) — already contains ageModifier + theme/age rules (and series if set) |
| 6 | `${ageModifier}` | **Same ageModifier again** (duplication) |
| 7 | `${NO_TEXT_INSTRUCTION}` | hardcoded |
| 8 | `NEGATIVE: ${negativePrompt}, ...` | negativeBlock + extra character-related negatives |

**Duplication:** `ageModifier` is inside `styleBlock` (first element of the array that becomes styleBlock) and is then appended again on the next line (266).

### 1.5 Cover V2 (buildCoverImagePromptV2)

Lines 273–308: same pattern — `STYLE: ${styleBlock}`, then `${ageModifier}` (305–306). Same duplication.

### 1.6 Legacy cover (coverLines)

Lines 416–435:  
seriesPrefix (if series), then literal `'Children book cover illustration.'`, character anchor, gender line, Setting (world_anchor), literal `'The character(s) in a calm, inviting pose...'`, series cover hint (if series), **`Style: ${styleBlock}`**, NO_TEXT_INSTRUCTION.  
Here style appears once (styleBlock only), but styleBlock still contains ageModifier + theme/age rules.

### 1.7 Legacy scene (sceneLines)

Lines 439–453:  
seriesPrefix, literal `'Children\'s illustration, full-bleed interior scene...'`, character anchor, gender line, Setting, Scene description, Emotional expression, **`Style: ${styleBlock}`**, NO_TEXT_INSTRUCTION.  
Again styleBlock only once; no second ageModifier line.

### 1.8 buildFallbackImagePrompt (cover-only path)

Lines 384–421:  
ageModifier from imageStyleOverride or getAgeModifierFallback; styleBlock = [ageModifier, theme/age rules] (series vs non-series same as main). Prompt: seriesPrefix, literal `'Children\'s illustration, full-bleed cover art...'`, characterDescription, title theme, series hint, **`Style: ${styleBlock}`**, NO_TEXT_INSTRUCTION.  
Single style block, no extra ageModifier line.

---

## 2. comicStripPromptBuilder.ts — style locations

### 2.1 Hardcoded style / grid text

| Line(s) | Literal / variable | Source |
|--------|---------------------|--------|
| 228–229 | `NO_PHYSICAL_BOOK`, `NEGATIVE_PROMPT` | **(b) hardcoded** |
| 232–233 | `NO_TEXT_RULE` | **(b) hardcoded** |
| 235–236 | `COMIC_GRID_RULES_REFINED`, `STYLE_CONSISTENCY_LEGACY` | **(b) hardcoded** |
| 239–248 | `CAMERA_DIRECTIONS` | **(b) hardcoded** |
| 253–254 | `GRID_LAYOUT_RULES` | **(b) hardcoded** |

### 2.2 buildComicGridPrompt (LLM grid_1 / grid_2 path)

| Line(s) | Section | Content source |
|--------|---------|----------------|
| 274–275 | First line of prompt | **`imageStylePrefix`** — passed in from caller |
| 276–277 | "Create a 2x2 grid..." | **(b) hardcoded** |
| 277 | `Setting: ${worldAnchor}` | **(c) LLM** (image_plan.world_anchor) |
| 279 | `GRID_LAYOUT_RULES` | **(b) hardcoded** |
| 281 | "CRITICAL: Each of the 4 panels..." | **(b) hardcoded** |
| 283–285 | Panel descriptions | **(c) LLM** (grid panels scene_en, camera) |
| 287–288 | Character reference + gender line | characterAnchor (LLM or buildAppearanceAnchor) + **(b) hardcoded** |
| 289–290 | NO_TEXT_RULE, consistencySuffix | **(b)** + **(a)** consistencySuffix from DB (image_styles.consistency_suffix) or default |

**imageStylePrefix** is built in **generate-story** (lines 3421–3425):  
`[ seriesImageCtx?.visualStyleSheet ? 'SERIES VISUAL CONSISTENCY...' : '', imageStyleData?.promptSnippet || '', imageStyleData?.ageModifier || '' ].filter(Boolean).join('\n')`.  
So: **(d)** series context (optional) + **(a)** getStyleForAge (promptSnippet, ageModifier). **No fallback** when imageStyleData is null — empty string, so comic can start with no style line.

### 2.3 buildComicStripImagePrompts (4-panel / 8-panel fallback path)

| Line(s) | Section | Content source |
|--------|---------|----------------|
| 361–365 | characterAnchor | **(c)** plan.characterAnchor or **(d)** characterSeedAppearance (My Look / emotion flow) |
| 367–372 | styleBlockParts: seriesStylePrefix (optional), then styleBlock = layout.promptTemplate.replace('{style}', styleContent) where styleContent = [stylePrompt, ageModifier].join(', ') | **(d)** series + **(a)** stylePrompt + ageModifier from caller |
| 385 | styleBlock | layout.promptTemplate is **(b)** hardcoded in layouts.ts (e.g. "Digital comic book page, 2x2 grid..., {style}."); {style} = stylePrompt + ageModifier from **(a)** |
| 368–369 | gridRule | **(b)** COMIC_GRID_RULES_REFINED or STYLE_CONSISTENCY_LEGACY |
| 362–372 | buildOnePrompt: styleBlockParts (series + styleBlock), then "Create a 2x2 grid...", gridRule, panel blocks, character anchor, IMPORTANT lines, NO_TEXT_RULE | As above |

Caller (generate-story 3527–3534, 3568–3575) passes:  
`stylePrompt: imageStyleData?.promptSnippet || ''`, `ageModifier: imageStyleData?.ageModifier || ''`.  
**Fallback when DB null:** empty string — no hardcoded style in comicStripPromptBuilder for this path.

---

## 3. appearanceAnchor.ts

**No style/art-direction text** is appended to image prompts here.  
It only builds a **character description string** (age, gender, skin, hair, glasses, clothing hint) used as `character_anchor` or inside character_sheet `full_anchor`. So it is **(d) other** (kid_appearance DB + hardcoded maps). Not a second source of "art style" in the prompt.

---

## 4. Where style text comes from (summary)

| Source | Description | Where used |
|--------|-------------|------------|
| **(a) DB image_styles** | getStyleForAge → promptSnippet (imagen_prompt_snippet), ageModifier (age_modifiers[ageGroup]), negative_prompt, consistency_suffix | V2/legacy/fallback styleBlock; comic imageStylePrefix / stylePrompt+ageModifier |
| **(a) DB image_style_rules** | loadImageRules → ageRules: style_prompt, negative_prompt, color_palette (by age_group) | styleBlock (non-series), negativeBlock |
| **(a) DB theme_rules** | loadImageRules → themeRules: image_style_prompt, image_negative_prompt, image_color_palette (columns may not exist yet) | styleBlock, negativeBlock |
| **(b) hardcoded** | getAgeModifierFallback, NO_TEXT_*, NO_PHYSICAL_BOOK_*, EPISODE_MOOD, buildSeriesStylePrefix tail, comic grid/camera/negative strings, layout.promptTemplate | All paths |
| **(c) LLM** | image_plan.world_anchor, scene.description, scene.camera, character_sheet, grid scene_en | Scene/cover content, not "style" per se |
| **(d) series / seed** | visualStyleSheet (Ep1 or loaded), character seed appearance | seriesPrefix, styleBlock (world_style), character anchor |

---

## 5. Hardcoded style fallback when DB is empty/null

| Location | Fallback logic |
|----------|----------------|
| **getStyleForAge** (imagePromptBuilder 203–207) | On DB fail or no row: return `promptSnippet: getAgeModifierFallback(age)`, ageModifier: `''`. So **full style is hardcoded age string**. |
| **buildImagePrompts** (V2 + legacy 329–331, 408–410) | If no imageStyleOverride: `ageModifier = getAgeModifierFallback(childAge)`. So **fallback is hardcoded**. |
| **buildFallbackImagePrompt** (389–391) | Same: imageStyleOverride or getAgeModifierFallback(childAge). |
| **Comic (generate-story)** | imageStylePrefix / stylePrompt / ageModifier use `imageStyleData?.promptSnippet || ''`, `imageStyleData?.ageModifier || ''`. **No hardcoded fallback** — empty string if no imageStyleData. |
| **buildComicStripImagePrompts** | Uses whatever caller passes; caller can pass empty strings. **No fallback inside comicStripPromptBuilder**. |

---

## 6. Code paths that call style-assembly functions

| Path | Entry | Style logic shared with |
|------|--------|--------------------------|
| **V2 (character_sheet)** | buildImagePrompts (hasCharacterSheet && scenes) → buildCoverImagePromptV2, buildSceneImagePromptV2 | Same styleBlock/negativeBlock/ageModifier as legacy in same file; series vs non-series same formula. **Difference:** V2 passes styleBlock + ageModifier into V2 builders, so ageModifier appears twice in prompt. |
| **Legacy** | buildImagePrompts (else branch) → coverLines, sceneLines | Same styleBlock/negativeBlock/ageModifier build as V2; style appears once as `Style: ${styleBlock}` (no second ageModifier line). |
| **Cover-only fallback** | buildFallbackImagePrompt | Same styleBlock/negativeBlock construction as buildImagePrompts (series vs non-series). Single `Style: ${styleBlock}`. |
| **Comic (LLM grid_1/grid_2)** | generate-story builds imageStylePrefix → buildComicGridPrompt / buildComicGridPromptV2 | **Different** from main: only series + promptSnippet + ageModifier (no image_style_rules, no theme_rules). Uses image_styles only. |
| **Comic (4/8-panel parseComicStripPlan)** | buildComicStripImagePrompts(stylePrompt, ageModifier, seriesStylePrefix) | Same as comic grid: stylePrompt + ageModifier from getStyleForAge only; layout.promptTemplate wraps them. No image_style_rules/theme_rules. |

So: **V2, legacy, and buildFallbackImagePrompt** share the same style assembly (styleBlock = ageModifier + theme + age rules; series adds series prefix + world_style + EPISODE_MOOD). **Comic paths** use a simpler set: series (optional) + image_styles (promptSnippet, ageModifier) only.

---

## 7. Exact final prompt assembly order (one scene, V2 path)

Order of concatenation in **buildSceneImagePromptV2** for one scene:

1. Literal: `"=== CHARACTER REFERENCE (MUST MATCH EXACTLY) ===\n"`  
2. characterLines (from characterSheet)  
3. Literal: `"\n\nCRITICAL: Every character MUST look EXACTLY...\n=== END CHARACTER REFERENCE ===\n\n"`  
4. `"CAMERA: " + scene.camera`  
5. `"\n\nSCENE: " + scene.description`  
6. `"\n\nATMOSPHERE: " + worldAnchor`  
7. `"\n\nSTYLE: " + styleBlock`  ← styleBlock = ageModifier + themeImageRules.image_style_prompt + ageStyleRules.style_prompt + (theme|age) color_palette (or series variant)  
8. `"\n" + ageModifier`  ← **duplication** (ageModifier already in styleBlock)  
9. `"\n" + NO_TEXT_INSTRUCTION`  
10. `"\n\nNEGATIVE: " + negativePrompt + ", inconsistent character appearance, ..."`

So duplication: **ageModifier** appears inside `styleBlock` (first element) and again as its own line.

---

## 8. Dependency map [Source] → [Function] → [Prompt section]

| Source | Function | Prompt section |
|--------|----------|----------------|
| image_styles.imagen_prompt_snippet + age_modifiers (getStyleForAge) | buildImagePrompts (V2/legacy) | ageModifier → styleBlock (first element) and again as standalone line (V2 only) |
| image_styles (getStyleForAge) | generate-story → buildComicGridPrompt / buildComicStripImagePrompts | imageStylePrefix / stylePrompt+ageModifier → first block or layout `{style}` |
| image_style_rules (loadImageRules) style_prompt, negative_prompt, color_palette | buildImagePrompts (V2/legacy), buildFallbackImagePrompt | styleBlock (non-series), negativeBlock |
| theme_rules (loadImageRules) image_style_prompt, image_negative_prompt, image_color_palette | buildImagePrompts (V2/legacy), buildFallbackImagePrompt | styleBlock (non-series), negativeBlock |
| getAgeModifierFallback(age) | getStyleForAge (when DB fail), buildImagePrompts (when no imageStyleOverride) | promptSnippet (fallback) or ageModifier → styleBlock + again in V2 |
| EPISODE_MOOD, buildSeriesStylePrefix(seriesContext) | buildImagePrompts (V2/legacy), buildFallbackImagePrompt | seriesPrefix; styleBlock (series) includes world_style, color_palette, EPISODE_MOOD |
| visualStyleSheet (series) | generate-story → imageStylePrefix (comic) or seriesContext → buildSeriesStylePrefix | Comic: first line of imageStylePrefix; main: seriesPrefix then styleBlock |
| NO_TEXT_INSTRUCTION, NO_PHYSICAL_BOOK_NEGATIVE, negative tail | buildImagePrompts, buildFallbackImagePrompt | Every prompt (no-text line); negativeBlock |
| layout.promptTemplate (e.g. "Digital comic book page... {style}.") | buildComicStripImagePrompts | styleBlock = template with stylePrompt + ageModifier |
| GRID_LAYOUT_RULES, COMIC_GRID_RULES_REFINED, CAMERA_DIRECTIONS, NEGATIVE_PROMPT, NO_TEXT_RULE | buildComicGridPrompt, buildComicStripImagePrompts | Grid rules, panel text, negative, no-text |
| image_styles.consistency_suffix | buildComicGridPrompt (via generate-story) | Suffix line at end of comic prompt |

---

## 9. Contradiction / duplication summary

- **Duplication:** In V2 scene and cover, `ageModifier` is the first part of `styleBlock` and is then appended again. Same content twice.
- **Multiple style DB sources:** styleBlock (non-series) merges (1) image_styles (via ageModifier/promptSnippet), (2) theme_rules.image_style_prompt, (3) image_style_rules.style_prompt, (4) theme/age color_palette. If more than one is set, they are concatenated and can overlap or contradict (e.g. "soft children's illustration" vs "graphic novel").
- **Comic vs main:** Comic uses only image_styles (promptSnippet, ageModifier); main path also adds image_style_rules and theme_rules. So comic and main can look different for the same story.
- **Fallback:** When image_styles has no row, getAgeModifierFallback fills in; when image_style_rules/theme_rules are empty, filter(Boolean) drops them — no extra duplication, but comic gets no style if getStyleForAge fails (empty string).

End of audit.
