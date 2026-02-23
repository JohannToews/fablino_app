/**
 * Feature Flag: Emotion-Flow-Engine
 *
 * Controls which users get the new Emotion-Flow story generation pipeline.
 * Reads the 'emotion_flow_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Fail-safe: returns false on any error.
 * Caches the result per request (module-level) to avoid repeated DB calls.
 * IMPORTANT: Cache is reset at the start of each check to prevent stale results
 * across warm Edge Function invocations.
 */

export async function isEmotionFlowEnabled(
  userId: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'emotion_flow_enabled_users')
      .single();

    if (error || !data?.value) {
      console.log('[EmotionFlow] Feature flag not found or error, disabled for user:', userId);
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      console.warn('[EmotionFlow] Failed to parse emotion_flow_enabled_users value:', data.value);
      return false;
    }

    if (!Array.isArray(enabledUsers)) {
      console.warn('[EmotionFlow] emotion_flow_enabled_users is not an array');
      return false;
    }

    const enabled = enabledUsers.includes('*') || enabledUsers.includes(userId);
    console.log(`[EmotionFlow] Feature flag check: userId=${userId}, enabledUsers=${JSON.stringify(enabledUsers)}, result=${enabled}`);
    return enabled;
  } catch (err) {
    console.error('[EmotionFlow] Feature flag check failed:', err);
    return false;
  }
}

/**
 * Reset the cached result. Kept for API compatibility but is now a no-op
 * since caching was removed to prevent stale results in warm Edge Functions.
 */
export function resetFeatureFlagCache(): void {
  // no-op — caching removed
}
