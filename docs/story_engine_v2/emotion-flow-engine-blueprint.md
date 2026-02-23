# Emotion-Flow-Engine — Phase 1 Blueprint

> **Zweck**: DB-Schema + Datenmodell für die Emotion-Flow-Engine.  
> **Input**: Audit v2, Architecture.md, Data Model.md  
> **Output**: Migrations-ready Schema, Prompt-Architektur, Integration in bestehende Pipeline  
> **Erstellt**: 2026-02-21

---

## Inhaltsverzeichnis

1. [Design-Prinzipien](#1-design-prinzipien)
2. [Neue Tabellen](#2-neue-tabellen)
3. [Stories-Tabelle: Neue Spalten](#3-stories-tabelle-neue-spalten)
4. [History/Tracking-Tabellen](#4-historytracking-tabellen)
5. [Prompt-Architektur](#5-prompt-architektur)
6. [Selection-Logik](#6-selection-logik)
7. [Engine Toggle (Parallelbetrieb)](#7-engine-toggle-parallelbetrieb)
8. [Was unverändert bleibt](#8-was-unverändert-bleibt)
9. [Was deprecated wird](#9-was-deprecated-wird)
10. [Migrations-Plan](#10-migrations-plan)
11. [Entscheidungen](#11-entscheidungen-resolved-2026-02-21)

---

## 1. Design-Prinzipien

### Bestehende Patterns beibehalten
- **JSONB `labels`/`descriptions`** für Mehrsprachigkeit (7 Sprachen: de, fr, en, es, nl, it, bs)
- **`_key TEXT UNIQUE`** als stabiler Identifier (wie `subtype_key`, `theme_key`, `style_key`)
- **`age_groups TEXT[]`** für Altersfilterung (wie `story_subtypes`)
- **`weight INTEGER` + `is_active BOOLEAN`** für Steuerung
- **Round-Robin via History-Tabelle** (wie `story_subtype_history`)
- **UUID PK + TIMESTAMPTZ** auf allen Tabellen

### Neue Prinzipien
- **Prompts immer Englisch** — arc_description, tone_guidance etc. sind EN, weil LLM-Prompts auf Englisch besser funktionieren
- **Sprachunabhängige Blueprints** — ein Blueprint funktioniert für alle Sprachen (keine Sprach-Dimension wie bei `emotion_rules`)
- **Kombinatorik statt Monolithen** — Blueprint × Tone × Intensity × Character Seed = exponentiell mehr Variation
- **100% Backend** — kein UI-Change, Wizard bleibt: Theme → Characters → Effects → Style

---

## 2. Neue Tabellen

### 2.1 `emotion_blueprints`

Der Kern der Engine. Kuratierte emotionale Bögen als Skelett jeder Geschichte.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `blueprint_key` | TEXT | UNIQUE NOT NULL | z.B. `overconfidence_and_fall`, `fear_to_courage` |
| `labels` | JSONB | NOT NULL | Mehrsprachige Namen: `{"de": "Übermut und Fall", "fr": "...", ...}` |
| `descriptions` | JSONB | NOT NULL | Kurzbeschreibung für Admin/Eltern (7 Sprachen) |
| `category` | TEXT | NOT NULL, CHECK | `growth` · `social` · `courage` · `empathy` · `humor` · `wonder` |
| `arc_by_age` | JSONB | NOT NULL | Altersabhängige Arc-Stufen (siehe Struktur unten) |
| `arc_description_en` | TEXT | NOT NULL | Voller englischer Prompt-Text — das Herzstück |
| `tone_guidance` | TEXT | | Ton-Hinweise: "Mix humor into failure. Shame should be brief." |
| `tension_curve` | TEXT | | z.B. "low → high → crash → low → medium → warm" |
| `surprise_moment` | TEXT | | Geplanter Twist: "The help comes from the person dismissed earlier" |
| `ending_feeling` | TEXT | | Ziel-Emotion am Ende: "Quiet satisfaction, not triumph" |
| `compatible_themes` | TEXT[] | | Theme-Keys: `{'adventure_action', 'magic_fantasy', 'real_life'}` |
| `ideal_age_groups` | TEXT[] | NOT NULL | `{'6-7', '8-9', '10-11', '12+'}` |
| `min_intensity` | TEXT | NOT NULL, CHECK | Mindest-Intensitätsstufe: `light` · `medium` · `deep` |
| `compatible_learning_themes` | TEXT[] | | Learning-Theme-Keys die gut zum Blueprint passen |
| `weight` | INTEGER | DEFAULT 10 | Gewichtung für Selection |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Auto-updated via Trigger |

**CHECK Constraint für `category`:**
```sql
CHECK (category IN ('growth', 'social', 'courage', 'empathy', 'humor', 'wonder'))
```

**CHECK Constraint für `min_intensity`:**
```sql
CHECK (min_intensity IN ('light', 'medium', 'deep'))
```

**`arc_by_age` JSONB-Struktur:**

```jsonc
{
  "6-7": {
    "steps": 3,
    "arc": ["fear", "courage", "joy"],
    "arc_prompt": "The protagonist is scared of something specific and concrete. They find one small brave moment — maybe by accident. It works! Simple, warm joy at the end. Keep the fear BRIEF and the resolution FAST."
  },
  "8-9": {
    "steps": 4,
    "arc": ["fear", "avoidance", "small_bravery", "breakthrough"],
    "arc_prompt": "The protagonist avoids what scares them — maybe makes excuses, takes detours. Then a situation FORCES a small act of courage. It's shaky but it works. Growing confidence leads to a real breakthrough. Pride is earned, not given."
  },
  "10-11": {
    "steps": 5,
    "arc": ["fear", "avoidance", "failure", "shame", "real_courage"],
    "arc_prompt": "The protagonist avoids their fear AND gets caught — maybe someone sees them being afraid, or their avoidance causes a problem. The shame of being 'found out' is worse than the original fear. This forces genuine courage — not fearlessness, but acting DESPITE fear. The ending is quiet self-respect."
  }
}
```

> **Warum `arc_by_age` + `arc_description_en`?**  
> `arc_description_en` ist die ausführliche, narrative Beschreibung des Blueprints (für den Prompt-Builder als Fallback/Referenz und für Admin-Verständnis).  
> `arc_by_age[age_group].arc_prompt` ist der altersgerechte, kompakte Prompt-Text der tatsächlich ans LLM geht.

**Ziel: 21 Blueprints initial** (aus Audit Abschnitt 14):

| # | Key | Kategorie | Kurzbeschreibung |
|---|-----|-----------|-----------------|
| 1 | `overconfidence_and_fall` | growth | Übermut → Fall → Demut → Hilfe → stiller Stolz |
| 2 | `fear_to_courage` | courage | Angst → Vermeidung → Mutprobe → Durchbruch |
| 3 | `failure_is_learning` | growth | Enthusiasmus → Scheitern → Frustration → neuer Ansatz → Erfolg |
| 4 | `finding_your_voice` | growth | Schüchternheit → überhört → innere Stärke → Gehör verschaffen |
| 5 | `standing_up_for_others` | social | Ungerechtigkeit → Angst → Mut → Einstehen → Stolz |
| 6 | `the_outsider` | social | Anders sein → Anpassung → Scheitern → Akzeptanz → geschätzt werden |
| 7 | `misunderstanding_resolved` | social | Freundschaft → Missverständnis → Groll → Perspektivwechsel → Versöhnung |
| 8 | `unexpected_friendship` | social | Vorurteile → erzwungene Nähe → Gemeinsamkeiten → echte Verbindung |
| 9 | `letting_go` | social | Festklammern → Verlustangst → loslassen → Trauer → Neues entdecken |
| 10 | `first_time` | courage | Aufregung + Angst → Unsicherheit → kleiner Erfolg → Rückschlag → Freude |
| 11 | `protecting_something_small` | courage | Entdeckung → Fürsorge → Bedrohung → Risiko → Beschützen → Wärme |
| 12 | `doing_the_right_thing` | courage | Verlockung → innerer Konflikt → Entscheidung → Konsequenzen → gutes Gewissen |
| 13 | `walking_in_their_shoes` | empathy | Urteilen → Perspektivwechsel → Verstehen → Mitgefühl → Handeln |
| 14 | `the_invisible_helper` | empathy | Jemand hilft unbemerkt → Entdeckung → Dankbarkeit → Kettenreaktion |
| 15 | `forgiving` | empathy | Verletzt werden → Wut → Verstehen warum → Vergeben → Frieden |
| 16 | `chaos_cascade` | humor | Kleiner Fehler → größerer → totales Chaos → alles zusammen → befreiendes Lachen |
| 17 | `the_plan_that_backfires` | humor | Genialer Plan → Nebenwirkungen → improvisieren → anders als gedacht |
| 18 | `role_reversal_comedy` | humor | Rollen tauschen → komische Situationen → Verständnis → zurücktauschen |
| 19 | `discovering_a_hidden_world` | wonder | Alltag → Hinweis → Entdeckung → Staunen → Geheimnis hüten |
| 20 | `the_impossible_made_possible` | wonder | Unmöglich → Neugier → Experimentieren → es funktioniert! → "Was noch?" |
| 21 | `nature_speaks` | wonder | Langeweile → Natur → etwas Erstaunliches → Perspektive verändert |

---

### 2.2 `character_seeds`

Kuratierter Diversity-Pool für Protagonisten-Aussehen und Nebenfiguren-Archetypen.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `seed_key` | TEXT | UNIQUE NOT NULL | z.B. `dark_skin_curly_hair_girl`, `east_asian_boy` |
| `seed_type` | TEXT | NOT NULL, CHECK | `protagonist_appearance` · `sidekick_archetype` · `antagonist_archetype` |
| `labels` | JSONB | NOT NULL | Mehrsprachige Namen (Admin/Debug) |
| `appearance_en` | TEXT | | Englische Bild-Beschreibung: "Dark brown skin, black curly hair, bright brown eyes, tall for her age" |
| `personality_trait_en` | TEXT | | "Brave but impatient" |
| `weakness_en` | TEXT | | "Tends to rush ahead without thinking" |
| `strength_en` | TEXT | | "Never gives up, loyal to friends" |
| `cultural_background` | TEXT | | Region/Hintergrund: `west_african`, `east_asian`, `south_american`, `nordic`, `middle_eastern`, `south_asian`, `mixed` etc. |
| `gender` | TEXT | CHECK | `female` · `male` · `neutral` |
| `age_range` | TEXT[] | | `{'6-7', '8-9', '10-11'}` |
| `name_pool` | JSONB | | Passende Namen: `{"female": ["Amara", "Nia", "Zara"], "male": ["Kofi", "Jelani", "Kwame"]}` |
| `compatible_themes` | TEXT[] | | Themes wo dieser Seed besonders gut passt (NULL = alle) |
| `weight` | INTEGER | DEFAULT 10 | |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**CHECK Constraints:**
```sql
CHECK (seed_type IN ('protagonist_appearance', 'sidekick_archetype', 'antagonist_archetype'))
CHECK (gender IN ('female', 'male', 'neutral'))
```

**Ziel: ~30 Protagonist-Seeds, ~10 Sidekick-Archetypen, ~8 Antagonist-Archetypen**

**Beispiel Protagonist-Seed:**
```jsonc
{
  "seed_key": "west_african_girl",
  "seed_type": "protagonist_appearance",
  "appearance_en": "Dark brown skin, tightly coiled black hair often in two puffs, wide bright eyes, gap-toothed smile, wears colorful patterned clothes",
  "personality_trait_en": "Curious and talkative — asks questions about EVERYTHING",
  "weakness_en": "Sometimes talks when she should listen",
  "strength_en": "Her questions lead to discoveries nobody else would make",
  "cultural_background": "west_african",
  "gender": "female",
  "name_pool": {"female": ["Amara", "Nia", "Adaeze", "Serwaa", "Folake"]}
}
```

**Beispiel Sidekick-Archetype:**
```jsonc
{
  "seed_key": "loyal_skeptic",
  "seed_type": "sidekick_archetype",
  "personality_trait_en": "The voice of reason who always says 'this is a bad idea' but comes along anyway",
  "weakness_en": "Worries too much, sometimes holds the group back",
  "strength_en": "Their caution saves the group when things go wrong"
}
```

**Wichtig: Wie Character Seeds mit User-Auswahl interagieren:**

| User wählt... | Character Seed Verwendung |
|---------------|--------------------------|
| "Ich" (eigenes Kind) | Seed liefert nur **Nebenfiguren** + **Bild-Diversity** (Protagonist-Aussehen kommt aus kid_profile) |
| "Familie"/"Freunde" | Seed liefert **Bild-Diversity** für Nebenfiguren aus `kid_characters` |
| "Überraschung" | Seed liefert **alles**: Name, Aussehen, Persönlichkeit, Schwäche/Stärke |
| Jeder Modus | Sidekick/Antagonist-Archetypen werden IMMER aus Seeds gezogen |

---

### 2.3 `story_elements`

Kuratierte Pools für konkrete Story-Elemente die positiv gesteuert werden (statt Blacklists).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `element_key` | TEXT | UNIQUE NOT NULL | z.B. `opening_in_medias_res`, `macguffin_magic_compass` |
| `element_type` | TEXT | NOT NULL, CHECK | Siehe Typen unten |
| `content_en` | TEXT | NOT NULL | Englischer Prompt-Snippet |
| `labels` | JSONB | | Mehrsprachige Labels (Admin) |
| `compatible_themes` | TEXT[] | | NULL = alle Themes |
| `compatible_categories` | TEXT[] | | Blueprint-Kategorien: `{'growth', 'humor'}` |
| `age_groups` | TEXT[] | | `{'6-7', '8-9', '10-11'}` |
| `weight` | INTEGER | DEFAULT 10 | |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

**CHECK Constraint für `element_type`:**
```sql
CHECK (element_type IN (
  'opening_style',
  'narrative_perspective', 
  'macguffin',
  'setting_detail',
  'humor_technique',
  'tension_technique',
  'closing_style'
))
```

**Element-Typen und Beispiele:**

| Type | Beschreibung | Beispiel `content_en` |
|------|-------------|----------------------|
| `opening_style` | Wie die Geschichte beginnt | "Start with a SOUND — a crash, a whisper, a strange melody. The protagonist reacts before the reader knows what happened." |
| `narrative_perspective` | Erzählperspektive | "Tell the story in FIRST PERSON. The protagonist narrates directly: 'I knew it was a terrible idea, but my feet were already running.'" |
| `macguffin` | Objekt/Ziel das die Handlung antreibt | "A mysterious MAP that changes every time you look at it — paths appear and disappear." |
| `setting_detail` | Konkretes Setting-Detail | "The story takes place during the FIRST SNOW of the year. Everything is muffled and magical." |
| `humor_technique` | Konkrete Humor-Technik | "Use EXAGGERATION — if something goes wrong, it goes SPECTACULARLY wrong. The small spill becomes a flood. The tiny hole becomes a crater." |
| `tension_technique` | Spannungs-Technik | "Use a TICKING CLOCK — the protagonist has until sunset / before the tide comes in / before the last leaf falls." |
| `closing_style` | Wie die Geschichte endet | "End with an ECHO of the opening — the same sound/image/phrase from the first paragraph, but now it means something different." |

**Ziel: ~15 pro Typ = ~105 Elemente initial**

---

## 3. Stories-Tabelle: Neue Spalten

Neue Spalten auf der bestehenden `stories` Tabelle — alle nullable für Rückwärtskompatibilität.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `emotion_blueprint_key` | TEXT | FK → emotion_blueprints(blueprint_key), NULLABLE | Welcher Blueprint wurde verwendet |
| `tone_mode` | TEXT | CHECK, NULLABLE | `dramatic` · `comedic` · `adventurous` · `gentle` · `absurd` |
| `intensity_level` | TEXT | CHECK, NULLABLE | `light` · `medium` · `deep` |
| `character_seed_key` | TEXT | FK → character_seeds(seed_key), NULLABLE | Welcher Protagonist-Seed |
| `sidekick_seed_key` | TEXT | FK → character_seeds(seed_key), NULLABLE | Welcher Sidekick-Archetyp |
| `opening_element_key` | TEXT | FK → story_elements(element_key), NULLABLE | Welches Opening verwendet |
| `perspective_element_key` | TEXT | FK → story_elements(element_key), NULLABLE | Welche Erzählperspektive |

**CHECK Constraints:**
```sql
CHECK (tone_mode IS NULL OR tone_mode IN ('dramatic', 'comedic', 'adventurous', 'gentle', 'absurd'))
CHECK (intensity_level IS NULL OR intensity_level IN ('light', 'medium', 'deep'))
```

**Warum `_key` statt `_id` als FK?**  
Konsistenz mit bestehenden Patterns: `image_style_key` auf stories referenziert `image_styles.style_key`. Text-Keys sind lesbarer in Queries und Logs als UUIDs.

---

## 4. History/Tracking-Tabellen

### 4.1 `emotion_blueprint_history`

Spiegelt exakt das Pattern von `story_subtype_history`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `kid_profile_id` | UUID | FK → kid_profiles, NOT NULL | |
| `blueprint_key` | TEXT | NOT NULL | |
| `tone_mode` | TEXT | | Welcher Ton wurde kombiniert |
| `intensity_level` | TEXT | | Welche Intensität |
| `story_id` | UUID | FK → stories | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### 4.2 `character_seed_history`

Tracking welche Character Seeds verwendet wurden — für Diversity-Rotation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `kid_profile_id` | UUID | FK → kid_profiles, NOT NULL | |
| `seed_key` | TEXT | NOT NULL | |
| `seed_type` | TEXT | NOT NULL | protagonist / sidekick / antagonist |
| `story_id` | UUID | FK → stories | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

### 4.3 `story_element_usage`

Tracking welche konkreten Elemente verwendet wurden — ersetzt hardcoded Blacklists.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `kid_profile_id` | UUID | FK → kid_profiles, NOT NULL | |
| `element_key` | TEXT | NOT NULL | |
| `element_type` | TEXT | NOT NULL | |
| `story_id` | UUID | FK → stories | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

## 5. Prompt-Architektur

### 5.1 Neuer Prompt-Aufbau

Der `promptBuilder.ts` baut den User Message aktuell so:

```
AKTUELL:
  Age Rules + Difficulty Rules + Theme Rules + Emotion Rules
  + Word Counts + Characters + Guardrails + Variety Hints
  + Optional Learning Theme + Image Plan Instructions
```

NEU — zusätzliche Blöcke zwischen Theme Rules und Word Counts:

```
NEU:
  Age Rules + Difficulty Rules + Theme Rules
  ─────────────────────────────────────────
  ★ EMOTION BLUEPRINT BLOCK (wenn intensity != light)
  ★ TONE BLOCK
  ★ CHARACTER SEED BLOCK (immer, für Diversity)
  ★ ELEMENT BLOCKS (Opening, Perspective, etc.)
  ─────────────────────────────────────────
  + Word Counts + Characters + Guardrails
  + Optional Learning Theme + Image Plan Instructions
```

### 5.2 Prompt-Blöcke im Detail

**INTENSITY: LIGHT (~30% der Stories)**
Kein Blueprint-Block. Nur Theme + Subtype + Tone. Kostüm IST die Geschichte.
```
## TONE
Tell this story in a COMEDIC tone. Use exaggeration, funny mishaps, 
and lighthearted chaos. The humor should feel like a cartoon — 
physical, visual, absurd.
```

**INTENSITY: MEDIUM (~50% der Stories)**
Kurzer Blueprint (3 Stufen aus `arc_by_age`), subtil eingewoben.
```
## EMOTIONAL ARC (weave naturally into the plot — NO moral, NO lesson stated):
The protagonist is scared of something specific and concrete. 
They find one small brave moment — maybe by accident. It works! 
Simple, warm joy at the end. Keep the fear BRIEF and the resolution FAST.

## TONE
Tell this story in an ADVENTUROUS tone. Fast-paced, exciting, 
with a sense of discovery. Short sentences during action, 
longer ones during quiet moments.
```

**INTENSITY: DEEP (~20% der Stories)**
Voller Blueprint (4-6 Stufen), echte emotionale Reise.
```
## EMOTIONAL ARC (follow this blueprint — the emotional journey IS the story):
The protagonist avoids what scares them — maybe makes excuses, takes detours. 
Then a situation FORCES a small act of courage. It's shaky but it works. 
Growing confidence leads to a real breakthrough. 
Pride is earned, not given.

TONE WITHIN ARC: Humor in the avoidance scenes. Tension when forced to face it.
Warmth in the breakthrough. The ending is quiet self-respect, not celebration.

SURPRISE: The thing they avoided turns out to be different from what they imagined.

ENDING FEELING: "I was scared, but I did it anyway" — not fearless, but brave.

## TONE
Tell this story in a DRAMATIC tone. Let emotions breathe. 
Use sensory details — what does fear feel like in the stomach? 
What does relief sound like?
```

**CHARACTER SEED BLOCK (immer):**
```
## PROTAGONIST APPEARANCE (use for IMAGE GENERATION — maintain across all scenes):
Dark brown skin, tightly coiled black hair in two puffs, wide bright eyes, 
gap-toothed smile, wears a bright yellow raincoat and red boots.

## SIDEKICK:
The protagonist has a companion: the LOYAL SKEPTIC — always says 
"this is a bad idea" but comes along anyway. Their caution saves 
the group when things go wrong.
```

**ELEMENT BLOCKS (je nach Auswahl):**
```
## OPENING STYLE:
Start the story with a SOUND — a crash, a whisper, a strange melody. 
The protagonist reacts before the reader knows what happened.

## NARRATIVE PERSPECTIVE:
Tell the story in FIRST PERSON. The protagonist narrates directly.

## KEY OBJECT:
Include a mysterious MAP that changes every time you look at it — 
paths appear and disappear. This drives the plot forward.
```

### 5.3 Kritische Prompt-Regel (alle Intensitäten)

Wird IMMER an den Prompt angehängt:
```
CRITICAL: The emotional development must emerge ORGANICALLY from the plot. 
NO stated moral. NO lesson at the end. NO "and they learned that..." 
The child should FEEL, not be TAUGHT. The meaning lives in the experience, 
not in the explanation.
```

### 5.4 Image-Prompt Integration

Der Character Seed fließt auch in den Image-Prompt:

```
AKTUELL (imagePromptBuilder.ts):
  character_anchor vom LLM generiert → an Image-LLM

NEU:
  character_anchor = Character Seed appearance_en 
  (wenn Überraschungs-Modus oder kein eigenes Kind)
  ODER
  character_anchor = kid_profile Daten + Diversity-Anreicherung aus Seed
  (wenn "Ich"-Modus → Seed liefert Nebenfiguren-Aussehen)
```

---

## 6. Selection-Logik

### 6.1 Gesamtablauf in `generate-story`

```
User wählt: Theme → Characters → Effects → Style
                ↓
Edge Function: generate-story
  1. Theme auflösen (bestehend)
  2. Story Subtype wählen (bestehend, Round-Robin via story_subtype_history)
  
  ★ 2b. Engine-Check: ist user_id in emotion_flow_enabled_users?
         NEIN → bestehende Pipeline (siehe Architecture.md), STOP hier
         JA   → weiter mit neuer Engine ↓
  
  ★ 3. Intensity wählen:
       - Gewichteter Zufall: 30% light, 50% medium, 20% deep
       - Round-Robin-Korrektur: wenn letzte 3 alle "medium" → force "deep" oder "light"
  
  ★ 4. Emotion Blueprint wählen (wenn intensity != light):
       - Filter: is_active, ideal_age_groups enthält Kind-Alter, 
         compatible_themes enthält gewähltes Theme (oder NULL),
         min_intensity ≤ gewählte intensity
       - Exclude: letzte 5 Blueprints aus emotion_blueprint_history
       - Weighted Random aus verbleibenden
       - Lade arc_by_age[kid_age_group].arc_prompt
  
  ★ 5. Tone wählen:
       - Pool: ['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd']
       - Exclude: letzte 2 Tones aus emotion_blueprint_history
       - Gewichtet: 'absurd' nur für humor-Blueprints + Alter 6-9
  
  ★ 6. Character Seed wählen:
       - Wenn User "Überraschung": protagonist_appearance Seed
         → Filter: gender passend (oder neutral), age_range, cultural_background
         → Exclude: letzte 3 aus character_seed_history
         → Diversity-Check: wenn letzte 5 Seeds selber cultural_background → force anders
       - Immer: sidekick_archetype Seed
         → Exclude: letzte 3 aus character_seed_history
       - Wenn Blueprint.category = 'social': ggf. antagonist_archetype Seed
  
  ★ 7. Story Elements wählen:
       - opening_style: Weighted Random, exclude letzte 3
       - narrative_perspective: Weighted Random, exclude letzte 2
       - Optional: macguffin, setting_detail, humor_technique, tension_technique
         (basierend auf Blueprint-Kategorie und Intensity)
  
  8. Learning Theme prüfen (bestehend, learningThemeRotation.ts)
     → NEU: wenn Learning Theme aktiv UND Blueprint hat compatible_learning_themes Match
       → bevorzuge diesen Blueprint (Soft-Boost auf weight)
  
  9. buildStoryPrompt() mit ALLEN Bausteinen
  10. LLM Call
  11. Image Generation mit Character Seed appearance (statt LLM-generiertem anchor)
  12. Speichern + History-Einträge schreiben
```

### 6.2 Fallback-Strategie

| Situation | Fallback |
|-----------|----------|
| Kein passender Blueprint (alle gefiltert) | Reset: ignoriere History, nehme Random |
| Blueprint hat kein `arc_by_age` für dieses Alter | Nehme nächstniedrigere Altersgruppe |
| Kein passender Character Seed | LLM generiert frei (aktuelles Verhalten) |
| DB-Query schlägt fehl | Logge Error, fahre ohne Blueprint fort (graceful degradation) |

---

## 7. Engine Toggle (Parallelbetrieb)

### Prinzip

Beide Engines laufen parallel. Pro User umschaltbar via Admin-Panel. Keine Änderung an der bestehenden Pipeline — die neue Engine ist ein separater Branch.

### Steuerung

Neuer Key in `app_settings`:

```sql
INSERT INTO app_settings (key, value) 
VALUES ('emotion_flow_enabled_users', '[]');
-- JSON array of user_ids: ["uuid-1", "uuid-2"]
-- Leer = niemand, ["*"] = alle
```

### Flow in `generate-story/index.ts`

```
generate-story:
  1. Auth + Request parsen (bestehend)
  2. ★ Engine-Check: ist user_id in emotion_flow_enabled_users?
  
  ─── ALTE ENGINE (emotion_flow = false) ──────────────────
  │  Bestehende Pipeline, 0 Changes:
  │  Theme → Subtype (Round-Robin) → emotion_rules
  │  → buildVarietyBlock() → buildStoryPrompt() → LLM
  │
  ─── NEUE ENGINE (emotion_flow = true) ──────────────────
  │  Theme → Subtype (Round-Robin, bestehend)
  │  → selectIntensity() → selectBlueprint() → selectTone()
  │  → selectCharacterSeed() → selectStoryElements()
  │  → buildEmotionFlowPrompt() → LLM
  │  
  │  Bei FEHLER in neuer Engine:
  │  → logge Error, falle zurück auf ALTE ENGINE
  │  → User merkt nichts, Story wird trotzdem generiert
  └────────────────────────────────────────────────────────
```

### Admin-UI (minimal)

Im bestehenden Admin-Panel (Tab "System" oder "Settings"):

```
Emotion-Flow-Engine
────────────────────────────
☑ Johann (uuid-abc)        ← Toggle pro User
☐ Beta-User-1 (uuid-def)
☐ Beta-User-2 (uuid-ghi)
────────────────────────────
[Für alle aktivieren]  [Für alle deaktivieren]
```

Implementation: Einfache Liste mit Checkboxen. Liest/schreibt `app_settings` Key `emotion_flow_enabled_users`.

### Warum `app_settings` statt eigene Tabelle?

- Pattern existiert schon (Key-Value Store)
- Kein Schema-Change nötig
- Kein RLS-Problem (app_settings ist read für alle, write für admin)
- Kann jederzeit zu einer eigenen Spalte auf `user_profiles` migriert werden

### Rollout-Strategie

```
Tag 1:   Nur du (Admin) → testen, vergleichen
Tag 2-3: 2-3 Beta-Familien → Feedback sammeln  
Tag 4+:  Schrittweise alle → wenn Qualität bestätigt
Final:   Alte Engine entfernen, Toggle raus
```

### Was getrackt wird

Auf der `stories` Tabelle zeigt `emotion_blueprint_key`:
- `NULL` → alte Engine  
- `'overconfidence_and_fall'` etc. → neue Engine

So kannst du jederzeit filtern: welche Stories kamen aus welcher Engine, Ratings vergleichen, A/B-Test auswerten.

---

## 8. Was unverändert bleibt

| System | Tabelle | Status |
|--------|---------|--------|
| Story Subtypes + Round-Robin | `story_subtypes`, `story_subtype_history` | ✅ Unverändert |
| Age Rules | `age_rules` | ✅ Unverändert |
| Difficulty Rules | `difficulty_rules` | ✅ Unverändert |
| Theme Rules | `theme_rules` | ✅ Unverändert |
| Learning Themes | `learning_themes`, `parent_learning_config` | ✅ Unverändert (+ neue Verknüpfung) |
| Image Styles | `image_styles` | ✅ Unverändert |
| Content Safety | `content_themes_by_level` | ✅ Unverändert |
| Wizard UI | Frontend | ✅ Kein Change |
| Series Feature | `continuity_state`, `visual_style_sheet` | ✅ Unverändert |

---

## 9. Was deprecated wird

| System | Tabelle/Code | Aktion |
|--------|-------------|--------|
| Emotion Rules | `emotion_rules` (18 Einträge) | **Phase 1: behalten, nicht mehr nutzen.** `promptBuilder.ts` liest sie nicht mehr. Löschen in Phase 4+. |
| Structure Ratings | `stories.structure_sentence_variety`, `structure_paragraph_structure`, `structure_dialogue_balance`, `structure_pacing` | **Phase 1: behalten, nicht mehr befüllen.** Neue Stories bekommen NULL. Löschen in Phase 4+. |
| Variety Blacklists | `buildVarietyBlock()` hardcoded Arrays | **Phase 1: ersetzen.** Neue Selection-Logik mit History-Tabellen. |

> **Kein DROP in Phase 1.** Alles deprecated bleibt in der DB. Neue Spalten sind nullable. Alte Stories funktionieren weiter.

---

## 10. Migrations-Plan

### Migration 1: Core Tables
```sql
-- emotion_blueprints
-- character_seeds  
-- story_elements
```

### Migration 2: History Tables
```sql
-- emotion_blueprint_history
-- character_seed_history
-- story_element_usage
```

### Migration 3: Stories Extension
```sql
-- ALTER TABLE stories ADD COLUMN emotion_blueprint_key TEXT ...
-- ALTER TABLE stories ADD COLUMN tone_mode TEXT ...
-- ALTER TABLE stories ADD COLUMN intensity_level TEXT ...
-- ALTER TABLE stories ADD COLUMN character_seed_key TEXT ...
-- ALTER TABLE stories ADD COLUMN sidekick_seed_key TEXT ...
-- ALTER TABLE stories ADD COLUMN opening_element_key TEXT ...
-- ALTER TABLE stories ADD COLUMN perspective_element_key TEXT ...
```

### Migration 4: RLS Policies
```sql
-- Alle neuen Tabellen: SELECT für authenticated, INSERT/UPDATE für service_role
-- History-Tabellen: INSERT für authenticated (Edge Functions schreiben)
```

### Migration 5: Engine Toggle
```sql
-- INSERT INTO app_settings: emotion_flow_enabled_users = '[]'
```

### Migration 6: Seed Data
```sql
-- 21 Emotion Blueprints (Keys + arc_by_age + arc_description_en)
-- → Wird in Phase 2 (Content-Chat) generiert
```

---

## 11. Entscheidungen (resolved 2026-02-21)

| # | Frage | Entscheidung |
|---|-------|-------------|
| 1 | FK auf `_key` oder `_id`? | ✅ **`_key` (TEXT)** — konsistent mit `image_style_key`, lesbarer |
| 2 | `arc_by_age` als JSONB oder separate Tabelle? | ✅ **JSONB** — ein Blueprint = ein Row, kein extra JOIN |
| 3 | Character Seed: ein Pool oder aufgeteilt? | ✅ **Ein Pool** mit `cultural_background` Spalte |
| 4 | Wie viele History-Einträge pro Kind? | ✅ **Application-Level, letzte 10** — kein CRON, reicht für Anti-Wiederholung |
| 5 | `tone_mode` wo speichern? | ✅ **Pro Story + History** — Tone ist unabhängig vom Blueprint |
| 6 | Intensity-Verteilung konfigurierbar? | ✅ **Hardcoded Konstante** (30/50/20) — DB-Config wäre Overengineering vor Beta |
| 7 | `compatible_subtypes` auf Blueprint? | ✅ **Raus** — komplett gedroppt, zu granular für 21 Blueprints |
| 8 | `buildVarietyBlock()` sofort entfernen? | ✅ **Parallel laufen** — bleibt als Fallback, neue Logik übernimmt schrittweise |

---

## Entity Relationship (Neue + Bestehende)

```
emotion_blueprints (1) ◄──── (N) emotion_blueprint_history
       │                              │
       │ (blueprint_key)              │ (kid_profile_id)
       │                              │
       ▼                              ▼
    stories ◄─────────────────── kid_profiles
       │                              │
       │ (character_seed_key)         │
       │ (sidekick_seed_key)          │
       ▼                              ▼
character_seeds (1) ◄──── (N) character_seed_history

story_elements (1) ◄──── (N) story_element_usage
       │
       │ (element_key)
       │
       ▼
    stories (opening_element_key, perspective_element_key)

─── Bestehend (unverändert) ───

story_subtypes (1) ◄──── (N) story_subtype_history
theme_rules / age_rules / difficulty_rules → promptBuilder.ts
learning_themes → learningThemeRotation.ts
image_styles → imagePromptBuilder.ts
```

---

*Dieses Dokument ist der Blueprint für Phase 1. Phase 2 (Content) generiert die Seed-Daten. Phase 3 (Implementation) baut promptBuilder.ts um und schreibt die Migrations.*
