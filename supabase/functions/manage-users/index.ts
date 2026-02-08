import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAdmin } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Nur Admin kann diese Function nutzen
    const { supabase } = await requireAdmin(req);
    
    const { action, userId, promptKey, promptValue, username, displayName, password, role, adminLanguage, appLanguage } = await req.json();

    if (action === "list") {
      // Get all users with their roles
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, admin_language, app_language, created_at")
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      // Create user profile with selected admin language (default: de)
      const { data: newUser, error: insertError } = await supabase
        .from("user_profiles")
        .insert({
          username: username.toLowerCase(),
          display_name: displayName,
          password_hash: password,
          admin_language: adminLanguage || 'de',
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "updateSystemPrompt" && promptKey && promptValue !== undefined) {
      // Upsert global system prompt in app_settings (create if not exists)
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: promptKey, value: promptValue, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "updateLanguage" && userId && adminLanguage) {
      // Update user's admin language
      const { error } = await supabase
        .from("user_profiles")
        .update({ admin_language: adminLanguage, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "updateLanguages" && userId) {
      // Update user's language settings (admin + app)
      const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
      if (adminLanguage) updateData.admin_language = adminLanguage;
      if (appLanguage) updateData.app_language = appLanguage;
      
      const { error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
