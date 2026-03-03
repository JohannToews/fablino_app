/**
 * Feature Flag: Avatar v2 (character_appearances, slots, etc.)
 *
 * Controls which users get the Avatar v2 pipeline (kid_appearance columns,
 * character_appearances table, appearance slots).
 * Reads the 'avatar_v2_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Same logic as isEmotionFlowEnabled / isFarsiEnabled. Fail-safe: returns false on any error.
 */
export async function isAvatarV2Enabled(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'avatar_v2_enabled_users')
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
    console.error('[AvatarV2] Feature flag check failed:', err);
    return false;
  }
}
