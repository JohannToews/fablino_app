# Petit Lecteur – Implementierungsplan Produktverbesserung (v3)

> Ziel: Story-Qualität, Mehrsprachigkeit und Skalierbarkeit verbessern.
> Methode: Block für Block in Cursor umsetzen, nach jedem Block testen.
> Wichtig: Dieses Dokument ins Projekt-Root kopieren, damit Cursor es als Referenz nutzen kann.
> Referenz-Dokument: STORY_ENGINE_BLOCK2.md enthält die detaillierten Konzepte für Lernthemen, Guardrails und Branching.
> **v3 Änderungen:** Block 2.3 komplett überarbeitet. Bestehende App-Architektur berücksichtigt (Wizard, Edge Function, app_settings Prompts existieren bereits). Fokus auf chirurgischen Umbau statt Neubau.

---

## Übersicht: Blöcke in optimaler Reihenfolge

| Block | Thema | Status | Geschätzter Aufwand |
|-------|-------|--------|-------------------|
| 1 | DB-Modell: Mehrsprachigkeit | ✅ FERTIG | 1-2 Tage |
| 2.1 | Stammdaten: Lernthemen + Guardrails (DB + UI) | ✅ FERTIG | 1-2 Tage |
| 2.2 | Regel-DB: age_rules, theme_rules, emotion_rules, image_style_rules, difficulty_rules | ✅ FERTIG | 1-2 Tage |
| **2.3a** | **Migration: Fehlende Spalten + kid_characters** | **offen** | **0.5 Tage** |
| **2.3b** | **CORE Slim Prompt: System-Prompt neu schreiben** | **offen** | **1 Tag** |
| **2.3c** | **Edge Function: generate-story Umbau** | **offen** | **1-2 Tage** |
| **2.3d** | **Wizard-Erweiterungen (optional, kann nach 2.4)** | **offen** | **1 Tag** |
| 2.4 | Story Engine: Parallele Bild-Generierung | offen | 1 Tag |
| 2.5 | Architektur: generate-story splitten + Cleanup | offen | 1-2 Tage |
| 3 | Branching & Serien-Modul (später) | geplant | 3-5 Tage |

---

## Block 1: Datenbank-Modell für Mehrsprachigkeit ✅ FERTIG

Sprachfelder auf kid_profiles, marked_words, comprehension_questions, stories.
Language Derivation Chain über school_system → kidAppLanguage, kidReadingLanguage, kidExplanationLanguage.
Translation-Konsolidierung (statusLabels, difficultyLabels, ternary-chains).

---

## Block 2.1: Stammdaten – Lernthemen + Content Guardrails ✅ FERTIG

learning_themes (15 Einträge), content_themes_by_level (~19 Einträge), parent_learning_config.
ParentSettingsPanel.tsx als "Erziehung"-Tab in AdminPage.
content_safety_level auf kid_profiles (1-4, Default nach Alter).

---

## Block 2.2: Regel-DB ✅ FERTIG

age_rules (12 Einträge: 4 Altersgruppen × 3 Sprachen), theme_rules (18: 6 Themes × 3), emotion_rules (18: 6 × 3), image_style_rules (6), difficulty_rules (9: 3 Levels × 3).
Alle SELECT-only, noch nicht von generate-story konsumiert.

---

## Block 2.3a: Migration – Fehlende Spalten + kid_characters

### Problem
Die stories-Tabelle hat bereits `structure_beginning`, `structure_middle`, `structure_ending` und `emotional_coloring`. Aber es fehlen Klassifikationen die für Varietät und Eltern-Dashboard gebraucht werden. Außerdem gibt es keine Möglichkeit, wiederkehrende Story-Figuren (Geschwister, Freunde) zu speichern.

### Ziel
Fehlende Spalten auf stories + neue kid_characters Tabelle. Reine DB-Arbeit, kein UI, kein Logik-Change.

### Kontext: Story-Klassifikationen

Das LLM soll pro Story nicht nur den Text, sondern auch Metadaten zurückgeben. Einige existieren schon:

| Klassifikation | Spalte auf stories | Status | Beschreibung |
|---|---|---|---|
| Struktur Anfang | `structure_beginning` (int 1-6) | ✅ existiert | A1-A6: In Medias Res, Rätsel-Hook, Charaktermoment, Weltenbau, Dialogue-Hook, Ordinary World |
| Struktur Mitte | `structure_middle` (int 1-6) | ✅ existiert | M1-M6: Eskalation, Rätsel-Schichten, Beziehungs-Entwicklung, Parallele Handlungen, Countdown, Wendepunkt-Kette |
| Struktur Ende | `structure_ending` (int 1-6) | ✅ existiert | E1-E6: Klassisch-Befriedigend, Twist-Ende, Offenes Ende, Bittersüß, Rückkehr mit Veränderung, Leser-Entscheidung/Cliffhanger |
| Emotionale Färbung (primär) | `emotional_coloring` (text) | ✅ existiert | EM-J (Joy), EM-T (Thrill), EM-H (Humor), EM-W (Warmth), EM-D (Depth), EM-C (Curiosity) |
| **Emotionale Färbung (sekundär)** | `emotional_secondary` (text) | ❌ NEU | Zweite emotionale Färbung (z.B. EM-J + EM-C) |
| **Humor-Level** | `humor_level` (int 1-5) | ❌ NEU | 1=kaum, 2=leicht, 3=charmant, 4=viel, 5=absurd |
| **Emotionale Tiefe** | `emotional_depth` (int 1-3) | ❌ NEU | 1=reines Entertainment, 2=leichte Botschaft, 3=echte moralische Tiefe |
| **Moral/Thema** | `moral_topic` (text, nullable) | ❌ NEU | z.B. "Freundschaft", "Ehrlichkeit", "Mut" – oder NULL bei Entertainment |
| **Konkretes Thema** | `concrete_theme` (text) | ❌ NEU | z.B. "Piraten", "Detektiv", "Drachenzähmen" – vom LLM gewählt |

Warum diese Klassifikationen?
1. **Varietät-Engine**: Die letzten N Stories werden abgefragt → LLM wird angewiesen, andere Strukturen/Emotionen/Humor-Levels zu wählen
2. **Eltern-Dashboard** (später): "Ihr Kind hat 5 lustige, 3 spannende und 2 nachdenkliche Geschichten gelesen"
3. **Empfehlungen** (später): "Dein Kind mag Abenteuer-Geschichten am meisten"

### Cursor-Prompt

```
Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

Aufgabe: Block 2.3a – Migration für fehlende Spalten und kid_characters Tabelle.

SCHRITT 1: Neue Spalten auf stories (ALTER TABLE)

ALTER TABLE stories ADD COLUMN IF NOT EXISTS emotional_secondary text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS humor_level integer;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS emotional_depth integer;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS moral_topic text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS concrete_theme text;

-- Constraints
ALTER TABLE stories ADD CONSTRAINT stories_humor_level_check CHECK (humor_level BETWEEN 1 AND 5);
ALTER TABLE stories ADD CONSTRAINT stories_emotional_depth_check CHECK (emotional_depth BETWEEN 1 AND 3);

Alle neuen Spalten sind nullable – sie werden erst ab Block 2.3c vom LLM befüllt.

SCHRITT 2: Neue Tabelle kid_characters

CREATE TABLE kid_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('sibling', 'friend', 'known_figure', 'custom')),
  age integer,
  relation text,          -- 'Bruder', 'Schwester', 'Freund', 'Lehrer', etc.
  description text,       -- 'Batman', 'Gargamel aus den Schlümpfen', etc.
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kid_characters_profile ON kid_characters(kid_profile_id);

-- updated_at Trigger (gleich wie bei den anderen Tabellen)
CREATE TRIGGER update_kid_characters_updated_at
  BEFORE UPDATE ON kid_characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SCHRITT 3: RLS-Policies für kid_characters

- SELECT: User kann nur Characters sehen deren kid_profile_id zu einem seiner kid_profiles gehört
- INSERT: User kann nur Characters für seine eigenen kid_profiles erstellen
- UPDATE: User kann nur Characters seiner eigenen kid_profiles ändern
- DELETE: User kann nur Characters seiner eigenen kid_profiles löschen

Orientiere dich an den bestehenden RLS-Policies für parent_learning_config.

SCHRITT 4: TypeScript Types aktualisieren

Aktualisiere src/integrations/supabase/types.ts mit:
- Neuen Spalten auf stories
- Neuer Tabelle kid_characters

Wichtig:
- KEINE Änderungen an UI oder Logik
- KEINE Änderungen an generate-story
- NUR Migration + Types
- Bestehende Daten dürfen nicht verändert werden
- Teste dass npm run dev ohne Fehler startet
```

### Checkliste

**Im Code prüfen:**
- [ ] Migration erstellt mit allen 5 neuen Spalten auf stories
- [ ] CHECK Constraints: humor_level 1-5, emotional_depth 1-3
- [ ] kid_characters Tabelle mit allen Spalten und Constraints
- [ ] RLS-Policies auf kid_characters (scoped per user)
- [ ] Index auf kid_profile_id
- [ ] updated_at Trigger
- [ ] types.ts aktualisiert

**Testen:**
- [ ] App startet ohne Fehler
- [ ] Bestehende Stories sind unverändert (neue Spalten sind NULL)
- [ ] Bestehende Funktionalität funktioniert noch

---

## Block 2.3b: CORE Slim Prompt

### Problem
Der aktuelle System-Prompt (CORE + Eltern-Modul + Kinder-Modul in app_settings) ist ~6000+ Tokens pro LLM-Call. Er enthält Regeln für ALLE Altersgruppen, ALLE Schwierigkeitsstufen und ALLE Sprachen gleichzeitig. ~60% davon sind für ein spezifisches Kind irrelevant.

### Ziel
Neuen "CORE Slim" System-Prompt schreiben (~1500 Tokens), der nur allgemeingültige Anweisungen enthält. Alles Kind-spezifische kommt als dynamischer Kontext aus der DB (age_rules, difficulty_rules, theme_rules etc.).

### Architektur: System-Message vs. User-Message

```
┌─────────────────────────────────────────┐
│ SYSTEM MESSAGE = "CORE Slim" (~1500 Tok)│
│ (konstant für alle Stories)             │
│                                         │
│ • Rolle: "Du bist ein Kinderbuchautor"  │
│ • Story-Strukturen A1-A6, M1-M6, E1-E6 │
│   (nur Codes + 1-Satz-Definition)       │
│ • Emotionale Farben EM-J bis EM-C       │
│   (nur Codes + 1-Satz-Definition)       │
│ • Spannungswerkzeuge (kompakte Liste)   │
│ • Anti-Klischee-Regeln                  │
│ • Qualitäts-Checkliste (kompakt)        │
│ • Output-JSON-Format (mit allen         │
│   Klassifikationen)                     │
│ • Globale Ausschlüsse (Gewalt, Sex etc.)│
└─────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────┐
│ USER MESSAGE = Dynamischer Kontext      │
│ (~500-800 Tokens, variabel pro Story)   │
│                                         │
│ Aus DB geladen:                         │
│ • age_rules: NUR 1 Zeile (dieses Alter  │
│   + diese Sprache) → Satzlänge, Zeiten, │
│   Wortanzahl, Dialoganteil, Perspektive │
│ • difficulty_rules: NUR 1 Zeile (dieses │
│   Niveau + diese Sprache) → Vokabular,  │
│   figurative Sprache, Humor-Typen       │
│ • theme_rules: NUR 1 Eintrag (gewählte  │
│   Kategorie) → Plot-Templates, Settings,│
│   Konflikte, Archetypen                 │
│ • Guardrails: NUR aktive Regeln für     │
│   dieses Safety-Level                   │
│ • Lernthema: falls aktiv (aus Rotation) │
│                                         │
│ Vom User / Wizard:                      │
│ • Kind: Name, Alter                     │
│ • Protagonisten + Beschreibungen        │
│ • Spezialeffekte                        │
│ • Freitext-Wunsch                       │
│ • Länge (Multiplikator auf Wortanzahl)  │
│ • Serie ja/nein + Kontext              │
│                                         │
│ Varietät-Steuerung:                      │
│ • Letzte 3 Struktur-Kombinationen       │
│   (A-M-E) → "Vermeide diese"           │
│ • Letzte 5 emotionale Färbungen         │
│   → "Variiere"                          │
│ • Letzter Humor-Level → "Wechsle ab"   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ LLM OUTPUT (JSON)                       │
│                                         │
│ {                                       │
│   "title": "...",                       │
│   "story": "...",                       │
│   "new_words": [...],                   │
│   "summary": "...",                     │
│   "questions": [...],                   │
│   "classifications": {                  │
│     "structure_beginning": 1-6,         │
│     "structure_middle": 1-6,            │
│     "structure_ending": 1-6,            │
│     "emotional_coloring": "EM-X",       │
│     "emotional_secondary": "EM-X",      │
│     "humor_level": 1-5,                 │
│     "emotional_depth": 1-3,             │
│     "moral_topic": "..." | null,        │
│     "concrete_theme": "..."             │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘
```

### Token-Vergleich

| | Aktuell | Neu | Ersparnis |
|---|---|---|---|
| System Message | ~4000-6000 Tok | ~1500 Tok | ~60-75% |
| User Message | ~200 Tok (nur Wizard-Parameter) | ~500-800 Tok (Parameter + DB-Regeln + Varietät) | +300-600 Tok |
| **Total pro Call** | **~4200-6200 Tok** | **~2000-2300 Tok** | **~55-65%** |

### Was raus aus dem System-Prompt, rein in DB

| Aktuell im CORE / Modulen | Wird geladen aus |
|---|---|
| Altersgruppen-Beschreibungen (alle 3-4) | `age_rules` (nur 1 Zeile) |
| Vokabular-Regeln (alle Stufen) | `difficulty_rules` (nur 1 Zeile) |
| Erlaubte Zeiten pro Alter | `age_rules.allowed_tenses` |
| Satzstruktur-Regeln | `age_rules.sentence_structures` |
| Narrative Guidelines | `age_rules.narrative_guidelines` |
| Textlängen-Tabelle | `age_rules` min/max × Längen-Multiplikator |
| Theme-Beschreibungen | `theme_rules` (nur 1 Eintrag) |
| Guardrails (Fließtext) | `content_themes_by_level` |
| Eltern-Modul (komplett) | Dynamischer Kontext |
| Kinder-Modul (komplett) | Dynamischer Kontext |

### Was im System-Prompt bleibt (aber gekürzt)

| Sektion | Warum konstant | Kürzung |
|---|---|---|
| Spannungswerkzeuge | Gilt für alle Stories | Tabelle ohne Beispiele |
| A/M/E Definitionen | LLM muss Codes kennen | Nur Code + 1-Satz-Definition |
| EM-X Definitionen | LLM muss Codes kennen | Nur Code + 1-Satz-Definition |
| Anti-Klischee | Immer relevant | Schon kompakt |
| Output-Format | Muss exakt sein | Bleibt, erweitert um neue Klassifikationen |
| Globale Ausschlüsse | Immer relevant | Bleibt |

### Eltern-Modul / Kinder-Modul → wird überflüssig

Der Unterschied "Eltern erstellt" vs. "Kind erstellt" wird ein Flag im dynamischen Kontext (`source: 'parent' | 'kid'`), kein eigenes Prompt-Modul.

### Vorgehen

Dieser Block ist KEIN Cursor-Job. Der CORE Slim Prompt wird **von Hand mit Johann** geschrieben und dann:
1. In `app_settings` als neuer Key gespeichert (z.B. `system_prompt_core_v2`)
2. Die alten Keys (`system_prompt_fr`, `system_prompt_parent_module_fr` etc.) bleiben als Fallback

### Offener Punkt

→ Johann muss den aktuellen CORE-Prompt aus `app_settings` bereitstellen, damit wir ihn gemeinsam kürzen können.

---

## Block 2.3c: Edge Function – generate-story Umbau

### Problem
`generate-story/index.ts` (1335 Zeilen) lädt monolithische Prompts aus `app_settings`. Die neuen Regel-Tabellen (age_rules, difficulty_rules, theme_rules), Lernthemen, Guardrails und Klassifikationen werden noch nicht genutzt.

### Ziel
generate-story nutzt den CORE Slim Prompt + dynamischen Kontext aus DB. Klassifikationen werden aus dem LLM-Output geparst und auf stories gespeichert. Varietät-Engine sorgt für Abwechslung.

### Was sich ändert in generate-story/index.ts

```
AKTUELL (Zeile ~823-864):
1. Lade system_prompt_{lang} aus app_settings           → wird ersetzt
2. Lade Eltern-/Kinder-Modul aus app_settings           → wird ersetzt  
3. Baue composite prompt aus den Modulen                 → wird ersetzt
4. Sende an LLM                                         → bleibt
5. Parse LLM-Response (title, content, questions, etc.)  → wird erweitert
6. Speichere Story in DB                                 → wird erweitert

NEU:
1. Lade system_prompt_core_v2 aus app_settings           → CORE Slim (konstant)
2. Lade aus DB:                                          → dynamischer Kontext
   - age_rules (1 Zeile)
   - difficulty_rules (1 Zeile)
   - theme_rules (1 Eintrag)
   - content_themes_by_level (für safety_level)
   - parent_learning_config + learning_themes (für Lernthema)
   - Letzte N Stories für Varietät
3. Baue dynamischen Kontext (User Message)               → NEU
4. Sende CORE Slim + dynamischen Kontext an LLM          → angepasst
5. Parse LLM-Response inkl. classifications              → erweitert
6. Speichere Story + Klassifikationen in DB              → erweitert
```

### Längen-Multiplikator

Der User wählt im Wizard "Kurz / Mittel / Lang". Das wird mit den Wortanzahlen aus age_rules verrechnet:

| Länge | Faktor | Beispiel Alter 8-9 (350-600) |
|---|---|---|
| Kurz | 0.7× | 245 – 420 Wörter |
| Mittel | 1.0× | 350 – 600 Wörter |
| Lang | 1.4× | 490 – 840 Wörter |

### Varietät-Engine

Die Edge Function lädt die letzten N Stories des Kindes und baut daraus Varietät-Anweisungen:

```
Letzte 3 Story-Strukturen:
- Story vor 3 Tagen: A1-M3-E1 (In Medias Res → Beziehungs-Entwicklung → Klassisch)
- Story vor 2 Tagen: A6-M1-E1 (Ordinary World → Eskalation → Klassisch)  
- Story gestern: A2-M5-E2 (Rätsel-Hook → Countdown → Twist-Ende)

→ Prompt-Anweisung: "Vermeide die Kombinationen A1-M3-E1, A6-M1-E1, A2-M5-E2. 
   Wähle andere Anfangs-, Mittel- und Endstrukturen für maximale Abwechslung."

Letzte 5 emotionale Färbungen: EM-J, EM-J, EM-T, EM-H, EM-J
→ Prompt-Anweisung: "Die letzten Stories waren oft fröhlich (EM-J). 
   Wähle eine andere primäre Färbung."

Letzter Humor-Level: 4, 3, 5
→ Prompt-Anweisung: "Die letzten Stories waren alle humorvoll. 
   Setze den Humor-Level diesmal auf 1-2."
```

### Lernthema-Rotation

```
1. Lade parent_learning_config für das Kind
2. Wenn keine active_themes → Lernthema = null
3. Zähle letzte Stories mit learning_theme_applied
4. Prüfe ob gemäß Frequenz jetzt ein Lernthema dran ist:
   - frequency 1 (gelegentlich): jede 4. Story
   - frequency 2 (regelmäßig): jede 2.-3. Story
   - frequency 3 (häufig): jede 2. Story
5. Wenn ja: Round-Robin durch active_themes
6. Return: theme_key oder null
```

### Kategorie-Modell (wichtig!)

Die 6 Kacheln im Wizard = die 6 Einträge in `theme_rules`. Das LLM wählt selbst ein konkretes Thema innerhalb der Kategorie. Der User kann über den Freitext steuern.

```
Beispiel Prompt-Abschnitt:
"KATEGORIE: Abenteuer & Action
 Plot-Vorschläge: [aus theme_rules.plot_templates]
 Typische Konflikte: [aus theme_rules.typical_conflicts]
 Wähle selbst ein konkretes Thema (Piraten, Schatzsuche, Detektiv, etc.)."

Wenn user_prompt = "Es soll eine Piratengeschichte sein":
"BESONDERER WUNSCH: Es soll eine Piratengeschichte sein.
 Integriere diesen Wunsch, solange er mit den Guardrails vereinbar ist."
```

Das LLM gibt das gewählte Thema als `concrete_theme` in den Klassifikationen zurück → wird auf stories gespeichert.

### Fallback-Logik

```
Wenn age_rules leer für Alter/Sprache → Fallback auf alte app_settings Prompts
Wenn difficulty_rules leer → Fallback auf alte Prompts  
Wenn theme_rules leer → Fallback auf alte Prompts
Log welcher Pfad genommen wird (neue Regeln vs. Fallback)
Alte app_settings Keys NICHT löschen
```

### Cursor-Prompt

```
Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

Aufgabe: Block 2.3c – generate-story/index.ts umbauen für dynamische Prompts + Klassifikationen + Varietät.

KONTEXT: Die Edge Function generate-story/index.ts existiert bereits (1335 Zeilen).
Der System-Prompt wird aktuell aus app_settings geladen (Keys: system_prompt_fr, system_prompt_parent_module_fr, etc.).
Wir ersetzen den Prompt-Aufbau, aber behalten die restliche Logik (Bild-Generierung, Consistency Check, etc.).

SCHRITT 1: Erstelle supabase/functions/_shared/promptBuilder.ts

Input-Type:
interface StoryRequest {
  kid_profile: {
    id: string;
    first_name: string;
    age: number;
    difficulty_level: number;    // 1-3
    content_safety_level: number; // 1-4
  };
  story_language: string;        // 'fr', 'de', 'en', 'es', 'it', 'bs'
  theme_key: string;             // aus theme_rules: 'fantasy', 'action', 'animals', 'everyday', 'humor', 'educational'
  length: 'short' | 'medium' | 'long';
  is_series: boolean;
  series_context?: string;
  protagonists: {
    include_self: boolean;
    characters: Array<{
      name: string;
      age?: number;
      relation?: string;
      description?: string;
    }>;
  };
  special_abilities: string[];   // 'superpowers', 'magic', 'heroes_villains', 'transformations', 'special_talents'
  user_prompt?: string;
  source: 'parent' | 'kid';
}

Die Funktion buildStoryPrompt(request: StoryRequest): Promise<string> tut:

1. Lade age_rules: WHERE language = story_language AND min_age <= age AND max_age >= age
   → Fehler werfen wenn nicht gefunden
2. Lade difficulty_rules: WHERE language = story_language AND difficulty_level = kid.difficulty_level
   → Fehler werfen wenn nicht gefunden
3. Lade theme_rules: WHERE theme_key = theme_key AND language = story_language
   → Fehler werfen wenn nicht gefunden
4. Lade content_themes_by_level: WHERE min_safety_level <= content_safety_level
   → Erlaubte und nicht-erlaubte Themen
5. Lade parent_learning_config + prüfe Lernthema-Rotation (siehe learningThemeRotation)
6. Lade letzte 5 Stories des Kindes (nur Klassifikations-Spalten) für Varietät

7. Berechne Wortanzahl:
   short: Math.round(min_word_count * 0.7), Math.round(max_word_count * 0.7)
   medium: min_word_count, max_word_count
   long: Math.round(min_word_count * 1.4), Math.round(max_word_count * 1.4)

8. Baue den User-Message-Prompt zusammen:
   - KIND: Name, Alter, Sprachniveau (aus difficulty_rules.label)
   - FIGUREN: Protagonist-Liste (include_self → Kind als Hauptfigur)
   - SPEZIALEFFEKTE: Beschreibende Sätze für jede gewählte ability
   - KATEGORIE: Label + plot_templates + typical_conflicts aus theme_rules
     + "Wähle selbst ein konkretes Thema innerhalb dieser Kategorie."
   - TEXTLÄNGE: berechnetes min-max, paragraph_length, dialogue_ratio, narrative_perspective
   - GRAMMATIK: allowed_tenses, sentence_structures, max_sentence_length
   - VOKABULAR: aus difficulty_rules (vocabulary_scope, new_words_per_story, figurative_language, humor_types, idiom_usage, repetition_strategy)
   - ERZÄHLSTIL: narrative_guidelines aus age_rules
   - GUARDRAILS: erlaubte/verbotene emotionale Themen basierend auf safety_level
   - LERNTHEMA: wenn aktiv (aus Rotation): subtil einweben + parent_conversation_prompts generieren
   - VARIETÄT: letzte Strukturen/Emotionen/Humor → "Wähle andere"
   - BESONDERER WUNSCH: user_prompt (wenn vorhanden)
   - SERIEN-KONTEXT: series_context (wenn Fortsetzung)
   
   WICHTIG: Prompt-Sprache = story_language (nicht Deutsch!). Erstelle dafür ein Übersetzungs-Objekt für Prompt-Sektionsüberschriften in allen 6 Sprachen.

Exportiere: buildStoryPrompt, StoryRequest, und alle Sub-Types.

SCHRITT 2: Erstelle supabase/functions/_shared/learningThemeRotation.ts

Funktion: shouldApplyLearningTheme(kidProfileId: string): Promise<string | null>
1. Lade parent_learning_config
2. Wenn keine active_themes → return null
3. Zähle letzte Stories mit learning_theme_applied
4. Basierend auf frequency:
   - 1 (gelegentlich): jede 4. Story
   - 2 (regelmäßig): jede 2.-3. Story  
   - 3 (häufig): jede 2. Story
5. Wenn dran: Round-Robin durch active_themes
6. Return theme_key oder null

SCHRITT 3: generate-story/index.ts anpassen

Am Prompt-Aufbau (ca. Zeile 823-864):
- Importiere promptBuilder und learningThemeRotation
- Statt app_settings Prompts zu laden → rufe buildStoryPrompt() auf
- Lade system_prompt_core_v2 aus app_settings als System Message
- Nutze den von promptBuilder generierten Text als User Message
- FALLBACK: Wenn system_prompt_core_v2 nicht existiert ODER wenn buildStoryPrompt fehlschlägt → nutze die alten app_settings Prompts wie bisher. Logge welcher Pfad.

Am LLM-Response-Parsing:
- Parse classifications aus dem JSON-Response
- Erwarte: structure_beginning, structure_middle, structure_ending, emotional_coloring, emotional_secondary, humor_level, emotional_depth, moral_topic, concrete_theme
- Wenn classifications fehlen (LLM hat sie nicht geliefert): NULL lassen, keinen Fehler werfen

Am DB-Speichern:
- Speichere alle geparsten Klassifikationen auf der Story
- Wenn Lernthema aktiv war: speichere learning_theme_applied + parent_prompt_text

NICHT ÄNDERN:
- Bild-Generierung
- Consistency Check  
- Word Count Validation
- Retry-Logik
- Bestehende Fehlerbehandlung
- Bild-Cache

Teste mit einer Story: Alter 8, Französisch, Kategorie "Abenteuer", Länge "Mittel", Safety Level 2.
```

### Checkliste

**Im Code prüfen:**
- [ ] `promptBuilder.ts` existiert in `supabase/functions/_shared/`
- [ ] `learningThemeRotation.ts` existiert in `supabase/functions/_shared/`
- [ ] `generate-story/index.ts` importiert und nutzt beide
- [ ] Prompt wird aus DB-Regeln gebaut (nicht hardcoded)
- [ ] Fallback auf alte Prompts wenn neue Regeln fehlen
- [ ] Wortanzahl-Multiplikator korrekt (short=0.7, medium=1.0, long=1.4)
- [ ] Varietät: letzte N Stories werden abgefragt
- [ ] Klassifikationen werden aus LLM-Response geparst
- [ ] Klassifikationen werden auf stories gespeichert
- [ ] Lernthema-Rotation: Round-Robin + Frequenz-Logik
- [ ] Prompt-Sprache = story_language (nicht Deutsch)
- [ ] Alte app_settings Prompts sind NICHT gelöscht

**In der App testen:**
- [ ] App startet ohne Fehler
- [ ] Story erstellen OHNE Lernthemen → funktioniert
- [ ] Story erstellen MIT Lernthemen → Lernthema subtil eingewoben
- [ ] Story mit Safety Level 1 → keine emotionalen Konflikte
- [ ] Story mit Safety Level 3 → darf Themen wie Streit enthalten
- [ ] Neue Spalten auf Story befüllt (humor_level, emotional_depth, etc.)
- [ ] 3-4 Stories hintereinander → Strukturen variieren
- [ ] Fallback testen: system_prompt_core_v2 Key löschen → alte Prompts greifen

**Qualitätstests:**
- [ ] Story-Qualität mindestens so gut wie vorher
- [ ] Lernthema SUBTIL eingewoben (kein erhobener Zeigefinger)
- [ ] Wortanzahl passt zum gewählten Längen-Level
- [ ] concrete_theme ist sinnvoll (z.B. "Piraten" bei Abenteuer-Kategorie)

**Red Flags:**
- ❌ promptBuilder macht keinen DB-Query (Regeln hardcoded)
- ❌ generate-story lädt immer noch primär aus app_settings (kein Fallback-Log)
- ❌ Lernthema in JEDER Geschichte (Frequenz ignoriert)
- ❌ Klassifikationen werden nicht gespeichert
- ❌ Varietät-Logik fehlt (keine Abfrage letzter Stories)
- ❌ Prompt ist auf Deutsch obwohl story_language = 'fr'
- ❌ Stories werden deutlich kürzer/schlechter

---

## Block 2.3d: Wizard-Erweiterungen (optional, kann nach 2.4)

### Problem
Der bestehende Wizard (3 Screens) kennt die neuen Features noch nicht: keine Längen-Auswahl, kein Sprach-Picker, keine gespeicherten Figuren, kein Serien-Toggle.

### Ziel
Wizard erweitern um die neuen Parameter zu sammeln und an die Edge Function zu übergeben.

### Neue Elemente im Wizard

**Screen 1 (Thema) – Erweiterungen:**
- Länge-Toggle: Kurz / Mittel / Lang (Default: Mittel)
- Serien-Toggle: Einzelgeschichte / Serie (Default: Einzelgeschichte)
- Sprach-Picker: Verfügbare Sprachen aus kid_profile (reading_language + home_languages). Default = reading_language. Zeige als kleine Flaggen oder Dropdown.

**Screen 2 (Personen) – Erweiterungen:**
- "Ich"-Kachel: Nutzt Name/Alter aus kid_profile. Wenn gewählt → include_self = true
- Gespeicherte Figuren: Lade kid_characters, zeige unter der passenden Kachel (Geschwister, Freunde, Bekannte)
- "Figur speichern"-Button: Neuer Character kann direkt in kid_characters gespeichert werden
- "Ich" = Kind als Hauptfigur der Geschichte

**Screen 3 (Spezialeffekte) – unverändert, nur:**
- Freitext-Feld klar als optional markieren
- Placeholder-Beispiele in kid_profile.reading_language

**Screen 4 (NEU: Zusammenfassung) – optional:**
- Zeige alle gewählten Parameter übersichtlich
- "Geschichte erstellen"-Button

### Cursor-Prompt

```
Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

Aufgabe: Block 2.3d – Story-Wizard erweitern.

Finde den bestehenden Story-Wizard (CreateStoryPage.tsx oder ähnlich).
Analysiere welche Parameter er aktuell sammelt und an generate-story übergibt.

Erweitere den Wizard:

1. Screen 1: Füge hinzu:
   - Länge-Toggle: "Kurz / Mittel / Lang" (3 Buttons, Default: Mittel)
   - Serien-Toggle: "Einzelgeschichte / Serie" (2 Buttons, Default: Einzelgeschichte)
   - Sprach-Picker: Lade reading_language und home_languages aus kid_profile.
     Zeige verfügbare Sprachen als Buttons. Default = reading_language.

2. Screen 2: Füge hinzu:
   - Lade kid_characters für das aktive Kindprofil
   - Zeige gespeicherte Figuren unter der passenden Kachel (Geschwister → role='sibling', etc.)
   - "Figur speichern" Button: öffnet Mini-Form (Name, Rolle, Alter, Beschreibung), speichert in kid_characters
   - "Ich"-Kachel: Wenn gewählt, setze include_self=true und nutze kid_profile.name und kid_profile.age

3. Übergabe an generate-story:
   - Stelle sicher dass ALLE neuen Parameter an die Edge Function übergeben werden:
     story_language, length, is_series, protagonists (mit include_self + characters), special_abilities, user_prompt
   - Die Edge Function empfängt diese als Teil des Request-Body

Styling: Konsistent mit bestehendem Wizard-Design (shadcn/ui, kindgerecht).
Labels: In der UI-Sprache des Kindes (aus translations.ts, ggf. neue Keys hinzufügen).

Teste dass der Wizard navigierbar ist und alle Parameter korrekt an die Edge Function übergeben werden.
```

### Checkliste

- [ ] Länge-Toggle sichtbar und funktional
- [ ] Sprach-Picker zeigt verfügbare Sprachen
- [ ] Gespeicherte Figuren werden geladen
- [ ] Neue Figur kann gespeichert werden
- [ ] "Ich"-Kachel setzt include_self + Name/Alter
- [ ] Alle Parameter werden an generate-story übergeben
- [ ] Bestehende Wizard-Funktionalität unverändert

---

## Block 2.4: Parallele Bild-Generierung

### Problem
Bilder werden sequenziell generiert. Bei 3 Bildern wartet der User dreimal so lang wie nötig.

### Ziel
Cover + alle Story-Bilder parallel generieren. User wartet nur so lang wie das langsamste Bild.

### Cursor-Prompt

```
Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

Aufgabe: Refactore die Bild-Generierung in generate-story für parallele Ausführung.

Aktueller Flow (sequenziell):
1. Story-Text generieren
2. Cover-Bild generieren (warten)
3. Story-Bild 1 generieren (warten)
4. Story-Bild 2 generieren (warten)
5. Alles zusammen zurückgeben

Neuer Flow (parallel):
1. Story-Text generieren
2. Aus dem Text Bild-Prompts extrahieren (für Cover + Story-Bilder)
3. ALLE Bilder gleichzeitig starten mit Promise.allSettled()
4. Warten bis alle fertig (oder Timeout nach 30 Sekunden)
5. Für fehlgeschlagene Bilder: Fallback-Bild oder nochmal versuchen
6. Alles zusammen zurückgeben

Die Bild-Prompts sollen die image_style_rules aus der DB nutzen (aus Block 2.2).

Wichtig:
- Promise.allSettled() statt Promise.all() (ein Fehler bricht nicht alles ab)
- Timeout 30 Sekunden pro Bild
- Fallback bei Fehler: Placeholder-Bild + Error-Log
- image_cache Mechanismus beibehalten
- Fallback-Kette (Gemini → Lovable Gateway) beibehalten
- Max 4 parallele Calls gleichzeitig (Rate Limit Schutz)

Keine anderen Flows ändern.
```

### Checkliste

**Im Code prüfen:**
- [ ] Promise.allSettled() wird verwendet
- [ ] Alle Bild-Requests starten gleichzeitig
- [ ] Timeout pro Bild gesetzt (30s)
- [ ] Einzelnes fehlgeschlagenes Bild crasht nicht die Story
- [ ] image_style_rules werden aus DB geladen für Bild-Prompts
- [ ] Max 4 parallele Calls (kein unbegrenztes Promise.all)

**In der App testen:**
- [ ] Erstelle eine Geschichte und miss die Zeit (Stoppuhr)
- [ ] Ist es schneller als vorher? (30-60% erwartet)
- [ ] Alle Bilder werden angezeigt (Cover + Story-Bilder)
- [ ] Bilder passen zum Story-Inhalt
- [ ] image_cache funktioniert noch (gleiche Story nochmal → schneller)

**Red Flags:**
- ❌ Code wartet sequenziell (await im Loop statt Promise.allSettled)
- ❌ Bild-Fehler → keine Geschichte
- ❌ Bilder vertauscht (Cover an falscher Stelle)
- ❌ Mehr als 5 parallele API-Calls

---

## Block 2.5: generate-story splitten + Cleanup

### Problem
generate-story ist eine Riesendatei (1335 Zeilen). Cursor verliert bei großen Dateien den Überblick.

### Ziel
Logische Module, gleiche Funktionalität, bessere Wartbarkeit.

### Cursor-Prompt

```
Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

Aufgabe: Refactore generate-story in kleinere Module.

Zielstruktur:
supabase/functions/generate-story/
  ├── index.ts              → Orchestrierung (max 100-150 Zeilen)
  ├── textGenerator.ts      → Story-Text generieren (Gemini Call + Retry)
  ├── imageGenerator.ts     → Parallele Bilder (mit Fallback-Kette)
  ├── consistencyChecker.ts → Consistency Check
  └── types.ts              → Shared Types

supabase/functions/_shared/
  ├── promptBuilder.ts      → (bereits vorhanden aus Block 2.3c)
  └── learningThemeRotation.ts → (bereits vorhanden aus Block 2.3c)

Regeln:
- Jedes Modul: eine klare Verantwortung, eine Hauptfunktion
- KEINE Funktionalität ändern – nur umstrukturieren
- Output muss identisch sein
- Entferne Debug-console.logs (behalte Error-Logs)
- Ersetze offensichtliche "any" Types
```

### Checkliste

**Im Code prüfen:**
- [ ] index.ts < 150 Zeilen
- [ ] textGenerator.ts, imageGenerator.ts, consistencyChecker.ts existieren
- [ ] Klare Imports/Exports, keine zirkulären Abhängigkeiten
- [ ] Console.log Spam reduziert
- [ ] Keine neuen "any" Types

**In der App testen:**
- [ ] Story erstellen → funktioniert wie vorher
- [ ] Bilder da → wie vorher
- [ ] Lernthema-Funktion → wie vorher
- [ ] Guardrails → wie vorher
- [ ] Verschiedene Story-Typen → alle funktionieren

**Red Flags:**
- ❌ index.ts > 500 Zeilen (nicht aufgeteilt)
- ❌ Zirkuläre Imports
- ❌ Neue Fehler bei Story-Generierung
- ❌ Lernthemen/Guardrails gehen verloren beim Refactoring

---

## Generelle Tipps für die Arbeit mit Cursor

### Vor jedem Block
1. Committe den aktuellen Stand: `git add -A && git commit -m "vor Block X.Y"`
2. So kannst du jederzeit zurück

### Während Cursor arbeitet
- Lass Cursor den kompletten Prompt ausführen
- Wenn Cursor Rückfragen stellt: beantworte sie
- Wenn Cursor fertig ist: teste ZUERST ob die App startet (`npm run dev`)

### Nach jedem Block
1. Geh die Checkliste durch
2. Alles grün → `git add -A && git commit -m "Block X.Y fertig"`
3. Red Flags → berichte Johann was passiert ist
4. Unsicher → kopier den relevanten Code hierher

### Nach jedem Block: ARCHITECTURE.md aktualisieren
Sag Cursor: "Aktualisiere ARCHITECTURE.md basierend auf den Änderungen aus Block X.Y."

### Wenn etwas kaputtgeht
```
git stash        → Änderungen zur Seite
git log          → letzte Commits anschauen
git checkout .   → zurück zum letzten Commit
```

---

## Nach Block 2.5: Was haben wir erreicht?

- ✅ App ist ready für 10 Sprachen (Block 1)
- ✅ Eltern können erzieherische Schwerpunkte setzen (Block 2.1)
- ✅ Content Guardrails schützen Kinder altersgerecht (Block 2.1)
- ✅ Strukturierte Regel-Tabellen statt monolithische Prompts (Block 2.2)
- ✅ Story-Klassifikationen für Varietät und Analyse (Block 2.3a)
- ✅ Gespeicherte Figuren pro Kind (Block 2.3a)
- ✅ ~60% weniger Tokens pro Story durch CORE Slim + dynamischen Kontext (Block 2.3b)
- ✅ Regelbasierte, dynamische Prompts aus DB (Block 2.3c)
- ✅ Varietät-Engine: automatische Abwechslung bei Struktur, Emotion, Humor (Block 2.3c)
- ✅ Lernthemen-Rotation mit Frequenzsteuerung (Block 2.3c)
- ✅ Erweiterter Wizard mit Länge, Sprache, gespeicherten Figuren (Block 2.3d)
- ✅ ~50% schnellere Story-Generierung durch parallele Bilder (Block 2.4)
- ✅ Wartbarer, modularer Code (Block 2.5)

## Nächste Schritte

**Block 3: Branching & Serien** (aus STORY_ENGINE_BLOCK2.md Thema 3)
- Blueprint-Generierung
- Episode-on-demand mit Branch-Logik
- Neues DB-Schema: story_series, story_episodes, branch_history

**Danach:**
- RLS-Policies fixen (vor Tester-Welle 2)
- Gemini Paid Tier einrichten + Lovable Gateway entfernen
- Security Hardening (vor Public Launch)
- Stripe Integration
- Audio-Modus ausbauen (Anti-Screen-Time Argument)
- Eltern-Dashboard mit Lernfortschritt (nutzt die neuen Klassifikationen!)
- Erweiterbarkeit: Neue Kategorien + Beispielthemen per INSERT, kein Code-Change
- theme_rules auf 6 Sprachen erweitern (aktuell nur 3: fr, de, en)
