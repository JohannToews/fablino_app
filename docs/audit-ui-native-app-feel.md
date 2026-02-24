# Fablino UI Audit — "Native App Feel"

Analyse der Fablino-App mit Fokus auf ein **Premium-natives iOS/Android-Feel** für Kinder 6–10 und deren Eltern. Stack: React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), Framer Motion. PWA, primär Tablets/Phones.

---

## 1. TIEFE & DIMENSIONALITÄT

### Status Quo

- **design-tokens.ts:** `FABLINO_STYLES` definiert nur `primaryButton` / `secondaryButton` als String-Klassen (rounded-2xl, transition-colors), **keine** Schatten, keine Active-States. `FABLINO_COLORS.card` enthält `shadow: '0 2px 8px rgba(...)'` — wird aber kaum zentral genutzt.
- **button.tsx (shadcn):** Standard-CVA mit `rounded-md`, `focus-visible:ring-2`, **kein** `active:scale`, kein Shadow, kleine Default-Größe (h-10). Viele Screens nutzen eigene `<button>` mit FABLINO_STYLES oder Inline-Klassen (z. B. CreateStoryPage, SpecialEffectsScreen: `rounded-2xl`, `shadow-lg`, `active:scale-[0.98]`).
- **card.tsx:** Nur `shadow-sm`, `rounded-lg`, `border` — flach, keine Elevation-Hierarchie.
- **CharacterTile:** Gut umgesetzt: `shadow-[0_2px_12px_...]`, `hover:shadow-[0_4px_20px_...]`, `active:scale-[0.97]`, `focus:ring-2`, Selected-Ring + orangefarbener Schatten.
- **index.css:** `.card-story` hat `shadow-card`, `hover:shadow-glow`, `hover:scale-[1.02]`; `.btn-kid` hat `shadow-soft`, `hover:shadow-card`, `active:scale-95`. Diese Klassen werden nicht überall genutzt.

### Gaps

- Keine einheitliche **Shadow-Hierarchie** (z. B. sm / md / lg / modal) in Tokens oder Tailwind.
- shadcn **Button** hat keine Press-States und keine kindgerechte Größe/Schatten.
- **Cards** wirken flach; Modals/Dialogs nutzen unterschiedliche Schatten.
- Viele Seiten mischen Inline-Styles mit Tokens; Buttons mal mit, mal ohne `active:scale`.

### Konkrete Verbesserungen

- **HIGH IMPACT:** Zentrale Press-States und Schatten für alle primären Buttons.
  - In `design-tokens.ts` erweitern:
  ```ts
  // design-tokens.ts – ergänzen
  export const FABLINO_SHADOWS = {
    button: '0 2px 8px rgba(45,24,16,0.12)',
    buttonHover: '0 4px 16px rgba(232,134,58,0.25)',
    buttonActive: '0 1px 4px rgba(45,24,16,0.15)',
    card: '0 2px 12px -4px rgba(45,24,16,0.1)',
    cardHover: '0 8px 24px -8px rgba(45,24,16,0.15)',
    modal: '0 20px 50px -12px rgba(45,24,16,0.2)',
  } as const;
  export const FABLINO_STYLES = {
    primaryButton: 'h-14 min-h-[44px] w-full max-w-md text-lg font-semibold rounded-2xl bg-[#E8863A] text-white shadow-[0_2px_8px_rgba(45,24,16,0.12)] hover:bg-[#D4752E] hover:shadow-[0_4px_16px_rgba(232,134,58,0.25)] active:scale-[0.98] active:shadow-[0_1px_4px_rgba(45,24,16,0.15)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8863A] focus-visible:ring-offset-2',
    secondaryButton: 'h-14 min-h-[44px] w-full max-w-md text-lg font-semibold rounded-2xl bg-white border-2 border-[#E8863A] text-[#E8863A] shadow-sm hover:bg-[#FFF8F0] hover:shadow-md active:scale-[0.98] transition-all duration-200',
    // ...
  };
  ```
  - Alle CTA-Buttons (Create Story, Weiter, etc.) über eine gemeinsame Klasse oder Button-Variante nutzen.

- **HIGH IMPACT:** Cards/Tiles konsistent erheben.
  - `card.tsx` um Varianten erweitern oder Utility-Klassen nutzen:
  ```tsx
  // Card mit Elevation-Option
  className={cn(
    "rounded-2xl border bg-card text-card-foreground transition-all duration-200",
    "shadow-[0_2px_12px_-4px_rgba(45,24,16,0.1)]",
    "hover:shadow-[0_8px_24px_-8px_rgba(45,24,16,0.15)] hover:-translate-y-0.5",
    "active:scale-[0.99]",
    className
  )}
  ```
  - Story-Cards auf StorySelectPage / Home mit derselben Logik (z. B. `.card-story` überall verwenden).

- **MEDIUM:** shadcn Button um "kid" Variant ergänzen.
  - In `button.tsx`:
  ```ts
  kid: "h-14 min-h-[44px] rounded-2xl text-lg font-semibold bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98] transition-all duration-200",
  ```
  - Dann schrittweise Inline-Button-Klassen durch `<Button variant="kid">` ersetzen.

- **NICE-TO-HAVE:** Leichter innerer Schatten bei Primary-Buttons (iOS-ähnlich).
  - `box-shadow: inset 0 1px 0 rgba(255,255,255,0.2)` für leichten Glanz oben.

---

## 2. HINTERGRÜNDE & ATMOSPHÄRE

### Status Quo

- **body (index.css):** `background: linear-gradient(180deg, #FFF8F0 0%, #FEF1E1 50%, #FDE8D0 100%); background-color: #FFF8F0; background-attachment: fixed` — warmer Verlauf, konsistent mit FABLINO_COLORS.background.
- **Einzelne Seiten:** Meist nur `min-h-screen` ohne eigenen Hintergrund; CreateStoryPage, StorySelectPage, ResultsPage nutzen den globalen Body-Gradient. StorySelectPage TabsList: `bg-card/80 backdrop-blur-sm`. ReadingPage: teils `bg-[#FAFAF8]`, `bg-gradient-to-b from-[#FFF8F0] to-[#FEF1E1]`.
- **index.css** enthält zusätzlich `.gradient-hero` (ice-blue/ocean/sky) und `.gradient-admin` — eher blau/sportlich; **Fablino-Marke ist Orange**, daher Inkonsistenz mit design-tokens.

### Gaps

- Keine **Texturen** (Papier, Aquarell); alles flach.
- Kein einheitliches **Hintergrundkonzept** (CSS-Variablen in index.css sind blau, Body/Fablino sind warm).
- Kaum **räumliche Tiefe** (z. B. radiale Gradients, leichte Environment-Farben).
- Dark/Light-Variation nur über `.dark`; kein gezielter Kontrast Content vs. Hintergrund außer Cards.

### Konkrete Verbesserungen

- **HIGH IMPACT:** Marken-Farben und Hintergrund vereinheitlichen.
  - In `index.css` `:root` die primären HSL-Werte auf **Orange** umstellen (z. B. primary ≈ 25 85% 55%) und `--shadow-*` an Fablino anpassen. So nutzen shadcn-Komponenten automatisch Orange.
  - Body-Gradient beibehalten; optional einen **subtilen radialen Overlay** für mehr Tiefe:
  ```css
  body {
    background:
      radial-gradient(ellipse 120% 80% at 50% -20%, rgba(252, 233, 213, 0.6), transparent 50%),
      linear-gradient(180deg, #FFF8F0 0%, #FEF1E1 50%, #FDE8D0 100%);
    background-color: #FFF8F0;
  }
  ```

- **MEDIUM:** Leichte Textur für Lese-App-Atmosphäre.
  - Dezentes SVG oder Bild (z. B. Papier/Leinen) als `background-image` mit niedriger Opacity (z. B. 3–5%) nur auf Leseseiten oder als globaler Underlay — performancebewusst (ein kleines, wiederholbares Asset).

- **NICE-TO-HAVE:** Seiten-spezifische Atmosphäre.
  - CreateStoryPage: etwas mehr „Abenteuer“ (z. B. sehr weicher radialer Gradient in Orange/Amber).
  - ReadingPage: ruhiger, einheitlich warmer Verlauf wie Body.

---

## 3. TYPOGRAFIE & TEXT-HIERARCHIE

### Status Quo

- **tailwind.config:** `fontFamily: { nunito: ['Nunito', 'sans-serif'], baloo: ['Baloo 2', 'cursive'] }`. Google Fonts in index.css: Nunito 400/600/700/800, Baloo 2 500/600/700.
- **index.css:** `body { @apply text-foreground font-nunito }`, `h1–h6 { @apply font-baloo font-bold }`. Gute Basis: Nunito für Fließtext, Baloo für Überschriften.
- **design-tokens:** `fontSize` für speechBubble, buttonPrimary, cardTitle, cardDescription — werden nicht überall genutzt; viele Stellen nutzen `text-sm`, `text-base`, `text-lg` direkt.
- **Farben:** Text teils `#2D1810`, teils `text-foreground` (HSL aus CSS-Variablen). Muted mit `text-muted-foreground` bzw. Grau.

### Gaps

- Keine **skalierte Typography-Scale** in Tailwind (z. B. text-hero, text-title, text-body-lg).
- Mischung aus Token-Größen und Ad-hoc-Klassen; Labels manchmal zu klein für Touch-Ziele.
- Kein explizites **Minimum für Lesbarkeit** auf Mobile (z. B. Body mind. 16px).
- Grau-Varianten uneinheitlich (textMuted vs. muted-foreground).

### Konkrete Verbesserungen

- **HIGH IMPACT:** Klare Text-Hierarchie und Mindestgrößen.
  - In `tailwind.config.ts` unter `extend`:
  ```ts
  fontSize: {
    'kid-hero': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
    'kid-title': ['1.375rem', { lineHeight: '1.3', fontWeight: '700' }],
    'kid-body': ['1rem', { lineHeight: '1.5' }],
    'kid-body-lg': ['1.125rem', { lineHeight: '1.5' }],
    'kid-caption': ['0.875rem', { lineHeight: '1.4' }],
  },
  ```
  - In `index.css` sicherstellen: Body/Paragraph mind. `text-kid-body` (16px) auf kleinen Viewports.

- **MEDIUM:** design-tokens und Komponenten auf eine gemeinsame Scale umstellen.
  - FABLINO_SIZES.fontSize auf Tailwind-Namen mappen (z. B. cardTitle → `text-kid-title`) und in SpeechBubble, CardTitle, Buttons verwenden.

- **NICE-TO-HAVE:** Optional eine zweite Display-Font nur für große Hero-Texte (z. B. Baloo für „Neue Geschichte“), Rest bei Nunito/Baloo belassen.

---

## 4. ANIMATIONEN & MICRO-INTERACTIONS

### Status Quo

- **Framer Motion:** Nur in `PointsDisplay.tsx` (AnimatePresence + motion.div) genutzt; **keine** Seitenübergänge, keine Route-Transitions.
- **index.css:** Viele Keyframes: `gentleBounce`, `speechBubbleIn`, `fadeSlideUp`, `shimmer`, `fade-in`, `slide-up`, `confettiFall`, `badgePop`, `newBadgeGlow`, `starFly`, `scoreRingFill`. FablinoMascot nutzt `gentleBounce`; SpeechBubble/Hero nutzen teils `animate-speech-bubble`.
- **LevelUpModal:** canvas-confetti; **BadgeCelebrationModal:** Fallende Sterne (inline Keyframes), Overlay-Transition.
- **FablinoReaction:** Inline `@keyframes particleFall`; StarFlyEffect mit CSS-Variablen. Kein Framer Motion.
- **StoryGenerationProgress:** Statische Steps + Mascot-Cycle; keine Stagger- oder Fortschritts-Animation.
- **Buttons/Tiles:** Einige mit `active:scale` und `transition-all`; kein durchgängiges „juicy“ Feedback.

### Gaps

- **Keine** AnimatePresence/Route-Transitions — wirkt wie klassische Web-App.
- Framer Motion wird kaum genutzt; viele Effekte in reinem CSS.
- Gamification (Level-Up, Badge) könnte stärker hervorgehoben werden (z. B. Scale+Bounce beim Badge-Pop).
- Kein Parallax/Scroll-Effekt; Ladezustände oft nur Spinner/Text.

### Konkrete Verbesserungen

- **HIGH IMPACT:** Route-Transitions mit Framer Motion.
  - In `App.tsx` Routes mit `AnimatePresence` und `motion.div` wrappen:
  ```tsx
  import { AnimatePresence } from "framer-motion";
  <Routes>
    <Route path="*" element={
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Page key="home" />} />
          <Route path="/stories" element={<Page key="stories" />} />
          // ...
        </Routes>
      </AnimatePresence>
    } />
  </Routes>
  ```
  - Pro Page: `motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}`. So wirkt Navigation weicher und nativ.

- **HIGH IMPACT:** Stagger beim Erscheinen von Listen (Story-Grid, Tiles).
  - Auf StorySelectPage / CreateStoryPage für Kacheln:
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    <CharacterTile ... />
  </motion.div>
  ```

- **MEDIUM:** „Juicy“ Badge/Level-Up.
  - BadgeCelebrationModal: Badge-Container mit `motion.div` (scale 0→1.1→1, leichtes Bounce), optional kurze Haptic-Feedback-Hinweise in JSDoc (navigator.vibrate wo unterstützt).
  - LevelUpModal: Confetti beibehalten; Titel/Emoji mit Framer (scale + opacity) einblenden.

- **MEDIUM:** StoryGenerationProgress mit Fortschritts-Animation.
  - Aktiver Step: Icon mit `motion` pulsieren oder leuchten; Progress-Bar mit `motion.div` und `layout` für sanftes Füllen.

- **NICE-TO-HAVE:** Button-Press mit leichtem „spring“ (Framer `whileTap={{ scale: 0.97 }}` + `transition: { type: 'spring', stiffness: 400 }`) für wichtige CTAs.

---

## 5. NAVIGATION & APP-SHELL

### Status Quo

- **App.tsx:** Reines React Router `<Routes>`; **keine** Bottom Tab Bar, kein persistenter App-Header.
- **Header:** FablinoPageHeader auf Wizard-Seiten (Mascot + SpeechBubble + optional BackButton); ReadingPage nutzt PageHeader/BackButton mit `bg-background/80 backdrop-blur-sm`. Kein globaler Sticky-Header mit Blur.
- **index.css:** `.pb-safe` / `.pt-safe` mit `env(safe-area-inset-*)` vorhanden; SpecialEffectsScreen und ResultsPage nutzen `pb-safe` für feste Bottom-Buttons.
- **index.html:** `viewport-fit=cover` gesetzt; `theme-color` ist **#3b82f6** (Blau) — passt nicht zur Marke Orange.
- Kein Pull-to-Refresh; keine Swipe-Back-Gesten (nur Back-Button).

### Gaps

- Fehlende **Bottom Navigation** — für Mobile/Tablet ungewohnt; Nutzer müssen über Home/Stories-Links gehen.
- Kein einheitlicher **App-Header** mit Blur wie bei nativen Apps.
- **theme-color** blau statt orange.
- Safe Areas werden nur teilweise genutzt (z. B. fixed bottom bars).
- Keine Pull-to-Refresh- oder Swipe-Gesten.

### Konkrete Verbesserungen

- **HIGH IMPACT:** theme-color und Status-Bar an Marke anpassen.
  - `index.html`: `<meta name="theme-color" content="#E8863A" />` (oder etwas dunkler für Status-Bar). Optional `apple-mobile-web-app-status-bar-style="black-translucent"` testen.

- **HIGH IMPACT:** Einheitliche Safe Area für fixe Fußbereiche.
  - Alle fixen Bottom-Bars (SpecialEffectsScreen, ggf. andere Wizards) mit `pb-safe` und optional `padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);` versehen. Prüfen, ob `.pb-safe` überall genutzt wird, wo Inhalt bis zum unteren Rand geht.

- **MEDIUM:** Optionale Bottom Tab Bar für Hauptbereiche.
  - Z. B. nur auf Home + Stories: Tabs „Home“, „Geschichten“, „Sammlung“ (oder gemäß IA). Sticky am unteren Rand mit `backdrop-blur-md bg-background/90`, `pb-safe`, min-Höhe 56px, Touch-Targets mind. 44px. Würde stark an native Apps erinnern.

- **MEDIUM:** Sticky Header mit Blur wo sinnvoll.
  - Auf StorySelectPage und ReadingPage: Header-Zone mit `sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50` und `pt-safe` für Notch-Geräte.

- **NICE-TO-HAVE:** Pull-to-Refresh auf StorySelectPage (z. B. react-pull-to-refresh oder einfache Pull-Geste mit Framer) und optional Swipe-back auf Leseseiten (z. B. react-swipeable).

---

## 6. ICON-SYSTEM & VISUELLES VOKABULAR

### Status Quo

- **Icons:** Überwiegend **Lucide** (BookOpen, Sparkles, Settings, ChevronDown, Loader2, Check, Star, etc.); vereinzelt Emoji (⭐, 🔍) in Texten und BadgeCelebrationModal.
- **Maskottchen:** FablinoMascot mit `/mascot/*.png` (1_happy_success, 2_encouriging_wrong_answer, 6_Onboarding, 7_Level_up, etc.); Größen sm/md/lg aus design-tokens; `drop-shadow-md`, optional `gentleBounce`.
- **Assets:** `src/assets/` für themes (magic.png, action.png, …), story-types, characters; StoryTypeSelectionScreen und CharacterSelectionScreen nutzen diese Bilder in CharacterTiles.
- Icon-Größen: oft `w-5 h-5`, `w-4 h-4`, `className="w-8 h-8"` — nicht zentral definiert.

### Gaps

- Kein klares **Icon-Größen-System** (z. B. icon-sm/md/lg in Tokens).
- Lucide ist sachlich; für Kinder-App könnten etwas rundere oder freundlichere Sets erwogen werden (optional).
- Maskottchen wird gut genutzt; Konsistenz (immer gleiche Komponente) ist gegeben.
- Keine eigenen Illustrationen für Empty States; teils nur Text.

### Konkrete Verbesserungen

- **MEDIUM:** Icon-Größen in design-tokens oder Tailwind.
  - In design-tokens: `icon: { sm: 16, md: 20, lg: 24 }` und in Komponenten `w-5 h-5` durch `size={FABLINO_SIZES.icon.md}` o. ä. ersetzen. Oder in tailwind `extend`: `width: { 'icon-sm': '16px', 'icon-md': '20px', 'icon-lg': '24px' }` und `[&_svg]:size-icon-md` wo sinnvoll.

- **MEDIUM:** Empty States mit Illustration + CTA.
  - Wo Listen leer sind (z. B. „Noch keine Geschichten“, Wortliste leer): Platzhalter mit Fablino-Mascot oder einfacher Illustration + kurzer Text + Button (z. B. „Erste Geschichte starten“). Einheitliche Komponente `EmptyState` mit Slot für Bild + Text + Action.

- **NICE-TO-HAVE:** Einheitliche Verwendung von Emoji vs. Lucide (z. B. Sterne/Badges: entweder durchgängig Lucide Star oder durchgängig ⭐ für Gamification).

---

## 7. FORMULARE & INPUTS

### Status Quo

- **input.tsx:** Standard shadcn — `rounded-md`, `border`, `ring-offset`, `focus-visible:ring-2`; Höhe h-10 (40px). Kein kindgerechtes Minimum (44px Touch).
- **switch.tsx:** Radix Switch — `h-6 w-11`, Thumb `h-5 w-5`; `data-[state=checked]:bg-primary`. Funktional; optisch neutral, kein iOS-ähnlicher „Track“.
- **SpecialEffectsScreen:** Checkbox-ähnliche Tiles für Effekte; Buttons mit `rounded-2xl`, `shadow-lg`, `active:scale-[0.98]`. Toggle für „Spezialeffekte“ vermutlich Switch.
- **CharacterTile / StoryTypeSelectionScreen:** Auswahl über Tiles mit Ring + Hintergrund bei Selected; Checkmark-Animation nur als statisches Icon.

### Gaps

- Input-Höhe unter 44px auf Touch-Geräten.
- Switch wirkt nicht wie ein nativer iOS-Switch (Farben, Track-Tiefe).
- Keine explizite Checkmark- oder „selected“-Animation bei Tiles (z. B. Scale-in des Häkchens).
- Kein dokumentiertes Haptic-Feedback (nur QRScannerModal nutzt `navigator.vibrate`).

### Konkrete Verbesserungen

- **HIGH IMPACT:** Touch-freundliche Input-Höhe.
  - input.tsx: `h-10` durch `min-h-[44px] h-12` ersetzen (oder Variante `size="kid"`), `text-base` beibehalten (16px verhindert iOS-Zoom). Placeholder und Labels in Formularen prüfen (z. B. StoryTypeSelectionScreen Input bereits h-12).

- **MEDIUM:** Switch optisch an iOS anlehnen.
  - switch.tsx: Track mit leichtem inneren Schatten und klarer Hintergrundfarbe (unchecked: grau, checked: primary); Thumb mit Schatten. Z. B.:
  ```tsx
  <SwitchPrimitives.Root
    className={cn(
      "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
      "data-[state=unchecked]:bg-input data-[state=checked]:bg-primary",
      "shadow-inner data-[state=checked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
      ...
    )}
  >
    <SwitchPrimitives.Thumb className="block h-6 w-6 rounded-full bg-white shadow-md ..." />
  </SwitchPrimitives.Root>
  ```

- **MEDIUM:** Selected-State bei Tiles mit kurzer Animation.
  - CharacterTile: Bei `selected` das Checkmark-Icon mit Framer oder CSS-Animation einblenden (z. B. `scale(0) → scale(1)` in 0.2s). So wirkt Auswahl klarer bestätigt.

- **NICE-TO-HAVE:** Kurzes Vibration-Feedback bei wichtigen Aktionen (z. B. „Geschichte erstellen“, Badge verdient) wo `navigator.vibrate` verfügbar ist; nur 1–2 kurze Impulse, optional.

---

## 8. LOADING & EMPTY STATES

### Status Quo

- **ImageSkeleton:** Zeigt Status pending/generating/complete/error mit Icon + Text; `animate-shimmer` bei generating; `animate-fade-in` beim Bild. Kein Lottie.
- **StoryGenerationProgress:** Feste Schritte (writing, checking, images, finishing) mit Icons und „Did you know“-Text; Mascot-Bilder wechseln; **keine** echte Fortschritts-Animation (z. B. Fortschrittsbalken).
- **ResultsPage:** Skeleton mit `animate-pulse` und weißen Karten.
- **Leere Listen:** StorySelectPage zeigt leere Tabs mit Text (z. B. „Noch keine Geschichten“); WordListPanel zeigt Text „Tippe auf ein Wort…“. Keine illustrierten Empty-State-Komponenten.

### Gaps

- Keine **Skeleton-Grids** für Story-Listen (nur vereinzelt Pulse-Karten).
- Story-Generierung zeigt keinen **Fortschrittsbalken** (nur Steps + Mascot).
- Keine **Lottie** oder dezente Custom-Animation für Ladezustände.
- Empty States ohne Illustration und ohne klaren CTA.

### Konkrete Verbesserungen

- **HIGH IMPACT:** Einheitlicher Empty State mit Illustration + CTA.
  - Komponente `EmptyState` (Bild: Fablino oder Asset), Titel, Beschreibung, primärer Button. Auf StorySelectPage bei 0 Geschichten und in WordListPanel nutzen.

- **MEDIUM:** Skeleton-Grid für Story-Liste.
  - Beim ersten Laden der Stories 6–8 Karten als Skeleton (wie ResultsPage Skeleton, aber in Grid) anzeigen; nach Laden durch echte Cards ersetzen. So wirkt die App schneller und klarer.

- **MEDIUM:** Fortschritts-Feedback bei Story-Generierung.
  - StoryGenerationProgress: Einen schmalen Progress-Bar (z. B. 0→25→50→75→100 über die geschätzten Phasen) mit `motion` oder CSS-Transition füllen; Steps weiterhin mit Icon + Label. Optional: „X Sekunden noch“ nur wenn Backend-Zeitschätzung verfügbar.

- **NICE-TO-HAVE:** Einfache Lottie- oder SVG-Animation für „Bilder werden gemalt“ (z. B. Pinsel oder Palette) statt nur Spinner; Datei klein halten.

---

## 9. FARB-SYSTEM & PALETTE

### Status Quo

- **design-tokens:** FABLINO_COLORS mit primary #E8863A, secondary #FFF8F0, text #2D1810, card.shadow, background.gradient — **warm und orange**.
- **index.css :root:** HSL-Variablen für primary/secondary/accent sind **blau/teal** (215°, 175°, 195°) — Widerspruch zu Fablino Orange.
- **useColorPalette:** 5 Paletten (ocean, sunset, forest, lavender, sunshine) mit `from-*-500/30`, `bg-*-500/20` etc.; werden in StoryTypeSelectionScreen als `colors.overlay` auf Tiles genutzt. Gut für Personalisierung.
- **Kontrast:** Text #2D1810 auf #FFF8F0; Buttons weiß auf Orange — grundsätzlich gut lesbar. Muted-Farben teils grau (6B7280).

### Gaps

- **Doppelte Identität:** CSS-Variablen (blau) vs. design-tokens (orange) — shadcn nutzt HSL-Variablen, daher wirken viele Buttons/Primary blau.
- useColorPalette wird nur in wenigen Screens genutzt; Rest nutzt feste Orange/Grau.
- Kein zentrales WCAG-Check für Kontraste (z. B. für Muted-Text).

### Konkrete Verbesserungen

- **HIGH IMPACT:** Primärfarben in CSS-Variablen auf Orange umstellen.
  - In `index.css` :root z. B.:
  ```css
  --primary: 25 85% 55%;        /* #E8863A Nähe */
  --primary-foreground: 0 0% 100%;
  --secondary: 30 100% 97%;     /* #FFF8F0 Nähe */
  --accent: 25 80% 60%;
  --ring: 25 85% 50%;
  ```
  - So werden alle shadcn-Komponenten (Button, Switch, Focus-Ring) einheitlich orange. Ocean/Teal-Farben nur noch für optionale Akzente oder Paletten beibehalten.

- **MEDIUM:** useColorPalette konsistent nutzen.
  - Wo thematisch passend (z. B. Story-Type-Tiles, Kategorien), `colors.primary` / `colors.overlay` aus useColorPalette verwenden; Fallback immer Fablino Orange.

- **NICE-TO-HAVE:** Muted-Text prüfen (z. B. #6B5B4E aus design-tokens statt #6B7280) und Kontrast mind. 4.5:1 für Fließtext sicherstellen.

---

## 10. SPACING & LAYOUT-RHYTHMUS

### Status Quo

- **Tailwind:** Standard-Spacing (4px-Grid); Container mit `padding: 2rem`, `max-w-2xl: 1400px`.
- **Seiten:** CreateStoryPage/StoryTypeSelectionScreen mit `max-w-[480px] mx-auto`, `px-4`, `gap-3`/`gap-2.5`; StorySelectPage mit `max-w-[600px]` oder ähnlich. ReadingPage content breiter für Tablet.
- **Cards:** Unterschiedliche Paddings (p-4, p-5, p-6); Buttons h-14, min-h-[56px]. Kein dokumentiertes 8px-Grid in Tokens.

### Gaps

- Kein explizites **Spacing-System** in design-tokens (z. B. space-1 = 4px, space-2 = 8px, … bis space-8).
- Einige Bereiche wirken gedrängt (z. B. Tabs + Grid auf kleiner Höhe); andere haben viel Whitespace.
- Content-Width wechselt zwischen 480px, 500px, 600px — vereinheitlichen würde Rhythmus verbessern.

### Konkrete Verbesserungen

- **MEDIUM:** Einheitliche Content-Breite für Wizard und Listen.
  - Eine Max-Width für „Content-Bereich“ (z. B. 480px Mobile, 560px Tablet) in design-tokens oder einer Layout-Komponente; alle Wizard-Screens und Story-Liste daran ausrichten.

- **MEDIUM:** Spacing in design-tokens festhalten.
  - z. B. `FABLINO_SPACING: { section: 24, card: 16, element: 12, tight: 8 }` (px) und in Tailwind oder Klassen nutzen (`gap-[var(--space-section)]`), damit Abstände zwischen Sektionen und innerhalb von Cards konsistent sind.

- **NICE-TO-HAVE:** Größere Touch-Zonen dokumentieren (min 44px) und bei allen interaktiven Elementen prüfen (Buttons bereits h-14; Icon-Only-Buttons und Tab-Triggers prüfen).

---

## Abschluss

### Top-10 Quick Wins (minimaler Aufwand, hoher visueller Impact)

1. **theme-color** in index.html auf `#E8863A` setzen.
2. **Primary-Farben** in index.css :root auf Orange (HSL) umstellen — sofort einheitliches Orange in der ganzen App.
3. **Primary-Buttons** überall `active:scale-[0.98]` und Schatten (z. B. FABLINO_STYLES oder Button-Variante) geben.
4. **Card**-Komponente um leichten Hover-Schatten und ggf. `hover:-translate-y-0.5` erweitern.
5. **Input** mind. `min-h-[44px]` und `text-base` für Touch und iOS.
6. **Empty States** für „Keine Geschichten“ und leere Wortliste mit Fablino + CTA einführen.
7. **Route-Transition** mit Framer Motion (opacity + y) für 2–3 Hauptseiten einführen.
8. **Sticky Header** auf StorySelectPage mit `backdrop-blur-md` und `pt-safe`.
9. **Fixed Bottom Bars** (SpecialEffectsScreen etc.) einheitlich `pb-safe` und gleicher Stil (z. B. Gradient-Fade).
10. **Story-Grid** beim ersten Laden als Skeleton-Grid anzeigen.

---

### Design-Token-Erweiterungen (design-tokens.ts)

```ts
// Shadows (für Buttons, Cards, Modals)
export const FABLINO_SHADOWS = {
  soft: '0 2px 8px rgba(45,24,16,0.08)',
  card: '0 2px 12px -4px rgba(45,24,16,0.1)',
  cardHover: '0 8px 24px -8px rgba(45,24,16,0.15)',
  button: '0 2px 8px rgba(45,24,16,0.12)',
  buttonHover: '0 4px 16px rgba(232,134,58,0.25)',
  modal: '0 20px 50px -12px rgba(45,24,16,0.2)',
} as const;

// Elevation (optional: für Übersetzung in Tailwind)
export const FABLINO_ELEVATION = {
  flat: 0,
  raised: 1,
  overlay: 2,
  modal: 3,
} as const;

// Spacing (px)
export const FABLINO_SPACING = {
  section: 24,
  card: 16,
  element: 12,
  tight: 8,
} as const;

// Animation durations (ms)
export const FABLINO_MOTION = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
```

---

### Globale CSS-Ergänzungen (index.css)

- **:root** — Primary/Accent/Ring auf Orange (siehe Abschnitt 9).
- **body** — Optional radialer Gradient-Overlay für Tiefe (siehe Abschnitt 2).
- **Utility für Touch-Targets:** z. B. `.min-touch { min-height: 44px; min-width: 44px; }` und bei kleinen Icon-Buttons nutzen.
- **Doppelte Keyframe-Definition** `shimmer` in index.css bereinigen (einmal unter utilities, einmal für Progress-Bar) — eine gemeinsame Definition nutzen.

---

### Tailwind-Config-Erweiterungen (tailwind.config.ts)

- **colors:** `fablino: { primary: '#E8863A', primaryHover: '#D4752E', background: '#FFF8F0', ... }` für direkte Nutzung neben HSL-Variablen.
- **boxShadow:** `'fablino-button': '0 2px 8px rgba(45,24,16,0.12)', 'fablino-card': '0 2px 12px -4px rgba(45,24,16,0.1)', 'fablino-modal': '0 20px 50px -12px rgba(45,24,16,0.2)'`.
- **fontSize:** kid-hero, kid-title, kid-body, kid-body-lg, kid-caption (siehe Abschnitt 3).
- **minHeight/minWidth:** `'touch': '44px'` für konsistente Touch-Targets.

---

*Ende des Audits. Alle Vorschläge sind mit dem bestehenden Stack (shadcn, Tailwind, Framer Motion) umsetzbar; Performance (leichte Animationen, kleine Assets) und Barrierefreiheit (Kontrast, 44px Touch) wurden berücksichtigt.*
