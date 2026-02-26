import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const ALL_LANGS = ["de","fr","en","es","nl","it","bs","pt","sk","tr","bg","ro","pl","lt","hu","ca","sl","uk","ru"];

const LANG_NAMES: Record<string, string> = {
  de: "German", fr: "French", en: "English", es: "Spanish",
  nl: "Dutch", it: "Italian", bs: "Bosnian", pt: "Portuguese",
  sk: "Slovak", tr: "Turkish", bg: "Bulgarian", ro: "Romanian",
  pl: "Polish", lt: "Lithuanian", hu: "Hungarian", ca: "Catalan",
  sl: "Slovenian",
  uk: "Ukrainian",
  ru: "Russian",
};

Deno.serve(async (req) => {
  const optionsRes = handleCorsOptions(req);
  if (optionsRes) return optionsRes;
  const corsHeaders = getCorsHeaders(req);

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: facts, error } = await supabase.from("fun_facts").select("*");
  if (error || !facts) {
    return new Response(JSON.stringify({ error: "Failed to load fun_facts" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find facts missing translations
  const toTranslate: { id: string; enText: string; missingLangs: string[]; existing: Record<string, string> }[] = [];

  for (const fact of facts) {
    const translations = (fact.translations || {}) as Record<string, string>;
    const missingLangs = ALL_LANGS.filter((l) => !translations[l]);
    if (missingLangs.length === 0) continue;
    const sourceText = translations.en || translations.de;
    if (!sourceText) continue;
    toTranslate.push({ id: fact.id, enText: sourceText, missingLangs, existing: translations });
  }

  if (toTranslate.length === 0) {
    return new Response(JSON.stringify({ message: "All fun_facts already translated", updated: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const BATCH_SIZE = 10;
  let updatedCount = 0;

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const targetLangs = [...new Set(batch.flatMap((b) => b.missingLangs))];
    const langList = targetLangs.map((l) => `${l} (${LANG_NAMES[l]})`).join(", ");
    const factsBlock = batch.map((b, idx) => `${idx + 1}. "${b.enText}"`).join("\n");

    const prompt = `Translate these fun facts for children into: ${langList}.
Keep each translation SHORT (one sentence), fun, and age-appropriate (6-12 years).
Do NOT include a "Did you know that" prefix – only the fact itself.

Facts:
${factsBlock}

Return ONLY a JSON array where each element has translations for that fact.
Example: [{"pt": "...", "tr": "..."}, {"pt": "...", "tr": "..."}]
No markdown, no explanation. Array length must be ${batch.length}.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini error:", await response.text());
        continue;
      }

      const data = await response.json();
      let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let translations: Record<string, string>[];
      try {
        translations = JSON.parse(content);
      } catch {
        console.error("Failed to parse:", content.slice(0, 300));
        continue;
      }

      for (let j = 0; j < batch.length; j++) {
        const fact = batch[j];
        const newTrans = translations[j];
        if (!newTrans) continue;

        const merged = { ...fact.existing, ...newTrans };
        const { error: updateErr } = await supabase
          .from("fun_facts")
          .update({ translations: merged })
          .eq("id", fact.id);

        if (!updateErr) updatedCount++;
        else console.error("Update error for", fact.id, updateErr);
      }
    } catch (err) {
      console.error("Batch error:", err);
    }
  }

  return new Response(
    JSON.stringify({ message: `Translated ${updatedCount} fun_facts`, updated: updatedCount }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
