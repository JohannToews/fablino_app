# Translation Audit Report — UI Language Gaps and Inconsistencies

**Date:** 2025-02-24  
**Scope:** All translation sources for app/UI languages: **DE, FR, EN, ES, NL, IT, BS**  
**Goal:** Systematic audit to find why users see language A in some places and language B in others. Report only (no fixes).

---

## 1. Summary: Total Keys and Coverage per Source

| Source | Type | Approx. keys / rows | DE | FR | EN | ES | NL | IT | BS | Notes |
|--------|------|----------------------|----|----|----|----|----|----|-----|------|
| **1. src/lib/translations/** | Code | ~350+ (Translations interface) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All 7 have full file; empty strings only in extended langs (tr, bg, ro, pl, lt, hu, ca, sl, pt, sk) |
| **2. src/lib/levelTranslations.ts** | Code | level titles + badges | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | No gaps for 7 |
| **3. src/lib/schoolSystems.ts** | Code | 1 “key” per system (name + classes) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Also uk, ru, iran, afghanistan |
| **4. story-creation/types.ts** | Code | 3 large objects (setting, storyType, character) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Record<Language, …> enforces 7; BS present in sampled blocks |
| **5. VoiceRecordButton.tsx** | Code | 1 object, 7 sub-keys (speak, listening, retry, …) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **BS missing** → fallback to DE |
| **6. ReadingPage.tsx** | Code | 1 inline message (story could not be loaded) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Single message; fallback msg.en |
| **7. DB: learning_themes** | DB | N rows | See SQL below | | | | | | labels + descriptions JSONB |
| **8. DB: content_themes_by_level** | DB | N rows | See SQL below | | | | | | labels + example_texts JSONB |
| **9. DB: image_styles** | DB | N rows | See SQL below | | | | | | labels + description JSONB |
| **10. DB: story_subtypes** | DB | N rows | See SQL below | | | | | | labels + descriptions JSONB |

**Coverage (code):**  
- **Critical gap:** VoiceRecordButton has **no Bosnian (BS)**. BS users see German labels for recording UI.  
- All other code sources either have 7/7 or are typed so that missing a language would be a type error.

---

## 2. Code-Based Translation Sources — Detail

### 2.1 `src/lib/translations/` (main UI)

- **Location:** `src/lib/translations/index.ts` + per-language files (`de.ts`, `fr.ts`, `en.ts`, `es.ts`, `nl.ts`, `it.ts`, `bs.ts`, …).
- **Keys:** Defined by `Translations` interface (~350+ keys). Every language file implements the same interface, so by design all keys exist in all language files.
- **Languages:** 7 core (de, fr, en, es, nl, it, bs) plus tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru.
- **Missing for 7 core:** None. TypeScript would fail if a key were missing.
- **Empty / TODO:** Grep found empty string values only in **non-core** languages (ro, lt, pt, sl, sk, bg, ca, pl, hu, tr) for: `emptyStateStories`, `emptyStateVocabulary`, `emptyStateQuiz`, `emptyStateResults`. **No empty strings in de, fr, en, es, nl, it, bs** for those keys.
- **Fallback:** `getTranslations(lang)` → if `translations[lang]` exists return it; else try `FALLBACK_CHAIN` ['en', 'de']; else `translations.de`. No per-key fallback inside a language object.

### 2.2 `src/lib/levelTranslations.ts`

- **Keys:** `levelTitleTranslations`, `badgeTranslations` (and possibly others in file). Both have all 7 core languages plus extra.
- **Missing (7 core):** None found.
- **Fallback:** e.g. `levelTitleTranslations[language] || levelTitleTranslations.de`, then key or `titleKey`.

### 2.3 `src/lib/schoolSystems.ts`

- **Keys:** One entry per school system key (fr, de, es, nl, en, it, bs, uk, ru, iran, afghanistan). Each has `name` and `classes`.
- **Missing (7 core):** None. All 7 app languages have an entry.

### 2.4 `src/components/story-creation/types.ts`

- **Objects:** `settingSelectionTranslations`, `storyTypeSelectionTranslations`, `characterSelectionTranslations` (and possibly more). All typed as `Record<Language, …>` with `Language` including `bs`.
- **Sampled:** `settingSelectionTranslations` has de, fr, en, es, nl, it, **bs** (full block). So BS is present; no “6 languages NO BS” in current code for these objects.
- **Missing (7 core):** None for the 7 languages; TypeScript would require all Language variants.

### 2.5 `src/components/story-creation/VoiceRecordButton.tsx`

- **Object:** `VOICE_LABELS`. Keys: de, fr, es, en, nl, it, uk, ru. **No `bs`.**
- **Sub-keys per language:** speak, listening, retry, confirm, mic_denied, empty, failed.
- **Missing language:** **Bosnian (BS).** BS users get `getLabels(language)` → `VOICE_LABELS[lang] || VOICE_LABELS.de` → **German**.
- **Gap:** **Critical** for BS locale.

### 2.6 `src/pages/ReadingPage.tsx`

- **Inline message:** One object for “story could not be loaded” with de, fr, en, es, nl, it, bs. All 7 present.
- **Fallback:** `msg[kidAppLanguage as string] || msg.en`.

---

## 3. Complete List of Missing Translations (Code)

| Source | Key / scope | Missing languages | Fallback behavior |
|--------|-------------|-------------------|--------------------|
| **VoiceRecordButton.tsx** | Entire `VOICE_LABELS` (all 7 sub-keys) | **BS** | BS → DE (German labels for recording UI) |

No other code sources have missing languages for the 7 app languages in the audited files.

### 3b. DB missing translations (to fill after running SQL in §5)

**Migration created:** `supabase/migrations/20260228_fill_translation_gaps.sql` fills the following gaps (idempotent, only adds when key is missing):

- **learning_themes:** adds `bs` for labels + descriptions on all 15 theme_keys (when missing).
- **content_themes_by_level:** adds `bs` for labels + example_texts on all 18 theme_keys (when missing).
- **image_styles:** adds `bs` for labels + description on 3d_adventure, pixel_art, brick_block, vintage_retro (when missing).
- **story_subtypes:** adds **fr, es, nl, it, bs** to **descriptions** for all 42 (theme_key, subtype_key) rows. Seed had only de + en for descriptions; the migration adds proper translations for the other 5 core languages.

After running the audit queries in section 5, list here any *remaining* rows where one or more of the 7 languages are still missing:

| Table | Row identifier (e.g. theme_key / style_key / id) | Field | Missing languages |
|-------|---------------------------------------------------|-------|-------------------|
| _Fill from query results_ | | | |

---

## 4. Language Routing and Fallbacks

### 4.1 How app language is chosen

- **Source:** `kid_profiles.school_system` → `getKidLanguage(schoolSystem)` in `src/hooks/useKidProfile.tsx`.
- **Valid languages:** `VALID_LANGUAGES` includes de, fr, en, es, nl, it, bs, plus tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru.
- **If missing/invalid:** `getKidLanguage` returns `'fr'`. So every profile gets a valid language code (or French).

### 4.2 What happens when a key has no entry for the requested language?

- **Main translations (`getTranslations`):** Entire language object is switched. Either the requested language exists and has all keys (by interface), or fallback is **en** then **de**. No per-key fallback; no “undefined” for a missing key within a language.
- **Level/school/story-creation types:** Similar: either the language key exists in the object (and has the required shape) or a single fallback (e.g. `de` or `en`) is used. No shared “requested → en → de → key” helper.
- **VoiceRecordButton:** No BS → **always DE** for BS users.
- **ReadingPage inline:** `msg[kidAppLanguage] || msg.en` → no BS would show English.
- **DB-sourced labels (ParentSettingsPanel, ImageStylePicker, etc.):**
  - **ParentSettingsPanel:** `getLabel(labels)` = `labels[displayLang] || labels.de || labels.en || Object.values(labels)[0] || ''`. So: requested → **de** → **en** → first value → empty.
  - **ImageStylePicker:** `style.labels?.[uiLanguage] || fallbackUkRu || style.labels?.de || style.style_key`. So: requested → (uk/ru handling) → **de** → style_key.
  - If the DB has no key for the requested language (e.g. no `bs`), user can see **German** or **English** or the raw key, depending on component. No single standard.

### 4.3 Fallback chain summary

- **Main app translations:** lang → en → de (whole object).
- **DB labels (varies):** requested → de or en or first value or key name; **no consistent “requested → EN → DE → key”** across the app.
- **VoiceRecordButton:** requested → **de** only (no en in chain for this component).

---

## 5. DB-Based Translation Sources — SQL Audit Queries

Run these against your Supabase DB to list rows and per-language presence for the 7 app languages. No fixes applied; reporting only.

### 5.1 `learning_themes` (labels + descriptions)

```sql
-- learning_themes: labels and descriptions (7 app languages)
SELECT
  id,
  theme_key,
  labels->>'de' IS NOT NULL AND (labels->>'de') <> '' AS has_de,
  labels->>'fr' IS NOT NULL AND (labels->>'fr') <> '' AS has_fr,
  labels->>'en' IS NOT NULL AND (labels->>'en') <> '' AS has_en,
  labels->>'es' IS NOT NULL AND (labels->>'es') <> '' AS has_es,
  labels->>'nl' IS NOT NULL AND (labels->>'nl') <> '' AS has_nl,
  labels->>'it' IS NOT NULL AND (labels->>'it') <> '' AS has_it,
  labels->>'bs' IS NOT NULL AND (labels->>'bs') <> '' AS has_bs,
  descriptions->>'de' IS NOT NULL AND (descriptions->>'de') <> '' AS desc_de,
  descriptions->>'fr' IS NOT NULL AND (descriptions->>'fr') <> '' AS desc_fr,
  descriptions->>'en' IS NOT NULL AND (descriptions->>'en') <> '' AS desc_en,
  descriptions->>'es' IS NOT NULL AND (descriptions->>'es') <> '' AS desc_es,
  descriptions->>'nl' IS NOT NULL AND (descriptions->>'nl') <> '' AS desc_nl,
  descriptions->>'it' IS NOT NULL AND (descriptions->>'it') <> '' AS desc_it,
  descriptions->>'bs' IS NOT NULL AND (descriptions->>'bs') <> '' AS desc_bs
FROM learning_themes
ORDER BY theme_key;
```

### 5.2 `content_themes_by_level` (labels + example_texts)

```sql
-- content_themes_by_level: labels and example_texts (7 app languages)
SELECT
  id,
  theme_key,
  labels->>'de' IS NOT NULL AND (labels->>'de') <> '' AS has_de,
  labels->>'fr' IS NOT NULL AND (labels->>'fr') <> '' AS has_fr,
  labels->>'en' IS NOT NULL AND (labels->>'en') <> '' AS has_en,
  labels->>'es' IS NOT NULL AND (labels->>'es') <> '' AS has_es,
  labels->>'nl' IS NOT NULL AND (labels->>'nl') <> '' AS has_nl,
  labels->>'it' IS NOT NULL AND (labels->>'it') <> '' AS has_it,
  labels->>'bs' IS NOT NULL AND (labels->>'bs') <> '' AS has_bs,
  example_texts->>'de' IS NOT NULL AND (example_texts->>'de') <> '' AS ex_de,
  example_texts->>'fr' IS NOT NULL AND (example_texts->>'fr') <> '' AS ex_fr,
  example_texts->>'en' IS NOT NULL AND (example_texts->>'en') <> '' AS ex_en,
  example_texts->>'es' IS NOT NULL AND (example_texts->>'es') <> '' AS ex_es,
  example_texts->>'nl' IS NOT NULL AND (example_texts->>'nl') <> '' AS ex_nl,
  example_texts->>'it' IS NOT NULL AND (example_texts->>'it') <> '' AS ex_it,
  example_texts->>'bs' IS NOT NULL AND (example_texts->>'bs') <> '' AS ex_bs
FROM content_themes_by_level
ORDER BY theme_key;
```

### 5.3 `image_styles` (labels + description)

```sql
-- image_styles: labels and description (7 app languages)
SELECT
  id,
  style_key,
  labels->>'de' IS NOT NULL AND (labels->>'de') <> '' AS has_de,
  labels->>'fr' IS NOT NULL AND (labels->>'fr') <> '' AS has_fr,
  labels->>'en' IS NOT NULL AND (labels->>'en') <> '' AS has_en,
  labels->>'es' IS NOT NULL AND (labels->>'es') <> '' AS has_es,
  labels->>'nl' IS NOT NULL AND (labels->>'nl') <> '' AS has_nl,
  labels->>'it' IS NOT NULL AND (labels->>'it') <> '' AS has_it,
  labels->>'bs' IS NOT NULL AND (labels->>'bs') <> '' AS has_bs,
  description->>'de' IS NOT NULL AND (description->>'de') <> '' AS desc_de,
  description->>'fr' IS NOT NULL AND (description->>'fr') <> '' AS desc_fr,
  description->>'en' IS NOT NULL AND (description->>'en') <> '' AS desc_en,
  description->>'es' IS NOT NULL AND (description->>'es') <> '' AS desc_es,
  description->>'nl' IS NOT NULL AND (description->>'nl') <> '' AS desc_nl,
  description->>'it' IS NOT NULL AND (description->>'it') <> '' AS desc_it,
  description->>'bs' IS NOT NULL AND (description->>'bs') <> '' AS desc_bs
FROM image_styles
ORDER BY style_key;
```

### 5.4 `story_subtypes` (labels + descriptions)

```sql
-- story_subtypes: labels and descriptions (7 app languages)
SELECT
  id,
  theme_key,
  subtype_key,
  labels->>'de' IS NOT NULL AND (labels->>'de') <> '' AS has_de,
  labels->>'fr' IS NOT NULL AND (labels->>'fr') <> '' AS has_fr,
  labels->>'en' IS NOT NULL AND (labels->>'en') <> '' AS has_en,
  labels->>'es' IS NOT NULL AND (labels->>'es') <> '' AS has_es,
  labels->>'nl' IS NOT NULL AND (labels->>'nl') <> '' AS has_nl,
  labels->>'it' IS NOT NULL AND (labels->>'it') <> '' AS has_it,
  labels->>'bs' IS NOT NULL AND (labels->>'bs') <> '' AS has_bs,
  descriptions->>'de' IS NOT NULL AND (descriptions->>'de') <> '' AS desc_de,
  descriptions->>'fr' IS NOT NULL AND (descriptions->>'fr') <> '' AS desc_fr,
  descriptions->>'en' IS NOT NULL AND (descriptions->>'en') <> '' AS desc_en,
  descriptions->>'es' IS NOT NULL AND (descriptions->>'es') <> '' AS desc_es,
  descriptions->>'nl' IS NOT NULL AND (descriptions->>'nl') <> '' AS desc_nl,
  descriptions->>'it' IS NOT NULL AND (descriptions->>'it') <> '' AS desc_it,
  descriptions->>'bs' IS NOT NULL AND (descriptions->>'bs') <> '' AS desc_bs
FROM story_subtypes
ORDER BY theme_key, subtype_key;
```

### 5.5 Summary counts (optional)

```sql
-- Row counts with full 7-language coverage (all TRUE) per table
-- learning_themes
SELECT 'learning_themes' AS tbl,
  count(*) AS total,
  count(*) FILTER (
    (labels ? 'de') AND (labels ? 'fr') AND (labels ? 'en') AND (labels ? 'es')
    AND (labels ? 'nl') AND (labels ? 'it') AND (labels ? 'bs')
    AND (descriptions ? 'de') AND (descriptions ? 'fr') AND (descriptions ? 'en')
    AND (descriptions ? 'es') AND (descriptions ? 'nl') AND (descriptions ? 'it') AND (descriptions ? 'bs')
  ) AS rows_all_7
FROM learning_themes
UNION ALL
-- content_themes_by_level
SELECT 'content_themes_by_level',
  count(*),
  count(*) FILTER (
    (labels ? 'de') AND (labels ? 'fr') AND (labels ? 'en') AND (labels ? 'es') AND (labels ? 'nl') AND (labels ? 'it') AND (labels ? 'bs')
    AND (example_texts ? 'de') AND (example_texts ? 'fr') AND (example_texts ? 'en') AND (example_texts ? 'es') AND (example_texts ? 'nl') AND (example_texts ? 'it') AND (example_texts ? 'bs')
  )
FROM content_themes_by_level
UNION ALL
-- image_styles
SELECT 'image_styles',
  count(*),
  count(*) FILTER (
    (labels ? 'de') AND (labels ? 'fr') AND (labels ? 'en') AND (labels ? 'es') AND (labels ? 'nl') AND (labels ? 'it') AND (labels ? 'bs')
    AND (description ? 'de') AND (description ? 'fr') AND (description ? 'en') AND (description ? 'es') AND (description ? 'nl') AND (description ? 'it') AND (description ? 'bs')
  )
FROM image_styles
UNION ALL
-- story_subtypes
SELECT 'story_subtypes',
  count(*),
  count(*) FILTER (
    (labels ? 'de') AND (labels ? 'fr') AND (labels ? 'en') AND (labels ? 'es') AND (labels ? 'nl') AND (labels ? 'it') AND (labels ? 'bs')
    AND (descriptions ? 'de') AND (descriptions ? 'fr') AND (descriptions ? 'en') AND (descriptions ? 'es') AND (descriptions ? 'nl') AND (descriptions ? 'it') AND (descriptions ? 'bs')
  )
FROM story_subtypes;
```

After running the per-table queries, fill in the “Complete list of missing translations” for DB in a follow-up section (e.g. “3b. DB missing”) with: table, row id/key, field (labels/descriptions/example_texts), missing language(s).

---

## 6. Recommended Fix Approach

### Critical (fix first)

1. **VoiceRecordButton — add Bosnian (BS)**  
   Add a `bs` entry to `VOICE_LABELS` with the same 7 sub-keys (speak, listening, retry, confirm, mic_denied, empty, failed).  
   **Owner:** Frontend (Lovable).

2. **DB JSONB — ensure BS (and other 7) everywhere**  
   Run the SQL audit above; for any row where `has_bs` (or other lang) is FALSE, add the missing key to the JSONB column.  
   **Owner:** Cursor / Supabase migrations (or Lovable SQL).

### Cosmetic / consistency

3. **Empty strings in extended languages**  
   In `src/lib/translations/`, ro, lt, pt, sl, sk, bg, ca, pl, hu, tr have empty strings for `emptyStateStories`, `emptyStateVocabulary`, `emptyStateQuiz`, `emptyStateResults`. Only relevant if those languages are ever shown in UI.  
   **Owner:** Frontend.

4. **Unified fallback for DB labels**  
   Consider a single helper, e.g. `getDbLabel(labels, lang)` with chain `lang → en → de → first value → ''`, and use it in ParentSettingsPanel, ImageStylePicker, and any other component that reads DB JSONB labels. Reduces “wrong language” surprises.  
   **Owner:** Frontend.

5. **Fallback chain for main app**  
   Current `FALLBACK_CHAIN = ['en', 'de']` is reasonable; if you want BS to fall back to a specific language when a key is ever missing, document or extend the chain (e.g. add `bs` → en or de in a single place).

### Split of work

- **Cursor (this repo):** DB migrations to add missing language keys to `learning_themes`, `content_themes_by_level`, `image_styles`, `story_subtypes` (after running the audit SQL and listing gaps).
- **Lovable (frontend):** VoiceRecordButton BS translations; optionally empty-state translations for extended languages and a shared DB-label fallback helper.

---

## 7. Fallback Issues Found

| Issue | Where | Impact |
|-------|--------|--------|
| No BS in VoiceRecordButton | VoiceRecordButton.tsx | BS users see German for all recording UI labels. |
| DB label fallback differs by component | ParentSettingsPanel (de → en → first), ImageStylePicker (de → style_key) | Same missing lang can show DE in one place and EN or key elsewhere. |
| No per-key fallback in main translations | getTranslations() | Not an issue in practice because each language file has all keys; only whole-lang fallback (en → de) applies. |

---

**End of report.** Run the SQL in §5, fill in the DB gap list from the result, then prioritize critical fixes (VoiceRecordButton BS + DB BS/other missing keys).
