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
 */

let cachedResult: { userId: string; enabled: boolean } | null = null;

export async function isEmotionFlowEnabled(
  userId: string,
  supabaseClient: any
): Promise<boolean> {
  if (cachedResult && cachedResult.userId === userId) {
    return cachedResult.enabled;
  }

  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'emotion_flow_enabled_users')
      .single();

    if (error || !data?.value) {
      cachedResult = { userId, enabled: false };
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      console.warn('[EmotionFlow] Failed to parse emotion_flow_enabled_users value');
      cachedResult = { userId, enabled: false };
      return false;
    }

    if (!Array.isArray(enabledUsers)) {
      cachedResult = { userId, enabled: false };
      return false;
    }

    const enabled = enabledUsers.includes('*') || enabledUsers.includes(userId);
    cachedResult = { userId, enabled };
    return enabled;
  } catch (err) {
    console.error('[EmotionFlow] Feature flag check failed:', err);
    cachedResult = { userId, enabled: false };
    return false;
  }
}

/**
 * Reset the cached result. Useful for testing.
 */
export function resetFeatureFlagCache(): void {
  cachedResult = null;
}
