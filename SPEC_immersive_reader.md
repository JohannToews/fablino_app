# SPEC: Fablino Immersive Reader

> **Purpose**: Replace the current scrollable ReadingPage with a book-like page-flip reading experience.
> **Target**: Claude Code → derives Cursor implementation tasks
> **Priority**: P0 for Beta (21 children, 13 families, 72% aged 5–7)
> **Date**: 2026-02-17

---

## Table of Contents

1. [Overview & Architecture Decisions](#1-overview--architecture-decisions)
2. [Page Types & Layout](#2-page-types--layout)
3. [Content-Splitting Algorithm](#3-content-splitting-algorithm)
4. [Image Placement](#4-image-placement)
5. [Navigation & Word Explanation](#5-navigation--word-explanation)
6. [Typography & Syllable Coloring](#6-typography--syllable-coloring)
7. [Chapter Story Integration](#7-chapter-story-integration)
8. [Completion Flow & Gamification](#8-completion-flow--gamification)
9. [Responsive Behavior](#9-responsive-behavior)
10. [Premium Tier Logic](#10-premium-tier-logic)
11. [Explicit Exclusions](#11-explicit-exclusions)
12. [Open Items / TBD](#12-open-items--tbd)

---

## 1. Overview & Architecture Decisions

### What this replaces

The current `ReadingPage.tsx` renders stories as a single scrollable page: cover image at top, full story text below, word explanation sidebar, quiz at the bottom. This is replaced by an **Immersive Reader** — a page-by-page reading experience inspired by German/French early-reader book formats (Leselöwen, Leserabe, J'aime lire).

### Key architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page-flip style | **Horizontal slide** (Kindle-style) | Clean, proven, works on all devices |
| Content splitting | **Frontend, on-the-fly** | Adapts to device/font-size, no DB migration, existing stories work |
| Image placement | **`target_paragraph` in image_plan** (LLM hint) | Content-aware placement; fallback to even distribution for old stories |
| Word explanation | **Bottom Sheet** on word tap | No conflict with page navigation; Fablino fox mascot branding |
| Orientation change | **Live re-layout** with paragraph anchor | Never jumps forward; may show a few re-read sentences |
| Classic mode | **Preserved as fallback** (`?mode=classic`) | A/B comparison, safety net |

### Component structure (new)

```
src/components/
  immersive-reader/
    ImmersiveReader.tsx          — Main orchestrator
    ImmersivePageRenderer.tsx    — Renders a single page (text, image, or both)
    ImmersiveNavigation.tsx      — Tap zones, swipe, keyboard handlers
    ImmersiveProgressBar.tsx     — Progress bar + page counter
    ImmersiveEndScreen.tsx       — Completion: stars, streak, buttons
    ImmersiveQuizFlow.tsx        — Quiz pages integrated into reader
    ImmersiveChapterTitle.tsx    — Chapter title page for series
    ImmersiveWordSheet.tsx       — Bottom sheet for word explanations
    useContentSplitter.ts        — Hook: splits story text into pages
    usePagePosition.ts           — Hook: tracks current page + paragraph anchor
    useImmersiveLayout.ts        — Hook: detects layout mode (phone/small-tablet/landscape)
```

### Integration into existing app

```typescript
// ReadingPage.tsx — updated
const [viewMode, setViewMode] = useState<'classic' | 'immersive'>('immersive');

// URL param override: /read/:id?mode=classic
// Default: immersive for all devices
// Toggle button available to switch modes

if (viewMode === 'immersive') {
  return <ImmersiveReader story={story} kidProfile={kidProfile} onComplete={handleComplete} />;
} else {
  return <ClassicReadingPage story={story} ... />;
}
```

---

## 2. Page Types & Layout

### 2.1 Page types

| Type | Content | When used |
|------|---------|-----------|
| **Image + Text** | AI-generated illustration + 1–2 paragraphs | Pages where an image is assigned (via `target_paragraph` or even distribution) |
| **Text Only** | Text only, with themed color gradient as background accent | Pages without an assigned image |
| **Chapter Title** | Chapter number + chapter name + episode cover image | First page of each episode in a chapter story |
| **Quiz Page** | Comprehension question + answer options | After last text page (mandatory for chapter stories, optional for single stories) |
| **End Screen** | Stars animation, streak, buttons | After quiz or after last text page |

### 2.2 Three layout modes

All three modes are **P0 for Beta**.

#### Phone Portrait (viewport width ≤ 640px)

```
┌──────────────────┐
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬  │  Progress bar + "3 / 8"
│                  │
│ ┌──────────────┐ │
│ │              │ │
│ │    IMAGE     │ │  ~50% viewport height
│ │              │ │
│ │ ░░░ fade ░░░ │ │  Gradient fade to background
│ └──────────────┘ │
│                  │
│ Text text text   │
│ text text text   │  Remaining height
│ text.            │
│                  │
│            3 / 8 │
└──────────────────┘
```

**Text-only page (no image):**
```
┌──────────────────┐
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬  │
│                  │
│ ┌──────────────┐ │
│ │  ░░░░░░░░░░  │ │  Themed color gradient
│ │  ░░░░░░░░░░  │ │  (based on story theme)
│ └──────────────┘ │
│                  │
│ Text text text   │
│ text text text   │
│ text.            │
│                  │
└──────────────────┘
```

#### Small Tablet Portrait (641–1024px)

Same vertical layout as phone, but with:
- More padding (32px instead of 20px)
- Larger image area (~55% height)
- More whitespace between image and text
- Font size may be larger (see Typography section)

#### Large Tablet Landscape (≥1025px OR landscape + short side ≥600px)

**Spread layout — image and text side by side, alternating:**

Spread 1 (image left):
```
┌────────────────────────────────────────┐
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬                   │
│                                        │
│ ┌─────────────┐  ┌──────────────────┐  │
│ │             │  │                  │  │
│ │   IMAGE     │  │  Text text text  │  │
│ │             │  │  text text text  │  │
│ │             │  │  text text.      │  │
│ │             │  │                  │  │
│ └─────────────┘  └──────────────────┘  │
│                                 3 / 8  │
└────────────────────────────────────────┘
```

Spread 2 (image right):
```
┌────────────────────────────────────────┐
│ ┌──────────────────┐  ┌─────────────┐  │
│ │                  │  │             │  │
│ │  Text text text  │  │   IMAGE     │  │
│ │  text text text  │  │             │  │
│ │  text text.      │  │             │  │
│ └──────────────────┘  └─────────────┘  │
└────────────────────────────────────────┘
```

**Alternation rule:** Image-side alternates with each image page. Text-only pages always use full width (centered text with generous max-width).

### 2.3 Themed color gradients for text-only pages

For Beta: simple color gradients mapped to the 4 main story categories.

```typescript
const THEME_GRADIENTS: Record<string, string> = {
  magic_fantasy:    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  adventure_action: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  real_life:        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  surprise:         'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
};
// Map story's concrete_theme or theme_key → gradient
// P1: Replace gradients with themed SVG silhouettes (15–20 pre-made)
```

---

## 3. Content-Splitting Algorithm

### 3.1 Approach

**Frontend, on-the-fly, paragraph-based with overflow handling.**

The story text (`stories.content`) is a single string with `\n\n`-separated paragraphs. The splitter distributes paragraphs to pages respecting a **max words-per-page** limit that varies by age and font-size setting.

### 3.2 Words-per-page by age

Default values (for font-size setting "Medium"):

| Age | Max words/page | Approx. pages for "medium" story |
|-----|---------------|----------------------------------|
| 5–7 | 40–60 | 200–400W → 4–8 pages |
| 8–9 | 60–90 | 350–600W → 5–8 pages |
| 10–11 | 90–120 | 500–800W → 5–8 pages |
| 12+ | 120–160 | 700–1100W → 6–8 pages |

> **TBD**: Johann to provide final words-per-page ranges. Above are working estimates.

Font-size setting adjustment:
- "Small" font → +20% more words per page
- "Large" font → -20% fewer words per page

### 3.3 Splitting algorithm

```typescript
function splitIntoPages(
  content: string,
  maxWordsPerPage: number,
  imagePositions: number[]  // paragraph indices that have an image
): Page[] {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const pages: Page[] = [];
  let currentPage: PageDraft = { paragraphs: [], hasImage: false };
  let currentWordCount = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const wordCount = para.split(/\s+/).length;

    // If adding this paragraph exceeds limit → start new page
    if (currentWordCount + wordCount > maxWordsPerPage && currentPage.paragraphs.length > 0) {
      pages.push(finalizePage(currentPage));
      currentPage = { paragraphs: [], hasImage: false };
      currentWordCount = 0;
    }

    // If single paragraph exceeds limit → split at sentence boundary
    if (wordCount > maxWordsPerPage) {
      const chunks = splitParagraphAtSentences(para, maxWordsPerPage);
      for (const chunk of chunks) {
        pages.push(finalizePage({
          paragraphs: [chunk],
          hasImage: imagePositions.includes(i),
        }));
      }
      continue;
    }

    currentPage.paragraphs.push(para);
    currentWordCount += wordCount;

    // Check if this paragraph has an image assigned
    if (imagePositions.includes(i)) {
      currentPage.hasImage = true;
    }
  }

  // Flush remaining
  if (currentPage.paragraphs.length > 0) {
    pages.push(finalizePage(currentPage));
  }

  return pages;
}
```

### 3.4 Overflow handling

If a single paragraph exceeds `maxWordsPerPage`, split it at the nearest **sentence boundary** (`. ` or `! ` or `? `) that is within the limit. Never split mid-sentence.

### 3.5 Page count validation

After splitting, check: if total pages < 3 (story too short for meaningful paging), reduce `maxWordsPerPage` by 30% and re-split. Minimum 3 content pages for a meaningful reading experience.

---

## 4. Image Placement

### 4.1 Primary: `target_paragraph` in image_plan

**Prompt change required**: When generating the story, the LLM's `image_plan` response must include a `target_paragraph` field (0-based index) for each scene, indicating which paragraph the image illustrates.

Updated `ImagePlan` interface:

```typescript
export interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: Array<{
    scene_id: number;
    story_position: string;
    description: string;
    emotion: string;
    key_elements: string[];
    target_paragraph: number;  // NEW: 0-based paragraph index
  }>;
}
```

The prompt addition (in the story generation system prompt):

```
For each scene in image_plan, include "target_paragraph": the 0-based index
of the paragraph in the story text that this image best illustrates.
Distribute images evenly across the story — do not cluster them.
```

### 4.2 Fallback: even distribution (existing stories)

For stories that don't have `target_paragraph` data (all existing stories):

```typescript
function distributeImagesEvenly(
  totalPages: number,
  imageCount: number // cover + scenes
): number[] {
  // Cover always goes to page 0
  const positions = [0];
  const remainingImages = imageCount - 1;
  const step = Math.floor((totalPages - 1) / (remainingImages + 1));
  for (let i = 1; i <= remainingImages; i++) {
    positions.push(i * step);
  }
  return positions;
}
```

### 4.3 Image array mapping

Images come as an ordered array: `[cover_image_url, ...story_images[]]`.

- Image 0 (cover) → first image position (page 0, or matched to `target_paragraph` of scene 0)
- Image 1 (scene_1) → second position
- etc.

### 4.4 Account tier determines image count

The reader receives the user's `account_tier` and uses it to determine how many images to display:

```typescript
const IMAGE_LIMITS: Record<string, number> = {
  free: 4,      // cover + 3 scene images (max)
  standard: 4,  // €4.99 tier
  premium: 6,   // €9.99 tier — cover + 5 scene images
};
```

Pages that would have an image under a higher tier but don't under the current tier → render as text-only page with themed gradient. This becomes a natural upsell moment.

### 4.5 Landscape alternation

In landscape/spread mode, the image side alternates:
- 1st image page: image LEFT, text RIGHT
- 2nd image page: image RIGHT, text LEFT
- 3rd image page: image LEFT, text RIGHT
- etc.

Text-only pages in landscape: full-width centered text (no split).

---

## 5. Navigation & Word Explanation

### 5.1 Navigation

| Input | Action | Zone |
|-------|--------|------|
| Tap on empty space (right 70%) | Next page | Right side of screen, excluding text area |
| Tap on empty space (left 30%) | Previous page | Left side of screen |
| Swipe left | Next page | Anywhere |
| Swipe right | Previous page | Anywhere |
| Keyboard → / Space | Next page | Desktop/tablet with keyboard |
| Keyboard ← | Previous page | Desktop/tablet with keyboard |

**Critical: Tap on a word ≠ navigation.** Each word in the text is rendered as an individual `<span>`. Tapping a word triggers word explanation. Tapping empty space / image / margins triggers navigation. The navigation tap handler only fires if the tap target is NOT a word span.

### 5.2 Page transition animation

**Horizontal slide (Kindle-style):**
- Duration: 300ms
- Easing: ease-out
- Direction: slide left for "next", slide right for "previous"
- During transition: outgoing page slides out, incoming page slides in
- No fade, no 3D effects

### 5.3 Progress bar

Sticky at the top of the viewport:
- Segmented bar (one segment per page), filled segments = visited pages
- Color: Fablino teal (#1A9A8A)
- Page counter: "3 / 8" (right-aligned, below progress bar)
- For chapter stories: additional label "Chapter 2 of 5" above the progress bar

### 5.4 Navigation hint

Only on page 1, first time: "Tap to continue reading →" (localized). Appears with a subtle bounce animation. Disappears after first navigation action or after 5 seconds.

### 5.5 Word explanation — Bottom Sheet

**Trigger:** Tap on any word in the story text.

**Behavior:**
1. Tapped word gets highlighted (background color)
2. Bottom sheet slides up from the bottom (300ms, ease-out)
3. Sheet content:
   - Fablino fox mascot icon (🦊 or SVG)
   - The word in bold
   - Explanation text (from existing `explain-word` Edge Function)
   - "Save" button (saves to `marked_words` table)
   - "✕" close button
4. Dismiss: tap ✕, tap outside sheet, or swipe down
5. While sheet is open: page navigation is disabled

**Existing integration:** Uses the same `explain-word` Edge Function and `marked_words` table as the current reading page. The word explanation language comes from `kid_profiles.explanation_language`.

---

## 6. Typography & Syllable Coloring

### 6.1 Font

**Nunito** (already loaded in the app). Used for all age groups.

### 6.2 Age-dependent font-size defaults

| Age | Default (px) | Line-height | Letter-spacing |
|-----|-------------|-------------|----------------|
| 5–7 | 24 | 1.8 | 0.3px |
| 8–9 | 21 | 1.7 | 0.2px |
| 10–11 | 19 | 1.65 | 0.1px |
| 12+ | 17 | 1.6 | 0 |

### 6.3 Manual font-size adjustment

3 steps: Small / Medium / Large. Offset: ±3px from age default.

| Setting | Offset | Example (age 6) |
|---------|--------|-----------------|
| Small | -3px | 21px |
| Medium | 0 (default) | 24px |
| Large | +3px | 27px |

UI: Three buttons in a toolbar at the top of the reader (like in the current app — T with Petit/Moyen/Grand). The toolbar should be collapsible / hideable to maximize reading space.

### 6.4 Syllable coloring (P0)

**Leselöwen-style colored syllables**: alternating blue/red coloring per syllable.

Example: <span style="color:blue">**Le**</span><span style="color:red">**sen**</span> <span style="color:blue">**macht**</span> <span style="color:red">**Spaß**</span>

**Implementation:**
- **Toggle**: Manual switch in the reader toolbar (not auto-enabled by age)
- **Library**: Use a hyphenation library with language-specific patterns (e.g. `hyphen` npm package or `hypher` with Tex patterns)
- **Languages**: All available story languages for Beta (DE, FR, EN, ES, NL, IT, BS)
- **Colors**: Alternating blue (#2563EB) and red (#DC2626) — high contrast, accessible
- **Rendering**: Each syllable is a `<span>` with the appropriate color class. This works in combination with the word-tap feature (word spans wrap syllable spans)

```typescript
// Pseudo-code
function renderWordWithSyllables(word: string, language: string): JSX.Element {
  const syllables = hyphenate(word, language); // ['Le', 'sen']
  return (
    <span className="word" onClick={() => onWordTap(word)}>
      {syllables.map((syl, i) => (
        <span key={i} className={i % 2 === 0 ? 'syllable-blue' : 'syllable-red'}>
          {syl}
        </span>
      ))}
    </span>
  );
}
```

**Edge case:** When syllable coloring is OFF, words are still individual `<span>`s (for word-tap functionality), but without syllable sub-spans.

---

## 7. Chapter Story Integration

### 7.1 Context

Series ("Kapitelgeschichten") consist of 3–7 episodes depending on age (see FABLINO_STORY_KONZEPT_EVOLUTION.md). Each episode is a separate `story` row in the DB, linked via `series_id`. The Immersive Reader must support chapter stories as P0 for Beta.

### 7.2 Chapter title page

When opening an episode that is part of a series (`story.series_id` is not null), the reader inserts a **Chapter Title Page** before the first text page:

```
┌──────────────────┐
│                  │
│                  │
│  Chapter 2       │  ← "Kapitel 2" / "Chapitre 2" (localized)
│                  │
│  The Challenge   │  ← Episode title (story.title)
│                  │
│ ┌──────────────┐ │
│ │  COVER IMG   │ │  ← Episode cover image
│ │              │ │
│ └──────────────┘ │
│                  │
│            1 / 5 │  ← "Chapter 1 of 5"
└──────────────────┘
```

### 7.3 Chapter progress indicator

In addition to the per-page progress bar, chapter stories show a **chapter indicator** above the progress bar:

```
Chapter 2 of 5                    ← Chapter level
▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬     ← Page level (within this chapter)
```

### 7.4 Quiz gate for chapter stories

After the last text page of a chapter story episode:

1. **Quiz pages appear** (using existing `ComprehensionQuiz` logic, rendered as reader pages)
2. **Pass threshold**: Uses `point_settings.quiz_pass_threshold` (currently 80%)
3. **If passed**: Chapter complete → show chapter completion screen → "Start next chapter" button
4. **If not passed**: Encouraging message + "Read the chapter again 📖" → navigates back to page 1 of current episode
5. **Single stories**: Quiz remains optional (button on end screen, not mandatory)

### 7.5 Chapter completion → next chapter flow

```
[Quiz passed]
    ↓
[Chapter completion screen]
    "Chapter 2 complete! 🎉"
    ⭐ Stars animation
    ↓
[If NOT last chapter]
    → "Start next chapter ➡️" button
    → (Mode B / "Mitgestalten": direction choice UI first, then generation)
    → Loads next episode's story via series_id + episode_number + 1

[If LAST chapter]
    → Series completion screen
    → "series_completed" special badge triggered
    → "My Stories 📚" button (overview)
    → "Start new chapter story 📖" button
```

### 7.6 Data requirements

The reader needs these fields from the story:
- `story.series_id` — null = single story, non-null = chapter story
- `story.episode_number` — current chapter (1-based)
- `story.series_episode_count` — total chapters (from STORY_KONZEPT_EVOLUTION: field to be added)
- `story.ending_type` — A (complete), B (open), C (cliffhanger)

To load the next episode:
```sql
SELECT * FROM stories
WHERE series_id = :current_series_id
AND episode_number = :current_episode + 1
LIMIT 1;
```

---

## 8. Completion Flow & Gamification

### 8.1 Single story — end screen

After the last text page (or after optional quiz):

**Inline on end screen:**
- Stars animation: `log_activity('story_read', 1)` → show `stars_earned`
- If quiz was taken: additional stars from `log_activity('quiz_complete', quizStars)`
- Streak display: "🔥 Day 5!" (from `current_streak`)
- Weekly bonus if applicable: "+3 bonus stars! (3 stories this week)" (from `weekly_bonus`)
- Total stars count (from `total_stars`)

**Modal overlays (existing components, same cascade as current ReadingPage):**
- `BadgeCelebrationModal` — if `new_badges[]` is not empty in `log_activity` response
- `LevelUpOverlay` — if level-up triggered (from `useGamification` hook)

**Timing cascade:**
1. End screen appears with inline star animation (1.5s)
2. After animation: BadgeCelebrationModal if applicable (user dismisses)
3. After badge: LevelUpOverlay if applicable (user dismisses)
4. Return to end screen with action buttons visible

**Buttons on end screen:**
- 📝 "Start Quiz" (prominent, if quiz not yet taken)
- 📖 "New Story"
- ↺ "Read Again"

### 8.2 Chapter story (episodes 1 to N-1) — chapter end screen

Same gamification cascade as single story, plus:
- ➡️ "Start Next Chapter" button (primary action, most prominent)
- No "New Story" button (story isn't finished yet)

### 8.3 Chapter story (last episode) — series completion screen

- All stars from the entire series summarized
- `series_completed` special badge (exists in badge system)
- 📚 "My Stories" button (primary)
- 📖 "Start New Chapter Story" button (secondary)

### 8.4 RPC calls from the reader

```typescript
// After story read:
const readResult = await supabase.rpc('log_activity', {
  p_child_id: kidProfile.id,
  p_activity_type: 'story_read',
  p_stars: 1,
  p_metadata: { story_id: story.id }
});

// After quiz complete:
const quizResult = await supabase.rpc('log_activity', {
  p_child_id: kidProfile.id,
  p_activity_type: 'quiz_complete',
  p_stars: quizStars, // 0, 1, or 2
  p_metadata: {
    story_id: story.id,
    score_percent: correctCount / totalCount * 100,
    correct_count: correctCount,
    total_count: totalCount
  }
});
```

Both return JSONB with: `total_stars`, `stars_earned`, `bonus_stars`, `weekly_bonus`, `current_streak`, `weekly_stories_count`, `new_badges[]`.

---

## 9. Responsive Behavior

### 9.1 Breakpoints

| Mode | Detection | Layout |
|------|-----------|--------|
| **Phone** | width ≤ 640px | Vertical: image top, text bottom |
| **Small Tablet** | 641–1024px AND portrait | Vertical with more padding |
| **Large Tablet Landscape** | ≥1025px OR (landscape AND short side ≥600px) | Spread: image + text side by side |

### 9.2 Detection hook

```typescript
function useImmersiveLayout(): 'phone' | 'small-tablet' | 'landscape-spread' {
  // Uses window.innerWidth, window.innerHeight, and orientation
  // Re-evaluates on resize and orientationchange events
  // Returns the appropriate layout mode
}
```

### 9.3 Orientation change behavior

When the device orientation changes:

1. **Save current paragraph anchor**: the index of the first paragraph visible on the current page
2. **Re-run content splitter** with new `maxWordsPerPage` (landscape allows more words per spread)
3. **Navigate to the page containing the anchored paragraph**
4. **Rule: NEVER jump forward.** The anchored paragraph is the *last* paragraph the user has read. The new page must contain this paragraph — showing previously-read text is acceptable, skipping unread text is not.

```typescript
// usePagePosition hook
const [paragraphAnchor, setParagraphAnchor] = useState(0);

// On page change: update anchor to last paragraph on current page
// On re-split: find page containing paragraphAnchor, navigate there
```

### 9.4 Phone landscape

**Ignored.** Children don't hold phones horizontally to read. No special handling needed. The phone vertical layout simply stretches.

### 9.5 Fullscreen

**Optional fullscreen button** in the reader toolbar. Uses the Fullscreen API when available. No auto-fullscreen on open.

```typescript
function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    readerRef.current?.requestFullscreen();
  }
}
```

---

## 10. Premium Tier Logic

### 10.1 Beta approach

For Beta: the landing page shows pricing tiers (€4.99 / €9.99). The user selects a tier during signup. This is stored but **not yet payment-gated** — it's a preference that controls image count.

Post-Beta: tier becomes account-bound with actual payment integration.

### 10.2 Reader behavior by tier

| Tier | Max images per story | Generation | Reader |
|------|---------------------|------------|--------|
| Standard (€4.99) | 4 (cover + 3 scenes) | Generates 4 images | Shows 4 images, rest are gradient pages |
| Premium (€9.99) | 6 (cover + 5 scenes) | Generates 6 images | Shows 6 images, fewer gradient pages |

### 10.3 Implementation

The reader receives `accountTier` as a prop (or from context/hook). It uses this to determine how many images from the story's image array to display:

```typescript
const maxImages = IMAGE_LIMITS[accountTier] || 4;
const visibleImages = allImages.slice(0, maxImages);
```

Pages that would have an image under a higher tier but don't → themed gradient. This is a natural upsell moment.

### 10.4 Upsell hint (P1, not for Beta)

In a future iteration: on gradient pages that *would* have an image on premium, show a subtle hint: "🖼️ Unlock more illustrations with Premium". Not for Beta.

---

## 11. Explicit Exclusions

The following features are **explicitly NOT in scope** for this spec and must NOT be implemented:

| Feature | Reason | When instead |
|---------|--------|-------------|
| Audio / TTS (read-aloud) | Separate project (ElevenLabs integration) | Post-Beta, own spec |
| Voice Input (child reads aloud) | Fragile (Gladia), marked as "hide" in launch plan | Post-Beta |
| 3D page-curl animation | Overengineered, Kindle-slide is sufficient | Likely never |
| Offline mode | PWA/caching is a separate topic | Post-launch |
| Annotations / highlighting | Complex feature | P2+ |
| Parent co-reading mode | Very complex | P2+ |
| Dark mode | Children read during daytime | P1 |
| Share button | Not critical for Beta | P1 |
| Collectibles in reader | Tables exist but flow not active | Post-Beta |
| Bookmarks / "Continue at page X" | Marked as P2 in story concept doc | Post-Beta |
| SVG silhouettes on text-only pages | Gradient is sufficient for Beta | P1 (15–20 pre-made SVGs) |
| Horizontal text scrolling | Text never scrolls, always paginated | Never |

---

## 12. Open Items / TBD

| Item | Status | Owner |
|------|--------|-------|
| Final words-per-page ranges by age | Waiting for Johann's input | Johann |
| Exact gradient colors per theme | Needs design pass | Johann / Design |
| Syllable coloring library choice | CC to evaluate `hyphen` vs `hypher` vs alternatives | Claude Code |
| `series_episode_count` DB field | Needs migration (from STORY_KONZEPT_EVOLUTION) | Claude Code |
| `target_paragraph` prompt integration | Needs prompt change in story generation | Claude Code |
| Hyphenation pattern quality per language | Test all 7 languages for accuracy | Testing |
| Quiz rendering as reader pages | Adapt existing ComprehensionQuiz for page-by-page display | Claude Code → Cursor |

---

## Appendix A: Current Data Model (relevant fields)

### `stories` table — fields used by the reader

```
id                    UUID PK
title                 TEXT
content               TEXT          -- Full story text (\n\n separated paragraphs)
cover_image_url       TEXT          -- Cover image URL
story_images          JSONB/TEXT[]  -- Scene image URLs (0-3 currently)
image_count           INTEGER
text_language         TEXT          -- For syllable coloring language selection
series_id             UUID          -- null = single story, non-null = chapter story
episode_number        INTEGER       -- 1-based (1-7)
series_episode_count  INTEGER       -- TBD: total episodes (needs migration)
ending_type           ending_type   -- A/B/C
concrete_theme        TEXT          -- For gradient color mapping
kid_profile_id        UUID FK
```

### `image_plan` — updated interface

```typescript
interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: Array<{
    scene_id: number;
    story_position: string;
    description: string;
    emotion: string;
    key_elements: string[];
    target_paragraph: number;  // NEW
  }>;
}
```

### Gamification — used in completion flow

```
log_activity(p_child_id, p_activity_type, p_stars, p_metadata) → JSONB
  Returns: total_stars, stars_earned, bonus_stars, weekly_bonus,
           current_streak, weekly_stories_count, new_badges[]
```

---

## Appendix B: Localization Keys (new)

The Immersive Reader needs these new translation keys:

```
immersive.hint_tap_to_continue    → "Tap to continue reading →"
immersive.page_counter            → "{current} / {total}"
immersive.chapter_of              → "Chapter {current} of {total}"
immersive.chapter_complete        → "Chapter {number} complete! 🎉"
immersive.series_complete         → "Story complete! 🎉"
immersive.start_next_chapter      → "Start next chapter ➡️"
immersive.quiz_required           → "Answer the quiz to unlock the next chapter"
immersive.quiz_not_passed         → "Read the chapter again and try the quiz once more 📖"
immersive.read_again              → "Read again"
immersive.new_story               → "New story"
immersive.start_quiz              → "Start Quiz 📝"
immersive.my_stories              → "My Stories 📚"
immersive.fullscreen              → "Fullscreen"
immersive.syllables_on            → "Syllable colors ON"
immersive.syllables_off           → "Syllable colors OFF"
immersive.font_small              → "Small"
immersive.font_medium             → "Medium"
immersive.font_large              → "Large"
```

All keys must be translated in 7 languages (DE, FR, EN, ES, NL, IT, BS).
