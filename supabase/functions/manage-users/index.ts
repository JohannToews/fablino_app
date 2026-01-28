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
    
    const { action, userId, promptKey, promptValue, username, displayName, password, role } = await req.json();

    if (action === "list") {
      // Get all users with their roles
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, admin_language, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = users?.map(user => ({
        ...user,
        role: roles?.find(r => r.user_id === user.id)?.role || 'standard'
      }));

      return new Response(JSON.stringify({ users: usersWithRoles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create" && username && displayName && password) {
      // Check if username already exists
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Username already exists" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user profile
      const { data: newUser, error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          username: username.toLowerCase(),
          display_name: displayName,
          password_hash: password,
          admin_language: 'de',
          app_language: 'fr',
          text_language: 'fr',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create user role
      const userRole = role === 'admin' ? 'admin' : 'standard';
      await supabase
        .from("user_roles")
        .insert({ user_id: newUser.id, role: userRole });

      return new Response(JSON.stringify({ success: true, user: newUser }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "updateSystemPrompt" && promptKey && promptValue !== undefined) {
      // Update global system prompt in app_settings
      const { error } = await supabase
        .from("app_settings")
        .update({ value: promptValue, updated_at: new Date().toISOString() })
        .eq("key", promptKey);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete" && userId) {
      // Delete user and all related data
      // First delete user role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Delete kid_profiles
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
