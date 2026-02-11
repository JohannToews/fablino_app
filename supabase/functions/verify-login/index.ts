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
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: dbError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.password_hash !== password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = roleData?.role || 'standard';
    const sessionToken = crypto.randomUUID();
    
    // If user has an auth_id, generate a magic link token so the client
    // can establish a real Supabase Auth session (needed for RLS)
    let authToken: string | null = null;
    if (user.auth_id) {
      try {
        // Get the auth user's email
        const { data: authUser } = await supabase.auth.admin.getUserById(user.auth_id);
        if (authUser?.user?.email) {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: authUser.user.email,
          });
          if (!linkError && linkData?.properties?.hashed_token) {
            authToken = linkData.properties.hashed_token;
          } else {
            console.error('Error generating auth link:', linkError);
          }
        }
      } catch (authErr) {
        console.error('Error creating auth session for legacy user:', authErr);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        token: sessionToken,
        authToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          adminLanguage: user.admin_language,
          appLanguage: user.app_language,
          textLanguage: user.text_language,
          systemPrompt: user.system_prompt,
          email: user.email || null,
          authMigrated: user.auth_migrated || false,
          role: userRole
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
