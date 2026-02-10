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
9. [Reusable UI Components](#reusable-ui-components)
10. [Technical Debt & Code Smells](#technical-debt--code-smells)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3, TypeScript 5.8, Vite 5.4 |
| UI | shadcn/ui (50+ Radix UI components), Tailwind CSS 3.4, Framer Motion 12 |
| State | React Context, TanStack React Query 5 |
| Backend | Supabase (Edge Functions, PostgreSQL, Storage, Realtime) |
| AI / LLM | Google Gemini (2.0 Flash, 2.5 Flash, 3 Flash Preview), Lovable AI Gateway |
| Speech | ElevenLabs (TTS + STT) |
| Routing | React Router v6 |
| PWA | Installable via vite-plugin-pwa + InstallPage |
| Testing | Vitest, Testing Library |

---

## Project Structure

```
kinder-wort-trainer/
├── public/                            # Static assets
│   ├── mascot/                        # 10 Fablino mascot states (happy, encouraging, waiting…)
│   ├── themes/                        # 6 story theme images (magic, action, animals, friends, chaos, surprise)
│   └── people/                        # 4 character category images (me, family, friends, surprise)
├── src/
│   ├── assets/
│   │   ├── characters/                # 19 character images (boy, girl, family…)
│   │   ├── people/                    # 4 character images (Vite imports)
│   │   ├── settings/                  # 9 setting images (castle, space, jungle…)
│   │   ├── story-types/               # 18 story type images (adventure, fantasy…)
│   │   ├── themes/                    # 6 theme images (Vite imports)
│   │   └── timeline/                  # 10 timeline images (dinosaurs, medieval…)
│   ├── components/
│   │   ├── ui/                        # 50+ shadcn/ui components
│   │   ├── gamification/              # PointsDisplay, LevelBadge, LevelUpModal, StreakFlame, CollectibleModal
│   │   ├── story-creation/            # 12 files – multi-step story creation wizard
│   │   ├── story-sharing/             # 5 files – QR code sharing, import/export
│   │   ├── BadgeCelebrationModal.tsx  # Fullscreen modal celebrating new badges (confetti, animations)
│   │   ├── ComprehensionQuiz.tsx      # Story comprehension quiz
│   │   ├── FablinoMascot.tsx          # Reusable mascot image (sm=64px/md=100px/lg=130px, bounce animation)
│   │   ├── FablinoPageHeader.tsx      # Mascot + SpeechBubble header for story creation pages
│   │   ├── FablinoReaction.tsx        # Animated mascot reactions (celebrate, encourage, levelUp…)
│   │   ├── SpeechBubble.tsx           # Reusable speech bubble (hero/tip variants)
│   │   ├── HorizontalImageCarousel.tsx # Horizontal scrolling image carousel
│   │   ├── ImageCarousel.tsx          # Vertical scrolling image carousel
│   │   ├── ImageSkeleton.tsx          # Skeleton loader for images with status indicators
│   │   ├── KidProfileSection.tsx      # Kid profile editor (multilingual fields, character management)
│   │   ├── LevelConfigSection.tsx     # Admin: level settings config
│   │   ├── NavLink.tsx                # react-router NavLink wrapper
│   │   ├── PageHeader.tsx             # Standard page header (title, back button)
│   │   ├── ParentSettingsPanel.tsx     # Learning themes & content guardrails (Block 2.1)
│   │   ├── PointsConfigSection.tsx    # Admin: configurable star values (point_settings table, 8 entries)
│   │   ├── ProtectedRoute.tsx         # Route guard
│   │   ├── QuizCompletionResult.tsx   # Result display after quiz
│   │   ├── ReadingSettings.tsx        # Font size, line spacing, syllable mode
│   │   ├── SeriesGrid.tsx             # Series display grid
│   │   ├── StoryAudioPlayer.tsx       # Audio player for TTS narration
│   │   ├── StoryFeedbackDialog.tsx    # Story feedback dialog (rating, weakest part)
│   │   ├── StoryGenerator.tsx         # Admin: story generation with custom prompts
│   │   ├── SyllableText.tsx           # German syllable highlighting
│   │   ├── SystemPromptSection.tsx    # Admin: system prompt editing
│   │   ├── UserManagementSection.tsx  # Admin: user/role management
│   │   ├── VoiceInputField.tsx        # Voice input via Web Speech API
│   │   └── MigrationBanner.tsx        # Migration notification banner
│   ├── config/
│   │   └── features.ts                # Feature flags (NEW_FABLINO_HOME: true)
│   ├── constants/
│   │   └── design-tokens.ts           # FABLINO_COLORS, FABLINO_SIZES, FABLINO_STYLES
│   ├── hooks/
│   │   ├── useAuth.tsx                # Auth context (login/logout, session)
│   │   ├── useKidProfile.tsx          # Kid profile management (multi-profile, language derivation)
│   │   ├── useGamification.tsx        # Star rewards, level computation, streak logic
│   │   ├── useResultsPage.tsx         # Results page data (calls get_results_page RPC)
│   │   ├── useCollection.tsx          # Collectible items
│   │   ├── useColorPalette.tsx        # Color themes per kid (ocean, sunset, forest, lavender, sunshine)
│   │   ├── useEdgeFunctionHeaders.tsx # Headers for edge function requests
│   │   ├── useStoryRealtime.tsx       # Supabase realtime subscriptions
│   │   ├── use-mobile.tsx             # Mobile detection (768px breakpoint)
│   │   └── use-toast.ts              # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Supabase client init
│   │       └── types.ts               # Generated DB types (1600+ lines)
│   ├── lib/
│   │   ├── translations.ts            # i18n (7 languages: DE, FR, EN, ES, NL, IT, BS) – 2000+ lines
│   │   ├── levelTranslations.ts       # Level name translations (7 languages)
│   │   ├── schoolSystems.ts           # School systems (FR, DE, ES, NL, EN, IT, BS) with class names
│   │   └── utils.ts                   # cn() utility (clsx + tailwind-merge)
│   ├── pages/                         # 19 pages (see Routing below)
│   ├── test/
│   │   ├── example.test.ts
│   │   └── setup.ts
│   └── types/
│       └── speech-recognition.d.ts
├── supabase/
│   ├── functions/                     # 15 Edge Functions
│   │   ├── _shared/                   # Shared modules
│   │   │   ├── promptBuilder.ts       # Block 2.3c: Dynamic prompt builder
│   │   │   ├── imagePromptBuilder.ts  # Block 2.4: Image prompt construction
│   │   │   └── learningThemeRotation.ts # Block 2.3c: Learning theme rotation
│   │   ├── generate-story/            # Main story generation (~1409 lines)
│   │   └── …                          # 14 more Edge Functions
│   └── migrations/                    # 67 SQL migrations (incl. 7 Gamification Phase 1 migrations)
├── Architecture.md                    # This file
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Routing (src/App.tsx)

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Username/password login |
| `/register` | RegisterPage | Registration (disabled in UI) |
| `/reset-password` | ResetPasswordPage | Password reset request |
| `/update-password` | UpdatePasswordPage | Password update after reset link |
| `/install` | InstallPage | PWA installation prompt |
| `/s/:token` | ShareRedirectPage | Shared story link handler |

### Protected Routes (require authentication)

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomeFablino (or HomeClassic) | Home with Fablino mascot via FablinoPageHeader (mascotSize="md"), profile switcher, action buttons (design tokens), weekly tracker card. Feature flag controlled. |
| `/admin` | AdminPage | Admin dashboard (Profile, Erziehung, Stories, Settings, Account, System tabs) |
| `/stories` | StorySelectPage | Story browser (fiction/non-fiction/series) |
| `/read/:id` | ReadingPage | Story reading interface (word tap, audio, comprehension quiz, scene images) |
| `/quiz` | VocabularyQuizPage | Vocabulary quiz (multiple choice, awards stars) |
| `/words` | VocabularyManagePage | Manage saved vocabulary words |
| `/results` | ResultsPage | Progress dashboard (level card, badge roadmap, badge hints) |
| `/feedback-stats` | FeedbackStatsPage | Story quality statistics dashboard |
| `/create-story` | CreateStoryPage | Multi-step story creation wizard (4 screens) |
| `/collection` | CollectionPage | Collectibles earned from stories |
| `/sticker-buch` | StickerBookPage | Sticker book (story covers as collectibles) |
| `*` | NotFound | 404 page |

---

## Data Flow Overview

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                     │
│                                                           │
│  Pages → Hooks → Supabase Client → Edge Functions         │
│                      ↕                                    │
│              Supabase DB (direct queries + RPC)           │
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
│  30+ tables          │
│  3 enums             │
│  3 RPC functions     │
│  (Phase 1 rewritten) │
│  RLS policies        │
└──────────────────────┘
```

---

## Authentication Flow

Custom auth system (NOT Supabase Auth). Uses `user_profiles` table with username/password.

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

---

## Core Flows

### 1. Story Creation Flow

```
CreateStoryPage.tsx (Wizard – Entry + 3-4 screens)
  Screen 0: Entry Screen (Block 2.3e) – Two path cards:
           Weg A "Ich erzähle selbst" → jumps directly to Screen 3
           Weg B "Schritt für Schritt" → normal flow Screen 1 → 2 → 3
  Screen 1: Story Type Selection (adventure, fantasy, educational…)
           + "Überrasch mich" tile → storyType='surprise', skip to Screen 2
           + Length toggle (short/medium/long)
           + Difficulty toggle (easy/medium/hard)
           + Series toggle (yes/no)
           + Language picker (from kid_profiles.story_languages)
  Screen 2: Character Selection (4 tiles: Me, Family, Friends, Surprise)
           + "Überrasch mich" tile – exclusive, fictional-only
           + "Ich" tile with kid name + age
           + Expandable category tiles with saved kid_characters as checkboxes
  Screen 3: Special Effects (attributes) + Optional free text
           + Always shows length/difficulty/series/language settings
  Screen 4: Generation progress animation
        │
        ▼
supabase.functions.invoke('generate-story')
        │
        ▼
generate-story/index.ts:
  1. NEW PATH (Block 2.3c): Dynamic prompt building
     a. Load CORE Slim Prompt v2 from app_settings
     b. promptBuilder.ts queries rule tables (age_rules, difficulty_rules,
        theme_rules, emotion_rules, content_themes_by_level)
     c. Builds dynamic user message with word counts, guardrails, characters
     d. learningThemeRotation.ts checks parent_learning_config for themes
     e. Falls back to OLD PATH on any error
  1b. OLD PATH (Fallback):
     • Load modular prompts from app_settings
     • Build composite system prompt inline
  2. Call Lovable AI Gateway (Gemini 3 Flash Preview)
     → Generates: title, content, questions, vocabulary, structure ratings,
        emotional classifications, image_plan (Block 2.4)
  3. Word count validation (retry if below minimum)
  4. Image prompt building (parallel with step 5):
     a. Parse image_plan from LLM response
     b. Load image_style_rules + theme_rules from DB
     c. imagePromptBuilder.ts: buildImagePrompts() → cover + scene prompts
  5. PARALLEL execution (Promise.allSettled + 90s timeout):
     a. Consistency check v2 (up to 2 correction attempts)
     b. ALL image generation in parallel (cover + 1-3 scenes)
  6. Parse LLM response: extract classifications
  7. Save to DB (stories + comprehension_questions + marked_words + classifications)
  8. Return to frontend (coverImageBase64, storyImages[], image_count)
        │
        ▼
CreateStoryPage.tsx saves to DB → Navigate to /read/{storyId}
```

### 2. Reading Flow

```
ReadingPage.tsx loads story by ID
        │
        ├── Display cover image (top of page)
        ├── Display story text (with SyllableText for German)
        │     • Scene images distributed evenly between paragraphs
        │
        ├── Word tap → explain-word function
        │     • Gemini 2.0 Flash (Lovable Gateway fallback)
        │     • Child-friendly explanation (max 8 words)
        │     • Can save → inserts into marked_words
        │
        ├── Audio playback (StoryAudioPlayer via ElevenLabs TTS)
        │
        ├── Comprehension Quiz (after "finished reading")
        │     • Multiple choice from comprehension_questions
        │     • Awards stars via supabase.rpc('log_activity')
        │     • Sends 'story_read' + 'quiz_complete' (Phase 2 fix applied)
        │     • Triggers badge check → BadgeCelebrationModal
        │
        └── Series continuation (if ending_type === 'C')
```

### 3. Vocabulary Quiz Flow

```
VocabularyQuizPage.tsx
  1. Load words from marked_words (not learned, has explanation)
  2. For each word: call generate-quiz (Gemini 2.0 Flash → 3 wrong options)
  3. Quiz execution: 4 options, immediate feedback
  4. Completion:
     • Pass threshold: 80% (now configurable via point_settings.quiz_pass_threshold)
     • Awards stars via supabase.rpc('log_activity')
     • Sends 'quiz_complete' (Phase 2 fix applied)
     • Triggers badge check → BadgeCelebrationModal
     • Words answered correctly 3x → marked as learned
```

### 4. Gamification Flow (Star System) – Phase 1 Backend + Phase 2 Frontend Fixes Complete

```
supabase.rpc('log_activity') is called from:
  • ReadingPage (story_read, quiz_complete) ✅
  • VocabularyQuizPage (quiz_complete) ✅

log_activity(p_child_id, p_activity_type, p_stars, p_metadata):
  1. Load star values from point_settings (DB-configurable, not hardcoded)
     • story_read → stars_story_read (default 1)
     • quiz_complete → stars based on score_percent from metadata:
       - 100% → stars_quiz_perfect (default 2)
       - ≥80% → stars_quiz_passed (default 1)
       - <80% → stars_quiz_failed (default 0)
  2. Load/create user_progress
  3. Weekly reset check (Monday = new week → reset counters)
  4. Update counters:
     • story_read → total_stories_read++, weekly_stories_count++, languages_read[]
     • quiz_complete (100%) → consecutive_perfect_quizzes++, total_perfect_quizzes++
     • quiz_complete (<100%) → consecutive_perfect_quizzes = 0
  5. Streak logic (via last_read_date):
     • Same day → no change
     • Consecutive day → streak + 1
     • Gap > 1 day → streak resets to 1
  6. Weekly bonus (highest only, not cumulative):
     • 3 stories/week → weekly_bonus_3 (default 3 stars)
     • 5 stories/week → weekly_bonus_5 (default 5 stars, minus already-claimed)
     • 7 stories/week → weekly_bonus_7 (default 8 stars, minus already-claimed)
  7. Add stars (base + bonus) to total_stars
  8. Insert activity log into user_results
  9. Call check_and_award_badges(p_child_id)
  10. Return { total_stars, stars_earned, bonus_stars, weekly_bonus, 
              current_streak, weekly_stories_count, new_badges[] }

check_and_award_badges(p_child_id):
  Checks all 23 badges across 4 categories:
  • milestone (9): total_stars thresholds (5→300)
  • weekly (3): weekly_stories ≥ 3/5/7 (repeatable per week)
  • streak (4): streak_days ≥ 3/7/14/30
  • special (7): total_stories_read, consecutive_perfect_quiz, 
                 total_perfect_quiz, series_completed, languages_read
  Awards bonus_stars per badge. Returns [{id, name, emoji, category, 
    bonus_stars, fablino_message, frame_color}]

Star rewards (now DB-configurable via point_settings):
  story_read:      1 star (was 2 hardcoded)
  quiz_perfect:    2 stars (100%)
  quiz_passed:     1 star (≥80%)
  quiz_failed:     0 stars (<80%)
  weekly_bonus_3:  3 bonus stars
  weekly_bonus_5:  5 bonus stars
  weekly_bonus_7:  8 bonus stars

Levels (5 tiers, star-based thresholds + unlock features):
  1. Bücherfuchs        🦊  (0+ stars)   Bronze    — no unlock
  2. Geschichtenentdecker 🔍 (25+ stars)  Silver   — unlock: sharing
  3. Leseheld            🛡️ (75+ stars)   Gold     — unlock: series
  4. Wortmagier          ✨  (150+ stars)  Crystal  — unlock: special_themes
  5. Fablino-Meister     👑  (300+ stars)  Platinum — unlock: secret_story

ResultsPage.tsx (via get_results_page RPC):
  • Level card with animated star count + progress bar
  • Level roadmap (5 levels with staggered fadeIn animations)
  • Earned badges section (with "Neu" indicator, auto-cleared after 2s)
  • Badge hints (next unearned badges with progress)
  ⚠️ NOTE: useResultsPage interface still doesn't fully match new get_results_page RPC response → Phase 3

Phase 2 fixes applied (2026-02-10):
  ✅ useGamification.tsx: total_points → total_stars (insert for new users)
  ✅ ReadingPage: 'story_completed' → 'story_read'
  ✅ ReadingPage: quiz activity already fixed by Lovable → 'quiz_complete'
  ✅ VocabularyQuizPage: 'quiz_passed'/'quiz_failed' → 'quiz_complete'
  ✅ ResultsPage: allBadgeCount=11 → allBadgeCount=23
  ⚠️ Remaining: useResultsPage interface needs full update for new RPC fields → Phase 3
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

### Lovable AI Gateway

- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Acts as proxy/gateway for Gemini models
- Used as primary for story generation and as fallback for other functions

### ElevenLabs

| Service | Model | Details |
|---------|-------|---------|
| Text-to-Speech | `eleven_multilingual_v2` | Voice: Alice (`Xb7hH8MSUJpSbSDYk0k2`), speed: 0.88 |
| Speech-to-Text | `scribe_v2` | Supports: DE, FR, EN, ES, NL, IT |

### Supabase

- **Database**: PostgreSQL with RLS
- **Edge Functions**: 15 Deno functions
- **Storage**: `covers` bucket for story/profile images
- **Realtime**: Enabled for `stories` table (generation status updates)
- **RPC Functions**: `log_activity`, `check_and_award_badges`, `get_results_page` (all 3 rewritten in Gamification Phase 1)

---

## Database Schema

### Entity Relationship Overview

```
user_profiles (1) ──── (N) kid_profiles
      │                       │
      │                       ├── (N) stories
      │                       ├── (N) kid_characters            ← Block 2.3a
      │                       ├── (1) parent_learning_config   ← Block 2.1
      │                       ├── (1) user_progress            ← (total_stars, streak)
      │                       ├── (N) user_results             ← (activity log)
      │                       ├── (N) user_badges              ← (earned badges)
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

levels                      ← (5 rows: star-based level definitions + unlock_feature)
badges                      ← (23 rows: 4 categories – milestone/weekly/streak/special)
point_settings              ← (8 rows: configurable star values, setting_key/value)
point_settings_legacy       ← (old category/difficulty/points schema, kept for reference)

learning_themes              ← Block 2.1 (15 entries)
content_themes_by_level      ← Block 2.1 (~19 entries)

age_rules                    ← Block 2.2 (12 entries: 4 age groups × 3 langs)
theme_rules                  ← Block 2.2 (18 entries: 6 themes × 3 langs)
emotion_rules                ← Block 2.2 (18 entries: 6 emotions × 3 langs)
image_style_rules            ← Block 2.2 (6 entries: 3 age groups × 2 types)
difficulty_rules             ← Block 2.2b (9 entries: 3 levels × 3 langs)
```

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User accounts | username, password_hash, display_name, admin_language, app_language, text_language |
| `kid_profiles` | Child profiles (multi per user) | name, hobbies, school_system, school_class, color_palette, image_style, gender, age, ui_language, reading_language, explanation_language, home_languages[], story_languages[], content_safety_level (1-4), difficulty_level (1-3) |
| `user_roles` | Role assignments | user_id, role (admin/standard) |
| `stories` | Story content and metadata | title, content, cover_image_url, story_images[], difficulty, text_language, generation_status, series_id, episode_number, ending_type, structure ratings, learning_theme_applied, parent_prompt_text, humor_level (1-5), emotional_depth (1-3), moral_topic, concrete_theme, image_count |
| `kid_characters` | Recurring story figures per kid | kid_profile_id (FK CASCADE), name, role (family/friend/known_figure), age, relation, description, is_active, sort_order |
| `marked_words` | Vocabulary words with explanations | word, explanation, story_id, quiz_history[], is_learned, difficulty, word_language, explanation_language |
| `comprehension_questions` | Story comprehension questions | question, expected_answer, options[], story_id, question_language |

### Gamification Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `levels` | Level definitions (5 tiers) | id (SERIAL), name, emoji, stars_required (0/25/75/150/300), sort_order, color, **unlock_feature** (sharing/series/special_themes/secret_story), icon_url |
| `badges` | Badge/sticker definitions (23 entries) | id (UUID), name, emoji, description, **category** (milestone/weekly/streak/special), condition_type, condition_value, sort_order, **bonus_stars**, **fablino_message**, **frame_color**, **repeatable** (boolean) |
| `user_badges` | Earned badges per child | child_id (FK), badge_id (FK CASCADE), earned_at, is_new (boolean). **No UNIQUE constraint** – repeatable weekly badges can be earned multiple times. |
| `user_progress` | Aggregated stats per child | kid_profile_id (UNIQUE), **total_stars** (renamed from total_points), current_streak, longest_streak, last_read_date, **weekly_stories_count**, **weekly_reset_date**, **weekly_bonus_claimed**, **consecutive_perfect_quizzes**, **total_perfect_quizzes**, **total_stories_read**, **languages_read** (TEXT[]) |
| `user_results` | Activity log (star transactions) | kid_profile_id, user_id, activity_type, stars_earned, points_earned, metadata (JSONB) |
| `point_settings` | **Configurable star values (new schema)** | **setting_key** (TEXT PK), **value** (TEXT), **description** (TEXT). 8 entries: stars_story_read, stars_quiz_perfect, stars_quiz_passed, stars_quiz_failed, quiz_pass_threshold, weekly_bonus_3/5/7 |
| `point_settings_legacy` | Old point config (renamed) | category, difficulty, points (kept for reference) |
| `point_transactions` | Legacy: detailed point history | (pre-star-system, kept for backward compat) |
| `level_settings` | Legacy: level definitions by points | (pre-star-system, coexists with `levels`) |
| `streak_milestones` | Claimed streak bonuses | |
| `collected_items` | Items collected by kids | |
| `collectible_pool` | Available collectible items | creature/place/object/star |

### Learning & Guardrails Tables (Block 2.1)

| Table | Purpose |
|-------|---------|
| `learning_themes` | 15 educational themes in 4 categories (social, emotional, character, cognitive) – JSONB labels/descriptions in 7 langs |
| `content_themes_by_level` | Emotional content themes with safety levels (0=never, 1-4=allowed from level) |
| `parent_learning_config` | Per-kid learning preferences (active_themes text[] max 3, frequency 1-3) |

### Story Generation Rule Tables (Block 2.2)

| Table | Purpose | Entries |
|-------|---------|---------|
| `age_rules` | Language complexity rules by age group + language | 12 (4 age groups × FR/DE/EN) |
| `theme_rules` | Plot templates, settings, conflicts per theme + image style columns | 18 (6 themes × FR/DE/EN) |
| `emotion_rules` | Conflict patterns, character development per emotion | 18 (6 emotions × FR/DE/EN) |
| `image_style_rules` | Visual style instructions per age group | 6 (3 age groups × 2 types) |
| `difficulty_rules` | Vocabulary complexity per difficulty level | 9 (3 levels × FR/DE/EN) |

### System Tables

| Table | Purpose |
|-------|---------|
| `app_settings` | Key-value config (system prompts, custom settings) |
| `story_ratings` | Story quality feedback (1-5 rating, weakest part) |
| `consistency_check_results` | LLM consistency check logs |
| `image_cache` | Generated image cache (by prompt hash) |
| `shared_stories` | QR code share tokens (24h expiry) |

### RPC Functions (PostgreSQL)

| Function | Purpose | Called From |
|----------|---------|-------------|
| `log_activity(p_child_id, p_activity_type, p_stars, p_metadata)` | **Phase 1 rewrite**: Reads star values from `point_settings` (DB-configurable). Weekly reset check (Monday=new week). Updates counters (total_stories_read, weekly_stories_count, consecutive_perfect_quizzes, total_perfect_quizzes, languages_read). Streak logic via `last_read_date`. Weekly bonus (highest only, not cumulative). Calls `check_and_award_badges`. Returns `{total_stars, stars_earned, bonus_stars, weekly_bonus, current_streak, weekly_stories_count, new_badges}`. Activity types: `story_read`, `quiz_complete`. | ReadingPage, VocabularyQuizPage |
| `check_and_award_badges(p_child_id)` | **Phase 1 rewrite**: Handles all 23 badge types across 4 categories. For repeatable (weekly) badges: checks if earned this week. Awards `bonus_stars` per badge. Returns JSONB array: `[{id, name, emoji, category, bonus_stars, fablino_message, frame_color}]` | Called by log_activity |
| `get_results_page(p_child_id)` | **Phase 1 rewrite**: Returns child_name, total_stars, current_streak, longest_streak, weekly_stories_count, weekly_bonus_claimed, total_stories_read, total_perfect_quizzes, languages_read[], current_level, next_level (with unlock_feature), levels (5), badges (23 with earned/earned_at/times_earned) | ResultsPage (via useResultsPage hook) |

### Enums

| Enum | Values | Used By |
|------|--------|---------|
| `app_role` | `admin`, `standard` | user_roles.role |
| `ending_type` | `A` (complete), `B` (open), `C` (cliffhanger) | stories.ending_type |
| `collectible_category` | `creature`, `place`, `object`, `star` | collected_items, collectible_pool |

### Key Triggers

- `update_updated_at_column()` – Auto-updates `updated_at` on 13+ tables
- `update_word_learned_status()` – Marks word as learned after 3 consecutive correct answers

### Multilingual Fields (Block 1)

Per-profile language separation to support families where the child reads in one language but gets explanations in another.

```
kid_profiles.school_system  (set by user via "Schule / App-Sprache" dropdown)
        │
        ▼
useKidProfile.tsx → getKidLanguage(school_system)
        │
        ├── kidAppLanguage      → UI translations (lib/translations.ts)
        ├── kidReadingLanguage   → Story generation language
        └── kidExplanationLanguage → Word explanations
```

---

## Services & Hooks

### Hooks

| Hook | Purpose | Data Source |
|------|---------|------------|
| `useAuth` | Authentication context (login/logout, session) | sessionStorage |
| `useKidProfile` | Kid profile selection, language derivation | React Context + Supabase kid_profiles |
| `useGamification` | Star rewards from `point_settings` DB table, level computation, progress loading. **Phase 2 partial fix**: `total_points` → `total_stars` insert fixed. Lovable updated `loadProgress()` to read `total_stars`. Still uses local LEVELS + direct DB updates (not fully RPC-driven yet). | `point_settings` + Supabase `user_progress` |
| `useResultsPage` | Results page data (level, badges, hints). **⚠️ NEEDS UPDATE**: interface doesn't match new `get_results_page` RPC response (new fields: total_stories_read, total_perfect_quizzes, languages_read, full badges array with times_earned). | Supabase RPC `get_results_page` |
| `useCollection` | Collectible items | Supabase collected_items |
| `useColorPalette` | Color theme per kid profile | Derived from kid_profiles.color_palette |
| `useEdgeFunctionHeaders` | Headers for edge function requests | Auth session |
| `useStoryRealtime` | Live story generation status | Supabase Realtime subscription |
| `use-mobile` | Mobile device detection | Window resize listener (768px) |
| `use-toast` | Toast notifications | React state |

### Edge Functions

| Function | External API | DB Tables |
|----------|-------------|-----------|
| `generate-story` | Gemini 3 Flash (text), Gemini 2.5 Flash (images), Lovable Gateway | reads: app_settings, image_cache, age_rules, difficulty_rules, theme_rules, emotion_rules, image_style_rules, content_themes_by_level, parent_learning_config, learning_themes, stories; writes: stories, image_cache, consistency_check_results |
| `explain-word` | Gemini 2.0 Flash, Lovable Gateway (fallback) | reads: app_settings |
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
| `get-share` | — | reads: shared_stories, stories |
| `import-story` | — | reads: shared_stories, stories; writes: stories |

---

## Reusable UI Components

### Design System Components (created for UI harmonization)

| Component | File | Description |
|-----------|------|-------------|
| `FablinoMascot` | `src/components/FablinoMascot.tsx` | Reusable mascot image with consistent sizing via design tokens. Sizes: `sm` (64px), `md` (100px, default), `lg` (130px) max-height. Optional bounce animation (`gentleBounce` from global CSS). |
| `SpeechBubble` | `src/components/SpeechBubble.tsx` | Reusable speech bubble next to Fablino. Variants: `hero` (large white, left-pointing triangle) and `tip` (smaller orange-tinted, centered). min/max-width from design tokens (200/300px). Text color `#2D1810`. |
| `FablinoPageHeader` | `src/components/FablinoPageHeader.tsx` | Combines FablinoMascot + SpeechBubble in a flex row. Used on ALL screens with Fablino (Home, Entry, Theme, Characters, Effects). Always `mascotSize="md"` for pixel-perfect consistency across screens. |
| `design-tokens.ts` | `src/constants/design-tokens.ts` | Centralized design constants: `FABLINO_COLORS` (primary, text, speech bubble), `FABLINO_SIZES` (mascot sm/md/lg, speech bubble min/max-width, button height), `FABLINO_STYLES` (primary/secondary button Tailwind classes). |
| `BadgeCelebrationModal` | `src/components/BadgeCelebrationModal.tsx` | Fullscreen modal for new badges. CSS confetti/star animations, badge emoji, Fablino mascot, "Weiter" button. Supports multiple badges (cycles through). Scale-up entrance animation. |
| `FablinoReaction` | `src/components/FablinoReaction.tsx` | Animated mascot reactions: celebrate, encourage, welcome, levelUp, perfect. |

### Story Creation Wizard (src/components/story-creation/)

| Component | Description |
|-----------|-------------|
| `StoryTypeSelectionScreen` | Screen 1: Theme tiles (6 themes via Vite imports from `src/assets/themes/`). Grid: `grid-cols-2 md:grid-cols-3` (3×2 on tablet). FablinoPageHeader `mascotSize="md"`. Vertically centered, `max-w-md`. |
| `CharacterSelectionScreen` | Screen 2: 4 tiles (me, family, friends, surprise via Vite imports from `src/assets/people/`). Grid: `grid-cols-2 md:grid-cols-4` (4×1 on tablet). Expandable categories with kid_characters checkboxes. |
| `SpecialEffectsScreen` | Screen 3: Compact toggle rows (length, difficulty, language) with orange active state (`bg-[#E8863A]`). Attribute grid (`grid-cols-3 md:grid-cols-6`, aspect-square buttons). Free text textarea. Orange inline "Create story" button (no fixed bottom bar). |
| `StoryGenerationProgress` | Screen 4: Animated progress during generation |
| `CharacterTile` | Reusable tile: `rounded-xl`, `aspect-square` image, `ring-2 ring-[#E8863A]` selection state, label `text-sm font-semibold text-[#2D1810]` |
| `BonusAttributesModal` | Modal for special character attributes |
| `FamilyMemberModal` | Modal for adding family members |
| `NameInputModal` | Modal for custom character names |
| `SiblingInputModal` | Modal for adding siblings |
| `SelectionSummary` | Summary of selected characters |
| `SettingSelectionScreen` | Story setting selection (currently unused in main flow) |
| `types.ts` | TypeScript types + translation maps for wizard |

---

## Dynamic Prompt Engine (Block 2.3c)

### Shared Modules (supabase/functions/_shared/)

| Module | Purpose |
|--------|---------|
| `promptBuilder.ts` | Builds dynamic user message by querying rule tables (age_rules, difficulty_rules, theme_rules, emotion_rules). Handles surprise theme/characters, character relationships, learning themes, image plan instructions. |
| `imagePromptBuilder.ts` | Constructs image prompts from LLM image_plan + DB style rules. Age-specific modifiers (per year 5-12+). Cover + scene prompts. |
| `learningThemeRotation.ts` | Determines if a learning theme should be applied based on parent_learning_config frequency and round-robin rotation. |

### Prompt Architecture

```
NEW PATH (Block 2.3c):
  System Prompt = CORE Slim v2 (from app_settings, ~500 tokens)
  User Message  = Dynamic context built by promptBuilder.ts
                  (age rules + difficulty rules + theme rules + emotion rules
                   + word counts + characters + guardrails + variety hints
                   + optional learning theme + image plan instructions)

OLD PATH (Fallback – used if NEW PATH throws):
  System Prompt = Composite of 4 modular prompts from app_settings (~30k tokens)
  User Message  = Inline dynamic context
```

---

## Technical Debt & Code Smells

### Critical

| Issue | Location | Impact |
|-------|----------|--------|
| **No password hashing** | `verify-login/index.ts` | Passwords stored/compared as plain text |
| **No server-side session validation** | `useAuth.tsx` | Token (UUID) never verified after login |
| **No token expiration** | `useAuth.tsx`, `verify-login` | Sessions never expire |
| **CORS allows all origins** | All Edge Functions | `Access-Control-Allow-Origin: *` |
| **RLS policies too permissive** | Most tables | Many tables have `USING (true)` policies |
| **Hardcoded user check** | `ReadingPage.tsx` | `username === 'papa'` enables audio feature |

### Significant

| Issue | Location | Impact |
|-------|----------|--------|
| **Oversized components** | `ReadingPage.tsx` (1465+ lines), `VocabularyQuizPage.tsx` (882+ lines), `generate-story/index.ts` (1409 lines) | Hard to maintain, test, review |
| **Remaining inline translations** | `ReadingPage.tsx`, `VocabularyQuizPage.tsx`, `ResultsPage.tsx`, `HomeFablino.tsx` | Page-specific translation objects not yet in `lib/translations.ts` |
| **Many `any` types** | Various files | `supabase: any`, `data: any` reduce type safety |
| **No error boundaries** | React app | API failures can crash entire app |
| **No automated tests** | `src/test/` contains only example test | Zero test coverage |
| **Mixed toast systems** | Components | Both `sonner` and `shadcn/ui` toast used |
| **Legacy gamification tables** | `point_transactions`, `point_settings_legacy`, `level_settings` | Pre-star-system tables coexist with new schema. `point_settings` renamed to `_legacy`. |
| ~~**Frontend–Backend mismatch (Phase 1)**~~ | ~~`useGamification.tsx`, `ReadingPage.tsx`, `VocabularyQuizPage.tsx`, `ResultsPage.tsx`~~ | **MOSTLY RESOLVED (Phase 2)**: `total_stars` fix, activity types corrected, badge count updated to 23. Remaining: `useResultsPage.tsx` interface needs full update for new RPC response fields (Phase 3). |

### Minor

| Issue | Location | Impact |
|-------|----------|--------|
| ~~**Magic numbers**~~ | ~~Various~~ | **PARTIALLY RESOLVED**: Star rewards + quiz pass threshold now DB-configurable via `point_settings`. Some frontend magic numbers remain. |
| **Inconsistent async patterns** | Edge Functions | Mix of `async/await` and `.then()` chains |
| **Unused imports** | Various files | Minor cleanup needed |
| **No code splitting** | `vite.config.ts` | All pages loaded upfront |
| ~~**Duplicate gentleBounce keyframes**~~ | ~~`FablinoMascot.tsx`, `FablinoPageHeader.tsx`~~ | **RESOLVED**: `gentleBounce` and `speechBubbleIn` keyframes now in global `src/index.css` |
| ~~**UI harmonization incomplete**~~ | ~~Multiple pages~~ | **RESOLVED**: All screens (Home, Entry, Theme, Characters, Effects) now use `FablinoPageHeader` with `mascotSize="md"`. Design tokens centralized in `design-tokens.ts`. |

### Recommendations (Priority Order)

1. **Security**: Implement proper password hashing, server-side session validation, token expiration
2. **Security**: Tighten RLS policies, restrict CORS origins, add rate limiting
3. ~~**Gamification Phase 2**~~ **DONE**: `total_stars` insert fixed, activity types corrected (`story_read`, `quiz_complete`), badge count updated to 23. `useResultsPage` interface update deferred to Phase 3.
4. **Gamification Phase 3**: Badge-Celebrations + Badge-Vitrine UI (improved celebration modal, full badge grid on ResultsPage, update `useResultsPage` interface for new RPC response fields)
5. **Architecture**: Split large components into smaller, testable units
6. ~~**Architecture**: Complete UI harmonization~~ **DONE** – all wizard screens + Home use FablinoPageHeader with design tokens
7. **Architecture**: Extract remaining inline translations into `lib/translations.ts`
8. **Quality**: Add error boundaries and proper error handling
9. **Quality**: Replace console.log with structured logging
10. **Quality**: Add TypeScript strict mode, eliminate `any` types
11. **Testing**: Add unit tests for hooks and Edge Functions
12. **Performance**: Implement code splitting, React.memo, optimize re-renders
13. **Cleanup**: Remove legacy gamification tables (`point_settings_legacy`, `point_transactions`, `level_settings`) or add migration path

---

### Gamification Phase 1 Migrations (2026-02-10)

| File | Purpose |
|------|---------|
| `20260210_01_gamification_levels_update.sql` | Add `unlock_feature`/`icon_url` to levels, update 5 level definitions, delete 6th |
| `20260210_02_gamification_badges_overhaul.sql` | Add `bonus_stars`/`fablino_message`/`frame_color`/`repeatable`, new CHECK constraint (4 categories), drop UNIQUE on user_badges, delete old + insert 23 new badges |
| `20260210_03_gamification_point_settings_rebuild.sql` | Rename old to `_legacy`, create new `point_settings` (setting_key PK), RLS, seed 8 defaults |
| `20260210_04_gamification_user_progress_extend.sql` | Consolidate `total_points`→`total_stars`, add weekly/quiz/story/language counters |
| `20260210_05_rpc_log_activity.sql` | Full rewrite: DB-configurable stars, weekly resets, counters, streak via last_read_date, weekly bonus, badge check |
| `20260210_06_rpc_check_and_award_badges.sql` | Full rewrite: 4 categories, 8 condition types, repeatable weekly badges, bonus stars |
| `20260210_07_rpc_get_results_page.sql` | Full rewrite: comprehensive response with all counters, levels, 23 badges with earned/times_earned |

---

*Last updated: 2026-02-10. Covers: Block 1 (multilingual DB), Block 2.1 (learning themes + guardrails), Block 2.2/2.2b (rule tables + difficulty_rules), Block 2.3a (story classifications + kid_characters), Block 2.3c (dynamic prompt engine), Block 2.3d (story_languages, wizard character management), Block 2.3e (dual-path wizard, surprise theme/characters), Block 2.4 (intelligent image generation), Phase 5 (star-based gamification, badges, BadgeCelebrationModal, ResultsPage), UI harmonization complete (design-tokens.ts, FablinoMascot sm=64/md=100/lg=130, SpeechBubble, FablinoPageHeader on all screens, compact SpecialEffectsScreen, theme/character Vite imports), **Gamification Phase 1 backend complete** (7 migrations), **Gamification Phase 2 frontend fixes complete** (total_stars insert, activity types story_read/quiz_complete, allBadgeCount=23).*
