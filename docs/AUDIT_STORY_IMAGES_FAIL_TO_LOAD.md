# Audit: Story Images Sometimes Fail to Load

**Date:** 2025-02-24  
**Scope:** Storage bucket configuration, image generation pipeline, frontend image loading, and potential causes.  
**Request:** Analyze only — do not fix.

---

## 1. Storage bucket configuration

### 1.1 Buckets and migrations

- **Migration `20260211070403`** does **not** create the story-images bucket; it only adds an index on `stories` (`idx_stories_user_deleted_profile_created`).
- **Migration `20260211120540`** creates the **`story-images`** bucket and policies:
  - `INSERT INTO storage.buckets (id, name, public) VALUES ('story-images', 'story-images', true)` → **public**
  - Policy: Public **SELECT** (read) for `bucket_id = 'story-images'`
  - Policy: **INSERT** and **UPDATE** for service role only (no anon upload)

- The **`covers`** bucket is created in **`20260122132417`**:
  - Public bucket
  - Policies: **Anyone** can view, upload, update, delete (`bucket_id = 'covers'`)

### 1.2 Where images are stored

| Source | Bucket | Path pattern | URL pattern |
|--------|--------|--------------|-------------|
| **generate-story** (new stories) | `covers` | `cover-{timestamp}-{uuid}.png`, `scene-{i}-...` | `https://<project>.supabase.co/storage/v1/object/public/covers/...` |
| **migrate-covers** (legacy base64 → storage) | `story-images` | `covers/{story.id}.{ext}` | `https://<project>.supabase.co/storage/v1/object/public/story-images/covers/...` |
| **Frontend fallback upload** (resolveImageUrl when backend sent base64) | `covers` | `{prefix}-{timestamp}-{uuid}.png` | Same as covers above |

So there are **two** buckets in use for story/cover images; new content goes to **covers**, migrated content to **story-images**.

### 1.3 Size limits, file types, URL expiry

- **No** `file_size_limit` or `allowed_mime_types` set in migrations for either bucket. Supabase defaults apply (e.g. 50MB limit per object unless overridden).
- **URLs are public, not signed.** Display uses `getPublicUrl()`; there is **no expiry** on these URLs. Failure to load is not due to expired signed URLs.

---

## 2. Image generation pipeline

### 2.1 Where images are generated

- There is **no separate `generate-story-images` edge function.** All image generation runs inside **`generate-story`** (single flow: story text + image prompts → LLM → then Vertex/Lovable for images → upload to storage → return URLs in response).
- The frontend creates/updates the story row **after** receiving the generate-story response; the backend does not write `generation_status` to the DB.

### 2.2 Error and timeout behaviour

- **Upload failure (backend):**  
  `uploadImageToStorage()` in `generate-story/index.ts` returns `null` on storage error or exception. That `null` is passed through into `coverImageUrl` / `storyImageUrls`. The response still returns these (possibly null) URLs; the frontend then saves the story with whatever it got. There is **no** backend update to `stories.generation_status` or `stories.cover_image_status` on failure.

- **Parallel block timeout:**  
  Consistency check and **all** image generation run in parallel with a **180s** timeout (`PARALLEL_TIMEOUT_MS = 180000`). If the timeout fires:
  - The catch sets `allImageResults = []`.
  - `coverImageBase64` and `storyImages` in the response are empty.
  - The story is still returned and the frontend still saves it with **null** cover and empty `story_images`, and sets **`generation_status: 'verified'`**. So we can have **stories marked “verified” with no images**.

- **Vertex / Imagen failure:**  
  If a single image fails (e.g. Vertex returns null or throws), that slot ends up with `url: null` in the image results. The rest of the images are still returned. Again, the frontend does not set `generation_status` to `'error'` when some or all image URLs are missing; it still sets `'verified'`.

**Summary:** On image or upload failure (or timeout), the pipeline does **not** fail the whole request and does **not** mark the story as failed. It returns partial or empty image URLs and the frontend persists them with `generation_status: 'verified'`, so **“images sometimes fail to load” can be “images were never stored”** for those stories.

### 2.3 URL format stored in DB

- **`stories.cover_image_url`:** string, absolute URL, e.g.  
  `https://<project_ref>.supabase.co/storage/v1/object/public/covers/cover-...png`  
  or (after migrate-covers)  
  `https://<project_ref>.supabase.co/storage/v1/object/public/story-images/covers/<story_id>.png`
- **`stories.story_images`:** JSONB array of strings (TEXT[] in older migration); same kind of absolute Supabase Storage public URLs.

---

## 3. Frontend image loading

### 3.1 How images are loaded

- **StorySelectPage (story cards):**  
  Uses `getThumbnailUrl(story.cover_image_url, ...)` as `src`.  
  **Has** `onError`: sets `src` to `'/fallback-illustration.svg'`.

- **SeriesGrid (episode cards):**  
  Same: `getThumbnailUrl(...)` and **onError** → `'/fallback-illustration.svg'`.

- **ImmersiveReader / ImmersivePageRenderer / ImmersiveChapterTitle:**  
  Use **direct** `cover_image_url` or entries from `buildImageArray(cover_image_url, story_images)` as `src`.  
  **Has** `onError`: `(e.target as HTMLImageElement).style.display = 'none'` (image hidden, no fallback asset).

- **AdminPage (story list):**  
  Uses `getThumbnailUrl(story.cover_image_url, 112, 50)`.  
  **No** `onError` → broken image icon if the request fails.

- **StickerBookPage:**  
  Uses raw `story.cover_image_url` (no thumbnail transform).  
  **No** `onError` → broken image if URL fails.

- **FeedbackStatsPage (preview):**  
  Uses raw `previewStory.cover_image_url` and `previewStory.story_images`.  
  **No** `onError` on those `<img>` elements.

### 3.2 getThumbnailUrl and render API

- **`src/lib/imageUtils.ts`:**  
  - If URL is null/empty, returns `''`.  
  - If URL **does not** contain `'/storage/v1/object/public/'`**, returns the original URL unchanged.**  
  - If it **does** contain that string, it is rewritten to use the **Supabase Image Transform** API:  
    Replace `/storage/v1/object/public/` with `/storage/v1/render/image/public/` and append `?width=...&quality=...&resize=contain`.

- **Consequence:**  
  List/cover images that go through `getThumbnailUrl` hit the **render/image** endpoint. If that endpoint is disabled, rate-limited, or returns 4xx/5xx for some requests, the **browser will get a failed image request** and trigger `onError` only where it exists (StorySelectPage, SeriesGrid). Where `onError` is missing (AdminPage, StickerBookPage, FeedbackStatsPage), the user sees a **broken image**.

### 3.3 Lazy loading

- **StorySelectPage** and **ImmersivePageRenderer** use `loading="lazy"` on story images; **ImmersiveChapterTitle** uses `loading="eager"` for the cover.
- Lazy loading can make failures more noticeable on slow connections (placeholder first, then failed request and possibly fallback or broken icon). It does not by itself cause 404s; it only affects when the request is sent.

---

## 4. Potential causes (summary)

| Cause | Likelihood | Notes |
|-------|------------|--------|
| **Backend upload failure or image timeout** | **High** | Upload returns null or parallel block times out → response has null/empty image URLs → frontend still saves with `generation_status: 'verified'`. Story appears “done” but has no (or partial) images. |
| **Supabase Image Transform (render) failure** | **Medium** | Thumbnails use `/storage/v1/render/image/public/...`. If the project does not have the transform enabled, or the service errors, those requests fail. List/cover views that use `getThumbnailUrl` would then show fallback or broken image depending on `onError`. |
| **Missing or inconsistent onError on some pages** | **Medium** | AdminPage, StickerBookPage, FeedbackStatsPage preview do not set `onError` on story images. Any failed URL (wrong bucket, deleted object, render failure) shows as broken image. |
| **Two buckets + migrate-covers** | **Low–Medium** | New stories use `covers`; migrated use `story-images/covers/`. If migrate-covers failed for some rows, or a story has an old `data:` URL never migrated, the frontend would have an invalid or non-STORAGE URL. getThumbnailUrl would leave it unchanged; if that URL is invalid, image fails. |
| **CORS** | **Low** | Storage and app are same Supabase project; typical setup allows the app origin. Unlikely unless the app is on an unexpected domain. |
| **CDN / cache** | **Low** | No app-level CDN in code. Supabase may cache; if an object was deleted or overwritten, cached response could be stale/missing. Speculative. |

---

## 5. Image URL format / pattern

- **Stored value:** Always **absolute** URLs:
  - New:  
    `https://<project_ref>.supabase.co/storage/v1/object/public/covers/<prefix>-<timestamp>-<uuid>.png`
  - Migrated:  
    `https://<project_ref>.supabase.co/storage/v1/object/public/story-images/covers/<story_id>.png`
- **Display (when thumbnail is used):**  
  Same base, but path changed to `/storage/v1/render/image/public/...` and query `?width=...&quality=...&resize=contain` added.

---

## 6. Error-handling gaps

1. **Backend** never updates `stories.generation_status` or `cover_image_status` / `story_images_status` when upload fails or when the parallel block times out. The frontend always sets `generation_status: 'verified'` after save, even when `cover_image_url` is null or `story_images` is empty.
2. **Frontend** does not treat “no cover URL” or “empty story_images” as an error state when deciding status; it still shows the story as verified.
3. **List/reader** surfaces that use `getThumbnailUrl` depend on the Supabase render API; there is no fallback to the **non-rendered** public URL if the render request fails.
4. **AdminPage, StickerBookPage, FeedbackStatsPage** do not use `onError` on story images, so any failed load shows as a broken image instead of a fallback or placeholder.

---

## 7. Most likely cause (assessment)

The most likely cause of “story images sometimes fail to load” is a **combination** of:

1. **Backend:** Some stories are saved with **null or partial image URLs** (upload failure or 180s timeout) but are still marked **verified**. For those, there is simply no valid image URL to load.
2. **Thumbnail API:** Where the app uses **getThumbnailUrl**, failure of the **Supabase Image Transform (render)** endpoint for some requests would cause image load failures even when the underlying object exists. That would show up as intermittent failures, especially under load or for certain image sizes/formats.
3. **Missing onError:** On Admin, StickerBook, and FeedbackStats preview, any failed load (wrong URL, missing object, or render failure) appears as a broken image with no fallback, which users may report as “image doesn’t load.”

---

## 8. Recommended fix approach (high level)

1. **Backend / status:**  
   - When the parallel block times out or when all image uploads fail, either return a clear flag in the response (e.g. `imagesFailed: true`) or have the frontend infer from null/empty image URLs.  
   - Frontend: do **not** set `generation_status: 'verified'` when `cover_image_url` is null and `story_images` is empty (or set a dedicated status, e.g. `'verified_no_images'` or keep as `'generating'` / `'error'` and surface retry or “no images” in the UI).

2. **Thumbnail fallback:**  
   - In `getThumbnailUrl` (or at the call site), consider using the **raw** public URL when the render URL is known to be unreliable, or add an **onError** handler that retries with the raw object URL. Alternatively, ensure the Supabase project has the Image Transform feature enabled and monitor for errors.

3. **Frontend onError:**  
   - Add **onError** on every story image (AdminPage, StickerBookPage, FeedbackStatsPage) to switch to a fallback image or placeholder (e.g. `/fallback-illustration.svg` or a neutral “no image” state) so users never see a broken icon.

4. **Observability:**  
   - Log or track when backend returns null cover or empty story_images, and when the parallel block times out, so you can measure how often “no images” or “partial images” occur and confirm the hypothesis.

5. **migrate-covers:**  
   - Optionally re-run or audit migrate-covers for stories that still have `cover_image_url LIKE 'data:%'` or invalid URLs, and fix or mark those rows so the frontend does not try to load invalid URLs.

No code changes were made in this audit; the above is a recommended direction for fixes.
