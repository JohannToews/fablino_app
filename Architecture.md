# Architecture – Kinder-Wort-Trainer (Petit Lecteur)

> AI-powered reading app for children with story generation, vocabulary learning, comprehension quizzes, and gamification.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Data Flow Overview](#data-flow-overview)
4. [Authentication Flow](#authentication-flow)
5. [Core Flows](#core-flows)
6. [External APIs & Integrations](#external-apis--integrations)
7. [Database Schema](#database-schema)
8. [Services & Hooks](#services--hooks)
9. [Technical Debt & Code Smells](#technical-debt--code-smells)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 7 |
| UI | shadcn/ui, Tailwind CSS, Radix UI |
| State | React Context, TanStack React Query |
| Backend | Supabase (Edge Functions, Database, Storage, Realtime) |
| AI / LLM | Google Gemini (2.0 Flash, 2.5 Flash, 3 Flash Preview), Lovable AI Gateway |
| Speech | ElevenLabs (TTS + STT) |
| Routing | React Router v6 |
| PWA | Installable via InstallPage |

---

## Project Structure

```
kinder-wort-trainer/
├── public/                        # Static assets (icons, PWA assets)
├── src/
│   ├── assets/                    # Images
│   │   ├── characters/            # 19 character images (boy, girl, family…)
│   │   ├── settings/              # 9 setting images (castle, space, jungle…)
│   │   ├── story-types/           # 18 story type images (adventure, fantasy…)
│   │   └── timeline/              # 10 timeline images (dinosaurs, medieval…)
│   ├── components/
│   │   ├── ui/                    # 50+ shadcn/ui components
│   │   ├── gamification/          # Points, levels, streaks, collectibles
│   │   ├── story-creation/        # Multi-step story creation wizard
│   │   ├── story-sharing/         # QR code sharing, import/export
│   │   ├── ComprehensionQuiz.tsx  # Story comprehension quiz
│   │   ├── SeriesGrid.tsx         # Series display grid (uses central translations)
│   │   ├── KidProfileSection.tsx  # Kid profile editor (saves multilingual fields)
│   │   ├── ParentSettingsPanel.tsx # Learning themes & content guardrails (Block 2.1)
│   │   ├── ProtectedRoute.tsx     # Route guard
│   │   ├── ReadingSettings.tsx    # Font size, line spacing, syllable mode
│   │   ├── StoryAudioPlayer.tsx   # Audio player for TTS narration
│   │   ├── StoryGenerator.tsx     # Admin story generation component
│   │   ├── SyllableText.tsx       # German syllable highlighting
│   │   ├── VoiceInputField.tsx    # Voice input via speech recognition
│   │   └── …                      # ~20 more components
│   ├── hooks/
│   │   ├── useAuth.tsx            # Auth context (login/logout, session)
│   │   ├── useKidProfile.tsx      # Kid profile management (multi-profile)
│   │   ├── useGamification.tsx    # Points, levels, streaks
│   │   ├── useCollection.tsx      # Collectible items
│   │   ├── useColorPalette.tsx    # Color themes per kid
│   │   ├── useStoryRealtime.tsx   # Supabase realtime subscriptions
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   └── use-toast.ts           # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client init
│   │       └── types.ts           # Generated DB types
│   ├── lib/
│   │   ├── translations.ts        # i18n (7 languages: DE, FR, EN, ES, NL, IT, BS) – central translation hub
│   │   ├── levelTranslations.ts   # Level name translations
│   │   ├── schoolSystems.ts       # School systems (FR, DE, ES, NL, EN, IT, BS)
│   │   └── utils.ts               # cn() utility
│   ├── pages/
│   │   ├── Index.tsx              # Home page (navigation cards)
│   │   ├── LoginPage.tsx          # Login
│   │   ├── StorySelectPage.tsx    # Story browser (fiction/non-fiction/series)
│   │   ├── CreateStoryPage.tsx    # Story creation wizard
│   │   ├── ReadingPage.tsx        # Reading interface (word tap, audio, quiz)
│   │   ├── VocabularyQuizPage.tsx # Vocabulary quiz
│   │   ├── VocabularyManagePage.tsx # Manage saved words
│   │   ├── ResultsPage.tsx        # Progress dashboard
│   │   ├── CollectionPage.tsx     # Collectibles
│   │   ├── AdminPage.tsx          # Admin dashboard (tabs: Profile, Erziehung, Stories, Settings, Account, System)
│   │   ├── FeedbackStatsPage.tsx  # Story quality stats
│   │   ├── InstallPage.tsx        # PWA install prompt
│   │   ├── ShareRedirectPage.tsx  # Handle shared story links
│   │   └── NotFound.tsx           # 404
│   └── types/
│       └── speech-recognition.d.ts
├── supabase/
│   ├── functions/                 # 15 Edge Functions (see below)
│   └── migrations/                # 35 SQL migrations (incl. multilingual fields, Block 2.1 learning/guardrails, Block 2.2 rule tables)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Data Flow Overview

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                     │
│                                                           │
│  Pages → Hooks → Supabase Client → Edge Functions         │
│                      ↕                                    │
│              Supabase DB (direct queries)                 │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Supabase Edge       │    │  External APIs                │
│  Functions           │    │                               │
│                      │───▶│  • Google Gemini (LLM + Img)  │
│  • generate-story    │    │  • Lovable AI Gateway         │
│  • explain-word      │    │  • ElevenLabs (TTS + STT)     │
│  • generate-quiz     │    │                               │
│  • evaluate-answer   │    └──────────────────────────────┘
│  • text-to-speech    │
│  • speech-to-text    │
│  • verify-login      │
│  • manage-users      │
│  • …                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Supabase Database   │
│  (PostgreSQL)        │
│                      │
│  27 tables           │
│  3 enums             │
│  RLS policies        │
└──────────────────────┘
```

---

## Authentication Flow

### Overview

Custom auth system (NOT Supabase Auth). Uses `user_profiles` table with username/password.

### Flow

```
User enters username + password
        │
        ▼
LoginPage.tsx → supabase.functions.invoke('verify-login')
        │
        ▼
verify-login/index.ts
  • Looks up user_profiles by username
  • Compares password_hash with provided password
  • Fetches role from user_roles
  • Returns: { token (UUID), user data }
        │
        ▼
useAuth.tsx stores in sessionStorage:
  • liremagie_session = token
  • liremagie_user = JSON(user data)
        │
        ▼
ProtectedRoute checks isAuthenticated
  • If no session → redirect to /login
  • If session exists → render children
```

### Key Details

- **Session storage**: `sessionStorage` (cleared on tab close)
- **No server-side session validation** – token is never verified after login
- **Roles**: `admin` / `standard` (stored in `user_roles`, fetched at login)
- **Admin check**: UI-based only, not enforced server-side on most routes
- **Registration**: Disabled in UI, users created by admin via `manage-users` function

### ⚠️ Security Concerns

- Passwords compared as plain text (`password_hash !== password`) – **no actual hashing**
- Session tokens are UUIDs with no server-side validation or expiration
- CORS allows all origins (`*`)
- No rate limiting on login attempts

---

## Core Flows

### 1. Story Creation Flow

```
CreateStoryPage.tsx (Wizard)
  Screen 1: Story Type Selection (adventure, fantasy, educational…)
  Screen 2: Character Selection (boy, girl, family…)
  Screen 3: Special Effects (humor, attributes…)
        │
        ▼
supabase.functions.invoke('generate-story')
        │
        ▼
generate-story/index.ts:
  1. Load modular prompts from app_settings:
     • CORE prompt (system_prompt_{lang})
     • ELTERN-MODUL or KINDER-MODUL (based on source)
     • SERIEN-MODUL (if series continuation)
  2. Build composite system prompt
  3. Call Lovable AI Gateway (Gemini 3 Flash Preview)
     → Generates: title, content, questions, vocabulary, structure ratings
  4. Word count validation (retry if below minimum)
  5. Consistency check (parallel)
  6. Image generation (parallel):
     • Cover image (Google Gemini 2.5 Flash, cached via image_cache)
     • Story images (1-3 based on story length)
     • Fallback: Lovable Gateway image models
  7. Return everything to frontend
        │
        ▼
CreateStoryPage.tsx saves to DB:
  • stories table (content, images, metadata, text_language)
  • comprehension_questions table (question_language from kidReadingLanguage)
  • marked_words table (word_language, explanation_language from kid profile)
  • Navigate to /read/{storyId}
```

### 2. Reading Flow

```
ReadingPage.tsx loads story by ID
        │
        ├── Display story text (with SyllableText for German)
        │
        ├── Word tap → explain-word function
        │     • Checks cache (cachedExplanations Map)
        │     • Calls Gemini 2.0 Flash (Lovable Gateway fallback)
        │     • Uses kidExplanationLanguage for response language
        │     • Returns child-friendly explanation (max 8 words)
        │     • User can save → inserts into marked_words (with word_language, explanation_language)
        │
        ├── Audio playback (StoryAudioPlayer)
        │     • Calls text-to-speech function
        │     • ElevenLabs API (Alice voice, multilingual v2)
        │     • Returns MP3 audio stream
        │
        ├── Comprehension Quiz (after "finished reading")
        │     • Multiple choice from comprehension_questions
        │     • Awards points via useGamification
        │     • Saves to user_results
        │
        └── Series continuation (if ending_type === 'C')
              • Generates next episode
              • Links via series_id
```

### 3. Vocabulary Quiz Flow

```
VocabularyQuizPage.tsx
  1. Load words from marked_words (not learned, has explanation)
  2. For each word: call generate-quiz function
     • Gemini 2.0 Flash generates 3 wrong options
     • Converts conjugated verbs to infinitive form
  3. Quiz execution:
     • 4 options per question (1 correct + 3 wrong)
     • Immediate feedback on selection
     • Updates quiz_history in marked_words
  4. Completion:
     • Pass threshold: 80% (hardcoded)
     • Awards points, saves to user_results
     • Words answered correctly 3x → marked as learned
```

### 4. Gamification Flow

```
useGamification.tsx manages:
  • Points: Earned from reading, quizzes, streaks
  • Levels: Configured in level_settings (7 levels)
  • Streaks: Daily reading streaks with milestones (3, 7, 14, 30 days)
  • Streak freeze: 1 per week available

Data stored in:
  • user_progress (aggregated stats)
  • point_transactions (detailed history)
  • streak_milestones (claimed bonuses)
  • collected_items (collectibles earned from stories)
  • collectible_pool (available items by rarity)
```

---

## External APIs & Integrations

### Google Gemini API

| Model | Used For | Functions |
|-------|----------|-----------|
| `gemini-2.0-flash` | Text analysis, word explanation, quiz generation, answer evaluation | analyze-text, explain-word, generate-quiz, evaluate-answer, generate-comprehension-questions |
| `gemini-2.5-flash` | Image generation (stories, covers) | generate-story |
| `gemini-3-flash-preview` | Story text generation (via Lovable Gateway) | generate-story, explain-word (fallback) |
| `gemini-2.5-flash-image` | Profile covers, story images (via Lovable Gateway) | generate-profile-cover, generate-story (fallback) |
| `gemini-3-pro-image-preview` | Image generation (via Lovable Gateway, 2nd fallback) | generate-story |

**Environment variable**: `GEMINI_API_KEY`

### Lovable AI Gateway

- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Environment variable**: `LOVABLE_API_KEY`
- Acts as proxy/gateway for Gemini models
- Used as primary for story generation and as fallback for other functions

### ElevenLabs

| Service | Model | Details |
|---------|-------|---------|
| Text-to-Speech | `eleven_multilingual_v2` | Voice: Alice (`Xb7hH8MSUJpSbSDYk0k2`), speed: 0.88 |
| Speech-to-Text | `scribe_v2` | Supports: DE, FR, EN, ES, NL, IT |

**Environment variable**: `ELEVENLABS_API_KEY`

### Supabase

- **Database**: PostgreSQL with RLS
- **Edge Functions**: 15 Deno functions
- **Storage**: `covers` bucket for story/profile images
- **Realtime**: Enabled for `stories` table (generation status updates)
- **Environment variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Database Schema

### Entity Relationship Overview

```
user_profiles (1) ──── (N) kid_profiles
      │                       │
      │                       ├── (N) stories
      │                       ├── (1) parent_learning_config   ← Block 2.1
      │                       ├── (N) user_progress (1:1 per kid)
      │                       ├── (N) point_transactions
      │                       ├── (N) collected_items
      │                       ├── (N) streak_milestones
      │                       └── (N) user_results
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

learning_themes              ← Block 2.1 (standalone reference table, 15 entries)
content_themes_by_level      ← Block 2.1 (standalone reference table, ~19 entries)

age_rules                    ← Block 2.2 (standalone rule table, 12 entries: 4 age groups × 3 langs)
theme_rules                  ← Block 2.2 (standalone rule table, 18 entries: 6 themes × 3 langs)
emotion_rules                ← Block 2.2 (standalone rule table, 18 entries: 6 emotions × 3 langs)
image_style_rules            ← Block 2.2 (standalone rule table, 6 entries: 3 age groups × 2 types)
```

### Tables

#### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User accounts | username, password_hash, display_name, admin_language, app_language, text_language |
| `kid_profiles` | Child profiles (multi per user) | name, hobbies, school_system, school_class, color_palette, image_style, gender, age, **ui_language**, **reading_language**, **explanation_language**, **home_languages[]**, **content_safety_level** (1-4, default 2) |
| `user_roles` | Role assignments | user_id, role (admin/standard) |
| `stories` | Story content and metadata | title, content, cover_image_url, story_images[], difficulty, text_type, **text_language** (NOT NULL, default 'fr'), generation_status, series_id, episode_number, ending_type, structure ratings, **learning_theme_applied**, **parent_prompt_text** |
| `marked_words` | Vocabulary words with explanations | word, explanation, story_id, quiz_history[], is_learned, difficulty, **word_language**, **explanation_language** |
| `comprehension_questions` | Story comprehension questions | question, expected_answer, options[], story_id, **question_language** |

#### Gamification Tables

| Table | Purpose |
|-------|---------|
| `user_progress` | Aggregated stats (points, level, streak, stories read) |
| `point_transactions` | Detailed point history per action |
| `point_settings` | Configurable point values per category/difficulty |
| `level_settings` | Level definitions (number, title, min_points, icon) |
| `streak_milestones` | Claimed streak bonuses |
| `collected_items` | Items collected by kids |
| `collectible_pool` | Available collectible items (creature/place/object/star) |
| `user_results` | Activity results (quiz scores, reading completions) |

#### Learning & Guardrails Tables (Block 2.1 – Migration `20260207`)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `learning_themes` | Reference table: 15 educational themes in 4 categories (social, emotional, character, cognitive) | theme_key (UNIQUE), category, labels (JSONB, 7 langs), descriptions (JSONB, 7 langs), sort_order |
| `content_themes_by_level` | Reference table: emotional content themes with safety levels (0=never, 1-4=allowed from level) | theme_key (UNIQUE), labels (JSONB), min_safety_level, min_age, example_texts (JSONB) |
| `parent_learning_config` | Per-kid learning preferences (1:1 with kid_profiles) | kid_profile_id (UNIQUE FK), active_themes text[] (max 3), frequency (1-3) |

#### System Tables

| Table | Purpose |
|-------|---------|
| `app_settings` | Key-value config (system prompts, custom settings) |
| `story_ratings` | Story quality feedback (1-5 rating, weakest part) |
| `consistency_check_results` | LLM consistency check logs |
| `image_cache` | Generated image cache (by prompt hash) |
| `shared_stories` | QR code share tokens (24h expiry) |

### Enums

| Enum | Values | Used By |
|------|--------|---------|
| `app_role` | `admin`, `standard` | user_roles.role |
| `ending_type` | `A` (complete), `B` (open), `C` (cliffhanger) | stories.ending_type |
| `collectible_category` | `creature`, `place`, `object`, `star` | collected_items, collectible_pool |

### Key Triggers

- `update_updated_at_column()` – Auto-updates `updated_at` on 11 tables
- `update_word_learned_status()` – Marks word as learned after 3 consecutive correct answers

### Multilingual Fields (Block 1 – Migration `20260206150000`)

Added per-profile language separation to support families where the child reads in one language but gets explanations in another.

| Table | New Column | Type | Default | Purpose |
|-------|-----------|------|---------|---------|
| `kid_profiles` | `ui_language` | text NOT NULL | `'fr'` | App interface language |
| `kid_profiles` | `reading_language` | text NOT NULL | `'fr'` | Story generation language |
| `kid_profiles` | `explanation_language` | text NOT NULL | `'de'` | Word explanation language |
| `kid_profiles` | `home_languages` | text[] NOT NULL | `'{"de"}'` | Languages spoken at home |
| `marked_words` | `word_language` | text NOT NULL | `'fr'` | Language of the word |
| `marked_words` | `explanation_language` | text NOT NULL | `'de'` | Language of the explanation |
| `comprehension_questions` | `question_language` | text NOT NULL | `'fr'` | Language of the question |
| `stories` | `text_language` | (altered) NOT NULL | `'fr'` | Was nullable, now NOT NULL |

**Language derivation chain:**

```
kid_profiles.school_system  (set by user via "Schule / App-Sprache" dropdown)
        │
        ▼
useKidProfile.tsx → getKidLanguage(school_system)
        │
        ├── kidAppLanguage      → UI translations (lib/translations.ts)
        ├── kidReadingLanguage   → Story generation language
        └── kidExplanationLanguage → Word explanations (from explanation_language field)
```

**Note:** `school_system` is the primary source for `kidAppLanguage` and `kidReadingLanguage`. The `ui_language`/`reading_language` DB fields are kept in sync when saving but `school_system` takes priority at runtime for robustness (the migration may not have been deployed yet on all environments).

### Learning Themes & Content Guardrails (Block 2.1 – Migration `20260207`)

Added parental controls for story content: learning themes and emotional content safety levels.

| Table / Column | Type | Purpose |
|-------|------|---------|
| `learning_themes` (new table) | 15 rows, 4 categories | Reference data for educational themes (sharing, empathy, honesty, etc.) with JSONB labels/descriptions in 7 languages |
| `content_themes_by_level` (new table) | ~19 rows | Emotional content themes (friend_conflict, divorce, death, etc.) mapped to safety levels. Level 0 = globally excluded (violence, sexual content, etc.) |
| `parent_learning_config` (new table) | 1:1 per kid_profile | Stores parent's selected learning themes (max 3) and frequency (1=occasional, 2=regular, 3=frequent) |
| `kid_profiles.content_safety_level` | integer NOT NULL DEFAULT 2 | Safety level 1-4 controlling which emotional themes are allowed. Default set by age at migration time. |
| `stories.learning_theme_applied` | text, nullable | Records which learning theme was woven into the story (for future use by story generator) |
| `stories.parent_prompt_text` | text, nullable | Stores parent's custom story prompt (for future use) |

**UI:** `ParentSettingsPanel.tsx` component, accessible as "Erziehung" tab in AdminPage. Two sections:
1. **Learning Themes** – Toggle up to 3 themes across 4 categories, frequency slider
2. **Content Guardrails** – Select safety level (1-4), see allowed/not-allowed emotional themes, global exclusions

**RLS:** `learning_themes` and `content_themes_by_level` are read-only for all users. `parent_learning_config` is CRUD-scoped to the user who owns the kid profile.

### Story Generation Rule Tables (Block 2.2 – Migration `20260207_block2_2`)

Added structured rule tables to replace monolithic 30k-token system prompts with focused, queryable data. These tables will feed the `promptBuilder` in Block 2.3.

| Table | Purpose | Key Columns | Entries |
|-------|---------|-------------|---------|
| `age_rules` | Language complexity rules by age group and language | min_age, max_age, language (UNIQUE), max_sentence_length, allowed_tenses[], sentence_structures, vocabulary_level (1-5), complexity_level (1-5), min/max_word_count, paragraph_length, dialogue_ratio, narrative_perspective, narrative_guidelines, example_sentences[] | 12 (4 age groups × FR/DE/EN) |
| `theme_rules` | Plot templates, settings, and conflicts per story theme | theme_key + language (UNIQUE), labels (JSONB), plot_templates[], setting_descriptions, character_archetypes[], sensory_details, typical_conflicts[] | 18 (6 themes × FR/DE/EN) |
| `emotion_rules` | Conflict patterns and character development per emotional coloring | emotion_key + language (UNIQUE), labels (JSONB), conflict_patterns[], character_development, resolution_patterns[], emotional_vocabulary[] | 18 (6 emotions × FR/DE/EN) |
| `image_style_rules` | Visual style instructions per age group and optional theme | age_group, theme_key (nullable), style_prompt, negative_prompt, color_palette, art_style | 6 (3 age groups general + 3 educational) |

**Age groups in `age_rules`:** 4-5, 6-7, 8-9, 10-12 – each with language-specific tense rules (e.g. FR: présent/passé composé/imparfait, DE: Präsens/Perfekt/Präteritum, EN: simple present/simple past/past continuous).

**Themes in `theme_rules`:** fantasy, action, animals, everyday, humor, educational – matching the 6 story types in the creation wizard.

**Emotions in `emotion_rules`:** joy (EM-J), thrill (EM-T), humor_emotion (EM-H), warmth (EM-W), curiosity (EM-C), depth (EM-D) – matching the emotional coloring codes in `generate-story`.

**RLS:** All 4 tables are SELECT-only for all users (read-only reference data). `updated_at` auto-trigger on all tables.

**Note:** These tables are NOT yet consumed by `generate-story`. Integration happens in Block 2.3 (promptBuilder).

---

## Services & Hooks

### Hooks

| Hook | Purpose | State Stored |
|------|---------|-------------|
| `useAuth` | Authentication context | sessionStorage (token + user) |
| `useKidProfile` | Kid profile selection, language derivation (app, reading, explanation) | React Context – derives `kidAppLanguage`, `kidReadingLanguage`, `kidExplanationLanguage` from `school_system` |
| `useGamification` | Points, levels, streaks | Supabase DB (user_progress, point_transactions) |
| `useCollection` | Collectible items | Supabase DB (collected_items) |
| `useColorPalette` | Color theme per kid profile | Derived from kid_profiles.color_palette |
| `useStoryRealtime` | Live story generation status | Supabase Realtime subscription |
| `use-mobile` | Mobile device detection | Window resize listener |
| `use-toast` | Toast notifications | React state |

### Edge Functions

| Function | External API | DB Tables |
|----------|-------------|-----------|
| `generate-story` | Gemini 3 Flash (text), Gemini 2.5 Flash (images), Lovable Gateway | reads: app_settings, image_cache; writes: image_cache, consistency_check_results |
| `explain-word` | Gemini 2.0 Flash, Lovable Gateway (fallback) | reads: app_settings. Accepts optional `explanationLanguage` param for multilingual explanations |
| `generate-quiz` | Gemini 2.0 Flash | — |
| `evaluate-answer` | Gemini 2.0 Flash | — |
| `generate-comprehension-questions` | Gemini 2.0 Flash | — |
| `analyze-text` | Gemini 2.0 Flash | — |
| `generate-profile-cover` | Lovable Gateway (Gemini 2.5 Flash Image) | — |
| `text-to-speech` | ElevenLabs TTS | — |
| `speech-to-text` | ElevenLabs STT | — |
| `verify-login` | — | reads: user_profiles |
| `register-user` | — | reads/writes: user_profiles |
| `manage-users` | — | reads/writes: user_profiles, user_roles, app_settings, kid_profiles, stories, marked_words, comprehension_questions, user_results |
| `create-share` | — | reads: stories; writes: shared_stories |
| `get-share` | — | reads: shared_stories, stories; writes: shared_stories |
| `import-story` | — | reads: shared_stories, stories; writes: stories |

---

## Technical Debt & Code Smells

### 🔴 Critical

| Issue | Location | Impact |
|-------|----------|--------|
| **No password hashing** | `verify-login/index.ts` | Passwords stored/compared as plain text. Should use bcrypt/argon2. |
| **No server-side session validation** | `useAuth.tsx` | Token (UUID) is never verified after login. Anyone with a valid UUID in sessionStorage is "authenticated". |
| **No token expiration** | `useAuth.tsx`, `verify-login` | Sessions never expire (only cleared on tab close via sessionStorage). |
| **CORS allows all origins** | All Edge Functions | `Access-Control-Allow-Origin: *` on every function. |
| **RLS policies too permissive** | Most tables | Many tables have `USING (true)` policies – anyone with the Supabase anon key can read/write. |
| **Hardcoded user check** | `ReadingPage.tsx:1077` | `username === 'papa'` enables audio feature. Should be a config flag. |

### 🟡 Significant

| Issue | Location | Impact |
|-------|----------|--------|
| **Oversized components** | `ReadingPage.tsx` (1465 lines), `VocabularyQuizPage.tsx` (882 lines), `generate-story/index.ts` (1335 lines) | Hard to maintain, test, and review. Should be split. |
| **100+ console.log/error statements** | Throughout codebase | Debug logs in production. Should use proper logging. |
| **Remaining inline translations** | `ReadingPage.tsx`, `VocabularyQuizPage.tsx`, `ResultsPage.tsx`, `Index.tsx`, and others | Page-specific translation objects (homeTranslations, readingLabels, etc.) still inline. Shared labels (status, difficulty, tabs, series, toasts, vocab) have been consolidated into `lib/translations.ts`. |
| **Many `any` types** | Various files | `supabase: any`, `data: any` etc. Reduces type safety. |
| **No error boundaries** | React app | API failures can crash the entire app. |
| **No automated tests** | `src/test/` contains only example test | Zero test coverage for business logic. |
| **Mixed toast systems** | Components | Both `sonner` and `shadcn/ui` toast used inconsistently. |

### 🟢 Minor

| Issue | Location | Impact |
|-------|----------|--------|
| **Magic numbers** | Various | Pass threshold 80%, quiz points 2, word count limits – should be configurable. |
| **Inconsistent async patterns** | Edge Functions | Mix of `async/await` and `.then()` chains. |
| **Unused imports** | Various files | Minor cleanup needed. |
| **No code splitting** | `vite.config.ts` | All pages loaded upfront. Large pages should be lazy-loaded. |
| **Image uploads duplicated** | `ReadingPage.tsx`, `CreateStoryPage.tsx` | Same Supabase storage upload logic repeated. |

### Recommendations (Priority Order)

1. **Security**: Implement proper password hashing (bcrypt), server-side session validation, and token expiration
2. **Security**: Tighten RLS policies to scope data per user/kid profile
3. **Security**: Restrict CORS origins, add rate limiting
4. **Architecture**: Split large components (ReadingPage, VocabularyQuizPage) into smaller, testable units
5. **Architecture**: Extract remaining inline translations (page-specific objects) into `lib/translations.ts`; extract image upload logic into shared utility
6. **Quality**: Add error boundaries and proper error handling throughout
7. **Quality**: Remove console.log statements, add structured logging
8. **Quality**: Add TypeScript strict mode, eliminate `any` types
9. **Testing**: Add unit tests for hooks and Edge Functions, integration tests for core flows
10. **Performance**: Implement code splitting, React.memo, and optimize re-renders

---

*Generated on 2026-02-06 by codebase analysis. Updated 2026-02-07 with Block 1 (multilingual DB model), translation consolidation, Block 2.1 (learning themes + content guardrails), and Block 2.2 (story generation rule tables).*