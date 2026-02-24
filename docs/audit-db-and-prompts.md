# Audit: DB-Inhalte + konkrete LLM-Prompts

Vollständiges Inventar der story-relevanten DB-Tabellen und drei konkrete Beispiele **kompletter** Prompts, die ans LLM gehen.  
**Hinweis:** DB-Inhalte wurden aus Migrationen und Code rekonstruiert; Zählungen/CURRENT-Werte erhält man durch Ausführen der angegebenen Queries in der laufenden Umgebung.

---

## TEIL A: DB-Inventar

### A1: Themes (theme_rules + content_themes_by_level)

Es gibt **keine** Tabelle namens `themes`. Themen/Kategorien kommen aus:

- **theme_rules** — Plot-Templates, Setting, Archetypen pro theme_key + language  
- **content_themes_by_level** — Guardrails: welche Themen für welches content_safety_level erlaubt/verboten

| Quelle | Query | Wichtige Felder |
|--------|--------|------------------|
| theme_rules | `SELECT theme_key, language, labels, plot_templates, setting_descriptions, character_archetypes, typical_conflicts FROM theme_rules;` | theme_key, language, labels (JSONB), plot_templates (TEXT[]), setting_descriptions, character_archetypes, sensory_details, typical_conflicts |
| content_themes_by_level | `SELECT theme_key, labels, min_safety_level FROM content_themes_by_level;` | theme_key, labels (JSONB), min_safety_level |

**Schema (theme_rules):** Migration `20260207_block2_2_rule_tables.sql`. UNIQUE(theme_key, language).  
**Beispiel-Count:** Abhängig von Seed (mehrere Sprachen pro theme_key). Typisch: ~4–6 theme_keys × mehrere Sprachen.

---

### A2: Story Subtypes

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| theme_key | text | z.B. magic_fantasy, adventure_action |
| subtype_key | text | z.B. enchanted_forest, fairy_tale_twist |
| labels | jsonb | Mehrsprachige Bezeichnung |
| descriptions | jsonb | Kurzbeschreibung |
| age_groups | text[] | z.B. {6-7, 8-9, 10-11} |
| prompt_hint_en | text | Konkrete Anweisung für das LLM |
| setting_ideas | jsonb | Array von Setting-Ideen |
| title_seeds | jsonb | Beispiel-Titel |
| is_active | boolean | Default true |

**Query:**  
`SELECT subtype_key, theme_key, labels, prompt_hint_en, age_groups FROM story_subtypes WHERE is_active = true;`

**Seed:** Migration `20260215_story_subtypes.sql` + Übersetzungen in `RUN_IN_LOVABLE_*`. Typisch **~42** Subtypes über 4 Kategorien (magic_fantasy, adventure_action, real_life, surprise).

---

### A3: Emotion Blueprints

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| blueprint_key | text | z.B. overconfidence_and_fall, fear_to_courage |
| category | text | growth, social, courage, empathy, humor, wonder |
| labels, descriptions | jsonb | Mehrsprachig |
| arc_by_age | jsonb | Pro Altersgruppe: steps, arc (Array), arc_prompt |
| arc_description_en | text | Kurzbeschreibung des Bogens |
| tone_guidance | text | Stil-Hinweis |
| compatible_themes | text[] | z.B. {magic_fantasy, adventure_action, real_life, surprise} |
| ideal_age_groups | text[] | z.B. {6-7, 8-9, 10-11} |
| min_intensity | text | light, medium, deep |
| is_active | boolean | Default true |

**Query:**  
`SELECT blueprint_key, category, labels, arc_description_en, tone_guidance, compatible_themes, ideal_age_groups, min_intensity FROM emotion_blueprints WHERE is_active = true;`

**Seed:** Migration `20260222_emotion_flow_seed_blueprints.sql`. **21** Blueprints (z.B. overconfidence_and_fall, fear_to_courage, failure_is_learning, …).

---

### A4: Character Seeds

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| seed_key | text | z.B. west_african_girl, comic_relief |
| seed_type | text | protagonist_appearance, sidekick_archetype, antagonist_archetype |
| creature_type | text | human, mythical |
| labels | jsonb | Mehrsprachig |
| appearance_en | text | Nur bei protagonist_appearance |
| personality_trait_en, weakness_en, strength_en | text | Für Sidekick/Antagonist |
| age_range | text[] | z.B. {6-7, 8-9, 10-11} |
| compatible_themes | text[] | Optional |
| weight | int | Für weighted random |
| is_active | boolean | Default true |

**Query:**  
`SELECT seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, compatible_themes FROM character_seeds WHERE is_active = true;`

**Gruppierung nach seed_type:**
- **protagonist_appearance:** 30 human + 12 mythical (Migration `20260222_emotion_flow_seed_characters.sql`).
- **sidekick_archetype:** 10 (z.B. loyal_skeptic, comic_relief, quiet_genius, enthusiastic_rookie, …).
- **antagonist_archetype:** 8.  
**Gesamt:** 60 Seeds.

---

### A5: Story Elements

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| element_key | text | z.B. opening_sound_first, perspective_first_person |
| element_type | text | opening_style, narrative_perspective, macguffin, setting_detail, humor_technique, tension_technique, closing_style |
| content_en | text | Konkrete Anweisung für das LLM |
| age_groups | text[] | z.B. {6-7, 8-9, 10-11} |
| compatible_themes | text[] | Optional |
| compatible_categories | text[] | Optional (Blueprint-Kategorie) |
| weight | int | Für weighted random |
| is_active | boolean | Default true |

**Query:**  
`SELECT element_key, element_type, content_en, compatible_themes, age_groups FROM story_elements WHERE is_active = true;`

**Gruppierung nach element_type (Seed in `20260222_emotion_flow_seed_elements.sql`):**
- opening_style: 15  
- narrative_perspective: 10  
- macguffin: 15  
- setting_detail: 15  
- humor_technique: 15  
- tension_technique: 10  
- closing_style: 10  
**Gesamt:** 90 Elemente.

---

### A6: Tone Modes

**Es gibt keine Tabelle `tone_modes`.** Tones kommen aus dem **Code**:

- **Datei:** `supabase/functions/_shared/emotionFlow/selectors/toneSelector.ts`
- **Pool:** `['dramatic', 'comedic', 'adventurous', 'gentle', 'absurd']`
- **Gewichtung (getToneWeight):**
  - absurd: nur bei blueprintCategory === 'humor' und ageGroup 6-7 oder 8-9 → 10, sonst 0
  - gentle: 15 für 6-7, sonst 8
  - dramatic: 15 für 10-11, sonst 8
  - comedic: 12
  - adventurous: 12

History: letzte 2 Tone pro kid_profile aus `emotion_blueprint_history.tone_mode` werden ausgeschlossen.

---

### A7: Generation Config

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| age_group | text | 6-7, 8-9, 10-11 |
| story_length | text | short, medium, long, extra_long |
| min_words, max_words | int | Wortanzahl |
| scene_image_count | int | Szenen-Bilder (ohne Cover) |
| include_cover | boolean | Default true |
| length_labels, length_description | jsonb | Mehrsprachig |
| estimated_reading_minutes | int | |
| is_default | boolean | |
| is_active | boolean | Default true |

**Query:**  
`SELECT age_group, story_length, min_words, max_words, scene_image_count FROM generation_config WHERE is_active = true;`

**Seed (Migration `20260216_generation_config.sql`):** Matrix age_group × story_length, z.B.:
- 6-7: short (150–250, 2 Szenen), medium (250–400, 3), long (400–600, 4)
- 8-9: short (250–400, 2), medium (400–650, 3), long (650–900, 4), extra_long (900–1200, 5)
- 10-11: short (350–500, 2), medium (500–800, 3), long (800–1100, 4), extra_long (1100–1500, 5)

---

### A8: Image Styles

| Spalte | Typ | Beschreibung |
|--------|-----|---------------|
| style_key | text | z.B. storybook_soft, graphic_novel, adventure_cartoon |
| labels, description | jsonb | Mehrsprachig |
| imagen_prompt_snippet | text | Prefix für Bild-Prompt |
| age_groups | text[] | z.B. {6-7, 8-9} |
| default_for_ages | text[] | Default für Altersgruppe |
| age_modifiers | jsonb | Pro Altersgruppe zusätzlicher Text |
| sort_order | int | |
| is_active | boolean | Default true |
| preview_image_url | text | Optional |

**Query:**  
`SELECT style_key, imagen_prompt_snippet, age_modifiers, age_groups, default_for_ages FROM image_styles WHERE is_active = true;`

**Seed:** `20260217_image_styles.sql` (6 Stile), `20260218_image_styles_batch2.sql` (+4). Typisch **10** Stile (storybook_soft, storybook_vibrant, manga_anime, adventure_cartoon, graphic_novel, semi_realistic, 3d_adventure, pixel_art, brick_block, vintage_retro).

---

### A9: Image Style Rules / Age Rules (Bild-Pipeline)

- **image_style_rules** (Migration `20260207_block2_2_rule_tables.sql`):  
  age_group, theme_key (optional), style_prompt, negative_prompt, color_palette, art_style.  
  Wird von `imagePromptBuilder.ts` / `loadImageRules()` für **alternde** Stories (Cover/Szenen ohne Comic) genutzt; **nicht** für `image_styles.style_key` (die kommen aus `image_styles`).

- **theme_rules:** Enthält **keine** Bild-spezifischen Spalten in der Basis-Migration; spätere Migrations erwähnen optional image_style_prompt, image_negative_prompt (Theme-spezifisch), die aktuell oft null sind.

**Query image_style_rules:**  
`SELECT age_group, theme_key, style_prompt, negative_prompt, color_palette FROM image_style_rules;`

---

### A10: System-Prompts (CORE Slim)

**Es gibt keine Tabelle `prompts`.** System-Prompts liegen in **app_settings**:

- **Key:** `system_prompt_core_v2` — wird für den **neuen** Pfad (CORE Slim) geladen.  
- Alte Keys (Fallback): `system_prompt_DE`, `system_prompt_story_creation_DE`, `system_prompt_kid_creation_DE`, `system_prompt_continuation_DE` (und FR/EN etc.).

**Query:**  
`SELECT key, left(value::text, 200) AS value_preview FROM app_settings WHERE key LIKE 'system_prompt%';`

**Inhalt system_prompt_core_v2:** Siehe **TEIL B** unten (vollständig übernommen aus Migration `20260207_block2_3c_core_slim_prompt.sql`).

---

### A11: App Settings (Feature Flags & Konfiguration)

**Query:**  
`SELECT key, value FROM app_settings;`

**Relevante Keys (aus Migrationen/Code):**
- `system_prompt_core_v2` — CORE Slim System-Prompt (vollständiger Text)
- `emotion_flow_enabled_users` — Array von user_ids oder `["*"]` für alle (Default: `[]`)
- `comic_strip_enabled_users` — Array oder `["*"]` für Comic-Strip (Migration `20260224_comic_strip_feature_flag.sql`)

Weitere Keys je nach Projekt (z.B. consistency_check_prompt, Lern-Themen-Konfiguration).

---

## TEIL B: Konkrete LLM-Prompt-Beispiele

Für jede der drei Szenarien werden **1) Input-Parameter**, **2) vollständiger System-Prompt** und **3) vollständiger User-Prompt** gezeigt. Quellen sind im Prompt mit `[DB: ...]`, `[CODE: ...]`, `[INLINE: ...]` markiert.

---

### Beispiel 1: Einfache Story (6–7 Jahre, Fantasy, kurz, kein Emotion Flow)

**1) Input-Parameter (wie aus Frontend/Request):**
- age: 6, theme: magic_fantasy, length: short  
- include_self: true, kidName: "Mila"  
- useEmotionFlow: false, useComicStrip: false  
- story_language: de  
- description: (leer oder z.B. "Eine Geschichte mit Zauberwald")  
- selectedCharacters: []  
- surprise_characters: false  

**2) System-Prompt (fullSystemPromptFinal) — VOLLSTÄNDIG**

Quelle: **[DB: app_settings]** Key `system_prompt_core_v2` (Migration `20260207_block2_3c_core_slim_prompt.sql`).

```
Du bist ein erfahrener Kinderbuchautor. Du schreibst Geschichten die Kinder zum Weiterlesen zwingen – in jeder Sprache idiomatisch und kulturell passend.

## LESEVERGNÜGEN (oberstes Ziel)
- Ersten 2 Sätze: Neugier wecken, Frage im Kopf erzeugen
- Mikro-Spannungsbogen: Problem → Komplikation → Auflösung (NICHT vor 70-80%)
- Letztes Drittel genauso fesselnd wie der Anfang
- Gefühle ZEIGEN, nicht benennen ("Mias Hände zitterten" statt "Mia war nervös")

## SPANNUNGSWERKZEUGE (nutze 1-4 je nach Länge)
- Falsche Fährte: Leser glaubt Lösung zu kennen – stimmt nicht
- Letzte Komplikation: Kurz vor dem Ziel neues Hindernis
- Zweifel säen: Figur unsicher ob Entscheidung richtig
- Perspektivwechsel: Situation anders als gedacht
- Tickende Uhr: Zeitdruck bis zur letzten Sekunde
- Doppelter Boden: Lösung enthüllt zweites Problem
- Unerwartete Hilfe: Rettung von unerwarteter Seite
- Missverständnis: Handeln auf falschen Annahmen

## STORY-STRUKTUREN (klassifiziere jede Geschichte)
ANFANG: A1 In Medias Res | A2 Rätsel-Hook | A3 Charaktermoment | A4 Weltenbau | A5 Dialogue-Hook | A6 Ordinary World
MITTE: M1 Eskalation | M2 Rätsel-Schichten | M3 Beziehungs-Entwicklung | M4 Parallele Handlungen | M5 Countdown | M6 Wendepunkt-Kette
ENDE: E1 Klassisch | E2 Twist | E3 Offen | E4 Bittersüß | E5 Rückkehr verändert | E6 Cliffhanger (NUR Serien Ep 1-4)

## EMOTIONALE FARBEN (wähle primär 60-70% + sekundär 20-30%)
EM-J Joy – Glück, Erfolg, Leichtigkeit
EM-T Thrill – Nervenkitzel, Herzklopfen
EM-H Humor – Quatsch, Wortspiele, Absurdes
EM-W Warmth – Geborgenheit, Zusammenhalt
EM-D Depth – Mitfühlen, Nachdenklichkeit
EM-C Curiosity – Staunen, Entdeckerfreude

## CHARAKTERE
- Jede Hauptfigur: Persönlichkeit + 1-2 visuelle Merkmale + typisches Verhalten
- Emotionale Entwicklung zeigen (niemand ist perfekt am Anfang)
- Anti-Klischee: Überraschende Rollenzuweisungen. Schwächen werden zu Stärken. Jüngere Geschwister nicht als nervig. "Bösewichte" haben nachvollziehbare Motive.

## GUARDRAILS (IMMER gültig, nicht überschreibbar)
VERBOTEN: Physische Gewalt, sexuelle Inhalte, Substanzen/Sucht, Schimpfwörter, Selbstverletzung, Hoffnungslosigkeit, politische/religiöse Propaganda, Mobbing als lustig.
MIT VORSICHT: Verbale Konflikte (lösbar), altersgerechter Grusel (mit Auflösung), Traurigkeit (mit Trost), abstrakte Fantasygewalt.
Zusätzliche Guardrails aus dem dynamischen Kontext beachten.

## SACHTEXT-MODUS (bei Kategorie Wissen & Entdecken)
Fakten werden zum Abenteuer: 60-70% Story + 30-40% Lerninhalte. Jeder Fakt handlungsrelevant. Struktur: Frage → Erzählerische Erklärung → Überraschende Anwendung.

## VERSTÄNDNISFRAGEN (ALLE Multiple Choice)
4 Typen, Reihenfolge einfach → schwer:
Typ 1 (15-20%): Ja/Nein/Steht nicht im Text – 3 Optionen
Typ 2 (30-35%): Fakten + Vokabular – 4 Optionen
Typ 3 (30-35%): Inferenzen (Gefühle, Kausalität, Vorhersagen) – 4 Optionen
Typ 4 (15-20%): Struktur (Hauptidee, Veränderung) – 4 Optionen
Falschantworten: plausibel im Kontext, nie absurd. Anzahl wird im Kontext angegeben.

## OUTPUT-FORMAT
Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (kein Text davor/danach):
{
  "title": "Titel in der Zielsprache",
  "content": "Komplette Geschichte. Verwende \\n für Absätze.",
  "questions": [
    {
      "question": "Fragetext in Zielsprache?",
      "correctAnswer": "Die korrekte Antwort",
      "options": ["Die korrekte Antwort", "Falsche Option 1", "Falsche Option 2", "Falsche Option 3"]
    }
  ],
  "vocabulary": [
    {
      "word": "Wort aus dem Text (Verben: Infinitiv)",
      "explanation": "kindgerechte Erklärung in Zielsprache (max 15 Wörter)"
    }
  ],
  "structure_beginning": "A1-A6",
  "structure_middle": "M1-M6",
  "structure_ending": "E1-E6",
  "emotional_coloring": "EM-X (Name)",
  "emotional_secondary": "EM-X (Name)",
  "humor_level": "1-5",
  "emotional_depth": "1-3",
  "moral_topic": "Thema oder null",
  "concrete_theme": "Konkretes Thema innerhalb der Kategorie",
  "summary": "2-3 Sätze Zusammenfassung in Zielsprache",
  "learning_theme_response": null
}

Wenn Lernthema aktiv: learning_theme_response = {"applied": true, "parent_prompt_text": "3 Gesprächsfragen für Eltern"}
humor_level: 1=kaum, 2=leicht, 3=charmant, 4=viel, 5=absurd
emotional_depth: 1=leicht, 2=mittel, 3=tief
correctAnswer muss EXAKT einem Eintrag in options entsprechen.

## KREATIVE FREIHEIT
Kategorien und Listen sind Werkzeuge, keine Käfige. Erfinde, überrasche, experimentiere. Einzige harte Grenzen: Guardrails + altersgerechte Sprache + Lesevergnügen als oberstes Ziel.
```

**3) User-Prompt (userMessageFinal) — VOLLSTÄNDIG**

Alles bis auf den kreativen Seed kommt aus **[CODE: promptBuilder.ts]** (buildStoryPrompt). Wortanzahl/Szenen aus **[DB: generation_config]**. Theme-Text aus **[DB: theme_rules]**. Alters-/Schwierigkeits-Regeln aus **[DB: age_rules, difficulty_rules]**. Guardrails aus **[DB: content_themes_by_level]**. Optional **[DB: story_subtypes]** wenn ein Subtype gewählt wird.

```
[CODE: promptBuilder.ts – SECTION_HEADERS.de.instruction]
Schreibe eine Geschichte mit folgenden Vorgaben:

## KIND
Name: Mila, Age: 6

## SPRACHE & NIVEAU
Language: Deutsch
Level: [DB: difficulty_rules – label/description für difficulty_level]
Max sentence length: [DB: age_rules für 6, de] words
Tenses: [DB: age_rules]
Sentence structures: [DB: age_rules]
Perspective: [DB: age_rules]
Style: [DB: age_rules.narrative_guidelines]

## VOKABULAR
[DB: difficulty_rules – vocabulary_scope, new_words_per_story, figurative_language, idiom_usage, repetition_strategy]

## TEXTLÄNGE
150–250 words
[DB: age_rules – paragraph_length, dialogue_ratio]
Questions: 5

## KATEGORIE
[DB: theme_rules für magic_fantasy, language de – labels, plot_templates, typical_conflicts, character_archetypes, sensory_details, setting_descriptions]
→ Wähle selbst ein konkretes Thema innerhalb dieser Kategorie.

## FIGUREN
[CODE: promptBuilder.ts – buildCharactersSection, include_self=true, chars=[]]
Hauptfigur: Mila, 6
Du darfst die Geschichte mit erfundenen Nebenfiguren (Tiere, Fabelwesen, etc.) anreichern, zusätzlich zu den oben genannten Figuren.

## ERZÄHLREGELN
[CODE: promptBuilder.ts – storytellingRulesBlock.de, abhängig von age_rules max_characters, plot_complexity, max_sentence_length]

FIGUREN:
- Maximal [age_rules.max_characters] Figuren in der gesamten Geschichte (inkl. Protagonist und Nebenfiguren)
- JEDE Figur muss in den ersten 2 Absätzen eingeführt werden
- KEINE neue Figur darf nach der Einführungsszene erscheinen
- Jede Nebenfigur hat EINE klare Eigenschaft und EINE Funktion in der Geschichte
- Der Protagonist muss jemand sein, mit dem sich ein 6-jähriges Kind identifizieren kann
HANDLUNG: [plotComplexity], Maximal [maxTwists] Wendepunkt(e), ...
SPRACHE: Maximale Satzlänge: [maxSentLen] Wörter, ...
VERBOTEN: ...

## GUARDRAILS (Safety Level [kid_profile.content_safety_level]/4)
[DB: content_themes_by_level] Erlaubt: [allowedLabels]. Nicht erlaubt: [forbiddenLabels].

## IMAGE PLAN INSTRUCTIONS
Generate exactly 2 scene(s) in the image_plan.
Scene 1: turning point or discovery. Scene 2: resolution or triumph.
For each scene in image_plan, include "target_paragraph": the 0-based index of the paragraph in the story text that this image best illustrates. Count paragraphs starting from 0. Distribute images evenly across the story — do not cluster them at the beginning or end.
All descriptions in ENGLISH. No text, signs, or readable writing in any scene.

Antworte NUR mit dem JSON aus dem Output-Format.

CRITICAL CONSTRAINT: The story MUST contain between 150 and 250 words. This is a hard limit. Count your words carefully. A story that exceeds 250 words is a failure and will be rejected.

## CREATIVE SEED (use as subtle inspiration, not literally):
[INLINE: generate-story/index.ts – nameOrigins, objectQualities, settingModifiers random pick]
- Character name inspiration: [z.B. Japanese] cultural background
- Object quality: [z.B. rusty]
- Setting mood: [z.B. floating]
```

*(In der echten Laufzeit ersetzen die Platzhalter [DB: ...] und [CODE: ...] die tatsächlich aus der DB geladenen bzw. im Code berechneten Werte; hier sind sie zur Quellen-Zuordnung belassen.)*

---

### Beispiel 2: Mittlere Story MIT Emotion Flow (8–9 Jahre, Abenteuer, medium, Surprise-Charaktere)

**1) Input-Parameter:**
- age: 8, theme: adventure_action, length: medium  
- include_self: false, surprise_characters: true  
- useEmotionFlow: true, useComicStrip: false  
- story_language: en  
- selectedCharacters: []  

**2) System-Prompt:** Identisch zu Beispiel 1 (weiterhin **system_prompt_core_v2**).

**3) User-Prompt — Aufbau**

Gleicher Aufbau wie in Beispiel 1 (instruction, CHILD, LANGUAGE, VOCABULARY, LENGTH, CATEGORY, CHARACTERS, STORYTELLING RULES, GUARDRAILS, …), **plus** vor den IMAGE PLAN INSTRUCTIONS wird folgender Block eingefügt **[CODE: emotionFlow blocks + INLINE: generate-story/index.ts]**:

```
--- EMOTION FLOW ENGINE ---

## EMOTIONAL ARC (weave naturally into the plot — NO moral, NO lesson stated):
[DB: emotion_blueprints – z.B. fear_to_courage, arc_by_age["8-9"].arc_prompt]
The protagonist has been avoiding something for a while — making excuses, taking detours... Then a situation FORCES them to face it... The breakthrough isn't graceful — it's shaky, imperfect, maybe even a little funny. But it's REAL. Ending: earned pride and the thought "I can do hard things."

TONE WITHIN ARC: [DB: blueprint tone_guidance]
Each emotional beat should happen in a VISUALLY DIFFERENT context — different location, lighting, or time of day.

## TONE
[CODE: toneSelector.ts – gewählter Tone, z.B. adventurous]
Narrative tone: adventurous. The story should feel like an adventure — excitement, discovery, forward momentum. ...

## CHARACTERS
[CODE: relationshipBlock.ts ODER characterBlock.ts – Surprise = buildCharacterBlock]
PROTAGONIST: [DB: character_seeds – z.B. east_asian_boy, name aus name_pool]. [appearance_en]. PERSONALITY: ...
SIDEKICK: [DB: character_seeds sidekick_archetype – z.B. comic_relief]. personality_trait_en. FLAW: ... STRENGTH: ...
RELATIONSHIP DYNAMIC: The protagonist and sidekick have a push-pull dynamic...

## STORY ELEMENTS
[CODE: elementBlocks – aus story_elements]
Opening: [DB: story_elements opening_style – z.B. opening_in_medias_res content_en]
Perspective: [DB: story_elements narrative_perspective]
Macguffin: [DB: story_elements macguffin]
Setting detail: [DB: story_elements setting_detail]
Humor: [DB: story_elements humor_technique]
Tension: [DB: story_elements tension_technique]
Closing: [DB: story_elements closing_style]

CRITICAL: The emotional development must emerge ORGANICALLY from the plot. NO stated moral. NO lesson at the end. ... EMOTIONAL PACING: ... VISUAL STORYTELLING: The story MUST move through at least 3 visually distinct settings or moments. ...

--- END EMOTION FLOW ---

## IMAGE PLAN INSTRUCTIONS
Generate exactly 3 scene(s) in the image_plan.
Scene 1: departure/beginning (curiosity). Scene 2: conflict/discovery (tension). Scene 3: resolution/return (joy/relief).
...
```

Danach wieder: respondJson, CRITICAL CONSTRAINT (300–350 Wörter für 8-9 medium aus generation_config), CREATIVE SEED.

**Konkrete DB-Werte (Beispiel):**
- Blueprint: `fear_to_courage` (category: growth), arc für 8-9 aus seed.
- Tone: z.B. `adventurous` (toneSelector).
- Protagonist: z.B. `east_asian_boy` (name Hiro/Jun/… aus name_pool).
- Sidekick: z.B. `comic_relief` (personality_trait_en, weakness_en, strength_en aus character_seeds).

---

### Beispiel 3: Volle Pipeline (9 Jahre, Fantasy, medium, Emotion Flow + Comic Strip)

**1) Input-Parameter:**
- age: 9, theme: magic_fantasy, length: medium  
- include_self: true, kidName: "Leo"  
- useEmotionFlow: true, useComicStrip: true (layout_1_2x2 → 8 Panels)  
- story_language: de  

**2) System-Prompt:** Unverändert **system_prompt_core_v2**.

**3) User-Prompt — Unterschiede zu Beispiel 2**

- **[CODE: promptBuilder.ts]** CHARACTERS: Protagonist = Leo, 9 Jahre (include_self); kein Surprise-Character-Block, stattdessen kann Emotion Flow trotzdem laufen (characterMode 'self' → **[CODE: relationshipBlock.ts]** mit SIDEKICK als „neuer Charakter“ mit sidekickSeed-Persönlichkeit).
- **[INLINE: generate-story/index.ts]** Nach dem Einfügen der Emotion-Flow-Blöcke wird **IMAGE PLAN INSTRUCTIONS** durch **[CODE: comicStripPromptBuilder.ts – buildComicStripInstructions]** ersetzt (2×2-Grid, grid_1/grid_2, character_anchor, world_anchor, scene_en pro Panel, Camera-Werte, etc.).
- **[DB: generation_config]** Für 9 Jahre medium: z.B. 400–650 Wörter, scene_image_count = 3; bei Comic Strip wird die Szene-Anzahl im Prompt auf 7 Szenen + Cover umgestellt (8 Panels), und das JSON-Schema im User-Prompt verlangt `image_plan` mit `character_anchor`, `world_anchor`, `grid_1`, `grid_2` statt `scenes`.

Der User-Prompt enthält also:
- Alle Abschnitte wie in Beispiel 2 (inkl. EMOTION FLOW ENGINE mit Arc, Tone, Characters, Elements, Critical Rules).
- Statt „Generate exactly 3 scene(s)…“ den kompletten Comic-Strip-Block (Panel-Positionen, Rollen cover/ending, Camera, scene_en in ENGLISH, CHARACTER ANCHOR RULES, etc.).
- Am Ende wieder respondJson und CRITICAL CONSTRAINT (Wortzahl aus generation_config 8-9 medium) sowie CREATIVE SEED.

---

## TEIL C: Gap-Analyse

### 1. Welche Parameter den LLM-Prompt am stärksten beeinflussen (Impact auf Story-Qualität)

- **Sehr hoch:**  
  - **Emotional Arc (Emotion Flow)** — Bogen, Ton, Überraschungsmoment, Ending-Feeling.  
  - **Alter + language + difficulty** (age_rules, difficulty_rules) — Satzlänge, Wortschatz, Erzählstil.  
  - **Theme + Story Subtype** — Kategorie, Konflikte, Setting-Ideen, prompt_hint.  
  - **CHARACTERS** — ob include_self + welche Co-Stars/Surprise-Seeds; ein Sidekick-Archetyp dominiert aktuell.

- **Hoch:**  
  - **Wortanzahl / Länge** (generation_config) — Struktur und Tiefe.  
  - **Story Elements** (opening, perspective, macguffin, setting_detail, humor, tension, closing) — konkrete Erzähl- und Bild-Vorgaben.  
  - **Guardrails** (content_themes_by_level, content_safety_level) — was erlaubt/verboten ist.

- **Mittel:**  
  - **Creative Seed** (Name-Inspiration, Objekt-Qualität, Setting-Mood) — nur subtil genutzt.  
  - **Tone** (dramatic/comedic/adventurous/gentle/absurd) — Stimmung, aber weniger detailliert als der Arc.

### 2. Größte Lücken in der Parametrisierung

- **Setting/Szene-Tiefe:** Keine dedizierte „Setting-Bibliothek“ (Vulkane, Piratenschiffe, Zauberwald-Varianten) im Prompt. Sie kommt nur indirekt über theme_rules (setting_descriptions), story_subtypes (setting_ideas, title_seeds) und story_elements (setting_detail). Kein reines „Wähle eines von 50 Settings“.
- **Visuelle Bild-Prompt-Entkopplung:** image_plan (character_anchor, world_anchor, scenes/scene_en) wird vom Story-LLM erzeugt; Bildstil (image_styles) und Negative Prompts sind nur für die Bild-Pipeline definiert, fließen aber nicht in die Story-Anweisungen ein — das LLM „weiß“ nicht explizit, welcher Bildstil gewählt wurde.
- **Mehrere Nebencharaktere:** Nur ein Sidekick-Archetyp pro Story; Beziehungs-Liste (selectedCharacters) wird zwar übergeben, aber die Formulierung „One of the co-stars takes on the sidekick role“ reduziert die Nutzung auf einen dominanten Nebencharakter.
- **Serien/Continuity:** episode_summary, continuity_state, visual_style_sheet sind für Episoden 2+ vorgesehen, aber es gibt keine strukturierte „Welt-Bibliothek“ (Orte, wiederkehrende Objekte) außerhalb des continuity_state.

### 3. Was erzeugt die „Szene/Setting“-Tiefe?

- **Direkt:**  
  - **[DB: theme_rules]** — setting_descriptions, sensory_details, plot_templates.  
  - **[DB: story_subtypes]** — prompt_hint_en, setting_ideas (JSONB-Array), title_seeds.  
  - **[DB: story_elements]** — element_type `setting_detail` (content_en).  
  - **[CODE: criticalRules]** — „at least 3 visually distinct settings or moments“.

- **Indirekt:** Arc (emotional beats in unterschiedlichen Kontexten), Tone, Humor/Tension-Elemente.  
- **Nicht zentral:** Eigene Tabellen wie „settings“ oder „locations“ mit vordefinierten Beschreibungen (Vulkane, Piratenschiffe, Zauberwälder) existieren nicht; solche Bilder entstehen aus Kombination von Theme + Subtype + Elements + LLM-Kreativität.

### 4. Statisch vs. dynamisch im finalen Prompt

- **Überwiegend statisch (Templates/Code):**  
  - Gesamter System-Prompt (CORE v2) aus app_settings.  
  - Struktur des User-Prompts (Reihenfolge der Sektionen, SECTION_HEADERS, storytellingRulesBlock-Texte, Critical Rules, Comic-Strip-Anweisungstext).  
  - Formate (JSON-Schema, respondJson, CRITICAL CONSTRAINT-Formulierung).  
  - Creative-Seed-Bau (nur Auswahl aus festen Arrays).

- **Dynamisch (DB/Engine):**  
  - Theme, Subtype, Altersgruppe, Länge → theme_rules, story_subtypes, generation_config, age_rules, difficulty_rules.  
  - Emotion Flow: Blueprint, Tone, Protagonist/Sidekick/Antagonist-Seeds, Story Elements (opening, perspective, macguffin, etc.).  
  - Figuren: include_self, selectedCharacters, Surprise-Seeds.  
  - Guardrails: content_themes_by_level, content_safety_level.  
  - Wortanzahl, Szenenanzahl, Frageanzahl aus generation_config bzw. Request.

Große Teile des sichtbaren Textes kommen aus der **DB** (theme_rules, emotion_blueprints, character_seeds, story_elements, generation_config, age_rules, difficulty_rules, content_themes_by_level); die **Struktur** und viele Formulierungen sind **Code/Templates** (promptBuilder.ts, emotionFlow-Blöcke, generate-story/index.ts, comicStripPromptBuilder.ts).

---

*Ende des Audits. Keine Code-Änderungen; nur Analyse und Dokumentation.*
