import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAdmin } from "../_shared/auth.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const LANGUAGES = ["de", "fr", "en", "es", "nl", "it", "bs"] as const;

const SYSTEM_PROMPT = `You process children's story prompts for an inspiration feature. For each prompt:

1. ANONYMIZE: Replace personal names with family relationships in the ORIGINAL language:
   - Children's names → "mein Bruder"/"meine Schwester" (or equivalent in the prompt's language)
   - Parent names → "Mama"/"Papa"
   - Pet names → "mein Hund"/"meine Katze" (keep animal type if mentioned)
   - Location names (schools, streets) → generic equivalents

2. TEASER: Create a short, exciting version (max 50 characters) that works as input placeholder text. Must capture the core idea and make kids curious.

3. FULL: The complete anonymized prompt.

4. Translate TEASER and FULL into all these languages: de, fr, en, es, nl, it, bs

Return ONLY valid JSON, no markdown:
{
  "de": { "teaser": "...", "full": "..." },
  "fr": { "teaser": "...", "full": "..." },
  "en": { "teaser": "...", "full": "..." },
  "es": { "teaser": "...", "full": "..." },
  "nl": { "teaser": "...", "full": "..." },
  "it": { "teaser": "...", "full": "..." },
  "bs": { "teaser": "...", "full": "..." }
}`;

function safeParseJson(raw: string): Record<string, { teaser: string; full: string }> | null {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1)) as Record<string, { teaser: string; full: string }>;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(cleaned) as Record<string, { teaser: string; full: string }>;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    await requireAdmin(req);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_VERTEX_AI_KEY") || Deno.env.get("VERTEX_API_KEY_NEW");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY (or equivalent) not configured" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const batchDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let processed = 0;
  const errors: string[] = [];

  // Existing source_story_ids in inspiration_prompts (to exclude)
  const { data: existing } = await supabase
    .from("inspiration_prompts")
    .select("source_story_id")
    .not("source_story_id", "is", null);
  const existingIds = new Set((existing || []).map((r: { source_story_id: string | null }) => r.source_story_id).filter(Boolean));

  // Stories with 5-star rating and non-empty parent_prompt_text
  const { data: rated } = await supabase
    .from("story_ratings")
    .select("story_id")
    .eq("quality_rating", 5);
  const fiveStarIds = new Set((rated || []).map((r: { story_id: string | null }) => r.story_id).filter(Boolean));

  const candidateIds = [...fiveStarIds].filter((id) => !existingIds.has(id));
  if (candidateIds.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, errors: [], message: "No new 5-star stories with prompts to process" }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("id, parent_prompt_text")
    .in("id", candidateIds)
    .not("parent_prompt_text", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const toProcess = (stories || []).filter(
    (s: { parent_prompt_text: string | null }) => s.parent_prompt_text != null && (s.parent_prompt_text as string).trim().length > 20
  );

  for (const story of toProcess) {
    const promptText = (story.parent_prompt_text as string).trim();
    const userMessage = `Process this children's story prompt (anonymize and translate as instructed):\n\n${promptText}`;

    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.3 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        errors.push(`Story ${story.id}: API ${res.status} ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        errors.push(`Story ${story.id}: No text in Gemini response`);
        continue;
      }

      const parsed = safeParseJson(text);
      if (!parsed) {
        errors.push(`Story ${story.id}: Invalid JSON from Gemini`);
        console.error("[generate-inspiration-prompts] Invalid JSON, first 300 chars:", text.slice(0, 300));
        continue;
      }

      const rows: { source_story_id: string; language: string; teaser: string; full_prompt: string; batch_date: string; active: boolean }[] = [];
      for (const lang of LANGUAGES) {
        const entry = parsed[lang];
        if (entry && typeof entry.teaser === "string" && typeof entry.full === "string") {
          rows.push({
            source_story_id: story.id,
            language: lang,
            teaser: entry.teaser.slice(0, 300),
            full_prompt: entry.full,
            batch_date: batchDate,
            active: true,
          });
        }
      }

      if (rows.length > 0) {
        const { error: insertErr } = await supabase.from("inspiration_prompts").insert(rows);
        if (insertErr) {
          errors.push(`Story ${story.id}: ${insertErr.message}`);
        } else {
          processed += 1;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Story ${story.id}: ${msg}`);
    }
  }

  return new Response(
    JSON.stringify({
      processed,
      errors: errors.length,
      details: errors.length ? errors : undefined,
    }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});
