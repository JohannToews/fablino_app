# Was fehlt, damit türkische Wörter auf Türkisch erklärt werden?

**Nur Bericht.** Keine Umsetzung.

---

## Bereits vorhanden

| Bereich | Status |
|--------|--------|
| **Backend** | Edge Function `explain-word` hat einen türkischen Prompt (`PROMPTS.tr`). Bei `explanationLanguage: 'tr'` liefert sie türkische Erklärungen. |
| **Classic Reader – Live-Aufruf** | Beim **neuen** Abruf wird `storyLang = story?.text_language` korrekt an `explain-word` übergeben. Wenn die Story `text_language: 'tr'` hat, kommt die Erklärung auf Türkisch. |

---

## Was fehlt

### 1. Immersive Reader: Erklärungssprache kommt vom Profil

- **Wo:** `ImmersiveReader.tsx` → Übergabe an `ImmersiveWordSheet`:  
  `explanationLanguage={kidProfile?.explanation_language || storyLanguage}`
- **Problem:** Wenn das Kind-Profil `explanation_language: 'en'` hat (z. B. weil die App auf Englisch eingestellt war), wird **immer** Englisch an die API geschickt – auch bei türkischen Geschichten.
- **Was fehlt:** Die Erklärungssprache muss an die **Geschichten-Sprache** gekoppelt werden (z. B. immer `storyLanguage` für die Worterklärung nutzen), damit türkische Texte türkische Erklärungen bekommen.

---

### 2. Classic Reader: Cache ignoriert die Sprache

- **Wo:** `ReadingPage.tsx` – `loadCachedExplanations()` und Nutzung von `cachedExplanations` in `handleWordClick` / `handleExplainSelection`.
- **Problem:** Aus `marked_words` werden nur `word` und `explanation` geladen. Es wird **nicht** geprüft, in welcher Sprache die Erklärung gespeichert wurde. Liegt für ein Wort schon eine **englische** Erklärung in der DB (z. B. vom Immersive Reader mit englischem Profil), wird diese angezeigt – ohne erneuten API-Aufruf mit Story-Sprache.
- **Was fehlt:**  
  - Beim **Laden:** `explanation_language` aus `marked_words` lesen und nur Einträge in den Cache aufnehmen, bei denen `explanation_language === story.text_language`.  
  - Beim **Nutzen** des Caches: Erklärung nur anzeigen, wenn sie zur aktuellen Story-Sprache passt (dafür muss der Cache die Sprache pro Wort kennen, z. B. `{ explanation, explanation_language }`).

---

### 3. Classic Reader: Beim Speichern fehlt die Sprache

- **Wo:** `ReadingPage.tsx` – `handleSaveExplanation()`: Insert in `marked_words` nur mit `story_id`, `word`, `explanation`.
- **Problem:** `word_language` und `explanation_language` werden nicht gespeichert. Beim nächsten Laden kann nicht erkannt werden, in welcher Sprache die Erklärung ist – die Filterung aus Punkt 2 ist dann nicht möglich.
- **Was fehlt:** Beim Insert in `marked_words` zusätzlich setzen:  
  `word_language: story?.text_language`,  
  `explanation_language: story?.text_language`.

---

### 4. Story-Metadaten (optional, Datenqualität)

- **Problem:** Hat eine türkische Geschichte fälschlich `text_language: 'en'`, wird auch im Classic Reader bei **neuem** Abruf Englisch angefordert und ggf. gespeichert.
- **Was fehlt:** Sicherstellen, dass türkische Geschichten in der DB `text_language: 'tr'` haben (bei Erstellung, Import, ggf. manuelle Korrektur).

---

## Kurzüberblick

| Nr. | Wo | Was fehlt |
|-----|----|-----------|
| 1 | Immersive Reader | Erklärungssprache an Story-Sprache koppeln (nicht an Profil). |
| 2 | Classic Reader | Cache nur für Erklärungen in Story-Sprache nutzen; dazu `explanation_language` laden und bei der Anzeige prüfen. |
| 3 | Classic Reader | Beim Speichern in `marked_words` `word_language` und `explanation_language` mitschreiben. |
| 4 | Daten | Türkische Geschichten mit `text_language: 'tr'` pflegen. |

**Backend:** Nichts fehlt – Türkisch ist unterstützt. Die Lücken liegen im Frontend (Immersive + Classic) und in der konsistenten Nutzung der Story-Sprache bzw. der Spalten in `marked_words`.
