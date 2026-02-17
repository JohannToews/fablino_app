# Image Style System — Codebase-Analyse

> Erstellt: 2026-02-10  
> Zweck: Vollständige Analyse der bestehenden Codebase als Grundlage für das neue Image-Style-Picker-System

---

## 1. Datenbank-Schema

### 1.1 `image_styles` Tabelle — existiert bereits

**Migration:** `supabase/migrations/20260217_image_styles.sql`

```sql
CREATE TABLE IF NOT EXISTS public.image_styles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  style_key       text UNIQUE NOT NULL,
  labels          jsonb NOT NULL,          -- { de: "...", en: "...", fr: "...", ... }
  description     jsonb NOT NULL,          -- { de: "...", en: "...", fr: "...", ... }
  imagen_prompt_snippet  text NOT NULL,    -- Prompt-Snippet für Bildgenerierung
  age_groups      text[] NOT NULL,         -- z.B. ['6-7', '8-9']
  default_for_ages text[] DEFAULT '{}',    -- z.B. ['6-7'] → Default für diese Altersgruppe
  age_modifiers   jsonb DEFAULT '{}',      -- { "6-7": "...", "8-9": "...", "10-11": "..." }
  sort_order      integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  preview_image_url text,                  -- Platzhalter, aktuell NULL
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

**RLS:** Enabled, SELECT-Policy für alle authentifizierten User.

**Seed-Daten (6 Styles):**

| style_key | Default für | Altersgruppen | sort_order |
|-----------|-------------|---------------|------------|
| `storybook_soft` | 6-7 | 6-7 | 1 |
| `storybook_vibrant` | — | 6-7, 8-9 | 2 |
| `manga_anime` | — | 8-9, 10-11 | 3 |
| `adventure_cartoon` | 8-9 | 8-9 | 4 |
| `graphic_novel` | 10-11 | 10-11 | 5 |
| `semi_realistic` | — | 10-11 | 6 |

Jeder Seed enthält mehrsprachige `labels` und `description` (de, fr, en, es, it, bs, nl), `imagen_prompt_snippet`, und altersgruppenbezogene `age_modifiers`.

### 1.2 `kid_profiles` — Feld `image_style`

```
kid_profiles.image_style   TEXT   DEFAULT 'modern cartoon'   NULLABLE
```

- **Typ:** Freitext (kein FK auf `image_styles`)
- **Default:** `'modern cartoon'`
- **Kommentar in Migration:** "Style description for AI-generated profile cover images"
- **Aktueller Zustand:** Wird für Profilbild-Generierung genutzt, **nicht** für Story-Bilder.

**Vollständige relevante kid_profiles-Felder:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → user_profiles)
- `name`, `age`, `gender`, `hobbies`
- `color_palette` (string)
- `image_style` (string | null) ← **dieses Feld**
- `cover_image_url` (string | null)
- `difficulty_level`, `content_safety_level`
- `ui_language`, `reading_language`, `explanation_language`
- `home_languages` (string[]), `story_languages` (string[])
- `school_system`, `school_class`

### 1.3 `stories` — Feld `image_style_key`

```
stories.image_style_key   TEXT   NULLABLE
```

- **Migration:** `20260217_image_styles.sql` (Zeile 219)
- **Kein FK-Constraint** — Text-Referenz auf `image_styles.style_key`
- **Wird gesetzt durch:** Backend-Response von `generate-story`, Frontend speichert den Wert

**Weitere bildbezogene Felder in stories:**
- `cover_image_url` (string | null)
- `cover_image_status` (string | null)
- `story_images` (string[] | null)
- `story_images_status` (string | null)
- `image_plan` (jsonb | null)
- `visual_style_sheet` (jsonb | null) — für Serien-Konsistenz

### 1.4 Serien/Kapitelgeschichten

**stories-Tabelle (Serien-Felder):**
- `series_id` (uuid | null, self-referencing FK → stories.id)
- `series_mode` (string | null: `'normal'` | `'interactive'`)
- `episode_number` (integer | null)
- `series_episode_count` (integer | null)
- `episode_summary` (text | null)
- `continuity_state` (jsonb | null)
- `visual_style_sheet` (jsonb | null) — Visueller Konsistenz-Sheet von Episode 1

**story_branches** (interaktive Serien):
- `story_id` → `stories.id` (FK, ON DELETE CASCADE)
- `series_id` (uuid, kein FK)
- `options` (jsonb), `chosen_option_id`, `chosen_at`

**Kein separates Serien-Style-Feld:** Jede Episode nutzt `stories.image_style_key`. Visuelle Konsistenz wird über `visual_style_sheet` sichergestellt.

### 1.5 Foreign Keys & Relationen

```
image_styles
  ← stories.image_style_key (text, KEIN FK-Constraint)

kid_profiles
  → user_profiles.id (FK, ON DELETE CASCADE)
  ← stories.kid_profile_id (FK, ON DELETE SET NULL)
  ← user_progress.kid_profile_id (FK, UNIQUE)
  ← user_results.kid_profile_id (FK)
  ← user_badges.child_id (FK)
  ← point_transactions.kid_profile_id (FK)
  ← kid_characters.kid_profile_id (FK)
  ← story_subtype_history.kid_profile_id (FK)

stories
  → user_profiles.id (FK, ON DELETE CASCADE)
  → kid_profiles.id (FK, ON DELETE SET NULL)
  → stories.id (self-ref series_id, ON DELETE SET NULL)
```

---

## 2. Story-Generierung

### 2.1 Bildgenerungs-API

**Primär: Vertex AI (Google Cloud Platform)**
- **Datei:** `supabase/functions/generate-story/index.ts`
- **Funktion:** `callVertexImageAPI()` (Zeile ~826-924)
- **Endpoint:** `https://europe-west1-aiplatform.googleapis.com/v1/projects/{projectId}/locations/europe-west1/publishers/google/models/gemini-2.0-flash-exp:generateContent`
- **Auth:** Service Account JSON → OAuth2 Token
- **Return:** Base64 Data-URL (`data:image/png;base64,...`)

**Fallback: Lovable AI Gateway**
- **Funktion:** `callLovableImageGenerate()`
- **Genutzt wenn:** Vertex AI fehlschlägt

```typescript
// Priorität: Vertex AI FIRST → Lovable Gateway fallback
if (GEMINI_API_KEY) {
  imageUrl = await callVertexImageAPI(GEMINI_API_KEY, imgPrompt.prompt);
}
if (!imageUrl && LOVABLE_API_KEY) {
  imageUrl = await callLovableImageGenerate(LOVABLE_API_KEY, imgPrompt.prompt);
}
```

### 2.2 Image-Prompt-Aufbau

**Datei:** `supabase/functions/_shared/imagePromptBuilder.ts`

**Hauptfunktion:** `buildImagePrompts()`

```typescript
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge: number,
  seriesContext?: SeriesImageContext,
  imageStyleOverride?: { promptSnippet: string; ageModifier: string },
): ImagePromptResult[]
```

**Style-Auflösung:** `getStyleForAge()`

```typescript
export async function getStyleForAge(
  supabase: any,
  age: number,
  preferredStyleKey?: string | null
): Promise<{ styleKey: string; promptSnippet: string; ageModifier: string }>
```

**Priorität:**
1. `preferredStyleKey` (wenn altersgerecht) → aus `image_styles` Tabelle
2. `default_for_ages` für die Altersgruppe → aus `image_styles` Tabelle
3. Hardcoded Fallback → `getAgeModifierFallback(age)`

### 2.3 Style-Injection in den Prompt

**Für Einzelgeschichten:**
```typescript
const styleBlock = [
  ageModifier,                          // Fein-granular pro Altersjahr
  themeImageRules.image_style_prompt,    // Themen-spezifisch (noch null)
  ageStyleRules.style_prompt,            // DB: image_style_rules.style_prompt
  themeImageRules.image_color_palette || ageStyleRules.color_palette,
].filter(Boolean).join('. ');
```

**Für Serien:**
```typescript
const styleBlock = [
  ageModifier,
  seriesContext.visualStyleSheet.world_style,
  ageStyleRules.color_palette,
  EPISODE_MOOD[seriesContext.episodeNumber] || EPISODE_MOOD[5],
].filter(Boolean).join('. ');
```

### 2.4 Prompt-Template-System

| Quelle | Beschreibung | Speicherort |
|--------|-------------|-------------|
| `system_prompt_core_v2` | Haupt-System-Prompt (CORE Slim) | `app_settings` Tabelle |
| `promptBuilder.ts` | Dynamischer User-Message-Builder | `supabase/functions/_shared/` |
| `imagePromptBuilder.ts` | Bild-Prompt-Builder | `supabase/functions/_shared/` |
| Sprach-spezifische Prompts | Fallback-Prompts | `app_settings` (`system_prompt_de`, etc.) |

**Flow:** CORE Slim (System-Prompt) + `promptBuilder.ts` (User-Message) → LLM generiert Story + `image_plan` JSON → `imagePromptBuilder.ts` transformiert `image_plan` in finale Bild-Prompts.

### 2.5 Vollständiger Flow: User → Bild

```
1. Frontend: CreateStoryPage.tsx → StoryGenerator.tsx
   └─ handleGenerate() → supabase.functions.invoke("generate-story", {...})
   └─ Sendet: kidProfileId, themeKey, characters, length, image_style_key, ...

2. Edge Function: supabase/functions/generate-story/index.ts
   ├─ 2a. Prompt-Aufbau
   │   ├─ Laden: system_prompt_core_v2 aus app_settings
   │   ├─ promptBuilder.ts → buildStoryPrompt() (inkl. IMAGE PLAN INSTRUCTIONS)
   │   └─ User-Message mit allen Parametern
   │
   ├─ 2b. LLM-Call (Story-Generierung)
   │   └─ callLovableAI() → Gemini → JSON-Response mit story + image_plan
   │
   ├─ 2c. Image-Regeln laden
   │   ├─ loadImageRules() → image_style_rules + theme_rules
   │   └─ getStyleForAge() → image_styles Tabelle (preferredStyleKey || default)
   │
   ├─ 2d. Bild-Prompts bauen
   │   ├─ imagePromptBuilder.ts → buildImagePrompts(imagePlan, rules, age, ...)
   │   └─ Output: cover + scene_1 + scene_2 + scene_3 Prompts
   │
   ├─ 2e. Bild-Generierung (parallel)
   │   ├─ getCachedImage() → image_cache Tabelle
   │   ├─ callVertexImageAPI() → Vertex AI (primary)
   │   ├─ callLovableImageGenerate() → Lovable Gateway (fallback)
   │   └─ cacheImage() → image_cache Tabelle
   │
   ├─ 2f. Bild-Upload
   │   ├─ uploadImageToStorage() → Supabase Storage Bucket "covers"
   │   └─ Pfad: cover-{timestamp}-{uuid}.png / scene-{i}-{timestamp}-{uuid}.png
   │
   └─ 2g. Response an Frontend
       └─ { coverImageBase64: url, storyImages: [urls], image_style_key, ... }

3. Frontend: StoryGenerator.tsx
   └─ Speichert Story in stories-Tabelle (inkl. cover_image_url, story_images, image_style_key)

4. Anzeige: ReadingPage.tsx / ImmersiveReader.tsx
   └─ Lädt cover_image_url + story_images[] als direkte Public URLs
```

**Beteiligte Dateien/Funktionen:**

| Komponente | Datei | Funktion |
|-----------|-------|----------|
| Frontend Trigger | `src/components/StoryGenerator.tsx` | `handleGenerate()` |
| Edge Function | `supabase/functions/generate-story/index.ts` | Main handler |
| Prompt-Aufbau | `supabase/functions/_shared/promptBuilder.ts` | `buildStoryPrompt()` |
| Bild-Prompts | `supabase/functions/_shared/imagePromptBuilder.ts` | `buildImagePrompts()`, `getStyleForAge()` |
| Style-Auflösung | `supabase/functions/_shared/imagePromptBuilder.ts` | `getStyleForAge()` |
| Bild-API | `supabase/functions/generate-story/index.ts` | `callVertexImageAPI()`, `callLovableImageGenerate()` |
| Cache | `supabase/functions/generate-story/index.ts` | `getCachedImage()`, `cacheImage()` |
| Upload | `supabase/functions/generate-story/index.ts` | `uploadImageToStorage()` |
| Anzeige | `src/pages/ReadingPage.tsx` | Image rendering |
| Immersive | `src/components/immersive-reader/ImmersivePageRenderer.tsx` | Image rendering |

---

## 3. Story-Wizard UI

### 3.1 Wizard-Lokation

**Hauptkomponente:** `src/pages/CreateStoryPage.tsx`

**Step-Komponenten:** `src/components/story-creation/`

### 3.2 Wizard-Steps

```typescript
type WizardScreen = "entry" | "story-type" | "characters" | "effects" | "generating";
```

| Step | Komponente | Zweck |
|------|-----------|-------|
| `entry` | Inline in `CreateStoryPage.tsx` | Pfadwahl: Weg A (Free) vs Weg B (Guided) |
| `story-type` | `StoryTypeSelectionScreen.tsx` | Thema, Sub-Elemente, Story-Settings |
| `characters` | `CharacterSelectionScreen.tsx` | Charaktere, Familie, Freunde |
| `effects` | `SpecialEffectsScreen.tsx` | Spezialeffekte, Beschreibung, Serien-Modus |
| `generating` | `StoryGenerationProgress.tsx` | Fortschrittsanzeige |

**Wizard-Pfade:**
- **Weg A (Free):** Entry → Effects (überspringt story-type + characters)
- **Weg B (Guided):** Entry → Story-Type → Characters → Effects

### 3.3 Bestehende Style-Auswahl

**Es gibt KEINE Bildstil-Auswahl im Wizard-UI.**

Die Bildstil-Logik ist aktuell komplett Backend-seitig:
- `kid_profiles.image_style` → für Profilbilder (nicht Story-Bilder)
- `getStyleForAge()` → wählt automatisch nach Alter
- `stories.image_style_key` → wird vom Backend gesetzt, nicht vom User

### 3.4 UI-Framework

- **Component Library:** shadcn/ui (basierend auf Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **Animationen:** framer-motion
- **Utilities:** class-variance-authority, clsx

**Shadcn/ui-Komponenten in `src/components/ui/`:** Button, Input, Textarea, Select, Card, Tabs, Dialog, Drawer, etc.

### 3.5 Wizard State Management

**Pattern:** React `useState` Hooks in `CreateStoryPage.tsx` — kein externer State-Manager.

```typescript
// Navigation
const [currentScreen, setCurrentScreen] = useState<WizardScreen>("entry");
const [wizardPath, setWizardPath] = useState<WizardPath>(null);

// Story-Konfiguration
const [selectedStoryType, setSelectedStoryType] = useState<StoryType | null>(null);
const [storySettings, setStorySettings] = useState<StorySettings | null>(null);
const [humorLevel, setHumorLevel] = useState<number | undefined>(undefined);
const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | undefined>(undefined);

// Charaktere
const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([]);
const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);

// Generierung
const [isGenerating, setIsGenerating] = useState(false);
```

**StorySettings Interface:**
```typescript
interface StorySettings {
  length: StoryLength;      // "short" | "medium" | "long" | "extra_long"
  difficulty: StoryDifficulty; // "easy" | "medium" | "hard"
  isSeries: boolean;
  seriesMode?: 'normal' | 'interactive';
  storyLanguage: string;
}
```

**Flow:** Jeder Step erhält Props + `onComplete` Callback → Parent akkumuliert State → Finale Generierung kombiniert alles.

### 3.6 Kid-Profil-Integration

**Hook:** `useKidProfile()` aus `src/hooks/useKidProfile.tsx`

```typescript
const { kidAppLanguage, kidReadingLanguage, selectedProfile } = useKidProfile();
```

- Profil-ID in `sessionStorage` (`selected_kid_profile_id`)
- Auto-Selection des ersten Profils falls keines gewählt
- Daily-Limit-Check: `useDailyStoryLimit(selectedProfile?.id)`

---

## 4. Tracking & Analytics

### 4.1 Activity-Logging-System

**RPC-Funktion:** `log_activity()` (PostgreSQL)

```sql
CREATE OR REPLACE FUNCTION log_activity(
  p_child_id UUID,
  p_activity_type TEXT,
  p_stars INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
```

**Speichert in:** `user_results` Tabelle

### 4.2 Existierende `activity_type`-Werte

| activity_type | Beschreibung |
|---------------|-------------|
| `story_read` | Geschichte fertig gelesen |
| `quiz_complete` | Quiz abgeschlossen |

### 4.3 Bildstil-Tracking

- `stories.image_style_key` speichert den verwendeten Stil pro Story
- **Kein explizites Event-Tracking** für Style-Auswahl
- **Kein "letzter Style"** oder **"Lieblingsstil"** Tracking

### 4.4 Analytics-Integration

**Keine externe Analytics** (kein PostHog, Mixpanel, etc.). Alles läuft über die DB-basierte `user_results`/`user_progress` Logik.

---

## 5. Preferences & Personalisierung

### 5.1 Preference-System pro Kind

**kid_profiles** enthält Preferences als direkte Spalten:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `image_style` | text | Für Profilbilder (Default: `'modern cartoon'`) |
| `color_palette` | string | Farbpalette-Preference |
| `difficulty_level` | number | Schwierigkeitsgrad |
| `content_safety_level` | number | Inhaltssicherheit |
| `ui_language` | string | App-Sprache |
| `reading_language` | string | Lesesprache |
| `story_languages` | string[] | Verfügbare Story-Sprachen |

### 5.2 "Letzter Style" / "Lieblingsstil"

**Wird aktuell NICHT gespeichert.**

- `kid_profiles.image_style` → nur Profilbilder, Freitext
- `stories.image_style_key` → pro Story gesetzt, kein "bevorzugter" Stil
- Für Story-Bilder: Backend wählt automatisch nach Alter (`getStyleForAge()`)

### 5.3 Serien-Konsistenz

**visual_style_sheet** (jsonb auf stories):
```typescript
interface VisualStyleSheet {
  characters: Record<string, string>;  // Name → englische visuelle Beschreibung
  world_style: string;                 // Welt-Stil
  recurring_visual: string;            // Wiederkehrendes visuelles Element
}
```

- Wird in Episode 1 vom LLM generiert
- In Ep 2-5 aus Episode 1 geladen und als Prefix an alle Bild-Prompts gehängt
- **Episode Mood Modifier** ändert Farbpalette pro Episode (1=bright → 4=dark → 5=triumphant)
- `continuity_state` (jsonb) sichert narrative Konsistenz

---

## 6. Übersetzungen / i18n

### 6.1 System

**Eigenes System** (kein i18next):
- Haupt-Translations: `src/lib/translations.ts`
- Hook: `useTranslations(lang: Language)`
- Komponenten-spezifisch: z.B. `src/components/immersive-reader/labels.ts`

### 6.2 Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/lib/translations.ts` | Haupt-Translations-Objekt (~2100 Zeilen) |
| `src/components/immersive-reader/labels.ts` | Immersive Reader Labels |
| Inline in Komponenten | z.B. `readingLabels` in ReadingPage.tsx |

### 6.3 Unterstützte Sprachen

```typescript
type Language = 'de' | 'fr' | 'en' | 'es' | 'nl' | 'it' | 'bs';
```

| Code | Sprache |
|------|---------|
| `de` | Deutsch |
| `fr` | Französisch |
| `en` | Englisch |
| `es` | Spanisch |
| `nl` | Niederländisch |
| `it` | Italienisch |
| `bs` | Bosnisch |

### 6.4 Beispiel: Neuen UI-String hinzufügen

**1. Interface erweitern** in `src/lib/translations.ts`:
```typescript
export interface Translations {
  // ... bestehende Felder
  imageStyleTitle: string;
  imageStyleDescription: string;
}
```

**2. Übersetzungen für alle 7 Sprachen:**
```typescript
const translations: Record<Language, Translations> = {
  de: {
    imageStyleTitle: 'Bildstil wählen',
    imageStyleDescription: 'Wie sollen die Bilder in deiner Geschichte aussehen?',
  },
  fr: {
    imageStyleTitle: 'Choisir le style d\'image',
    imageStyleDescription: 'Comment les images de ton histoire doivent-elles apparaître ?',
  },
  en: {
    imageStyleTitle: 'Choose image style',
    imageStyleDescription: 'How should the pictures in your story look?',
  },
  // ... es, nl, it, bs
};
```

**3. Nutzen in Komponenten:**
```typescript
const t = useTranslations(language);
return <h2>{t.imageStyleTitle}</h2>;
```

---

## 7. Supabase Storage & Bilder

### 7.1 Story-Bilder-Speicherung

**Upload-Funktion:** `uploadImageToStorage()` in `generate-story/index.ts` (~Zeile 2798-2845)

**Bucket:** `covers`

**Pfad-Konvention:**
- Cover: `cover-{timestamp}-{uuid}.{ext}`
- Szenen: `scene-{index}-{timestamp}-{uuid}.{ext}`

**Flow:**
1. Base64-Data-URL von Vertex AI empfangen
2. Base64 → Binary decodieren
3. Upload in Supabase Storage Bucket `covers`
4. Public URL via `supabase.storage.from('covers').getPublicUrl(fileName)`
5. URL in `stories.cover_image_url` / `stories.story_images[]` speichern

### 7.2 Statische Assets / Preview-Bilder

- **Kein dedizierter Bucket** für statische Assets/Preview-Bilder
- Bucket `story-images` existiert (genutzt in Onboarding-Flow)
- `image_styles.preview_image_url` existiert als Spalte, ist aber aktuell `NULL` für alle Styles

### 7.3 Frontend Bildlade-Pattern

- Bilder werden als **direkte Public URLs** gespeichert
- Frontend lädt einfach `<img src={story.cover_image_url} />`
- Keine signed URLs, kein spezielles Lade-Pattern
- `story.story_images` ist ein `string[]` Array mit Public URLs

---

## 8. Zusammenfassung

### Was existiert bereits und kann wiederverwendet werden

| Bereich | Status | Details |
|---------|--------|---------|
| `image_styles` Tabelle | **Existiert** | 6 Styles mit Multilingual-Labels, Prompt-Snippets, Age-Groups |
| `stories.image_style_key` | **Existiert** | Speichert gewählten Stil pro Story |
| `kid_profiles.image_style` | **Existiert** | Aktuell für Profilbilder, könnte umgewidmet werden |
| `getStyleForAge()` | **Existiert** | Kann `preferredStyleKey` annehmen → bereits vorbereitet |
| Backend-Flow | **Existiert** | `imageStyleKeyParam` wird aus Request gelesen, an `getStyleForAge()` übergeben |
| `image_style_key` in Response | **Existiert** | Backend gibt den genutzten Style-Key zurück |
| Shadcn/ui Components | **Existiert** | Card, Button, etc. für Style-Picker UI |
| Translations-System | **Existiert** | 7 Sprachen, erweiterbar |
| Multilingual Labels in `image_styles` | **Existiert** | `labels` + `description` JSONB pro Style |

### Was muss neu gebaut werden

| Bereich | Beschreibung |
|---------|-------------|
| **Style-Picker UI-Komponente** | Neue Wizard-Step-Komponente mit Stil-Karten (Preview + Label) |
| **Wizard-Integration** | Neuer Step im Wizard-Flow (nach Story-Type oder Characters) |
| **Preview-Bilder** | Generieren/Hochladen für alle 6 Styles → `image_styles.preview_image_url` |
| **kid_profiles.preferred_image_style** | Feld für Style-Preference (oder `image_style` umwidmen) |
| **Frontend → Backend Durchreichung** | `image_style_key` aus Wizard-State an `generate-story` Edge Function senden |
| **Style-Persistenz** | "Letzter Style" pro Kind merken + als Default vorselektieren |
| **Translations** | Style-Picker UI-Strings in allen 7 Sprachen |
| **Serien-Logik** | Style der ersten Episode für Folge-Episoden übernehmen |

### Bestehende Patterns/Conventions

1. **State Management:** `useState` in Parent, Props + `onComplete` in Steps
2. **UI:** Shadcn/ui Cards mit Tailwind, `useColorPalette()` für Kid-spezifische Farben
3. **Translations:** Interface-Feld + 7 Sprachen im translations-Objekt
4. **DB-Zugriff:** `supabase.from('table').select()` direkt, kein ORM
5. **Wizard-Navigation:** `setCurrentScreen("next-step")` Pattern
6. **Edge Function Input:** JSON body mit allen Parametern, `image_style_key` bereits als Parameter vorhanden
7. **Naming:** `snake_case` für DB-Felder, `camelCase` für TypeScript

### Potenzielle Konflikte / Breaking Changes

| Risiko | Beschreibung | Mitigation |
|--------|-------------|------------|
| `kid_profiles.image_style` Umbenennung | Feld existiert mit Default `'modern cartoon'` (Freitext) | Neues Feld `preferred_image_style_key` statt umbenennen, oder Migration mit Mapping |
| Serien-Style-Lock | Ep 2-5 müssen den Style von Ep 1 erben, nicht den aktuellen Preference | Style aus `stories.image_style_key` der Ep 1 lesen |
| Altersgruppen-Filter | Styles sind altersgruppenbeschränkt → Kinderwechsel kann Style ungültig machen | Fallback auf Default wenn gewählter Style nicht mehr passt |
| `preview_image_url` NULL | Alle 6 Styles haben `NULL` → Picker ohne Bilder ist schlecht | Preview-Bilder vor UI-Launch generieren |
| Caching | Image-Cache basiert auf Prompt-Hash → Style-Änderung = neuer Prompt = Cache-Miss | Gewünscht, aber bei vielen Styles steigt Cache-Miss-Rate |
