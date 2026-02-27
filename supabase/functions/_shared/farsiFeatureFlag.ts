/**
 * Feature Flag: Farsi (fa) story language
 *
 * Controls which users can select Farsi as a story generation language.
 * Reads the 'farsi_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Same logic as isEmotionFlowEnabled. Fail-safe: returns false on any error.
 */

export async function isFarsiEnabled(
  userId: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'farsi_enabled_users')
      .single();

    if (error || !data?.value) {
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      return false;
    }

    if (!Array.isArray(enabledUsers)) {
      return false;
    }

    return enabledUsers.includes('*') || enabledUsers.includes(userId);
  } catch (err) {
    console.error('[Farsi] Feature flag check failed:', err);
    return false;
  }
}
