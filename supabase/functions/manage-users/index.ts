import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, userId } = await req.json();

    if (action === "list") {
      // Get all users
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, admin_language, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete" && userId) {
      // Delete user and all related data
      // First delete kid_profiles
      await supabase.from("kid_profiles").delete().eq("user_id", userId);
      
      // Delete stories and related data
      const { data: stories } = await supabase
        .from("stories")
        .select("id")
        .eq("user_id", userId);
      
      if (stories) {
        for (const story of stories) {
          await supabase.from("comprehension_questions").delete().eq("story_id", story.id);
          await supabase.from("marked_words").delete().eq("story_id", story.id);
        }
        await supabase.from("stories").delete().eq("user_id", userId);
      }
      
      // Delete user results
      await supabase.from("user_results").delete().eq("user_id", userId);
      
      // Finally delete user profile
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
