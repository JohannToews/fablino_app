import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already migrated
    if (userProfile.auth_migrated && userProfile.auth_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User already migrated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already in use
    const { data: existingEmail } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already in use' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Supabase Auth user with the existing password
    // Since password_hash is stored as plain text, we can use it directly
    const password = userProfile.password_hash;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm since they're existing users
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
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = authData.user.id;

    // 3. Update user_profiles with auth_id, email, and auth_migrated flag
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
      // Try to clean up the auth user we just created
      await supabase.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update user_roles with auth_id
    const { error: updateRoleError } = await supabase
      .from('user_roles')
      .update({
        auth_id: authUserId,
      })
      .eq('user_id', userId);

    if (updateRoleError) {
      console.error('Error updating user role (non-critical):', updateRoleError);
      // This is non-critical, continue anyway
    }

    console.log(`Successfully migrated user ${userId} to Supabase Auth with email ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully migrated to Supabase Auth',
        authUserId: authUserId,
        autoLogin: true, // Signal that the client should reload for auto-login
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
