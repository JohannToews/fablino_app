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

## WORLD ANCHOR

One 20-30 word description of the visual atmosphere: lighting quality, color mood, art direction. NOT specific locations.

## SCENE BALANCING (CRITICAL)

Generated scenes MUST have maximum visual variety. Before finalizing
your scenes, verify ALL of these diversity checks:

LOCATION CHECK:
- No two consecutive scenes may share the same location/setting
- If the story has 3 scenes: at least 2 different locations
- If indoor→indoor, the rooms must look completely different

CHARACTER GROUPING CHECK:
- Vary who is visible: solo protagonist, duo, group, antagonist focus
- Do NOT show the same character combination in every scene
- At least one scene should show a different grouping than the others

CAMERA CHECK:
- Never use the same framing twice in a row
- If scene 1 is "close-up", scene 2 must be "medium shot" or "wide shot"
- Mix intimate (close) and environmental (wide) across the set

MOOD/LIGHTING CHECK:
- Scenes must have different atmospheres
- Vary: bright/dark, warm/cool, calm/tense, indoor/outdoor
- Consecutive scenes should feel visually different at a glance

COMPOSITION CHECK:
- Vary spatial relationships: centered vs. off-center,
  single figure vs. multiple, foreground action vs. background focus
- A viewer scrolling through all images should see VARIETY,
  not the same composition repeated

If you detect two scenes that would look too similar as illustrations,
REPLACE one with a different story moment.

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

Keep it simple. Only these options:

- "close-up" — face/emotions, intimate moments
- "medium shot" — characters interacting, dialogue
- "full body" — action, movement, full character visible
- "wide shot" — character small in environment, establishing scenes

Angle (optional addition):
- "low angle" — character looks powerful/heroic
- "high angle" — character looks small/vulnerable

Format: "{framing}" or "{framing}, {angle}"
Examples: "close-up", "wide shot, low angle", "medium shot"

Do NOT use: dutch angle, bird's eye, extreme close-up, over-the-shoulder,
or other cinematography jargon. Imagen doesn't understand these.

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
    const parsed = parseVisualDirectorResponse(content);
    if (!parsed) {
      console.error("[VisualDirector] JSON parse failed. Response starts with:", content.substring(0, 300));
      throw new Error("Visual Director returned invalid JSON");
    }
    if (!Array.isArray(parsed.character_sheet) || parsed.character_sheet.length === 0) {
      console.error("[VisualDirector] character_sheet missing or empty:", JSON.stringify(parsed).substring(0, 200));
      throw new Error("Visual Director must return a non-empty character_sheet");
    }
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== params.sceneCount) {
      console.error(
        "[VisualDirector] scenes length mismatch: got",
        parsed.scenes?.length,
        "expected",
        params.sceneCount
      );
      throw new Error(`Visual Director must return exactly ${params.sceneCount} scenes`);
    }
    const ms = Date.now() - startMs;
    console.log(`[VisualDirector] completed in ${ms}ms, ${parsed.scenes.length} scenes`);
    return parsed;
  } catch (err: any) {
    console.error("[VisualDirector] Error:", err?.message ?? err);
    throw err;
  }
}
