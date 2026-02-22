# Translation Audit Report

**Datum:** 2026-02-22  
**Zielsprachen (15):** de, en, fr, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl  
**Status:** Audit — keine Änderungen vorgenommen

---

## 1. Datenbank

### Übersicht

| Tabelle | JSONB-Spalte(n) | Rows | Vorhandene Sprachen | Fehlende Sprachen | Zu übersetzen |
|---------|----------------|------|---------------------|-------------------|---------------|
| emotion_blueprints | labels, descriptions | 21 | de, en, fr, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 21 × 2 × 8 = **336** |
| character_seeds | labels | 60 | de, en (2) | fr, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl (13) | 60 × 1 × 13 = **780** |
| story_elements | labels (nullable) | 90 | — (alle NULL) | Alle 15 | **Nicht user-facing** ¹ |
| image_styles | labels, description | 6 | de, fr, en, es, it, bs, nl (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 6 × 2 × 8 = **96** |
| story_subtypes | labels, descriptions | 42 | de, fr, en, es, it, nl, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 42 × 2 × 8 = **672** |
| generation_config | length_labels, length_description | 12 | de, fr, en, es, it, nl, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 12 × 2 × 8 = **192** |
| learning_themes | labels, descriptions | 15 | de, fr, en, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 15 × 2 × 8 = **240** |
| difficulty_rules | label, description | 9 | de, fr, en, es, it, nl, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 9 × 2 × 8 = **144** |
| theme_rules | labels | 18 | de, fr, en, es, it, nl, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 18 × 1 × 8 = **144** |
| emotion_rules | labels | 18 | de, fr, en, es, it, nl, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 18 × 1 × 8 = **144** |
| content_themes_by_level | labels, example_texts | 14 | de, fr, en, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 14 × 2 × 8 = **224** |
| custom_learning_themes | name, description | variabel | user-generated | — | **N/A** ² |
| **DB Total** | | | | | **2,972** |

¹ `story_elements.labels` ist nullable und enthält keine Daten. `content_en` ist eine LLM-Instruktion (nicht user-facing). Kein Übersetzungsbedarf.  
² `custom_learning_themes` wird pro User erstellt — keine zentrale Übersetzung möglich.

### Hinweise

- **`character_seeds.name_pool`**: Enthält Eigennamen (z.B. "Amara", "Yuki") — sprachunabhängig, kein Übersetzungsbedarf.
- **`character_seeds.appearance_en/personality_trait_en/weakness_en/strength_en`**: Sind LLM-Instruktionen in Englisch — nicht user-facing.
- **`emotion_blueprints`**: Haben durch Task 3.4 bereits 7 Sprachen. Nur die 8 neuen Sprachen fehlen.

---

## 2. Frontend

### I18n-System

- **Framework:** Custom TypeScript-basiert (kein i18next/react-intl)
- **Hook:** `useTranslations(lang: Language)` aus `src/lib/translations.ts`
- **Typ:** Ein großes Objekt mit allen Sprachen inline (kein JSON pro Sprache)

### Dateien

| Datei | Keys/Strings | Vorhandene Sprachen | Fehlende Sprachen | Zu übersetzen |
|-------|-------------|---------------------|-------------------|---------------|
| `src/lib/translations.ts` | 356 Keys | de, en, fr, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 356 × 8 = **2,848** |
| `src/lib/levelTranslations.ts` — Level-Titel | 5 Keys | de, en, fr, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 5 × 8 = **40** |
| `src/lib/levelTranslations.ts` — Badge-Übersetzungen | 22 × 2 = 44 Strings | de, en, fr, es, nl, it, bs (7) | tr, bg, ro, pl, lt, hu, ca, sl (8) | 44 × 8 = **352** |
| **Frontend Total (i18n)** | **405 Keys** | | | **3,240** |

### Keys nach Kategorie

| Kategorie | Anzahl Keys |
|-----------|-------------|
| Navigation & UI (Buttons, Menüs, Tabs) | 30 |
| Wizard-Flow (Themenauswahl, Charakter, Effekte, Style) | 50 |
| Gamification (Sterne, Badges, Level, Streaks, Motivation) | 30 |
| Fehlermeldungen & System | 9 |
| Eltern-Bereich (Einstellungen, Dashboard, Kinderprofil) | 100 |
| Onboarding & Auth | 0 ³ |
| Sonstiges (Vokabeln, Serien, Status, Toasts) | 137 |
| Level-Titel + Badge-Übersetzungen | 49 |
| **Gesamt** | **405** |

³ Onboarding/Auth-Strings sind vollständig hardcoded (siehe Abschnitt 4).

---

## 3. Zusammenfassung

| Quelle | Strings total | Bereits übersetzt (7 Sprachen) | Noch zu übersetzen (8 neue Sprachen) |
|--------|--------------|-------------------------------|--------------------------------------|
| Datenbank (10 Tabellen) | ~215 JSONB-Felder | 155 × 7 = 1,085 | **2,972** |
| Frontend (translations.ts) | 356 Keys | 356 × 7 = 2,492 | **2,848** |
| Frontend (levelTranslations.ts) | 49 Keys/Strings | 49 × 7 = 343 | **392** |
| **Gesamt** | **~620 einzigartige Strings** | **3,920** | **6,212** |

### Zusätzlich: Hardcoded Strings (nicht im i18n-System)

| Quelle | Geschätzte Strings | Sprache |
|--------|--------------------|---------|
| Hardcoded in Komponenten | ~120 Strings | de/en/fr gemischt |

**Grand Total inkl. Hardcoded-Bereinigung:**  
~740 einzigartige Strings × 15 Sprachen = ~11,100 Übersetzungen  
Davon bereits vorhanden: ~3,920  
**Noch zu übersetzen: ~7,180** (inkl. Hardcoded → i18n Migration)

---

## 4. Hardcodierte Strings (Risiko)

Strings die direkt im Code stehen und NICHT das i18n-System nutzen.

### Kritisch — Vollständige Seiten ohne i18n

| Datei | Strings | Sprache | Schwere |
|-------|---------|---------|---------|
| `src/pages/WelcomePage.tsx` | ~35 Strings (Login/Register, Validierung, E-Mail-Bestätigung) | de | **HOCH** — Login-Seite immer deutsch |
| `src/pages/OnboardingKindPage.tsx` | ~15 Strings (Toast-Meldungen, Validierung) | de | **HOCH** — Onboarding immer deutsch |
| `src/pages/OnboardingStoryPage.tsx` | ~10 Strings (Fortschritt, Fehler, Erfolg) | de | **HOCH** — Onboarding immer deutsch |
| `src/pages/RegisterPage.tsx` | ~12 Strings (Validierung, Erfolg, Fehler) | en | MITTEL — auf Englisch hardcoded |
| `src/pages/LoginPage.tsx` | ~8 Strings (Validierung, Erfolg, Fehler) | en | MITTEL — auf Englisch hardcoded |
| `src/pages/ResetPasswordPage.tsx` | ~8 Strings (Validierung, Fehler) | de | MITTEL |
| `src/pages/UpdatePasswordPage.tsx` | ~8 Strings (Validierung, Fehler) | de | MITTEL |

### Mittel — Einzelne Strings in Komponenten

| Datei | Zeile | String | Sprache |
|-------|-------|--------|---------|
| `src/components/FablinoReaction.tsx` | 164 | "Weiter" | de |
| `src/components/ImageStylesSection.tsx` | 541,544 | "Abbrechen", "Erstellen"/"Speichern" | de |
| `src/components/AgeRulesSection.tsx` | 262,264 | "Speichern...", "Abbrechen" | de |
| `src/components/GenerationConfigSection.tsx` | 373,378 | "Speichern…", "Konfiguration speichern" | de |
| `src/components/StoryAudioPlayer.tsx` | 97,99,114 | "Trop de demandes...", "Erreur..." | fr |
| `src/hooks/useAuth.tsx` | 255-346 | 6 Fehlermeldungen | de/en gemischt |
| `src/hooks/useCollection.tsx` | 273 | "Für ein perfektes Quiz!" | de |
| `src/pages/ReadingPage.tsx` | diverse | ~12 Toast-Fehlermeldungen | de |
| `src/pages/CreateStoryPage.tsx` | 155,507 | "Tageslimit erreicht..." | de |
| `src/pages/AdminPage.tsx` | 318,384 | Konditionale Strings (de/fr/en) | mixed |
| `src/pages/StickerBookPage.tsx` | 133 | "X Geschichten gesammelt!" | de |

---

## 5. Empfohlene Reihenfolge

### Phase A: Hardcoded → i18n (Voraussetzung)
1. `WelcomePage.tsx` — Login/Register komplett ins i18n-System (~35 Keys)
2. `OnboardingKindPage.tsx` + `OnboardingStoryPage.tsx` — Onboarding (~25 Keys)
3. Auth-Pages (Register, Login, Reset, Update) — (~28 Keys)
4. Verstreute Strings in Komponenten (~32 Keys)

### Phase B: 8 neue Sprachen für Frontend
5. `translations.ts` — 356 + ~120 neue Keys × 8 Sprachen = ~3,808 Strings
6. `levelTranslations.ts` — 49 Strings × 8 Sprachen = 392 Strings

### Phase C: 8 neue Sprachen für Datenbank
7. `emotion_blueprints` — 336 Strings (Labels + Descriptions)
8. `character_seeds` — 780 Strings (Labels: 60 × 13 fehlende Sprachen)
9. Bestehende Tabellen (story_subtypes, theme_rules, etc.) — 1,856 Strings

### Phase D: TypeScript Language-Type erweitern
10. `Language` Type auf 15 Sprachen erweitern
11. Sprach-Picker im Eltern-Bereich aktualisieren
12. Fallback-Logik prüfen (was passiert wenn Sprache fehlt?)
