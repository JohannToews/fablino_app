# Bericht: Englische Worterklärungen bei türkischen Texten (Classic Reader)

**Datum:** 2025-03-01  
**Problem:** In türkischen Geschichten werden im **Classic Reader** Worterklärungen auf Englisch angezeigt (z. B. „tanıdık“ → „Someone you know or have seen before“ statt türkischer Erklärung).  
**Auftrag:** Analyse und Fix-Empfehlung; **kein Fix ausführen**.  
**Fokus:** Classic Reader (ReadingPage), nicht Immersive Reader.

---

## 1. Kurzfassung

**Ursache:** Im **Classic Reader** werden beim Tippen auf ein Wort zuerst **gespeicherte Erklärungen** aus der Tabelle `marked_words` geladen (Cache). Es wird **nicht** geprüft, in welcher Sprache diese Erklärungen abgespeichert wurden. Wurde ein Wort früher mit englischer Erklärung gespeichert (z. B. im Immersive Reader bei Profil mit `explanation_language: 'en'` oder bei falscher Story-Sprache), zeigt der Classic Reader diese englische Erklärung an – auch bei einer türkischen Geschichte.

**Live-Aufruf:** Der Classic Reader übergibt an `explain-word` korrekt die Story-Sprache (`storyLang = story?.text_language`). Das Backend hat einen türkischen Prompt. Das Problem entsteht durch **Wiederverwendung von Cache-Einträgen** in der falschen Sprache.

---

## 2. Ablauf im Classic Reader (ReadingPage)

1. **Beim Öffnen der Geschichte:**  
   `loadCachedExplanations()` lädt aus `marked_words` für die aktuelle Story **nur** `word` und `explanation` (Zeilen 1423–1426). Die Spalte `explanation_language` wird **nicht** gelesen und **nicht** berücksichtigt.

2. **Beim Tippen auf ein Wort** (`handleWordClick` / `handleExplainSelection`):  
   - Zuerst wird geprüft, ob das Wort in `cachedExplanations` liegt (Zeilen 1611–1619 bzw. 1537–1545).  
   - Wenn **ja**: Die gecachte Erklärung wird angezeigt, **ohne** API-Aufruf. Es wird **nicht** geprüft, ob die gespeicherte Erklärung in der Sprache der aktuellen Geschichte ist.  
   - Wenn **nein**: `fetchExplanation(cleanWord)` wird aufgerufen mit `storyLang = story?.text_language || 'fr'` und übergibt `language: storyLang`, `explanationLanguage: storyLang` (Zeilen 1444–1447) – also korrekt.

3. **Beim Speichern** (`handleSaveExplanation`, Zeilen 1649–1658):  
   Es werden nur `story_id`, `word` und `explanation` in `marked_words` geschrieben. **Nicht** gespeichert werden `word_language` und `explanation_language`. Dadurch kann später beim Laden nicht unterschieden werden, in welcher Sprache die Erklärung abgelegt wurde.

**Folge:** Enthält `marked_words` für dieselbe Story bereits Einträge mit englischer Erklärung (z. B. von einer früheren Nutzung im Immersive Reader mit englischem Profil), werden diese im Classic Reader ungefiltert angezeigt – auch wenn die Geschichte türkisch ist.

---

## 3. Warum können englische Erklärungen in `marked_words` stehen?

| Herkunft | Erklärung |
|----------|-----------|
| **Immersive Reader** | Dort wird `explanationLanguage` aus dem Kind-Profil gesetzt (`kidProfile?.explanation_language || storyLanguage`). Ist das Profil auf Englisch, werden Erklärungen auf Englisch angefordert und beim Speichern mit `explanation_language: 'en'` in `marked_words` geschrieben (ImmersiveWordSheet speichert `word_language` und `explanation_language`). |
| **Classic Reader (älterer Stand)** | Beim Speichern werden `word_language` und `explanation_language` nicht gesetzt. Bestehende Einträge können trotzdem englisch sein, wenn zum Zeitpunkt des Speicherns `story.text_language` falsch war oder die Story später geändert wurde. |
| **Falsche Story-Metadaten** | Ist `story.text_language` für eine türkische Geschichte fälschlich `'en'`, liefert auch der Live-Aufruf im Classic Reader englische Erklärungen und speichert sie (ohne Sprachinfo). |

---

## 4. Backend

Die Edge Function `explain-word` hat einen **türkischen** Prompt (`PROMPTS.tr`). Bei Übergabe von `explanationLanguage: 'tr'` liefert sie türkische Erklärungen. Das Backend ist für Türkisch in Ordnung; das Problem liegt im Frontend (Cache-Nutzung und ggf. Story-Sprache).

---

## 5. Fix-Empfehlungen (nur Empfehlung, nicht umgesetzt)

### Option A (empfohlen): Cache nur nutzen, wenn Erklärung in Story-Sprache ist

- **Wo:** `src/pages/ReadingPage.tsx`
- **Änderung 1 – Laden:**  
  In `loadCachedExplanations` zusätzlich `explanation_language` aus `marked_words` lesen. Nur Einträge in den Cache (z. B. `cachedExplanations`) aufnehmen, bei denen `explanation_language === story?.text_language`.  
  Dafür muss beim Aufruf von `loadCachedExplanations` die Story bereits geladen sein (z. B. `loadCachedExplanations` erst ausführen, wenn `story` verfügbar ist, oder Abhängigkeit von `story?.text_language` und ggf. erneutes Laden, wenn sich die Story ändert).
- **Änderung 2 – Anzeige:**  
  Beim Prüfen des Caches (in `handleWordClick` / `handleExplainSelection`): Cache nur verwenden, wenn die gespeicherte Erklärung zur aktuellen Story-Sprache passt. Dazu muss der Cache die Sprache pro Wort mitführen (z. B. `Map<word, { explanation, explanation_language }>` statt `Map<word, explanation>`).
- **Effekt:** Erklärungen, die in einer anderen Sprache gespeichert wurden, werden im Classic Reader nicht mehr angezeigt; stattdessen wird erneut `explain-word` mit der Story-Sprache aufgerufen.

### Option B: Beim Speichern im Classic Reader Sprache mitschreiben

- **Wo:** `ReadingPage.tsx`, `handleSaveExplanation` (Zeilen 1653–1658).
- **Änderung:** Beim Insert in `marked_words` zusätzlich setzen:  
  `word_language: story?.text_language`,  
  `explanation_language: story?.text_language`.  
  (Schema von `marked_words` enthält diese Spalten.)
- **Effekt:** Neue Einträge sind sprachlich zugeordnet. Zusammen mit Option A kann der Cache beim Laden nach `explanation_language` filtern; bestehende Einträge ohne Sprachangabe können als „Sprache unbekannt“ behandelt werden (z. B. nur nutzen, wenn keine Sprachprüfung möglich, oder nicht nutzen und immer neu fetchen).

### Option C: Story-Sprache prüfen (Datenqualität)

- Sicherstellen, dass türkische Geschichten in der DB `text_language: 'tr'` haben.  
- Wenn Stories importiert oder erzeugt werden, die Sprache aus Inhalt oder Kontext setzen bzw. korrigieren.  
- Verhindert falsche **neuen** Erklärungen und Speicherungen; behebt nicht die bereits in `marked_words` liegenden englischen Einträge.

### Option D: Kombination (pragmatisch)

- **Option A** umsetzen (Cache nur nutzen, wenn `explanation_language === story.text_language`; Cache-Struktur ggf. um `explanation_language` pro Wort erweitern).  
- **Option B** umsetzen (beim Speichern im Classic Reader `word_language` und `explanation_language` setzen).  
- Optional **Option C** (Story-Metadaten und ggf. Import/Erstellung prüfen).

---

## 6. Technische Details (Classic Reader)

| Stelle | Datei / Zeilen | Aktuelles Verhalten |
|--------|----------------|----------------------|
| Cache laden | ReadingPage.tsx, 1422–1439 | `marked_words` für story_id, nur `word`, `explanation`; keine Filterung nach Sprache. |
| Cache nutzen | 1611–1619, 1537–1545 | Wenn Wort im Cache → Anzeige ohne API; keine Prüfung der Erklärungssprache. |
| Live-Aufruf | 1441–1463 | `storyLang = story?.text_language || 'fr'`, wird korrekt an `explain-word` übergeben. |
| Speichern | 1649–1658 | Insert nur `story_id`, `word`, `explanation`; keine `word_language` / `explanation_language`. |

---

## 7. Zusammenfassung

| Punkt | Befund |
|-------|--------|
| **Symptom** | Im **Classic Reader** werden türkische Wörter (z. B. „tanıdık“) mit englischer Erklärung angezeigt. |
| **Ursache** | Gespeicherte Erklärungen aus `marked_words` werden ohne Prüfung der Erklärungssprache aus dem Cache angezeigt. Enthalten die Einträge englische Erklärungen (z. B. vom Immersive Reader mit englischem Profil), erscheinen diese auch bei türkischen Geschichten. |
| **Live-Aufruf** | Im Classic Reader wird die Story-Sprache korrekt an `explain-word` übergeben; das Backend unterstützt Türkisch. |
| **Empfohlener Fix** | Cache beim **Laden** und **Nutzen** an `explanation_language` bzw. Story-Sprache koppeln (Option A); beim **Speichern** im Classic Reader `word_language` und `explanation_language` mitschreiben (Option B). |

---

*Nur Bericht; keine Code-Änderungen durchgeführt.*
