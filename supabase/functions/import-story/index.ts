 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * Imports a shared story into a user's library by creating a copy.
  * 
  * @endpoint POST /import-story
  * @param {string} share_token - The 8-character share token
  * @param {string} user_id - The ID of the user importing the story
  * @param {string} kid_profile_id - Optional kid profile to assign the story to
  * @returns {{ story_id: string }} The ID of the newly created story
  */
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { share_token, user_id, kid_profile_id } = await req.json();
 
     if (!share_token || !user_id) {
       return new Response(
         JSON.stringify({ error: "Missing share_token or user_id" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Find share by token
     const { data: share, error: shareError } = await supabase
       .from("shared_stories")
       .select("*, stories(*)")
       .eq("share_token", share_token)
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
 
     const originalStory = share.stories;
 
      // Create a copy of the story (no imported_from for privacy)
      // Note: Don't set status fields - let them use defaults to avoid check constraint issues
      const { data: newStory, error: insertError } = await supabase
        .from("stories")
        .insert({
          title: originalStory.title,
          content: originalStory.content,
          difficulty: originalStory.difficulty,
          text_language: originalStory.text_language,
          text_type: originalStory.text_type,
          cover_image_url: originalStory.cover_image_url,
          story_images: originalStory.story_images,
          user_id,
          kid_profile_id: kid_profile_id || null,
        })
        .select()
        .single();
 
     if (insertError || !newStory) {
       console.error("Error creating story copy:", insertError);
       return new Response(
         JSON.stringify({ error: "Failed to import story" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     return new Response(
       JSON.stringify({ story_id: newStory.id }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error importing story:", error);
     return new Response(
       JSON.stringify({ error: "Internal server error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });