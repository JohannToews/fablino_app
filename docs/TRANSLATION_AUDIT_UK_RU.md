# Fablino Translation Audit — UK/RU (Ukrainisch & Russisch)

> Systematische Prüfung fehlender uk/ru-Übersetzungen. Kontext: Architecture.md, data_model.md.

---

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| Geprüfte Dateien | 25+ (Story Wizard, Pages, Components) |
| Gefundene Probleme | 8 |
| Davon fehlende uk/ru Keys (Inline-Objekte) | 7 |
| Davon DB-Übersetzungen (image_styles.labels etc.) | 1 (empfohlen) |
| Behobene Fixes in diesem Durchgang | 7 |

---

## Übersetzungssystem (Kurz)

- **`src/lib/translations/`**: Pro-Sprache-Dateien (de, fr, en, es, nl, it, bs, uk, ru, …). Typ `Translations` erzwingt alle Keys; uk.ts und ru.ts sind vollständig.
- **`useKidProfile`**: `kidAppLanguage` kommt aus `school_system` / `ui_language`; `getKidLanguage` und `toKidLanguage` unterstützen `uk` und `ru`.
- **Story Wizard**: Viele Screens nutzen **lokale** `Record<string, T>`-Objekte (z. B. `translations`, `settingsTranslations`, `defaultFablinoMessages`). Diese hatten teils nur de/fr/en/es/nl/it/bs und keine uk/ru.

---

## Detail-Tabelle (gefundene & behobene Stellen)

| # | Datei | Bereich | Problem-Typ | Fix |
|---|-------|---------|-------------|-----|
| 1 | SpecialEffectsScreen.tsx | `translations` (Header, Placeholder, Buttons, Effekte) | uk/ru fehlten | uk + ru Einträge ergänzt |
| 2 | SpecialEffectsScreen.tsx | `settingsTranslations` (Länge, Schwierigkeit, Serie, Sprache) | uk/ru fehlten | uk + ru Einträge ergänzt |
| 3 | ImageStylePicker.tsx | `translations` (header, recommended, loading) | uk/ru fehlten | uk + ru ergänzt (bzw. bereits vorhanden, Fallback-Labels ergänzt) |
| 4 | ImageStylePicker.tsx | Fallback-Style `labels` (DB leer) | nur de/en/fr | uk + ru für "Standardstil" ergänzt |
| 5 | CharacterSelectionScreen.tsx | `defaultCharacterMessages` (Fablino-Sprechblase) | nur de/fr/en/es/nl/it/bs | uk + ru ergänzt |
| 6 | StoryTypeSelectionScreen.tsx | `defaultFablinoMessages` (Fablino-Sprechblase) | nur de/fr/en/es/nl/it/bs | uk + ru ergänzt |
| 7 | BranchDecisionScreen.tsx | `translations` (header, confirmButton, loadingText) | nur de/fr/en/es/nl/it/bs | uk + ru ergänzt |
| 8 | StoryGenerationProgress.tsx | `progressSteps[].label` + `DID_YOU_KNOW` | uk/ru fehlten | uk + ru für alle 4 Schritte + DID_YOU_KNOW ergänzt |

---

## Bereits vorhanden (kein Fix nötig)

- **types.ts**: `settingSelectionTranslations`, `characterSelectorTranslations`, `storyTypeSelectionTranslations`, `LANGUAGE_LABELS` etc. enthalten bereits uk/ru (Language-Typ inkl. uk | ru).
- **VoiceRecordButton.tsx**: `VOICE_LABELS` hat uk/ru.
- **ReadingPage.tsx**: `readingLabels` hat uk/ru (inkl. dismiss).
- **lib/translations/uk.ts & ru.ts**: Vollständige UI-Übersetzungen für zentrale Keys.

---

## DB-Übersetzungen (empfohlen, nicht im Code geändert)

| Tabelle / Feld | Inhalt | Empfehlung |
|----------------|--------|------------|
| image_styles.labels (JSONB) | Style-Namen pro Sprache | Migration: für alle aktiven Styles `labels->>'uk'` und `labels->>'ru'` setzen (z. B. "Букварик (м’який)", "Стиль коміксу" etc.), damit das Grid nicht auf de/en zurückfällt. |
| learning_themes.labels / descriptions | Themen-Labels | Falls Wizard/Admin diese anzeigt: uk/ru in JSONB ergänzen. |
| content_themes_by_level.labels | ~19 Einträge | Analog uk/ru ergänzen, falls in UI genutzt. |
| fun_facts.translations | Fakten pro Sprache | Bereits Record; Fallback im Code ist `translations?.[lang] \|\| translations?.en \|\| translations?.de` — DB-Einträge mit uk/ru befüllen für lokalisierte Fakten. |

---

## Durchgeführte Änderungen (Übersicht)

1. **SpecialEffectsScreen.tsx**: `translations` um uk/ru erweitert; `settingsTranslations` um uk/ru erweitert.
2. **ImageStylePicker.tsx**: Fallback-Style `labels` um uk/ru erweitert. (Header/Recommended/Loading waren in der vorliegenden Version bereits uk/ru vorhanden.)
3. **CharacterSelectionScreen.tsx**: `defaultCharacterMessages` um uk/ru erweitert.
4. **StoryTypeSelectionScreen.tsx**: `defaultFablinoMessages` um uk/ru erweitert.
5. **BranchDecisionScreen.tsx**: `translations` um uk/ru erweitert.
6. **StoryGenerationProgress.tsx**: Alle `progressSteps[].label` und `DID_YOU_KNOW` um uk/ru erweitert.

**Build**: `npm run build` erfolgreich.

---

## Nächste Schritte (optional)

- SQL-Migration für `image_styles.labels` (uk/ru) ausführen.
- Weitere Screens (Onboarding, Auth, Home, Reading, Results, Admin) stichprobenartig mit Sprache uk/ru durchklicken und verbleibende hardcodierte oder fehlende Keys nachpflegen.
- `levelTranslations.ts` und Badge-/Level-Namen prüfen, ob uk/ru überall genutzt werden.
