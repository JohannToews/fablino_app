# Cursor Implementation Tasks: Fablino Immersive Reader

> Generated from `SPEC_immersive_reader.md` on 2026-02-17
> Total: 19 Tasks in 5 Phasen

---

## Phase 1: Foundation (Hooks + Utilities)

### Task 1: `useImmersiveLayout` Hook erstellen

**Datei:** `src/components/immersive-reader/useImmersiveLayout.ts` (neu)

**Was:** Custom Hook der den aktuellen Layout-Modus erkennt und bei Resize/Orientation-Change aktualisiert.

**Return-Typ:** `'phone' | 'small-tablet' | 'landscape-spread'`

**Breakpoints:**
- `phone`: viewport width ≤ 640px
- `small-tablet`: 641–1024px AND portrait
- `landscape-spread`: ≥1025px ODER (landscape AND short side ≥600px)

**Details:**
- Listener auf `resize` und `orientationchange` Events
- Debounce von ~100ms auf resize
- Nutzt `window.innerWidth`, `window.innerHeight`
- Exportiere auch die Breakpoint-Konstanten als benannte Exports

**Acceptance Criteria:**
- [ ] Hook returned korrekten Modus für alle 3 Breakpoints
- [ ] Modus aktualisiert sich live bei Resize/Orientation-Change
- [ ] Kein Memory-Leak (Listener-Cleanup in useEffect return)

---

### Task 2: `useContentSplitter` Hook erstellen

**Datei:** `src/components/immersive-reader/useContentSplitter.ts` (neu)

**Was:** Hook der den Story-Text (`content`) in Pages aufteilt, basierend auf Alter und Font-Size.

**Inputs:**
- `content: string` — Story-Text mit `\n\n`-separierten Paragraphen
- `age: number` — Alter des Kindes (aus `kidProfile`)
- `fontSizeSetting: 'small' | 'medium' | 'large'` — Schriftgrößen-Setting
- `imagePositions: number[]` — Paragraph-Indizes die ein Bild haben

**Algorithmus (aus Spec §3.3):**
1. Split `content` by `\n\n`, filter leere Strings
2. Max Words/Page nach Alter:
   - 5–7: 50 (Mitte des Bereichs 40–60)
   - 8–9: 75 (Mitte 60–90)
   - 10–11: 105 (Mitte 90–120)
   - 12+: 140 (Mitte 120–160)
3. Font-Size Adjustment: Small → +20%, Large → -20%
4. Iteriere Paragraphen, fülle Pages bis `maxWordsPerPage`
5. Overflow: Paragraph > maxWords → split at sentence boundary (`. ` / `! ` / `? `)
6. Validation: < 3 Pages → reduce maxWords by 30%, re-split

**Return-Typ:**
```typescript
interface ImmersivePage {
  paragraphs: string[];
  hasImage: boolean;
  imageIndex?: number; // Index in die sichtbare Image-Array
  type: 'text-only' | 'image-text' | 'chapter-title' | 'quiz' | 'end-screen';
}
```

**Acceptance Criteria:**
- [ ] Korrektes Splitting für alle Altersgruppen
- [ ] Sentence-Boundary-Splitting für Overflow-Paragraphen
- [ ] Minimum 3 Pages Validation
- [ ] Re-berechnet bei Änderung von age/fontSize/content
- [ ] Leere Paragraphen werden gefiltert
- [ ] Kein Split mid-sentence

---

### Task 3: `usePagePosition` Hook erstellen

**Datei:** `src/components/immersive-reader/usePagePosition.ts` (neu)

**Was:** Hook der die aktuelle Page trackt und bei Re-Layout (Orientation Change) den Paragraph-Anchor nutzt um die richtige Page zu finden.

**State:**
- `currentPage: number`
- `paragraphAnchor: number` — Index des letzten gelesenen Paragraphen

**Methoden:**
- `goToPage(pageIndex: number)` — Setzt currentPage + aktualisiert paragraphAnchor
- `goNext()` / `goPrev()` — Convenience-Methoden
- `findPageForAnchor(pages: ImmersivePage[])` — Findet die Page die den Anchor enthält

**Regel aus Spec §9.3:** "NEVER jump forward" — nach Re-Split muss die neue Page den Anchor-Paragraphen enthalten. Wenn der Anchor auf einer früheren Page liegt, ist das OK (User liest etwas nochmal). Wenn der Anchor auf einer späteren Page wäre, ist das ein Bug.

**Acceptance Criteria:**
- [ ] paragraphAnchor wird bei jeder Page-Navigation aktualisiert
- [ ] Nach Re-Split springt der Reader zur korrekten Page
- [ ] Niemals forward-jump nach Re-Layout

---

### Task 4: Bild-Platzierung Utilities

**Datei:** `src/components/immersive-reader/imageUtils.ts` (neu)

**Was:** Utility-Funktionen für Bild-Platzierung und Tier-basierte Bild-Limits.

**Funktionen:**

```typescript
// 1. Extrahiere target_paragraph aus image_plan (neue Stories)
function getImagePositionsFromPlan(imagePlan: ImagePlan | null, paragraphCount: number): number[]

// 2. Fallback: Gleichmäßige Verteilung (alte Stories ohne target_paragraph)
function distributeImagesEvenly(totalParagraphs: number, imageCount: number): number[]

// 3. Sichtbare Bilder nach Account-Tier
const IMAGE_LIMITS: Record<string, number> = {
  free: 4,
  standard: 4,
  premium: 6,
};
function getVisibleImages(allImages: string[], accountTier: string): string[]

// 4. Landscape-Alternation: Image-Seite bestimmen
function getImageSide(imagePageIndex: number): 'left' | 'right'
// → 0: left, 1: right, 2: left, ...
```

**Bezug zur bestehenden Codebase:**
- `ImagePlan` Interface liegt in `supabase/functions/_shared/imagePromptBuilder.ts` — daraus den Typ importieren oder im Frontend duplizieren (Supabase-Functions sind nicht direkt importierbar)
- Die bestehende `getImageInsertionMap()` in `ReadingPage.tsx` (ca. Zeile 340) macht ähnliches — diese Logik als Referenz nutzen aber für die neue Page-basierte Struktur anpassen

**Acceptance Criteria:**
- [ ] target_paragraph Extraktion funktioniert für neue Stories
- [ ] Fallback-Verteilung funktioniert für alte Stories (ohne target_paragraph)
- [ ] IMAGE_LIMITS korrekt für free/standard/premium
- [ ] Landscape-Alternation korrekt (left/right/left/...)

---

### Task 5: Themed Color Gradients + Typ-Definitionen

**Datei:** `src/components/immersive-reader/constants.ts` (neu)

**Was:** Alle Konstanten und shared Types für den Immersive Reader.

**Inhalt:**

```typescript
// Theme-Gradienten für Text-Only Pages
export const THEME_GRADIENTS: Record<string, string> = {
  magic_fantasy:    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  adventure_action: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  real_life:        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  surprise:         'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
};

// Altersabhängige Typografie-Defaults
export const AGE_TYPOGRAPHY: Record<string, {...}> = { ... };

// Words-per-page Defaults
export const WORDS_PER_PAGE: Record<string, number> = { ... };

// Syllable-Farben
export const SYLLABLE_COLORS = {
  even: '#2563EB', // blue
  odd: '#DC2626',  // red
};

// Fablino Teal
export const FABLINO_TEAL = '#1A9A8A';
```

**Typ-Definitionen:**
```typescript
export interface ImmersivePage { ... }  // wie in Task 2 definiert
export interface ImmersiveReaderProps {
  story: Story;
  kidProfile: KidProfile;
  accountTier: string;
  onComplete: () => void;
}
```

**Acceptance Criteria:**
- [ ] Alle Konstanten aus der Spec korrekt übernommen
- [ ] Types exportiert und in allen anderen Immersive-Reader-Dateien nutzbar

---

## Phase 2: Core Components

### Task 6: `ImmersivePageRenderer` — Einzelne Page rendern

**Datei:** `src/components/immersive-reader/ImmersivePageRenderer.tsx` (neu)

**Was:** Rendert eine einzelne Page basierend auf ihrem Typ und dem Layout-Modus.

**Props:**
```typescript
interface ImmersivePageRendererProps {
  page: ImmersivePage;
  layoutMode: 'phone' | 'small-tablet' | 'landscape-spread';
  imageUrl?: string;
  imageSide?: 'left' | 'right';
  storyTheme: string;
  fontSize: number;         // px-Wert (berechnet aus Alter + Setting)
  lineHeight: number;
  letterSpacing: string;
  syllableMode: boolean;
  storyLanguage: string;
  onWordTap: (word: string) => void;
}
```

**Layouts (aus Spec §2.2):**

1. **Phone / Small-Tablet (vertikal):**
   - Image + Text: Bild oben (~50% viewport height), Gradient-Fade, Text unten
   - Text Only: Themed Gradient oben (kleiner, als Akzent), Text unten
   - Small-Tablet: Mehr Padding (32px statt 20px), Bild ~55% height

2. **Landscape-Spread:**
   - Image + Text: Side-by-side, `imageSide` bestimmt links/rechts
   - Text Only: Full-width zentrierter Text

**Text-Rendering:**
- Jedes Wort als eigenes `<span>` mit `onClick` → `onWordTap(word)`
- Wörter < 3 Zeichen oder Stop-Words: NICHT klickbar (bestehende Logik aus ReadingPage übernehmen)
- Wenn `syllableMode=true`: Syllable-Sub-Spans mit alternierenden Farben (blue/red)
- Wenn `syllableMode=false`: Nur Word-Spans ohne Syllable-Sub-Spans

**Gradient-Fade für Bilder:** CSS `background: linear-gradient(transparent 80%, var(--bg-color) 100%)` über das Bild gelegt.

**Bestehende Referenz:** `renderFormattedText()` in `ReadingPage.tsx` (ab ~Zeile 1335) — ähnliche Wort-Rendering-Logik, aber dort als eine große Funktion. Extrahiere und refactore die Wort-Rendering-Logik.

**Acceptance Criteria:**
- [ ] Image+Text Page rendert korrekt in allen 3 Layout-Modi
- [ ] Text-Only Page rendert korrekt in allen 3 Layout-Modi
- [ ] Gradient-Fade über Bildern funktioniert
- [ ] Themed Color-Gradient auf Text-Only Pages
- [ ] Jedes Wort ist als Span klickbar
- [ ] Syllable-Coloring togglebar

---

### Task 7: `ImmersiveNavigation` — Tap-Zonen, Swipe, Keyboard

**Datei:** `src/components/immersive-reader/ImmersiveNavigation.tsx` (neu)

**Was:** Wrapper-Komponente die Navigation-Events handled.

**Navigation-Inputs (Spec §5.1):**
| Input | Aktion |
|-------|--------|
| Tap rechts (70% der Breite) | Next Page |
| Tap links (30%) | Previous Page |
| Swipe left | Next Page |
| Swipe right | Previous Page |
| Keyboard → / Space | Next Page |
| Keyboard ← | Previous Page |

**Kritisch:** "Tap on a word ≠ navigation" — Der Navigation-Handler feuert NUR wenn das Tap-Target KEIN Word-Span ist. Prüfe `e.target` auf `data-word` Attribut oder CSS-Klasse.

**Swipe-Detection:**
- Touch-basiert: `touchstart` → `touchend`, Differenz > 50px = Swipe
- Richtung: Δx > 0 = swipe right (prev), Δx < 0 = swipe left (next)

**Prop: `disabled: boolean`** — Wenn true (z.B. Word-Sheet offen), keine Navigation.

**Acceptance Criteria:**
- [ ] Tap-Zonen korrekt (links 30%, rechts 70%)
- [ ] Swipe-Detection funktioniert auf Touch-Geräten
- [ ] Keyboard-Navigation funktioniert
- [ ] Word-Taps lösen KEINE Navigation aus
- [ ] Navigation ist deaktivierbar (für Bottom-Sheet)

---

### Task 8: `ImmersiveProgressBar` — Fortschrittsanzeige

**Datei:** `src/components/immersive-reader/ImmersiveProgressBar.tsx` (neu)

**Was:** Sticky Fortschrittsbalken am oberen Rand.

**Design (Spec §5.3):**
- Segmentierter Balken (ein Segment pro Page)
- Gefüllte Segmente = besuchte Pages
- Farbe: Fablino Teal `#1A9A8A`
- Page-Counter rechts: "3 / 8"
- Für Chapter-Stories: "Kapitel 2 von 5" Label ÜBER dem Balken (lokalisiert)

**Props:**
```typescript
interface ImmersiveProgressBarProps {
  currentPage: number;
  totalPages: number;
  chapterNumber?: number;   // null bei Single Stories
  totalChapters?: number;
  language: string;
}
```

**Acceptance Criteria:**
- [ ] Segmente korrekt gerendert
- [ ] Aktuelle + besuchte Segmente gefüllt
- [ ] Page-Counter angezeigt
- [ ] Chapter-Label bei Chapter-Stories angezeigt
- [ ] Sticky am oberen Viewport-Rand

---

### Task 9: `ImmersiveWordSheet` — Bottom Sheet für Worterklärungen

**Datei:** `src/components/immersive-reader/ImmersiveWordSheet.tsx` (neu)

**Was:** Bottom Sheet das von unten einslided wenn ein Wort getippt wird.

**Verhalten (Spec §5.5):**
1. Getipptes Wort wird highlighted (Background-Color)
2. Sheet slided von unten ein (300ms, ease-out)
3. Sheet-Inhalt:
   - Fablino Fox Mascot Icon (bestehende `FablinoMascot` Komponente oder 🦊)
   - Wort in Bold
   - Erklärungstext (via `explain-word` Edge Function)
   - Loading-State während API-Call
   - "Speichern" Button → `marked_words` Tabelle
   - "✕" Close Button
4. Dismiss: Tap ✕, Tap außerhalb, Swipe-Down
5. Während Sheet offen: Page-Navigation disabled

**Integration:**
- Nutzt dieselbe `explain-word` Edge Function wie die aktuelle ReadingPage
- Language kommt aus `story.text_language`
- Explanation Language kommt aus `kid_profiles.explanation_language`
- Speichern: Insert in `marked_words` (gleiche Logik wie `handleSaveExplanation()` in ReadingPage.tsx ~Zeile 1252)

**Bestehende UI-Komponente:** Das Projekt hat `shadcn/ui Drawer` (`src/components/ui/drawer.tsx`) — prüfe ob das als Bottom-Sheet nutzbar ist (basiert auf Vaul). Falls ja: nutze es. Falls nein: eigene Bottom-Sheet-Implementierung.

**Props:**
```typescript
interface ImmersiveWordSheetProps {
  word: string | null;       // null = Sheet geschlossen
  storyId: string;
  storyLanguage: string;
  explanationLanguage: string;
  onClose: () => void;
  onSaved: () => void;       // Callback nach erfolgreichem Speichern
}
```

**Acceptance Criteria:**
- [ ] Sheet slided korrekt ein/aus
- [ ] Loading-State während explain-word API-Call
- [ ] Erklärung wird angezeigt
- [ ] Speichern-Button schreibt in marked_words
- [ ] Dismiss via ✕, Tap-Outside, Swipe-Down
- [ ] Navigation disabled während Sheet offen

---

### Task 10: Syllable-Coloring Implementierung

**Datei:** `src/components/immersive-reader/useSyllableColoring.ts` (neu)

**Was:** Hook + Rendering-Logik für Leselöwen-style Silbenfarben.

**Bibliothek evaluieren:**
- Option A: `hyphen` npm Package
- Option B: `hypher` mit TeX-Patterns
- Option C: Alternative evaluieren
- **Anforderung:** Muss DE, FR, EN, ES, NL, IT, BS Patterns unterstützen

**Installation:** `npm install <gewählte-lib>` + ggf. Language-Pattern-Packages

**Hook:**
```typescript
function useSyllableColoring(language: string, enabled: boolean) {
  // Lädt die Hyphenation-Patterns für die Sprache
  // Returned eine Funktion: (word: string) => string[] (Syllable-Array)
}
```

**Rendering (aus Spec §6.4):**
```tsx
// Jede Silbe als Span mit alternierenden Farben
<span className="syllable-blue">{syl}</span>  // #2563EB
<span className="syllable-red">{syl}</span>    // #DC2626
```

**Zusammenspiel mit Word-Tap:** Word-Span wrapped Syllable-Spans. Click auf eine Syllable → onClick des Parent-Word-Span fired.

**Bestehende Referenz:** `SyllableText.tsx` existiert bereits aber ist "disabled for now" und nur für Deutsch. Die neue Implementierung soll alle 7 Sprachen abdecken.

**Acceptance Criteria:**
- [ ] Hyphenation-Bibliothek installiert und konfiguriert
- [ ] Silbentrennung funktioniert für alle 7 Sprachen (DE, FR, EN, ES, NL, IT, BS)
- [ ] Alternierende Farben korrekt
- [ ] Toggle ON/OFF funktioniert
- [ ] Word-Tap funktioniert auch mit Syllable-Spans

---

### Task 11: Altersabhängige Typografie

**Datei:** Logik in `src/components/immersive-reader/constants.ts` (erweitern) + `ImmersiveReader.tsx`

**Was:** Font-Size, Line-Height und Letter-Spacing basierend auf Alter + manueller Einstellung.

**Defaults (Spec §6.2):**

| Alter | Font-Size (px) | Line-Height | Letter-Spacing |
|-------|---------------|-------------|----------------|
| 5–7   | 24            | 1.8         | 0.3px          |
| 8–9   | 21            | 1.7         | 0.2px          |
| 10–11 | 19            | 1.65        | 0.1px          |
| 12+   | 17            | 1.6         | 0              |

**Manuelle Anpassung (Spec §6.3):**
- Small: -3px vom Alters-Default
- Medium: 0 (Default)
- Large: +3px

**Toolbar:** 3 Buttons (Small / Medium / Large) im Reader-Toolbar. Toolbar ist collapsible/hideable.

**Funktion:**
```typescript
function getTypographyForAge(age: number, setting: 'small' | 'medium' | 'large'): {
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
}
```

**Acceptance Criteria:**
- [ ] Korrekte Defaults für alle Altersgruppen
- [ ] Small/Medium/Large Offset korrekt
- [ ] Toolbar UI mit 3 Buttons
- [ ] Toolbar collapsible

---

## Phase 3: Orchestrator + Integration

### Task 12: `ImmersiveReader.tsx` — Haupt-Orchestrator

**Datei:** `src/components/immersive-reader/ImmersiveReader.tsx` (neu)

**Was:** Haupt-Komponente die alle Sub-Komponenten zusammenbringt.

**Props:**
```typescript
interface ImmersiveReaderProps {
  story: Story;
  kidProfile: KidProfile;
  accountTier: string;
  onComplete: () => void;
}
```

**Orchestrierung:**
1. `useImmersiveLayout()` → layoutMode
2. `useContentSplitter(story.content, kidProfile.age, fontSizeSetting, imagePositions)` → pages
3. `usePagePosition(pages)` → currentPage, goNext, goPrev, etc.
4. Image-Positionen berechnen (imageUtils)
5. Page-Transition-Animation (CSS transform, horizontal slide)
6. Toolbar rendern (Font-Size, Syllable-Toggle, Fullscreen-Button)
7. Fullscreen API Integration (Spec §9.5)

**Page-Transition (Spec §5.2):**
- Horizontal Slide (Kindle-style)
- Duration: 300ms
- Easing: ease-out
- CSS: `transform: translateX(±100%)` mit `transition`

**Navigation-Hint (Spec §5.4):**
- Nur auf Page 1, beim ersten Mal
- "Tap to continue reading →" (lokalisiert)
- Subtle Bounce-Animation
- Verschwindet nach erster Navigation oder nach 5 Sekunden
- LocalStorage-Flag um "erstes Mal" zu tracken

**Re-Layout bei Orientation Change (Spec §9.3):**
1. paragraphAnchor speichern
2. Content-Splitter re-run (neues maxWordsPerPage für landscape)
3. Zur Page mit Anchor-Paragraph navigieren

**Acceptance Criteria:**
- [ ] Alle Sub-Komponenten korrekt orchestriert
- [ ] Page-Transition smooth (300ms horizontal slide)
- [ ] Re-Layout bei Orientation Change ohne Forward-Jump
- [ ] Toolbar funktional (Font-Size, Syllable, Fullscreen)
- [ ] Navigation-Hint auf Page 1 beim ersten Mal

---

### Task 13: `ImmersiveChapterTitle` — Kapitel-Titelseite

**Datei:** `src/components/immersive-reader/ImmersiveChapterTitle.tsx` (neu)

**Was:** Rendert die Kapitel-Titelseite für Chapter Stories.

**Wann:** Wenn `story.series_id !== null`, wird VOR der ersten Text-Page eine Chapter-Title-Page eingefügt.

**Inhalt (Spec §7.2):**
- "Kapitel {n}" / "Chapter {n}" / "Chapitre {n}" (lokalisiert)
- Episode-Titel (`story.title`)
- Cover-Bild (`story.cover_image_url`)
- "Kapitel 1 von 5" Label

**Props:**
```typescript
interface ImmersiveChapterTitleProps {
  chapterNumber: number;
  totalChapters: number;
  title: string;
  coverImageUrl: string | null;
  language: string;
}
```

**Acceptance Criteria:**
- [ ] Layout korrekt (zentriert, visuell ansprechend)
- [ ] Lokalisierung für alle 7 Sprachen
- [ ] Cover-Bild angezeigt (oder Fallback wenn null)

---

### Task 14: Integration in ReadingPage.tsx

**Datei:** `src/pages/ReadingPage.tsx` (bestehend, editieren)

**Was:** Toggle zwischen Classic Mode und Immersive Reader.

**Änderungen:**
1. Neuer State: `const [viewMode, setViewMode] = useState<'classic' | 'immersive'>('immersive');`
2. URL-Param Override: `?mode=classic` → setViewMode('classic')
3. Toggle-Button in der UI um zwischen Modi zu wechseln
4. Wenn `viewMode === 'immersive'`: `<ImmersiveReader story={story} kidProfile={kidProfile} onComplete={handleComplete} />`
5. Wenn `viewMode === 'classic'`: Bestehende ReadingPage-UI (in eine eigene Komponente extrahieren oder mit Conditional Rendering)

**Bestehende Logik die der ImmersiveReader NICHT duplizieren sondern NUTZEN soll:**
- `useAuth()`, `useKidProfile()` — Auth + Profil
- `useGamification()` — Gamification-State
- `fetchStory()` — Story-Laden aus Supabase
- `log_activity` RPC Calls — Completion-Tracking
- `explain-word` Edge Function — Word-Erklärungen
- `marked_words` — Wort-Speichern

**Acceptance Criteria:**
- [ ] Default-Modus ist 'immersive'
- [ ] `?mode=classic` wechselt zum Classic Mode
- [ ] Toggle-Button funktioniert
- [ ] Bestehende Classic-UI weiterhin vollständig funktional
- [ ] Story-Loading, Auth, Profile-Logik wird geteilt (nicht dupliziert)

---

## Phase 4: Completion Flow + Quiz

### Task 15: `ImmersiveQuizFlow` — Quiz als Reader-Pages

**Datei:** `src/components/immersive-reader/ImmersiveQuizFlow.tsx` (neu)

**Was:** Rendert Quiz-Fragen als individuelle Reader-Pages im Immersive Reader.

**Bestehende Referenz:** `ComprehensionQuiz.tsx` — Nutze die bestehende Fragen-Ladelogik und Antwort-Validierung, aber rendere jede Frage als eigene "Page" im Reader-Style.

**Verhalten (Spec §7.4):**
- Chapter Stories: Quiz ist PFLICHT nach der letzten Text-Page
- Single Stories: Quiz ist OPTIONAL (Button auf End-Screen)
- Pass Threshold: `point_settings.quiz_pass_threshold` (aktuell 80%)
- Bestanden → Chapter-Completion / End-Screen
- Nicht bestanden → Ermutigende Nachricht + "Kapitel nochmal lesen 📖" → zurück zu Page 1

**Pro Frage eine Page:**
- Frage-Text oben
- Antwort-Optionen als Buttons
- Visuelles Feedback bei Tap (richtig: grün, falsch: rot + kurzes Shake)
- Auto-Advance nach 1.5s zur nächsten Frage

**Props:**
```typescript
interface ImmersiveQuizFlowProps {
  storyId: string;
  storyLanguage: string;
  storyDifficulty?: string;
  isMandatory: boolean;       // true für Chapter Stories
  onComplete: (correctCount: number, totalCount: number) => void;
  onRetry: () => void;        // Navigiert zurück zu Page 1
}
```

**Acceptance Criteria:**
- [ ] Fragen werden aus DB geladen (gleiche Query wie ComprehensionQuiz)
- [ ] Eine Frage pro Page
- [ ] Visuelles Feedback bei Antwort
- [ ] Pass/Fail Logik korrekt
- [ ] Retry-Flow für Chapter Stories

---

### Task 16: `ImmersiveEndScreen` — Completion + Gamification

**Datei:** `src/components/immersive-reader/ImmersiveEndScreen.tsx` (neu)

**Was:** End-Screen nach der letzten Page / Quiz.

**3 Varianten (Spec §8):**

**A) Single Story End-Screen:**
- Stars-Animation (aus `log_activity` Response)
- Streak-Anzeige ("🔥 Tag 5!")
- Weekly Bonus wenn applicable
- Total Stars
- Buttons: "📝 Quiz starten" (prominent), "📖 Neue Geschichte", "↺ Nochmal lesen"

**B) Chapter End-Screen (Episode 1 bis N-1):**
- Gleiche Gamification wie A
- "➡️ Nächstes Kapitel starten" Button (prominent, primary)
- KEIN "Neue Geschichte" Button

**C) Series Completion (letztes Kapitel):**
- Alle Stars der gesamten Serie zusammengefasst
- `series_completed` Badge
- "📚 Meine Geschichten" Button (primary)
- "📖 Neue Kapitelgeschichte starten" Button (secondary)

**Timing-Cascade (Spec §8.1):**
1. End-Screen mit Star-Animation (1.5s)
2. `BadgeCelebrationModal` wenn `new_badges[]` nicht leer
3. `LevelUpModal` wenn Level-Up getriggert
4. Zurück zu End-Screen mit Action-Buttons

**RPC Calls (Spec §8.4):**
- `log_activity('story_read', 1, { story_id })` → Stars + Badges
- `log_activity('quiz_complete', quizStars, { story_id, score_percent, ... })` → Quiz-Stars

**Next-Chapter-Loading:**
```sql
SELECT * FROM stories
WHERE series_id = :current_series_id
AND episode_number = :current_episode + 1
LIMIT 1;
```

**Acceptance Criteria:**
- [ ] Alle 3 Varianten korrekt gerendert
- [ ] log_activity RPC Calls korrekt
- [ ] Gamification-Cascade (Stars → Badges → LevelUp)
- [ ] "Nächstes Kapitel" Button lädt nächste Episode
- [ ] Series-Completion Badge triggert bei letztem Kapitel

---

## Phase 5: Backend-Änderungen + Localization

### Task 17: `target_paragraph` in Story Generation Prompt

**Dateien:**
- `supabase/functions/_shared/imagePromptBuilder.ts` — `ImagePlan` Interface erweitern
- `supabase/functions/generate-story/index.ts` — Prompt anpassen
- `supabase/functions/_shared/promptBuilder.ts` — ggf. Prompt-Text anpassen

**Was:** Das `ImagePlan` Interface um `target_paragraph: number` erweitern und den Story-Generation-Prompt so anpassen, dass das LLM für jede Scene den `target_paragraph` (0-basierter Paragraph-Index) mitliefert.

**Prompt-Addition:**
```
For each scene in image_plan, include "target_paragraph": the 0-based index
of the paragraph in the story text that this image best illustrates.
Distribute images evenly across the story — do not cluster them.
```

**Acceptance Criteria:**
- [ ] `ImagePlan.scenes[].target_paragraph` Feld im Interface
- [ ] Prompt enthält Anweisung für target_paragraph
- [ ] Neue Stories liefern target_paragraph im image_plan
- [ ] Bestehende Stories ohne target_paragraph funktionieren weiterhin (Fallback)

---

### Task 18: `series_episode_count` DB-Migration

**Datei:** `supabase/migrations/YYYYMMDD_add_series_episode_count.sql` (neu)

**Was:** Sicherstellen dass das Feld `series_episode_count` in der `stories` Tabelle existiert und für bestehende Series-Stories korrekt befüllt ist.

**Prüfung zuerst:** Das Feld `series_episode_count` ist bereits in den Supabase Types definiert (`src/integrations/supabase/types.ts`). Prüfe ob das Feld in der DB bereits existiert oder nur im Type-File.

**Falls Migration nötig:**
```sql
-- Add series_episode_count if not exists
ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_episode_count INTEGER;

-- Backfill from existing data
UPDATE stories s
SET series_episode_count = (
  SELECT MAX(episode_number)
  FROM stories s2
  WHERE s2.series_id = s.series_id
)
WHERE s.series_id IS NOT NULL AND s.series_episode_count IS NULL;
```

**Acceptance Criteria:**
- [ ] Feld existiert in DB
- [ ] Bestehende Series-Stories haben korrekten Wert
- [ ] Neue Stories setzen das Feld bei Erstellung

---

### Task 19: Localization Keys hinzufügen

**Datei:** Neue lokale Label-Map in `ImmersiveReader.tsx` ODER Erweiterung von `src/lib/translations.ts`

**Empfehlung:** Dem Pattern der Codebase folgen — lokale Label-Map im ImmersiveReader (wie `readingLabels` in ReadingPage.tsx). Nicht `translations.ts` erweitern, da die Codebase lokale Maps pro Komponente nutzt.

**Keys (aus Spec Appendix B):**

```typescript
const immersiveLabels: Record<string, {
  tapToContinue: string;
  pageCounter: string;      // "{current} / {total}" Pattern
  chapterOf: string;        // "Kapitel {current} von {total}"
  chapterComplete: string;
  seriesComplete: string;
  startNextChapter: string;
  quizRequired: string;
  quizNotPassed: string;
  readAgain: string;
  newStory: string;
  startQuiz: string;
  myStories: string;
  fullscreen: string;
  syllablesOn: string;
  syllablesOff: string;
  fontSmall: string;
  fontMedium: string;
  fontLarge: string;
}> = {
  de: { ... },
  fr: { ... },
  en: { ... },
  es: { ... },
  nl: { ... },
  it: { ... },
  bs: { ... },
};
```

**Alle 7 Sprachen:** DE, FR, EN, ES, NL, IT, BS

**Acceptance Criteria:**
- [ ] Alle 17 Keys für alle 7 Sprachen übersetzt
- [ ] Labels werden im ImmersiveReader korrekt genutzt
- [ ] Sprache wird aus Story oder KidProfile bezogen

---

## Zusammenfassung: Task-Reihenfolge

```
Phase 1 (Foundation):  Task 1–5  → Parallel möglich
Phase 2 (Components):  Task 6–11 → Task 6+7 parallel, dann 8+9+10+11 parallel
Phase 3 (Orchestrator): Task 12–14 → Sequentiell (12 → 13 → 14)
Phase 4 (Completion):  Task 15–16 → 15 dann 16
Phase 5 (Backend):     Task 17–19 → Parallel möglich, unabhängig von Phase 1–4
```

**Abhängigkeiten:**
- Task 12 (Orchestrator) hängt von Tasks 1–11 ab
- Task 14 (ReadingPage Integration) hängt von Task 12 ab
- Task 16 (EndScreen) hängt von Task 15 (Quiz) ab
- Tasks 17–19 (Backend) können parallel zu Phase 1–4 laufen

**Nicht implementieren (Spec §11 Exclusions):**
- ❌ Audio/TTS
- ❌ Voice Input
- ❌ 3D Page-Curl
- ❌ Offline Mode
- ❌ Annotations/Highlighting
- ❌ Dark Mode
- ❌ Share Button
- ❌ Collectibles
- ❌ Bookmarks
- ❌ SVG Silhouettes (P1)
- ❌ Horizontal Scrolling
