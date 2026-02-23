/**
 * Feature Flag: Comic-Strip-Modus (Task 5b.1)
 *
 * Controls which users get the Comic-Strip image pipeline (2x2 grid, etc.).
 * Reads the 'comic_strip_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Same logic as isEmotionFlowEnabled. Fail-safe: returns false on any error.
 */

let cachedResult: { userId: string; enabled: boolean } | null = null;

export async function isComicStripEnabled(
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
      .eq('key', 'comic_strip_enabled_users')
      .single();

    if (error || !data?.value) {
      cachedResult = { userId, enabled: false };
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      console.warn('[ComicStrip] Failed to parse comic_strip_enabled_users value');
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
    console.error('[ComicStrip] Feature flag check failed:', err);
    cachedResult = { userId, enabled: false };
    return false;
  }
}

/**
 * Reset the cached result. Useful for testing.
 */
export function resetComicStripFeatureFlagCache(): void {
  cachedResult = null;
}
