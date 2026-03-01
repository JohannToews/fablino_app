# Analyse: Warum image_plan manchmal fehlt (JSON-Parse → Fallback)

## Kurzfassung

Das LLM liefert die Story als ein großes JSON-Objekt inkl. `image_plan`. Wenn beim Parsen der LLM-Antwort etwas schiefgeht, landet man im Fallback **ohne** `image_plan` → separater LLM-Call für image_plan, schlechtere Konsistenz.

---

## 1. Wo wird geparst?

- **Eingabe:** Rohe LLM-Antwort (String) von `callLovableAI(…)`.
- **Parser:** `safeParseStoryResponse(raw)` (Zeilen ~45–88).
- **Verwendung:** `story = parsed` (oder geflattetes `parsed.story`); später `imagePlan = story.image_plan`. Fehlt `image_plan` → Fallback-Pfad.

---

## 2. Drei Ursachen, warum image_plan verloren geht

### A) Nested-Response-Flatten (Bug #1)

Wenn das LLM antwortet mit:

```json
{
  "story": { "title": "...", "content": "...", "questions": [], "vocabulary": [] },
  "image_plan": { "character_sheet": [...], "world_anchor": "...", "scenes": [...] }
}
```

dann erkennt der Code „nested“ und setzt:

```ts
story = { ...parsed.story, questions: parsed.questions, vocabulary: parsed.vocabulary, ... };
```

**Es werden nur Felder aus `parsed.story` übernommen.** Top-Level-Felder wie `image_plan`, `branch_options`, `episode_summary`, `continuity_state`, `visual_style_sheet` werden **nicht** auf `story` kopiert → **image_plan geht verloren**.

**Fix:** Beim Flatten alle relevanten Top-Level-Felder von `parsed` auf `story` mitschreiben (z. B. `image_plan`, `branch_options`, `episode_summary`, `continuity_state`, `visual_style_sheet`).

---

### B) Brace-Extraction (Step 3) schneidet ab

Wenn `JSON.parse(cleaned)` fehlschlägt (z. B. trailing comma, unescaped newline), wird versucht:

```ts
const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
```

**Problem:** `lastIndexOf('}')` findet die **letzte** `}` im String. Steht irgendwo **in einem String** eine `}` (z. B. in `content` oder in `scenes[].description`), wird dort abgeschnitten. Das abgeschnittene JSON endet dann vor `image_plan` → Parsing liefert ein Objekt **ohne** `image_plan`.

**Typisch:** Lange Story-Texte oder Szenenbeschreibungen mit `}` (z. B. „Sie öffnete die Tür} und …“) führen zu falschem Slice.

**Mögliche Fixes (später):** Klammer-matching (erstes `{` mit passendem `}`), oder bei fehlendem `image_plan` im geparsten Objekt im Raw-String nach `"image_plan"` suchen und gezielt parsen.

---

### C) Regex-Fallback (Step 4) hat kein image_plan

Wenn auch die Brace-Extraction fehlschlägt, wird nur noch ein Minimal-Objekt gebaut:

```ts
return {
  title: 'Untitled Story',
  content: contentMatch[1].replace(...),
  questions: [],
  vocabulary: [],
};
```

**image_plan (und alles andere außer content/text) existiert hier gar nicht** → immer Fallback.

**Mögliche Erweiterung:** Zusätzlich im Raw-String nach `"image_plan"` suchen und, falls gefunden, ein zweites Mal parsen (z. B. nur den image_plan-Block) und anhängen.

---

## 3. Welche Logs helfen?

- **`[PARSE] Direct JSON.parse failed`** → Step 2 fehlgeschlagen, Step 3 oder 4 wurde genutzt.
- **`[PARSE] Extracted JSON block succeeded`** → Step 3; wenn danach trotzdem „No image_plan“, Verdacht auf falschen Brace-Slice.
- **`[PARSE] Using regex fallback for content field`** → Step 4; image_plan ist in diesem Pfad nie gesetzt.
- **`[GENERATE] Parsed response: ... hasImagePlan: false`** → Nach dem Parsen hat `story` kein `image_plan`.
- **`[generate-story] No image_plan in LLM response, using fallback`** → Bestätigung, dass der Fallback-Pfad läuft.

Für Mateos letzte Story: In den Supabase-Logs nach diesen Zeilen suchen; dann sieht man, ob (A) Nested ohne image_plan-Kopie, (B) Step 3 mit Abschneiden, oder (C) Step 4 war.

---

## 4. Umgesetzte Fixes (Code)

- **Nested-Flatten:** Beim Flatten werden jetzt `image_plan`, `branch_options`, `episode_summary`, `continuity_state`, `visual_style_sheet` von `parsed` auf `story` übernommen.
- **Parse-Pfad-Log:** Beim erfolgreichen Parsen wird geloggt, welcher Step verwendet wurde (Step 2 / 3), damit man in den Logs sofort sieht, ob Brace-Extraction im Spiel war.
