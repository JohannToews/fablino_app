# Audit: Emotion-Flow Selectors vs. Seed-Daten

> Nur Analyse, keine Code-Änderungen.
> Ziel: Verstehen warum die Emotion-Flow-Engine null/default-Werte zurückgibt obwohl Seed-Daten vorhanden sind.

---

## Beobachtete Response

```json
{
  "emotion_blueprint_key": null,
  "tone_mode": "adventurous",
  "intensity_level": "medium",
  "character_seed_key": null,
  "sidekick_seed_key": "comic_relief",
  "antagonist_seed_key": null,
  "opening_element_key": "opening_default",
  "perspective_element_key": "perspective_default",
  "used_emotion_flow": true
}
```

**Funktioniert:** `tone_mode`, `intensity_level`, `sidekick_seed_key`  
**Null/Default:** `emotion_blueprint_key`, `character_seed_key`, `opening_element_key`, `perspective_element_key`

---

## Teil 1: Engine-Aufruf in generate-story/index.ts

### Exakter Aufruf (Zeile ~1920–1933):

```typescript
emotionFlowResult = await runEmotionFlowEngine({
  kidProfileId: kidProfileId || 'unknown',
  ageGroup: ageGroupForEngine as '6-7' | '8-9' | '10-11' | '12+',
  theme: resolvedThemeKey,
  characterMode,
  kidProfile: { name: resolvedKidName || 'Child', age: resolvedKidAge || 8 },
  selectedCharacters: (selectedCharacters || []).map((c: any) => ({
    name: c.name,
    relation: c.relation,
    description: c.description,
  })),
  learningTheme: learningThemeApplied || undefined,
  supabase: supabase as any,
});
```

### Parameter-Analyse:

| Parameter | Wie berechnet | Typischer Wert |
|-----------|---------------|----------------|
| `ageGroup` | `resolvedAgeGroup \|\| (resolvedKidAge <= 7 ? '6-7' : ...)` | `"8-9"` — Format stimmt mit DB überein |
| `theme` | `resolvedThemeKey` — aus Request oder themeKeyMapping | `"magic_fantasy"`, `"adventure_action"`, `"real_life"`, `"surprise"` |
| `characterMode` | `surpriseCharactersParam ? 'surprise' : includeSelf ? 'self' : 'family'` | `"family"` bei normaler Story (kein surprise, kein self) |
| `kidProfile` | `{ name, age }` — **kein `appearance`** | `{ name: "Max", age: 8 }` |
| `selectedCharacters` | Array aus Request Body | `[{ name: "Papa", relation: "Vater" }]` |
| `learningTheme` | `learningThemeApplied \|\| undefined` | Meist `undefined` |

### Logging vorhanden:
```
[EmotionFlow] Intensity: medium
[EmotionFlow] Blueprint: none
[EmotionFlow] Tone: adventurous
[EmotionFlow] Characters: { protagonist: null, sidekick: "comic_relief", antagonist: null }
[EmotionFlow] Engine succeeded: { blueprintKey: null, toneMode: "adventurous", ... }
```

---

## Teil 2: Engine Orchestrator (engine.ts)

### Flow:
1. **Intensity** → `selectIntensity(kidProfileId, supabase)` — history-basiert, weighted random
2. **Blueprint** → `selectBlueprint({ kidProfileId, ageGroup, theme, intensity, learningTheme }, supabase)` — try/catch, null bei Fehler
3. **Tone** → `selectTone({ kidProfileId, ageGroup, blueprintCategory }, supabase)` — try/catch, default "gentle"
4. **Characters** → `selectCharacterSeeds({ kidProfileId, ageGroup, theme, characterMode, blueprintCategory }, supabase)` — **throws** bei Fehler
5. **Elements** → `selectStoryElements({ kidProfileId, ageGroup, theme, intensity, tone, blueprintCategory }, supabase)` — **throws** bei Fehler
6. **Prompt Blocks** — arcBlock, toneBlock, characterBlock, elementBlocks, criticalRules

### Was passiert wenn Blueprint null ist?
- Tone: `blueprintCategory` wird als `undefined` übergeben → Tone-Logik funktioniert trotzdem
- Characters: `blueprintCategory` ist `undefined` → Antagonist wird nur bei `social`/`courage` selektiert → **kein Antagonist**
- Elements: `blueprintCategory` ist `undefined` → compatible_categories-Filter greift nicht → **kein Problem**
- **Arc Block: `buildArcBlock` gibt `''` zurück wenn blueprint null** → leerer arcBlock

### Kaskaden-Effekt:
Blueprint null → arcBlock leer → weniger prompt-Inhalt, aber Engine bricht NICHT ab.

---

## Teil 3: Blueprint-Selektor — ⚠️ ROOT CAUSE #1

### Datei: `selectors/blueprintSelector.ts`

### Kritisches Verhalten (Zeile 49):
```typescript
if (intensity === 'light') return null;
```

**Bei Intensity `light` (30% Wahrscheinlichkeit) → Blueprint ist IMMER null.**

### Query:
```typescript
const res = await supabase
  .from('emotion_blueprints')
  .select('*')
  .eq('is_active', true)
  .limit(2000);
```

### Filter (in-code, nicht in Query):
```typescript
candidates = candidates.filter(r =>
  Array.isArray(r.ideal_age_groups) &&
  r.ideal_age_groups.includes(ageGroup) &&           // ← age_group Filter
  (r.compatible_themes == null ||
    r.compatible_themes.includes(theme)) &&           // ← theme Filter
  r.min_intensity != null &&
  intensityAllowed(r.min_intensity, intensity)         // ← intensity Filter
);
```

### DB-Daten vs. Filter-Werte:

| Blueprint | ideal_age_groups | compatible_themes | min_intensity |
|-----------|-----------------|-------------------|---------------|
| overconfidence_and_fall | `['8-9','10-11']` | `['magic_fantasy','adventure_action','real_life','surprise']` | medium |
| fear_to_courage | `['6-7','8-9','10-11']` | alle 4 | medium |
| failure_is_learning | `['6-7','8-9','10-11']` | `['adventure_action','real_life','surprise']` | medium |
| finding_your_voice | `['8-9','10-11']` | `['real_life','magic_fantasy','surprise']` | deep |
| standing_up_for_others | `['8-9','10-11']` | `['real_life','adventure_action','magic_fantasy']` | medium |
| the_outsider | `['8-9','10-11']` | `['real_life','magic_fantasy','surprise']` | deep |
| misunderstanding_resolved | `['6-7','8-9','10-11']` | `['real_life','adventure_action','surprise']` | medium |
| unexpected_friendship | `['6-7','8-9','10-11']` | alle 4 | medium |
| letting_go | `['8-9','10-11']` | `['real_life','magic_fantasy']` | deep |
| first_time | `['6-7','8-9','10-11']` | `['real_life','adventure_action','surprise']` | medium |
| protecting_something_small | `['6-7','8-9','10-11']` | alle 4 | medium |
| doing_the_right_thing | `['8-9','10-11']` | `['real_life','adventure_action','surprise']` | medium |
| walking_in_their_shoes | `['8-9','10-11']` | `['real_life','magic_fantasy','surprise']` | medium |
| the_invisible_helper | `['6-7','8-9','10-11']` | `['real_life','magic_fantasy','surprise']` | medium |
| forgiving | `['8-9','10-11']` | `['real_life','surprise']` | deep |
| chaos_cascade | `['6-7','8-9','10-11']` | alle 4 | **light** |
| the_plan_that_backfires | `['6-7','8-9','10-11']` | alle 4 | **light** |
| role_reversal_comedy | `['6-7','8-9','10-11']` | `['real_life','magic_fantasy','surprise']` | medium |
| discovering_a_hidden_world | `['6-7','8-9','10-11']` | `['magic_fantasy','surprise','adventure_action']` | medium |
| the_impossible_made_possible | `['6-7','8-9','10-11']` | alle 4 | medium |
| nature_speaks | `['6-7','8-9','10-11']` | `['real_life','magic_fantasy']` | medium |

### Analyse für typische Story (ageGroup: `"8-9"`, theme: `"magic_fantasy"`, intensity: `"medium"`):

- **age_group**: `"8-9"` → alle 21 Blueprints haben `"8-9"` in ideal_age_groups ✅
- **theme**: `"magic_fantasy"` → 15 von 21 Blueprints sind kompatibel ✅
- **intensity**: `"medium"` → `intensityAllowed(min, medium)` → min muss `light` oder `medium` sein:
  - Blueprints mit `min_intensity: 'light'` → erlaubt ✅
  - Blueprints mit `min_intensity: 'medium'` → erlaubt ✅
  - Blueprints mit `min_intensity: 'deep'` → **NICHT erlaubt** (deep > medium)
  - 4 Blueprints mit `min_intensity: 'deep'` werden gefiltert: finding_your_voice, the_outsider, letting_go, forgiving

**Ergebnis: ~11 Kandidaten bei `medium` + `magic_fantasy` + `8-9`.**

### ⚠️ Aber: In der beobachteten Response war `emotion_blueprint_key: null` bei `intensity_level: medium`!

Das bedeutet:
1. **Die Query liefert leere Daten zurück** → `allRows` ist `[]`
2. Oder **die History-Exclusion filtert alle raus** (unwahrscheinlich bei 11 Kandidaten und max 5 Exclusions)

### ⚠️ WAHRSCHEINLICHSTE URSACHE: RLS-Problem

Die Edge Function nutzt `supabase` mit dem **Service-Role-Key**. Die RLS-Policies erlauben:
- `SELECT` für `authenticated`
- `ALL` für `service_role`

**Aber:** Die `select('*')` Query hat keinen `eq` auf `kid_profile_id` oder ähnliches. Wenn der Supabase-Client mit dem Service-Role-Key erstellt wird, sollte RLS umgangen werden. **Wenn er aber mit dem anon-Key erstellt wird, UND kein Auth-Header mitgesendet wird, dann greift die `authenticated`-Policy nicht und die Query gibt leer zurück.**

→ **CHECK: Wird `supabase` in der Edge Function mit `service_role` oder `anon` Key erstellt?**

### Alternative Ursache: History-Tabelle existiert nicht

Die Query auf `emotion_blueprint_history` ist in einem try/catch und gibt bei Fehler `[]` zurück. Das ist OK. Aber wenn die **Haupt-Query** auf `emotion_blueprints` fehlschlägt (z.B. Tabelle nicht erstellt, Migration nicht gelaufen), wird `null` zurückgegeben.

---

## Teil 4: Character-Seed-Selektor (Protagonist) — ⚠️ ROOT CAUSE #2

### Datei: `selectors/characterSelector.ts`

### Protagonist wird NUR bei `characterMode === 'surprise'` selektiert:

```typescript
if (characterMode === 'surprise') {
  const creatureType = selectCreatureType(ageGroup, theme);
  let allForCreature = await fetchProtagonistSeeds(supabase, creatureType);
  // ... filter + weighted random
}
```

### Bei `characterMode === 'family'` oder `'self'`:
→ **Protagonist bleibt `null` — BY DESIGN.**

Dies erklärt `character_seed_key: null` in der Response. Bei einer normalen Story mit `includeSelf: false` und `surprise_characters: false` ist `characterMode = 'family'` → kein Protagonist-Seed.

### Protagonist-Query (nur bei `surprise`):
```typescript
const res = await supabase
  .from('character_seeds')
  .select('*')
  .eq('is_active', true)
  .eq('seed_type', 'protagonist_appearance')
  .eq('creature_type', creatureType)
  .limit(200);
```

### DB-Daten:
- 30 Human Protagonists mit `age_range: ARRAY['6-7','8-9','10-11']` (manche nur `['8-9','10-11']`)
- 12 Mythical Protagonists mit `age_range: ARRAY['6-7','8-9','10-11']`
- **Kein `character_mode`-Feld in der DB** — es gibt kein Filtern nach Mode

### Fazit:
- `character_seed_key: null` bei `characterMode: 'family'` → **KORREKT, by Design**
- Bei `surprise` sollte es funktionieren (42 Seeds vorhanden)
- Mögliches RLS-Problem wie bei Blueprints

---

## Teil 5: Element-Selektoren — ⚠️ ROOT CAUSE #3

### Datei: `selectors/elementSelector.ts`

### Die `opening_default` und `perspective_default` sind **Fallback-Konstanten im Code**:

```typescript
export const FALLBACK_OPENING: StoryElement = {
  element_key: 'opening_default',
  element_type: 'opening_style',
  content_en: 'Start the story with an unexpected moment...',
  // ...
};

export const FALLBACK_PERSPECTIVE: StoryElement = {
  element_key: 'perspective_default',
  element_type: 'narrative_perspective',
  content_en: 'Tell the story in third person.',
  // ...
};
```

### Diese werden benutzt wenn die DB-Query keine Ergebnisse liefert:

```typescript
const opening = pick('opening_style', true, FALLBACK_OPENING) ?? FALLBACK_OPENING;
const perspective = pick('narrative_perspective', true, FALLBACK_PERSPECTIVE) ?? FALLBACK_PERSPECTIVE;
```

### Die Haupt-Query:

```typescript
const res = await supabase
  .from('story_elements')
  .select('*')
  .eq('is_active', true)
  .in('element_type', ELEMENT_TYPES)
  .limit(500);
```

### DB-Daten:
- 15 opening_style Elements (alle `is_active: true`)
- 10 narrative_perspective Elements
- 15 macguffin, 15 setting_detail, 15 humor_technique, 10 tension_technique, 10 closing_style
- **Alle haben `age_groups: ARRAY['6-7','8-9','10-11']` oder Subset davon**

### Warum Fallbacks?

**Gleiche Ursache wie Blueprint: Die Query gibt leere Daten zurück.**

Wenn `fetchAllStoryElements()` eine leere Liste zurückgibt → `byType` Map hat leere Arrays für jeden Typ → `selectOneElement()` findet keine Kandidaten → Fallback wird benutzt.

Der try/catch um das ganze `selectStoryElements` fängt den Fall ab:
```typescript
catch {
  return {
    opening: FALLBACK_OPENING,
    perspective: FALLBACK_PERSPECTIVE,
    closing: FALLBACK_CLOSING,
    // ... alle null
  };
}
```

---

## Teil 6: Warum funktioniert der Sidekick?

### Sidekick-Query:
```typescript
const res = await supabase
  .from('character_seeds')
  .select('*')
  .eq('is_active', true)
  .in('seed_type', ['sidekick_archetype', 'antagonist_archetype'])
  .limit(100);
```

### Was macht er anders?

**Nichts Fundamentales.** Die Query ist identisch aufgebaut wie alle anderen.

### ⚠️ WIDERSPRUCH: Wenn RLS das Problem wäre, würde auch der Sidekick-Query fehlschlagen.

**Das heißt: RLS ist wahrscheinlich NICHT das Problem.**

### Genauere Analyse: Was ist WIRKLICH anders?

1. **Sidekick hat einen Fallback-Wert** der IMMER gesetzt wird: `let sidekick: CharacterSeed = FALLBACK_SIDEKICK;`
2. Aber `FALLBACK_SIDEKICK.seed_key` ist `'loyal_skeptic'`, nicht `'comic_relief'`
3. In der Response steht `sidekick_seed_key: "comic_relief"` → **also kam der Sidekick aus der DB!**

### Schlussfolgerung:

**Die `character_seeds`-Tabelle IST erreichbar.** Die Query auf `character_seeds` funktioniert (Sidekick kommt).

Das bedeutet:
- Die DB-Verbindung funktioniert ✅
- RLS ist kein Problem ✅
- Die `character_seeds`-Tabelle hat Daten ✅

### Warum dann `protagonist: null`?

Weil `characterMode === 'family'` → **der Protagonist-Code wird gar nicht ausgeführt.**

Das ist **by Design**, kein Bug.

---

## Teil 7: Warum ist Blueprint null?

### Re-Analyse mit dem Wissen dass DB-Zugriff funktioniert:

Die `emotion_blueprints`-Query SOLLTE funktionieren. Mögliche Ursachen:

1. **`intensity === 'light'`** → `return null` (Zeile 49) — **Passiert in 30% der Fälle**
   - Aber in der Response steht `intensity_level: "medium"` → war NICHT light

2. **Die History-Exclusion filtert alle Kandidaten raus** — unwahrscheinlich bei 21 Blueprints und max 5 Exclusions

3. **Die `emotion_blueprint_history`-Tabelle existiert nicht** → `getLastBlueprintKeys` gibt `[]` zurück → kein Exclusion-Problem

4. **⚠️ Die `emotion_blueprints`-Query gibt tatsächlich leere Daten zurück**

### CHECK: Gibt es die Tabelle? Migration gelaufen?

Die Migrationen sind:
- `20260222_emotion_flow_core_tables.sql` → CREATE TABLE emotion_blueprints
- `20260222_emotion_flow_seed_blueprints.sql` → INSERT 21 rows

**Wenn die Migration `seed_blueprints` nicht gelaufen ist**, hat die Tabelle 0 Rows → Query gibt `[]` zurück → Blueprint ist null.

### ⚠️ WAHRSCHEINLICHSTE URSACHE: **Migrationen wurden nicht auf Supabase deployed.**

Lokal gibt es die Migration-Dateien, aber es ist unklar ob:
1. `supabase db push` oder `supabase migration up` ausgeführt wurde
2. Oder ob die SQL-Dateien manuell im Supabase SQL Editor ausgeführt wurden

---

## Teil 8: Warum sind Elements default?

### Gleiche Ursache:

- `story_elements`-Tabelle existiert (CREATE TABLE in core_tables Migration)
- Aber `20260222_emotion_flow_seed_elements.sql` muss separat deployed werden
- Wenn die Seed-Migration nicht gelaufen ist → 0 Rows → Fallbacks werden benutzt

### Sidekick funktioniert weil:

Die `character_seeds`-Migration (`20260222_emotion_flow_seed_characters.sql`) **WURDE offenbar deployed** — sonst käme kein `comic_relief` zurück.

### ⚠️ Das heißt: Manche Migrationen wurden deployed, andere nicht!

Wahrscheinlich: `seed_characters` ja, `seed_blueprints` und `seed_elements` nein (oder Fehler beim Deployment).

---

## Zusammenfassung: Match/Mismatch pro Selektor

| Selektor | Query | Filter-Werte | DB-Daten | Status | Ursache |
|----------|-------|--------------|----------|--------|---------|
| **Intensity** | `emotion_blueprint_history` | kid_profile_id | History-Rows | ✅ MATCH | Funktioniert (weighted random, Default "medium") |
| **Blueprint** | `emotion_blueprints` `.eq('is_active', true)` | ageGroup, theme, intensity (in-code) | 21 Blueprints (wenn Seed-Migration lief) | ⚠️ MISMATCH | Query gibt leere Daten → **Seed-Migration nicht deployed?** |
| **Tone** | `emotion_blueprint_history` | kid_profile_id | History-Rows | ✅ MATCH | Funktioniert (weighted random, kein DB-Seed nötig) |
| **Protagonist** | `character_seeds` `.eq('seed_type','protagonist_appearance')` | creature_type | 42 Protagonist-Seeds | ⏭️ SKIP | `characterMode === 'family'` → Code läuft nicht → **by Design** |
| **Sidekick** | `character_seeds` `.in('seed_type', [...])` | — | 10 Sidekick-Seeds | ✅ MATCH | Funktioniert (Seeds vorhanden) |
| **Antagonist** | (gleiche Query wie Sidekick) | blueprintCategory | 8 Antagonist-Seeds | ⏭️ SKIP | `blueprintCategory` undefined (Blueprint null) → nur bei social/courage → **by Design** |
| **Opening** | `story_elements` `.eq('is_active', true)` | element_type, age_groups (in-code) | 15 opening_style Elements (wenn Seed-Migration lief) | ⚠️ MISMATCH | Query gibt leere Daten → **Seed-Migration nicht deployed?** |
| **Perspective** | (gleiche Query) | element_type, age_groups (in-code) | 10 perspective Elements | ⚠️ MISMATCH | Gleich |
| **Closing** | (gleiche Query) | element_type | 10 closing Elements | ⚠️ MISMATCH | Gleich |

---

## Nötige Fixes

### 1. ⚠️ KRITISCH: Seed-Migrationen auf Supabase deployen

Folgende SQL-Dateien müssen im Supabase SQL Editor (oder via `supabase db push`) ausgeführt werden:

```
supabase/migrations/20260222_emotion_flow_seed_blueprints.sql   (21 Blueprints)
supabase/migrations/20260222_emotion_flow_seed_elements.sql     (90 Story Elements)
```

**Prüfung:** Im Supabase SQL Editor ausführen:
```sql
SELECT COUNT(*) FROM emotion_blueprints;   -- Erwartet: 21
SELECT COUNT(*) FROM story_elements;       -- Erwartet: 90
SELECT COUNT(*) FROM character_seeds;      -- Erwartet: 60
```

Wenn `emotion_blueprints` = 0 und `story_elements` = 0, aber `character_seeds` = 60 → bestätigt die Hypothese.

### 2. KEIN Bug: `character_seed_key: null` bei `characterMode: 'family'`

Das ist **by Design**. Protagonist-Seeds werden nur bei `surprise` Mode selektiert. Bei `self`/`family` gibt es keinen DB-Protagonist (das Kind selbst oder Familienmitglieder sind die Protagonisten).

**Optional:** Wenn `character_seed_key: null` in der Response verwirrend ist, könnte man es auf `"none_family_mode"` setzen statt null.

### 3. KEIN Bug: `antagonist_seed_key: null`

Antagonisten werden nur bei `blueprintCategory === 'social'` oder `'courage'` selektiert. Wenn Blueprint null ist (weil Seed-Migration fehlt), ist `blueprintCategory` undefined → kein Antagonist.

**Fix**: Wird automatisch gelöst wenn Blueprint-Seeds deployed sind.

### 4. Optional: Logging verbessern

In `blueprintSelector.ts` nach der Query loggen:
```typescript
console.log('[EmotionFlow] Blueprint query result:', allRows.length, 'rows');
console.log('[EmotionFlow] Blueprint candidates after filter:', candidates.length);
```

In `elementSelector.ts`:
```typescript
console.log('[EmotionFlow] Elements query result:', allElements.length, 'elements');
```

### 5. Kein Format-Mismatch

- `ageGroup`: Engine übergibt `"8-9"`, DB hat `["8-9","10-11"]` → Format stimmt ✅
- `theme`: Engine übergibt `"magic_fantasy"`, DB hat `["magic_fantasy",...]` → Format stimmt ✅
- `intensity`: Engine übergibt `"medium"`, DB hat `"medium"` → Format stimmt ✅
- Es gibt **kein** `age_group` vs `age-group` vs `6_7` Mismatch.

---

## Prüf-Reihenfolge

1. **SQL Editor → `SELECT COUNT(*) FROM emotion_blueprints;`** — wenn 0, dann Seed-Migration deployen
2. **SQL Editor → `SELECT COUNT(*) FROM story_elements;`** — wenn 0, dann Seed-Migration deployen
3. Nach Deployment: Story mit Emotion-Flow generieren und Logs prüfen
4. Erwartetes Ergebnis: Blueprint, Opening, Perspective sollten jetzt echte Werte haben
