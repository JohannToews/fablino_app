# Language Quality Audit Report — Fablino

**Date:** 2025-02-24  
**Scope:** Full language pipeline for all supported languages (DE, FR, EN, ES, NL, IT, BS, PT, TR, PL, UK, RU, AR, FA, and beta languages).  
**Focus:** Portuguese (PT) beta issues; secondary audit of TR, PL, UK, RU, AR, FA.  
**No fixes applied — analysis and findings only.**

---

## PART A: System-Wide Language Infrastructure

### A1. `src/hooks/useKidProfile.tsx` — Language Mapping

**Complete `getKidLanguage()` mapping:**

- **VALID_LANGUAGES** (line 29):  
  `['de', 'fr', 'en', 'es', 'nl', 'it', 'bs', 'tr', 'bg', 'ro', 'pl', 'lt', 'hu', 'ca', 'sl', 'pt', 'sk', 'uk', 'ru']`
- **KidLanguage type** (line 5–6): same set (no `ar`, no `fa`).
- **Behavior:** `getKidLanguage(schoolSystem)`:
  - If `schoolSystem` is missing → returns `'fr'`.
  - If `schoolSystem.toLowerCase()` is in VALID_LANGUAGES → returns that language.
  - Otherwise → returns `'fr'`.

**Mapped:** de, fr, en, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru.

**Missing from type/VALID_LANGUAGES:** `ar`, `fa`. Farsi is represented in the app by school systems `iran` and `afghanistan` (see schoolSystems.ts), not by code `fa`. So:
- `getKidLanguage('pt')` → `'pt'` ✅  
- `getKidLanguage('tr')` → `'tr'` ✅  
- `getKidLanguage('pl')` → `'pl'` ✅  
- `getKidLanguage('uk')` → `'uk'` ✅  
- `getKidLanguage('ru')` → `'ru'` ✅  
- `getKidLanguage('ar')` → `'fr'` (fallback; AR not in list) ❌  
- `getKidLanguage('fa')` → `'fr'` (fallback) ❌  
- `getKidLanguage('iran')` → `'fr'` (not in VALID_LANGUAGES) ❌  

**Explanation language:**  
`kidExplanationLanguage` uses `selectedProfile?.explanation_language` with `toKidLanguage()`, default `'de'` when not set (lines 168–170). So PT/TR/PL profiles without explicit `explanation_language` get explanations defaulting to German context in the hook; the actual explanation language is determined by the explain-word function (see Part C).

---

### A2. `src/lib/translations/index.ts` — UI Translation Coverage Matrix

**Structure:** Per-language files under `src/lib/translations/` (de, en, fr, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru). Type `Language` and `translations` object include these 19 only — **no `ar`, no `fa`**.

**Fallback:**  
`getTranslations(lang)`: if `translations[lang]` exists, return it; else try `FALLBACK_CHAIN = ['en', 'de']`, then `translations.de`. So when a *language code* is missing (e.g. `ar`), the UI gets the full EN or DE object, not per-key fallback. Missing keys within an existing language file would be `undefined` (TypeScript expects all keys).

**Coverage matrix (summary):**

| Language | Key in translations? | Approx. key count | Complete vs DE? | Fallback if missing? |
|----------|----------------------|--------------------|-----------------|----------------------|
| de       | Yes                  | ~450+              | baseline        | N/A                  |
| fr       | Yes                  | ~450+              | Yes             | en → de              |
| en       | Yes                  | ~450+              | Yes             | de                   |
| es       | Yes                  | ~450+              | Yes             | en → de              |
| nl       | Yes                  | ~450+              | Yes             | en → de              |
| it       | Yes                  | ~450+              | Yes             | en → de              |
| bs       | Yes                  | ~450+              | Yes             | en → de              |
| pt       | Yes                  | ~450+              | **No — many EN**| en → de              |
| tr       | Yes                  | ~450+              | Yes             | en → de              |
| pl       | Yes                  | ~450+              | Yes             | en → de              |
| uk       | Yes                  | ~450+              | Yes             | en → de              |
| ru       | Yes                  | ~450+              | Yes             | en → de              |
| ar       | **No**               | 0                  | —               | en → de (whole UI)   |
| fa       | **No**               | 0                  | —               | en → de (whole UI)   |
| bg, ro, lt, hu, ca, sl, sk | Yes | ~450+ | Varies | en → de |

**Runtime:** If the active app language has a file (e.g. `pt`), that entire object is used. There is no per-key fallback to another language for a missing key; the type requires all keys, so incomplete files are a content bug (e.g. pt.ts has many English strings).

---

### A3. `src/lib/schoolSystems.ts` — School Systems

**Defined:**  
`fr`, `de`, `es`, `nl`, `en`, `it`, `bs`, `uk`, `ru`, `iran`, `afghanistan`.

**Not defined:**  
`pt`, `tr`, `pl`, `ar`, `fa` (as language keys). Farsi is represented by **country** keys `iran` and `afghanistan`, not `fa`.

So for PT/TR/PL, if the UI uses `school_system` to drive the school-system dropdown or class list, those languages have **no** school system entry; the dropdown would not show a Portuguese/Turkish/Polish option unless it is populated from another source (e.g. VALID_LANGUAGES in useKidProfile). This can cause inconsistent or missing class labels for those languages.

---

### A4. `src/lib/levelTranslations.ts` — Level Names

**levelTitleTranslations / badgeTranslations:**  
Present for: de, fr, en, es, nl, bs, it, tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru.

**Missing:** ar, fa.

**Note:** `pt` and `sk` level titles are **English copy-paste** (e.g. "Book Fox", "Story Explorer") rather than translated to Portuguese/Slovak.

---

### A5. `src/components/story-creation/types.ts` — Wizard Labels

**settingSelectionTranslations** (and other wizard-related maps in that file):  
Defined for the same `Language` type as in translations (de, en, fr, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru). **No ar, fa.** So wizard theme/location/time labels exist for PT/TR/PL/UK/RU etc., but not for AR/FA.

---

### A6. Voice Record Button Labels — `src/components/story-creation/VoiceRecordButton.tsx`

**VOICE_LABELS:**  
Present for: `de`, `fr`, `es`, `en`, `nl`, `it`, `uk`, `ru`, `bs`.

**Missing:** `pt`, `tr`, `pl`, `sk`, `bg`, `ro`, `lt`, `hu`, `ca`, `sl`, `ar`, `fa`.

**Fallback:** `getLabels(lang)` → `VOICE_LABELS[lang] || VOICE_LABELS.de`. So Portuguese (and TR, PL, etc.) get **German** recording UI labels.

---

### A7. ReadingPage — Series Completion Messages

**readingLabels** (inline in ReadingPage.tsx):  
Contains entries for: de, fr, en, es, nl, it, bs, pt, sk, tr, bg, ro, pl, lt, hu, ca, sl, uk, ru. So **series completion and related messages exist for PT, TR, PL, UK, RU**. Missing only: ar, fa (would fall back to `readingLabels[textLang]?.seriesCompleted || "Series completed! 🦊🎉"` i.e. English).

---

## PART B: Story Generation Pipeline (CRITICAL)

### B1. Rule Tables — Coverage Matrix

From migrations (e.g. `20260207_block2_2_rule_tables.sql`, `20260228_language_rules_es_it_nl_bs_sl.sql`, `20260217_language_expansion_beta.sql`):

- **age_rules:** Rows for **fr, de, en** (block2_2); **es, it, nl, bs, sl** (20260228); beta expansion adds from EN template for other codes. **pt, tr, pl, uk, ru** do **not** have dedicated age_rules rows in the main migrations; they rely on promptBuilder fallback to en then de.
- **difficulty_rules:** Same pattern — **de, fr, en** (and es, it, nl, bs, sl in 20260228). **pt, tr, pl, uk, ru** → fallback to en/de.
- **theme_rules:** Same — **de, fr, en** (+ es, it, nl, bs, sl). **pt, tr, pl, uk, ru** → fallback.
- **emotion_rules:** Same; labels jsonb extended for tr, bg, ro, pl, lt, hu, ca, sl in some migrations, but **no rows for language = 'pt'/'uk'/'ru'**.

**Summary matrix:**

| Table            | DE | FR | EN | ES | NL | IT | BS | PT | TR | PL | UK | RU | AR | FA |
|------------------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| age_rules        | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| difficulty_rules | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| theme_rules      | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emotion_rules    | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### B2. `supabase/functions/_shared/promptBuilder.ts` — Fallback Behavior

**When `text_language` is e.g. `pt`, `tr`, `pl` (no rule rows):**

1. **`lang = request.story_language`** (line 1247) — so `lang` is e.g. `'pt'`.
2. **Section headers:** `headers = SECTION_HEADERS[lang] || SECTION_HEADERS['en']` — **pt/tr/pl/uk/ru not in SECTION_HEADERS**, so prompt structure (section titles, instruction line) is **English**.
3. **age_rules:** Query `language = 'pt'` → no row; then try `'en'`, then `'de'`. So **English or German** rule content (style_prompt, vocabulary_level, narrative_guidelines, etc.) is used.
4. **difficulty_rules / theme_rules:** Same — try lang, then en, then de. So **prompt continues with EN or DE rules**, not with a crash or “old path” skip.
5. **Explicit language instruction:** There **is** an explicit output-language block (lines 1587–1598) for “beta” languages:
   - `BETA_LANG_CODES = new Set(['hu','pt','tr','bg','lt','ca','pl','sk','fa'])`
   - For these, a “CRITICAL LANGUAGE INSTRUCTION” section is added:
     - “Write the ENTIRE story in {LANGUAGE_NAMES[lang]} (pt).”
     - “ALL text must be in {language}: title, story text, dialogue…”
     - “ALL comprehension questions and answer options must be in {language}.”
     - “ALL vocabulary words and their explanations must be in {language}.”
   - **LANGUAGE_NAMES** includes pt, tr, pl, uk, ru, etc. (line 197–204). **uk, ru, sl, ro** are **not** in BETA_LANG_CODES, so they do **not** get this block and rely only on the generic “Language: {langName}” line; **SECTION_HEADERS** for uk/ru/sl/ro are also missing → English headers.

**Conclusion:** For **pt/tr/pl** the model **does** receive a clear “write everything in Portuguese/Turkish/Polish” instruction, but the rest of the prompt (section titles, rule text) is in English (or German if en fallback fails). That can still lead to mixed output (e.g. PT story with FR/EN leakage) if the model follows the rule wording language. For **uk/ru** there is **no** “CRITICAL LANGUAGE INSTRUCTION” block and no SECTION_HEADERS, so they are more at risk of wrong language.

---

### B3. CORE System Prompt (app_settings)

The CORE system prompt is loaded from `app_settings` in generate-story; its content is not in the repo. The **promptBuilder** builds the main prompt and injects the language instruction (see B2). So the target story language is communicated by:
- The prompt built in promptBuilder (including “Language: {langName}” and, for beta languages, the “CRITICAL LANGUAGE INSTRUCTION” block).
- There is no evidence in code of CORE containing a hardcoded language; language is driven by `request.story_language` and the built prompt.

---

### B4. `supabase/functions/generate-story/index.ts` — Language Passthrough

- **Request:** `storyLanguageParam` (and optional `storyLanguage`) from body (around 1404, 1406).
- **Effective:** `effectiveStoryLanguage = storyLanguageParam || ...` (line 1589) used in `storyRequest.story_language` (line 1868).
- **buildStoryPrompt(storyRequest, supabase)** is called with that request; no overwrite of `story_language` in the function. So **pt/tr/pl** are passed through; if the frontend sends `storyLanguage: 'pt'`, the prompt is built for Portuguese. Risk of wrong language is mainly from missing/fallback rules and missing “CRITICAL LANGUAGE INSTRUCTION” for some codes (uk, ru, etc.), not from generate-story overwriting the param.

---

## PART C: Word Explanation Pipeline

### C1. `supabase/functions/explain-word/index.ts`

- **Parameters:** `language`, `explanationLanguage`, plus word, context, etc.  
- **Prompt language:** `promptLanguage = explanationLanguage || language` (line 313). So the **explanation** language is explicitly chosen.
- **Prompt selection:** First tries DB: `app_settings` key `system_prompt_word_explanation_${promptLanguage}`. If missing, uses **PROMPTS[promptLanguage] || PROMPTS.en** (lines 348–349).
- **PROMPTS** (built-in): Only **fr, de, en, es, nl, it, fa** (lines 13–194). **No pt, tr, pl, uk, ru, bs, etc.**
- So when `explanationLanguage` is **pt** (or tr, pl, uk, ru): PROMPTS['pt'] is undefined → **English prompt** is used. The English prompt does not say “explain in English,” but the examples and wording are in English, so the model often returns **English** (or occasionally French). This matches the reported bug: “word explanations returning French instead of Portuguese.”

**Code snippet (fallback):**

```ts
const promptFn = PROMPTS[promptLanguage] || PROMPTS.en;
prompt = promptFn(word, context);
```

---

### C2. ReadingPage — Word Tap Flow

- **Invoke:** `explain-word` is called with `language: storyLang`, `explanationLanguage: storyLang` (line 1446–1447), where `storyLang` is the story’s `text_language`. So for a PT story, **explanationLanguage is correctly sent as the story language**.
- **kidExplanationLanguage:** The profile’s explanation language is used elsewhere (e.g. vocabulary panel); for the inline word tap, the code uses `storyLang` for the request, which is correct so that the explanation matches the story language.
- **Caching:** If `cachedExplanations` is keyed by word only (or word+storyId only) and not by explanation language, a cached explanation from another language could be shown. The audit did not trace the cache key; worth verifying that the key includes `explanationLanguage` or equivalent so PT stories do not reuse EN/FR explanations.

---

## PART D: Portuguese-Specific Issues (from beta tester)

### D1. PT-BR vs PT-PT in translations

**Findings in `src/lib/translations/pt.ts`:**

- **relationMama / relationPapa:** `'Mom'`, `'Dad'` — **English**, not PT-PT (mãe/pai) or PT-BR (mamãe/papai).
- **genderMale / genderFemale / onboardingGenderBoy / onboardingGenderGirl:** `'Boy'`, `'Girl'` — **English**; PT-PT would be “menino”/“menina”.
- **save:** In pt.ts the generic `save` is `'Save'` (English). ReadingPage’s **inline** readingLabels.pt uses `save: "Guardar"` (PT-PT); so the reading flow shows “Guardar” but other screens (e.g. profile, wizard) show “Save” when using pt.ts.
- **Most of pt.ts** is **English** copy-paste (Save, Cancel, Delete, Loading..., Create, etc.). A few strings are Portuguese (e.g. “Guardado!”, “Série concluída!”, “Toca numa palavra…” in ReadingPage inline labels).
- **No** occurrences of “papai”, “mamãe”, “garoto”, “garota”, “salvar”, “celular”, “ônibus”, “tela”, “time”, “xícara”, “legal” in the translations folder — so the main issue is **English** in pt.ts, not BR terms in the file. If the tester saw “papai”/“mamãe,” it may be from LLM-generated story text or another source, not from these UI files.

**Recommendation:** Replace English strings in pt.ts with PT-PT (or chosen variant) and use PT-PT for family terms (Mãe, Pai) and gender (Menino, Menina).

---

### D2. `FamilyMemberModal.tsx` — Relationship Options

- **Source:** The modal receives `defaultLabel` from the parent; the parent uses **translations** for the relation labels (e.g. `t.relationMama`, `t.relationPapa`). So the relationship options are **from translations**, not hardcoded in the modal.
- **Portuguese:** As above, pt has `relationMama: 'Mom'`, `relationPapa: 'Dad'` — so the modal shows “Mom”/“Dad” for PT. No “papai” in code; fixing pt.ts to “Mãe”/“Pai” would fix the modal.
- **Cousin:** pt has `relationCousin` and `relationCousine` both as `'Cousin'`; PT-PT would distinguish “primo”/“prima” if the UI supports two options.
- **Capitalization:** Modal uses `defaultLabel` as provided; button text uses `translations.save.toLowerCase()` for the verb only. So relation labels follow the casing in translations (e.g. “Mom” / “Dad” in pt).

---

### D3. Gender Options (Onboarding)

- **Source:** OnboardingKindPage uses `t.onboardingGenderGirl` and `t.onboardingGenderBoy` (and KidProfileSection uses `t.genderMale`, `t.genderFemale`). So they come from **translations**.
- **Portuguese:** pt.ts has `'Girl'` and `'Boy'` (English). So “garoto”/“garota” are **not** in the code; the issue is untranslated English. For PT-PT, use “Menino”/“Menina.”

---

## PART E: RTL & Special Script Languages

### E1. Arabic (AR) & Farsi (FA)

- **RTL support:** Yes. `src/lib/rtlUtils.ts` defines `RTL_LANGUAGES = new Set(['fa', 'ar', 'he', 'ur'])`. `isRTL()`, `rtlProps()`, `rtlClasses()` are used in ReadingPage (story text, quiz, explanation panel) and ComprehensionQuiz. So when `story?.text_language` is `fa` or `ar`, RTL is applied.
- **CSS:** `index.css` has `[dir="rtl"] .story-text-container, [dir="rtl"].quiz-container` with Vazirmatn font. So RTL is implemented for story and quiz.
- **Gap:** AR/FA are **not** in useKidProfile’s VALID_LANGUAGES or in translations; Farsi is exposed via school systems `iran`/`afghanistan`, which map to `'fr'` in getKidLanguage. So **FA/AR users may never get `text_language` set to `fa`/`ar`** unless the UI sets it elsewhere. If they do get fa/ar, RTL works; if they are forced to French, RTL is not applied. **Critical:** Ensure FA/AR users have a way to set app/story language to fa/ar and that the pipeline passes it through so RTL and FA prompts are used.

---

### E2. Special Characters & Syllabification

- **syllabify.ts:** Hypher patterns exist only for **de, en, es, nl, it**. **fr** uses async hyphen/fr and a cache. Any other language (pt, tr, pl, uk, ru, ar, fa) uses **`hyphers[lang] || hyphers['de']`** — i.e. **German** hyphenation. So syllable coloring for PT/TR/PL/UK/RU etc. uses **wrong (German) syllable boundaries**.
- **Story text / marked_words:** No specific handling found for special characters (e.g. Turkish ğ/ı, Polish ł, Cyrillic); storage is standard UTF-8. Rendering and storage are unlikely to “break,” but syllabification is wrong for non-DE/EN/ES/NL/IT/FR.

---

## Findings (Structured)

### Finding 1: Word explanations in wrong language for PT/TR/PL/UK/RU
**Severity:** CRITICAL  
**Affected languages:** pt, tr, pl, uk, ru, bs, bg, ro, lt, hu, ca, sl, sk  
**Location:** `supabase/functions/explain-word/index.ts`  
**What happens:** PROMPTS has only fr, de, en, es, nl, it, fa. For other languages the code uses PROMPTS.en. So the model receives an English prompt and often returns explanations in English (or French).  
**Root cause:** No built-in prompt templates for pt, tr, pl, uk, ru, etc.  
**Code snippet:** `const promptFn = PROMPTS[promptLanguage] || PROMPTS.en;`

---

### Finding 2: Portuguese UI largely in English
**Severity:** HIGH  
**Affected languages:** pt  
**Location:** `src/lib/translations/pt.ts`  
**What happens:** Most keys are English (Save, Cancel, Mom, Dad, Boy, Girl, etc.). Only a minority are Portuguese; ReadingPage uses its own inline readingLabels for pt which are partially PT-PT.  
**Root cause:** pt.ts was filled with English copy-paste and not translated.  
**Code snippet:** e.g. `relationMama: 'Mom', relationPapa: 'Dad', genderMale: 'Boy', genderFemale: 'Girl'`

---

### Finding 3: Farsi/Arabic not in language lists — getKidLanguage falls back to French
**Severity:** HIGH  
**Affected languages:** ar, fa (and school_system “iran”/“afghanistan”)  
**Location:** `src/hooks/useKidProfile.tsx`  
**What happens:** VALID_LANGUAGES and KidLanguage type do not include 'ar' or 'fa'. So getKidLanguage('ar') and getKidLanguage('fa') return 'fr'. For school_system “iran” or “afghanistan,” getKidLanguage also returns 'fr'. So Farsi/Arabic users can be treated as French.  
**Root cause:** Language list and school-system mapping do not include ar/fa.  
**Code snippet:** `if (VALID_LANGUAGES.includes(lang)) return lang as KidLanguage; return 'fr';`

---

### Finding 4: Rule tables missing for PT/TR/PL/UK/RU — prompt uses EN/DE rules
**Severity:** HIGH  
**Affected languages:** pt, tr, pl, uk, ru  
**Location:** DB rule tables + `supabase/functions/_shared/promptBuilder.ts`  
**What happens:** age_rules, difficulty_rules, theme_rules have no rows for these languages. promptBuilder falls back to en then de. So style, vocabulary, and structure instructions in the prompt are in English or German, which can encourage mixed-language or wrong-language output despite the “write in Portuguese” block for pt.  
**Root cause:** Migrations never added rule rows for pt/tr/pl/uk/ru.  
**Code snippet:** `const { data } = await supabaseClient.from('age_rules').select('*').eq('language', lang)...` then `if (!ageRules && lang !== 'en' && lang !== 'de')` try en then de.

---

### Finding 5: SECTION_HEADERS and LANGUAGE_NAMES missing for uk, ru, sl, ro
**Severity:** MEDIUM  
**Affected languages:** uk, ru, sl, ro (and pt, tr, pl use 'en' headers)  
**Location:** `supabase/functions/_shared/promptBuilder.ts`  
**What happens:** SECTION_HEADERS has fr, de, en, es, it, bs, nl, fa. So for pt, tr, pl, uk, ru, sl, ro, etc., the prompt section titles (e.g. “LANGUAGE & LEVEL”, “PRIMARY STORY DIRECTIVE”) are in English. BETA_LANG_CODES does not include uk, ru, sl, ro, so those languages also do not get the “CRITICAL LANGUAGE INSTRUCTION” block.  
**Root cause:** SECTION_HEADERS and BETA_LANG_CODES were not extended for all supported languages.  
**Code snippet:** `const headers = SECTION_HEADERS[lang] || SECTION_HEADERS['en'];` and `if (BETA_LANG_CODES.has(lang)) { ... }`

---

### Finding 6: Voice record button in German for PT/TR/PL and others
**Severity:** MEDIUM  
**Affected languages:** pt, tr, pl, sk, bg, ro, lt, hu, ca, sl  
**Location:** `src/components/story-creation/VoiceRecordButton.tsx`  
**What happens:** VOICE_LABELS only has de, fr, es, en, nl, it, uk, ru, bs. Other languages get VOICE_LABELS.de (German).  
**Root cause:** VOICE_LABELS not extended for all languages.  
**Code snippet:** `const getLabels = (lang: string) => VOICE_LABELS[lang] || VOICE_LABELS.de;`

---

### Finding 7: School systems missing for PT, TR, PL
**Severity:** MEDIUM  
**Affected languages:** pt, tr, pl  
**Location:** `src/lib/schoolSystems.ts`  
**What happens:** DEFAULT_SCHOOL_SYSTEMS has no key for 'pt', 'tr', 'pl'. So grade/class dropdowns or labels that rely on this map have no entry for these languages.  
**Root cause:** Only a subset of languages have school system definitions.  
**Code snippet:** Export only includes fr, de, es, nl, en, it, bs, uk, ru, iran, afghanistan.

---

### Finding 8: Syllable coloring uses German patterns for PT/TR/PL/UK/RU
**Severity:** MEDIUM  
**Affected languages:** pt, tr, pl, uk, ru, and any other non–DE/EN/ES/NL/IT/FR  
**Location:** `src/lib/syllabify.ts`  
**What happens:** hyphers only has de, en, es, nl, it; fr uses a separate cache. For other languages, `hyphers[lang] || hyphers['de']` is used, so words are split with German hyphenation rules.  
**Root cause:** No hyphenation patterns for pt, tr, pl, uk, ru, etc.  
**Code snippet:** `const hypher = hyphers[lang] || hyphers['de'];`

---

### Finding 9: Level titles and badge messages in English for PT and SK
**Severity:** LOW  
**Affected languages:** pt, sk  
**Location:** `src/lib/levelTranslations.ts`  
**What happens:** levelTitleTranslations for pt and sk are English (“Book Fox”, “Story Explorer”, etc.). badgeTranslations for pt/sk are also English.  
**Root cause:** Copy-paste from en without translation.  
**Code snippet:** pt: `buecherfuchs: "Book Fox", ...`

---

### Finding 10: Portuguese “save” and family terms in translations
**Severity:** HIGH (for PT UX)  
**Affected languages:** pt  
**Location:** `src/lib/translations/pt.ts`  
**What happens:** relationMama/relationPapa are “Mom”/“Dad”; gender labels “Boy”/“Girl”; generic “save” is “Save”. So family modal and profile show English. (ReadingPage uses its own “Guardar” in readingLabels.pt.)  
**Root cause:** pt.ts not translated for these keys.  
**Code snippet:** `relationMama: 'Mom', relationPapa: 'Dad', genderMale: 'Boy', genderFemale: 'Girl', save: 'Save'`

---

## Coverage Matrix Summary

| Feature                     | DE | FR | EN | ES | NL | IT | BS | PT | TR | PL | UK | RU | AR | FA |
|----------------------------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| useKidProfile mapped       | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| translations.ts (UI)       | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| school system              | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ⚠️ |
| levelTranslations          | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Wizard (types)             | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| VoiceRecordButton          | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| ReadingPage series labels  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| age_rules                  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| difficulty_rules           | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| theme_rules                | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| emotion_rules              | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| promptBuilder SECTION_HEADERS | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| promptBuilder LANGUAGE_NAMES  | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| BETA “CRITICAL LANGUAGE” block | — | — | — | — | — | — | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| explain-word PROMPTS       | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| RTL support                | — | — | — | — | — | — | — | — | — | — | — | — | ✅ | ✅ |
| Syllabification            | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️ = partial (e.g. present but English); — = N/A or not applicable.

---

## All Findings Sorted by Severity

**CRITICAL**  
1. Word explanations in wrong language (explain-word missing prompts for pt, tr, pl, uk, ru, etc.)

**HIGH**  
2. Portuguese UI largely in English (translations/pt.ts)  
3. Farsi/Arabic not in language lists — getKidLanguage returns French  
4. Rule tables missing for PT/TR/PL/UK/RU  
10. Portuguese family/gender/save terms in English

**MEDIUM**  
5. SECTION_HEADERS and BETA_LANG_CODES missing for uk, ru, sl, ro  
6. Voice record button in German for PT/TR/PL and others  
7. School systems missing for PT, TR, PL  
8. Syllable coloring uses German patterns for unsupported languages

**LOW**  
9. Level/badge titles in English for PT and SK

---

## Recommended Fix Order

1. **explain-word prompts (Finding 1)**  
   Add PROMPTS (or DB templates) for pt, tr, pl, uk, ru so word explanations are in the correct language. This directly fixes the “explanations in French instead of Portuguese” report.

2. **Portuguese translations (Findings 2, 10)**  
   Translate pt.ts fully to PT-PT (or chosen variant): at least save, cancel, relationMama/Papa, genderMale/Female, onboardingGenderBoy/Girl, and other high-visibility keys. Fix family and gender terms first.

3. **Rule tables for PT/TR/PL/UK/RU (Finding 4)**  
   Add age_rules, difficulty_rules, theme_rules (and emotion_rules if used) rows for pt, tr, pl, uk, ru so the story prompt uses language-appropriate instructions.

4. **Farsi/Arabic in language pipeline (Finding 3)**  
   Add ar and fa to VALID_LANGUAGES and KidLanguage; add a mapping from school_system iran/afghanistan to a language code (e.g. fa) that the rest of the app uses; ensure translations and explain-word support fa/ar where needed.

5. **promptBuilder SECTION_HEADERS and BETA block (Finding 5)**  
   Add SECTION_HEADERS and LANGUAGE_NAMES for uk, ru, sl, ro; add uk, ru, sl, ro to BETA_LANG_CODES (or equivalent) so they get the “CRITICAL LANGUAGE INSTRUCTION” block.

6. **Voice labels (Finding 6)**  
   Add VOICE_LABELS for pt, tr, pl, and other languages that have wizard/voice flows.

7. **School systems (Finding 7)**  
   Add DEFAULT_SCHOOL_SYSTEMS entries for pt, tr, pl if the UI uses them for class selection.

8. **Syllabification (Finding 8)**  
   Add hyphenation patterns (or disable syllable mode) for pt, tr, pl, uk, ru to avoid German syllable breaks.

9. **Level/badge translations (Finding 9)**  
   Translate level and badge strings for pt and sk.

This order prioritizes the reported Portuguese bugs (explanations + UI) and then extends coverage for other languages and quality (rules, headers, voice, school systems, syllabification).
