# Block 2.3d – Gesamtprompt für Cursor (sequenziell mit Testpausen)

> Kopiere diesen gesamten Text als Prompt in Cursor.
> Cursor soll nach jeder PHASE stoppen und dich testen lassen.
> Nach erfolgreichem Test: `git add -A && git commit -m "Block 2.3d Phase X"` → dann "weiter" sagen.

---

Lies die ARCHITECTURE.md und IMPLEMENTATION_PLAN_v3.md im Projekt-Root.

## Gesamtaufgabe: Block 2.3d

Der Story-Wizard und das Kinderprofil werden erweitert:
- Länge-Toggle + Sprach-Picker im Wizard
- Figuren-Verwaltung im Profil (Eltern-Bereich) statt im Wizard
- Gespeicherte Figuren im Wizard als Checkboxen hinter Kacheln
- Intelligente Beziehungslogik im Prompt (mit/ohne "Ich")
- Parameter-Übergabe an generate-story

Arbeite die folgenden 5 Phasen NACHEINANDER ab. Nach jeder Phase: STOPP, sage mir was du gemacht hast, und warte bis ich getestet und "weiter" gesagt habe.

---

## ════════════════════════════════════════
## PHASE 1: Migration + story_languages Feld
## ════════════════════════════════════════

### 1.1 kid_characters role Constraint anpassen

```sql
ALTER TABLE kid_characters DROP CONSTRAINT IF EXISTS kid_characters_role_check;
ALTER TABLE kid_characters ADD CONSTRAINT kid_characters_role_check 
  CHECK (role IN ('family', 'friend', 'known_figure'));

UPDATE kid_characters SET role = 'family' WHERE role IN ('sibling', 'custom');
```

### 1.2 story_languages Feld auf kid_profiles

```sql
ALTER TABLE kid_profiles 
ADD COLUMN IF NOT EXISTS story_languages text[] NOT NULL DEFAULT '{"fr"}';

-- Bestehende Profile befüllen mit reading_language + home_languages
UPDATE kid_profiles 
SET story_languages = ARRAY(
  SELECT DISTINCT unnest(
    ARRAY[reading_language] || COALESCE(home_languages, '{}')
  )
);
```

### 1.3 TypeScript Types aktualisieren

Füge in `src/integrations/supabase/types.ts` hinzu:
- `story_languages: string[]` auf kid_profiles
- Prüfe dass kid_characters.role die neuen Werte ('family', 'friend', 'known_figure') reflektiert

### PHASE 1 — STOPP

Sage mir: "Phase 1 fertig. Migration erstellt für role Constraint + story_languages. App starten und testen."

**Mein Test:**
- [ ] `npm run dev` startet ohne Fehler
- [ ] Bestehende Funktionalität unverändert
- [ ] In Supabase: story_languages Spalte existiert auf kid_profiles

**Wenn OK → ich sage "weiter" → dann Phase 2.**

---

## ════════════════════════════════════════
## PHASE 2: Profil-UI (Figuren + Sprachen)
## ════════════════════════════════════════

### 2.1 Figuren-Verwaltung im Kinderprofil

Finde `KidProfileSection.tsx` (oder die Komponente die das Kinderprofil bearbeitet im Eltern-Bereich/AdminPage).

Füge einen neuen Abschnitt hinzu: **"Wichtige Personen für Geschichten"**

**Anzeige: Liste aller gespeicherten Figuren**

Lade kid_characters für das aktive Kindprofil:

```typescript
const { data: characters } = await supabase
  .from('kid_characters')
  .select('*')
  .eq('kid_profile_id', kidProfile.id)
  .eq('is_active', true)
  .order('role', { ascending: true })
  .order('sort_order', { ascending: true });
```

Zeige als einfache Liste, gruppiert nach Typ:

```
Wichtige Personen für Geschichten
─────────────────────────────────
👨‍👩‍👧 Mikel — Bruder, 6 J.              ✕
👨‍👩‍👧 Sonia — Mama                       ✕
👫 Simon — Freund, 8 J.               ✕
⭐ Batman                              ✕

        [ + Hinzufügen ]
```

- Jede Zeile: Emoji (👨‍👩‍👧 family, 👫 friend, ⭐ known_figure) + Name + Beziehung + Alter
- ✕ Button zum Löschen (soft-delete: `is_active = false`)

**"+ Hinzufügen" → Gestufter Flow in einem Dialog/Modal:**

EIN Button öffnet Dialog. Erster Schritt: Typ-Dropdown.

**Stufe 1: Typ wählen (Dropdown)**
- Familie
- Freund/in
- Bekannte Figur

**Stufe 2a: Wenn "Familie" gewählt:**
- Beziehung (Pflicht-Dropdown): Mama, Papa, Bruder, Schwester, Oma, Opa, Cousin, Cousine, Tante, Onkel
- Name (Pflicht-Text)
- Alter (Optional-Number)

**Stufe 2b: Wenn "Freund/in" gewählt:**
- Name (Pflicht-Text)
- Alter (Optional-Number)
- `relation` wird automatisch auf "Freund" gesetzt (in story_language des Kindes)
- Max 5 Freunde. Bei 5 → "Freund/in" Option deaktivieren mit Hinweis

**Stufe 2c: Wenn "Bekannte Figur" gewählt:**
- Name (Pflicht-Text)
- Kein Alter, keine Beziehung

**Speichern:**

```typescript
await supabase.from('kid_characters').insert({
  kid_profile_id: kidProfile.id,
  name: formData.name,
  role: formData.type,  // 'family' | 'friend' | 'known_figure'
  relation: formData.relation || null,
  age: formData.age || null,
  description: null,
  is_active: true,
  sort_order: (characters?.length || 0),
});
```

Dialog schließen, Liste refreshen.

### 2.1b FAMILIEN-SYNC über Geschwister-Profile

**WICHTIG:** Wenn der User mehrere Kinderprofile hat (z.B. Aria + Mikel), sollen Familien-Einträge (role = 'family') automatisch für ALLE Kinderprofile des Users angelegt werden. Freunde und bekannte Figuren bleiben pro Kind.

**Beim Speichern eines family-Eintrags:**

```typescript
if (formData.type === 'family') {
  // Alle kid_profiles des gleichen Users laden
  const { data: allKidProfiles } = await supabase
    .from('kid_profiles')
    .select('id')
    .eq('user_id', userId);
  
  // Für jedes ANDERE Kinderprofil auch anlegen (wenn nicht schon vorhanden)
  for (const otherKid of allKidProfiles || []) {
    if (otherKid.id === kidProfile.id) continue; // aktuelles überspringen
    
    // Prüfe ob schon ein Eintrag mit gleichem Namen + Beziehung existiert
    const { data: existing } = await supabase
      .from('kid_characters')
      .select('id')
      .eq('kid_profile_id', otherKid.id)
      .eq('name', formData.name)
      .eq('role', 'family')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!existing) {
      await supabase.from('kid_characters').insert({
        kid_profile_id: otherKid.id,
        name: formData.name,
        role: 'family',
        relation: formData.relation || null,
        age: formData.age || null,
        description: null,
        is_active: true,
        sort_order: 0,
      });
    }
  }
}
```

**Beim Löschen eines family-Eintrags (✕ Button):**

Wenn role = 'family' → auch bei allen anderen Kinderprofilen löschen (gleicher Name + gleiche Beziehung):

```typescript
if (character.role === 'family') {
  const { data: allKidProfiles } = await supabase
    .from('kid_profiles')
    .select('id')
    .eq('user_id', userId);
  
  for (const kid of allKidProfiles || []) {
    await supabase
      .from('kid_characters')
      .update({ is_active: false })
      .eq('kid_profile_id', kid.id)
      .eq('name', character.name)
      .eq('role', 'family')
      .eq('relation', character.relation);
  }
} else {
  // Freunde + Bekannte: nur für dieses Kind löschen
  await supabase
    .from('kid_characters')
    .update({ is_active: false })
    .eq('id', character.id);
}
```

**Beim Ändern von Alter eines family-Eintrags:**

Wenn ein Familienmitglied bearbeitet wird (z.B. Alter aktualisiert) → auch bei allen Geschwisterprofilen aktualisieren. Gleiche Logik: über Name + role + relation matchen.

**Ergebnis:** Eltern geben Mama, Papa, Oma etc. nur EINMAL ein. Alle Kinderprofile haben automatisch die gleichen Familienmitglieder.

### 2.2 story_languages Multi-Select im Kinderprofil

Füge im Profil-Editor ein Feld hinzu: "Geschichten-Sprachen"

- Multi-Select mit Checkboxen oder Toggle-Buttons
- Verfügbare Optionen: fr, de, en, es, it, bs
- Zeige als Flagge + Sprachname: 🇫🇷 Français, 🇩🇪 Deutsch, 🇬🇧 English, 🇪🇸 Español, 🇮🇹 Italiano, 🇧🇦 Bosanski
- Labels in der kidAppLanguage anzeigen
- Mindestens 1 Sprache muss ausgewählt sein
- Beim Profil-Speichern: `story_languages: selectedLanguages`

### 2.3 Translations

Füge in `src/lib/translations.ts` hinzu (passe an die bestehende Struktur an):

```typescript
// Profil: Figuren
importantCharacters: {
  de: 'Wichtige Personen für Geschichten',
  fr: 'Personnages importants pour les histoires',
  en: 'Important characters for stories',
  es: 'Personajes importantes para las historias',
  it: 'Personaggi importanti per le storie',
  bs: 'Važni likovi za priče',
},
addCharacter: {
  de: 'Hinzufügen', fr: 'Ajouter', en: 'Add',
  es: 'Añadir', it: 'Aggiungi', bs: 'Dodaj',
},
characterType: {
  de: 'Wer soll hinzugefügt werden?',
  fr: 'Qui voulez-vous ajouter ?',
  en: 'Who do you want to add?',
  es: '¿A quién quieres añadir?',
  it: 'Chi vuoi aggiungere?',
  bs: 'Koga želite dodati?',
},
typeFamily: {
  de: 'Familie', fr: 'Famille', en: 'Family',
  es: 'Familia', it: 'Famiglia', bs: 'Porodica',
},
typeFriend: {
  de: 'Freund/in', fr: 'Ami(e)', en: 'Friend',
  es: 'Amigo/a', it: 'Amico/a', bs: 'Prijatelj/ica',
},
typeKnownFigure: {
  de: 'Bekannte Figur', fr: 'Personnage connu', en: 'Known character',
  es: 'Personaje conocido', it: 'Personaggio noto', bs: 'Poznati lik',
},
// Familien-Beziehungen
relationMama: { de: 'Mama', fr: 'Maman', en: 'Mom', es: 'Mamá', it: 'Mamma', bs: 'Mama' },
relationPapa: { de: 'Papa', fr: 'Papa', en: 'Dad', es: 'Papá', it: 'Papà', bs: 'Tata' },
relationBrother: { de: 'Bruder', fr: 'Frère', en: 'Brother', es: 'Hermano', it: 'Fratello', bs: 'Brat' },
relationSister: { de: 'Schwester', fr: 'Sœur', en: 'Sister', es: 'Hermana', it: 'Sorella', bs: 'Sestra' },
relationGrandma: { de: 'Oma', fr: 'Grand-mère', en: 'Grandma', es: 'Abuela', it: 'Nonna', bs: 'Baka' },
relationGrandpa: { de: 'Opa', fr: 'Grand-père', en: 'Grandpa', es: 'Abuelo', it: 'Nonno', bs: 'Djed' },
relationCousin: { de: 'Cousin', fr: 'Cousin', en: 'Cousin', es: 'Primo', it: 'Cugino', bs: 'Rođak' },
relationCousine: { de: 'Cousine', fr: 'Cousine', en: 'Cousin', es: 'Prima', it: 'Cugina', bs: 'Rođaka' },
relationAunt: { de: 'Tante', fr: 'Tante', en: 'Aunt', es: 'Tía', it: 'Zia', bs: 'Tetka' },
relationUncle: { de: 'Onkel', fr: 'Oncle', en: 'Uncle', es: 'Tío', it: 'Zio', bs: 'Ujak' },
maxFriendsReached: {
  de: 'Maximum 5 Freunde erreicht', fr: 'Maximum 5 ami(e)s atteint',
  en: 'Maximum 5 friends reached', es: 'Máximo 5 amigos alcanzado',
  it: 'Massimo 5 amici raggiunto', bs: 'Maksimalno 5 prijatelja dostignuto',
},
// Profil: Sprachen
storyLanguagesLabel: {
  de: 'Geschichten-Sprachen', fr: 'Langues des histoires',
  en: 'Story languages', es: 'Idiomas de historias',
  it: 'Lingue delle storie', bs: 'Jezici priča',
},
storyLanguagesHint: {
  de: 'In welchen Sprachen soll dein Kind Geschichten lesen?',
  fr: 'Dans quelles langues votre enfant doit-il lire des histoires ?',
  en: 'In which languages should your child read stories?',
  es: '¿En qué idiomas debe leer historias tu hijo/a?',
  it: 'In quali lingue il tuo bambino dovrebbe leggere storie?',
  bs: 'Na kojim jezicima vaše dijete treba čitati priče?',
},
```

### PHASE 2 — STOPP

Sage mir: "Phase 2 fertig. Figuren-Verwaltung + story_languages im Profil eingebaut. App starten und testen."

**Mein Test:**
- [ ] Profil öffnen → "Wichtige Personen" Sektion sichtbar
- [ ] "+ Hinzufügen" → Typ "Familie" → Beziehungs-Dropdown → Name + Alter → Speichern ✓
- [ ] "+ Hinzufügen" → Typ "Freund/in" → Name + Alter → Speichern ✓
- [ ] "+ Hinzufügen" → Typ "Bekannte Figur" → nur Name → Speichern ✓
- [ ] ✕ zum Löschen funktioniert
- [ ] 5 Freunde anlegen → 6. nicht möglich
- [ ] FAMILIEN-SYNC: Bei Kind A "Mama Sonia" anlegen → zu Kind B wechseln → Mama Sonia ist auch da
- [ ] FAMILIEN-SYNC: Bei Kind B einen Freund anlegen → bei Kind A ist der Freund NICHT da (nur pro Kind)
- [ ] FAMILIEN-SYNC: Bei Kind A Oma löschen → bei Kind B auch weg
- [ ] Geschichten-Sprachen Multi-Select sichtbar und funktional
- [ ] Labels in kidAppLanguage korrekt
- [ ] In Supabase: kid_characters werden gespeichert mit korrektem role + relation

**Wenn OK → ich sage "weiter" → dann Phase 3.**

---

## ════════════════════════════════════════
## PHASE 3: Wizard erweitern
## ════════════════════════════════════════

### 3.1 Screen 1: Länge-Toggle + Sprach-Picker

Finde den Story-Wizard (CreateStoryPage.tsx + Komponenten in `src/components/story-creation/`).

**Länge-Toggle:**
- 3 Buttons: Kurz / Mittel / Lang (ToggleGroup-Style)
- Default: Mittel
- State: `storyLength: 'short' | 'medium' | 'long'`
- Unter oder neben der Themen-Auswahl

**Sprach-Picker:**
- Quelle: `kidProfile.story_languages` (aus Phase 1/2)
- Wenn nur 1 Sprache → Picker NICHT anzeigen
- Wenn >1 → kleine Buttons mit Flagge + Kürzel: 🇫🇷 FR, 🇩🇪 DE, etc.
- Default: `kidProfile.reading_language`
- State: `storyLanguage: string`

Flaggen-Mapping:
```typescript
const LANGUAGE_FLAGS: Record<string, string> = {
  fr: '🇫🇷', de: '🇩🇪', en: '🇬🇧', es: '🇪🇸', it: '🇮🇹', bs: '🇧🇦',
};
```

Translations:
```typescript
storyLengthLabel: {
  de: 'Länge', fr: 'Longueur', en: 'Length',
  es: 'Longitud', it: 'Lunghezza', bs: 'Dužina',
},
storyLengthShort: {
  de: 'Kurz', fr: 'Court', en: 'Short',
  es: 'Corto', it: 'Breve', bs: 'Kratko',
},
storyLengthMedium: {
  de: 'Mittel', fr: 'Moyen', en: 'Medium',
  es: 'Medio', it: 'Medio', bs: 'Srednje',
},
storyLengthLong: {
  de: 'Lang', fr: 'Long', en: 'Long',
  es: 'Largo', it: 'Lungo', bs: 'Dugo',
},
storyLanguageLabel: {
  de: 'Sprache', fr: 'Langue', en: 'Language',
  es: 'Idioma', it: 'Lingua', bs: 'Jezik',
},
```

### 3.2 Screen 2: Gespeicherte Figuren hinter Kacheln

Lade die kid_characters beim Öffnen von Screen 2:

```typescript
const { data: savedCharacters } = await supabase
  .from('kid_characters')
  .select('*')
  .eq('kid_profile_id', kidProfile.id)
  .eq('is_active', true)
  .order('sort_order', { ascending: true });

const familyChars = savedCharacters?.filter(c => c.role === 'family') || [];
const friendChars = savedCharacters?.filter(c => c.role === 'friend') || [];
const knownChars = savedCharacters?.filter(c => c.role === 'known_figure') || [];
```

Wenn der User eine Kategorie-Kachel anklickt (Familie / Freunde / Bekannte Figuren), expandiert darunter die Liste der gespeicherten Figuren als **Checkboxen**:

**"Familie"-Kachel → Expansion:**
```
☑ Mikel (Bruder, 6 J.)
☐ Sonia (Mama)
☐ Carmen (Oma)
```

**"Freunde"-Kachel → Expansion:**
```
☑ Simon (8 J.)
☐ Léa (7 J.)
```

**"Bekannte Figuren"-Kachel → Expansion:**
```
☐ Batman
☐ Ladybug
```

Wenn KEINE Figuren für eine Kategorie gespeichert sind, zeige:
```
Noch keine angelegt → Im Profil anlegen
```

Translations:
```typescript
noCharactersSaved: {
  de: 'Noch keine angelegt → Im Profil anlegen',
  fr: 'Aucun enregistré → Créer dans le profil',
  en: 'None saved → Create in profile',
  es: 'Ninguno guardado → Crear en el perfil',
  it: 'Nessuno salvato → Crea nel profilo',
  bs: 'Nema sačuvanih → Kreiraj u profilu',
},
```

**"Ich"-Kachel** bleibt wie bisher (Name + Alter aus kidProfile, setzt `includeSelf = true`).

**ENTFERNE** das "Figur speichern" Mini-Formular falls es aktuell im Wizard existiert. Figuren werden nur noch im Profil gepflegt.

### 3.3 Screen 3 (Spezialeffekte): Minimale Anpassung

- Freitext-Feld als optional markieren
- Placeholder in kidAppLanguage:

```typescript
userPromptPlaceholder: {
  de: 'z.B. "Eine Geschichte über Piraten auf dem Mond"',
  fr: 'p.ex. "Une histoire de pirates sur la lune"',
  en: 'e.g. "A story about pirates on the moon"',
  es: 'ej. "Una historia de piratas en la luna"',
  it: 'es. "Una storia di pirati sulla luna"',
  bs: 'npr. "Priča o piratima na mjesecu"',
},
```

### PHASE 3 — STOPP

Sage mir: "Phase 3 fertig. Wizard hat Länge-Toggle, Sprach-Picker, und Figuren als Checkboxen. App starten und testen."

**Mein Test:**
- [ ] Wizard Screen 1: Länge-Toggle sichtbar, Default = Mittel
- [ ] Wizard Screen 1: Sprach-Picker sichtbar (wenn Kind >1 story_language hat)
- [ ] Wizard Screen 1: Sprach-Picker NICHT sichtbar (wenn Kind nur 1 Sprache hat)
- [ ] Wizard Screen 2: "Ich"-Kachel vorhanden
- [ ] Wizard Screen 2: "Familie" anklicken → gespeicherte Familienmitglieder als Checkboxen
- [ ] Wizard Screen 2: "Freunde" anklicken → gespeicherte Freunde als Checkboxen
- [ ] Wizard Screen 2: "Bekannte Figuren" anklicken → gespeicherte Figuren als Checkboxen
- [ ] Wizard Screen 2: Keine Figuren gespeichert → Hinweis "Im Profil anlegen"
- [ ] Wizard Screen 2: Kein "Figur speichern" Mini-Formular mehr
- [ ] Wizard Screen 3: Freitext als optional markiert
- [ ] Alle Labels in kidAppLanguage

**Wenn OK → ich sage "weiter" → dann Phase 4.**

---

## ════════════════════════════════════════
## PHASE 4: Parameter-Übergabe an Edge Function
## ════════════════════════════════════════

### 4.1 Request-Body erweitern

Finde den Code wo `supabase.functions.invoke('generate-story', { body: ... })` aufgerufen wird.

Erweitere den Body um die neuen Parameter:

```typescript
const { data, error } = await supabase.functions.invoke('generate-story', {
  body: {
    // ... ALLE bestehenden Felder beibehalten ...
    
    // NEU:
    story_language: storyLanguage,      // aus Sprach-Picker
    length: storyLength,                 // 'short' | 'medium' | 'long'
    include_self: includeSelf,           // boolean aus "Ich"-Kachel
    
    // Characters: ALLE ausgewählten Figuren mit vollen Daten
    characters: selectedCharacters.map(c => ({
      name: c.name,
      age: c.age || undefined,
      relation: c.relation || undefined,
      description: c.description || undefined,
      role: c.role,  // 'family' | 'friend' | 'known_figure'
    })),
  }
});
```

### 4.2 Edge Function Mapping prüfen

Öffne `generate-story/index.ts`. Finde wo die Parameter aus dem Request-Body extrahiert und an `buildStoryPrompt()` übergeben werden.

Stelle sicher dass die neuen Felder korrekt auf das `StoryRequest`-Objekt gemappt werden:

```typescript
const storyRequest: StoryRequest = {
  // ...bestehende Felder...
  story_language: body.story_language || kidProfile.reading_language,
  length: body.length || 'medium',
  protagonists: {
    include_self: body.include_self || false,
    characters: (body.characters || []).map((c: any) => ({
      name: c.name,
      age: c.age,
      relation: c.relation,
      description: c.description,
      role: c.role,
    })),
  },
  // ...
};
```

WICHTIG: Prüfe dass `StoryRequest` in `promptBuilder.ts` das `role` Feld auf den characters hat. Falls nicht, erweitere das Interface:

```typescript
characters: Array<{
  name: string;
  age?: number;
  relation?: string;
  description?: string;
  role?: string;  // 'family' | 'friend' | 'known_figure'
}>;
```

### PHASE 4 — STOPP

Sage mir: "Phase 4 fertig. Parameter werden an Edge Function übergeben. App starten und testen."

**Mein Test:**
- [ ] Story erstellen mit Defaults (Mittel, Standard-Sprache, keine Figuren) → funktioniert wie bisher
- [ ] Story erstellen mit Länge "Kurz" → Story ist kürzer
- [ ] Story erstellen mit anderer Sprache → Story in der gewählten Sprache
- [ ] Story erstellen mit "Ich" + Bruder → Console-Logs zeigen korrekte Parameter
- [ ] Story erstellen nur mit 2 Freunden (ohne "Ich") → Console-Logs zeigen characters mit relation
- [ ] Keine Fehler in Console

**Wenn OK → ich sage "weiter" → dann Phase 5.**

---

## ════════════════════════════════════════
## PHASE 5: Beziehungslogik im promptBuilder
## ════════════════════════════════════════

### 5.1 buildCharactersSection() in promptBuilder.ts umschreiben

Öffne `supabase/functions/_shared/promptBuilder.ts`. Finde die Stelle wo die FIGUREN-Sektion des Prompts gebaut wird.

Die Beziehungslogik hängt davon ab ob "Ich" (include_self) aktiv ist:

**FALL 1: include_self = true → Alle Beziehungen relativ zum Kind**

```
## PERSONNAGES
Personnage principal: Aria, 8
Mikel, 6 — Frère de Aria
Sonia — Maman de Aria
Simon, 8 — Ami de Aria
Batman — personnage connu
```

**FALL 2: include_self = false → Figuren stehen zueinander in Beziehung**

Regeln:
- Mama + Papa zusammen → "sind ein Paar / die Eltern"
- Mehrere Geschwister → "sind Geschwister"
- Eltern + Kinder → "→ Dies ist eine Familiengeschichte."
- Mehrere Freunde → "sind miteinander befreundet"
- Bekannte Figuren → "bekannte Figur"

```
## PERSONNAGES
Note: L'enfant n'est PAS un personnage.
Sonia et Johann — sont un couple / les parents
Mikel, 6 et Sofia, 3 — sont frères et sœurs
→ Ceci est une histoire de famille.
Simon, 8 et Léa, 7 — sont amis entre eux
Batman — personnage connu
```

### 5.2 Implementation

Ersetze die bestehende Figuren-Sektion-Logik durch:

```typescript
function buildCharactersSection(
  protagonists: StoryRequest['protagonists'],
  kidName: string,
  kidAge: number,
  headers: Record<string, string>,
  lang: string  // story_language
): string {
  const lines: string[] = [];
  const chars = protagonists.characters;
  
  if (protagonists.include_self) {
    // ═══ FALL 1: Kind ist Hauptfigur ═══
    lines.push(`${mainCharLabel(lang)}: ${kidName}, ${kidAge}`);
    
    for (const char of chars) {
      let entry = char.name;
      if (char.age) entry += `, ${char.age}`;
      
      if (char.relation) {
        entry += ` — ${char.relation} ${ofWord(lang)} ${kidName}`;
      } else if (char.role === 'known_figure') {
        entry += ` — ${knownFigureLabel(lang)}`;
      }
      lines.push(entry);
    }
    
  } else {
    // ═══ FALL 2: Kind ist NICHT Hauptfigur ═══
    lines.push(notMainCharHint(lang));
    
    const family = chars.filter(c => c.role === 'family');
    const friends = chars.filter(c => c.role === 'friend');
    const known = chars.filter(c => c.role === 'known_figure');
    
    // -- Familie --
    if (family.length > 0) {
      const parentRelations = ['Mama', 'Papa', 'Maman', 'Mom', 'Dad', 'Mamá', 'Papá', 'Mamma', 'Papà', 'Tata'];
      const siblingRelations = ['Bruder', 'Schwester', 'Frère', 'Sœur', 'Brother', 'Sister', 'Hermano', 'Hermana', 'Fratello', 'Sorella', 'Brat', 'Sestra'];
      
      const parents = family.filter(c => parentRelations.includes(c.relation || ''));
      const siblings = family.filter(c => siblingRelations.includes(c.relation || ''));
      const otherFamily = family.filter(c => !parents.includes(c) && !siblings.includes(c));
      
      if (parents.length >= 2) {
        lines.push(`${fmtChar(parents[0])} ${andWord(lang)} ${fmtChar(parents[1])} — ${coupleLabel(lang)}`);
      } else if (parents.length === 1) {
        lines.push(`${fmtChar(parents[0])} — ${parents[0].relation}`);
      }
      
      if (siblings.length >= 2) {
        lines.push(`${siblings.map(fmtChar).join(` ${andWord(lang)} `)} — ${siblingsLabel(lang)}`);
      } else if (siblings.length === 1) {
        lines.push(`${fmtChar(siblings[0])} — ${siblings[0].relation}`);
      }
      
      if (parents.length > 0 && siblings.length > 0) {
        lines.push(familyHint(lang));
      }
      
      for (const c of otherFamily) {
        lines.push(`${fmtChar(c)} — ${c.relation || ''}`);
      }
    }
    
    // -- Freunde --
    if (friends.length >= 2) {
      lines.push(`${friends.map(fmtChar).join(` ${andWord(lang)} `)} — ${friendsLabel(lang)}`);
    } else if (friends.length === 1) {
      lines.push(fmtChar(friends[0]));
    }
    
    // -- Bekannte Figuren --
    for (const c of known) {
      lines.push(`${c.name} — ${knownFigureLabel(lang)}`);
    }
  }
  
  if (lines.length === 0) return '';
  return `## ${headers.characters}\n${lines.join('\n')}`;
}

// ── Hilfsfunktionen ──

function fmtChar(c: { name: string; age?: number }): string {
  return c.age ? `${c.name}, ${c.age}` : c.name;
}

function mainCharLabel(l: string): string {
  return { fr: 'Personnage principal', de: 'Hauptfigur', en: 'Main character', es: 'Personaje principal', it: 'Protagonista', bs: 'Glavni lik' }[l] || 'Main character';
}

function ofWord(l: string): string {
  return { fr: 'de', de: 'von', en: 'of', es: 'de', it: 'di', bs: 'od' }[l] || 'of';
}

function andWord(l: string): string {
  return { fr: 'et', de: 'und', en: 'and', es: 'y', it: 'e', bs: 'i' }[l] || 'and';
}

function coupleLabel(l: string): string {
  return { fr: 'sont un couple / les parents', de: 'sind ein Paar / die Eltern', en: 'are a couple / the parents', es: 'son pareja / los padres', it: 'sono una coppia / i genitori', bs: 'su par / roditelji' }[l] || 'are a couple / the parents';
}

function siblingsLabel(l: string): string {
  return { fr: 'sont frères et sœurs', de: 'sind Geschwister', en: 'are siblings', es: 'son hermanos', it: 'sono fratelli', bs: 'su braća i sestre' }[l] || 'are siblings';
}

function familyHint(l: string): string {
  return { fr: '→ Ceci est une histoire de famille.', de: '→ Dies ist eine Familiengeschichte.', en: '→ This is a family story.', es: '→ Esta es una historia familiar.', it: '→ Questa è una storia di famiglia.', bs: '→ Ovo je porodična priča.' }[l] || '→ This is a family story.';
}

function friendsLabel(l: string): string {
  return { fr: 'sont amis entre eux', de: 'sind miteinander befreundet', en: 'are friends with each other', es: 'son amigos entre sí', it: 'sono amici tra loro', bs: 'su međusobni prijatelji' }[l] || 'are friends with each other';
}

function knownFigureLabel(l: string): string {
  return { fr: 'personnage connu', de: 'bekannte Figur', en: 'known character', es: 'personaje conocido', it: 'personaggio noto', bs: 'poznati lik' }[l] || 'known character';
}

function notMainCharHint(l: string): string {
  return { fr: 'Note : L\'enfant n\'est PAS un personnage. Les personnes suivantes sont les personnages de l\'histoire.', de: 'Hinweis: Das Kind ist NICHT selbst eine Figur. Die folgenden Personen sind die Figuren der Geschichte.', en: 'Note: The child is NOT a character. The following people are the story characters.', es: 'Nota: El niño NO es un personaje. Las siguientes personas son los personajes de la historia.', it: 'Nota: Il bambino NON è un personaggio. Le seguenti persone sono i personaggi della storia.', bs: 'Napomena: Dijete NIJE lik. Sljedeće osobe su likovi priče.' }[l] || 'Note: The child is NOT a character. The following people are the story characters.';
}
```

### PHASE 5 — STOPP

Sage mir: "Phase 5 fertig. Beziehungslogik im promptBuilder implementiert. App starten und testen."

**Mein Test:**
- [ ] Story MIT "Ich" + Bruder Mikel → Geschichte: Kind + Bruder erleben Abenteuer zusammen, Mikel ist BRUDER
- [ ] Story MIT "Ich" + Freund Simon → Geschichte: Kind + Freund, Simon ist FREUND
- [ ] Story OHNE "Ich", nur Mama + Papa → Geschichte über das Elternpaar
- [ ] Story OHNE "Ich", 2 Freunde → Geschichte: Freunde zusammen
- [ ] Story OHNE "Ich", Mama + Papa + Bruder → Familiengeschichte
- [ ] Console-Logs: Prompt-Text enthält korrekte Beziehungs-Formulierungen
- [ ] Generierte Geschichten: Beziehungen stimmen inhaltlich

---

## NACH ALLEN 5 PHASEN

Aktualisiere ARCHITECTURE.md basierend auf den Änderungen aus Block 2.3d:
- story_languages Feld auf kid_profiles
- Figuren-Verwaltung im Profil
- Wizard-Erweiterungen (Länge, Sprache, Figuren)
- Beziehungslogik im promptBuilder
- kid_characters role Werte geändert
