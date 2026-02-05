 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * Retrieves a shared story by token. Returns story content if valid and not expired.
  * 
  * @endpoint GET /get-share?token={share_token}
  * @param {string} token - The 8-character share token
  * @returns {{ title: string, content: string, difficulty: string, text_language: string }} Story data
  * @returns {{ error: string, expired: boolean }} Error if token invalid or expired
  */
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const url = new URL(req.url);
     const token = url.searchParams.get("token");
 
     if (!token) {
       return new Response(
         JSON.stringify({ error: "Missing token parameter" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Find share by token
     const { data: share, error: shareError } = await supabase
       .from("shared_stories")
       .select("*, stories(*)")
       .eq("share_token", token)
       .single();
 
     if (shareError || !share) {
       return new Response(
         JSON.stringify({ error: "Share not found", expired: false }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check if expired
     if (new Date(share.expires_at) < new Date()) {
       return new Response(
         JSON.stringify({ error: "Share has expired", expired: true }),
         { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Increment retrieved count
     await supabase
       .from("shared_stories")
       .update({ retrieved_count: (share.retrieved_count || 0) + 1 })
       .eq("id", share.id);
 
     const story = share.stories;
 
     // Return only safe story data (no user info)
     return new Response(
       JSON.stringify({
         title: story.title,
         content: story.content,
         difficulty: story.difficulty,
         text_language: story.text_language,
         cover_image_url: story.cover_image_url,
         text_type: story.text_type,
       }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error getting share:", error);
     return new Response(
       JSON.stringify({ error: "Internal server error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });