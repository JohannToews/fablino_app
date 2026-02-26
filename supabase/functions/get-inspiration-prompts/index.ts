import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

/**
 * Returns active inspiration prompts for a given language (teaser + full_prompt only).
 * Auth: any authenticated user (RLS limits to active rows).
 */
Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  let auth;
  try {
    auth = await getAuthenticatedUser(req);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const supabase = auth.supabase;

  let language: string | null = null;
  if (req.method === "GET") {
    const url = new URL(req.url);
    language = url.searchParams.get("language");
  } else if (req.method === "POST") {
    try {
      const body = await req.json();
      language = body?.language ?? null;
    } catch {
      language = null;
    }
  }

  if (!language || typeof language !== "string" || language.trim() === "") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'language' parameter" }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const lang = language.trim().toLowerCase();

  // Admin: full list with id, batch_date, active for management UI
  if (auth.isAdmin) {
    const { data: adminData, error: adminError } = await supabase
      .from("inspiration_prompts")
      .select("id, teaser, full_prompt, batch_date, active")
      .eq("language", lang)
      .order("batch_date", { ascending: false })
      .limit(50);

    if (adminError) {
      return new Response(
        JSON.stringify({ error: adminError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify(adminData ?? []),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabase
    .from("inspiration_prompts")
    .select("teaser, full_prompt")
    .eq("active", true)
    .eq("language", lang)
    .order("batch_date", { ascending: false })
    .limit(10);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify(data ?? []),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});
