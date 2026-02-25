# Fablino Beta Robustness Audit

> Systematische Prüfung aller Eingaben, Flows und Datenabhängigkeiten auf Absturzrisiken, Inkonsistenzen und fehlende Validierungen — für 15+ Beta-Familien.
> Kontext: Architecture.md, data_model.md. Scope: Frontend, Edge Functions, Datenbank.

---

## Zusammenfassungstabelle

| # | Bereich | Problem | Schwere | Status | Fix |
|---|---------|---------|---------|--------|-----|
| 1 | Kid Profile | `age` null/undefined → promptBuilder `ageForRules` = NaN, DB-Query liefert keine Rules | 🔴 | GEFIXT | promptBuilder: robustes ageForRules (Number-Check, Fallback 6) |
| 2 | Kid Profile | Name: keine maxLength/Trim → sehr lange Namen in Prompts (Token-Risiko) | 🟡 | OFFEN | KidProfileSection: maxLength z.B. 80, trim vor Save |
| 3 | Kid Profile | Alter 4–5 erlaubt im UI; age_rules starten bei 6 — Backend mappt auf 6-7 (resolveAgeGroup) | 🟢 | OK | Kein Fix nötig; Fallback in promptBuilder (ageForRules ≥ 6) |
| 4 | Kid Profile | Gender leer möglich; wird für Pronomen/Personalisierung genutzt — Fallback vorhanden | 🟢 | OK | — |
| 5 | Kid Profile | school_system unbekannt → getKidLanguage Fallback 'fr' | 🟢 | OK | — |
| 6 | Kid Profile | content_safety_level / difficulty_level: keine Frontend-Min/Max-Validierung | 🟡 | OFFEN | Slider/Select min/max oder Clamp in useKidProfile |
| 7 | Kid Profile | story_languages leer: Wizard verhindert Deselektion der letzten Sprache | 🟢 | OK | — |
| 8 | Kid Profile | home_languages null/leer: wird an wenigen Stellen genutzt; Fallbacks vorhanden | 🟢 | OK | — |
| 9 | Story Wizard | Screen 0 (Entry): Kein Kid-Profil → ProtectedRoute leitet zu /onboarding/child | 🟢 | OK | — |
| 10 | Story Wizard | Screen 1 (Story Type): Kein Theme bei Weg B → User kann trotzdem weiter; description wird leer | 🟡 | OFFEN | Pflichtfeld prüfen oder Hinweis |
| 11 | Story Wizard | Screen 2 (Characters): Kein Character → möglich; promptBuilder handhabt leere Liste | 🟢 | OK | — |
| 12 | Story Wizard | Screen 3 (Effects): parent_prompt_text unbegrenzt → Token/Injection-Risiko | 🟡 | OFFEN | maxLength z.B. 500, ggf. Sanitize |
| 13 | Story Wizard | Screen 4 (Image Style): image_styles leer für Altersgruppe → leeres Grid, selectedKey null | 🟡 | OFFEN | Empty State + Fallback-Style oder Block "Weiter" |
| 14 | Story Wizard | Doppelklick "Story erstellen": isGeneratingRef verhindert doppelte Invoke | 🟢 | OK | — |
| 15 | Story Wizard | Tab schließen während Generation: Kein Pre-Insert mit status 'generating'; Story nur bei Erfolg gespeichert | 🟢 | OK | — |
| 16 | generate-story | LLM-Fehler/Timeout: Response mit error + status 429/402/500; Frontend zeigt Toast, kein DB-Orphan | 🟢 | OK | — |
| 17 | generate-story | Ungültiges JSON vom LLM: wird geworfen, gefangen im catch → error Response | 🟢 | OK | — |
| 18 | generate-story | Alle Bilder fehlgeschlagen: Story wird mit cover_image_url null gespeichert; Frontend handhabt null | 🟢 | OK | — |
| 19 | generate-story | Word-Count-Retry: begrenzte Retries; kein Endlosschleifen-Risiko | 🟢 | OK | — |
| 20 | generate-story | DB-Insert nur im Frontend nach Erfolg; bei Fehler keine Story-Zeile → kein Orphan | 🟢 | OK | — |
| 21 | Reading | Story-ID ungültig/nicht gefunden: loadStory setzt story=null, toast, navigate; ein Render mit story=null möglich → Crash-Risiko | 🔴 | GEFIXT | ReadingPage: Guard "if (!story) return <Navigate to=\"/stories\" replace />" |
| 22 | Reading | content null (z.B. generation_status=error): renderFormattedText hat "if (!story) return null"; story.content undefined könnte Fehler werfen | 🟡 | OFFEN | Optional: story.content ?? '' in renderFormattedText |
| 23 | Reading | explain-word Fehlschlag: Loading/Timeout — prüfen ob Toast/Retry angezeigt | 🟡 | OFFEN | — |
| 24 | Reading | TTS/ElevenLabs nicht erreichbar: Fehlerbehandlung prüfen | 🟡 | OFFEN | — |
| 25 | Reading | Quiz bei 0 Comprehension Questions: Button-Logik prüfen (hasQuestions) | 🟢 | OK | — |
| 26 | Gamification | user_progress: log_activity legt Zeile per INSERT ON CONFLICT DO NOTHING an | 🟢 | OK | — |
| 27 | Gamification | get_results_page: ungültiges p_child_id → RAISE EXCEPTION; Frontend muss Fehler abfangen | 🟡 | OFFEN | useResultsPage: error state anzeigen |
| 28 | Gamification | useResultsPage Interface vs. RPC Response: fehlende Felder können zu undefined führen | 🟡 | OFFEN | Typen an RPC anpassen / Defaults |
| 29 | Auth | Keine serverseitige Session-Validierung (Token nach Login nicht verifiziert) | 🟡 | OFFEN | Edge Functions: JWT prüfen; für Beta mind. dokumentieren |
| 30 | Auth | sessionStorage: bei Tab-Close gelöscht; PWA-Verhalten prüfen | 🟡 | OFFEN | — |
| 31 | Auth | RLS: Stories/Kid Profiles nach user_id gefiltert; Admin-Routen nur UI-Check | 🟡 | OFFEN | Admin-Edge-Functions mit Rollen-Check |
| 32 | Rule Tables | ES, NL, IT, BS ohne age_rules/difficulty_rules: promptBuilder Fallback en → de → hardcoded | 🟢 | OK | — |
| 33 | Rule Tables | Age-Group-Mapping: generate-story resolveAgeGroup 6-7/8-9/10-11; generation_config gleiche Gruppen | 🟢 | OK | — |
| 34 | UI | Story Library leer: Empty State prüfen | 🟡 | OFFEN | — |
| 35 | UI | Vocabulary/Quiz/Results leer: Empty States prüfen | 🟡 | OFFEN | — |
| 36 | UI | Loading States: Story-Generation, TTS, explain-word, Quiz — vorhanden | 🟢 | OK | — |
| 37 | DB | Cascading Deletes: kid_profile löschen → prüfen ob stories, user_progress etc. mitgelöscht/Referenzen | 🟡 | OFFEN | Migration prüfen |
| 38 | DB | stories.kid_profile_id nullable (Legacy): Queries mit null handhaben | 🟢 | OK | — |
| 39 | Beta | Onboarding: Erster Login → ProtectedRoute ohne Profil → /onboarding/child | 🟢 | OK | — |
| 40 | Beta | Multi-Kind: Daten strikt pro kid_profile; Series pro Kind getrennt | 🟢 | OK | — |

---

## Priorisierung für Beta-Launch

- **🔴 KRITISCH**: Muss VOR Beta gefixt werden (App crasht / Daten gehen verloren) — **behoben: #1, #21**
- **🟡 WICHTIG**: Sollte gefixt werden (schlechte UX, Verwirrung für Tester)
- **🟢 NICE-TO-HAVE**: Kann nach Beta gefixt werden

---

## Durchgeführte Fixes (🔴)

1. **promptBuilder.ts**  
   `ageForRules` wurde mit `request.kid_profile.age` berechnet; bei `null`/`undefined` wurde `Math.max(undefined, 6)` zu `NaN`, die DB-Abfrage lieferte keine Rules.  
   **Fix**: Robuste Berechnung: `rawAge` aus `request.kid_profile?.age`, numerischer Check, Fallback 6, dann `Math.max(ageNum, 6)`.

2. **ReadingPage.tsx**  
   Nach fehlgeschlagenem loadStory (ungültige ID) wurden `story=null` und `isLoading=false` gesetzt; beim nächsten Render wurde der Classic-Mode mit `story=null` gerendert, was zu Zugriffen auf `story.content`/`story.title` und damit zu Abstürzen führen konnte.  
   **Fix**: Nach dem Loading-Check: `if (!story) return <Navigate to="/stories" replace />;`, damit nie Inhalt mit `story === null` gerendert wird.

---

## Offene 🟡 Empfehlungen (TODOs / Issues)

- Kid name: maxLength + trim (KidProfileSection).
- content_safety_level / difficulty_level: Frontend-Validierung (min/max).
- Story Type Pflichtfeld / Image Style Empty State / parent_prompt_text maxLength.
- Reading: story.content null-Guard in renderFormattedText; explain-word/TTS Fehlerfeedback.
- Results: get_results_page Fehlerbehandlung + Interface/RPC-Abgleich.
- Auth: Token-Verifizierung in Edge Functions; Admin server-seitig absichern.
- DB: Cascading Deletes bei kid_profile prüfen.
- UI: Empty States für Library, Vocabulary, Quiz, Results.
