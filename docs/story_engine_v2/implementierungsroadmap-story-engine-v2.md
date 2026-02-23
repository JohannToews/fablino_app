# Implementierungsroadmap — Story Engine Optimierung V2 (Emotion-Flow-Engine)

> **Erstellt**: 2026-02-22  
> **Basis**: emotion-flow-engine-blueprint.md, Content Specs 01-03, Ergänzungen (Fabelwesen, Relationship Context)  
> **Kernprinzip**: Feature-Flag-gesteuert. Bestehende Engine bleibt 100% funktionsfähig. Neue Engine nur für Admin, dann schrittweiser Rollout.

---

## Übersicht: 8 Phasen

| Phase | Name | Tasks | Risiko für bestehende Engine |
|-------|------|-------|------------------------------|
| 1 | Feature-Flag & Infrastruktur | 3 | ⬜ Null (nur neue Tabelle + Settings) |
| 2 | DB-Schema & Migrations | 4 | ⬜ Null (neue Tabellen, nullable Spalten) |
| 3 | Seed-Daten | 4 | ⬜ Null (nur INSERTs in neue Tabellen) |
| 4 | Selection-Logik | 5 | ⬜ Null (neuer Code-Pfad, alte Pipeline unangetastet) |
| 5 | Prompt-Builder V2 | 4 | 🟡 Gering (neuer Builder parallel, alter bleibt) |
| 6 | Integration & Engine-Switch | 3 | 🟡 Gering (Branch-Logik in generate-story) |
| 7 | Admin-UI & Testing | 4 | ⬜ Null (UI + Tests) |
| 8 | Rollout & Monitoring | 3 | ⬜ Null (schrittweise Aktivierung) |

**Geschätzter Gesamtaufwand**: ~30 Tasks, ~5-7 Arbeitstage

---

## Sicherheitsprinzipien (gelten für ALLE Phasen)

### Feature-Flag-Architektur
```
app_settings.emotion_flow_enabled_users = JSON Array
  []        → niemand (Default)
  ["uuid"]  → nur diese User
  ["*"]     → alle User
```

### Branching-Logik in generate-story
```
if (userInEmotionFlowList) {
  try {
    result = await newEmotionFlowEngine(params);
  } catch (error) {
    log.error('EmotionFlow failed, falling back', error);
    result = await existingEngine(params);  // ← IMMER verfügbar
  }
} else {
  result = await existingEngine(params);    // ← 0 Changes
}
```

### Regression-Test-Strategie
- Jede Phase endet mit Regression-Tests für die ALTE Engine
- Test: Story generieren ohne Feature-Flag → muss identisch zur aktuellen Version funktionieren
- Test: Story generieren MIT Feature-Flag + absichtlichem Fehler in neuer Engine → Fallback auf alte Engine
- Alle neuen Spalten auf `stories` sind NULLABLE → alte Stories bleiben valide

---

## Phase 1: Feature-Flag & Infrastruktur

### Task 1.1 — Engine Toggle in app_settings

**Ziel**: Feature-Flag-System einrichten, bevor irgendein neuer Code geschrieben wird.

**Cursor-Prompt**:
```
Aufgabe: Implementiere ein Feature-Flag für die neue Emotion-Flow-Engine.

Kontext: Wir bauen eine neue Story-Engine, die parallel zur bestehenden laufen soll. 
Die neue Engine darf NUR für explizit freigeschaltete User aktiv sein. 
Alle anderen User nutzen weiterhin die bestehende Pipeline — ohne jede Änderung.

Schritte:
1. Erstelle eine Supabase-Migration die einen neuen Key in app_settings einfügt:
   - Key: 'emotion_flow_enabled_users'
   - Value: '[]' (leeres JSON-Array)
   - Beschreibung: 'User-IDs für die die neue Emotion-Flow-Engine aktiv ist. ["*"] = alle.'

2. Erstelle eine Utility-Funktion isEmotionFlowEnabled(userId: string): Promise<boolean>
   - Liest app_settings Key 'emotion_flow_enabled_users'
   - Prüft ob userId im Array ist ODER ob Array ["*"] enthält
   - Gibt false zurück bei jedem Fehler (fail-safe)
   - Cached das Ergebnis für die Dauer des Requests (kein DB-Call pro Story)

3. Erstelle die Funktion in einer neuen Datei: 
   supabase/functions/_shared/emotionFlow/featureFlag.ts

WICHTIG: 
- Keinerlei Änderung an bestehenden Dateien
- Die Funktion wird vorerst NIRGENDS aufgerufen — das kommt in Phase 6
- Schreibe einen einfachen Test der die Funktion mit verschiedenen Inputs testet
```

---

### Task 1.2 — Projekt-Struktur für Emotion-Flow-Module

**Ziel**: Klare Ordnerstruktur für allen neuen Code, komplett getrennt von bestehender Pipeline.

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Ordnerstruktur für die neue Emotion-Flow-Engine.

Alle neuen Dateien kommen in einen eigenen Namespace, getrennt von der bestehenden 
Story-Pipeline. Bestehende Dateien werden NICHT verändert.

Erstelle folgende leere Dateien mit TODO-Kommentaren und TypeScript-Interfaces:

supabase/functions/_shared/emotionFlow/
├── featureFlag.ts          (aus Task 1.1 — schon vorhanden)
├── types.ts                 → Alle TypeScript-Interfaces für die neue Engine
│   - EmotionBlueprint, CharacterSeed, StoryElement
│   - SelectionResult, PromptBlocks
│   - IntensityLevel ('light' | 'medium' | 'deep')
│   - ToneMode ('dramatic' | 'comedic' | 'adventurous' | 'gentle' | 'absurd')
│   - CreatureType ('human' | 'mythical')
├── selectors/
│   ├── intensitySelector.ts  → selectIntensity()
│   ├── blueprintSelector.ts  → selectBlueprint()
│   ├── toneSelector.ts       → selectTone()
│   ├── characterSelector.ts  → selectCharacterSeed()
│   └── elementSelector.ts    → selectStoryElements()
├── promptBuilder/
│   ├── emotionFlowPromptBuilder.ts → buildEmotionFlowPrompt()
│   ├── blocks/
│   │   ├── arcBlock.ts            → Emotion Blueprint → Prompt-Text
│   │   ├── toneBlock.ts           → Tone-Anweisungen
│   │   ├── characterBlock.ts      → Character Seed → Prompt-Text
│   │   ├── elementBlocks.ts       → Story Elements → Prompt-Snippets
│   │   └── relationshipBlock.ts   → Relationship Context (NEU, nicht im Blueprint)
│   └── criticalRules.ts          → "NO moral, NO lesson" Regel
├── historyTracker.ts        → History-Einträge nach Story-Generierung schreiben
└── engine.ts                → Hauptorchestrator: runEmotionFlowEngine()

Für types.ts, definiere die Interfaces basierend auf dem DB-Schema:
- EmotionBlueprint mit arc_by_age als Record<string, { steps: number, arc: string[], arc_prompt: string }>
- CharacterSeed mit creature_type: 'human' | 'mythical'
- StoryElement mit element_type als Union-Type der 7 Typen
- SelectionResult das alle gewählten Bausteine zusammenfasst

WICHTIG: Nur Dateistruktur und Interfaces. Keine Logik implementieren.
```

---

### Task 1.3 — Regression-Test-Suite für bestehende Engine

**Ziel**: Automatisierte Tests die sicherstellen, dass die alte Engine immer funktioniert.

**Cursor-Prompt**:
```
Aufgabe: Erstelle eine Regression-Test-Suite für die bestehende Story-Engine.

Diese Tests müssen VOR jeder Änderung grün sein und nach JEDER Phase weiterhin grün bleiben.
Sie sind unser Sicherheitsnetz.

Erstelle: supabase/functions/tests/regression/existingEngine.test.ts

Tests:
1. "Bestehende Engine generiert Story ohne Feature-Flag"
   - Simuliere einen Request ohne emotion_flow_enabled_users
   - Prüfe: Story wird generiert, hat KEINEN emotion_blueprint_key
   - Prüfe: Alle bestehenden Felder (theme, subtype, style) sind befüllt

2. "Bestehende Engine ignoriert neue Tabellen"
   - Prüfe: promptBuilder.ts liest NICHT aus emotion_blueprints/character_seeds/story_elements
   - Prüfe: Kein Import aus emotionFlow/ Ordner in bestehenden Dateien

3. "Neue nullable Spalten brechen bestehende Queries nicht"
   - Prüfe: SELECT * FROM stories WHERE emotion_blueprint_key IS NULL gibt alle alten Stories
   - Prüfe: Bestehende Story-Queries (Dashboard, History, etc.) funktionieren

4. "Feature-Flag false → komplette bestehende Pipeline"
   - Mock: app_settings emotion_flow_enabled_users = []
   - Prüfe: generate-story nutzt 0% neuen Code

Nutze das bestehende Test-Framework des Projekts.
Falls kein Test-Framework existiert, richte vitest ein (minimal, nur für diese Tests).

WICHTIG: Diese Tests sind heilig. Sie dürfen in keiner späteren Phase gelöscht oder 
abgeschwächt werden.
```

---

## Phase 2: DB-Schema & Migrations

### Task 2.1 — Core Tables (emotion_blueprints, character_seeds, story_elements)

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Supabase-Migration für die 3 Core-Tabellen der Emotion-Flow-Engine.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_core_tables.sql

Tabelle 1: emotion_blueprints
- Schema exakt wie im Blueprint (Abschnitt 2.1)
- Alle Spalten, CHECK Constraints, Defaults
- blueprint_key TEXT UNIQUE NOT NULL
- arc_by_age JSONB NOT NULL
- arc_description_en TEXT NOT NULL
- category CHECK IN ('growth', 'social', 'courage', 'empathy', 'humor', 'wonder')
- min_intensity CHECK IN ('light', 'medium', 'deep')
- ideal_age_groups TEXT[] NOT NULL
- compatible_themes TEXT[]
- compatible_learning_themes TEXT[]
- weight INTEGER DEFAULT 10, is_active BOOLEAN DEFAULT true
- created_at, updated_at mit Trigger

Tabelle 2: character_seeds
- Schema exakt wie im Blueprint (Abschnitt 2.2)
- PLUS neues Feld: creature_type TEXT NOT NULL DEFAULT 'human' 
  CHECK IN ('human', 'mythical')
- seed_type CHECK IN ('protagonist_appearance', 'sidekick_archetype', 'antagonist_archetype')
- gender CHECK IN ('female', 'male', 'neutral')
- appearance_en, personality_trait_en, weakness_en, strength_en
- cultural_background, name_pool JSONB, age_range TEXT[]
- weight, is_active, created_at, updated_at

Tabelle 3: story_elements
- Schema exakt wie im Blueprint (Abschnitt 2.3)
- element_type CHECK IN ('opening_style', 'narrative_perspective', 'macguffin', 
  'setting_detail', 'humor_technique', 'tension_technique', 'closing_style')
- content_en TEXT NOT NULL
- compatible_themes TEXT[], compatible_categories TEXT[]
- age_groups TEXT[], weight, is_active, created_at

Erstelle updated_at Trigger für emotion_blueprints und character_seeds.

WICHTIG:
- Keine Änderung an bestehenden Tabellen in dieser Migration
- Keine FKs zu bestehenden Tabellen
- Alle neuen Tabellen sind eigenständig
```

---

### Task 2.2 — History/Tracking Tables

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Supabase-Migration für die History/Tracking-Tabellen.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_history_tables.sql

Tabelle 1: emotion_blueprint_history
- id UUID PK DEFAULT gen_random_uuid()
- kid_profile_id UUID NOT NULL (FK → kid_profiles)
- blueprint_key TEXT NOT NULL
- tone_mode TEXT
- intensity_level TEXT
- story_id UUID (FK → stories)
- created_at TIMESTAMPTZ DEFAULT now()

Tabelle 2: character_seed_history
- id UUID PK DEFAULT gen_random_uuid()
- kid_profile_id UUID NOT NULL (FK → kid_profiles)
- seed_key TEXT NOT NULL
- seed_type TEXT NOT NULL
- story_id UUID (FK → stories)
- created_at TIMESTAMPTZ DEFAULT now()

Tabelle 3: story_element_usage
- id UUID PK DEFAULT gen_random_uuid()
- kid_profile_id UUID NOT NULL (FK → kid_profiles)
- element_key TEXT NOT NULL
- element_type TEXT NOT NULL
- story_id UUID (FK → stories)
- created_at TIMESTAMPTZ DEFAULT now()

Indizes für Performance:
- emotion_blueprint_history: (kid_profile_id, created_at DESC)
- character_seed_history: (kid_profile_id, seed_type, created_at DESC)
- story_element_usage: (kid_profile_id, element_type, created_at DESC)

WICHTIG: FKs zu kid_profiles und stories sind die einzige Berührung mit bestehenden 
Tabellen — und FKs sind rein deklarativ, ändern nichts am Verhalten.
```

---

### Task 2.3 — Stories-Tabelle erweitern (neue nullable Spalten)

**Cursor-Prompt**:
```
Aufgabe: Erweitere die bestehende stories-Tabelle um nullable Spalten für die Emotion-Flow-Engine.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_stories_columns.sql

Neue Spalten (alle NULLABLE — alte Stories bleiben unberührt):
- emotion_blueprint_key TEXT (FK → emotion_blueprints.blueprint_key)
- tone_mode TEXT CHECK (tone_mode IS NULL OR tone_mode IN ('dramatic','comedic','adventurous','gentle','absurd'))
- intensity_level TEXT CHECK (intensity_level IS NULL OR intensity_level IN ('light','medium','deep'))
- character_seed_key TEXT (FK → character_seeds.seed_key)
- sidekick_seed_key TEXT (FK → character_seeds.seed_key)
- opening_element_key TEXT (FK → story_elements.element_key)
- perspective_element_key TEXT (FK → story_elements.element_key)

FKs referenzieren _key Spalten (TEXT), nicht UUIDs — konsistent mit bestehendem Pattern 
(image_style_key referenziert image_styles.style_key).

WICHTIG:
- Alle Spalten sind NULLABLE — kein DEFAULT, kein NOT NULL
- Bestehende Stories bekommen automatisch NULL in allen neuen Spalten
- Bestehende Queries die SELECT * oder spezifische Spalten nutzen brechen NICHT
- Teste nach Migration: SELECT count(*) FROM stories WHERE emotion_blueprint_key IS NULL 
  muss alle existierenden Stories zurückgeben

REGRESSION-CHECK nach dieser Migration:
- Bestehende Story-Generierung testen → muss identisch funktionieren
- Dashboard/History-Seiten testen → dürfen nicht brechen
```

---

### Task 2.4 — RLS Policies für neue Tabellen

**Cursor-Prompt**:
```
Aufgabe: Erstelle RLS Policies für alle neuen Emotion-Flow-Tabellen.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_rls.sql

Policies:
1. emotion_blueprints, character_seeds, story_elements (Referenzdaten):
   - SELECT: für alle authenticated Users (diese Daten sind nicht user-spezifisch)
   - INSERT/UPDATE/DELETE: nur service_role (Admin/Edge Functions)

2. emotion_blueprint_history, character_seed_history, story_element_usage (User-Daten):
   - SELECT: User sieht nur eigene Einträge (via kid_profiles → user_id Verknüpfung)
   - INSERT: service_role (Edge Functions schreiben nach Story-Generierung)
   - UPDATE/DELETE: nur service_role

Orientiere dich am bestehenden RLS-Pattern für story_subtype_history.

WICHTIG: Aktiviere RLS auf allen neuen Tabellen mit ALTER TABLE ... ENABLE ROW LEVEL SECURITY.
```

---

## Phase 3: Seed-Daten

### Task 3.1 — Emotion Blueprints einfügen (21 Blueprints)

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Seed-Migration für alle 21 Emotion Blueprints.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_seed_blueprints.sql

Füge alle 21 Blueprints aus content-spec-01-emotion-blueprints.md als INSERT-Statements ein.

Für jeden Blueprint:
- blueprint_key, labels (nur de + en vorerst), descriptions (nur de + en)
- category, min_intensity
- arc_by_age als JSONB (mit allen 3 Altersgruppen und arc_prompt)
- arc_description_en (Zusammenfassung des Blueprints)
- tone_guidance, tension_curve, surprise_moment, ending_feeling
- compatible_themes, ideal_age_groups, compatible_learning_themes
- weight = 10 (Standard), is_active = true

Die 21 Blueprints sind:
1. overconfidence_and_fall (growth)
2. fear_to_courage (growth)  
3. failure_is_learning (growth)
4. finding_your_voice (growth)
5. standing_up_for_others (social)
6. the_outsider (social)
7. misunderstanding_resolved (social)
8. unexpected_friendship (social)
9. letting_go (social)
10. first_time (courage)
11. protecting_something_small (courage)
12. doing_the_right_thing (courage)
13. walking_in_their_shoes (empathy)
14. the_invisible_helper (empathy)
15. forgiving (empathy)
16. chaos_cascade (humor)
17. the_plan_that_backfires (humor)
18. role_reversal_comedy (humor)
19. discovering_a_hidden_world (wonder)
20. the_impossible_made_possible (wonder)
21. nature_speaks (wonder)

Fehlende Sprachen (fr, es, nl, it, bs) werden in einem separaten Task via LLM generiert.

WICHTIG: INSERT nur — keine Änderung an bestehenden Daten.
Nutze ON CONFLICT (blueprint_key) DO NOTHING für Idempotenz.
```

---

### Task 3.2 — Character Seeds einfügen (48 Seeds)

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Seed-Migration für alle Character Seeds.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_seed_characters.sql

Aus content-spec-02-character-seeds.md:

A) 30 Protagonist Appearances (creature_type = 'human'):
   - P01-P30 wie im Dokument definiert
   - seed_type = 'protagonist_appearance'
   - Jeder mit: appearance_en, personality_trait_en, weakness_en, strength_en,
     cultural_background, gender, age_range, name_pool

B) 10-15 Fabelwesen-Protagonist-Seeds (creature_type = 'mythical') — NEU, nicht im Dokument:
   Erstelle folgende Fabelwesen-Seeds:
   - FM01: wise_fox (Schlaues Fuchsmädchen, orange Fell, buschiger Schwanz)
   - FM02: small_dragon (Kleiner unsicherer Drache der noch nicht fliegen kann)
   - FM03: talking_cat (Straßenkatze mit großer Klappe und weichem Herz)
   - FM04: forest_spirit (Scheues Waldwesen aus Moos und Licht)
   - FM05: brave_mouse (Winzige Maus die sich für riesig hält)
   - FM06: cloud_bear (Sanfter Bär aus Wolkenstoff der vom Himmel gefallen ist)
   - FM07: star_hare (Hase dessen Fell nachts leuchtet)
   - FM08: river_otter (Verspielter Otter der nie stillsitzen kann)
   - FM09: old_owl (Alte Eule die so tut als wüsste sie alles — stimmt nicht immer)
   - FM10: stone_troll (Tollpatschiger Troll der ständig Dinge kaputt macht, weil er zu groß ist)
   - FM11: wind_fairy (Windgeist die Geheimnisse flüstert)
   - FM12: mushroom_gnome (Winziger Pilzwichtel der underground lebt)
   
   Jeder Fabelwesen-Seed braucht:
   - appearance_en (detailliert genug für Image-Prompts)
   - personality_trait_en, weakness_en, strength_en
   - creature_type = 'mythical'
   - gender (verteilt: female/male/neutral)
   - age_range (alle Fabelwesen für alle Altersgruppen)
   - name_pool mit passenden Fantasy-Namen
   - cultural_background = 'mythical'

C) 10 Sidekick Archetypes (S01-S10):
   - seed_type = 'sidekick_archetype'
   - creature_type = 'human' (Sidekicks bekommen Aussehen separat)

D) 8 Antagonist Archetypes (A01-A08):
   - seed_type = 'antagonist_archetype'
   - creature_type = 'human'

ON CONFLICT (seed_key) DO NOTHING für Idempotenz.
```

---

### Task 3.3 — Story Elements einfügen (~90 Elemente)

**Cursor-Prompt**:
```
Aufgabe: Erstelle die Seed-Migration für alle Story Elements.

Erstelle: supabase/migrations/YYYYMMDD_emotion_flow_seed_elements.sql

Aus content-spec-03-story-elements.md, alle 7 Typen:

1. opening_style (15): O01-O15
2. narrative_perspective (10): N01-N10
3. macguffin (15): M01-M15
4. setting_detail (15): SD01-SD15
5. humor_technique (15): H01-H15
6. tension_technique (10): T01-T10
7. closing_style (10): C01-C10

Für jedes Element:
- element_key (z.B. 'opening_sound_first', 'macguffin_changing_map')
- element_type
- content_en (der Prompt-Snippet Text)
- age_groups TEXT[]
- compatible_themes TEXT[] (NULL = alle)
- compatible_categories TEXT[] (NULL = alle Blueprint-Kategorien)
- weight = 10, is_active = true

ON CONFLICT (element_key) DO NOTHING.
Total: ~90 Elemente.
```

---

### Task 3.4 — Fehlende Übersetzungen generieren

**Cursor-Prompt**:
```
Aufgabe: Generiere die fehlenden Übersetzungen für labels und descriptions.

Aktuell haben emotion_blueprints nur de + en in labels/descriptions.
Fehlende Sprachen: fr, es, nl, it, bs (Bosnisch).

Erstelle ein Script: scripts/generate-translations.ts

Das Script:
1. Liest alle emotion_blueprints aus der DB
2. Für jeden Blueprint: nimmt de + en labels/descriptions
3. Ruft ein LLM auf (Claude via API) mit Prompt:
   "Translate the following children's reading app UI text. Keep it short, friendly, age-appropriate.
    DE: {de_text}
    EN: {en_text}
    Translate to: FR, ES, NL, IT, BS
    Return JSON: {fr: '...', es: '...', nl: '...', it: '...', bs: '...'}"
4. Updated die JSONB labels/descriptions mit den neuen Sprachen
5. Schreibt ein UPDATE-Statement pro Blueprint

WICHTIG: 
- Dieses Script wird EINMALIG manuell ausgeführt, nicht bei jedem Deploy
- Ergebnisse werden als SQL-Migration gespeichert für Reproduzierbarkeit
- character_seeds labels werden analog übersetzt (niedrigere Priorität — Admin-only)
```

---

## Phase 4: Selection-Logik

### Task 4.1 — Intensity Selector

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Intensity-Auswahl für die Emotion-Flow-Engine.

Datei: supabase/functions/_shared/emotionFlow/selectors/intensitySelector.ts

Funktion: selectIntensity(kidProfileId: string, supabase: SupabaseClient): Promise<IntensityLevel>

Logik:
1. Gewichteter Zufall: 30% light, 50% medium, 20% deep
2. Anti-Monotonie: Lade letzte 3 Intensitäten aus emotion_blueprint_history
   - Wenn letzte 3 gleich → force eine andere Intensität
   - Wenn letzte 3 alle "medium" → 50/50 Chance auf "light" oder "deep"
3. Return: 'light' | 'medium' | 'deep'

Die Gewichtung ist als Konstante definiert (nicht DB-konfigurierbar):
const INTENSITY_WEIGHTS = { light: 30, medium: 50, deep: 20 };

Edge Cases:
- Keine History vorhanden (neues Kind) → normaler gewichteter Zufall
- DB-Fehler → Default 'medium'

Exportiere auch die Konstante für Tests.
Schreibe Unit-Tests die die Verteilung über 1000 Aufrufe prüfen.
```

---

### Task 4.2 — Blueprint Selector

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Blueprint-Auswahl.

Datei: supabase/functions/_shared/emotionFlow/selectors/blueprintSelector.ts

Funktion: selectBlueprint(params: {
  kidProfileId: string,
  ageGroup: string,          // '6-7' | '8-9' | '10-11'
  theme: string,             // 'magic_fantasy' | 'adventure_action' | 'real_life' | 'surprise'
  intensity: IntensityLevel,
  learningTheme?: string,    // optional aktives Learning Theme
  supabase: SupabaseClient
}): Promise<EmotionBlueprint | null>

Logik:
1. Wenn intensity === 'light': return null (kein Blueprint nötig)
2. Query emotion_blueprints mit Filtern:
   - is_active = true
   - ideal_age_groups enthält ageGroup
   - compatible_themes enthält theme (oder compatible_themes IS NULL)
   - min_intensity ≤ intensity (light < medium < deep)
3. Exclude: letzte 5 blueprint_keys aus emotion_blueprint_history für dieses Kind
4. Wenn learningTheme vorhanden UND Blueprint hat compatible_learning_themes Match:
   → Soft-Boost: weight * 2 für diese Blueprints
5. Weighted Random aus verbleibenden Blueprints
6. Lade arc_by_age[ageGroup] — wenn nicht vorhanden, nächstniedrigere Altersgruppe

Fallback-Kette:
- Keine Blueprints nach Filter → History-Exclude lockern (letzte 3 statt 5)
- Immer noch keine → History komplett ignorieren, Random aus allen passenden
- Immer noch keine → return null (Story wird ohne Blueprint generiert = light intensity)

WICHTIG: Die Query darf die bestehende Pipeline nicht berühren. 
Nur Reads auf die neuen Tabellen.
```

---

### Task 4.3 — Tone Selector

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Tone-Auswahl.

Datei: supabase/functions/_shared/emotionFlow/selectors/toneSelector.ts

Funktion: selectTone(params: {
  kidProfileId: string,
  ageGroup: string,
  blueprintCategory?: string,  // 'growth' | 'social' | 'humor' | etc.
  supabase: SupabaseClient
}): Promise<ToneMode>

Tone-Pool: ['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd']

Logik:
1. Exclude: letzte 2 tone_modes aus emotion_blueprint_history
2. Gewichtung:
   - 'absurd': nur wenn blueprintCategory === 'humor' UND ageGroup in ['6-7', '8-9']
   - 'gentle': höheres Gewicht für ageGroup '6-7'
   - 'dramatic': höheres Gewicht für ageGroup '10-11'
   - Sonst: gleich verteilt
3. Weighted Random aus verbleibenden Tones

Edge Cases:
- Kein Blueprint (light intensity) → Tone wird trotzdem gewählt (für Prompt-Anreicherung)
- Alle Tones excluded → Reset, wähle aus vollem Pool
```

---

### Task 4.4 — Character Seed Selector

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Character-Seed-Auswahl.

Datei: supabase/functions/_shared/emotionFlow/selectors/characterSelector.ts

Funktion: selectCharacterSeeds(params: {
  kidProfileId: string,
  ageGroup: string,
  theme: string,
  characterMode: 'self' | 'family' | 'surprise',
  blueprintCategory?: string,
  supabase: SupabaseClient
}): Promise<{
  protagonist?: CharacterSeed,     // null wenn 'self' oder 'family'
  sidekick: CharacterSeed,
  antagonist?: CharacterSeed       // nur bei social-Blueprints
}>

Logik nach characterMode:

A) characterMode === 'surprise' (keine Hauptpersonen ausgewählt):
   → Protagonist wird aus Seeds gewählt (Mensch ODER Fabelwesen)
   → Creature-Type-Gewichtung nach Alter + Theme:
   
   Alter/Theme-Matrix für creature_type Wahrscheinlichkeit:
   | Alter | magic_fantasy | adventure_action | real_life | surprise |
   |-------|--------------|-----------------|-----------|----------|
   | 6-7   | 80% mythical | 60% mythical    | 30% mythical | 60% mythical |
   | 8-9   | 50% mythical | 30% mythical    | 10% mythical | 30% mythical |
   | 10-11 | 30% mythical | 15% mythical    | 5% mythical  | 20% mythical |
   
   1. Bestimme creature_type via gewichteten Zufall (Tabelle oben)
   2. Filter protagonist Seeds: creature_type, age_range enthält ageGroup
   3. Exclude: letzte 3 protagonist Seeds aus character_seed_history
   4. Diversity-Check: wenn letzte 5 Seeds gleicher cultural_background → force anders
   5. Weighted Random

B) characterMode === 'self' oder 'family':
   → Kein Protagonist-Seed (Aussehen kommt aus kid_profile / kid_characters)
   → Sidekick und Antagonist trotzdem aus Seeds

Sidekick (IMMER):
   1. Filter: seed_type = 'sidekick_archetype', is_active = true
   2. Exclude: letzte 3 aus character_seed_history (seed_type = 'sidekick')
   3. Weighted Random

Antagonist (nur wenn blueprintCategory in ['social', 'courage']):
   1. Filter: seed_type = 'antagonist_archetype', is_active = true
   2. Exclude: letzte 2 aus character_seed_history (seed_type = 'antagonist')
   3. Weighted Random

Speichere die Gewichtungs-Matrix als Konstante:
const CREATURE_TYPE_WEIGHTS: Record<string, Record<string, number>> = { ... }
```

---

### Task 4.5 — Story Element Selector

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Story-Element-Auswahl.

Datei: supabase/functions/_shared/emotionFlow/selectors/elementSelector.ts

Funktion: selectStoryElements(params: {
  kidProfileId: string,
  ageGroup: string,
  theme: string,
  intensity: IntensityLevel,
  blueprintCategory?: string,
  supabase: SupabaseClient
}): Promise<{
  opening: StoryElement,
  perspective: StoryElement,
  macguffin?: StoryElement,      // optional, basierend auf Theme
  settingDetail?: StoryElement,   // optional
  humorTechnique?: StoryElement,  // wenn tone comedic/absurd ODER blueprint humor
  tensionTechnique?: StoryElement, // wenn intensity deep UND age >= 8-9
  closing: StoryElement
}>

Für jeden Element-Typ:
1. Filter: element_type, age_groups enthält ageGroup, 
   compatible_themes enthält theme (oder NULL),
   compatible_categories enthält blueprintCategory (oder NULL)
2. Exclude: letzte 3 element_keys dieses Typs aus story_element_usage
3. Weighted Random

Welche Elemente gewählt werden hängt ab von:
- opening_style: IMMER
- narrative_perspective: IMMER
- macguffin: bei magic_fantasy + adventure_action, ODER bei intensity deep
- setting_detail: bei 50% der Stories (Zufall)
- humor_technique: bei tone comedic/absurd ODER blueprintCategory humor
- tension_technique: nur bei intensity deep UND ageGroup != '6-7'
- closing_style: IMMER

Edge Case: Kein Element nach Filter → ignore History, Random aus allen passenden.
```

---

## Phase 5: Prompt-Builder V2

### Task 5.1 — Relationship Context Block (NEU)

**Cursor-Prompt**:
```
Aufgabe: Implementiere den Relationship Context Block — ein neuer Prompt-Baustein 
der die Beziehungen der Hauptpersonen in den emotionalen Arc einwebt.

Datei: supabase/functions/_shared/emotionFlow/promptBuilder/blocks/relationshipBlock.ts

Funktion: buildRelationshipBlock(params: {
  characterMode: 'self' | 'family' | 'surprise',
  kidProfile: KidProfile,              // Name, Alter, Aussehen
  selectedCharacters: KidCharacter[],   // Geschwister, Freunde (aus kid_characters)
  protagonistSeed?: CharacterSeed,      // nur bei 'surprise'
  sidekickSeed: CharacterSeed,
  blueprintCategory?: string,
  arcPrompt?: string                    // der arc_prompt des gewählten Blueprints
}): string

Logik:

A) characterMode === 'surprise':
   → Protagonist = Seed (Mensch oder Fabelwesen)
   → Sidekick = Seed
   → Alle Personen sind fiktiv
   → Block beschreibt Protagonist + Sidekick Dynamik
   
   Beispiel Output:
   "## CHARACTERS
   PROTAGONIST: [Name from seed name_pool]. [appearance_en]. [personality_trait_en]. 
   FLAW: [weakness_en]. STRENGTH: [strength_en].
   SIDEKICK: [sidekick personality_trait_en]. FLAW: [weakness_en]. STRENGTH: [strength_en].
   
   RELATIONSHIP DYNAMIC: The protagonist and sidekick should have a push-pull dynamic. 
   Their strengths complement each other. Their weaknesses create conflict that the 
   emotional arc resolves."

B) characterMode === 'self':
   → Protagonist = das Kind selbst (aus kid_profile)
   → Sidekick-Archetyp wird einem fiktiven Charakter zugewiesen
   → Emotionaler Arc wird auf das Kind als Protagonist angewendet
   
   Beispiel Output:
   "## CHARACTERS
   PROTAGONIST: [Kid name], [age] years old. [Appearance from kid_profile].
   This is a real child — make the emotional journey feel authentic to their age.
   SIDEKICK: A new character with this personality: [sidekick personality_trait_en].
   
   RELATIONSHIP: The sidekick complements the protagonist. If the arc involves conflict,
   the conflict should feel realistic for this age group."

C) characterMode === 'family':
   → Protagonist = das Kind
   → Geschwister/Freunde = aus kid_characters
   → Emotionaler Arc wird auf DEREN Beziehungsdynamik angewendet
   → Sidekick-Rolle wird einer der realen Personen zugeordnet
   
   Beispiel Output:
   "## CHARACTERS
   PROTAGONIST: [Kid name], [age].
   CO-STARS: [sibling name] ([relationship]), [friend name] ([relationship]).
   These are REAL people in the child's life — their dynamic should feel authentic.
   
   RELATIONSHIP DYNAMIC: Apply the emotional arc to the relationships between these 
   characters. If the blueprint is about conflict resolution, the conflict should 
   involve the protagonist and one of the co-stars. If it's about courage, the 
   protagonist might find courage through or for one of the co-stars.
   
   SIDEKICK ROLE: [sibling/friend name] takes on the sidekick role: [archetype description]."

   Wichtig bei family: Die Personen dürfen auch Fabelwesen sein (z.B. Kind hat 
   einen Fantasie-Freund als kid_character). Das muss respektiert werden.

WICHTIG: Dieser Block ist NEU und nicht im ursprünglichen Blueprint. 
Er wird in den Prompt zwischen Character Seed Block und Element Blocks eingefügt.
```

---

### Task 5.2 — Arc, Tone & Element Blocks

**Cursor-Prompt**:
```
Aufgabe: Implementiere die Prompt-Blöcke für Arc, Tone, Character Seed und Story Elements.

Dateien:
- supabase/functions/_shared/emotionFlow/promptBuilder/blocks/arcBlock.ts
- supabase/functions/_shared/emotionFlow/promptBuilder/blocks/toneBlock.ts
- supabase/functions/_shared/emotionFlow/promptBuilder/blocks/characterBlock.ts
- supabase/functions/_shared/emotionFlow/promptBuilder/blocks/elementBlocks.ts
- supabase/functions/_shared/emotionFlow/promptBuilder/criticalRules.ts

1. arcBlock.ts — buildArcBlock(blueprint, ageGroup, intensity):
   - intensity 'light' → return '' (kein Arc-Block)
   - intensity 'medium' → Kurzer Block mit arc_prompt
     "## EMOTIONAL ARC (weave naturally into the plot — NO moral, NO lesson stated):
      {arc_by_age[ageGroup].arc_prompt}"
   - intensity 'deep' → Voller Block mit arc_prompt + tone_guidance + surprise_moment + ending_feeling
     "## EMOTIONAL ARC (follow this blueprint — the emotional journey IS the story):
      {arc_prompt}
      TONE WITHIN ARC: {tone_guidance}
      SURPRISE: {surprise_moment}
      ENDING FEELING: {ending_feeling}"

2. toneBlock.ts — buildToneBlock(toneMode):
   - Gibt einen vorformulierten Tone-Prompt zurück pro ToneMode
   - 5 Tone-Templates (dramatic, comedic, adventurous, gentle, absurd)
   - Jedes Template ist 2-3 Sätze, konkret und handlungsorientiert

3. characterBlock.ts — buildCharacterBlock(protagonistSeed, sidekickSeed):
   - "## PROTAGONIST APPEARANCE: {appearance_en}"
   - "## SIDEKICK: {personality_trait_en}. Weakness: {weakness_en}. Strength: {strength_en}"
   - Nur bei 'surprise' Mode → bei 'self'/'family' übernimmt relationshipBlock

4. elementBlocks.ts — buildElementBlocks(elements):
   - Für jedes ausgewählte Element: "## {TYPE_LABEL}:\n{content_en}"
   - Type-Labels: OPENING STYLE, NARRATIVE PERSPECTIVE, KEY OBJECT, SETTING, 
     HUMOR TECHNIQUE, TENSION TECHNIQUE, CLOSING STYLE

5. criticalRules.ts — getCriticalRules():
   - Gibt den IMMER angehängten Block zurück:
     "CRITICAL: The emotional development must emerge ORGANICALLY from the plot. 
      NO stated moral. NO lesson at the end. NO 'and they learned that...' 
      The child should FEEL, not be TAUGHT."

Alle Blöcke geben reine Strings zurück. Die Zusammensetzung passiert in Task 5.3.
```

---

### Task 5.3 — Emotion Flow Prompt Builder (Orchestrator)

**Cursor-Prompt**:
```
Aufgabe: Implementiere den Haupt-Prompt-Builder für die Emotion-Flow-Engine.

Datei: supabase/functions/_shared/emotionFlow/promptBuilder/emotionFlowPromptBuilder.ts

Funktion: buildEmotionFlowPrompt(params: {
  // Bestehende Params (kommen aus existierender Pipeline):
  ageRules: string,
  difficultyRules: string,
  themeRules: string,
  wordCounts: string,
  characters: string,        // User-gewählte Charaktere (bestehendes Format)
  guardrails: string,
  learningTheme?: string,
  imageInstructions: string,
  
  // Neue Params (aus Selection-Logik):
  arcBlock: string,
  toneBlock: string,
  characterBlock: string,     // oder relationshipBlock
  elementBlocks: string,
  criticalRules: string
}): string

Der Prompt wird so zusammengesetzt:

```
{ageRules}
{difficultyRules}
{themeRules}

--- EMOTION FLOW ENGINE ---
{arcBlock}
{toneBlock}
{characterBlock oder relationshipBlock}
{elementBlocks}
{criticalRules}
--- END EMOTION FLOW ---

{wordCounts}
{characters}
{guardrails}
{learningTheme}
{imageInstructions}
```

WICHTIG:
- Dieser Builder ERSETZT NICHT den bestehenden promptBuilder.ts
- Er ERWEITERT den bestehenden Output um die Emotion-Flow-Blöcke
- Die bestehenden Blöcke (ageRules, themeRules etc.) werden 1:1 übernommen
- Der bestehende promptBuilder.ts wird NICHT verändert
- Die Integration passiert in Phase 6 (generate-story)

Schreibe Tests die prüfen:
- Prompt enthält alle erwarteten Blöcke
- Bei intensity 'light' fehlt der Arc-Block
- Bei intensity 'deep' sind alle Detail-Felder vorhanden
- Character Block wechselt basierend auf characterMode
```

---

### Task 5.4 — Image Prompt Integration

**Cursor-Prompt**:
```
Aufgabe: Erweitere die Image-Prompt-Generierung für Character Seeds.

Datei: supabase/functions/_shared/emotionFlow/promptBuilder/imagePromptEnhancer.ts

Funktion: enhanceImagePrompt(params: {
  existingImagePrompt: string,  // Output des bestehenden imagePromptBuilder
  protagonistSeed?: CharacterSeed,
  characterMode: 'self' | 'family' | 'surprise'
}): string

Logik:
- characterMode 'surprise' UND protagonistSeed vorhanden:
  → Ersetze/ergänze character_anchor mit protagonistSeed.appearance_en
  → Füge hinzu: "MAINTAIN THIS EXACT APPEARANCE across all scenes: {appearance_en}"

- characterMode 'self' oder 'family':
  → Bestehender Image-Prompt bleibt unverändert
  → Protagonist-Aussehen kommt aus kid_profile (bestehendes Verhalten)
  → Nebenfiguren-Diversity: wenn Sidekick-Seed ein Aussehen hat, füge es als Hinweis hinzu

WICHTIG:
- Der bestehende imagePromptBuilder.ts wird NICHT verändert
- Diese Funktion ist ein Enhancer der den Output des bestehenden Builders nimmt 
  und optional ergänzt
- Wenn kein Seed vorhanden → Original-Prompt wird 1:1 zurückgegeben
```

---

## Phase 6: Integration & Engine-Switch

### Task 6.1 — Engine Orchestrator

**Cursor-Prompt**:
```
Aufgabe: Implementiere den Haupt-Orchestrator der Emotion-Flow-Engine.

Datei: supabase/functions/_shared/emotionFlow/engine.ts

Funktion: runEmotionFlowEngine(params: {
  kidProfileId: string,
  ageGroup: string,
  theme: string,
  characterMode: 'self' | 'family' | 'surprise',
  kidProfile: KidProfile,
  selectedCharacters: KidCharacter[],
  learningTheme?: string,
  supabase: SupabaseClient
}): Promise<EmotionFlowResult>

EmotionFlowResult = {
  intensity: IntensityLevel,
  blueprint: EmotionBlueprint | null,
  tone: ToneMode,
  protagonistSeed: CharacterSeed | null,
  sidekickSeed: CharacterSeed,
  antagonistSeed: CharacterSeed | null,
  elements: SelectedElements,
  promptBlocks: {
    arcBlock: string,
    toneBlock: string,
    characterBlock: string,
    elementBlocks: string,
    criticalRules: string
  },
  metadata: {
    // Für History-Tracking nach Story-Generierung
    blueprintKey: string | null,
    toneMode: string,
    intensityLevel: string,
    characterSeedKey: string | null,
    sidekickSeedKey: string,
    openingElementKey: string,
    perspectiveElementKey: string
  }
}

Der Orchestrator ruft in Reihenfolge auf:
1. selectIntensity()
2. selectBlueprint() (wenn intensity != light)
3. selectTone()
4. selectCharacterSeeds()
5. selectStoryElements()
6. buildRelationshipBlock() oder buildCharacterBlock()
7. buildArcBlock(), buildToneBlock(), buildElementBlocks()
8. getCriticalRules()
9. Packe alles in EmotionFlowResult

FEHLERBEHANDLUNG ist KRITISCH:
- Jeder Selector-Aufruf ist in try/catch
- Bei Fehler in einem Selector → logge, nutze sinnvollen Default
- Bei komplettem Versagen → throw Error (wird in generate-story gefangen → Fallback alte Engine)
- Logge jede Entscheidung für Debugging: 
  console.log('[EmotionFlow] Intensity: deep, Blueprint: fear_to_courage, Tone: dramatic')
```

---

### Task 6.2 — Integration in generate-story (der kritische Task)

**Cursor-Prompt**:
```
Aufgabe: Integriere die Emotion-Flow-Engine in die bestehende generate-story Edge Function.

Datei: supabase/functions/generate-story/index.ts (BESTEHENDE DATEI — MINIMAL ÄNDERN)

Dies ist der EINZIGE Task der eine bestehende Datei ändert. Minimale Änderungen.

Änderungen:
1. Import am Anfang der Datei:
   import { isEmotionFlowEnabled } from '../_shared/emotionFlow/featureFlag.ts'
   import { runEmotionFlowEngine } from '../_shared/emotionFlow/engine.ts'
   import { buildEmotionFlowPrompt } from '../_shared/emotionFlow/promptBuilder/emotionFlowPromptBuilder.ts'
   import { enhanceImagePrompt } from '../_shared/emotionFlow/promptBuilder/imagePromptEnhancer.ts'
   import { trackEmotionFlowHistory } from '../_shared/emotionFlow/historyTracker.ts'

2. Nach Auth + Request Parsing, VOR dem bestehenden Prompt-Building:
   
   const useEmotionFlow = await isEmotionFlowEnabled(userId);
   
   let emotionFlowResult = null;
   if (useEmotionFlow) {
     try {
       emotionFlowResult = await runEmotionFlowEngine({
         kidProfileId, ageGroup, theme, characterMode,
         kidProfile, selectedCharacters, learningTheme, supabase
       });
       console.log('[EmotionFlow] Engine succeeded:', emotionFlowResult.metadata);
     } catch (error) {
       console.error('[EmotionFlow] Engine failed, falling back to existing pipeline:', error);
       emotionFlowResult = null;  // Fallback: bestehende Pipeline
     }
   }

3. Beim Prompt-Building:
   
   if (emotionFlowResult) {
     // Neuer Prompt mit Emotion-Flow-Blöcken
     storyPrompt = buildEmotionFlowPrompt({
       ...existingPromptParams,  // ageRules, themeRules, etc. — ALLES bestehende
       ...emotionFlowResult.promptBlocks
     });
   } else {
     // Bestehender Prompt — KEIN CHANGE
     storyPrompt = buildStoryPrompt(existingParams);  // ← exakt wie bisher
   }

4. Bei Image-Prompt:
   
   if (emotionFlowResult) {
     imagePrompt = enhanceImagePrompt({
       existingImagePrompt: imagePrompt,
       protagonistSeed: emotionFlowResult.protagonistSeed,
       characterMode
     });
   }

5. Beim Speichern (Story INSERT):
   
   if (emotionFlowResult) {
     // Neue Spalten befüllen
     storyData.emotion_blueprint_key = emotionFlowResult.metadata.blueprintKey;
     storyData.tone_mode = emotionFlowResult.metadata.toneMode;
     storyData.intensity_level = emotionFlowResult.metadata.intensityLevel;
     storyData.character_seed_key = emotionFlowResult.metadata.characterSeedKey;
     storyData.sidekick_seed_key = emotionFlowResult.metadata.sidekickSeedKey;
     storyData.opening_element_key = emotionFlowResult.metadata.openingElementKey;
     storyData.perspective_element_key = emotionFlowResult.metadata.perspectiveElementKey;
   }

6. Nach erfolgreichem Speichern:
   
   if (emotionFlowResult) {
     await trackEmotionFlowHistory(emotionFlowResult.metadata, kidProfileId, storyId, supabase);
   }

KRITISCHE REGELN:
- Der bestehende Code-Pfad (wenn useEmotionFlow === false) wird NICHT verändert
- Kein Refactoring des bestehenden Codes
- Kein Entfernen von bestehendem Code
- Die if/else Struktur ist der EINZIGE Unterschied
- Bei jedem Fehler in der neuen Engine → emotionFlowResult = null → alter Pfad
```

---

### Task 6.3 — History Tracker

**Cursor-Prompt**:
```
Aufgabe: Implementiere das History-Tracking nach erfolgreicher Story-Generierung.

Datei: supabase/functions/_shared/emotionFlow/historyTracker.ts

Funktion: trackEmotionFlowHistory(
  metadata: EmotionFlowMetadata,
  kidProfileId: string,
  storyId: string,
  supabase: SupabaseClient
): Promise<void>

Schreibt nach erfolgreicher Story-Generierung in die History-Tabellen:

1. emotion_blueprint_history (wenn blueprint vorhanden):
   - kid_profile_id, blueprint_key, tone_mode, intensity_level, story_id

2. character_seed_history (für jeden verwendeten Seed):
   - kid_profile_id, seed_key, seed_type ('protagonist'/'sidekick'/'antagonist'), story_id

3. story_element_usage (für jedes verwendete Element):
   - kid_profile_id, element_key, element_type, story_id

WICHTIG:
- Alle INSERTs in einem try/catch — History-Fehler dürfen die Story NICHT brechen
- Die Story ist zu diesem Zeitpunkt schon gespeichert
- Bei Fehler: logge, aber wirf nicht
- Optional: batch INSERTs für Performance (aber nicht kritisch bei 3-7 Rows)
```

---

## Phase 7: Admin-UI & Testing

### Task 7.1 — Admin Toggle UI

**Cursor-Prompt**:
```
Aufgabe: Erstelle eine minimale Admin-UI zum Aktivieren/Deaktivieren der Emotion-Flow-Engine 
pro User.

Im bestehenden Admin-Panel (vermutlich unter Settings oder System):

UI:
- Überschrift: "Emotion-Flow-Engine"
- Liste aller User (aus user_profiles/kid_profiles)
- Checkbox pro User: aktiviert/deaktiviert
- Button: "Für alle aktivieren" / "Für alle deaktivieren"
- Status-Anzeige: "Aktiv für X von Y Usern"

Technisch:
- Liest: app_settings Key 'emotion_flow_enabled_users'
- Schreibt: Updated den JSON-Array mit User-IDs
- ["*"] für alle, [] für niemanden, ["uuid-1", "uuid-2"] für spezifisch

WICHTIG: 
- Nur Admin-User sehen diese UI (bestehende Admin-Logik nutzen)
- Änderungen wirken sofort (kein Cache)
- Initial: nur deine eigene UUID aktiviert
```

---

### Task 7.2 — Emotion-Flow-Diagnose-Panel

**Cursor-Prompt**:
```
Aufgabe: Erstelle ein Diagnose-Panel das zeigt welche Engine welche Story generiert hat.

Im Admin-Bereich, neue Seite oder Tab "Story Engine Diagnose":

Tabelle der letzten 50 Stories:
| Datum | Kind | Titel | Engine | Blueprint | Intensity | Tone | Seed |
|-------|------|-------|--------|-----------|-----------|------|------|

- "Engine" = "V1 (Classic)" wenn emotion_blueprint_key IS NULL, "V2 (EmotionFlow)" sonst
- Klick auf eine Story zeigt Details: alle verwendeten Blueprints, Seeds, Elements
- Filter: nur V1, nur V2, bestimmtes Kind
- Vergleichsmodus: V1 und V2 Stories nebeneinander für gleiches Kind

Datenquelle: stories Tabelle, neue Spalten für V2-Metadata.

WICHTIG: Nur lesen, kein Schreiben. Reines Monitoring.
```

---

### Task 7.3 — Integration Tests

**Cursor-Prompt**:
```
Aufgabe: Erstelle umfassende Integration Tests für die Emotion-Flow-Engine.

Datei: supabase/functions/tests/integration/emotionFlow.test.ts

Test-Suiten:

1. "Feature Flag Tests":
   - Flag aus → bestehende Engine, 0 neue Spalten befüllt
   - Flag an für User A → neue Engine für A, alte für B
   - Flag ["*"] → neue Engine für alle

2. "Selection Logic Tests":
   - Intensity Verteilung über 100 Runs ≈ 30/50/20 (±10%)
   - Blueprint wird nie 5x hintereinander für gleiches Kind wiederholt
   - Tone wird nie 2x hintereinander wiederholt
   - Character Seed Diversity: nie 5x gleicher cultural_background hintereinander

3. "Prompt Builder Tests":
   - Light intensity → kein Arc-Block im Prompt
   - Medium intensity → kurzer Arc-Block
   - Deep intensity → voller Arc-Block mit surprise_moment und ending_feeling
   - 'surprise' mode → Character Seed Block
   - 'self' mode → Relationship Block mit kid_profile
   - 'family' mode → Relationship Block mit kid_characters

4. "Fallback Tests" (KRITISCH):
   - Neue Engine wirft Error → Fallback auf alte Engine, Story wird generiert
   - DB unreachable für neue Tabellen → Fallback
   - Blueprint Query gibt 0 Ergebnisse → graceful degradation zu light intensity
   - Jeder einzelne Selector kann fehlschlagen → die anderen arbeiten weiter

5. "Regression Tests":
   - Bestehende Engine produziert identische Ergebnisse wie vor V2
   - Alte Stories haben NULL in allen neuen Spalten
   - Dashboard, History, Series-Feature funktionieren unverändert

6. "Character Mode Tests":
   - 'surprise' → protagonist aus Seeds (Mensch oder Fabelwesen)
   - 'surprise' + Alter 6-7 → ~60% Fabelwesen
   - 'surprise' + Alter 10-11 → ~15-20% Fabelwesen  
   - 'self' → kein protagonist Seed, nur Sidekick
   - 'family' → Arc auf Beziehungsdynamik, Personen dürfen Fabelwesen sein
```

---

### Task 7.4 — Regression-Tests erweitern und durchführen

**Cursor-Prompt**:
```
Aufgabe: Führe die vollständige Regression-Test-Suite aus und dokumentiere Ergebnisse.

1. Führe ALLE Tests aus Task 1.3 (bestehende Engine Regression) durch
   - Jeder Test MUSS grün sein
   - Wenn ein Test fehlschlägt: STOPP, nicht weiter, Bug fixen

2. Führe die Integration Tests aus Task 7.3 durch
   - Dokumentiere Ergebnisse pro Test-Suite
   - Besonderes Augenmerk auf Fallback-Tests

3. Manueller Smoke-Test:
   - Generiere 5 Stories OHNE Feature-Flag → alle müssen wie bisher funktionieren
   - Generiere 5 Stories MIT Feature-Flag → alle müssen erfolgreich sein
   - Generiere 1 Story mit absichtlich korrupten Blueprint-Daten → Fallback muss greifen
   
4. Erstelle einen Regression-Report:
   - Tabelle: Test | Status | Notizen
   - Screenshot/Log von erfolgreichen und fehlgeschlagenen Tests
```

---

## Phase 8: Rollout & Monitoring

### Task 8.1 — Admin-Only Rollout (Tag 1)

**Cursor-Prompt**:
```
Aufgabe: Aktiviere die Emotion-Flow-Engine NUR für den Admin-User (Johann).

Schritte:
1. Setze app_settings emotion_flow_enabled_users auf '["DEINE-UUID"]'
2. Generiere 10 Stories mit verschiedenen Themes und Altersgruppen
3. Für jede Story dokumentiere:
   - Welcher Blueprint gewählt wurde
   - Welche Intensity und Tone
   - Welcher Character Seed (wenn surprise mode)
   - Ob der emotionale Arc in der Geschichte spürbar ist
   - Story-Qualität im Vergleich zur alten Engine (1-5 Sterne)
4. Prüfe: werden die neuen Spalten korrekt in der stories Tabelle befüllt?
5. Prüfe: funktioniert das Diagnose-Panel?
6. Prüfe: sind History-Einträge korrekt?

KEIN Rollout an andere User bis dieser Test abgeschlossen ist.
```

---

### Task 8.2 — Beta-Familien Rollout (Tag 2-5)

**Cursor-Prompt**:
```
Aufgabe: Rollout an 2-3 Beta-Familien.

1. Wähle 2-3 Beta-Familien aus (verschiedene Sprachen und Altersgruppen)
2. Aktiviere Feature-Flag für deren User-IDs
3. Monitoring über 3-5 Tage:
   - Diagnose-Panel: Engine-Verteilung, Blueprint-Nutzung, Fehler
   - Feedback der Familien: Story-Qualität, Variation, emotionale Tiefe
   - Error-Logs: Fallbacks auf alte Engine? Warum?
4. A/B-Vergleich:
   - Vergleiche Ratings von V1 vs V2 Stories
   - Vergleiche Wortvielfalt, Story-Länge, emotionale Tiefe
5. Entscheidung: weiter rollout oder zurück zum Tuning
```

---

### Task 8.3 — Schrittweiser vollständiger Rollout

**Cursor-Prompt**:
```
Aufgabe: Schrittweiser Rollout an alle User.

Phase A (Tag 6-7): 50% der User
- Feature-Flag mit 50% der User-IDs
- Monitoring wie bei Beta

Phase B (Tag 8-10): 100% der User  
- Feature-Flag auf ["*"]
- Intensive Monitoring erste 48h
- Fallback-Plan: sofort zurück auf [] wenn Probleme

Phase C (Tag 14+): Cleanup
- Wenn V2 stabil: 
  - Alte emotion_rules werden nicht mehr gelesen (aber noch in DB)
  - buildVarietyBlock() wird nicht mehr aufgerufen (aber Code bleibt)
  - Feature-Flag bleibt als Kill-Switch

Phase D (Tag 30+): Deprecated Code entfernen
- NUR wenn V2 seit 2+ Wochen stabil
- emotion_rules Tabelle deprecated (nicht löschen)
- buildVarietyBlock() entfernen
- Feature-Flag entfernen, V2 wird Default
- Alte Code-Pfade entfernen
```

---

## Zusammenfassung: Kritische Sicherheitsmaßnahmen

| Maßnahme | Wo | Wann |
|----------|-----|------|
| Feature-Flag Default OFF | app_settings | Phase 1, Tag 1 |
| Alle neuen Spalten NULLABLE | stories Tabelle | Phase 2 |
| try/catch mit Fallback | generate-story | Phase 6 |
| Regression-Tests grün | Tests | nach JEDER Phase |
| Kein DROP/DELETE bestehender Daten | Migrations | Alle Phasen |
| Bestehender Code-Pfad UNVERÄNDERT | generate-story | Phase 6 |
| History-Fehler brechen Story nicht | historyTracker | Phase 6 |
| Kill-Switch via Feature-Flag | Admin-UI | Rollout |
| Diagnose-Panel für A/B-Vergleich | Admin-UI | Phase 7+ |

---

## Abhängigkeits-Graph

```
Phase 1 (Infrastruktur)
  ├── Task 1.1 Feature Flag
  ├── Task 1.2 Ordnerstruktur  
  └── Task 1.3 Regression Tests
         │
Phase 2 (DB Schema) ← braucht 1.1, 1.2
  ├── Task 2.1 Core Tables
  ├── Task 2.2 History Tables ← braucht 2.1
  ├── Task 2.3 Stories Spalten
  └── Task 2.4 RLS ← braucht 2.1, 2.2
         │
Phase 3 (Seed Data) ← braucht 2.1
  ├── Task 3.1 Blueprints
  ├── Task 3.2 Characters (inkl. Fabelwesen)
  ├── Task 3.3 Elements
  └── Task 3.4 Übersetzungen ← braucht 3.1
         │
Phase 4 (Selection) ← braucht 1.2, 2.1, 2.2, 3.*
  ├── Task 4.1 Intensity
  ├── Task 4.2 Blueprint Selector
  ├── Task 4.3 Tone Selector
  ├── Task 4.4 Character Selector (inkl. Fabelwesen-Logik)
  └── Task 4.5 Element Selector
         │
Phase 5 (Prompt Builder) ← braucht 4.*
  ├── Task 5.1 Relationship Block (NEU)
  ├── Task 5.2 Arc/Tone/Element Blocks
  ├── Task 5.3 Orchestrator Builder
  └── Task 5.4 Image Enhancer
         │
Phase 6 (Integration) ← braucht 5.*, 1.1
  ├── Task 6.1 Engine Orchestrator
  ├── Task 6.2 generate-story Integration (EINZIGE bestehende Datei-Änderung)
  └── Task 6.3 History Tracker
         │
Phase 7 (Testing) ← braucht 6.*
  ├── Task 7.1 Admin Toggle UI
  ├── Task 7.2 Diagnose Panel
  ├── Task 7.3 Integration Tests
  └── Task 7.4 Regression Suite
         │
Phase 8 (Rollout) ← braucht 7.4 grün
  ├── Task 8.1 Admin Only
  ├── Task 8.2 Beta Familien
  └── Task 8.3 Alle User
```
