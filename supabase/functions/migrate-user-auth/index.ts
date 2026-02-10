import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Authentifiziere den Legacy-User
    const { userId } = await getAuthenticatedUser(req);
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and new password are required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Validiere E-Mail-Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Validiere Passwort-Mindestlänge
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Der userId ist bereits authentifiziert und validiert

    // 1. Get the user profile to retrieve the current password
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Prüfe ob User bereits migriert ist
    if (userProfile.auth_migrated && userProfile.auth_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User already migrated' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Prüfe ob E-Mail bereits in Verwendung ist
    const { data: existingEmail } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already in use' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Erstelle Supabase Auth User mit dem neuen Passwort
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        display_name: userProfile.display_name,
        admin_language: userProfile.admin_language,
        app_language: userProfile.app_language,
        text_language: userProfile.text_language,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = authData.user.id;

    // Aktualisiere user_profiles mit auth_id und auth_migrated flag
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update({
        auth_id: authUserId,
        email: email,
        auth_migrated: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateProfileError) {
      console.error('Error updating user profile:', updateProfileError);
      await supabase.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update user profile' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Aktualisiere user_roles mit auth_id
    const { error: updateRoleError } = await supabase
      .from('user_roles')
      .update({
        auth_id: authUserId,
      })
      .eq('user_id', userId);

    if (updateRoleError) {
      console.error('Error updating user role (non-critical):', updateRoleError);
    }

    console.log(`Successfully migrated user ${userId} to Supabase Auth with email ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully migrated to Supabase Auth',
        authUserId: authUserId,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Migration error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
