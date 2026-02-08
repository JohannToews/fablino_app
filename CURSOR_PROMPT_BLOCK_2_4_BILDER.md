# Block 2.4 – Gesamtprompt für Cursor: Intelligente Bild-Generierung

> Kopiere diesen gesamten Text als Prompt in Cursor.
> Voraussetzung: Block 2.3d/e fertig. generate-story funktioniert mit promptBuilder + CORE Slim.
> Nach jeder PHASE: STOPP und mich testen lassen.
> Vor dem Start: `git add -A && git commit -m "vor Block 2.4"`

---

Lies die ARCHITECTURE.md im Projekt-Root.

## Gesamtaufgabe: Block 2.4

Das Bild-Generierungssystem wird komplett neu aufgebaut:
1. LLM generiert einen strukturierten **Bild-Plan** (character_anchor, world_anchor, scenes) zusammen mit der Story
2. Neues Modul **imagePromptBuilder.ts** baut aus dem Plan + DB-Stil-Rules die finalen Bild-Prompts
3. Bilder werden **parallel** generiert (Promise.allSettled) statt sequenziell
4. Bilder zeigen **Story-Progression** (verschiedene Szenen, nicht 3x dasselbe)
5. Bilder sind **kohärent** (gleicher Stil, gleiche Figuren über alle Bilder)
6. Bilder sind **altersgerecht** und passen zum **Theme/Rubrik**
7. **Kein Text/Buchstaben** in Bildern

**WICHTIG: Lovable Gateway bleibt der primäre Bildgenerator.** Gemini Image API ist in der EU blockiert. Der bestehende Fallback (Gemini → Lovable Gateway) funktioniert, aber Lovable Gateway ist de facto der einzige funktionierende Pfad. Behalte den Fallback-Mechanismus bei, aber optimiere für Lovable Gateway als primär.

**PERF Baseline (vor Block 2.4):**
| Schritt | Dauer |
|---------|-------|
| Story LLM | ~11.5s |
| Consistency Check | ~16s |
| Image prompt build | ~2s |
| Image generation (1 Bild, sequenziell) | ~28s |
| **TOTAL** | ~42s |

Ziel nach Block 2.4: ~30s für Story + Consistency + **4 Bilder** (statt 1).

**PERF-Logging existiert bereits** in generate-story/index.ts (Suche nach `[PERF]`). Behalte es bei und erweitere es wo nötig.

Arbeite die folgenden 5 Phasen NACHEINANDER ab. Nach jeder Phase: STOPP und warten.

---

## ════════════════════════════════════════
## PHASE 1: DB-Erweiterungen + Daten befüllen
## ════════════════════════════════════════

### 1.1 theme_rules erweitern

```sql
ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_style_prompt text;
ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_negative_prompt text;
ALTER TABLE theme_rules ADD COLUMN IF NOT EXISTS image_color_palette text;
```

Daten befüllen. Bild-Prompts sind IMMER auf Englisch (sprachunabhängig). Setze für ALLE Sprach-Varianten einer theme_key den gleichen Wert.

Finde zuerst heraus welche theme_keys in der Tabelle existieren:
```sql
SELECT DISTINCT theme_key FROM theme_rules;
```

Dann befülle sie passend. Hier Beispiele für typische Keys (passe die WHERE-Clause an die tatsächlichen Keys an):

```sql
-- Fantasy / Abenteuer / Magie
UPDATE theme_rules SET 
  image_style_prompt = 'Magical fairy-tale illustration, enchanted atmosphere, glowing mystical elements, storybook aesthetic, soft dreamy lighting, children book watercolor style',
  image_negative_prompt = 'realistic photo, dark horror, blood, violence, scary monsters, text, letters, words, writing',
  image_color_palette = 'Deep purples, emerald greens, gold accents, moonlight silver, warm amber'
WHERE theme_key IN ('fantasy', 'adventure', 'abenteuer', 'fantaisie', 'aventure', 'magic', 'magie');

-- Tiere / Natur
UPDATE theme_rules SET 
  image_style_prompt = 'Warm nature illustration, friendly expressive animals, natural habitats, soft golden lighting, children book style, gentle atmosphere',
  image_negative_prompt = 'realistic photo, taxidermy, hunting, blood, scary predators, text, letters, words, writing',
  image_color_palette = 'Forest greens, warm browns, sky blues, sunflower yellows, soft earth tones'
WHERE theme_key IN ('animals', 'tiere', 'animaux', 'nature', 'natur');

-- Alltag / Slice of Life
UPDATE theme_rules SET 
  image_style_prompt = 'Cozy slice-of-life illustration, warm domestic scenes, familiar everyday settings, gentle lighting, relatable details, children book aesthetic',
  image_negative_prompt = 'fantasy elements, monsters, weapons, dark atmosphere, text, letters, words, writing',
  image_color_palette = 'Warm pastels, cozy oranges, soft blues, cream whites, gentle pinks'
WHERE theme_key IN ('everyday', 'alltag', 'quotidien', 'daily', 'school', 'schule', 'école');

-- Humor / Lustig
UPDATE theme_rules SET 
  image_style_prompt = 'Playful cartoon-inspired illustration, exaggerated funny expressions, bright cheerful colors, whimsical details, comic book energy, children book style',
  image_negative_prompt = 'realistic photo, dark mood, scary, serious atmosphere, text, letters, words, writing',
  image_color_palette = 'Bright primaries, candy pinks, lime greens, sunny yellows, sky blues'
WHERE theme_key IN ('humor', 'funny', 'lustig', 'humour', 'drôle');

-- Wissen / Sachtext / Bildung
UPDATE theme_rules SET 
  image_style_prompt = 'Clear educational illustration, accurate but artistic details, curiosity-inspiring, bright and clean, children book infographic style',
  image_negative_prompt = 'fantasy creatures, magic, dark atmosphere, text, letters, words, writing',
  image_color_palette = 'Clean blues, natural greens, warm whites, accent oranges, clear yellows'
WHERE theme_key IN ('educational', 'science', 'wissen', 'éducatif', 'sachtext');

-- Für alle die NULL geblieben sind: Default setzen
UPDATE theme_rules SET 
  image_style_prompt = 'Warm children book illustration, soft lighting, friendly atmosphere, storybook aesthetic, watercolor style',
  image_negative_prompt = 'realistic photo, scary, violence, text, letters, words, writing',
  image_color_palette = 'Warm pastels, soft blues, gentle greens, cream whites'
WHERE image_style_prompt IS NULL;
```

### 1.2 image_style_rules erweitern

```sql
ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS character_style text;
ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS complexity_level text;
ALTER TABLE image_style_rules ADD COLUMN IF NOT EXISTS forbidden_elements text;
```

Finde zuerst die bestehenden Einträge:
```sql
SELECT id, age_group, theme_key FROM image_style_rules;
```

Dann befülle nach Altersgruppe:

```sql
-- 4-6 Jahre: Bilderbuch-Stil, süß, weich, einfach
UPDATE image_style_rules SET 
  character_style = 'Cute chibi-like proportions with oversized heads and big round eyes. Very simple clothing in 1-2 bright primary colors. Characters look adorable and non-threatening. Round soft body shapes. Happy friendly default expression. Simple hairstyles.',
  complexity_level = 'Very simple backgrounds with max 3-4 large elements. Single clear focal point. Flat colors, minimal shading. No perspective tricks. Large objects, no tiny details. Bright even lighting everywhere.',
  forbidden_elements = 'Scary shadows, sharp teeth, blood, weapons, skeletons, realistic fire, dark scenes, crying faces, aggressive expressions, complex textures, small details, dramatic lighting, menacing poses'
WHERE age_group IN ('4-6', '4-7', '6-7');

-- 7-9 Jahre: Cartoon/Comic-Stil, dynamisch, cool, abenteuerlich
UPDATE image_style_rules SET 
  character_style = 'Proportionate but stylized cartoon characters. Confident dynamic poses — running, jumping, pointing, exploring. Cool expressive faces showing determination and excitement. Detailed colorful clothing with personality (backpacks, sneakers, goggles, capes). Characters look capable and adventurous, NOT babyish. Styled hair, individual features.',
  complexity_level = 'Detailed cartoon backgrounds with 5-7 elements and depth. Dynamic angles allowed (slight low-angle for heroic feel). Action lines and movement effects welcome. Rich colors with good contrast. Dramatic but not dark lighting. Layered scenes with foreground and background.',
  forbidden_elements = 'Gore, weapons aimed at people, very dark scenes without any light source, realistic violence, overly cute/babyish proportions'
WHERE age_group IN ('7-9', '8-9', '8-10');

-- 10-12 Jahre: Semi-realistisch, atmosphärisch, Graphic Novel Einfluss
UPDATE image_style_rules SET 
  character_style = 'Semi-realistic proportions like graphic novel or anime style. Characters look like real pre-teens — cool, independent, with attitude. Nuanced facial expressions showing complex emotions (curiosity mixed with doubt, bravery mixed with fear). Detailed individual clothing reflecting personality and style. Realistic hairstyles. Characters can look serious, thoughtful, or intense — not just happy.',
  complexity_level = 'Rich cinematic backgrounds with atmospheric lighting and mood. Complex layered compositions with depth of field effect. Dramatic camera angles (low angle, birds eye, close-up). Sophisticated color palettes with gradients and shadows. Weather effects (rain, fog, golden hour) welcome. Environmental storytelling through background details.',
  forbidden_elements = 'Gore, explicit violence, overly sexualized poses, graphic injury, childish/babyish art style, oversimplified characters'
WHERE age_group IN ('10-12', '10-13', '11-12');

-- Alles was NULL geblieben ist: Default (8 Jahre Stil)
UPDATE image_style_rules SET 
  character_style = 'Proportionate cartoon characters with confident poses. Cool and adventurous, not babyish. Expressive faces with personality.',
  complexity_level = 'Detailed backgrounds with depth. Dynamic composition. Rich colors with contrast.',
  forbidden_elements = 'Gore, weapons, very dark scenes, realistic violence, overly cute proportions'
WHERE character_style IS NULL;
```

### 1.3 stories Tabelle prüfen

Prüfe ob `story_images` auf der stories Tabelle ein Array-Feld ist (text[] oder jsonb). Es sollte bereits existieren. Falls nicht:

```sql
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_images text[] DEFAULT '{}';
```

Prüfe auch ob es ein Feld für die Anzahl generierter Bilder gibt. Falls nicht:
```sql
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_count integer DEFAULT 1;
```

### PHASE 1 — STOPP

Sage mir: "Phase 1 fertig. DB-Erweiterungen + Daten für theme_rules und image_style_rules. App starten und testen."

**Mein Test:**
- [ ] `npm run dev` startet ohne Fehler
- [ ] In Supabase: theme_rules hat image_style_prompt, image_negative_prompt, image_color_palette befüllt
- [ ] In Supabase: image_style_rules hat character_style, complexity_level, forbidden_elements befüllt
- [ ] stories hat story_images und image_count Felder
- [ ] Bestehende Story-Generierung funktioniert noch (keine Regression)

**Wenn OK → ich sage "weiter" → dann Phase 2.**

---

## ════════════════════════════════════════
## PHASE 2: CORE Slim Prompt + promptBuilder erweitern
## ════════════════════════════════════════

### 2.1 image_plan zum LLM Output-Format hinzufügen

Der CORE Slim Prompt (in app_settings als `system_prompt_core_v2`) definiert das JSON Output-Format. Erweitere es um `image_plan`.

Finde den Prompt in der DB:
```sql
SELECT value FROM app_settings WHERE key = 'system_prompt_core_v2';
```

Füge dem Prompt eine neue Sektion hinzu (VOR dem bestehenden Output-Format-Block oder als Teil davon):

```
## IMAGE PLAN
Generate an image_plan for each story. ALL image descriptions must be in ENGLISH regardless of the story language.

- character_anchor: Visual description of the main character(s) in English.
  Include 3-4 features: approximate age appearance, hair, clothing with colors, 1 distinctive object or trait.
  Max 50 words per character. This description will be copied identically into every image prompt for consistency.

- world_anchor: Visual description of the story world/environment in English.
  Include: time of day, lighting quality, color mood, key environmental features.
  Max 40 words. Must be consistent across all scenes (unless the story requires a location change).

- scenes: Array of scene descriptions. Number of scenes is specified in the dynamic context.
  Each scene in English, max 60 words.
  Rules:
    - Each scene must show a DIFFERENT moment with different action and emotion
    - Scenes together must tell the visual story arc (beginning tension → middle conflict → ending resolution)
    - NEVER describe text, signs, books with readable text, or labels in scenes
    - NEVER describe the same pose or setting twice
    - Each scene must have at least 1 new visual element not in other scenes
```

Erweitere das Output-Format JSON um image_plan:

```json
{
  "title": "...",
  "content": "...",
  "image_plan": {
    "character_anchor": "English visual description of main character(s). Max 50 words.",
    "world_anchor": "English visual description of the world/setting. Max 40 words.",
    "scenes": [
      {
        "scene_id": 1,
        "story_position": "beginning",
        "description": "English. What exactly is visible: action, body posture, surroundings. Max 60 words.",
        "emotion": "Character's emotional expression",
        "key_elements": ["element1", "element2", "element3"]
      }
    ]
  },
  "questions": [...],
  "vocabulary": [...],
  ...rest of existing format...
}
```

### 2.2 promptBuilder.ts — Szenen-Anzahl im dynamischen Kontext mitgeben

Öffne `supabase/functions/_shared/promptBuilder.ts`.

Die Anzahl der gewünschten Szenen hängt von der Story-Länge ab. Füge diese Info in den dynamischen User-Message-Prompt ein:

```typescript
// Szenen-Anzahl nach Länge
function getSceneCount(length: string): number {
  switch (length) {
    case 'short': return 1;   // 1 Szene + Cover
    case 'long': return 3;    // 3 Szenen + Cover
    default: return 2;        // 2 Szenen + Cover (medium)
  }
}
```

Füge im dynamischen Prompt einen Abschnitt hinzu:

```typescript
const sceneCount = getSceneCount(request.length || 'medium');

// Zum Prompt hinzufügen:
const imageSection = `## IMAGE PLAN INSTRUCTIONS
Generate exactly ${sceneCount} scenes in the image_plan.
${sceneCount === 1 ? 'Scene should capture the emotional highlight of the story.' : ''}
${sceneCount === 2 ? 'Scene 1: turning point or discovery. Scene 2: resolution or triumph.' : ''}
${sceneCount === 3 ? 'Scene 1: departure/beginning (curiosity). Scene 2: conflict/discovery (tension). Scene 3: resolution/return (joy/relief).' : ''}
All descriptions in ENGLISH. No text, signs, or readable writing in any scene.`;
```

### PHASE 2 — STOPP

Sage mir: "Phase 2 fertig. CORE Slim Prompt erweitert mit image_plan. promptBuilder gibt Szenen-Anzahl mit. App starten und testen."

**Mein Test:**
- [ ] Story generieren → in Supabase Logs prüfen ob LLM-Response jetzt `image_plan` enthält
- [ ] image_plan hat character_anchor (Englisch)
- [ ] image_plan hat world_anchor (Englisch)
- [ ] image_plan hat scenes[] mit korrekter Anzahl (2 bei medium)
- [ ] Scenes sind auf Englisch
- [ ] Scenes unterscheiden sich voneinander
- [ ] Story-Text ist unverändert gut (keine Regression durch das erweiterte Output-Format)

**WICHTIG:** Wenn das LLM keinen image_plan liefert, ist der Prompt nicht klar genug. Sage mir Bescheid, damit wir den Prompt anpassen können.

**Wenn OK → ich sage "weiter" → dann Phase 3.**

---

## ════════════════════════════════════════
## PHASE 3: imagePromptBuilder.ts erstellen
## ════════════════════════════════════════

### 3.1 Neues Shared Module

Erstelle `supabase/functions/_shared/imagePromptBuilder.ts`.

Dieses Modul nimmt den `image_plan` vom LLM + die DB-Stil-Rules und baut daraus die finalen Bild-Prompts.

```typescript
// supabase/functions/_shared/imagePromptBuilder.ts

interface ImagePlan {
  character_anchor: string;
  world_anchor: string;
  scenes: Array<{
    scene_id: number;
    story_position: string;
    description: string;
    emotion: string;
    key_elements: string[];
  }>;
}

interface ImageStyleRules {
  style_prompt?: string;
  negative_prompt?: string;
  color_palette?: string;
  character_style?: string;
  complexity_level?: string;
  forbidden_elements?: string;
}

interface ThemeImageRules {
  image_style_prompt?: string;
  image_negative_prompt?: string;
  image_color_palette?: string;
}

interface ImagePromptResult {
  prompt: string;
  negative_prompt: string;
  label: string;  // 'cover' | 'scene_1' | 'scene_2' | 'scene_3'
}

const NO_TEXT_INSTRUCTION = 'NO TEXT, NO LETTERS, NO WORDS, NO WRITING, NO NUMBERS, NO SIGNS, NO LABELS, NO CAPTIONS, NO SPEECH BUBBLES anywhere in the image.';

/**
 * Alters-spezifischer Stil-Modifier basierend auf dem EXAKTEN Alter des Kindes.
 * Die DB liefert grobe Altersgruppen (4-6, 7-9, 10-12), aber ein 6-Jähriger
 * soll andere Bilder sehen als ein 9-Jähriger.
 */
function getAgeModifier(age: number): string {
  if (age <= 5) return 'Art style: soft picture book for very young children. Extremely cute, round, simple. Bright cheerful colors. Everything looks safe and friendly.';
  if (age === 6) return 'Art style: colorful picture book illustration. Cute but not babyish. Friendly characters with big eyes. Warm bright colors.';
  if (age === 7) return 'Art style: modern children book illustration. Characters look capable and curious. Slightly dynamic poses. Vibrant rich colors.';
  if (age === 8) return 'Art style: adventure cartoon illustration. Characters look confident and cool. Action-ready poses. Bold dynamic colors with good contrast. NOT cute or babyish.';
  if (age === 9) return 'Art style: detailed cartoon with comic book influence. Characters look brave and independent. Dynamic exciting compositions. Strong confident expressions. Cool factor high.';
  if (age === 10) return 'Art style: graphic novel illustration. Characters look like real pre-teens with attitude and personality. Atmospheric moody lighting. Sophisticated color palette. Cinematic compositions.';
  if (age === 11) return 'Art style: young adult graphic novel. Semi-realistic characters with individual style. Dramatic lighting and angles. Complex emotions visible. Cool and mature aesthetic.';
  return 'Art style: young adult illustration. Realistic proportions, atmospheric, cinematic. Characters look like teenagers. Sophisticated visual storytelling.'; // 12+
}

/**
 * Baut die finalen Bild-Prompts aus image_plan + DB-Rules
 */
export function buildImagePrompts(
  imagePlan: ImagePlan,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
  childAge: number,  // EXAKTES Alter des Kindes
): ImagePromptResult[] {
  const results: ImagePromptResult[] = [];
  
  // ═══ Alters-Modifier (feingranular, pro Jahr) ═══
  const ageModifier = getAgeModifier(childAge);
  
  // ═══ Gemeinsame Stil-Teile (für ALLE Bilder gleich) ═══
  const styleBlock = [
    ageModifier,  // ← WICHTIG: Alters-Modifier zuerst (höchste Priorität)
    themeImageRules.image_style_prompt,
    ageStyleRules.style_prompt,
    ageStyleRules.character_style,
    ageStyleRules.complexity_level,
    themeImageRules.image_color_palette || ageStyleRules.color_palette,
  ].filter(Boolean).join('. ');
  
  const negativeBlock = [
    themeImageRules.image_negative_prompt,
    ageStyleRules.negative_prompt,
    ageStyleRules.forbidden_elements,
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature, blurry, deformed, ugly',
  ].filter(Boolean).join(', ');
  
  // ═══ Cover-Bild (atmosphärisch, keine spezifische Szene) ═══
  const coverPrompt = [
    'Children book cover illustration.',
    `Characters: ${imagePlan.character_anchor}`,
    `Setting: ${imagePlan.world_anchor}`,
    'The character(s) in a calm, inviting pose in their environment. Atmospheric and welcoming.',
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].join('\n');
  
  results.push({
    prompt: coverPrompt,
    negative_prompt: negativeBlock,
    label: 'cover',
  });
  
  // ═══ Szenen-Bilder (je 1-3, zeigen Handlungsbogen) ═══
  for (const scene of imagePlan.scenes) {
    const scenePrompt = [
      'Children book illustration, interior page.',
      `Characters: ${imagePlan.character_anchor}`,
      `Setting: ${imagePlan.world_anchor}`,
      `Scene: ${scene.description}`,
      `Emotional expression: ${scene.emotion}`,
      `Style: ${styleBlock}`,
      NO_TEXT_INSTRUCTION,
    ].join('\n');
    
    results.push({
      prompt: scenePrompt,
      negative_prompt: negativeBlock,
      label: `scene_${scene.scene_id}`,
    });
  }
  
  return results;
}

/**
 * Fallback: Wenn kein image_plan vorhanden, baue einen einfachen Prompt
 * aus dem Story-Text (bisheriges Verhalten)
 */
export function buildFallbackImagePrompt(
  storyTitle: string,
  characterDescription: string,
  ageStyleRules: ImageStyleRules,
  themeImageRules: ThemeImageRules,
): ImagePromptResult {
  const styleBlock = [
    themeImageRules.image_style_prompt,
    ageStyleRules.style_prompt,
    ageStyleRules.character_style,
  ].filter(Boolean).join('. ');
  
  const negativeBlock = [
    themeImageRules.image_negative_prompt,
    ageStyleRules.negative_prompt,
    ageStyleRules.forbidden_elements,
    'text, letters, words, writing, labels, captions, speech bubbles, watermark, signature',
  ].filter(Boolean).join(', ');
  
  const prompt = [
    'Children book cover illustration.',
    characterDescription,
    `Title theme: ${storyTitle}`,
    `Style: ${styleBlock}`,
    NO_TEXT_INSTRUCTION,
  ].join('\n');
  
  return {
    prompt,
    negative_prompt: negativeBlock,
    label: 'cover',
  };
}
```

### 3.2 DB-Queries in imagePromptBuilder oder generate-story

Die DB-Rules müssen geladen werden bevor `buildImagePrompts()` aufgerufen wird. Füge eine Hilfsfunktion hinzu (entweder in imagePromptBuilder.ts oder in generate-story):

```typescript
export async function loadImageRules(
  supabase: any,
  ageGroup: string,
  themeKey: string | null,
  language: string,
): Promise<{ ageRules: ImageStyleRules; themeRules: ThemeImageRules }> {
  
  // 1. image_style_rules nach Altersgruppe laden
  const { data: ageData } = await supabase
    .from('image_style_rules')
    .select('*')
    .eq('age_group', ageGroup)
    .maybeSingle();
  
  // 2. theme_rules image-Spalten laden (nach theme_key + language)
  let themeData = null;
  if (themeKey) {
    const { data } = await supabase
      .from('theme_rules')
      .select('image_style_prompt, image_negative_prompt, image_color_palette')
      .eq('theme_key', themeKey)
      .eq('language', language)
      .maybeSingle();
    themeData = data;
  }
  
  return {
    ageRules: ageData || {},
    themeRules: themeData || {},
  };
}
```

### PHASE 3 — STOPP

Sage mir: "Phase 3 fertig. imagePromptBuilder.ts erstellt mit buildImagePrompts(), buildFallbackImagePrompt(), und loadImageRules(). App starten und testen."

**Mein Test:**
- [ ] Datei existiert unter supabase/functions/_shared/imagePromptBuilder.ts
- [ ] TypeScript kompiliert ohne Fehler
- [ ] Keine Regression in bestehender Funktionalität

**Wenn OK → ich sage "weiter" → dann Phase 4.**

---

## ════════════════════════════════════════
## PHASE 4: generate-story Bild-Logik umbauen
## ════════════════════════════════════════

Dies ist die Kernphase. Der bisherige Bild-Generierungscode in `generate-story/index.ts` wird ersetzt.

### 4.1 ZUERST: Aktuellen Bild-Code analysieren

Öffne `generate-story/index.ts`. Finde und analysiere:

1. Wo wird aktuell der Bild-Prompt gebaut? (Suche nach "image", "cover", "character description")
2. Wo wird Gemini Image API / Lovable Gateway aufgerufen?
3. Wie wird das Bild-Ergebnis in die stories Tabelle geschrieben?
4. Wie funktioniert der image_cache (Prompt-Hash)?
5. Was ist der Fallback-Mechanismus (Gemini → Lovable Gateway)?

Dokumentiere kurz (als Kommentar) was du gefunden hast, bevor du Änderungen machst.

### 4.2 image_plan aus LLM-Response parsen

Erweitere den bestehenden LLM-Response-Parser (der bereits title, content, questions, vocabulary, classifications extrahiert):

```typescript
// image_plan aus der LLM-Response extrahieren
let imagePlan = null;
try {
  if (parsedResponse.image_plan) {
    imagePlan = parsedResponse.image_plan;
    console.log('[generate-story] image_plan extracted:', 
      `character_anchor: ${imagePlan.character_anchor?.substring(0, 50)}...`,
      `world_anchor: ${imagePlan.world_anchor?.substring(0, 50)}...`,
      `scenes: ${imagePlan.scenes?.length || 0}`
    );
  } else {
    console.log('[generate-story] No image_plan in LLM response, using fallback');
  }
} catch (e) {
  console.error('[generate-story] Error parsing image_plan:', e);
}
```

### 4.3 Image Rules laden

Nach dem LLM-Response-Parsing, lade die Bild-Stil-Rules:

```typescript
import { buildImagePrompts, buildFallbackImagePrompt, loadImageRules } from '../_shared/imagePromptBuilder.ts';

// Bestimme age_group aus kidProfile.age
function getAgeGroup(age: number): string {
  if (age <= 6) return '4-6';  // Passe an die tatsächlichen age_group Werte in der DB an!
  if (age <= 9) return '7-9';
  return '10-12';
}

const ageGroup = getAgeGroup(kidProfile.age);
const { ageRules, themeRules } = await loadImageRules(
  supabaseClient,
  ageGroup,
  storyRequest.storyType || null,
  storyRequest.story_language || 'fr'
);
```

### 4.4 Bild-Prompts bauen

```typescript
let imagePrompts: ImagePromptResult[];

if (imagePlan && imagePlan.character_anchor && imagePlan.scenes?.length > 0) {
  // ═══ NEUER WEG: Strukturierter Bild-Plan ═══
  console.log('[generate-story] Using NEW image path: structured image_plan');
  imagePrompts = buildImagePrompts(imagePlan, ageRules, themeRules, kidProfile.age);
} else {
  // ═══ FALLBACK: Einfacher Cover-Prompt (bisheriges Verhalten) ═══
  console.log('[generate-story] Using FALLBACK image path: simple cover prompt');
  const fallbackPrompt = buildFallbackImagePrompt(
    parsedResponse.title,
    characterDescription,  // bestehende character_description Variable
    ageRules,
    themeRules,
  );
  imagePrompts = [fallbackPrompt];
}

console.log('[generate-story] Image prompts built:', imagePrompts.length, 
  'prompts:', imagePrompts.map(p => p.label).join(', '));
```

### 4.5 Parallele Bild-Generierung

Ersetze den bisherigen sequenziellen Bild-Code durch parallele Ausführung:

```typescript
// ═══ Alle Bilder PARALLEL generieren ═══
const imageGenerationStart = Date.now();

const imageResults = await Promise.allSettled(
  imagePrompts.map(async (imgPrompt) => {
    const startTime = Date.now();
    
    // 1. Cache prüfen (bestehende Logik wiederverwenden)
    const promptHash = generateHash(imgPrompt.prompt);
    const cached = await checkImageCache(supabaseClient, promptHash);
    if (cached) {
      console.log(`[generate-story] Cache HIT for ${imgPrompt.label}: ${promptHash}`);
      return { label: imgPrompt.label, url: cached, cached: true };
    }
    console.log(`[generate-story] Cache MISS for ${imgPrompt.label}: ${promptHash}`);
    
    // 2. Bild generieren (bestehende Fallback-Kette: Gemini → Lovable Gateway)
    // WICHTIG: Nutze die BESTEHENDE Funktion zum Bild-Generieren!
    // Passe nur den Prompt an (imgPrompt.prompt statt dem alten Prompt)
    let imageUrl: string | null = null;
    
    try {
      // Versuche Gemini (wird in EU fehlschlagen, aber lass den Versuch drin)
      imageUrl = await generateImageWithGemini(imgPrompt.prompt, imgPrompt.negative_prompt);
    } catch (geminiError) {
      console.log(`[generate-story] Gemini failed for ${imgPrompt.label}, trying Lovable Gateway`);
    }
    
    if (!imageUrl) {
      try {
        // Lovable Gateway als Fallback (de facto primär in EU)
        imageUrl = await generateImageWithLovable(imgPrompt.prompt);
      } catch (lovableError) {
        console.error(`[generate-story] Lovable Gateway failed for ${imgPrompt.label}:`, lovableError);
      }
    }
    
    if (imageUrl) {
      // Cache speichern
      await cacheImage(supabaseClient, promptHash, imageUrl);
      console.log(`[generate-story] Image generated for ${imgPrompt.label} in ${Date.now() - startTime}ms`);
    }
    
    return { label: imgPrompt.label, url: imageUrl, cached: false };
  })
);

const imageGenerationTime = Date.now() - imageGenerationStart;
console.log(`[generate-story] All images generated in ${imageGenerationTime}ms (parallel)`);
```

**WICHTIG:** Finde die BESTEHENDEN Funktionen zum Bild-Generieren (Gemini API Call, Lovable Gateway Call) und rufe diese wieder. NICHT neu schreiben, nur den Prompt austauschen. Die Funktionen heißen vermutlich anders als oben — passe die Namen an.

### 4.6 Ergebnisse verarbeiten

```typescript
// Ergebnisse sortieren
let coverImageUrl: string | null = null;
const storyImageUrls: string[] = [];

for (const result of imageResults) {
  if (result.status === 'fulfilled' && result.value.url) {
    if (result.value.label === 'cover') {
      coverImageUrl = result.value.url;
    } else {
      storyImageUrls.push(result.value.url);
    }
  } else if (result.status === 'rejected') {
    console.error('[generate-story] Image generation failed:', result.reason);
  }
}

// Fallback: Wenn Cover fehlgeschlagen aber Scene-Bilder existieren → erstes Scene-Bild als Cover
if (!coverImageUrl && storyImageUrls.length > 0) {
  coverImageUrl = storyImageUrls[0];
  console.log('[generate-story] Using first scene image as cover fallback');
}

console.log(`[generate-story] Final images: cover=${!!coverImageUrl}, scenes=${storyImageUrls.length}`);
```

### 4.7 In stories Tabelle speichern

Passe den bestehenden INSERT/UPDATE auf die stories Tabelle an:

```typescript
// Bestehende Felder beibehalten, NEUE hinzufügen:
{
  // ... alle bestehenden Felder ...
  cover_image_url: coverImageUrl,
  story_images: storyImageUrls,        // NEU: Array von Scene-Bild-URLs
  image_count: 1 + storyImageUrls.length,  // NEU: Cover + Scenes
}
```

### 4.8 Consistency Check PARALLEL zu Bildern

WICHTIG: Aktuell laufen Consistency Check und Bild-Generierung teilweise sequenziell. Beide brauchen den Story-Text als Input, sind aber unabhängig voneinander. Sie sollen GLEICHZEITIG starten.

Finde die Stelle wo nach der Story-Generierung der Consistency Check und die Bild-Generierung aufgerufen werden. Refaktoriere so:

```typescript
// ═══ NACH dem Story-LLM-Call: Consistency + Bilder PARALLEL ═══
const parallelStart = Date.now();

const [consistencyResult, imageResults] = await Promise.allSettled([
  // Task 1: Consistency Check
  runConsistencyCheck(storyContent, storyLanguage, ageMin, ageMax, seriesContext),
  
  // Task 2: Alle Bilder parallel generieren
  generateAllImagesParallel(imagePrompts, supabaseClient),
]);

console.log(`[generate-story] [PERF] Parallel block (consistency + images): ${Date.now() - parallelStart}ms`);

// Consistency-Ergebnis auswerten
if (consistencyResult.status === 'fulfilled') {
  // Korrekturen anwenden falls nötig (bestehende Logik)
} else {
  console.error('[generate-story] Consistency check failed:', consistencyResult.reason);
  // Story trotzdem behalten
}

// Bild-Ergebnisse auswerten (wie in 4.6 beschrieben)
if (imageResults.status === 'fulfilled') {
  // Cover + Scenes zuweisen
} else {
  console.error('[generate-story] Image generation failed:', imageResults.reason);
  // Story trotzdem speichern, ohne Bilder
}
```

Damit ergibt sich dieses Timing:
```
Story LLM:       ████████████ ~12s
                      |
          ┌───────────┴───────────┐
Consistency: ████████ ~8s         |  ← parallel
Images (4x): ██████████████ ~28s  |  ← parallel
          └───────────┬───────────┘
                      |
Total:     ████████████████████████ ~40s für 4 Bilder statt 42s für 1 Bild!
```

### 4.9 Timeout-Schutz

Wrape den gesamten Parallel-Block in einen Timeout:

```typescript
const PARALLEL_TIMEOUT_MS = 60000; // 60 Sekunden für Consistency + ALLE Bilder zusammen

try {
  const results = await Promise.race([
    Promise.allSettled([
      runConsistencyCheck(...),
      generateAllImagesParallel(imagePrompts, supabaseClient),
    ]),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Parallel block timeout')), PARALLEL_TIMEOUT_MS)
    ),
  ]);
} catch (timeoutError) {
  console.error('[generate-story] Parallel block timed out after 60s');
  // Story trotzdem speichern, ohne Korrekturen und ohne Bilder
}
```

### PHASE 4 — STOPP

Sage mir: "Phase 4 fertig. Bild-Generierung umgebaut: image_plan Parsing, imagePromptBuilder Integration, parallele Generierung. App starten und testen."

**Mein Test:**
- [ ] Story generieren (medium) → Console/Supabase Logs prüfen
- [ ] Log: "Using NEW image path: structured image_plan" (oder FALLBACK)
- [ ] Log: "Image prompts built: 3 prompts: cover, scene_1, scene_2"
- [ ] Log: "All images generated in Xms (parallel)"
- [ ] Log: "Parallel block (consistency + images): Xms" — muss KÜRZER sein als Consistency + Images einzeln!
- [ ] Cover-Bild wird angezeigt in der App
- [ ] In Supabase → stories: cover_image_url ist befüllt
- [ ] In Supabase → stories: story_images hat 1-3 URLs (je nach Länge)
- [ ] In Supabase → stories: image_count ist korrekt (z.B. 3 bei medium)
- [ ] Story "kurz" generieren → 1 Scene + Cover = 2 Bilder
- [ ] Story "lang" generieren → 3 Scenes + Cover = 4 Bilder
- [ ] Bei Bild-Fehler: Story wird trotzdem gespeichert (kein Crash)
- [ ] Performance: PERF TOTAL soll ~30-40s sein (für 4 Bilder statt vorher 42s für 1 Bild)
- [ ] Consistency Check Ergebnisse werden weiterhin in consistency_check_results gespeichert
- [ ] ALTERS-TEST: Generiere Story für 6-Jähriges Kind, dann für 10-Jähriges Kind → Bilder müssen DEUTLICH unterschiedlich aussehen (6J: süß/rund/bunt, 10J: cool/atmosphärisch/detailliert)

**WICHTIG:** Wenn die Bilder ALLE fehlschlagen (Lovable Gateway down):
- Story muss trotzdem gespeichert werden
- cover_image_url darf null sein
- App darf nicht crashen

**Wenn OK → ich sage "weiter" → dann Phase 5.**

---

## ════════════════════════════════════════
## PHASE 5: Frontend — Szenen-Bilder in der Story anzeigen
## ════════════════════════════════════════

### 5.1 ReadingPage: Story-Bilder anzeigen

Finde die `ReadingPage.tsx` (oder die Komponente die eine generierte Story anzeigt).

Aktuell wird nur das Cover-Bild (`cover_image_url`) angezeigt. Erweitere die Anzeige um die Scene-Bilder (`story_images[]`).

### 5.2 Bilder im Text-Flow einbetten

Die Scene-Bilder sollen **zwischen den Absätzen** der Geschichte erscheinen, passend zur Story-Position.

Logik: Teile den Story-Text in gleichmäßige Abschnitte auf und füge die Bilder dazwischen ein.

```typescript
function distributeImagesInText(
  content: string, 
  storyImages: string[]
): Array<{ type: 'text' | 'image'; value: string }> {
  if (!storyImages || storyImages.length === 0) {
    return [{ type: 'text', value: content }];
  }
  
  // Text in Absätze aufteilen (doppelter Zeilenumbruch oder \n\n)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  
  if (paragraphs.length <= 1) {
    // Kurzer Text: Bild am Ende
    return [
      { type: 'text', value: content },
      ...storyImages.map(url => ({ type: 'image' as const, value: url })),
    ];
  }
  
  // Bilder gleichmäßig verteilen
  const result: Array<{ type: 'text' | 'image'; value: string }> = [];
  const imageInterval = Math.floor(paragraphs.length / (storyImages.length + 1));
  
  let imageIndex = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    result.push({ type: 'text', value: paragraphs[i] });
    
    // Nach jedem Intervall ein Bild einfügen
    if (imageIndex < storyImages.length && (i + 1) % imageInterval === 0 && i < paragraphs.length - 1) {
      result.push({ type: 'image', value: storyImages[imageIndex] });
      imageIndex++;
    }
  }
  
  // Restliche Bilder am Ende
  while (imageIndex < storyImages.length) {
    result.push({ type: 'image', value: storyImages[imageIndex] });
    imageIndex++;
  }
  
  return result;
}
```

### 5.3 Bild-Komponente im Text

```tsx
// Im Render-Bereich der ReadingPage:
const contentBlocks = distributeImagesInText(story.content, story.story_images || []);

{contentBlocks.map((block, index) => (
  block.type === 'text' ? (
    <p key={index} className="mb-4 leading-relaxed">
      {/* Bestehende Text-Rendering-Logik (Syllable-Highlighting etc.) */}
      {renderTextContent(block.value)}
    </p>
  ) : (
    <div key={index} className="my-6 flex justify-center">
      <img 
        src={block.value} 
        alt={`Story illustration ${index}`}
        className="rounded-xl shadow-md max-w-full max-h-64 object-contain"
        loading="lazy"
      />
    </div>
  )
))}
```

### 5.4 Cover-Bild Behandlung

Das Cover-Bild (`cover_image_url`) bleibt separat — es wird oben auf der Story-Seite angezeigt, wie bisher. Die Scene-Bilder (`story_images[]`) werden im Text-Flow eingebettet.

### 5.5 Fallback wenn keine Scene-Bilder

Wenn `story_images` leer ist oder null → nur Cover anzeigen, wie bisher. Keine Fehler, kein leerer Platzhalter.

```typescript
const hasSceneImages = story.story_images && story.story_images.length > 0;
```

### 5.6 Story-Karte (Übersicht/Grid)

Wenn Stories in einer Übersichtsliste/Grid angezeigt werden, zeige weiterhin nur das Cover-Bild. Die Scene-Bilder erscheinen nur beim Lesen der Story.

### PHASE 5 — STOPP

Sage mir: "Phase 5 fertig. Frontend zeigt Scene-Bilder im Text-Flow an. App starten und testen."

**Mein Test:**
- [ ] Neue Story generieren (medium) → öffnen → Cover oben + 2 Scene-Bilder im Text
- [ ] Bilder sind ZWISCHEN den Absätzen eingebettet (nicht alle am Ende)
- [ ] Bilder sind responsive (passen sich an Bildschirmbreite an)
- [ ] Bilder laden lazy (laden erst wenn sichtbar)
- [ ] Alte Stories (ohne story_images) zeigen weiterhin nur Cover-Bild
- [ ] Kurze Story: 1 Scene-Bild im Text
- [ ] Lange Story: 3 Scene-Bilder im Text
- [ ] Story ohne Bilder: Kein Fehler, Text wird normal angezeigt
- [ ] Story-Grid/Übersicht: Zeigt nur Cover-Bild

---

## NACH ALLEN 5 PHASEN

Aktualisiere ARCHITECTURE.md mit:
- Neues Shared Module: imagePromptBuilder.ts
- Erweitertes Output-Format: image_plan
- Erweiterte DB-Spalten: theme_rules (image_*), image_style_rules (character_style, complexity_level, forbidden_elements)
- Parallele Bild-Generierung (Promise.allSettled)
- Frontend: Scene-Bilder im Text-Flow
- Bildanzahl nach Länge: short=1+1, medium=1+2, long=1+3

---

## NICHT ÄNDERN

- ❌ Bestehende Gemini → Lovable Gateway Fallback-Kette (nur Prompts austauschen)
- ❌ image_cache Logik (weiter nutzen)
- ❌ Text-Generierung (LLM Call für Story-Text)
- ❌ Wizard (Block 2.3d/e)
- ❌ Gamification
- ❌ Audio/TTS

---

## RED FLAGS

- ❌ Alle Bilder sehen gleich aus → character_anchor/world_anchor wird nicht in JEDEN Prompt kopiert
- ❌ Text/Buchstaben in Bildern → NO_TEXT_INSTRUCTION fehlt im Prompt
- ❌ Bilder passen nicht zum Theme → theme_rules.image_style_prompt wird nicht geladen
- ❌ Bilder sind gruselig für 6-Jährige → image_style_rules.forbidden_elements wird nicht in negative_prompt eingefügt
- ❌ Story wird nicht gespeichert wenn Bilder fehlschlagen → Timeout/Error-Handling falsch
- ❌ Performance schlechter als vorher → Promise.allSettled nicht korrekt (Bilder werden doch sequenziell generiert)
- ❌ LLM liefert keinen image_plan → Fallback auf alten Weg prüfen
