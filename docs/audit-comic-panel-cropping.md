# Cursor/Lovable Audit: Comic-Panel Cropping — Wo hängt's?

## A) Backend Audit

### A1) jimp-Code gefunden in: [Datei:Zeile]

| Ort | Inhalt |
|-----|--------|
| **supabase/functions/generate-story/index.ts:11** | `import { cropComicStrip } from '../_shared/comicStrip/panelCropper.ts';` |
| **supabase/functions/generate-story/index.ts:3068–3091** | Lovable-2-Grid-Pfad: `cropComicStrip` für Grid 1 und Grid 2 mit `COMIC_LAYOUTS['layout_1_2x2']`; bei Fehler `catch (cropErr)` → Fallback. |
| **supabase/functions/generate-story/index.ts:3164–3180** | 8-Panel-Pfad (parseComicStripPlan): `cropComicStrip` für beide Base64-Bilder; bei Fehler `catch (cropErr)` → Fallback. |
| **supabase/functions/generate-story/index.ts:3219–3232** | 4-Panel-Pfad (ein 2x2): ein `cropComicStrip`-Aufruf; bei Fehler `catch (cropErr)` → Fallback. |
| **supabase/functions/_shared/comicStrip/panelCropper.ts:110–111** | `const Jimp = await loadJimp();` und `const image = await Jimp.read(buffer);` |
| **supabase/functions/_shared/comicStrip/panelCropper.ts:124** | `image.clone().crop({ x, y, w, h })` (jimp crop) |
| **supabase/functions/_shared/comicStrip/panelCropper.ts:150–161** | `loadJimp()`: dynamischer `import('jimp')`; bei Fehler wird geworfen: *"cropComicStrip requires the jimp package ... Or use getComicStripCropData for frontend cropping."* |

In Deno/Edge gibt es kein Node-`jimp`; der dynamische Import schlägt fehl, daher schlägt serverseitiges Cropping in der Edge Function immer fehl (oder wird nie ausgeführt, je nach Laufzeit).

---

### A2) Fallback-Verhalten: [broken für UX, Response-Felder aber gesetzt]

**Dateien:** `supabase/functions/generate-story/index.ts` (z. B. 3087–3095, 3176–3184, 3226–3232).

- **Wenn jimp fehlschlägt:** Es wird `catch (cropErr)` ausgeführt. Statt 4 bzw. 8 Panel-URLs werden nur die **vollständigen Grid-URL(s)** in `panelUrls` gepusht:
  - 8-Panel: `panelUrls.push(comicFullImageUrl)`, `panelUrls.push(comicFullImageUrl2)` → `panelUrls = [Grid1-URL, Grid2-URL]`.
- **Folge:**  
  - `coverImageUrl = panelUrls[0]` = Grid-1-URL (ganzes 2x2).  
  - `storyImageUrls = panelUrls.slice(1)` = `[Grid2-URL]` (ein Eintrag = ganzes zweites 2x2).
- **Response:**  
  - `comic_full_image` und `comic_full_image_2` werden **vor** dem try/catch gesetzt (Zeilen 3061–3065, 3159–3160) und sind in der Response (3436–3440) enthalten.  
  - Die Grid-Bilder gehen also **nicht** verloren; sie stehen in der API-Response.  
  - `coverImageBase64` und `storyImages` sind aber die **ungeschnittenen** Grids (1 Bild = Cover, 1 Bild = zweites Grid), nicht 8 Einzelpanels. Die Kette „8 Panels im Text verteilen“ bricht, weil keine gecroppten Panels erzeugt werden und das Frontend sie nicht nachzieht.

---

### A3) Welche Felder werden in der Response zurückgegeben?

**Datei:** `supabase/functions/generate-story/index.ts:3434–3439`

- **comic_layout_key:** gesetzt (`comicLayoutKeyResult`; 8-Panel-Lovable-Pfad: `'layout_2x_2x2'` (Zeile 3096), sonst `comicLayout.layoutKey`).
- **comic_full_image:** gesetzt (`comicFullImageUrl`).
- **comic_full_image_2:** gesetzt (`comicFullImageUrl2 ?? null`).
- **comic_panel_count:** gesetzt (`comicPanelCountResult`; 8-Panel: 8 bzw. aus `panelUrls.length` / `comicLayout.panelCount`).
- **comic_grid_plan:** gesetzt (`comicGridPlanResult ?? null`; z. B. aus `comicImagePlan` im Lovable-Pfad (3097), im anderen Pfad müsste es analog aus dem Plan kommen – siehe Verwendung von `comicPlan`/Image-Plan im gleichen Block).

Alle genannten Felder werden in der JSON-Response an das Frontend zurückgegeben.

---

### A4) Werden diese Felder in der `stories`-Tabelle gespeichert?

**Backend:** Die Edge Function **schreibt nicht** in die DB; sie gibt nur die Response zurück. Persistenz passiert im **Frontend** beim Speichern der Story.

**Frontend-Persistenz:**

| Ort | Was wird in `stories` geschrieben |
|-----|-----------------------------------|
| **ReadingPage.tsx:696–697** (Series-Continuation insert) | nur `comic_layout_key`, `comic_full_image` |
| **ReadingPage.tsx:1025–1026** (weiterer insert) | nur `comic_layout_key`, `comic_full_image` |
| **CreateStoryPage.tsx:334–335** (insert) | nur `comic_layout_key`, `comic_full_image` |
| **CreateStoryPage.tsx:755–756** (insert) | nur `comic_layout_key`, `comic_full_image` |

- **comic_full_image_2**, **comic_panel_count**, **comic_grid_plan** werden **nirgends** in die `stories`-Tabelle geschrieben. Sie kommen nur in der API-Response an und gehen danach verloren (außer man würde sie aus dem ersten Response-Zugriff im Speicher nutzen, was aktuell nicht implementiert ist).

---

### A5) Toter Code / ungenutzte Alternativen

| Was | Wo | Status |
|-----|----|--------|
| **getComicStripCropData** | `panelCropper.ts:66–76` | Wird **nur in Tests** verwendet (`panelCropper.test.ts`), **nicht** in der Edge Function und **nicht** im Frontend. Frontend nutzt stattdessen `cropComicPanels` in `src/utils/cropComicPanels.ts` mit eigener 2x2-Logik. |
| **jimp / cropComicStrip** | Edge Function | In Deno/Edge nicht lauffähig; wird aufgerufen, schlägt fehl, Fallback wird genutzt. De-facto „toter“ Server-Crop-Pfad. |
| **Canvas-Versuche im Backend** | – | Keine Canvas-Nutzung im Backend gefunden; nur jimp. |

---

## B) Frontend — Story-Anzeige-Komponente

### B1) Welche Komponente rendert die Story?

- **Hauptseite Lesen:** **ReadingPage** (`src/pages/ReadingPage.tsx`) lädt die Story (`.from("stories").select("*").eq("id", id)`), hält `comicCroppedPanels` und rendert den Inhalt in `renderFormattedText()` (Absätze + eingefügte Bilder).
- **Immersive Reader:** **ImmersiveReader** (`src/components/immersive-reader/ImmersiveReader.tsx`) erhält die Story als Prop und nutzt ebenfalls Comic-Panels (State `comicPanels`) für `allImages` und damit die Anzeige.

Beide nutzen dasselbe Muster: Wenn `comic_full_image` + `comic_layout_key` vorhanden sind, wird clientseitig `cropComicPanels` aufgerufen.

---

### B2) Wird `comic_full_image_2` aus der DB geladen?

- **Geladen:** Ja, indirekt – die Abfrage ist `.select("*")` (ReadingPage.tsx:451–454), also würden alle Spalten inkl. `comic_full_image_2` zurückkommen, **wenn** sie in der DB stünden.
- **Persistiert:** Nein (siehe A4). Da das Frontend `comic_full_image_2` (und die anderen neuen Felder) nie speichert, steht in der DB nach dem ersten Save nur `comic_full_image` (Grid 1). Beim nächsten Laden gibt es daher **kein** `comic_full_image_2` aus der DB.
- **Typ/Interface:** Das lokale Story-Interface in ReadingPage (z. B. 208–209) und in ImmersiveReader (49–50) enthält nur `comic_full_image` und `comic_layout_key`, **nicht** `comic_full_image_2`, `comic_panel_count`, `comic_grid_plan`.

**Fazit:** `comic_full_image_2` wird weder persistiert noch in den Typen/der Logik berücksichtigt; es wird effektiv **nicht** genutzt.

---

### B3) Gibt es bereits Cropping-Logik im Frontend?

**Datei:** `src/utils/cropComicPanels.ts`

- **Canvas:** Ja – `document.createElement('canvas')`, `getContext('2d')`, `ctx.drawImage(img, sx, sy, sw, sh, ...)`, `canvas.toDataURL('image/webp', 0.9)` (Zeilen 30–40).
- **Bild-Slicing:** Ja – Aufteilung nach `grid.rows` / `grid.cols` (aus `GRID_CONFIGS[layoutKey]`), `panelW = img.width / grid.cols`, `panelH = img.height / grid.rows`, Schleife über Zeilen/Spalten.
- **CSS-Cropping:** Kein `clip-path`/`object-fit`/`object-position` für Panel-Slicing; nur Canvas.

**Einschränkung:**  
- `GRID_CONFIGS` enthält nur `'layout_1_2x2'` und `'layout_2x2_equal'` (beide 2x2).  
- Für **8 Panels** liefert das Backend `comic_layout_key: 'layout_2x_2x2'`. Dieser Key ist **nicht** in `GRID_CONFIGS`; es wird `GRID_CONFIGS[layoutKey] || { rows: 2, cols: 2 }` genutzt (Zeile 18) – also weiterhin ein einziges 2x2-Grid.  
- Außerdem wird **nur ein Bild** übergeben: `cropComicPanels(story.comic_full_image!, story.comic_layout_key!)`. Ein zweites Bild (`comic_full_image_2`) wird nie übergeben.  
→ Es werden maximal **4 Panels** aus dem **ersten** Grid erzeugt; das zweite Grid wird nie gecroppt.

---

### B4) Wie werden die Bilder aktuell angezeigt?

- **ReadingPage (1379–1383):**  
  `storyImages = comicCroppedPanels && comicCroppedPanels.length > 0 ? comicCroppedPanels : (story.story_images || [])`.  
  Wenn also Frontend-Cropping funktioniert → 4 Panels (von einem Grid). Wenn es fehlschlägt oder keine Comic-Daten → `story.story_images` (beim jimp-Fallback: ein Eintrag = ganzes Grid 2). Cover bleibt das, was das Backend als `cover_image_url` liefert (bei Comic-Fallback = ganzes Grid 1).
- **ImmersiveReader (159–164):**  
  `allImages = comicPanels && comicPanels.length > 0 ? comicPanels : buildImageArray(story.cover_image_url, story.story_images)` – gleiches Prinzip.

**Ergebnis:** Entweder 4 Panels aus Grid 1 (wenn Cropping klappt) oder die rohen Grid-Bilder (Cover = Grid 1, eine „Szene“ = Grid 2). Keine 8 Panels, kein zweites Grid im Frontend-Crop.

---

### B5) Panel-Verteilung im Text

- **ReadingPage:** `getImageInsertionMap(paragraphs.length, storyImages.length)` (1353–1370, 1386) verteilt `storyImages.length` Bilder gleichmäßig über die Absätze (eins nach Absatz X, Y, …).  
  Es gibt keine spezielle Logik für „Cover oben, Panels zwischen Absätzen, End-Bild unten“; die erste „Bild“-Position kann je nach Map nach dem ersten Absatz kommen. Die Reihenfolge ist: erst alle Absätze/Text, dazwischen werden die Bilder an den berechneten Stellen eingefügt.
- **ImmersiveReader:** Nutzt `getImagePositionsFromPlan`, `buildImageArray`, `getVisibleImages` und eine andere Struktur (Spreads/Seiten); die genaue Verteilung hängt von der Page-Logik und dem Image-Plan ab. Keine explizite „Cover / Panels / End“-Semantik aus `comic_grid_plan` gefunden.

---

### B6) Werden `comic_grid_plan`-Metadaten im Frontend genutzt?

- **Nein.** Weder ReadingPage noch ImmersiveReader noch `cropComicPanels.ts` lesen oder verwenden `comic_grid_plan`.  
- Die Felder werden weder geladen (weil nicht persistiert) noch für Reihenfolge/Rollen (character_anchor, world_anchor, grid_1, grid_2) ausgewertet.

---

## C) Daten-Integrität

### C1) Werden comic_full_image_2, comic_panel_count, comic_grid_plan in der DB geschrieben?

- **Nein.** Nur die Edge Function setzt sie in der **Response**. Alle Frontend-Inserts/Updates in ReadingPage und CreateStoryPage schreiben ausschließlich `comic_layout_key` und `comic_full_image`. Die Migration fügt die Spalten hinzu, aber der App-Code schreibt sie nie.

---

### C2) Schema-Mismatches

- **DB (Migration 20260226_comic_strip_grid_columns.sql):**  
  `comic_full_image_2 TEXT`, `comic_panel_count SMALLINT`, `comic_grid_plan JSONB` – vorhanden.
- **Supabase-Types (src/integrations/supabase/types.ts):**  
  In `stories.Row` / `Insert` / `Update` sind **nur** `comic_full_image` und `comic_layout_key` definiert (z. B. 1325–1326, 1379–1380, 1433–1434, 2178–2179).  
  **comic_full_image_2**, **comic_panel_count**, **comic_grid_plan** fehlen in den generierten Types.  
→ Typen wurden nach der Migration nicht neu generiert (z. B. `supabase gen types typescript`).

---

### C3) Ausstehende Migration?

- Die Migration **20260226_comic_strip_grid_columns.sql** ist vorhanden und fügt die drei Spalten hinzu. Es wurde keine weitere Migration gefunden, die diese Spalten wieder entfernt oder ändert.  
- Offen ist nur: Sind die Migrationen bereits auf der verwendeten DB ausgeführt? (Das lässt sich nur vor Ort prüfen.)

---

## D) Diagnose

### Wo bricht die Kette

1. **Backend:**  
   - Serverseitiges Cropping mit jimp schlägt in Deno/Edge fehl.  
   - Fallback: Beide Grid-URLs werden korrekt gesetzt und in der Response zurückgegeben (`comic_full_image`, `comic_full_image_2`, `comic_panel_count`, `comic_grid_plan`, `comic_layout_key`).  
   - Gleichzeitig werden `coverImageBase64` und `storyImages` auf die **ungeschnittenen** Grids gesetzt (1 Cover + 1 „Szene“ = 2 ganze Bilder statt 8 Panels).

2. **Frontend Persistenz:**  
   - Beim Speichern der Story werden nur `comic_layout_key` und `comic_full_image` in die DB geschrieben.  
   - `comic_full_image_2`, `comic_panel_count`, `comic_grid_plan` gehen nach dem ersten Response verloren (werden nie in `stories` geschrieben).

3. **Frontend Anzeige:**  
   - Es wird nur `comic_full_image` (ein Bild) mit `cropComicPanels` gecroppt.  
   - `comic_full_image_2` wird weder geladen noch übergeben; Layout `layout_2x_2x2` ist nicht in `GRID_CONFIGS` (Fallback 2x2), also entstehen maximal 4 Panels aus dem ersten Grid.  
   - Keine Nutzung von `comic_grid_plan` für Reihenfolge/Rollen.

4. **Types/Schema:**  
   - Supabase-Types enthalten die neuen Spalten nicht; die DB-Struktur und der Code sind inkonsistent.

**Kurz:** Die Kette bricht an mehreren Stellen: fehlgeschlagenes Server-Cropping → Frontend speichert nur ein Grid und nutzt nur eines zum Croppen → kein 8-Panel-Ergebnis, zweites Grid und Metadaten ungenutzt.

---

### Empfehlung

- [ ] **Schritt 1 (Backend):** Serverseitiges Cropping (jimp / `cropComicStrip`) in der Edge Function **entfernen** oder nur noch optional aufrufen und bei Fehler **ausschließlich** die Grid-URLs + Metadaten durchreichen (kein Überschreiben von `storyImageUrls` mit ganzen Grids als „Panels“). Response weiterhin: `comic_full_image`, `comic_full_image_2`, `comic_panel_count`, `comic_grid_plan`, `comic_layout_key` beibehalten.
- [ ] **Schritt 2 (Frontend Persistenz):** Beim Speichern der Story (CreateStoryPage, ReadingPage) **comic_full_image_2**, **comic_panel_count**, **comic_grid_plan** in die `stories`-Tabelle mitschreiben (Insert/Update).
- [ ] **Schritt 3 (Supabase-Types):** Types neu generieren (`supabase gen types typescript` o.ä.), damit `stories` Row/Insert/Update die neuen Spalten enthalten.
- [ ] **Schritt 4 (Frontend Cropping):**  
  - **layout_2x_2x2** in `cropComicPanels` unterstützen: Zwei URLs (comic_full_image, comic_full_image_2), jeweils 2x2 croppen → 8 Panels in fester Reihenfolge (Grid1 TL, TR, BL, BR, Grid2 TL, TR, BL, BR).  
  - Story-Interface und Lesepfad so erweitern, dass `comic_full_image_2` und ggf. `comic_panel_count` geladen und an `cropComicPanels` übergeben werden.
- [ ] **Schritt 5 (Optional):** `comic_grid_plan` im Frontend nutzen, um Panel-Reihenfolge oder -Rollen (Cover/Ende) zu steuern; sonst vorerst weglassen und nur die feste 8-Panel-Reihenfolge verwenden.
- [ ] **Schritt 6 (Logging):** In der Edge Function beim Fallback einmalig loggen, dass „server-side cropping skipped, returning grid URLs for client-side crop“ (bereits teilweise vorhanden); optional im Frontend loggen, wenn 8-Panel-Modus mit zwei URLs genutzt wird.

---

### Clean-Rewrite vs. bestehenden Code fixen

- **Empfehlung: Auf bestehendem Code aufbauen, gezielt erweitern (kein Full-Rewrite).**
  - Backend: Nur jimp-Pfad entfernen/umgehen und Response beibehalten; keine neue Pipeline nötig.  
  - Frontend: `cropComicPanels` um ein zweites Bild und den Key `layout_2x_2x2` erweitern; Persistenz und Types ergänzen.  
  - Die bestehende Canvas-Logik und die Verteilung über `getImageInsertionMap` reichen für 8 Panels aus; ein kompletter Rewrite der Cropping-Logik ist nicht nötig.

---

**Referenzen (Datei:Zeile):**

- jimp / cropComicStrip: `supabase/functions/generate-story/index.ts` (11, 3068–3091, 3164–3180, 3219–3232); `supabase/functions/_shared/comicStrip/panelCropper.ts` (88–161).
- Response-Felder: `supabase/functions/generate-story/index.ts` (3434–3439).
- Frontend Persistenz: `ReadingPage.tsx` (696–697, 1025–1026); `CreateStoryPage.tsx` (334–335, 755–756).
- Frontend Cropping: `src/utils/cropComicPanels.ts` (6–18, 15–48); `ReadingPage.tsx` (508–524, 1379–1386); `ImmersiveReader.tsx` (144–164).
- DB-Schema: `supabase/migrations/20260226_comic_strip_grid_columns.sql`; Types: `src/integrations/supabase/types.ts` (1320–1374, 2175–2182).
- Layout-Key 8-Panel: `generate-story/index.ts:3096` (`layout_2x_2x2`); Layout-Definition 2×(2x2): `supabase/functions/_shared/comicStrip/layouts.ts` (178–196, Key `layout_6_2x2x2`).
