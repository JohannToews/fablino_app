import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireAdmin, getAuthenticatedUser } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { action, userId, promptKey, promptValue, username, displayName, password, role, adminLanguage, appLanguage } = body;

    // For language updates on own profile, allow any authenticated user
    if (action === "updateLanguages" || action === "updateLanguage") {
      const auth = await getAuthenticatedUser(req);
      
      // Allow if updating own profile OR if admin
      if (userId === auth.userId || auth.isAdmin) {
        const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
        if (adminLanguage) updateData.admin_language = adminLanguage;
        if (appLanguage) updateData.app_language = appLanguage;
        
        const { error } = await auth.supabase
          .from("user_profiles")
          .update(updateData)
          .eq("id", userId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      throw new Error('Unauthorized: cannot update other user languages');
    }

    // All other actions require admin
    const { supabase } = await requireAdmin(req);

    if (action === "list") {
      // Get all users with their roles
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, admin_language, app_language, email, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = users?.map((user: any) => ({
        ...user,
        role: roles?.find((r: any) => r.user_id === user.id)?.role || 'standard'
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

    // updateLanguage and updateLanguages are handled above (before requireAdmin)

    if (action === "deleteAuthUser" && body.authId) {
      const { error } = await supabase.auth.admin.deleteUser(body.authId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "delete" && userId) {
      // Fetch auth_id before deleting profile
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("auth_id")
        .eq("id", userId)
        .maybeSingle();

      // Delete user and all related data
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("kid_profiles").delete().eq("user_id", userId);
      
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
      
      await supabase.from("user_results").delete().eq("user_id", userId);
      
      // Delete user profile
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Also delete the Auth user so the email can be re-registered
      if (userProfile?.auth_id) {
        await supabase.auth.admin.deleteUser(userProfile.auth_id);
      }

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
