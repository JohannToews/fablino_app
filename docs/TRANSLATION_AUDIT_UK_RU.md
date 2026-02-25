# RU/UA vs ES (IT, NL) – Übersetzungs-Review

## Kurzfassung

**Beobachtung:** Bei Schulsprache ES, IT oder NL sind alle Story-Wizard-Seiten korrekt in der gewählten Sprache (kein Deutsch). Bei RU und UA bleiben mehrere Seiten teilweise auf Deutsch.

**Ursachen (technisch):**

1. **Sprachquelle ist überall gleich:** Alle Screens nutzen `kidAppLanguage` aus `useKidProfile()` (abgeleitet aus `school_system`). Es gibt keinen anderen Code-Pfad für ES vs RU/UA.
2. **Unterschied liegt bei Daten und Fallbacks:**
   - **ES/IT/NL:** Entweder in allen Komponenten in den lokalen `translations`-Objekten vorhanden **oder** die DB-Tabellen (`image_styles.labels` etc.) enthalten diese Sprachen. Fallback `|| translations.de` wird nicht genutzt.
   - **RU/UA:** Wenn die **Datenbank** für eine Tabelle (z. B. `image_styles`) noch keine `uk`/`ru`-Keys in den JSONB-Spalten hat, greift im Frontend der Fallback `style.labels?.de` → Anzeige auf Deutsch. Zusätzlich deckt die Migration `20260224120000_add_uk_ru_translations.sql` nur 6 von 8 Bildstilen ab (`3d_adventure`, `vintage_retro` fehlen für uk/ru).

3. **SpecialEffectsScreen:** Die Logik bevorzugt `kidAppLanguage`, wenn es `uk` oder `ru` ist; sonst wird die gewählte Story-Sprache (`storyLanguage`) genutzt. Wenn trotzdem Deutsch erscheint, liefert der Kontext für den **aktuell ausgewählten** Kinderprofil vermutlich `kidAppLanguage === 'de'` (z. B. anderes Kind ausgewählt oder Kontext nach Profil-Speichern noch nicht aktualisiert).

---

## Vergleich: Wo kommt die Sprache her?

| Screen / Quelle | ES (funktioniert) | RU/UA (Problem) |
|-----------------|-------------------|------------------|
| **SpecialEffectsScreen** | `translations[uiLang]`, `settingsTranslations[uiLang]` – beide haben `es` | Gleiche Objekte haben `uk`/`ru`. Wenn UI trotzdem DE zeigt → `uiLang` ist dann `de` (Kontext = anderes Profil oder nicht aktualisiert). |
| **ImageStylePicker** | Header/loading: lokales `translations[uiLanguage]` hat `es`. Karten-Labels: `style.labels?.[uiLanguage]` aus DB. | Header hat uk/ru. Karten-Labels: wenn DB keine `uk`/`ru` in `image_styles.labels` hat → Fallback `style.labels?.de` → **Deutsch**. Zusätzlich: Migration fügt uk/ru nur für 6 Stile hinzu; `3d_adventure`, `vintage_retro` fehlen. |
| **CharacterSelectionScreen** | `defaultCharacterMessages[kidAppLanguage]` + ggf. lib/translations | uk/ru in `defaultCharacterMessages` vorhanden. |
| **StoryTypeSelectionScreen** | `defaultFablinoMessages[kidAppLanguage]` | uk/ru vorhanden. |
| **BranchDecisionScreen** | `translations[kidAppLanguage]` | uk/ru vorhanden. |
| **StoryGenerationProgress** | `progressSteps[].label` pro Sprache | uk/ru vorhanden. |

---

## Konkrete Unterschiede (warum ES geht, RU/UA nicht)

1. **DB-Migration nicht angewendet oder unvollständig**  
   - Migration `20260224120000_add_uk_ru_translations.sql` fügt `uk`/`ru` für `image_styles` nur bei 6 `style_key`s hinzu.  
   - `3d_adventure` und `vintage_retro` haben in der Migration **keine** uk/ru-Einträge → in der App erscheinen „3D Abenteuer“ und „Retro“ weiter auf Deutsch, sobald diese Stile angezeigt werden.

2. **Kein clientseitiger Fallback für Bildstil-Labels**  
   - In `ImageStylePicker` steht:  
     `label = style.labels?.[uiLanguage] || style.labels?.de || style.style_key`  
   - Wenn `image_styles.labels` für ein Style kein `uk`/`ru` hat (Migration fehlt oder Stil nicht in Migration), wird immer `de` genommen. Bei ES/IT/NL sind diese Keys oft schon in der DB oder in allen Stilen vorhanden.

3. **Profil-Kontext**  
   - Wenn das **aktuell ausgewählte** Kinderprofil in der App noch `school_system: 'de'` hat (z. B. anderes Kind gewählt oder Speichern ohne erneutes Laden), ist `kidAppLanguage === 'de'` und alle von `kidAppLanguage` abhängigen Texte (inkl. SpecialEffectsScreen, sofern nicht durch `storyLanguage` überschrieben) bleiben Deutsch.

---

## Empfohlene Maßnahmen

1. **ImageStylePicker:** Clientseitigen Fallback für uk/ru ergänzen: feste Map `style_key → { uk, ru }` für alle angezeigten Stile (inkl. `3d_adventure`, `vintage_retro`). Label-Logik:  
   `style.labels?.[uiLanguage] || (Fallback[style.style_key]?.[uiLanguage]) || style.labels?.de || style.style_key`
2. **Migration:** In `20260224120000_add_uk_ru_translations.sql` (oder neuer Migration) uk/ru für `image_styles` bei `3d_adventure` und `vintage_retro` ergänzen, damit die DB konsistent ist.
3. **Profil-Speichern:** Bereits umgesetzt: nach Speichern wird `refreshGlobalProfiles()` aufgerufen, damit `kidAppLanguage` sich aktualisiert. Sicherstellen, dass Nutzer nach Ändern der Schulsprache auf RU/UA ggf. das richtige Kind ausgewählt haben und ein Mal die Seite wechseln oder neu laden, falls der Kontext einmal nicht sofort aktualisiert wurde.

---

## Dateien (Übersetzungen Story-Wizard)

| Datei | uk/ru in lokalem Objekt | Anmerkung |
|-------|-------------------------|-----------|
| SpecialEffectsScreen.tsx | ✅ translations, settingsTranslations | uiLang bevorzugt kidAppLanguage bei uk/ru. |
| ImageStylePicker.tsx | ✅ translations (Header etc.) | Karten-Labels aus DB; Fallback de wenn DB kein uk/ru hat. |
| CharacterSelectionScreen.tsx | ✅ defaultCharacterMessages | |
| StoryTypeSelectionScreen.tsx | ✅ defaultFablinoMessages | |
| BranchDecisionScreen.tsx | ✅ translations | |
| StoryGenerationProgress.tsx | ✅ progressSteps, DID_YOU_KNOW | |

Die Komponenten sind für RU/UA vorbereitet; das Verhalten „alles auf Deutsch“ entsteht durch DB-Fallbacks und ggf. falsches/veraltetes Profil im Kontext.
