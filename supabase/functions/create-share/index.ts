 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 /**
  * Creates a share token for a story that expires in 24 hours.
  * 
  * @endpoint POST /create-share
  * @param {string} story_id - The ID of the story to share
  * @param {string} user_id - The ID of the user creating the share (must be story owner)
  * @returns {{ share_token: string, expires_at: string }} The share token and expiry
  */
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { story_id, user_id } = await req.json();
 
     if (!story_id || !user_id) {
       return new Response(
         JSON.stringify({ error: "Missing story_id or user_id" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Verify user owns the story
     const { data: story, error: storyError } = await supabase
       .from("stories")
       .select("id, user_id")
       .eq("id", story_id)
       .single();
 
     if (storyError || !story) {
       return new Response(
         JSON.stringify({ error: "Story not found" }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (story.user_id !== user_id) {
       return new Response(
         JSON.stringify({ error: "Not authorized to share this story" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Generate unique 8-character alphanumeric token
     const generateToken = (): string => {
       const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
       let token = "";
       for (let i = 0; i < 8; i++) {
         token += chars.charAt(Math.floor(Math.random() * chars.length));
       }
       return token;
     };
 
     // Try to insert with collision check
     let share_token = generateToken();
     let attempts = 0;
     const maxAttempts = 5;
 
     while (attempts < maxAttempts) {
       const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
 
       const { data: shareData, error: insertError } = await supabase
         .from("shared_stories")
         .insert({
           story_id,
           share_token,
           expires_at,
         })
         .select()
         .single();
 
       if (!insertError && shareData) {
         return new Response(
           JSON.stringify({
             share_token: shareData.share_token,
             expires_at: shareData.expires_at,
           }),
           { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // If duplicate key error, generate new token
       if (insertError?.code === "23505") {
         share_token = generateToken();
         attempts++;
       } else {
         throw insertError;
       }
     }
 
     return new Response(
       JSON.stringify({ error: "Failed to generate unique token" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error creating share:", error);
     return new Response(
       JSON.stringify({ error: "Internal server error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });