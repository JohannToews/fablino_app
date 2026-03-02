/**
 * Visual Director — second LLM call that reads a finished story and produces
 * Imagen-optimized scene descriptions (character_sheet, world_anchor, scenes, cover).
 * Used when useVisualDirector is true; replaces image_plan from Call 1.
 */

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Call Lovable AI Gateway (mirrors generate-story callLovableAI; not exported from index). */
async function callLovableAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxRetries: number
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[VisualDirector] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    try {
      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
        }),
      });
      if (response.status === 429) {
        lastError = new Error("Rate limited");
        continue;
      }
      if (response.status === 402) {
        throw new Error("Payment required - please add credits to your Lovable workspace");
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[VisualDirector] Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("[VisualDirector] Gateway response not valid JSON. Starts with:", responseText.substring(0, 200));
        throw new Error("AI Gateway returned invalid JSON");
      }
      const content = data.choices?.[0]?.message?.content;
      if (!content && data.error) {
        lastError = new Error(`Gateway error: ${JSON.stringify(data.error).substring(0, 100)}`);
        await sleep(Math.pow(2, attempt + 1) * 1000);
        continue;
      }
      if (!content) {
        lastError = new Error("No content in AI response");
        await sleep(2000);
        continue;
      }
      return content;
    } catch (error) {
      if (error instanceof Error && error.message === "Rate limited") {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("Max retries exceeded");
}

// ─── Output schema ───────────────────────────────────────────────────────

export interface VisualDirectorCharacter {
  name: string;
  role: "protagonist" | "sidekick" | "villain" | "family" | "friend" | "secondary";
  full_anchor: string;
  props?: string[];
}

export interface VisualDirectorScene {
  scene_id: number;
  story_moment: string;
  scene_description: string;
  composition: string;
  characters_present: string[];
  key_objects: string[];
  atmosphere: string;
  camera: string;
}

export interface VisualDirectorOutput {
  character_sheet: VisualDirectorCharacter[];
  world_anchor: string;
  scenes: VisualDirectorScene[];
  cover: {
    description: string;
    characters_present: string[];
    mood: string;
  };
}

// ─── System & user prompt templates ───────────────────────────────────────

const SYSTEM_PROMPT = `You are the Visual Director for Fablino, an illustrated children's story app. Your job: read a finished story and create precise, Imagen-optimized visual instructions for each scene illustration.

You receive a children's story and must produce a JSON object with: character_sheet, world_anchor, scenes, and cover.

## CHARACTER SHEET RULES

Create a character_sheet entry for EVERY character that appears in the story.

Each entry needs:
- "name": Exactly as used in the story
- "role": "protagonist" | "sidekick" | "villain" | "family" | "friend" | "secondary"
- "full_anchor": Complete English visual description. MUST include ALL of:
  - Age, gender (human characters)
  - Face shape, expression tendency
  - Skin tone
  - Hair: type, length, style, color
  - Eye color
  - Body type / build
  - EXACT clothing (specific colors, materials, patterns — NOT "a shirt" but "a dark green tunic with brown leather belt")
  - Accessories, distinguishing features
  - For animals/creatures: species, size, fur/scale color, distinctive markings
- "props": Array of items this character carries or uses repeatedly

CRITICAL: If a kid appearance anchor is provided below, the protagonist's physical description (face, skin, hair, eyes, body) MUST match it EXACTLY. You only ADD clothing, accessories, and props.

## CHARACTER DESCRIPTION BALANCE (CRITICAL FOR IMAGE CONSISTENCY)

Imagen gives more visual weight to longer descriptions, causing
shorter-described characters to "absorb" features from longer ones.
ALL character full_anchors MUST follow the SAME structure and SIMILAR length.

MANDATORY STRUCTURE for every human character full_anchor:
"[age] [gender], [skin tone], [hair: length + type + color], [eye color],
 [build], [clothing: color + garment + one detail]"

MANDATORY STRUCTURE for animal/creature full_anchor:
"[species], [size], [fur/scale color + pattern], [distinctive feature],
 [accessory if any]"

LENGTH RULES:
- Every full_anchor must be 25-40 words. No exceptions.
- The LONGEST description may not exceed 1.5x the SHORTEST description.
- If the protagonist anchor is 25 words, no sidekick may exceed 38 words.

CLOTHING RULES (applies to ALL characters):
- Clothing is SPECIFIC but CONCISE: color + garment + one detail.
  YES: "purple-gold silk kimono with wide obi belt" (8 words)
  NO:  "a vibrant, intricately patterned silk kimono in shades of
       purple and gold, tied with a wide obi belt" (19 words)
  YES: "dark blue t-shirt with small yellow star emblem" (8 words)
  NO:  "a casual t-shirt" (3 words — too generic, Imagen invents)

TOKEN BALANCE SELF-CHECK:
Before outputting your JSON, count words in each full_anchor.
If any description is more than 1.5x the shortest, SHORTEN it.

## WORLD ANCHOR

One 20-30 word description of the visual atmosphere: lighting quality, color mood, art direction. NOT specific locations.

## SCENE BALANCING (CRITICAL — CHECK BEFORE OUTPUT)

All generated scenes MUST have maximum visual variety.
A viewer scrolling through the images must see DIFFERENT pictures,
not variations of the same composition.

Before finalizing your output, verify ALL of these checks:

CAMERA CHECK:
- Never use the same framing in consecutive scenes.
  If scene 1 = "medium shot", scene 2 MUST be different.
- For 3 scenes: use at least 3 different framings.

LOCATION CHECK:
- No two consecutive scenes may show the same location.
- If the story takes place in one location, show DIFFERENT AREAS
  of that location (e.g. entrance vs. deep inside vs. rooftop).

CHARACTER GROUPING CHECK:
- Vary who is visible across scenes.
- Do NOT show the same character combination in every scene.
- At least one scene should show the protagonist alone OR with a
  different character grouping than the others.

OBJECT CHECK:
- key_objects should differ between scenes.
- Do NOT repeat the same key_object in consecutive scenes unless
  it is physically transformed (e.g. "closed book" → "glowing open book").

MOOD CHECK:
- Each scene must have a noticeably different atmosphere.
- Vary lighting (bright/dark), temperature (warm/cool),
  and energy (calm/tense) across the set.

If any two scenes would look too similar as illustrations,
REPLACE one with a different story moment.

## SCENE DISTRIBUTION BY COUNT

- 1 scene: Pick the single most visually dramatic moment.
- 2 scenes: One from setup/discovery, one from the climax.
  Must differ in camera, location, and mood.
- 3 scenes: Distribute across the arc — opening hook, central
  conflict, resolution. All three must feel visually distinct.
- 4+ scenes: Cover the full arc including quieter emotional beats.
  Ensure maximum visual variety across all dimensions.

## SCENE RULES

Create exactly {scene_count} scenes that capture the most VISUALLY INTERESTING and NARRATIVELY IMPORTANT moments.

Each scene needs:
- "scene_id": Sequential (1, 2, 3...)
- "story_moment": Quote or paraphrase the exact story moment being illustrated (in the story's language)
- "scene_description": English, 40-60 words. Describe ONLY: location, action, pose, objects, lighting. NEVER describe character appearance — that comes from character_sheet.
- "composition": See COMPOSITION below. Plain language only.
- "characters_present": Names matching character_sheet exactly
- "key_objects": Objects that MUST appear in this image (plot-relevant items)
- "atmosphere": Mood + lighting for THIS specific scene (can differ from world_anchor)
- "camera": See CAMERA below. Simple framing + optional angle.

Scene selection rules:
- Distribute across story arc (beginning, middle, end)
- Prioritize moments with ACTION over static scenes
- Each scene should be visually distinct from the others
- Include the most emotionally charged moments

## CAMERA

Only use these options:
- "close-up" — face and emotions, intimate moments
- "medium shot" — characters interacting, dialogue
- "full body" — action, movement, full character visible
- "wide shot" — character small in environment, establishing scene

Optional angle (add after framing):
- ", low angle" — character looks powerful or heroic
- ", high angle" — character looks small or vulnerable

Format: "{framing}" or "{framing}, {angle}"
Examples: "close-up", "wide shot, low angle", "medium shot"

Do NOT use: dutch angle, bird's eye, extreme close-up,
over-the-shoulder, or any other film jargon.

## COMPOSITION

The "composition" field describes the spatial relationship in PLAIN LANGUAGE.
Good: "tiny figure standing at the edge of a massive glowing lake"
Good: "two children face to face, arms crossed, a broken toy between them"
Bad: "wide establishing shot"
Bad: "over-the-shoulder two-shot"

## COVER

- "description": The single best motif that represents the whole story (English, 20-30 words)
- "characters_present": Who appears on the cover
- "mood": Overall emotional tone

## OUTPUT FORMAT

Return ONLY a valid JSON object matching the schema. No markdown, no explanation, no preamble.`;

function buildUserPrompt(params: {
  storyTitle: string;
  storyContent: string;
  storyLanguage: string;
  sceneCount: number;
  kidAge?: number;
  kidAppearanceAnchor?: string;
  includeSelf?: boolean;
}): string {
  const parts: string[] = [
    `Story Title: ${params.storyTitle}`,
    `Story Language: ${params.storyLanguage}`,
    `Target Audience: ${params.kidAge ?? 8}-year-old child`,
    "",
  ];
  if (params.kidAppearanceAnchor && params.includeSelf) {
    parts.push("PROTAGONIST APPEARANCE (MUST MATCH EXACTLY — only add clothing):");
    parts.push(params.kidAppearanceAnchor);
    parts.push("");
  }
  parts.push(`Number of scene images to generate: ${params.sceneCount}`);
  parts.push("");
  parts.push("--- STORY TEXT ---");
  parts.push(params.storyContent);
  parts.push("--- END STORY TEXT ---");
  parts.push("");
  parts.push(
    "Create the visual direction JSON for this story. Remember: ALL text in your output must be in English, except story_moment which should reference the original text."
  );
  return parts.join("\n");
}

function parseVisualDirectorResponse(raw: string): VisualDirectorOutput | null {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned) as VisualDirectorOutput;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as VisualDirectorOutput;
      } catch {
        // fallthrough
      }
    }
  }
  return null;
}

// ─── Main export ─────────────────────────────────────────────────────────

export async function callVisualDirector(params: {
  apiKey: string;
  storyTitle: string;
  storyContent: string;
  storyLanguage: string;
  sceneCount: number;
  kidName?: string;
  kidAge?: number;
  kidGender?: string;
  kidAppearanceAnchor?: string;
  includeSelf?: boolean;
}): Promise<VisualDirectorOutput> {
  const startMs = Date.now();

  console.log(`[VD-DEBUG] VD CALL INPUT:`);
  console.log(`[VD-DEBUG]   storyTitle: "${params.storyTitle}"`);
  console.log(`[VD-DEBUG]   storyLanguage: ${params.storyLanguage}`);
  console.log(`[VD-DEBUG]   sceneCount: ${params.sceneCount}`);
  console.log(`[VD-DEBUG]   kidAppearanceAnchor: ${params.kidAppearanceAnchor ? params.kidAppearanceAnchor.substring(0, 100) + '...' : 'none'}`);
  console.log(`[VD-DEBUG]   includeSelf: ${params.includeSelf}`);

  const systemPrompt = SYSTEM_PROMPT.replace("{scene_count}", String(params.sceneCount));
  const userPrompt = buildUserPrompt({
    storyTitle: params.storyTitle,
    storyContent: params.storyContent,
    storyLanguage: params.storyLanguage,
    sceneCount: params.sceneCount,
    kidAge: params.kidAge,
    kidAppearanceAnchor: params.kidAppearanceAnchor,
    includeSelf: params.includeSelf,
  });

  try {
    const content = await callLovableAI(params.apiKey, systemPrompt, userPrompt, 0.4, 3);

    console.log(`[VD-DEBUG] VD RAW RESPONSE (first 500 chars):`);
    console.log(`[VD-DEBUG]   ${content.substring(0, 500)}`);

    const parsed = parseVisualDirectorResponse(content);
    if (!parsed) {
      console.error("[VisualDirector] JSON parse failed. Response starts with:", content.substring(0, 300));
      console.error(`[VD-DEBUG] ERROR: JSON parse failed`);
      console.error(`[VD-DEBUG] FALLBACK: using old image_plan path`);
      throw new Error("Visual Director returned invalid JSON");
    }
    if (!Array.isArray(parsed.character_sheet) || parsed.character_sheet.length === 0) {
      console.error("[VisualDirector] character_sheet missing or empty:", JSON.stringify(parsed).substring(0, 200));
      console.error(`[VD-DEBUG] ERROR: character_sheet missing or empty`);
      console.error(`[VD-DEBUG] FALLBACK: using old image_plan path`);
      throw new Error("Visual Director must return a non-empty character_sheet");
    }
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== params.sceneCount) {
      console.error(
        "[VisualDirector] scenes length mismatch: got",
        parsed.scenes?.length,
        "expected",
        params.sceneCount
      );
      console.error(`[VD-DEBUG] ERROR: scenes length mismatch (got ${parsed.scenes?.length}, expected ${params.sceneCount})`);
      console.error(`[VD-DEBUG] FALLBACK: using old image_plan path`);
      throw new Error(`Visual Director must return exactly ${params.sceneCount} scenes`);
    }

    console.log(`[VD-DEBUG] VD PARSED OUTPUT:`);
    console.log(`[VD-DEBUG]   character_sheet: ${JSON.stringify(parsed.character_sheet?.map(c => ({ name: c.name, role: c.role, anchor_length: c.full_anchor?.length })))}`);
    console.log(`[VD-DEBUG]   world_anchor: "${parsed.world_anchor}"`);
    console.log(`[VD-DEBUG]   scenes: ${JSON.stringify(parsed.scenes?.map(s => ({ id: s.scene_id, camera: s.camera, desc_length: s.scene_description?.length, characters: s.characters_present, key_objects: s.key_objects, atmosphere: s.atmosphere?.substring(0, 50) })))}`);
    console.log(`[VD-DEBUG]   cover: ${JSON.stringify(parsed.cover)}`);

    const ms = Date.now() - startMs;
    console.log(`[VisualDirector] completed in ${ms}ms, ${parsed.scenes.length} scenes`);
    return parsed;
  } catch (err: any) {
    console.error("[VisualDirector] Error:", err?.message ?? err);
    console.error(`[VD-DEBUG] ERROR: ${err?.message ?? err}`);
    console.error(`[VD-DEBUG] FALLBACK: using old image_plan path`);
    throw err;
  }
}
