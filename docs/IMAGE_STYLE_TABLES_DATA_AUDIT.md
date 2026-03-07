# AUDIT: Image style tables — schema, queries, and full content from migrations

**No code changes.** This doc gives (1) correct column names and SQL you can run in Supabase, and (2) the **full text content** as defined in migrations (so you see what feeds into image prompts). If your DB was modified after migrations, run the queries in Supabase Dashboard to see current data.

---

## 1. Column names (from migrations)

- **image_styles:** `style_key` (not `key`), `is_active` (not `active`). Columns: `style_key`, `imagen_prompt_snippet`, `age_modifiers` (jsonb), `negative_prompt`, `consistency_suffix`, `is_active`, …
- **image_style_rules:** `age_group`, `theme_key`, `style_prompt`, `negative_prompt`, `color_palette`, `art_style`, plus optional `character_style`, `complexity_level`, `forbidden_elements`.
- **theme_rules:** `theme_key`, `language`, `image_style_prompt`, `image_negative_prompt`, `image_color_palette` (added in Block 2.4 migration).

---

## 2. Queries to run in Supabase (SQL Editor)

Use these as-is. If a column is missing in your project, run the `information_schema` query for that table and adjust.

```sql
-- 1) image_styles (active only; order by style_key)
SELECT style_key, imagen_prompt_snippet, age_modifiers, negative_prompt, consistency_suffix
FROM image_styles
WHERE is_active = true
ORDER BY style_key;
```

```sql
-- 2) image_style_rules (all rows)
SELECT *
FROM image_style_rules
ORDER BY age_group, theme_key;
```

```sql
-- 3) theme_rules
-- If you get "column image_style_prompt does not exist", use: SELECT * FROM theme_rules ORDER BY theme_key, language;
SELECT theme_key, language, image_style_prompt, image_negative_prompt, image_color_palette
FROM theme_rules
WHERE image_style_prompt IS NOT NULL AND image_style_prompt != ''
ORDER BY theme_key, language;
```

If a query fails (e.g. column does not exist), run:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'image_styles'
ORDER BY ordinal_position;
```

(Replace `image_styles` with `image_style_rules` or `theme_rules` as needed.)

---

## 3. Full content from migrations (what the seeds set)

Below is the **exact text** from migrations for the columns that feed into image prompt style. This is the “default” content; your DB may have been updated since.

---

### 3.1 image_styles (style_key, imagen_prompt_snippet, age_modifiers, negative_prompt, consistency_suffix)

**Table:** `image_styles`. Filter: `is_active = true`. Columns used in prompt building: `imagen_prompt_snippet`, `age_modifiers` (by age group, e.g. 6-7, 8-9, 10-11), `negative_prompt`, `consistency_suffix`.

| style_key | imagen_prompt_snippet | age_modifiers (excerpt) | negative_prompt | consistency_suffix |
|-----------|------------------------|--------------------------|-----------------|---------------------|
| **storybook_soft** | Soft watercolor picture book illustration, gentle pastel tones, rounded friendly shapes, warm lighting, cozy atmosphere, hand-painted texture, children's book art style. | 6-7: Extra simple composition, very large friendly characters... 8-9: Slightly more background detail... | harsh lines, dark shadows, photorealistic, 3D render, neon colors, pixel art, anime style | Consistent character design across all panels. Same soft brush strokes, same pastel warmth. |
| **storybook_vibrant** | Vibrant colorful children's book illustration, bold saturated colors, dynamic compositions, modern cartoon style, cheerful and energetic, crisp clean lines, playful atmosphere. | 6-7: Bright primary colors, very simple backgrounds... 8-9: Rich color palette, more dynamic poses... | muted colors, photorealistic, 3D render, dark atmosphere, horror, gritty, washed out | Consistent character design across all panels. Same vibrant palette, same bold outlines. |
| **manga_anime** | Anime-style children's illustration, large expressive eyes, dynamic action poses, vibrant cel-shaded colors, manga-inspired composition, emotional expressions, Japanese animation aesthetic. | 8-9: Cute chibi-influenced proportions... 10-11: More mature anime proportions... | photorealistic, oil painting, watercolor, 3D render, Pixar, CGI, western cartoon style | Consistent character design across all panels. Same anime proportions, same eye style, same line art. |
| **adventure_cartoon** | Adventure cartoon illustration, bold outlines, dynamic action compositions, heroic character poses, exciting atmosphere, comic book influence, bright contrasting colors, confident character expressions. | 8-9: Fun adventure style, characters look capable and cool... 10-11: More detailed environments... | photorealistic, dark, gritty, horror, muted colors, 3D render, Pixar, oil painting | Consistent character design across all panels. Same cartoon proportions, same bold colors. |
| **graphic_novel** | Graphic novel illustration style, cinematic compositions, dramatic lighting and shadows, semi-realistic characters with individual style, sophisticated color palette, atmospheric moody scenes, complex emotional expressions, visual storytelling. | 10-11: Mature graphic novel aesthetic... | 3D render, 3D animation, Pixar style, CGI, smooth plastic skin, ray tracing, photorealistic... | Consistent character design across all panels. Same ink line weight, same cel-shaded coloring style. |
| **semi_realistic** | Semi-realistic digital illustration, realistic proportions with artistic stylization, detailed environments, atmospheric lighting, painterly texture, cinematic quality, young adult book illustration style. | 10-11: Young adult illustration aesthetic... | full cartoon, flat colors, pixel art, anime, cel-shaded, abstract, sketch | Consistent character design across all panels. Same level of realism, same lighting style. |
| **3d_adventure** | 3D rendered illustration, Pixar-style, smooth textures, cinematic lighting, vibrant saturated colors, rounded character designs, subsurface scattering on skin, soft ambient occlusion, professional 3D animation quality. | 6-7: Very round and simple character shapes... 8-9: Expressive cartoon-proportioned characters... 10-11: Sophisticated character design... | flat 2D, hand-drawn, sketch, watercolor, pixel art, photorealistic photo, live action | Consistent character design across all panels. Same 3D model style, same material textures, same lighting. |
| **pixel_art** | Pixel art illustration, retro 16-bit video game aesthetic, colorful sprite-style characters, crisp pixel edges, limited color palette per element, nostalgic SNES-era quality, clean pixel placement, vibrant backgrounds with pixel detail. | 6-7: Large chunky pixels, very simple shapes... 8-9: 16-bit sprite quality... 10-11: Detailed 16-bit art... | photorealistic, 3D render, smooth gradients, watercolor, oil painting, high resolution photo | Consistent character design across all panels. Same pixel density, same color palette, same sprite proportions. |
| **brick_block** | Illustration made of colorful interlocking toy bricks, construction toy inspired 3D style, brick-built characters and environments, plastic texture, rounded studs visible on surfaces, playful and creative, bright primary colors. | 6-7: Very simple brick constructions... 8-9: Detailed brick-built characters... 10-11: Complex brick engineering... | photorealistic, smooth surfaces, watercolor, anime, sketch, dark atmosphere | Consistent character design across all panels. Same blocky proportions, same plastic-like material look. |
| **vintage_retro** | Vintage retro illustration, classic European comic ligne claire style, clean uniform outlines, flat colors with subtle shading, muted warm color palette, mid-century illustration feel, clear line technique, nostalgic atmosphere. | 6-7: Very simple clean outlines... 8-9: Classic ligne claire... 10-11: Highly detailed ligne claire... | modern digital art, 3D render, neon colors, pixel art, anime, photorealistic, HDR | Consistent character design across all panels. Same retro grain, same muted color palette, same vintage illustration style. |

*(negative_prompt and consistency_suffix from migration 20260224104412; imagen_prompt_snippet and age_modifiers from 20260217 and 20260218. Later migrations may have changed wording, e.g. “children's book” → “children's illustration” in 20260224_imagen_no_physical_book_prompts.)*

---

### 3.2 image_style_rules (age_group, theme_key, style_prompt, negative_prompt, color_palette, art_style)

**Table:** `image_style_rules`. Used by `loadImageRules()` as **ageRules** (age_group + theme_key NULL for general). theme_key = 'educational' for theme-specific rows.

| age_group | theme_key | style_prompt | negative_prompt | color_palette | art_style |
|-----------|-----------|--------------|-----------------|---------------|-----------|
| 4-6 | NULL | Colorful cartoon style with soft rounded shapes, friendly characters with big expressive eyes, simple backgrounds with bright colors. Similar to Peppa Pig or Bluey style. Warm and inviting atmosphere. | No scary images, no dark shadows, no sharp edges, no realistic proportions, no text or letters, no violence | Warm pastel tones, bright primary colors, soft gradients | Cute cartoon / picture book illustration |
| 7-9 | NULL | Colorful cartoon style, friendly characters with expressive faces, slightly more detailed backgrounds with depth. Similar to Disney Junior or Pixar Junior style. Dynamic poses and action-oriented compositions. | No scary or disturbing imagery, no overly realistic proportions, no text or letters, no violence or blood | Vibrant colors, warm tones, dynamic contrasts | Modern animated movie / comic book style |
| 10-12 | NULL | Semi-realistic illustration style with detailed environments, characters with realistic proportions, dynamic compositions, atmospheric lighting. Similar to graphic novel or manga-inspired art. | No overly childish style, no scary imagery inappropriate for children, no text or letters, no explicit violence | Rich color palette, atmospheric lighting, natural tones with accents | Graphic novel / semi-realistic illustration |
| 4-6 | educational | Clean educational illustration style with accurate but friendly depictions. Clear visual hierarchy, labeled elements where appropriate (without text). Bright and informative. Similar to quality children's encyclopedia. | No scary imagery, no text or letters in the image, no overly abstract representations | Bright educational colors, high contrast for clarity | Children's encyclopedia / friendly infographic |
| 7-9 | educational | Detailed educational illustration with realistic proportions and informative visual elements. Documentary photography inspired. Similar to DK Eyewitness or Usborne educational books. | No text in the image, no overly stylized or inaccurate depictions | Natural colors, educational palette, documentary tones | Educational textbook / documentary illustration |
| 10-12 | educational | Sophisticated documentary illustration style, realistic and accurate, scientific visualization quality. Infographic elements without text. Similar to National Geographic or science magazines for young readers. | No text, no oversimplified depictions, no childish cartoon style | Professional documentary palette, precise natural colors | Scientific illustration / documentary style |

---

### 3.3 theme_rules (theme_key, language, image_style_prompt, image_negative_prompt, image_color_palette)

**Table:** `theme_rules`. Used by `loadImageRules()` as **themeRules** (by theme_key + language). Image columns set in Block 2.4; same values repeated per language in migrations.

| theme_key | (language) | image_style_prompt | image_negative_prompt | image_color_palette |
|-----------|------------|--------------------|------------------------|---------------------|
| fantasy | (all) | Magical fairy-tale illustration, enchanted atmosphere, glowing mystical elements, storybook aesthetic, soft dreamy lighting, children book watercolor style | realistic photo, dark horror, blood, violence, scary monsters, text, letters, words, writing | Deep purples, emerald greens, gold accents, moonlight silver, warm amber |
| action | (all) | Dynamic adventure illustration, exciting action poses, epic landscapes, bold composition, vibrant energy, children book cartoon style | realistic photo, gore, blood, weapons aimed at people, dark horror, text, letters, words, writing | Bold reds, deep blues, sunset oranges, forest greens, golden highlights |
| animals | (all) | Warm nature illustration, friendly expressive animals, natural habitats, soft golden lighting, children book style, gentle atmosphere | realistic photo, taxidermy, hunting, blood, scary predators, text, letters, words, writing | Forest greens, warm browns, sky blues, sunflower yellows, soft earth tones |
| everyday | (all) | Cozy slice-of-life illustration, warm domestic scenes, familiar everyday settings, gentle lighting, relatable details, children book aesthetic | fantasy elements, monsters, weapons, dark atmosphere, text, letters, words, writing | Warm pastels, cozy oranges, soft blues, cream whites, gentle pinks |
| humor | (all) | Playful cartoon-inspired illustration, exaggerated funny expressions, bright cheerful colors, whimsical details, comic book energy, children book style | realistic photo, dark mood, scary, serious atmosphere, text, letters, words, writing | Bright primaries, candy pinks, lime greens, sunny yellows, sky blues |
| educational | (all) | Clear educational illustration, accurate but artistic details, curiosity-inspiring, bright and clean, children book infographic style | fantasy creatures, magic, dark atmosphere, text, letters, words, writing | Clean blues, natural greens, warm whites, accent oranges, clear yellows |
| (fallback) | (all) | Warm children book illustration, soft lighting, friendly atmosphere, storybook aesthetic, watercolor style | realistic photo, scary, violence, text, letters, words, writing | Warm pastels, soft blues, gentle greens, cream whites |

---

## 4. How to get your live data

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Paste and run each of the three queries from section 2.
3. Export or copy the result sets to compare with the migration content above and with the style assembly audit (`IMAGE_PROMPT_STYLE_ASSEMBLY_AUDIT.md`).

If any column is missing, use the `information_schema` query for that table and align the SELECT list with your actual columns.

---

## 5. Alle SQL-Queries Step-by-Step (zum Kopieren)

**Schritt 1 — image_styles (aktive Styles):**

```sql
SELECT style_key, imagen_prompt_snippet, age_modifiers, negative_prompt, consistency_suffix
FROM image_styles
WHERE is_active = true
ORDER BY style_key;
```

**Schritt 2 — image_style_rules (alle Zeilen):**

```sql
SELECT *
FROM image_style_rules
ORDER BY age_group, theme_key;
```

**Schritt 3 — theme_rules:**

*Option A (wenn die Bild-Spalten existieren):*

```sql
SELECT theme_key, language, image_style_prompt, image_negative_prompt, image_color_palette
FROM theme_rules
WHERE image_style_prompt IS NOT NULL AND image_style_prompt != ''
ORDER BY theme_key, language;
```

*Option B (wenn Fehler „column image_style_prompt does not exist“ — dann hat theme_rules diese Spalten nicht, z. B. Migration Block 2.4 nicht ausgeführt):*

```sql
SELECT *
FROM theme_rules
ORDER BY theme_key, language;
```

Damit siehst du alle Zeilen von theme_rules. Die Bild-Style-Texte kommen in dem Fall nur aus **image_styles** und **image_style_rules**, nicht aus theme_rules.

**Falls eine Spalte fehlt — Spaltennamen prüfen:**

```sql
-- Für image_styles:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'image_styles'
ORDER BY ordinal_position;
```

```sql
-- Für image_style_rules:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'image_style_rules'
ORDER BY ordinal_position;
```

```sql
-- Für theme_rules:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'theme_rules'
ORDER BY ordinal_position;
```
