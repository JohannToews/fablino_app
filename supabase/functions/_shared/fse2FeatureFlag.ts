/**
 * Feature Flag: FSE2 (Story Engine 2)
 *
 * Controls which users get the new FSE2 story generation pipeline.
 * Reads the 'fse2_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Fail-safe: returns false on any error.
 */

export async function isFse2Enabled(
  userId: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'fse2_enabled_users')
      .single();

    if (error || !data?.value) {
      console.log('[FSE2] Feature flag not found or error, disabled for user:', userId);
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      console.warn('[FSE2] Failed to parse fse2_enabled_users value:', data.value);
      return false;
    }

    if (!Array.isArray(enabledUsers)) {
      console.warn('[FSE2] fse2_enabled_users is not an array');
      return false;
    }

    const enabled = enabledUsers.includes('*') || enabledUsers.includes(userId);
    console.log(`[FSE2] Feature flag check: userId=${userId}, result=${enabled}`);
    return enabled;
  } catch (err) {
    console.error('[FSE2] Feature flag check failed:', err);
    return false;
  }
}
