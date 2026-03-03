# Fablino Story Pipeline Architecture

> Auto-generated from source code audit on 2025-02-24. Updated 2026-03-02 (Visual Director).  
> This document reflects the **ACTUAL** current state of the codebase.  
> Reference: `architecture.md` (high-level), no `datamodel.md` in repo.

---

## Pipeline Overview (visual)

```
[Frontend: CreateStoryPage / OnboardingStoryPage]
         │
         │  Wizard: StoryType → Characters → Effects → ImageStyle
         │  Body: length, difficulty, description, characters, storyType, kidProfileId, ...
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  supabase.functions.invoke("generate-story", { body })                      │
└────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  generate-story/index.ts                                                    │
│  1. Parse body, resolve params (storyLanguage, themeKey, seriesId, ...)     │
│  2. Load kid_profile, kid_appearance (by kid_profile_id)                    │
│  3. Load series context if isSeries/seriesId (previous episodes, VSS)      │
│  4. Load generation_config (age_group, story_length → min/max words, N)    │
│  5. selectStorySubtype(theme) → round-robin subtype                         │
│  6. [Optional] isEmotionFlowEnabled(userId) → runEmotionFlowEngine()        │
│  7. buildStoryPrompt(storyRequest, supabase) → userMessage                  │
│  8. loadPrompt('system_prompt_core_v2') → systemPrompt (app_settings)       │
│  9. shouldApplyLearningTheme() → injectLearningTheme() into userMessage     │
│ 10. callLovableAI(systemPrompt, userMessage) → raw LLM response            │
└────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  Parse LLM JSON: title, content, questions, vocabulary, image_plan*,        │
│  structure_*, emotional_*, learning_theme_applied, episode_summary,        │
│  continuity_state, visual_style_sheet, comic_*, ...                        │
│  (* image_plan only when !useVisualDirector; else omitted in request)       │
└────────────────────────────────────────────────────────────────────────────┘
         │
         ├── includeSelf && kidAppearance → buildAppearanceAnchor() → image_plan.character_anchor (classic/VD merge)
         │
         ├── [Visual Director path] useVisualDirector && !comicStripHandled
         │   → callVisualDirector(story) + consistency check in parallel
         │   → mapVisualDirectorToImagePlan(vdOutput, kidAppearanceAnchor) → ImagePlan (character_sheet, scenes, cover.camera)
         │   → buildImagePrompts(plan) V2: buildSceneImagePromptV2 / buildCoverImagePromptV2 (camera, background_figures, character count)
         │   → Vertex AI (or Lovable Gateway fallback) per image → upload → URLs
         │
         ├── [Classic path] image_plan from Call 1 (or fallback LLM when !useVisualDirector)
         │   → image_plan.scenes + character_anchor → buildImagePrompts() → cover + N scene prompts
         │   → Vertex AI (or Lovable Gateway fallback) per image → upload → URLs
         │
         └── [Comic path] image_plan.grid_1, grid_2, character_anchor
             → buildComicStripImagePrompts → 2 grid images → Vertex → comic_full_image, comic_full_image_2
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  Phase 2 UPDATE stories SET title, content, story_generation_ms,           │
│           generation_status = 'text_complete'                               │
│  Phase 3 UPDATE stories SET cover_image_url, story_images, ...,            │
│           generation_status = 'images_complete' | 'images_failed'            │
│  Phase 4 Consistency check → generation_status = 'verified'                │
│  Return JSON to client (all metadata); client persists to DB as needed     │
└────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
[Frontend: CreateStoryPage] INSERT/UPDATE stories (full payload), comprehension_questions,
  series_id self-reference for Episode 1, invalidate cache → navigate to /read/:id
```

---

## Stage 1: User Input Collection

### 1.1 Story Wizard Flow

- **Entry:** `CreateStoryPage.tsx` — two paths: **Weg A** "Ich erzähle selbst" (free text/voice) → jumps to effects; **Weg B** "Schritt für Schritt" → Story Type → Characters → Effects.
- **Story Type:** `StoryTypeSelectionScreen.tsx` — theme tiles: fantasy, action, animals, everyday, humor, educational, surprise. Length (short/medium/long), difficulty, series toggle, story language. Output: `StoryType`, `StorySettings`.
- **Characters:** `CharacterSelectionScreen.tsx` — tiles: Me, Family, Friends, Surprise. "Überrasch mich" (surprise) = fictional-only, no real names. Selected characters with name, type, age, gender, role, relation. Output: `SelectedCharacter[]`, optional `surprise_characters` flag.
- **Effects:** `SpecialEffectsScreen.tsx` — special attributes (superpowers, magic, heroes_villains, transformations, talents), optional free text, voice input (`VoiceRecordButton`). Overrides for length, difficulty, series, story language. Output: `StorySettingsFromEffects`, description string.
- **Image Style:** `ImageStylePicker.tsx` — loads active styles from `image_styles`, filtered by kid age group (6-7, 8-9, 10-11). Pre-select: kid profile `image_style` > age default > first. Selected `image_style_key` sent in request and saved to `kid_profiles.image_style` after success.

**Files:** `src/pages/CreateStoryPage.tsx`, `src/components/story-creation/StoryTypeSelectionScreen.tsx`, `CharacterSelectionScreen.tsx`, `SpecialEffectsScreen.tsx`, `ImageStylePicker.tsx`, `VoiceRecordButton.tsx`, `types.ts`.

### 1.2 My Look / Appearance Data

- **UI:** My Look is on a dedicated page: `src/pages/MyLookPage.tsx`. Not inside `KidProfileSection.tsx` (no appearance fields there). Feature flag: `app_settings.avatar_builder_enabled_users` (JSON array of user IDs or `["*"]`).
- **Fields saved to `kid_appearance`:** (from DB types and migration)
  - `kid_profile_id`, `skin_tone`, `hair_length`, `hair_type`, `hair_style`, `hair_color`, `glasses`, `eye_color` (added in later migration; default `'brown'`).
- **Persistence:** `MyLookPage.tsx` upserts one row per `kid_profile_id` into `kid_appearance`. Backend loads this by `kid_profile_id` when building the story request and passes the row to `buildAppearanceAnchor()` for image prompts.

✅ **Confirmed:** All listed fields flow through; `eye_color` is optional in `buildAppearanceAnchor` (used if present).

### 1.3 Kid Profile Context

- **Source:** `useKidProfile.tsx` — selected profile from `kid_profiles`: name, age, gender, hobbies, school_class, school_system, difficulty_level, content_safety_level, story_languages, image_style, etc.
- **Language derivation:** `getKidLanguage(school_system)` → KidLanguage (VALID_LANGUAGES + SCHOOL_SYSTEM_TO_LANG e.g. iran→fa, afghanistan→fa). Fallback `'en'` for unknown.
- **Sent to backend:** `kidProfileId`, `kidName`, `kidAge`, `kidHobbies`, `difficultyLevel`, `contentSafetyLevel`, `storyLanguage`, `image_style_key`, `includeSelf` (true if "Me" character selected).

### 1.4 Image Style Selection

- **Table:** `image_styles` (key, label, preview_image_url, etc.). Filtered by age group in `ImageStylePicker`.
- **Selection:** User picks one style key; sent as `image_style_key`. Backend uses it to load `image_style_rules` and apply style_prompt, negative_prompt, color_palette to image generation.

---

## Stage 2: Request Assembly (Frontend → Backend)

### 2.1 API Call Parameters

**Fiction path** (`generateFictionStory` in CreateStoryPage.tsx) sends:

- `length`, `difficulty`, `description`, `textType: "fiction"`, `textLanguage`, `globalLanguage`, `userId`, `source: 'kid'`
- `isSeries`, `storyType`, `characters` (array of { name, type, age, gender, role, relation, description }), `specialAttributes`, `subElements`, `humorLevel`, `additionalDescription`
- `kidName`, `kidHobbies`, `seriesMode`, `endingType`, `storyLanguage`, `includeSelf`, `surprise_characters`, `kidProfileId`, `kidAge`, `difficultyLevel`, `contentSafetyLevel`, `image_style_key`, `story_id` (placeholder row id when using incremental updates)

**Educational path** sends: `length`, `difficulty`, `description`, `textType: "non-fiction"`, `textLanguage`, etc., no characters/themes.

### 2.2 What gets sent to generate-story

- Body is the single object above. Backend reads all fields via `await req.json()` and maps to internal names (e.g. `storyLanguageParam`, `imageStyleKeyParam`, `storyIdParam`, `surpriseCharactersParam`).

---

## Stage 3: Backend Prompt Construction

### 3.1 System Prompt (source, content)

- **Source:** `app_settings` table. New path: `loadPrompt('system_prompt_core_v2')` — single key; if missing, throws.
- **Fallback path:** Composite from `system_prompt_${adminLangCode}`, `system_prompt_story_creation_${adminLangCode}`, `system_prompt_kid_creation_${adminLangCode}`, `system_prompt_continuation_${adminLangCode}`; else `customSystemPrompt` from request or empty.
- ✅ System prompt text is **not** hardcoded in promptBuilder; it is always loaded from DB (or request custom).

### 3.2 User Message Assembly (every block, in order)

From `promptBuilder.ts`, sections are pushed in this order:

1. **Instruction** — `headers.instruction`
2. **CHILD** — name, age, optional appearance (buildPromptAppearanceDesc — text description in story language)
3. **PRIMARY DIRECTIVE** (optional) — only if `userInputLevel === 'rich'` and `request.user_prompt`
4. **CRITICAL LANGUAGE INSTRUCTION** — "Write the ENTIRE story in {LANGUAGE_NAMES[lang]} (lang)." (for BETA_LANG_CODES)
5. **LANGUAGE & LEVEL** — vocabulary/sentence rules from age_rules and difficulty_rules
6. **VOCABULARY** — question count and vocabulary rules
7. **TEXT LENGTH** — length section (from age/difficulty/length)
8. **STORY SUBTYPE** (optional) — if `request.story_subtype` and not rich user input
9. **CATEGORY / THEME** — surprise hint or theme_rules block (plot_templates, setting_descriptions, etc.)
10. **CHARACTERS** — relationship logic, max characters, antagonist guidelines; optional fictional/restricted/enrichment hints
11. **SPECIAL EFFECTS** (optional) — from special_abilities
12. **SUB-ELEMENTS** (optional) — from request.sub_elements
13. **GUARDRAILS** — allowed/forbidden from content_themes_by_level, safety level
14. **VARIETY** (optional) — variety block from recent stories
15. **SPECIAL REQUEST / PROMINENT ELEMENT** (optional) — if userInputLevel === 'hint' and request.user_prompt
16. **SERIES CONTEXT** (optional) — buildSeriesContextBlock(request) or legacy request.series_context
17. **IMAGE PLAN INSTRUCTIONS** — scene count, guidance, target_paragraph, English-only (omitted when **useVisualDirector**, so Call 1 does not request image_plan)
18. **Respond JSON** — headers.respondJson
19. **CRITICAL CONSTRAINT** — word count min/max

### 3.3 Rule Table Queries (age, difficulty, theme, emotion)

- **age_rules:** `language`, `min_age`/`max_age` (from kid age). Fallback: en, then de. Columns used: narrative_guidelines, min_word_count, max_word_count, etc.
- **difficulty_rules:** `language`, `difficulty_level` (from kid profile). Fallback: en, then de. Used for word counts, sentence length, labels.
- **theme_rules:** `theme_key`, `language`. Fallback: en, de, then theme_key 'everyday' lang 'de'. Used for category/theme block (plot_templates, setting_descriptions, character_archetypes, etc.).
- **content_themes_by_level:** Allowed/forbidden by min_safety_level for guardrails.
- ⚠️ **emotion_rules:** **Not queried** in promptBuilder. The table exists and is seeded (e.g. from EN for beta langs); Emotion Flow Engine uses its own selectors (blueprint, tone, character, element), not the emotion_rules table directly for prompt text.

### 3.4 Story Subtype Selection & Round-Robin

- **Where:** `generate-story/index.ts` calls `selectStorySubtype(supabase, resolvedThemeKey, kidProfileId, ...)`.
- **Logic:** Implemented in `_shared/storySubtypeSelector.ts` — round-robin by theme and kid; avoids repeating same subtype too soon. Returns `SelectedSubtype` (subtypeKey, promptHint, label).
- **Injection:** `story_subtype` is passed into `StoryRequest` and promptBuilder adds the **STORY SUBTYPE** block when present and user input is not 'rich'.
- **History:** `recordSubtypeUsage()` is called after generation to record usage for round-robin.

### 3.5 Learning Theme Injection

- **Check:** `shouldApplyLearningTheme(kidProfileId, storyLanguage, supabase)` in `learningThemeRotation.ts` — reads `parent_learning_config` by kid_profile_id; uses `active_themes`, `frequency`, and count of stories since last `learning_theme_applied` to decide if it's "time". Round-robin within active_themes.
- **Injection:** `injectLearningTheme(prompt, themeLabel, storyLanguage, storyGuidance)` in **promptBuilder.ts** — inserts a learning-theme section **before** the "Respond JSON" line (or appends). Called from generate-story when `shouldApplyLearningTheme` returns a result.

### 3.6 Character & Appearance Anchor

- **Text (prompt):** promptBuilder uses `buildPromptAppearanceDesc` for the **CHILD** section (story-language description for narrative consistency). Not the image anchor.
- **Image anchor:** `buildAppearanceAnchor(kidName, kidAge, kidGender, kidAppearance)` is in `appearanceAnchor.ts` and is **only called from generate-story/index.ts** — not from promptBuilder. It produces a single English string for image prompts (e.g. "8-year-old girl with light skin, blue eyes, medium-length brown hair, loose wavy hair, wearing glasses, wearing a colorful top"). Used to set `image_plan.character_anchor`, `visual_style_sheet.characters[kidName]`, and comic strip `characterAnchor`.

### 3.7 Series Context (if applicable)

- **Load:** When `isSeries || seriesId` and `seriesId` and episode number, `loadSeriesContext(supabase, seriesId, episodeNumber)` fetches previous episodes from `stories` (series_id, episode_number < current). Returns `previousEpisodes`, `lastContinuityState`, `visualStyleSheet` (from Episode 1's `visual_style_sheet`).
- **Injection:** `buildSeriesContextBlock(request)` in promptBuilder uses `series_previous_episodes`, `series_continuity_state`, `series_visual_style_sheet`, and episode config (EPISODE_CONFIG) for function_name, requirements, preferred structure. Optional blocks for branch chosen, interactive finale, branch options (Modus B).

### 3.8 Word Count & Structural Targets

- **Source:** If `request.word_count_override` exists (from generation_config), min/max words taken from there. Otherwise `age_rules.min_word_count` / `max_word_count` multiplied by `factor` from length (short 0.7, medium 1.0, long 1.4, extra_long 2.0).
- **generation_config:** Loaded by `age_group` and `story_length`; provides `min_words`, `max_words`, `scene_image_count`, `include_cover`. Used for word-count constraint and image count N.

---

## Stage 4: LLM Call

### 4.1 Model Selection & Fallback Chain

- **Primary:** Lovable AI Gateway — `https://ai.gateway.lovable.dev/v1/chat/completions`, model `google/gemini-2.5-flash`.
- **Retries:** Rate limit 429 → exponential backoff (2s, 4s, 8s), up to 3 retries.

### 4.2 Request Parameters (temperature, tokens)

- Temperature set in call (default 0.8 in `callLovableAI`). No explicit max_tokens in the snippet seen; gateway default applies.

### 4.3 Expected Response JSON Schema

LLM is instructed to return JSON. When **useVisualDirector** is true, the request does **not** ask for `image_plan` (Visual Director produces it in a second LLM call). Parsed fields include:

- `title`, `content`
- `questions` (array: question, correctAnswer/expectedAnswer, options)
- `vocabulary` (array: word, explanation)
- `image_plan` (only when !useVisualDirector): { `character_anchor`, `world_anchor`, `scenes` (scene_id, story_position, description, emotion, key_elements, target_paragraph) } or comic format with `grid_1`, `grid_2`, `character_anchor`
- `structure_beginning`, `structure_middle`, `structure_ending`, `emotional_coloring`, `emotional_secondary`, `humor_level`, `emotional_depth`, `moral_topic`, `concrete_theme`, `learning_theme_applied`, `parent_prompt_text`
- Series: `episode_summary`, `continuity_state`, `visual_style_sheet`
- Comic: `comic_layout_key`, `comic_full_image`, `comic_full_image_2`, `comic_panel_count`, `comic_grid_plan`
- Optional: `branch_options` for interactive series

### 4.4 Response Parsing & Validation

- **Parser:** `safeParseStoryResponse(raw)` — strips markdown code fences, tries JSON.parse, then extracts first `{` to last `}`, then regex fallback for "content"/"text" field.
- **Word count:** Validated; retry if below minimum (logic in generate-story).

---

## Stage 5: Image Generation

### 5.1 Visual Director Pipeline (optional; N individual images)

- **When:** `useVisualDirector` is true and comic strip is not used. Call 1 does **not** request `image_plan`; fallback image_plan LLM is **skipped**.
- **Flow:** After story is saved (Phase 2), inside image block: `Promise.allSettled([ callVisualDirector(...), consistencyCheckTask() ])`. **Visual Director** (`_shared/visualDirector.ts`) is a second LLM call: input = story title + content; output = `character_sheet` (full_anchor per character, token balance 25–40 words), `world_anchor`, `scenes` (scene_description, camera, characters_present, key_objects, atmosphere, background_figures), `cover` (description, characters_present, mood, camera). **Adapter:** `mapVisualDirectorToImagePlan(vdOutput, kidAppearanceAnchor, …)` in imagePromptBuilder maps VD output to ImagePlan; protagonist = DB physical (Mein Look) + VD clothing. **Prompts:** `buildImagePrompts(plan)` uses **V2 path**: `buildSceneImagePromptV2` / `buildCoverImagePromptV2` with character_sheet, per-scene camera, `background_figures` (none/few/crowd), explicit character count, cover camera from VD. Images generated in parallel → upload → `cover_image_url`, `story_images` array.

### 5.2 Classic Pipeline (N individual images)

- **N:** From `generation_config.scene_image_count` for resolved age_group and story_length (+ 1 cover if `include_cover`). Fallback hardcoded: scene_image_count 3, include_cover true.
- **Flow:** Parse `image_plan` from LLM (or run fallback LLM for image_plan when missing and !useVisualDirector). If `includeSelf && kidAppearance`, override `image_plan.character_anchor` with `buildAppearanceAnchor(...)`. Build prompts via `buildImagePrompts(imagePlan, ...)` → cover + N scene prompts. Each prompt includes `Characters: ${imagePlan.character_anchor}` and gender-clarity line. Images generated in parallel (Vertex AI primary, Lovable Gateway fallback). Upload to storage → `cover_image_url`, `story_images` array.

### 5.3 Comic Strip Pipeline (1 or 2 images → crop)

- **When:** `isComicStripEnabled(userId)` and `image_plan` has `grid_1`, `grid_2`, `character_anchor`. Parsed into `ComicImagePlan`.
- **Flow:** Two grid prompts built (e.g. `buildComicGridPrompt`). Two Vertex calls → `comicFullImageUrl`, `comicFullImageUrl2`. Legacy mapping: `cover_image_url = comic_full_image`, `story_images = [comic_full_image_2]`. No per-scene images.
- **Character anchor:** Same `buildAppearanceAnchor()` when `includeSelf && kidAppearance`; else `emotionFlowResult?.protagonistSeed?.appearance_en` or plan's character_anchor.

### 5.4 Image Prompt Construction

- **imagePromptBuilder.ts:** `buildImagePrompts(imagePlan, seriesContext?)` produces cover prompt + scene prompts. **V2 path** (when `imagePlan.character_sheet` present, e.g. from Visual Director): `buildSceneImagePromptV2` / `buildCoverImagePromptV2` — CHARACTER REFERENCE block per scene, per-scene `camera`, `background_figures` (none/few/crowd) with explicit character count and negative suffixes, cover uses `imagePlan.cover?.camera`. **Legacy path:** each prompt uses `imagePlan.character_anchor`, `imagePlan.world_anchor`, scene description. Series: prepends `buildSeriesStylePrefix(SeriesImageContext)` with Visual Style Sheet (characters, world_style, recurring_visual). Age modifier from `getAgeModifierFallback(age)`. Style from `image_style_rules` (style_prompt, negative_prompt, color_palette). NO_TEXT_INSTRUCTION and NO_PHYSICAL_BOOK_NEGATIVE appended.

### 5.5 Character Anchor Injection

- **Classic:** Set on `image_plan.character_anchor` (and fallback plan) in generate-story before calling `buildImagePrompts`. imagePromptBuilder uses `imagePlan.character_anchor` in every prompt line "Characters: ...".
- **Comic:** Same anchor set on comic plan; used in `buildComicStripImagePrompt` / grid prompts.
- **Series Episode 1:** When building `visual_style_sheet`, `visualStyleSheet.characters[kidName] = buildAppearanceAnchor(...)` so later episodes reuse it.

### 5.6 Style System (DB + age modifiers)

- **DB:** `image_style_rules` by age_group and optional theme_key; columns: style_prompt, negative_prompt, color_palette, art_style. `getStyleForAge(age, themeKey)` loads rules. Request `image_style_key` selects which style row to use.
- **Age:** `getAgeModifierFallback(age)` adds age-appropriate art style text (e.g. 6 vs 9 year old).

### 5.6 Error Handling & Fallbacks

- Image generation failures: per-image try/catch; failed URLs omitted. imageWarning set: `cover_generation_failed` if no cover; `some_scene_images_failed` if fewer scene images than prompts; comic path: `comic_strip_generation_failed` if no comic image.

### 5.8 imageWarning Flow

- Backend sets `imageWarning` string; returned in response. Frontend maps to `generation_status`: e.g. `imageWarning === 'cover_generation_failed'` → `images_failed`; else `images_partial` or `verified` when saving story.

---

## Stage 6: Story Save & Post-Processing

### 6.1 DB Columns Written

**Backend (generate-story)** only **updates** an existing story row (by `story_id` from request):

- Phase 2: `title`, `content`, `story_generation_ms`, `generation_status` = 'text_complete'
- Phase 3: `cover_image_url`, `story_images`, `image_generation_ms`, `cover_image_status`, `story_images_status`, `generation_status` = 'images_complete' | 'images_failed'
- Phase 4: `consistency_check_ms`, `generation_status` = 'verified'
- Error: `generation_status` = 'images_failed' | 'text_failed'

**Frontend (CreateStoryPage)** does the full INSERT or UPDATE of the story row (including placeholder insert with status 'generating' before invoke):

- All columns: title, content, cover_image_url, story_images, image_count, difficulty, text_type, text_language, prompt, user_id, kid_profile_id, generation_status, ending_type, episode_number, story_length, series_id, series_mode, image_style_key, structure_*, emotional_*, learning_theme_applied, parent_prompt_text, episode_summary, continuity_state, visual_style_sheet, generation_time_ms, story_generation_ms, image_generation_ms, consistency_check_ms, comic_* fields, etc.

### 6.2 Timing Metrics

- `generation_time_ms`, `story_generation_ms`, `image_generation_ms`, `consistency_check_ms` — from performance object in response; written by frontend to `stories`.

### 6.3 Generation Status Transitions

- **Values (from migration CHECK):** `generating`, `checking`, `verified`, `error`, `text_complete`, `images_complete`, `text_failed`, `images_failed`.
- **Flow:** Placeholder created with `generating` → backend updates to `text_complete` → then `images_complete` or `images_failed` → then `verified` after consistency check. On catch: `lastCompletedPhase === "text_complete"` → `images_failed`, else `text_failed`.

### 6.4 Series-Specific Saves

- Episode 1: Frontend sets `series_id` to the story's own id (self-reference). Episode summary, continuity_state, visual_style_sheet returned by backend and saved by frontend. Interactive: `story_branches` insert for branch_options when seriesMode === 'interactive'.

---

## Stage 7: Reading & Feedback

### 7.1 Rating Flow

- After reading, user can rate (e.g. StoryFeedbackDialog). Rating and optional feedback stored; used for quality stats and possibly future personalization.

### 7.2 Comprehension Quiz

- Questions from LLM response saved to `comprehension_questions` (story_id, question, expected_answer, options, order_index). Quiz UI presents them; results feed gamification.

### 7.3 Vocabulary / Word Tap

- **marked_words:** Insert from LLM vocabulary is currently **disabled** in CreateStoryPage (commented out). Word explanations come from explain-word Edge Function (tap on word in reading view).

### 7.4 Gamification (stars, badges)

- Stars awarded per quiz and story read; level computed from points. Badges from `useGamification`; logic in RPCs (e.g. check_and_award_badges). Not part of generation pipeline.

---

## Appendix A: Feature Flags

| Key | Purpose | Per-user | Where used |
|-----|---------|----------|------------|
| `emotion_flow_enabled_users` | Enable Emotion Flow Engine (V2) | Yes (JSON array of user IDs or `['*']`) | generate-story: isEmotionFlowEnabled(userId) |
| `comic_strip_enabled_users` | Enable comic strip image path | Yes (same pattern) | generate-story: isComicStripEnabled(userId) |
| (useVisualDirector) | Use Visual Director for image planning (second LLM: character_sheet, scenes, cover) | Backend/request | generate-story: when true, Call 1 omits image_plan; VD + consistency parallel → mapVisualDirectorToImagePlan → V2 prompts |
| `avatar_builder_enabled_users` | Show My Look page / avatar builder | Yes | Frontend: My Look visibility |
| `farsi_enabled_users` | Show Farsi in language lists | Yes | useFarsiEnabled, school_system iran/afghanistan |
| `premium_ui` | Framer Motion transitions, body class | Yes | usePremiumUi, PremiumRouteTransition |
| `NEW_FABLINO_HOME`, `SERIES_ENABLED` | Home layout, series toggle | Static (config/features.ts) | isSeriesEnabled() |

### Current state of Emotion Flow Engine

- ✅ **Implemented:** `_shared/emotionFlow/` — featureFlag, engine, selectors (blueprint, tone, character, element), promptBuilder (blocks: arc, tone, character, relationship, element, criticalRules), historyTracker. When enabled, `runEmotionFlowEngine()` runs before LLM call; result injects emotion blocks into user prompt and can set protagonist appearance for images when no kid_appearance.
- 🔄 **emotion_rules table:** Seeded with labels/conflict_patterns/character_development/etc. **Not queried in promptBuilder.** Emotion Flow uses its own selector tables/seeds, not emotion_rules for prompt text.

---

## Appendix B: DB Tables Reference (story-related only)

| Table | Purpose |
|-------|---------|
| `stories` | Main story row: title, content, cover_image_url, story_images, generation_status, text_language, difficulty, story_length, series_id, episode_number, episode_summary, continuity_state, visual_style_sheet, image_style_key, structure_*, emotional_*, learning_theme_applied, comic_* fields, timing columns, etc. |
| `comprehension_questions` | story_id, question, expected_answer, options, order_index, question_language |
| `kid_profiles` | name, age, gender, school_class, school_system, difficulty_level, content_safety_level, story_languages, image_style, ... |
| `kid_appearance` | kid_profile_id (unique), skin_tone, hair_length, hair_type, hair_style, hair_color, glasses, eye_color |
| `kid_characters` | kid_profile_id, name, type, age, gender, relation, description (saved family/friends) |
| `age_rules` | min_age, max_age, language, narrative_guidelines, min_word_count, max_word_count, ... |
| `difficulty_rules` | difficulty_level, language, label, description, vocabulary_scope, word_count_min, word_count_max, ... |
| `theme_rules` | theme_key, language, labels, plot_templates, setting_descriptions, character_archetypes, ... |
| `emotion_rules` | emotion_key, language, labels, conflict_patterns, character_development, ... (not used in promptBuilder) |
| `content_themes_by_level` | theme_key, labels, min_safety_level (guardrails) |
| `generation_config` | age_group, story_length, min_words, max_words, scene_image_count, include_cover, ... |
| `image_styles` | key, label, preview, active, age_group_filter |
| `image_style_rules` | age_group, theme_key?, style_prompt, negative_prompt, color_palette, art_style |
| `story_subtypes` | theme_key, subtype_key, prompt_hint, label (round-robin pool) |
| `story_subtype_history` | usage tracking for round-robin |
| `parent_learning_config` | kid_profile_id, active_themes, frequency |
| `learning_themes` | theme key, labels, guidance |
| `custom_learning_themes` | custom theme entries |
| `app_settings` | key, value (system prompts, feature flag JSON) |
| `story_branches` | story_id, series_id, episode_number, options (interactive series) |

---

## Appendix C: All File Paths in Pipeline

**Frontend**

- `src/pages/CreateStoryPage.tsx`
- `src/pages/OnboardingStoryPage.tsx`
- `src/pages/MyLookPage.tsx`
- `src/components/story-creation/StoryTypeSelectionScreen.tsx`
- `src/components/story-creation/CharacterSelectionScreen.tsx`
- `src/components/story-creation/SpecialEffectsScreen.tsx`
- `src/components/story-creation/ImageStylePicker.tsx`
- `src/components/story-creation/VoiceRecordButton.tsx`
- `src/components/story-creation/types.ts`
- `src/hooks/useKidProfile.tsx`

**Backend**

- `supabase/functions/generate-story/index.ts`
- `supabase/functions/_shared/promptBuilder.ts`
- `supabase/functions/_shared/imagePromptBuilder.ts`
- `supabase/functions/_shared/visualDirector.ts` (Visual Director: second LLM for image planning when useVisualDirector)
- `supabase/functions/_shared/comicStripPromptBuilder.ts` (and comicStrip/layouts, types, featureFlag)
- `supabase/functions/_shared/appearanceAnchor.ts`
- `supabase/functions/_shared/learningThemeRotation.ts`
- `supabase/functions/_shared/storySubtypeSelector.ts`
- `supabase/functions/_shared/seriesContinuityMerge.ts` (if used)
- `supabase/functions/_shared/emotionFlow/` (featureFlag, engine, selectors, promptBuilder, types)

---

## Appendix D: Current Gaps & Tech Debt

- ⚠️ **emotion_rules table** is not queried in promptBuilder; Emotion Flow uses its own selectors. Possible inconsistency if docs assume emotion_rules drive prompts.
- ⚠️ Backend does not write all returned metadata to `stories` (e.g. episode_summary, continuity_state, visual_style_sheet) in the shown update calls; frontend is responsible for persisting the full payload. Ensure frontend always sends back and saves these when doing incremental updates.
- ⚠️ **marked_words** insert from LLM vocabulary is disabled in CreateStoryPage; vocabulary from story JSON is not persisted.
- ✅ My Look (kid_appearance) and eye_color flow through buildAppearanceAnchor; V1.5-style fields (hair types, gender clarity) are present in appearanceAnchor and options.

---

## Appendix E: Open Questions for F-03 (Neues Abenteuer)

1. **Hero DNA extraction:** Should the second LLM call (hero_dna / protagonist extraction) happen after **every** story, or only on-demand when the kid rates 4–5 stars?
2. **Subtype selection for adventures:** Should new adventures use the normal round-robin subtype system, or a separate "adventure subtype" pool?
3. **Image style:** Should adventures inherit the parent story's `image_style_key`, or the kid profile's current preference?
4. **series_id reuse:** Is reusing `series_id` + `episode_number` for adventures clean, or should we introduce separate columns (e.g. `parent_story_id`, `adventure_episode_number`)?
5. **Companion generation:** If hero_dna includes companion characters born in the story, should these be auto-added to `kid_characters` for future stories?
6. **Learning themes in adventures:** Should adventures follow the normal learning theme rotation, or skip it to keep adventures "pure fun"?
7. **Difficulty/length:** Should adventures inherit the parent story's difficulty and length, or use the kid profile's current settings?
