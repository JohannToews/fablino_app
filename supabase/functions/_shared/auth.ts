import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface AuthResult {
  userId: string;        // user_profiles.id (für DB-Queries)
  authMode: 'supabase' | 'legacy';
  isAdmin: boolean;
  supabase: any;         // Authenticated Supabase client
}

/**
 * Authentifiziert den Request – unterstützt beide Modi:
 * 1. Supabase Auth (Authorization Bearer Token)
 * 2. Legacy Auth (x-legacy-token + x-legacy-user-id Header)
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthResult> {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Versuch 1: Supabase Auth Token
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (user && !error) {
      // User-Profil laden via auth_id
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      const { data: role } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      return {
        userId: profile.id,
        authMode: 'supabase',
        isAdmin: role?.role === 'admin',
        supabase: supabaseAdmin,
      };
    }
  }

  // Versuch 2: Legacy Token (Übergangsphase)
  const legacyToken = req.headers.get('x-legacy-token');
  const legacyUserId = req.headers.get('x-legacy-user-id');
  
  if (legacyToken && legacyUserId) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', legacyUserId)
      .single();

    if (profile) {
      const { data: role } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .single();

      return {
        userId: profile.id,
        authMode: 'legacy',
        isAdmin: role?.role === 'admin',
        supabase: supabaseAdmin,
      };
    }
  }

  throw new Error('Unauthorized');
}

export async function requireAdmin(req: Request): Promise<AuthResult> {
  const result = await getAuthenticatedUser(req);
  if (!result.isAdmin) throw new Error('Admin access required');
  return result;
}
