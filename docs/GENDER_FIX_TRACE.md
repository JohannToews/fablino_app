# Protagonist gender trace: DB → character_sheet merge

## Summary

- **Gender is only ever loaded from the backend DB** (`kid_profiles.gender`). The frontend does not send a gender field for the "me" protagonist when `include_self: true`; it only sends `kidProfileId` (or `kid_profile_id`).
- **Where it can go wrong:** If `kidProfileId` is missing in the request (e.g. body used `kid_profile_id` and backend only read `kidProfileId`), the DB is never queried and `resolvedKidGender` stays `''` at the merge point.

---

## Step-by-step trace

### 1. Request body (backend entry)

**File:** `supabase/functions/generate-story/index.ts`

- **Lines ~1386–1436:** Request body is parsed with `await req.json()`.
- **Previously:** Only `kidProfileId` (camelCase) was destructured. If the client or any layer sent `kid_profile_id` (snake_case), it was ignored and `kidProfileId` was `undefined`.
- **Fix applied:** Body is read once into `body`, then `kidProfileId = body.kidProfileId ?? body.kid_profile_id` so both key names work. Rest of fields are destructured from `body`.

So: **kid_profile_id is now accepted as well as kidProfileId.** If either is present, the DB load can run.

---

### 2. Hoisted variables (same scope as merge)

**Lines ~1739–1744:**

```ts
let resolvedKidAge = kidAge;
let resolvedKidName = kidName;
let resolvedKidGender: string = '';   // ← starts empty
let resolvedDifficultyLevel = difficultyLevel;
// ...
let kidAppearance = null;
```

These are in the same outer scope as the character_sheet merge block, so the merge **does** see `resolvedKidGender`. The only way it stays empty is if it is never set in step 3.

---

### 3. DB load from `kid_profiles` (only path that sets gender)

**Lines ~1809–1841:**

- **Condition:** `if (kidProfileId)` — **if `kidProfileId` is falsy, this whole block is skipped** and `resolvedKidGender` remains `''`.
- **Query:**
  ```ts
  const { data: kidProfile } = await supabase
    .from('kid_profiles')
    .select('first_name, age, gender, difficulty_level, content_safety_level')
    .eq('id', kidProfileId)
    .maybeSingle();
  ```
- **Where gender goes:** If `kidProfile` is returned:
  - `rawGender = (kidProfile as any).gender ?? ''`
  - `resolvedKidGender` is set to normalized `'male'` / `'female'` or `rawGender` (e.g. `'boy'`/`'girl'` preserved as-is for downstream use).

So: **Gender is loaded only when (1) `kidProfileId` is truthy and (2) a row exists in `kid_profiles` for that id.** If the row has `gender` null/empty, `resolvedKidGender` will be `''` or the raw empty value.

---

### 4. StoryRequest (kid_profile does not include gender)

**Lines ~1874–1877:**

```ts
kid_profile: {
  id: kidProfileId || userId || 'unknown',
  first_name: resolvedKidName || 'Child',
  age: resolvedKidAge || 8,
  difficulty_level: ...,
  content_safety_level: ...,
},
```

**`storyRequest.kid_profile` does not have a `gender` field.** So the merge does not get gender from the request payload; it must come from the hoisted `resolvedKidGender` (set in step 3).

---

### 5. Character sheet protagonist merge (where the log appears)

**Lines ~2754–2785:**

- **Condition:** `if (hasCharacterSheet && imagePlan)` then `if (includeSelf && kidAppearance)`.
- **Protagonist entry:** `sheet.find(c => c.role === 'protagonist' || c.name === (resolvedKidName || 'Child'))`.
- **Use of gender:**
  - `buildAppearanceAnchor(resolvedKidName || 'Child', resolvedKidAge || 8, resolvedKidGender || 'child', kidAppearance)` — **parameter name is `resolvedKidGender`** (same variable from step 2/3).
  - Log: `[CharacterSheet] Protagonist gender applied: ${resolvedKidGender} → ${genderLabel}`.

So: **The merge receives gender via the in-scope variable `resolvedKidGender`.** There is no other parameter name; if the log shows empty, `resolvedKidGender` is still `''` at this point because either (a) the DB block was skipped (no `kidProfileId`), or (b) the DB row was missing or had empty `gender`.

---

## Root cause checklist

| Cause | What to check |
|-------|----------------|
| **(a) Not loaded** | Request had no `kidProfileId` (or only `kid_profile_id` before the fix). Log: `include_self: true kidProfileId: (missing)`. |
| **(b) Loaded but not passed** | N/A — same scope variable is used at merge; no extra “pass” step. |
| **(c) Different parameter name** | N/A — merge uses `resolvedKidGender` directly. |

After the fix, also check:

- **DB row missing:** Log: `kid_profiles row not found for id=...`.
- **DB gender empty:** Log: `Loaded kid profile: ..., gender=(empty), ...`.

---

## Frontend: where `kidProfileId` is sent

- **CreateStoryPage (fiction):** `kidProfileId: selectedProfile?.id` (line ~717). If no profile is selected, this is `undefined`.
- **CreateStoryPage (non-fiction):** same, `kidProfileId: selectedProfile?.id` (~264).
- **StorySelectPage:** `kidProfileId: selectedProfile.id` (no optional chaining).
- **ReadingPage (continue/branch):** `kidProfileId: story.kid_profile_id`.
- **OnboardingStoryPage:** `kidProfileId: kidId`.

All use the **camelCase** key `kidProfileId`. The backend now also accepts `kid_profile_id` so snake_case clients or proxies still work.
