import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to invoke edge functions with legacy auth headers when needed.
 * This ensures legacy users (username/password login) can access edge functions.
 */
export async function invokeEdgeFunction(functionName: string, body: Record<string, unknown>) {
  const headers: Record<string, string> = {};

  // Check if we have legacy auth data in either storage
  let legacySession = sessionStorage.getItem('liremagie_session');
  let legacyUserJson = sessionStorage.getItem('liremagie_user');

  if (!legacySession) {
    legacySession = localStorage.getItem('liremagie_session');
    legacyUserJson = localStorage.getItem('liremagie_user');
  }

  if (legacySession && legacyUserJson) {
    headers['x-legacy-token'] = legacySession;
    try {
      const legacyUser = JSON.parse(legacyUserJson);
      if (legacyUser.id) {
        headers['x-legacy-user-id'] = legacyUser.id;
      }
    } catch (e) {
      console.error('Failed to parse legacy user:', e);
    }
  }

  console.log(`[invokeEdgeFunction] ${functionName} - legacySession exists:`, !!legacySession, 'legacyUser exists:', !!legacyUserJson, 'headers:', Object.keys(headers));

  return supabase.functions.invoke(functionName, {
    body,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
