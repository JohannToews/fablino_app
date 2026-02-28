# Story Generation Rule Tables — Language Coverage Analysis

**Date:** 2025-02-24  
**Scope:** `age_rules`, `theme_rules`, `emotion_rules`, `difficulty_rules` — what the migrations define, and how the story prompt is built.  
**Purpose:** Verify language coverage for B-05 (Spanish pronoun repetition) and data model doc claims.

---

## 1. Summary Table (from migrations only — no DB query)

| Table             | Distinct languages in migrations | Row count (inferred) | Notes |
|------------------|----------------------------------|----------------------|--------|
| **age_rules**    | 16                               | 4 age bands × 16     | de, fr, en, hu, pt, tr, bg, lt, ca, pl, sk + **es, it, nl, bs, sl** (20260228). |
| **theme_rules**  | 16                               | 6 themes × 16        | Same 16. **es, it, nl, bs, sl** in 20260228. |
| **emotion_rules**| 11                               | 6 emotions × 11     | No es, it, bs, nl, sl. |
| **difficulty_rules** | 16 (if base seed exists)     | 3 levels × 16        | 11 + **es, it, nl, bs, sl** (20260228). |

**Conclusion:** The data model doc saying “only DE/FR/EN” is **outdated**. Migrations define **11 languages**: **de, fr, en, hu, pt, tr, bg, lt, ca, pl, sk**.  
After **20260228_language_rules_es_it_nl_bs_sl.sql**, **age_rules**, **theme_rules**, and **difficulty_rules** cover **16 languages** (including es, it, nl, bs, sl) with language-specific rules. **emotion_rules** still has only 11 languages.

---

## 2. Per-table detail (from migrations)

### 2.1 age_rules

- **Created:** `20260207_block2_2_rule_tables.sql` — seed: **fr, de, en** only (4 age groups: 4–5, 6–7, 8–9, 10–12).
- **Adjusted:** `20260207_block2_2b_difficulty_rules_and_age_adjustments.sql` — 4–5 removed; 10–12 → 10–11; 12–13 added. So **4 bands**: 6–7, 8–9, 10–11, 12–13.
- **Expanded:** `20260217_language_expansion_beta.sql` — copies all **EN** rows to: **hu, pt, tr, bg, lt, ca, pl, sk** (8 languages). ON CONFLICT DO NOTHING.

**Expanded (es, it, nl, bs, sl):** `20260228_language_rules_es_it_nl_bs_sl.sql` — **language-specific** rows for **es, it, nl, bs, sl** (not copied from EN): pro-drop guidance for es/it/bs/sl, V2/SOV and subject pronouns for nl, compound-word caution for sl, ser/estar and ¿¡ for es, passato prossimo/imperfetto for it, aspect for bs, dual for sl. ON CONFLICT DO NOTHING. Complexity fields (max_characters, max_plot_twists, plot_complexity) set per band.

**Distinct `language` in migrations:** de, fr, en, hu, pt, tr, bg, lt, ca, pl, sk, **es, it, nl, bs, sl** → **16**.  
**Row count:** 4 × 16 = **64** (if all migrations applied in order).

### 2.2 theme_rules

- **Created:** `20260207_block2_2_rule_tables.sql` — 6 themes × **fr, de, en** (fantasy, action, animals, everyday, humor, educational).
- **Expanded:** `20260217_language_expansion_beta.sql` — copies all **EN** theme_rules to the same 8 languages.
- **Expanded (es, it, nl, bs, sl):** `20260228_language_rules_es_it_nl_bs_sl.sql` — 6 themes × 5 languages, content in target language. ON CONFLICT DO NOTHING.

**Distinct `language`:** **16**.  
**Row count:** 6 × 16 = **96**.

### 2.3 emotion_rules

- **Created:** `20260207_block2_2_rule_tables.sql` — 6 emotion_keys × **fr, de, en** (joy, thrill, humor_emotion, warmth, curiosity, depth).
- **Expanded:** `20260217_language_expansion_beta.sql` — copies all **EN** emotion_rules to the same 8 languages.
- **Translations:** `20260223_translations_emotion_rules.sql` and RUN_IN_LOVABLE_* only **UPDATE** existing rows (add tr, bg, ro, pl, lt, hu, ca, sl to `labels` JSONB). They do **not** insert new languages.

**Distinct `language`:** same **11**.  
**Row count:** 6 × 11 = **66**.

### 2.4 difficulty_rules

- **Created:** `20260207_block2_2b_difficulty_rules_and_age_adjustments.sql` — table only, **no INSERT** in that file.
- **Expanded:** `20260217_language_expansion_beta.sql` — `INSERT ... SELECT ... FROM difficulty_rules dr WHERE dr.language = 'en'` into 8 new languages. So **EN** rows must already exist.
- **Translations:** `20260223_translations_difficulty_rules.sql` — **UPDATE** only (adds tr, bg, ro, pl, lt, hu, ca, sl to `label` / `description`). Comment says “9 rows: 1,2,3 × de, en, fr”.

**Expanded (es, it, nl, bs, sl):** `20260228_language_rules_es_it_nl_bs_sl.sql` — 3 levels × 5 languages with language-specific label/description (jsonb), vocabulary_scope, figurative_language, idiom_usage, repetition_strategy, humor_types, example_vocabulary. ON CONFLICT DO NOTHING.

**Inferred:** Base seed inserts difficulty_rules for **de, en, fr**. Then 20260217 adds 8 languages; 20260228 adds **es, it, nl, bs, sl** → **16** languages.  
**Distinct `language`:** **16**. **Row count:** 3 × 16 = **48**.

---

## 3. Code path: story generation → rule lookup → prompt assembly

### 3.1 Trigger

- **Entry:** `supabase/functions/generate-story/index.ts` — HTTP handler builds `StoryRequest` (includes `story_language`, `theme_key`, `kid_profile.difficulty_level`, etc.).
- **Prompt build:**  
  `const promptResult = await buildStoryPrompt(storyRequest, supabase);`  
  `userMessageFinal = promptResult.prompt;`

### 3.2 Rule loading in promptBuilder.ts

All in **`supabase/functions/_shared/promptBuilder.ts`**, inside `buildStoryPrompt(request, supabaseClient)`:

- **lang** = `request.story_language` (e.g. `'es'`, `'de'`).

1. **age_rules**  
   - Query: `from('age_rules').eq('language', lang).lte('min_age', ageForRules).gte('max_age', ageForRules).maybeSingle()`.  
   - Fallback 1: if no row and lang ∉ {en, de} → try **en**.  
   - Fallback 2: if still no row and lang ≠ de → try **de**.  
   - Fallback 3: if still no row → **hardcoded default** (e.g. `style_prompt: 'Write in a child-friendly, engaging style.'`, etc.).

2. **difficulty_rules**  
   - Query: `from('difficulty_rules').eq('language', lang).eq('difficulty_level', request.kid_profile.difficulty_level).maybeSingle()`.  
   - Fallbacks: same **lang → en → de**; then hardcoded default (word_count_min/max, sentence_length, etc.).

3. **theme_rules**  
   - Query: `from('theme_rules').eq('theme_key', request.theme_key).eq('language', lang).maybeSingle()`.  
   - Fallback 1: **en** (if lang ∉ {en, de}).  
   - Fallback 2: **de**.  
   - Fallback 3: **everyday** + **de**.  
   - If still null: themeRules = null (treated as “surprise” theme).

4. **emotion_rules**  
   - **Not queried.** There is no `from('emotion_rules')` in `promptBuilder.ts` or in the generate-story pipeline. Emotion_rules exist in the DB and are updated by translations migrations but are **not** used when assembling the story prompt.

### 3.3 How rules are injected into the prompt

- **age_rules:** narrative_guidelines, max_sentence_length, allowed_tenses, sentence_structures, narrative_perspective, paragraph_length, dialogue_ratio, min/max word counts (via factor from length).
- **difficulty_rules:** vocabulary_scope, new_words_per_story, figurative_language, idiom_usage, repetition_strategy (and label/description for section headers).
- **theme_rules:** plot_templates, setting_descriptions, character_archetypes, sensory_details, typical_conflicts (and theme label).

So for a given `story_language`:

- If that language **has** rows → its own rules are used.
- If it **does not** (e.g. **es**) → **en** (then **de**) rules are used; **no language-specific prompt text** for Spanish (e.g. no Spanish pronoun or repetition guidance).

---

## 4. B-05 (Spanish pronoun repetition) — missing rules vs prompt wording

- **Spanish (es)** now **has** rows in `age_rules`, `theme_rules`, and `difficulty_rules` (migration 20260228); **no** rows in `emotion_rules`.
- For `story_language = 'es'` the code therefore:
  - Uses **English** age_rules, difficulty_rules, theme_rules (after fallback).
  - Injects **English** wording (sentence structures, tenses, narrative guidelines, vocabulary scope, **repetition_strategy**, etc.) into the prompt, while the model is asked to write the **story** in Spanish.

So:

1. **Missing-rules:** Addressed by **20260228_language_rules_es_it_nl_bs_sl.sql**: `es` (and it, nl, bs, sl) now have rows in `age_rules`, `theme_rules`, and `difficulty_rules` with language-specific instructions (e.g. Spanish: pro-drop, no redundant subject pronouns, ¿¡, ser/estar).
2. **Prompt-wording:** With the new rules, the prompt receives Spanish **narrative_guidelines**, **repetition_strategy**, and vocabulary/idiom guidance in Spanish, so B-05 is largely addressed for story generation.

---

## 5. Recommended verification (with real DB)

Run these in the Supabase SQL editor to confirm actual state (row counts and languages):

```sql
-- age_rules
SELECT 'age_rules' AS tbl, count(*) AS total, count(DISTINCT language) AS distinct_lang
FROM age_rules;
SELECT language, count(*) FROM age_rules GROUP BY language ORDER BY language;

-- theme_rules
SELECT 'theme_rules' AS tbl, count(*) AS total, count(DISTINCT language) AS distinct_lang
FROM theme_rules;
SELECT language, count(*) FROM theme_rules GROUP BY language ORDER BY language;

-- emotion_rules
SELECT 'emotion_rules' AS tbl, count(*) AS total, count(DISTINCT language) AS distinct_lang
FROM emotion_rules;
SELECT language, count(*) FROM emotion_rules GROUP BY language ORDER BY language;

-- difficulty_rules
SELECT 'difficulty_rules' AS tbl, count(*) AS total, count(DISTINCT language) AS distinct_lang
FROM difficulty_rules;
SELECT language, count(*) FROM difficulty_rules GROUP BY language ORDER BY language;
```

Compare results to this report; if the DB was ever seeded or modified outside these migrations, counts may differ.

---

## 6. References (code and migrations)

- **Prompt assembly:** `supabase/functions/_shared/promptBuilder.ts` — `buildStoryPrompt()`, ~lines 1224–1330 (rule loading), 1568–1698 (injection into sections).
- **Story trigger:** `supabase/functions/generate-story/index.ts` — `buildStoryPrompt(storyRequest, supabase)` ~line 1914.
- **Migrations:**  
  - `20260207_block2_2_rule_tables.sql` (age, theme, emotion seeds: fr, de, en),  
  - `20260207_block2_2b_difficulty_rules_and_age_adjustments.sql` (age tweaks, difficulty_rules table),  
  - `20260217_language_expansion_beta.sql` (8 languages from EN for all four tables).
