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
    const { displayName, password, adminLanguage } = await req.json();

    // Validate input
    if (!displayName || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name and password required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof displayName !== 'string' || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 4) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 4 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate username from display name (lowercase, no spaces)
    const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Check for existing username and generate unique one
    while (true) {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (!existing) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Determine app language (same as admin language, or fallback)
    const validAdminLang = ['de', 'fr', 'en', 'es', 'nl'].includes(adminLanguage) ? adminLanguage : 'de';
    const appLanguage = ['de', 'fr', 'en'].includes(validAdminLang) ? validAdminLang : 'en';
    
    // Text language defaults to French for learning
    const textLanguage = 'fr';

    // Create user profile
    const { data: newUser, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        username,
        display_name: displayName.trim(),
        password_hash: password, // Simple storage for demo app
        admin_language: validAdminLang,
        app_language: appLanguage,
        text_language: textLanguage,
        system_prompt: null, // Will use global system prompt
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        token: sessionToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.display_name,
          adminLanguage: newUser.admin_language,
          appLanguage: newUser.app_language,
          textLanguage: newUser.text_language,
          systemPrompt: null,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});