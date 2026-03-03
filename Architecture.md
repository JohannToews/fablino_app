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
10. [Dynamic Prompt Engine](#dynamic-prompt-engine-block-23c)
11. [Series Feature (Modus A)](#series-feature-modus-a--linear-5-episode-series)
12. [Voice Input Feature](#voice-input-feature)
13. [Immersive Reader](#immersive-reader)
14. [Image Style System](#image-style-system)
15. [Visual Director (Image Planning)](#visual-director-image-planning)
16. [Syllable Coloring](#syllable-coloring)
17. [Feature Flags & Premium UI](#feature-flags--premium-ui)
18. [Technical Debt & Code Smells](#technical-debt--code-smells)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3, TypeScript 5.8, Vite 5.4, hypher (syllables DE), hyphen (syllables FR) |
| UI | shadcn/ui (50+ Radix UI components), Tailwind CSS 3.4, Framer Motion 12 |
| State | React Context, TanStack React Query 5 (stories cache: 5min stale / 10min GC) |
| Backend | Supabase (Edge Functions, PostgreSQL, Storage, Realtime) |
| AI / LLM | Google Gemini (2.0 Flash, 2.5 Flash, 3 Flash Preview), Lovable AI Gateway |
| Speech | ElevenLabs (TTS), Gladia V2 (STT) |
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
│   │   ├── immersive-reader/           # 15+ files – book-style reader (pixel-based splitting, spreads, syllables)
│   │   ├── story-creation/            # 16 files – multi-step story creation wizard (incl. ImageStylePicker, VoiceRecordButton)
│   │   ├── story-sharing/             # 5 files – QR code sharing, import/export
│   │   ├── ConsistencyCheckStats.tsx  # Admin: consistency check result stats (delete, refresh, selection)
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
│   │   ├── ParentSettingsPanel.tsx     # Learning themes & content guardrails (Block 2.1); Premium UI toggle
│   │   ├── PremiumUiBodyClass.tsx      # Sets body.premium-ui when premium_ui flag enabled (for CSS)
│   │   ├── PremiumRouteTransition.tsx # Framer Motion route transitions when premium_ui enabled
│   │   ├── PointsConfigSection.tsx    # Admin: configurable star values (point_settings table, 8 entries)
│   │   ├── ProtectedRoute.tsx         # Route guard
│   │   ├── QuizCompletionResult.tsx   # Result display after quiz
│   │   ├── ReadingSettings.tsx        # Font size, line spacing, syllable mode
│   │   ├── SeriesGrid.tsx             # Series display grid (episode badges, progress bar, next-episode placeholder)
│   │   ├── StoryAudioPlayer.tsx       # Audio player for TTS narration
│   │   ├── StoryFeedbackDialog.tsx    # Story feedback dialog (rating, weakest part)
│   │   ├── StoryGenerator.tsx         # Admin: story generation with custom prompts
│   │   ├── ImageStylesSection.tsx     # Admin: image style CRUD (list, edit dialog, preview upload)
│   │   ├── SyllableText.tsx           # Syllable highlighting (DE via hypher, FR via hyphen async cache)
│   │   ├── SystemPromptSection.tsx    # Admin: system prompt editing
│   │   ├── UserManagementSection.tsx  # Admin: user/role management
│   │   ├── VoiceInputField.tsx        # Voice input via Web Speech API
│   │   └── MigrationBanner.tsx        # Migration notification banner
│   ├── config/
│   │   └── features.ts                # Static feature flags (NEW_FABLINO_HOME, SERIES_ENABLED, isSeriesEnabled())
│   ├── constants/
│   │   └── design-tokens.ts           # FABLINO_COLORS, FABLINO_SIZES, FABLINO_STYLES, FABLINO_SHADOWS, FABLINO_MOTION
│   ├── hooks/
│   │   ├── useAuth.tsx                # Auth context (login/logout, session)
│   │   ├── useKidProfile.tsx          # Kid profile management (multi-profile, language derivation)
│   │   ├── useGamification.tsx        # Star rewards, level computation, streak logic
│   │   ├── useResultsPage.tsx         # Results page data (calls get_results_page RPC)
│   │   ├── useCollection.tsx          # Collectible items
│   │   ├── useColorPalette.tsx        # Color themes per kid (ocean, sunset, forest, lavender, sunshine)
│   │   ├── usePremiumUi.ts            # Premium UI feature flag (read/set via manage-users; refetch on nav/focus)
│   │   ├── useEdgeFunctionHeaders.tsx # Headers for edge function requests
│   │   ├── useStoryRealtime.tsx       # Supabase realtime subscriptions
│   │   ├── useVoiceRecorder.ts        # MediaRecorder + Gladia STT (states: idle/recording/processing/result/error)
│   │   ├── use-mobile.tsx             # Mobile detection (768px breakpoint)
│   │   └── use-toast.ts              # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Supabase client init
│   │       └── types.ts               # Generated DB types (1600+ lines)
│   ├── lib/
│   │   ├── syllabify.ts               # Hybrid syllable splitting (hypher sync for DE, hyphen async for FR)
│   │   ├── translations.ts            # i18n (7 languages: DE, FR, EN, ES, NL, IT, BS) – 2000+ lines
│   │   ├── levelTranslations.ts       # Level name translations (7 languages)
│   │   ├── schoolSystems.ts           # School systems (FR, DE, ES, NL, EN, IT, BS) with class names
│   │   ├── edgeFunctionHelper.ts      # invokeEdgeFunction() with legacy auth (x-legacy-token/x-legacy-user-id)
│   │   ├── imageUtils.ts              # getThumbnailUrl() for Supabase Storage thumbnails (width, quality)
│   │   └── utils.ts                   # cn() utility (clsx + tailwind-merge)
│   ├── pages/                         # 19 pages (see Routing below)
│   ├── test/
│   │   ├── example.test.ts
│   │   └── setup.ts
│   └── types/
│       └── speech-recognition.d.ts
├── supabase/
│   ├── functions/                     # 17 Edge Functions
│   │   ├── _shared/                   # Shared modules
│   │   │   ├── promptBuilder.ts       # Block 2.3c: Dynamic prompt builder + Series context (EPISODE_CONFIG, buildSeriesContextBlock)
│   │   │   ├── imagePromptBuilder.ts  # Block 2.4: Image prompt construction + Series visual pipeline; VD adapter (mapVisualDirectorToImagePlan)
│   │   │   ├── visualDirector.ts      # Visual Director: optional second LLM call for image planning (character_sheet, scenes, cover, camera)
│   │   │   ├── learningThemeRotation.ts # Block 2.3c: Learning theme rotation
│   │   │   ├── auth.ts                # Supabase + legacy auth (x-legacy-token/x-legacy-user-id)
│   │   │   └── cors.ts               # CORS logic (Lovable + allowed origins)
│   │   ├── generate-story/            # Main story generation (~1600+ lines, incl. series consistency check)
│   │   ├── migrate-covers/            # Migrates cover images to story-images bucket
│   │   ├── migrate-user-auth/         # Auth migration (called from MigrationBanner)
│   │   └── …                          # 14 more Edge Functions
│   └── migrations/                    # 80+ SQL migrations (incl. Gamification Phase 1, Series Phase 1, Image Styles, Immersive Reader, premium_ui feature flag in app_settings)
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
| `/admin/feature-flags` | FeatureFlagsPage | Per-user feature toggles (Emotion-Flow, Comic-Strip, Premium UI) – admin only |
| `/admin/config` | AdminConfigPage | Image model config, cost estimates – admin only |
| `/stories` | StorySelectPage | Story browser (fiction/non-fiction/series) – React Query cached, RPC `get_my_stories_list` |
| `/read/:id` | ReadingPage | Story reading (Classic default, Immersive admin-only). Word tap, audio, quiz, scene images. `?mode=immersive` admin param. |
| `/quiz` | VocabularyQuizPage | Vocabulary quiz (multiple choice, awards stars) |
| `/words` | VocabularyManagePage | Manage saved vocabulary words |
| `/results` | ResultsPage | Progress dashboard (level card, badge roadmap, badge hints) |
| `/feedback-stats` | FeedbackStatsPage | Story quality statistics dashboard |
| `/create-story` | CreateStoryPage | Multi-step story creation wizard (5 screens incl. image style picker) |
| `/collection` | CollectionPage | Collectibles earned from stories |
| `/sticker-buch` | StickerBookPage | Sticker book (story covers as collectibles) |
| `*` | NotFound | 404 page |

Protected routes are wrapped in a layout route with `PremiumRouteTransition`: when the Premium UI feature flag is enabled for the user, Framer Motion (fade + y) runs on route change.

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

Dual auth: **legacy** (username/password, token in sessionStorage) and **Supabase Auth** (user_profiles.auth_id, Bearer token). Edge Functions accept both via `getAuthenticatedUser` (_shared/auth.ts). Uses `user_profiles` and `user_roles`.

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
  Screen 3: Special Effects (attributes) + Optional free text + Voice input (VoiceRecordButton)
           + Always shows length/difficulty/series/language settings
           + Series toggle (admin only via isSeriesEnabled())
           + When isSeries: button text "Episode 1 erstellen" + series hint
  Screen 4: Image Style Picker (ImageStylePicker.tsx)
           + Loads active styles from image_styles DB table
           + Filters by kid's age group (6-7, 8-9, 10-11)
           + Pre-selects: kid profile preference > age default > first style
           + "★ Empfohlen" badge on age-default style
           + Emoji fallback when no preview image uploaded
           + Saves selected style_key to kid_profiles.image_style after generation
  Screen 5: Generation progress animation
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
        emotional classifications; image_plan only when useVisualDirector is false (Block 2.4)
  3. Word count validation (retry if below minimum)
  4. Image pipeline (branch by useVisualDirector):
     LEGACY: Parse image_plan from LLM response; if missing and !useVisualDirector → fallback LLM call for image_plan; buildImagePrompts(plan) → cover + scene prompts.
     VISUAL DIRECTOR: When useVisualDirector=true, Call 1 omits image_plan. After story is saved, inside image block: run Visual Director (callVisualDirector) + consistency check in parallel → mapVisualDirectorToImagePlan() → buildImagePrompts(plan) V2 path (character_sheet, camera, background_figures, cover.camera) → generate images.
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
        ├── View Mode: defaults to 'classic' for ALL users (including admin)
        │     • Admin can switch to 'immersive' via toggle or ?mode=immersive URL param
        │     • Non-admin: Classic Reader only, no toggle visible
        │
        ├── CLASSIC READER (default):
        │     ├── Display cover image (top of page)
        │     ├── Display story text (with SyllableText for DE/FR)
        │     │     • Scene images distributed evenly between paragraphs
        │     ├── Word tap → explain-word function
        │     │     • Gemini 2.0 Flash (Lovable Gateway fallback)
        │     │     • Child-friendly explanation (max 8 words)
        │     │     • Can save → inserts into marked_words
        │     ├── Audio playback (StoryAudioPlayer via ElevenLabs TTS)
        │     └── Reading Settings (font size, line spacing, syllable toggle for DE/FR)
        │
        ├── IMMERSIVE READER (admin-only):
        │     ├── Book-style page layout (portrait or landscape spreads)
        │     ├── Cover page: cover image left, title + multiple paragraphs right
        │     ├── Pixel-based content splitting (not word-count based)
        │     ├── Scene images assigned to spreads (cover image deduplicated)
        │     ├── Swipe/arrow navigation between spreads
        │     ├── Progress bar with page counter
        │     ├── Toolbar: syllable toggle (DE/FR only), fullscreen button
        │     ├── Background: warm cream #FFF9F0 on all pages
        │     └── See [Immersive Reader](#immersive-reader) section for details
        │
        ├── Comprehension Quiz (after "finished reading")
        │     • Multiple choice from comprehension_questions
        │     • Awards stars via supabase.rpc('log_activity')
        │     • Sends 'story_read' + 'quiz_complete' (Phase 2 fix applied)
        │     • Triggers badge check → BadgeCelebrationModal
        │
        └── Series continuation (if ending_type === 'C' and episode < 5)
              • "Fablino schreibt das nächste Kapitel..." loading text (7 languages)
              • Episode 5: "Serie abgeschlossen! 🦊🎉" + back to library
              • Passes series_id + episode_number + continuity_state + image_style_key
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

### Gladia

| Service | API Version | Details |
|---------|-------------|---------|
| Speech-to-Text | V2 (EU) | Upload → transcribe → poll. Custom vocabulary for kids' words. Max 5MB, 30s. Languages: DE, FR, EN, ES, NL, IT |

### Supabase

- **Database**: PostgreSQL with RLS
- **Edge Functions**: 17 Deno functions
- **Storage**: `covers` bucket for story/profile images, `story-images` bucket (public) for migrated images, `style-previews` bucket for image style preview images, `style-previews` bucket (public) for image style preview images
- **Realtime**: Enabled for `stories` table (generation status updates)
- **RPC Functions**: `log_activity`, `check_and_award_badges`, `get_results_page` (all 3 rewritten in Gamification Phase 1), `get_my_stories_list` (performance: server-side filtered story list), `get_my_results` (user results)

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

image_styles                 ← 10 styles (DB-driven, replaces hardcoded styles)
```

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User accounts | username, password_hash, display_name, admin_language, app_language, text_language |
| `kid_profiles` | Child profiles (multi per user) | name, hobbies, school_system, school_class, color_palette, **image_style** (TEXT, preferred style_key from image_styles), gender, age, ui_language, reading_language, explanation_language, home_languages[], story_languages[], content_safety_level (1-4), difficulty_level (1-3) |
| `user_roles` | Role assignments | user_id, role (admin/standard) |
| `stories` | Story content and metadata | title, content, cover_image_url, story_images[], difficulty, text_language, generation_status, series_id, episode_number, ending_type, structure ratings, learning_theme_applied, parent_prompt_text, humor_level (1-5), emotional_depth (1-3), moral_topic, concrete_theme, image_count, **is_favorite** (boolean, default false), **episode_summary** (TEXT), **continuity_state** (JSONB), **visual_style_sheet** (JSONB), **image_style_key** (TEXT, FK to image_styles) |
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

### Image Styles Table

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `image_styles` | DB-driven image style definitions (10 styles) | `style_key` (TEXT PK), `labels` (JSONB: de/fr/en/es/nl/it/bs), `description` (JSONB: multilingual), `imagen_prompt_snippet` (TEXT, style prompt for image generation), `age_groups` (TEXT[]: 4-5, 6-7, 8-9, 10-11, 12+), `default_for_ages` (TEXT[]: which ages get this style as default), `age_modifiers` (JSONB: per-age prompt adjustments), `sort_order` (INT), `is_active` (BOOL), `preview_image_url` (TEXT, uploaded to Supabase Storage) |

Current styles: `watercolor_storybook`, `paper_cut`, `cartoon_vibrant`, `whimsical_digital`, `realistic_illustration`, `minimalist_modern`, `3d_adventure`, `pixel_art`, `brick_block`, `vintage_retro`

### Story Generation Rule Tables (Block 2.2)

| Table | Purpose | Entries |
|-------|---------|---------|
| `age_rules` | Language complexity rules by age group + language | 12 (4 age groups × FR/DE/EN) |
| `theme_rules` | Plot templates, settings, conflicts per theme + image style columns | 18 (6 themes × FR/DE/EN) |
| `emotion_rules` | Conflict patterns, character development per emotion | 18 (6 emotions × FR/DE/EN) |
| `image_style_rules` | Visual style instructions per age group (legacy, coexists with `image_styles`) | 6 (3 age groups × 2 types) |
| `difficulty_rules` | Vocabulary complexity per difficulty level | 9 (3 levels × FR/DE/EN) |

### System Tables

| Table | Purpose |
|-------|---------|
| `app_settings` | Key-value config: system prompts, custom settings; **per-user feature flags** (keys: `emotion_flow_enabled_users`, `comic_strip_enabled_users`, `premium_ui_enabled_users` — values: JSON array of user_profiles.id or `["*"]` for all) |
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
| `get_my_stories_list(p_profile_id, p_limit, p_offset)` | **Performance**: Server-side filtered story list by kid profile (includes null kid_profile_id). Returns id, title, cover_image_url, difficulty, text_type, kid_profile_id, series_id, episode_number, ending_type. Avoids transferring story content. | StorySelectPage (via React Query) |
| `get_my_results()` | Returns user activity results (reference_id, kid_profile_id) for story completion status | StorySelectPage (via React Query) |

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
| `useAuth` | Authentication context (login/logout, session). Supports **Supabase Auth** (user_profiles.auth_id) and **legacy** (sessionStorage). Fetches role from user_roles. | sessionStorage / Supabase Auth |
| `useKidProfile` | Kid profile selection, language derivation | React Context + Supabase kid_profiles |
| `useGamification` | Star rewards from `point_settings` DB table, level computation, progress loading. **Phase 2 partial fix**: `total_points` → `total_stars` insert fixed. Lovable updated `loadProgress()` to read `total_stars`. Still uses local LEVELS + direct DB updates (not fully RPC-driven yet). | `point_settings` + Supabase `user_progress` |
| `useResultsPage` | Results page data (level, badges, hints). **⚠️ NEEDS UPDATE**: interface doesn't match new `get_results_page` RPC response (new fields: total_stories_read, total_perfect_quizzes, languages_read, full badges array with times_earned). | Supabase RPC `get_results_page` |
| `useCollection` | Collectible items | Supabase collected_items |
| `useColorPalette` | Color theme per kid profile | Derived from kid_profiles.color_palette |
| `usePremiumUi` | Premium UI feature flag for current user. Reads via `manage-users` action `getPremiumUi`; sets via `setPremiumUi`. Refetches on route change and window focus so toggles (e.g. on Feature Flags page) apply without full reload. | Edge Function `manage-users` (app_settings.premium_ui_enabled_users) |
| `useEdgeFunctionHeaders` | Headers for edge function requests | Auth session |
| `useStoryRealtime` | Live story generation status | Supabase Realtime subscription |
| `useVoiceRecorder` | Audio recording + Gladia STT transcription. States: idle/recording/processing/result/error. MediaRecorder with 30s max. Exposes AnalyserNode for waveform visualization. Retry logic (2 attempts). | MediaRecorder API + `speech-to-text` Edge Function |
| `use-mobile` | Mobile device detection | Window resize listener (768px) |
| `use-toast` | Toast notifications | React state |

### Immersive Reader Hooks (src/components/immersive-reader/)

| Hook | Purpose | Data Source |
|------|---------|------------|
| `useContentSplitter` | Pixel-based content splitting into `ImmersivePage[]`. Uses hidden DOM element for text height measurement. Respects available height per page type (portrait/landscape, with/without image). Sentence-level splitting for oversized paragraphs. `skipParagraphCount` for cover page paragraphs. | Story content + DOM measurement |
| `useImmersiveLayout` | Detects device layout mode: phone (<640px), small-tablet (<1024px), landscape-spread (short side ≥600px). Listens to window resize + orientation change. | Window dimensions |
| `usePagePosition` | Manages current spread index and navigation callbacks (next/prev/goTo). Clamps to valid spread range. | Spread count |
| `useSyllableColoring` | Manages syllable coloring state for Immersive Reader. Supported languages: DE, FR only. Persists toggle preference. | localStorage |

### Edge Functions

| Function | External API | DB Tables |
|----------|-------------|-----------|
| `generate-story` | Gemini 3 Flash (text), Gemini 2.5 Flash (images), Lovable Gateway | reads: app_settings, image_cache, age_rules, difficulty_rules, theme_rules, emotion_rules, image_style_rules, **image_styles**, content_themes_by_level, parent_learning_config, learning_themes, stories, kid_profiles; writes: stories (incl. **image_style_key**), image_cache, consistency_check_results. **Series**: loads series context, builds EPISODE_CONFIG-based prompts, series consistency check, Visual Style Sheet image pipeline. |
| `explain-word` | Gemini 2.0 Flash, Lovable Gateway (fallback) | reads: app_settings |
| `generate-quiz` | Gemini 2.0 Flash | — |
| `evaluate-answer` | Gemini 2.0 Flash | — |
| `generate-comprehension-questions` | Gemini 2.0 Flash | — |
| `analyze-text` | Gemini 2.0 Flash | — |
| `generate-profile-cover` | Lovable Gateway (Gemini 2.5 Flash Image) | — |
| `text-to-speech` | ElevenLabs TTS | — |
| `speech-to-text` | Gladia V2 (EU) | — |
| `verify-login` | — | reads: user_profiles |
| `register-user` | — | reads/writes: user_profiles |
| `manage-users` | Auth (Supabase + legacy), list/create/delete users, update languages, update system prompts in app_settings. **Premium UI**: actions `getPremiumUi` (returns `{ enabled }` for current user) and `setPremiumUi` (add/remove current user id in app_settings.premium_ui_enabled_users). | reads/writes: user_profiles, user_roles, app_settings, kid_profiles, stories, marked_words, comprehension_questions, user_results |
| `create-share` | — | reads: stories; writes: shared_stories |
| `get-share` | — | reads: shared_stories, stories |
| `import-story` | — | reads: shared_stories, stories; writes: stories |
| `migrate-covers` | — | reads: stories (cover URLs); writes: story-images bucket |
| `migrate-user-auth` | — | reads/writes: user_profiles (auth migration) |

---

## Reusable UI Components

### Design System Components (created for UI harmonization)

| Component | File | Description |
|-----------|------|-------------|
| `FablinoMascot` | `src/components/FablinoMascot.tsx` | Reusable mascot image with consistent sizing via design tokens. Sizes: `sm` (64px), `md` (100px, default), `lg` (130px) max-height. Optional bounce animation (`gentleBounce` from global CSS). |
| `SpeechBubble` | `src/components/SpeechBubble.tsx` | Reusable speech bubble next to Fablino. Variants: `hero` (large white, left-pointing triangle) and `tip` (smaller orange-tinted, centered). min/max-width from design tokens (200/300px). Text color `#2D1810`. |
| `FablinoPageHeader` | `src/components/FablinoPageHeader.tsx` | Combines FablinoMascot + SpeechBubble in a flex row. Used on ALL screens with Fablino (Home, Entry, Theme, Characters, Effects). Always `mascotSize="md"` for pixel-perfect consistency across screens. |
| `design-tokens.ts` | `src/constants/design-tokens.ts` | Centralized design constants: `FABLINO_COLORS`, `FABLINO_SIZES`, `FABLINO_STYLES` (primary/secondary button classes), `FABLINO_SHADOWS` (soft, card, cardHover, button, buttonHover, modal), `FABLINO_MOTION` (fast/normal/slow durations in ms). |
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
| `SavedCharactersModal` | Modal for selecting saved kid_characters with checkboxes (used in CharacterSelectionScreen) |
| `SelectionSummary` | Summary of selected characters |
| `VoiceRecordButton` | Mic button → recording UI (timer + waveform + transcript preview + confirm/retry). Labels in 6 languages (de/fr/es/en/nl/it). Uses `useVoiceRecorder` hook. |
| `WaveformVisualizer` | Canvas-based 35-bar audio waveform. RMS amplitude from `getByteTimeDomainData`, 80ms capture interval. Uses FABLINO_COLORS. |
| `ImageStylePicker` | Screen 4: Style selection. Loads active styles from `image_styles` DB, filters by age group, pre-selects profile preference/age default. Emoji fallbacks for missing preview images. |
| `SettingSelectionScreen` | Story setting selection (currently unused in main flow) |
| `types.ts` | TypeScript types + translation maps for wizard |

---

## Dynamic Prompt Engine (Block 2.3c)

### Shared Modules (supabase/functions/_shared/)

| Module | Purpose |
|--------|---------|
| `promptBuilder.ts` | Builds dynamic user message by querying rule tables (age_rules, difficulty_rules, theme_rules, emotion_rules). Handles surprise theme/characters, character relationships, learning themes, image plan instructions. When **useVisualDirector**: omits image_plan from requested JSON so Call 1 returns story only. **Series**: exports `EPISODE_CONFIG`, `buildSeriesContextBlock()`, extended `StoryRequest`. |
| `imagePromptBuilder.ts` | Constructs image prompts from image_plan + DB style rules. **V2 path** (when character_sheet present): `buildSceneImagePromptV2` / `buildCoverImagePromptV2` with character refs, camera, background_figures, explicit character count. **VD adapter**: `mapVisualDirectorToImagePlan()` maps Visual Director output (character_sheet, scenes, cover with camera) to ImagePlan; protagonist merge: DB physical (Mein Look) + VD clothing. **Series**: `VisualStyleSheet`, `EPISODE_MOOD`, `buildSeriesStylePrefix()`. `getStyleForAge()` from `image_styles` DB. |
| `visualDirector.ts` | **Visual Director**: optional second LLM call for Imagen-optimized image planning. Input: story title + content; output: `character_sheet` (full_anchor per character, token balance rules), `world_anchor`, `scenes` (scene_description, camera, characters_present, key_objects, atmosphere, background_figures), `cover` (description, characters_present, mood, camera). System prompt: character balance, scene balancing (camera/location/object/mood), close-up rules, cover camera (no close-up). Used when `useVisualDirector` is true. |
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

## Series Feature (Modus A – Linear 5-Episode Series)

### Architecture

```
Episode 1: Create → generate-story (isSeries=true)
  → LLM generates story + episode_summary + continuity_state + visual_style_sheet
  → Saved to stories table (series_id = story.id, episode_number = 1, ending_type = 'C')

Episode 2-4: Continue → generate-story (series_id, episode_number, previous context)
  → loadSeriesContext() fetches all previous episodes' summaries + continuity_state + visual_style_sheet
  → promptBuilder.ts injects SERIES CONTEXT block (episode function, requirements, continuity state)
  → imagePromptBuilder.ts uses VisualStyleSheet for visual consistency across episodes
  → Series consistency check validates cross-episode continuity
  → ending_type = 'C' (cliffhanger)

Episode 5: Final → generate-story (same flow)
  → ending_type = 'A' (complete resolution)
  → No continuation button shown in UI
```

### EPISODE_CONFIG (promptBuilder.ts)

| Episode | Function | Ending Type | Key Requirements |
|---------|----------|-------------|-----------------|
| 1 | Introduction & World Building | C (cliffhanger) | Establish characters, world, signature element |
| 2 | Deepening & First Challenge | C | Deepen relationships, introduce main conflict |
| 3 | Turning Point & Surprise | C | Unexpected twist, raise stakes |
| 4 | Climax & Crucial Decision | C | Maximum tension, protagonist faces biggest challenge |
| 5 | Resolution & Farewell | A (complete) | Resolve all threads, satisfying conclusion |

### Series Continuity State (JSONB)

```json
{
  "established_facts": ["Mikel is 7 years old", "The magic forest has talking trees"],
  "open_threads": ["The missing crystal", "The mysterious stranger"],
  "character_states": { "Mikel": "brave but worried", "Lina": "discovered her power" },
  "world_rules": ["Magic only works at night", "Animals can speak in the forest"],
  "signature_element": {
    "description": "A glowing blue feather that appears when danger is near",
    "usage_history": ["Ep1: Found in the cave", "Ep2: Glowed during the storm"]
  }
}
```

### Visual Style Sheet (JSONB, generated in Episode 1)

```json
{
  "characters": { "Mikel": "7-year-old boy with brown curly hair and green eyes" },
  "world_style": "Watercolor forest with soft morning light and mushroom houses",
  "recurring_visual": "Glowing blue feather appears in every scene"
}
```

### Image Pipeline for Series (imagePromptBuilder.ts)

- **EPISODE_MOOD**: Per-episode mood modifier (wonder → tension → dramatic → darker → triumphant)
- **buildSeriesStylePrefix()**: Prepends character descriptions + world style + "CRITICAL: Maintain EXACT character appearances"
- **styleBlock for series**: Uses `ageModifier + world_style + color_palette + EPISODE_MOOD` (excludes `style_prompt` to avoid collision)
- **Cover hint**: "Maintain exact same visual style as all other episode covers"

### Series Consistency Check (generate-story/index.ts)

- **buildSeriesConsistencyPrompt()**: Validates LOGIC, GRAMMAR, AGE, CHARACTER, CONTINUITY, EPISODE_FUNCTION, SIGNATURE
- **performSeriesConsistencyCheck()**: Calls LLM, returns structured errors with severity (CRITICAL/MEDIUM/LOW)
- **correctStoryFromSeriesErrors()**: Uses continuity_state as "canon reference" for corrections
- **CRITICAL CONTINUITY errors**: Mandatory correction (up to 2 attempts)

### Frontend Components

- **Feature Flag**: `isSeriesEnabled(role)` in `config/features.ts` – admin-only (set `SERIES_ENABLED: true` for all users)
- **Series Toggle**: Shown in SpecialEffectsScreen + StoryTypeSelectionScreen when `isAdmin` prop is true
- **SeriesGrid** (`src/components/SeriesGrid.tsx`):
  - Groups stories by series_id
  - Episode badge ("Ep. 1") on each cover
  - 5-slot progress bar (green=completed, primary=exists, muted=empty) + "X/5" counter
  - Green checkmark for completed episodes
  - "Next episode" placeholder (disabled until last episode read)
- **ReadingPage**: Series continuation button (hidden at Ep 5), Fablino loading text, series-completed message (7 languages)

### Database Columns on `stories`

| Column | Type | Purpose |
|--------|------|---------|
| `series_id` | UUID | Links episodes (Episode 1 uses its own ID) |
| `episode_number` | INTEGER | 1-5 |
| `ending_type` | TEXT (A/B/C) | A=complete, B=open, C=cliffhanger |
| `episode_summary` | TEXT | ~100 word summary for next-episode context |
| `continuity_state` | JSONB | Cross-episode state (facts, threads, characters, world rules, signature element) |
| `visual_style_sheet` | JSONB | Visual consistency (characters, world_style, recurring_visual) |

---

## Voice Input Feature

### Architecture

```
VoiceRecordButton (UI) → useVoiceRecorder (hook) → speech-to-text (Edge Function) → Gladia V2 API
```

### Components

| Component | File | Description |
|-----------|------|-------------|
| `useVoiceRecorder` | `src/hooks/useVoiceRecorder.ts` | MediaRecorder hook with states (idle/recording/processing/result/error). Max 30s recording. Base64 → Supabase Edge Function. Exposes AnalyserNode for waveform. Retry logic (2 attempts). |
| `VoiceRecordButton` | `src/components/story-creation/VoiceRecordButton.tsx` | Mic button with recording UI (timer, waveform, transcript preview, confirm/retry). Labels in 6 languages (de/fr/es/en/nl/it). |
| `WaveformVisualizer` | `src/components/story-creation/WaveformVisualizer.tsx` | Canvas-based 35-bar waveform. RMS amplitude from `getByteTimeDomainData`. 80ms capture interval. Uses FABLINO_COLORS. |

### Speech-to-Text Edge Function (Gladia V2)

| Detail | Value |
|--------|-------|
| API | Gladia V2 (EU endpoint) |
| Flow | Upload audio → create transcription → poll result (500ms intervals, max 30 attempts) |
| Input | JSON body (`audio` base64, `mimeType`, `language`) or FormData |
| Languages | de, fr, en, es, nl, it |
| Custom vocabulary | Fablino, Drache, Einhorn, etc. |
| Max file size | 5 MB |
| Output | `{ text, language, duration }` |

---

## Immersive Reader

### Architecture

Admin-only book-style reader with pixel-based content splitting, landscape spreads, and syllable coloring.

```
ReadingPage.tsx (viewMode === 'immersive')
        │
        ▼
ImmersiveReader.tsx (orchestrator)
  ├── useImmersiveLayout()      → Detects LayoutMode (phone/small-tablet/landscape-spread)
  ├── useContentSplitter()      → Pixel-based text → ImmersivePage[] splitting
  ├── useSyllableColoring()     → Toggle state, DE/FR only
  ├── usePagePosition()         → Current spread index, navigation
  ├── buildImageArray()         → Deduplicates cover image from story_images
  ├── buildSpreads()            → Pairs pages into landscape double-page spreads
  │
  ├── Cover page: ImmersiveChapterTitle
  │     • Cover image (left), Title + coverParagraphs (right)
  │     • Pixel-measured paragraph count to fill available space
  │
  ├── Content pages: ImmersivePageRenderer
  │     • Renders ImmersivePage within a Spread
  │     • SpreadImageHalf / SpreadTextHalf / SpreadEmptyHalf
  │     • Image side alternates (left/right) per image index
  │     • Background: #FFF9F0 on all halves
  │     • Broken images hidden via onError → display:none
  │
  ├── ImmersiveNavigation        → Swipe + arrow key + click navigation
  ├── ImmersiveProgressBar       → Page counter + progress dots
  ├── ImmersiveToolbar           → Syllable toggle + fullscreen button
  ├── ImmersiveWordSheet         → Word tap explanation (bottom sheet)
  ├── ImmersiveQuizFlow          → Comprehension quiz after reading
  └── ImmersiveEndScreen         → Stars earned, streak, navigation buttons
```

### Pixel-Based Content Splitting (useContentSplitter.ts)

```
splitIntoPagesPixel():
  1. Create hidden measurement <div> matching text container dimensions
  2. Get available height: viewport - toolbar - padding (portrait vs landscape)
  3. Get text container width: half viewport (landscape) or full (portrait)
  4. For each paragraph:
     a. Append to measurement div, check scrollHeight
     b. If fits → add to current page
     c. If overflows → finalize current page, start new
     d. If single paragraph overflows → split by sentences
  5. Enforce MIN_PAGES (3) by reducing available height × 0.7
  6. Enforce MAX_PAGES (8) by increasing available height × 1.3
  7. Cleanup: remove measurement div from DOM
```

### Components (src/components/immersive-reader/)

| Component | File | Description |
|-----------|------|-------------|
| `ImmersiveReader` | `ImmersiveReader.tsx` | Main orchestrator. Manages page state, cover paragraphs, spreads, syllable preloading, fullscreen. Background `#FFF9F0`. |
| `ImmersivePageRenderer` | `ImmersivePageRenderer.tsx` | Renders individual spreads: `SpreadImageHalf`, `SpreadTextHalf`, `SpreadEmptyHalf`. Handles image placement (alternating sides). |
| `ImmersiveChapterTitle` | `ImmersiveChapterTitle.tsx` | Cover page with image left, title + multiple paragraphs right. Syllable coloring on cover text. |
| `ImmersiveNavigation` | `ImmersiveNavigation.tsx` | Swipe gestures, arrow key listeners, click-to-navigate zones. |
| `ImmersiveProgressBar` | `ImmersiveProgressBar.tsx` | Page counter with spread-aware numbering. |
| `ImmersiveToolbar` | `ImmersiveToolbar.tsx` | Syllable toggle (DE/FR only) + fullscreen button. |
| `ImmersiveWordSheet` | `ImmersiveWordSheet.tsx` | Bottom sheet for word explanations (word tap). |
| `ImmersiveQuizFlow` | `ImmersiveQuizFlow.tsx` | Comprehension quiz integrated into reader. |
| `ImmersiveEndScreen` | `ImmersiveEndScreen.tsx` | Post-reading summary (stars, streak, weekly bonus). |
| `constants.ts` | `constants.ts` | Types (`ImmersivePage`, `Spread`, `LayoutMode`), typography by age, theme gradients, syllable colors, breakpoints. |
| `labels.ts` | `labels.ts` | i18n labels for immersive reader UI (7 languages). |
| `imageUtils.ts` | `imageUtils.ts` | `buildImageArray()` (deduplicates cover), `distributeImagesEvenly()`, `getImageSide()`, `parseImagePlan()`. |
| `useImmersiveLayout.ts` | `useImmersiveLayout.ts` | Detects device layout: phone (<640), small-tablet (<1024), landscape-spread (≥600 short side). |
| `usePagePosition.ts` | `usePagePosition.ts` | Manages current spread index + navigation callbacks. |
| `useContentSplitter.ts` | `useContentSplitter.ts` | Pixel-based content splitting into `ImmersivePage[]`. |
| `useSyllableColoring.ts` | `useSyllableColoring.ts` | Syllable toggle state. Only DE and FR supported. |

### Typography by Age Group

| Age Group | Font Size | Line Height | Letter Spacing |
|-----------|-----------|-------------|----------------|
| 5–7 | 22px | 1.75 | 0.2px |
| 8–9 | 20px | 1.7 | 0.15px |
| 10–11 | 18px | 1.65 | 0.1px |
| 12+ | 16px | 1.6 | 0 |

---

## Image Style System

### Architecture

DB-driven image style system replacing hardcoded style logic. Three phases:

```
Phase 1 (Backend): image_styles table + getStyleForAge() reads from DB
Phase 2 (Wizard):  ImageStylePicker in Story Wizard (Screen 4)
Phase 3 (Admin):   ImageStylesSection CRUD in Admin Panel
```

### Data Flow

```
CreateStoryPage (Wizard)
  │  Screen 4: ImageStylePicker
  │  ├── Load styles: supabase.from('image_styles').select('*').eq('is_active', true)
  │  ├── Filter by age: style.age_groups contains kid's age bracket
  │  ├── Pre-select: kid_profiles.image_style > default_for_ages > first style
  │  └── Selected: image_style_key
  │
  ▼
generate-story Edge Function
  │  ├── Receives image_style_key in request body
  │  ├── imagePromptBuilder.ts → getStyleForAge(supabase, age, styleKey)
  │  │     Reads from image_styles DB table (fallback to hardcoded)
  │  │     Uses imagen_prompt_snippet + age_modifiers for image prompts
  │  ├── Saves image_style_key to stories table
  │  └── Returns image_style_key to frontend
  │
  ▼
ReadingPage / CreateStoryPage
  └── Saves selected style to kid_profiles.image_style (preference for next time)
```

### Admin Panel (ImageStylesSection.tsx)

- List view with all styles (active/inactive)
- Create/edit dialog: multilingual labels (de/fr/en/es/nl/it/bs), description, `imagen_prompt_snippet`
- Age group checkboxes (4-5, 6-7, 8-9, 10-11, 12+)
- Default-for-ages checkboxes
- Age modifiers (JSONB: per-age prompt adjustments)
- Preview image upload to `style-previews` Supabase Storage bucket
- Sort order, active toggle
- Located in Admin Panel → System tab

---

## Visual Director (Image Planning)

When the **Visual Director** path is enabled (`useVisualDirector`), image planning is done by a **second LLM call** after the story is generated, instead of requesting `image_plan` in the first story JSON.

### Flow

```
Call 1 (promptBuilder + generate-story):
  → Request JSON without image_plan when useVisualDirector
  → LLM returns: title, content, questions, vocabulary, etc. (no image_plan)

After story is saved, in image block (!comicStripHandled):
  → Promise.allSettled([ callVisualDirector(...), consistencyCheckTask() ])
  → VD returns: character_sheet, world_anchor, scenes, cover (each with camera; scenes with background_figures)
  → mapVisualDirectorToImagePlan(vdOutput, kidAppearanceAnchor, …) → ImagePlan
  → buildImagePrompts(plan) V2 path → cover + scene prompts (character refs, camera, character count, background_figures)
  → generateAllImagesTask() → cover + scene images
```

### Responsibilities

| Component | Role |
|-----------|------|
| `visualDirector.ts` | System prompt: character_sheet (token balance 25–40 words, 1.5× max ratio), world_anchor, scene rules (camera, background_figures, scene balancing, close-up once max, cover camera medium/full body only). `callVisualDirector()` → LLM → JSON. |
| `imagePromptBuilder.ts` | `mapVisualDirectorToImagePlan()`: VD output → ImagePlan; protagonist merge = DB physical (Mein Look) + VD clothing. V2 prompts: explicit character count, background_figures (none/few/crowd), cover camera from VD. |
| `generate-story/index.ts` | When useVisualDirector: skip fallback image_plan LLM; run VD + consistency in parallel; map VD → plan; build prompts; generate images. |

### VD output schema (summary)

- **character_sheet**: name, role, full_anchor, props (balanced length; clothing concise).
- **scenes**: scene_id, scene_description, characters_present, camera, key_objects, atmosphere, background_figures (none | few | crowd).
- **cover**: description, characters_present, mood, camera (medium shot or full body only).

---

## Syllable Coloring

### Architecture

Hybrid syllable splitting approach using two libraries:

```
src/lib/syllabify.ts
  │
  ├── German (DE): hypher (synchronous)
  │     Uses hyphenation.de pattern file
  │     syllabifySync(word) → string[]
  │
  ├── French (FR): hyphen (async with cache)
  │     Preloads pattern file, caches hyphenator
  │     syllabifyAsync(word) → Promise<string[]>
  │
  └── Other languages: NOT SUPPORTED
        syllabifyWithLog() returns [word] (no split)
```

### Supported Languages

Only **German (DE)** and **French (FR)**. The syllable toggle in both Classic and Immersive readers is hidden for all other languages.

### Color Scheme

Alternating blue (#2563EB) / red (#DC2626) syllable coloring. Continuous color offset across paragraphs (no reset per paragraph).

### Components

| Component | Description |
|-----------|-------------|
| `SyllableText` (`src/components/SyllableText.tsx`) | Renders text with syllable coloring. Uses `syllabifyWithLog()`. Continuous `globalColorOffset` alternation across paragraphs. |
| `ReadingSettings` (`src/components/ReadingSettings.tsx`) | Classic Reader syllable toggle (with preview). |
| `ImmersiveToolbar` | Immersive Reader syllable toggle (visible only for DE/FR). |
| `useSyllableColoring` | Immersive Reader toggle state hook. |

### npm Dependencies

- `hypher` — synchronous syllable splitting engine
- `hyphenation.de` — German hyphenation patterns for hypher
- `hyphenation.fr` — French hyphenation patterns for hypher (used as backup)
- `hyphen` — async syllable splitting (primary for French)

---

## Feature Flags & Premium UI

### Static flags (config/features.ts)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEW_FABLINO_HOME` | true | Use HomeFablino instead of HomeClassic on `/` |
| `SERIES_ENABLED` | true | Allow series creation; `isSeriesEnabled(role)` also true for admin |

### Per-user flags (app_settings)

Stored in `app_settings` as JSON arrays of `user_profiles.id`. Value `["*"]` = enabled for all users; `[]` = none.

| Key | Toggle location | Purpose |
|-----|-----------------|---------|
| `emotion_flow_enabled_users` | Admin → Feature Flags | Emotion-Flow story generation (backend) |
| `comic_strip_enabled_users` | Admin → Feature Flags | Comic-strip layout (backend) |
| `premium_ui_enabled_users` | Admin → Feature Flags, or Parent Settings (Eltern) | Premium UI styling (frontend) |

### Premium UI flow

1. **Read**: Frontend calls Edge Function `manage-users` with `action: "getPremiumUi"`. Function reads `app_settings.premium_ui_enabled_users` and returns `{ enabled: boolean }` for the authenticated user. Hook `usePremiumUi` refetches on route change and window focus so toggles apply without full reload.
2. **Write**: Admin toggles on **Feature Flags** page (writes `app_settings` via client where RLS allows) or user toggles in **Parent Settings** (calls `manage-users` with `action: "setPremiumUi", enabled`).
3. **Apply**: `PremiumUiBodyClass` (in App, under AuthProvider) adds or removes the CSS class `premium-ui` on `document.body` when `premiumUiEnabled` is true. All premium-only styles in `index.css` are scoped under `body.premium-ui` (button shadows, card elevation, radial background, input min-height, selected-state glow). Key CTAs use `data-premium-button="primary"` or `data-premium-card` so they receive these styles.
4. **Route transitions**: When premium UI is on, `PremiumRouteTransition` wraps protected routes and applies Framer Motion (fade + slight y) on route change.

### Components

| Component | Role |
|-----------|------|
| `PremiumUiBodyClass` | Sets `body.premium-ui` from `usePremiumUi().premiumUiEnabled` |
| `PremiumRouteTransition` | Layout route: wraps `<Outlet />` in AnimatePresence + motion.div when premium UI enabled |
| `FeatureFlagsPage` | Admin UI: list users, toggle Emotion-Flow / Comic-Strip / Premium UI per user or globally |

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
| **Oversized components** | `ReadingPage.tsx` (~1700+ lines), `FeedbackStatsPage.tsx` (~1576 lines), `VocabularyQuizPage.tsx` (~954 lines), `generate-story/index.ts` (~1600+ lines) | Hard to maintain, test, review |
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
12. **Performance**: Extend React Query caching to more pages (AdminPage, VocabularyPages), implement code splitting, React.memo, virtualization for large lists
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

### Series Feature Migration (2026-02-12)

| File | Purpose |
|------|---------|
| `20260212_series_feature_phase1.sql` | Adds `episode_summary` (TEXT), `continuity_state` (JSONB), `visual_style_sheet` (JSONB) to `stories` table. All nullable, existing stories unchanged. |

### Image Style System Migrations (2026-02-17/18)

| File | Purpose |
|------|---------|
| `20260217_image_styles.sql` | Creates `image_styles` table (style_key PK, labels JSONB, description JSONB, imagen_prompt_snippet, age_groups, default_for_ages, age_modifiers, sort_order, is_active, preview_image_url). RLS policies. Adds `image_style_key` to `stories`. Seeds 6 initial styles (watercolor_storybook, paper_cut, cartoon_vibrant, whimsical_digital, realistic_illustration, minimalist_modern). |
| `20260218_image_styles_batch2.sql` | Inserts 4 additional styles (3d_adventure, pixel_art, brick_block, vintage_retro) with multilingual labels, descriptions, and prompt snippets. |

### Immersive Reader Migration (2026-02-10)

| File | Purpose |
|------|---------|
| `20260210_immersive_reader_target_paragraph.sql` | Updates `system_prompt_core_v2` in `app_settings` to include `target_paragraph` in IMAGE PLAN INSTRUCTIONS for the LLM. |

### Performance & Storage Migrations (2026-02-11)

| File | Purpose |
|------|---------|
| `20260211070403_…` | Creates `story-images` storage bucket (public) with storage policies |
| `20260211120540_…` | Storage bucket policies (additional) |
| `20260211125053_…` | Adds `is_favorite` boolean column to `stories` table (default false) |

---

## Performance Optimizations

### Implemented

| Optimization | Location | Details |
|-------------|----------|---------|
| **React Query caching** | StorySelectPage | `useQuery` with `staleTime: 5min`, `gcTime: 10min`. Query key: `['stories', selectedProfileId, userId]`. Invalidated after mutations (e.g. new episode). |
| **Server-side story filtering** | `get_my_stories_list` RPC | Replaces client-side `.from("stories").select(...)` with server-side RPC. Filters by kid_profile_id (including null). No content field transferred. |
| **Image thumbnails** | `lib/imageUtils.ts` | `getThumbnailUrl(url, width, quality)` for Supabase Storage transform API. Used in StorySelectPage, AdminPage, SeriesGrid. |
| **Lazy image loading** | StorySelectPage, AdminPage, SeriesGrid, ReadingPage | `loading="lazy"` on all story cover images. |
| **useMemo filtering** | AdminPage | `useMemo` for search + status filtering of story list. |
| **useCallback** | Various hooks | `useCallback` in VocabularyQuizPage, KidProfileSection, gamification hooks, ParentSettingsPanel, StoryAudioPlayer. |
| **In-memory explanation cache** | ReadingPage | `cachedExplanations` Map avoids repeated LLM calls for word explanations within a session. |
| **Parallel queries** | StorySelectPage, AdminPage | Stories + completions fetched with `Promise.all`. |

### Not Yet Implemented

| Optimization | Notes |
|-------------|-------|
| Route-level code splitting | No `React.lazy` / `Suspense` for pages |
| List virtualization | No `react-window` / `react-virtualized` for large story lists |
| React Query on other pages | AdminPage, VocabularyPages still use `useEffect` + direct Supabase calls |
| Skeleton loaders on StorySelectPage | Currently uses animated BookOpen icon; ResultsPage has skeletons |

---

*Last updated: 2026-03-02. Covers: Block 1 (multilingual DB), **Visual Director** (optional second LLM for image planning when useVisualDirector: character_sheet, scenes with camera/background_figures, cover with camera; mapVisualDirectorToImagePlan; V2 prompts with character count and background_figures), Block 2.1 (learning themes + guardrails), Block 2.2/2.2b (rule tables + difficulty_rules), Block 2.3a (story classifications + kid_characters), Block 2.3c (dynamic prompt engine), Block 2.3d (story_languages, wizard character management), Block 2.3e (dual-path wizard, surprise theme/characters), Block 2.4 (intelligent image generation), Phase 5 (star-based gamification, badges, BadgeCelebrationModal, ResultsPage), UI harmonization complete (design-tokens.ts including FABLINO_SHADOWS/FABLINO_MOTION, FablinoMascot, SpeechBubble, FablinoPageHeader, compact SpecialEffectsScreen, theme/character Vite imports), **Gamification Phase 1 backend complete** (7 migrations), **Gamification Phase 2 frontend fixes complete** (total_stars insert, activity types story_read/quiz_complete, allBadgeCount=23), **Performance optimizations** (React Query caching on StorySelectPage, server-side story list RPC, image thumbnails via getThumbnailUrl, lazy loading), **New infrastructure** (story-images storage bucket, edgeFunctionHelper with legacy auth, migrate-covers + migrate-user-auth edge functions, SavedCharactersModal, ConsistencyCheckStats, stories.is_favorite), **Series Feature Modus A complete** (Phase 0-5), **Voice Input** (useVoiceRecorder hook + VoiceRecordButton + WaveformVisualizer), **Speech-to-Text rewrite** (ElevenLabs → Gladia V2 API with custom vocabulary), **Immersive Reader** (admin-only book-style reader with pixel-based content splitting, landscape spreads, cover page with multi-paragraph fill, image deduplication, syllable coloring DE/FR, fullscreen mode, warm cream background #FFF9F0, 17 components in src/components/immersive-reader/), **Image Style System** (Phase 1: image_styles DB table with 10 styles + getStyleForAge() reads from DB; Phase 2: ImageStylePicker in Story Wizard Screen 4; Phase 3: ImageStylesSection CRUD in Admin Panel with preview upload), **Syllable Coloring** (hybrid approach: hypher sync for DE, hyphen async+cache for FR; SyllableText component; toggle restricted to DE/FR; live monitoring), **Classic Reader default** (all users default to classic, admin toggle for immersive via URL param or UI toggle), **Feature Flags & Premium UI** (per-user flags in app_settings: emotion_flow_enabled_users, comic_strip_enabled_users, premium_ui_enabled_users; FeatureFlagsPage for admin toggles; usePremiumUi hook + PremiumUiBodyClass for body.premium-ui; PremiumRouteTransition for route animations; manage-users getPremiumUi/setPremiumUi; design-tokens FABLINO_SHADOWS/FABLINO_MOTION).*
