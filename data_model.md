# Data Model – Fablino

> Complete database schema reference for Cursor and AI-assisted development.
> Covers all Supabase PostgreSQL tables, enums, RPC functions, and planned extensions.

**Last updated**: 2026-02-24

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationships](#entity-relationships)
3. [Enums](#enums)
4. [Core Tables](#core-tables)
5. [Gamification Tables](#gamification-tables)
6. [Story Generation Rule Tables](#story-generation-rule-tables)
7. [Learning & Guardrails Tables](#learning--guardrails-tables)
8. [System Tables](#system-tables)
9. [RPC Functions](#rpc-functions)
10. [Triggers](#triggers)
11. [Storage Buckets](#storage-buckets)
12. [Extension: Language Management](#extension-language-management)
13. [i18n Architecture (Current)](#i18n-architecture-current)

---

## Overview

- **Database**: Supabase PostgreSQL with RLS (Row Level Security)
- **Total tables**: ~35 (core) + 6 (planned language extension)
- **Enums**: 3
- **RPC functions**: 5
- **Migrations**: 78+ SQL files
- **Auth**: Dual — legacy (username/password, sessionStorage) and Supabase Auth (`user_profiles.auth_id`). Edge Functions accept both.

---

## Entity Relationships

```
user_profiles (1) ──── (N) kid_profiles
      │                       │
      │                       ├── (N) stories
      │                       ├── (N) kid_characters
      │                       ├── (1) parent_learning_config
      │                       ├── (1) user_progress
      │                       ├── (N) user_results
      │                       ├── (N) user_badges
      │                       ├── (N) point_transactions
      │                       ├── (N) collected_items
      │                       └── (N) streak_milestones
      │
      ├── (1) user_roles
      ├── (N) story_ratings
      └── (N) stories (via user_id)
              │
              ├── (N) marked_words
              ├── (N) comprehension_questions
              ├── (N) shared_stories
              ├── (N) consistency_check_results
              └── (N) stories (self-ref via series_id)

levels                      ← 5 rows: star-based level definitions
badges                      ← 23 rows: 4 categories
point_settings              ← 8 rows: configurable star values
point_settings_legacy       ← old schema, kept for reference

learning_themes             ← 15 entries
content_themes_by_level     ← ~19 entries

age_rules                   ← 12 entries (4 age groups × 3 langs)
theme_rules                 ← 18 entries (6 themes × 3 langs)
emotion_rules               ← 18 entries (6 emotions × 3 langs)
image_style_rules           ← 6 entries (3 age groups × 2 types)
difficulty_rules            ← 9 entries (3 levels × 3 langs)
```

---

## Enums

| Enum | Values | Used By |
|------|--------|---------|
| `app_role` | `admin`, `standard` | `user_roles.role` |
| `ending_type` | `A` (complete), `B` (open), `C` (cliffhanger) | `stories.ending_type` |
| `collectible_category` | `creature`, `place`, `object`, `star` | `collected_items`, `collectible_pool` |

---

## Core Tables

### `user_profiles`

User accounts. Supports legacy login (username/password) and Supabase Auth (link via `auth_id`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `username` | TEXT UNIQUE | Login credential (legacy) |
| `password_hash` | TEXT | ⚠️ Legacy; plain text (tech debt) |
| `display_name` | TEXT | |
| `admin_language` | TEXT | Admin UI language |
| `app_language` | TEXT | Parent-facing app language |
| `text_language` | TEXT | Default story language |
| `auth_id` | UUID NULL | Supabase Auth user id (when migrated) |
| `auth_migrated` | BOOLEAN NULL | True if account uses Supabase Auth |
| `email` | TEXT NULL | Email (Supabase Auth) |
| `system_prompt` | TEXT NULL | Optional per-user system prompt override |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

### `user_roles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user_profiles | |
| `role` | app_role | `admin` or `standard` |

### `kid_profiles`

Child profiles — multiple per user. Central to language handling and story personalization.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user_profiles | Parent account |
| `name` | TEXT | Child's first name |
| `age` | INTEGER | |
| `gender` | TEXT | |
| `hobbies` | TEXT | Free text |
| `school_system` | TEXT | Determines UI language + reading language (DE, FR, EN, ES, NL, IT, BS) |
| `school_class` | TEXT | Class name from `schoolSystems.ts` |
| `color_palette` | TEXT | Theme: ocean, sunset, forest, lavender, sunshine |
| `image_style` | TEXT | Preferred image generation style |
| `ui_language` | TEXT | Override for UI translations |
| `reading_language` | TEXT | Language for story text |
| `explanation_language` | TEXT | Language for word explanations |
| `home_languages` | TEXT[] | Languages spoken at home |
| `story_languages` | TEXT[] | Languages available in story wizard picker |
| `content_safety_level` | INTEGER (1-4) | Content guardrails level |
| `difficulty_level` | INTEGER (1-3) | Story difficulty |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Language derivation** (in `useKidProfile.tsx`):
```
kid_profiles.school_system → getKidLanguage(school_system)
  ├── kidAppLanguage      → UI translations (lib/translations.ts)
  ├── kidReadingLanguage   → Story generation language
  └── kidExplanationLanguage → Word explanations
```

### `stories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user_profiles | Creator |
| `kid_profile_id` | UUID FK → kid_profiles | Nullable (legacy stories) |
| `title` | TEXT | Generated title |
| `content` | TEXT | Full story text |
| `cover_image_url` | TEXT | URL to cover image |
| `story_images` | JSONB (TEXT[]) | Scene image URLs |
| `image_count` | INTEGER | Number of generated images |
| `difficulty` | TEXT | easy/medium/hard |
| `text_language` | TEXT | Language of story text |
| `text_type` | TEXT | fiction/non-fiction |
| `generation_status` | TEXT | pending/generating/completed/error |
| `is_favorite` | BOOLEAN | Default false |
| `humor_level` | INTEGER (1-5) | |
| `emotional_depth` | INTEGER (1-3) | |
| `moral_topic` | TEXT | |
| `concrete_theme` | TEXT | |
| `learning_theme_applied` | TEXT | Applied learning theme |
| `parent_prompt_text` | TEXT | Free text from parent |
| `structure_sentence_variety` | REAL | Rating 0-1 |
| `structure_paragraph_structure` | REAL | Rating 0-1 |
| `structure_dialogue_balance` | REAL | Rating 0-1 |
| `structure_pacing` | REAL | Rating 0-1 |
| **Series columns** | | |
| `series_id` | UUID | Links episodes (Ep 1 uses own story.id) |
| `episode_number` | INTEGER | 1-5 |
| `ending_type` | ending_type enum | A=complete, B=open, C=cliffhanger |
| `episode_summary` | TEXT | ~100 word summary for next-episode context |
| `continuity_state` | JSONB | Cross-episode state (see Series architecture) |
| `visual_style_sheet` | JSONB | Visual consistency across episodes |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**continuity_state JSONB structure:**
```json
{
  "established_facts": ["..."],
  "open_threads": ["..."],
  "character_states": { "Name": "state description" },
  "world_rules": ["..."],
  "signature_element": {
    "description": "...",
    "usage_history": ["Ep1: ...", "Ep2: ..."]
  }
}
```

**visual_style_sheet JSONB structure:**
```json
{
  "characters": { "Name": "visual description" },
  "world_style": "Watercolor forest with soft morning light...",
  "recurring_visual": "Glowing blue feather..."
}
```

### `kid_characters`

Recurring story figures per kid profile.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `kid_profile_id` | UUID FK → kid_profiles (CASCADE) | |
| `name` | TEXT | Character name |
| `role` | TEXT | family/friend/known_figure |
| `age` | TEXT | |
| `relation` | TEXT | e.g. "Schwester", "bester Freund" |
| `description` | TEXT | Free text description |
| `is_active` | BOOLEAN | |
| `sort_order` | INTEGER | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `marked_words`

Vocabulary words saved during reading.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `story_id` | UUID FK → stories | |
| `kid_profile_id` | UUID FK → kid_profiles | |
| `word` | TEXT | The saved word |
| `explanation` | TEXT | Child-friendly explanation (max 8 words) |
| `difficulty` | TEXT | |
| `word_language` | TEXT | Language of the word |
| `explanation_language` | TEXT | Language of explanation |
| `quiz_history` | JSONB (BOOLEAN[]) | Track correct/incorrect answers |
| `is_learned` | BOOLEAN | Auto-set after 3 consecutive correct |
| `created_at` | TIMESTAMPTZ | |

### `comprehension_questions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `story_id` | UUID FK → stories | |
| `question` | TEXT | |
| `expected_answer` | TEXT | |
| `options` | JSONB (TEXT[]) | Multiple choice options |
| `question_language` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

## Gamification Tables

### `levels`

5 level tiers (star-based progression).

| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL PK | |
| `name` | TEXT | e.g. "Bücherfuchs" |
| `emoji` | TEXT | 🦊, 🔍, 🛡️, ✨, 👑 |
| `stars_required` | INTEGER | 0, 25, 75, 150, 300 |
| `sort_order` | INTEGER | |
| `color` | TEXT | Bronze, Silver, Gold, Crystal, Platinum |
| `unlock_feature` | TEXT | NULL, sharing, series, special_themes, secret_story |
| `icon_url` | TEXT | |

### `badges`

23 badge/sticker definitions across 4 categories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | TEXT | |
| `emoji` | TEXT | |
| `description` | TEXT | |
| `category` | TEXT | milestone / weekly / streak / special |
| `condition_type` | TEXT | total_stars / weekly_stories / streak_days / total_stories_read / consecutive_perfect_quiz / total_perfect_quiz / series_completed / languages_read |
| `condition_value` | INTEGER | Threshold to earn |
| `sort_order` | INTEGER | |
| `bonus_stars` | INTEGER | Stars awarded when badge earned |
| `fablino_message` | TEXT | Celebration message from mascot |
| `frame_color` | TEXT | Badge frame color |
| `repeatable` | BOOLEAN | True for weekly badges |

### `user_badges`

Earned badges per child. **No UNIQUE constraint** — repeatable weekly badges can be earned multiple times.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `child_id` | UUID FK → kid_profiles | |
| `badge_id` | UUID FK → badges (CASCADE) | |
| `earned_at` | TIMESTAMPTZ | |
| `is_new` | BOOLEAN | For "Neu" indicator in UI |

### `user_progress`

Aggregated stats per child (one row per kid).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `kid_profile_id` | UUID FK → kid_profiles (UNIQUE) | |
| `total_stars` | INTEGER | Renamed from total_points |
| `current_streak` | INTEGER | Consecutive reading days |
| `longest_streak` | INTEGER | |
| `last_read_date` | DATE | For streak calculation |
| `weekly_stories_count` | INTEGER | Reset on Mondays |
| `weekly_reset_date` | DATE | Last Monday reset |
| `weekly_bonus_claimed` | INTEGER | Highest weekly bonus tier claimed |
| `consecutive_perfect_quizzes` | INTEGER | |
| `total_perfect_quizzes` | INTEGER | |
| `total_stories_read` | INTEGER | |
| `languages_read` | TEXT[] | Unique languages read |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `user_results`

Activity log (star transactions).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → user_profiles | |
| `kid_profile_id` | UUID FK → kid_profiles | |
| `activity_type` | TEXT | `story_read` or `quiz_complete` |
| `stars_earned` | INTEGER | |
| `points_earned` | INTEGER | Legacy field |
| `metadata` | JSONB | e.g. `{ score_percent: 100, story_id: "..." }` |
| `reference_id` | UUID | Reference to story |
| `created_at` | TIMESTAMPTZ | |

### `point_settings`

Configurable star values (new schema, 8 entries).

| Column | Type | Notes |
|--------|------|-------|
| `setting_key` | TEXT PK | |
| `value` | TEXT | Stored as text, parsed to int |
| `description` | TEXT | |

**Current entries:**

| setting_key | value | description |
|-------------|-------|-------------|
| `stars_story_read` | 1 | Stars for reading a story |
| `stars_quiz_perfect` | 2 | Stars for 100% quiz |
| `stars_quiz_passed` | 1 | Stars for ≥80% quiz |
| `stars_quiz_failed` | 0 | Stars for <80% quiz |
| `quiz_pass_threshold` | 80 | Pass percentage |
| `weekly_bonus_3` | 3 | Bonus for 3 stories/week |
| `weekly_bonus_5` | 5 | Bonus for 5 stories/week |
| `weekly_bonus_7` | 8 | Bonus for 7 stories/week |

### Legacy Gamification Tables

| Table | Status | Notes |
|-------|--------|-------|
| `point_settings_legacy` | Deprecated | Old category/difficulty/points schema |
| `point_transactions` | Deprecated | Pre-star-system detailed point history |
| `level_settings` | Deprecated | Pre-star-system level definitions |
| `streak_milestones` | Active | Claimed streak bonuses |
| `collected_items` | Active | Items collected by kids |
| `collectible_pool` | Active | Available collectible items (creature/place/object/star) |

---

## Story Generation Rule Tables

These tables drive the dynamic prompt engine (`promptBuilder.ts`). Currently seeded for 3 languages (DE, FR, EN). **Language extension requires adding rows for each new language.**

### `age_rules`

Language complexity rules by age group.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `age_group` | TEXT | e.g. "6-7", "8-9", "10-11", "12+" |
| `language` | TEXT | ISO code: "de", "fr", "en" |
| `rules` | JSONB | Sentence length, vocabulary level, grammar complexity, etc. |
| `created_at` | TIMESTAMPTZ | |

**Current entries**: 12 (4 age groups × 3 languages)

### `difficulty_rules`

Vocabulary complexity per difficulty level.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `difficulty_level` | TEXT | "easy", "medium", "hard" |
| `language` | TEXT | ISO code |
| `rules` | JSONB | Vocabulary constraints, sentence complexity |
| `created_at` | TIMESTAMPTZ | |

**Current entries**: 9 (3 levels × 3 languages)

### `theme_rules`

Plot templates, settings, conflicts per theme.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `theme` | TEXT | magic, action, animals, friends, chaos, surprise |
| `language` | TEXT | ISO code |
| `rules` | JSONB | Plot templates, settings, conflicts |
| `image_style` | TEXT | Image style hints |
| `created_at` | TIMESTAMPTZ | |

**Current entries**: 18 (6 themes × 3 languages)

### `emotion_rules`

Conflict patterns, character development per emotion.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `emotion` | TEXT | 6 emotion types |
| `language` | TEXT | ISO code |
| `rules` | JSONB | Conflict patterns, character development arcs |
| `created_at` | TIMESTAMPTZ | |

**Current entries**: 18 (6 emotions × 3 languages)

### `image_style_rules`

Visual style instructions per age group.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `age_group` | TEXT | |
| `type` | TEXT | cover / scene |
| `rules` | JSONB | Style instructions for image generation |
| `created_at` | TIMESTAMPTZ | |

**Current entries**: 6 (3 age groups × 2 types)

---

## Learning & Guardrails Tables

### `learning_themes`

15 educational themes in 4 categories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `theme_key` | TEXT | Unique identifier |
| `category` | TEXT | social, emotional, character, cognitive |
| `labels` | JSONB | Translated names in 7 languages (DE, FR, EN, ES, NL, IT, BS) |
| `descriptions` | JSONB | Translated descriptions in 7 languages |
| `created_at` | TIMESTAMPTZ | |

### `content_themes_by_level`

Emotional content themes with safety levels.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `theme` | TEXT | Theme identifier |
| `safety_level` | INTEGER | 0=never, 1-4=allowed from this level |
| `labels` | JSONB | Translated labels |
| `created_at` | TIMESTAMPTZ | |

**~19 entries**

### `parent_learning_config`

Per-kid learning preferences (set by parent in admin).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `kid_profile_id` | UUID FK → kid_profiles | |
| `active_themes` | TEXT[] | Max 3 active themes |
| `frequency` | INTEGER (1-3) | How often themes appear |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

## System Tables

### `app_settings`

Key-value configuration store. RLS typically allows read for all; write via Edge Functions or admin-only policies.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `key` | TEXT UNIQUE | Setting identifier |
| `value` | TEXT | Setting value (JSON string or long prompt text) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Key categories**:
- **System prompts**: CORE Slim v2, modular prompts per language, consistency check, etc.
- **Per-user feature flags** (value = JSON array of `user_profiles.id`, or `["*"]` for all):

| Key | Purpose | Toggle location |
|-----|---------|-----------------|
| `emotion_flow_enabled_users` | Emotion-Flow story generation (backend) | Admin → Feature Flags |
| `comic_strip_enabled_users` | Comic-strip layout (backend) | Admin → Feature Flags |
| `premium_ui_enabled_users` | Premium UI styling (frontend: body.premium-ui, shadows, route transitions) | Admin → Feature Flags, or Parent Settings (Eltern) |

### `story_ratings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `story_id` | UUID FK → stories | |
| `user_id` | UUID FK → user_profiles | |
| `rating` | INTEGER (1-5) | |
| `weakest_part` | TEXT | Feedback on weakest aspect |
| `created_at` | TIMESTAMPTZ | |

### `consistency_check_results`

LLM consistency check logs for stories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `story_id` | UUID FK → stories | |
| `check_result` | JSONB | Structured errors with severity |
| `created_at` | TIMESTAMPTZ | |

### `image_cache`

Generated image cache by prompt hash.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `prompt_hash` | TEXT | Hash of generation prompt |
| `image_url` | TEXT | Cached image URL |
| `created_at` | TIMESTAMPTZ | |

### `shared_stories`

QR code share tokens.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `story_id` | UUID FK → stories | |
| `token` | TEXT UNIQUE | Share token |
| `expires_at` | TIMESTAMPTZ | 24h expiry |
| `created_at` | TIMESTAMPTZ | |

---

## RPC Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `log_activity` | `(p_child_id UUID, p_activity_type TEXT, p_stars INT, p_metadata JSONB)` | Core gamification: reads star values from `point_settings`, weekly reset, counters, streak, weekly bonus, calls `check_and_award_badges`. Returns `{total_stars, stars_earned, bonus_stars, weekly_bonus, current_streak, weekly_stories_count, new_badges[]}`. Activity types: `story_read`, `quiz_complete`. |
| `check_and_award_badges` | `(p_child_id UUID)` | Checks all 23 badges across 4 categories. Awards `bonus_stars`. Returns JSONB array of newly earned badges. |
| `get_results_page` | `(p_child_id UUID)` | Returns: child_name, total_stars, current_streak, longest_streak, weekly_stories_count, weekly_bonus_claimed, total_stories_read, total_perfect_quizzes, languages_read[], current_level, next_level, levels (5), badges (23 with earned/earned_at/times_earned). |
| `get_my_stories_list` | `(p_profile_id UUID, p_limit INT, p_offset INT)` | Server-side filtered story list (no content transferred). Returns: id, title, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type. |
| `get_my_results` | `()` | User activity results for story completion status. Returns reference_id, kid_profile_id. |

---

## Triggers

| Trigger | Function | Applied To |
|---------|----------|------------|
| `update_updated_at_column()` | Sets `updated_at = now()` | 13+ tables with `updated_at` column |
| `update_word_learned_status()` | Sets `is_learned = true` after 3 consecutive correct answers | `marked_words` |

---

## Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `covers` | Private | Story/profile cover images (legacy) |
| `story-images` | Public | Migrated story images (via `migrate-covers` edge function). Supports Supabase Storage transform API for thumbnails. |

---

## Extension: Language Management

> **Status**: PLANNED — New tables to support dynamic addition/removal of app languages (parent UI) and story languages (child content).

### New Tables

#### `app_languages`

Registry of available UI languages for parents.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `code` | TEXT UNIQUE NOT NULL | ISO 639-1: 'pt', 'pl', 'lt', 'de', 'fr', etc. |
| `name_native` | TEXT NOT NULL | e.g. 'Português', 'Polski', 'Lietuvių' |
| `name_english` | TEXT NOT NULL | e.g. 'Portuguese', 'Polish', 'Lithuanian' |
| `flag_emoji` | TEXT | 🇵🇹, 🇵🇱, 🇱🇹 |
| `is_active` | BOOLEAN DEFAULT false | Available to users |
| `is_beta` | BOOLEAN DEFAULT true | Show beta badge in UI |
| `translation_progress` | INTEGER DEFAULT 0 | Percentage 0-100 |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `app_translations`

All UI translation strings (replaces/extends `lib/translations.ts`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `language_code` | TEXT FK → app_languages(code) | |
| `translation_key` | TEXT NOT NULL | e.g. 'onboarding.welcome_title', 'home.new_story' |
| `translation_value` | TEXT NOT NULL | Translated string |
| `is_verified` | BOOLEAN DEFAULT false | Human-reviewed? |
| `created_at` | TIMESTAMPTZ | |
| **UNIQUE** | `(language_code, translation_key)` | |

#### `story_languages`

Registry of available story/content languages for children.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `code` | TEXT UNIQUE NOT NULL | ISO 639-1 |
| `name_native` | TEXT NOT NULL | |
| `name_english` | TEXT NOT NULL | |
| `flag_emoji` | TEXT | |
| `is_active` | BOOLEAN DEFAULT false | |
| `is_beta` | BOOLEAN DEFAULT true | |
| `stt_supported` | BOOLEAN DEFAULT false | Speech-to-text available? |
| `stt_provider` | TEXT | 'gladia', 'whisper', etc. |
| `tts_supported` | BOOLEAN DEFAULT false | Text-to-speech available? |
| `tts_provider` | TEXT | 'elevenlabs', etc. |
| `tts_voice_ids` | JSONB DEFAULT '[]' | Available voice IDs |
| `ai_quality_rating` | TEXT DEFAULT 'unknown' | 'excellent', 'good', 'fair', 'poor' |
| `ai_preferred_model` | TEXT | 'claude', 'gemini', 'gpt4o' |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `story_language_rules`

Language-specific story generation rules per age group. **Extends the existing rule tables** (age_rules, difficulty_rules, etc.) with a more flexible, per-language structure.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `language_code` | TEXT FK → story_languages(code) | |
| `age_group` | TEXT NOT NULL | '6-7', '8-10' |
| `rule_category` | TEXT NOT NULL | See categories below |
| `rule_key` | TEXT NOT NULL | |
| `rule_value` | TEXT NOT NULL | |
| `examples` | JSONB DEFAULT '[]' | Example sentences/words |
| `created_at` | TIMESTAMPTZ | |
| **UNIQUE** | `(language_code, age_group, rule_category, rule_key)` | |

**Rule categories:**
- `sentence_structure` — max sentence length, compound sentence rules
- `vocabulary` — complexity level, forbidden words, preferred words
- `grammar` — tenses, cases, gender, conjugation complexity
- `readability` — target readability score, syllable limits
- `cultural` — local names, places, food, holidays
- `educational` — which language concepts to teach (articles, plurals, etc.)
- `formatting` — punctuation, dialogue formatting, special characters

#### `story_language_content`

Fun facts, cultural content, word games per language.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `language_code` | TEXT FK → story_languages(code) | |
| `content_type` | TEXT NOT NULL | 'fun_fact', 'cultural_reference', 'common_phrase', 'word_game' |
| `content_key` | TEXT | Optional grouping key |
| `content_value` | TEXT NOT NULL | The content |
| `age_group` | TEXT | NULL = all ages |
| `created_at` | TIMESTAMPTZ | |

### Impact on Existing Tables

When the language extension is implemented, these existing tables/fields need updates:

| Table / Field | Change Required |
|---------------|----------------|
| `kid_profiles.story_languages[]` | Values should reference `story_languages.code` |
| `kid_profiles.school_system` | Map to `app_languages.code` |
| `age_rules.language` | Migrate existing rows, new languages add rows here OR use `story_language_rules` |
| `difficulty_rules.language` | Same as above |
| `theme_rules.language` | Same as above |
| `emotion_rules.language` | Same as above |
| `learning_themes.labels` | Add new language keys to JSONB |
| `learning_themes.descriptions` | Add new language keys to JSONB |
| `content_themes_by_level.labels` | Add new language keys to JSONB |
| `lib/translations.ts` | Either extend with new languages or migrate to DB-driven `app_translations` |
| `lib/levelTranslations.ts` | Add translations for new languages |
| `lib/schoolSystems.ts` | Add school systems for new countries |
| `speech-to-text` Edge Function | Check Gladia support for new languages |
| `text-to-speech` Edge Function | Check ElevenLabs voice availability |

### Migration Strategy

**Phase 1 — Registry only** (no breaking changes):
1. Create `app_languages` and `story_languages` tables
2. Seed with existing 7 app languages (DE, FR, EN, ES, NL, IT, BS) and existing story languages
3. Admin UI to add/toggle languages

**Phase 2 — Rule generation**:
1. Create `story_language_rules` and `story_language_content` tables
2. AI-generate rules for new languages (via admin tool)
3. Manual review/verification workflow

**Phase 3 — Full integration**:
1. Create `app_translations` table
2. Migrate `lib/translations.ts` content to DB
3. Update `promptBuilder.ts` to read from new rule tables
4. Update language pickers to read from `story_languages` / `app_languages`

---

## i18n Architecture (Current)

### Supported Languages (as of 2026-02-12)

| Code | Language | App UI | Story Generation | STT (Gladia) | TTS (ElevenLabs) |
|------|----------|--------|-----------------|---------------|------------------|
| `de` | German | ✅ | ✅ | ✅ | ✅ |
| `fr` | French | ✅ | ✅ | ✅ | ✅ |
| `en` | English | ✅ | ✅ | ✅ | ✅ |
| `es` | Spanish | ✅ | ✅ | ✅ | ✅ |
| `nl` | Dutch | ✅ | ✅ | ✅ | ✅ |
| `it` | Italian | ✅ | ✅ | ✅ | ✅ |
| `bs` | Bosnian | ✅ | ✅ | ❓ | ❓ |

### Translation Sources

| Source | Location | Languages | Entries |
|--------|----------|-----------|---------|
| Main translations | `src/lib/translations.ts` | 7 (DE, FR, EN, ES, NL, IT, BS) | ~2000+ keys |
| Level translations | `src/lib/levelTranslations.ts` | 7 | Level names |
| School systems | `src/lib/schoolSystems.ts` | 7 | Country-specific class names |
| Story creation wizard | `src/components/story-creation/types.ts` | 6 (no BS) | Wizard labels |
| Voice record button | `VoiceRecordButton.tsx` | 6 (no BS) | Recording UI labels |
| Series completion | `ReadingPage.tsx` | 7 | Inline series messages |
| Learning themes | `learning_themes` table (JSONB) | 7 | 15 theme labels + descriptions |
| Content themes | `content_themes_by_level` table (JSONB) | 7 | ~19 theme labels |

### Story Generation Rules by Language

| Rule Table | Languages with data |
|-----------|-------------------|
| `age_rules` | DE, FR, EN |
| `difficulty_rules` | DE, FR, EN |
| `theme_rules` | DE, FR, EN |
| `emotion_rules` | DE, FR, EN |

⚠️ **Gap**: ES, NL, IT, BS have app UI translations but NO story generation rules in the rule tables. Stories in these languages rely on the LLM's general knowledge rather than fine-tuned rules.

---

### `story_subtypes`
Story-Subtypen für Themenvariation. Pro Hauptkategorie ~10-12 Subtypen, altersabhängig.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `theme_key` | TEXT | Hauptkategorie: magic_fantasy, adventure_action, real_life, surprise |
| `subtype_key` | TEXT | Eindeutiger Key z.B. 'detective_case' |
| `labels` | JSONB | Übersetzte Namen (7 Sprachen) |
| `descriptions` | JSONB | Kurzbeschreibung |
| `age_groups` | TEXT[] | ['6-7', '8-9', '10-11'] |
| `weight` | INTEGER | Gewichtung für Randomizer |
| `is_active` | BOOLEAN | |
| `prompt_hint_en` | TEXT | Englischer Prompt-Hinweis |
| `setting_ideas` | JSONB | Setting-Vorschläge |
| `title_seeds` | JSONB | Titel-Impulse |

**~42 Einträge** (4 Kategorien × ~10-12 Subtypen)

### `story_subtype_history`
Tracking welche Subtypen ein Kind zuletzt bekommen hat (Round-Robin).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `kid_profile_id` | UUID FK → kid_profiles | |
| `theme_key` | TEXT | |
| `subtype_key` | TEXT | |
| `story_id` | UUID FK → stories | |
| `created_at` | TIMESTAMPTZ | |

---

*This document is the single source of truth for Fablino's data model. Update it whenever schema changes are made.*
