# Audit: 6.2c Character Seed in Bild-Pipelines — Verifikation

**Nur Analyse, keine Code-Änderungen.**

---

## Kontext

Task 6.2c injiziert `appearance_en` aus dem Emotion-Flow Character Seed in beide Bild-Pipelines (alte Pipeline + Comic-Strip), damit der Protagonist visuell konsistent dargestellt wird.

---

## Code-Flow: characterMode

**Stelle:** `generate-story/index.ts` ca. Zeile 1911–1915

```ts
const characterMode = surpriseCharactersParam
  ? 'surprise' as const
  : includeSelf
    ? 'self' as const
    : 'family' as const;
```

- **surprise_characters === true** → `characterMode = 'surprise'`
- **surprise_characters === false und includeSelf === true** → `characterMode = 'self'`
- **surprise_characters === false und includeSelf === false** → `characterMode = 'family'`

---

## Code-Flow: Wann wird ein Protagonist-Seed geholt?

**Stelle:** `supabase/functions/_shared/emotionFlow/selectors/characterSelector.ts` Zeile 257–281

Ein Protagonist-Seed aus der DB wird **nur** gesetzt, wenn `characterMode === 'surprise'`:

```ts
if (characterMode === 'surprise') {
  const creatureType = selectCreatureType(ageGroup, theme);
  let allForCreature = await fetchProtagonistSeeds(supabase, creatureType);
  // ... Filter, Gewichtung ...
  if (candidates.length > 0) {
    const weights = candidates.map((s) => s.weight);
    protagonist = weightedRandom(candidates, weights);
  }
}
// Sonst: protagonist bleibt null
```

Für `characterMode === 'self'` oder `'family'` wird **kein** Protagonist-Seed aus der DB geholt; `protagonist` bleibt `null`.  
→ `emotionFlowResult.protagonistSeed` ist nur bei **Surprise** gesetzt.

---

## Code-Flow: Wo wird appearance_en in die Image-Prompts eingebaut?

### Entscheidung: Seed vs. LLM character_anchor

**Alte Pipeline (non-Comic):** `generate-story/index.ts` ca. 2644–2647

```ts
if (emotionFlowResult?.protagonistSeed?.appearance_en && imagePlan) {
  console.log('[EmotionFlow] Injecting character seed into imagePlan.character_anchor');
  imagePlan.character_anchor = emotionFlowResult.protagonistSeed.appearance_en;
}
```

- Wenn ein Protagonist-Seed mit `appearance_en` existiert → **Überschreibung** von `imagePlan.character_anchor` (vorher vom LLM).
- Wenn `emotionFlowResult` null oder ohne `protagonistSeed.appearance_en` → keine Änderung; `character_anchor` bleibt der LLM-Wert.

**Comic-Strip:** zwei Stellen im gleichen Block (nach `parseComicStripPlan`):

1. **comicPlan.characterAnchor setzen** (ca. 2970–2973):

```ts
if (emotionFlowResult?.protagonistSeed?.appearance_en && comicPlan) {
  comicPlan.characterAnchor = emotionFlowResult.protagonistSeed.appearance_en;
  console.log('[EmotionFlow] Injected character seed into comicPlan');
}
```

2. **buildComicStripImagePrompt** (ca. 2993):

```ts
characterSeedAppearance: emotionFlowResult?.protagonistSeed?.appearance_en,
```

Im Builder (`comicStripPromptBuilder.ts` 88–91) gilt:

```ts
const characterAnchor =
  characterSeedAppearance != null && characterSeedAppearance.trim() !== ''
    ? characterSeedAppearance.trim()
    : (plan.characterAnchor ?? '').trim();
```

→ Seed hat Vorrang vor `plan.characterAnchor`; sonst wird der (ggf. bereits aus `imagePlan.character_anchor` übernommene) Plan-Wert genutzt.

### Variable für die finale Charakter-Beschreibung

- **Alte Pipeline:** `imagePlan.character_anchor`. Wird nach der optionalen Seed-Injection von `buildImagePrompts(imagePlan, ...)` verwendet.
- **imagePromptBuilder.ts:** Cover und jede Szene nutzen `imagePlan.character_anchor` (Zeile 251, 274):  
  `Characters: ${imagePlan.character_anchor}`.
- **Comic-Strip:** Die finale Beschreibung ist die lokale Variable `characterAnchor` in `buildComicStripImagePrompt` (Seed oder `plan.characterAnchor`), pro Panel als `Character details: ${characterAnchor}` (Zeile 114).

### Dopplung Seed + LLM?

Nein. Es wird **entweder** der Seed **oder** der LLM-`character_anchor` verwendet:

- Alte Pipeline: Seed **ersetzt** `imagePlan.character_anchor` vor dem Aufruf von `buildImagePrompts`; danach gibt es nur eine Quelle.
- Comic-Strip: `characterAnchor = characterSeedAppearance ?? plan.characterAnchor` — nur eine der beiden Quellen wird genutzt.

---

## Fall 1: Wizard → Typ-Auswahl „Personen“ → „Ich“

- `includeSelf: true`, `surprise_characters: false`, `selectedCharacters: []` oder Kind-Profil

| Frage | Antwort |
|-------|--------|
| **characterMode** | `'self'` (weil `!surpriseCharactersParam` und `includeSelf === true`) |
| **Protagonist-Seed aus DB?** | **Nein.** Im `characterSelector` wird ein Protagonist nur bei `characterMode === 'surprise'` gesetzt (Zeile 257). Bei `'self'` bleibt `protagonist === null`. |
| **appearance_en im Image-Prompt?** | **Nein.** `emotionFlowResult.protagonistSeed` ist undefined → die Bedingungen `emotionFlowResult?.protagonistSeed?.appearance_en` sind falsch → keine Injection. `imagePlan.character_anchor` bleibt der vom LLM generierte Wert (z. B. Beschreibung des Kindes aus dem Profil). |
| **Finaler Image-Prompt (Auszug)** | Enthält den **LLM-character_anchor** (z. B. „Child, 8, …“). Erste Zeilen typisch: `Children book cover illustration.\nCharacters: <LLM character_anchor>...` |

---

## Fall 2: Wizard → Typ = Surprise, Personen = Surprise

- `includeSelf: false`, `surprise_characters: true`, `selectedCharacters: []`

| Frage | Antwort |
|-------|--------|
| **characterMode** | `'surprise'` |
| **Protagonist-Seed aus DB?** | **Ja.** `characterSelector.ts` Zeile 257–281: bei `characterMode === 'surprise'` werden Kandidaten aus `fetchProtagonistSeeds` gefiltert und per `weightedRandom` ein `protagonist` (CharacterSeed mit `appearance_en`) gewählt. |
| **appearance_en des Seeds** | Kommt aus der gewählten Zeile in `character_seeds` (Feld `appearance_en`), z. B. „A boy with short curly hair, light brown skin, wearing a green t-shirt“. |
| **Exakte Stelle: appearance_en in Image-Prompts** | 1) **Alte Pipeline:** Vor `buildImagePrompts`: `imagePlan.character_anchor = emotionFlowResult.protagonistSeed.appearance_en` (index.ts 2646). 2) **Comic-Strip:** `comicPlan.characterAnchor = emotionFlowResult.protagonistSeed.appearance_en` (2971) und `characterSeedAppearance: emotionFlowResult?.protagonistSeed?.appearance_en` (2993); im Builder wird daraus `characterAnchor` und pro Panel „Character details: <characterAnchor>“. |
| **Finaler Image-Prompt (Cover / erste ~500 Zeichen)** | Enthält die **Seed-Appearance**: z. B. `Children book cover illustration.\nCharacters: <appearance_en aus Seed>...` (imagePromptBuilder 251). |
| **Scene-1, Scene-2, Scene-3** | **Ja**, dieselbe Logik. `buildImagePrompts` verwendet für Cover und alle Szenen dasselbe `imagePlan.character_anchor` (Zeile 251 + 274). Nach der Injection ist das der Seed-Text → alle vier Prompts (Cover + 3 Szenen) enthalten die Seed-Appearance. |

---

## Fall 3: Ohne Wizard → Freitext „Eine Schildkröte will fliegen lernen“

- `includeSelf: false`, `surprise_characters: false` (oder undefined), `selectedCharacters: []`, `description: "Eine Schildkröte will fliegen lernen"`

| Frage | Antwort |
|-------|--------|
| **characterMode** | `'family'` (weil weder Surprise noch includeSelf). |
| **Protagonist-Seed aus DB?** | **Nein.** Bei `characterMode === 'family'` wird im `characterSelector` kein Protagonist gesetzt; `protagonist` bleibt null. |
| **character_anchor vom LLM / Seed dazwischen?** | Der **character_anchor kommt vom LLM** (z. B. Schildkröte als Protagonist). Es wird **kein** Seed dazwischengefunkt: `emotionFlowResult?.protagonistSeed?.appearance_en` ist undefined → keine Überschreibung von `imagePlan.character_anchor`. Bilder nutzen die LLM-Beschreibung. |

---

## Zusammenfassung pro Fall

| Fall | characterMode | Protagonist-Seed | appearance_en injiziert? | Wo | Image-Prompt-Auszug (erste ~300 Zeichen) |
|------|----------------|------------------|---------------------------|-----|------------------------------------------|
| **1** (Ich) | `self` | Nein | Nein | — | LLM-Character-Anchor (z. B. Kind-Beschreibung) |
| **2** (Surprise) | `surprise` | Ja (DB) | Ja | imagePlan.character_anchor + comicPlan.characterAnchor + characterSeedAppearance | Seed-Appearance in Cover und allen Szenen/Comic-Panels |
| **3** (Freitext) | `family` | Nein | Nein | — | LLM-Character-Anchor (z. B. Schildkröte) |

---

## Fazit

- **Funktioniert 6.2c korrekt?** **Ja**, unter der bestehenden Logik.
  - **Surprise-Mode:** Ein Protagonist-Seed wird nur bei `characterMode === 'surprise'` geladen. Dann wird `appearance_en` in **beide** Pipelines injiziert (alte Pipeline über `imagePlan.character_anchor`, Comic über `comicPlan.characterAnchor` und `characterSeedAppearance`). Cover und alle Szenen/Comic-Panels nutzen dieselbe Seed-Beschreibung; keine Dopplung mit dem LLM-Anchor.
  - **Nicht-Surprise („Ich“ oder Freitext):** Kein Protagonist-Seed → keine Injection; der LLM-`character_anchor` bleibt unverändert, wie gewünscht.

- **Lücken / Hinweise:**
  - Bei **„Ich“** (Fall 1) kommt die Konsistenz der Figur nur aus dem Story-Prompt (z. B. Relationship-Block mit Kind-Profil), nicht aus einem DB-Seed. Das ist konsistent mit der aktuellen Architektur (Seed nur bei Surprise).
  - Bei **Freitext** (Fall 3) entscheidet das LLM über die Figur (z. B. Schildkröte); 6.2c ändert daran nichts und soll es laut Task nicht.
