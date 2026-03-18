/**
 * Feature Flag: FSE3 (Story Engine 3)
 *
 * Controls which users get the new FSE3 multi-pass story generation pipeline.
 * Reads the 'fse3_enabled_users' key from app_settings.
 *
 * Values:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Fail-safe: returns false on any error.
 */

export async function isFse3Enabled(
  userId: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'fse3_enabled_users')
      .single();

    if (error || !data?.value) {
      console.log('[FSE3] Feature flag not found or error, disabled for user:', userId);
      return false;
    }

    let enabledUsers: string[];
    try {
      enabledUsers = JSON.parse(data.value);
    } catch {
      console.warn('[FSE3] Failed to parse fse3_enabled_users value:', data.value);
      return false;
    }

    if (!Array.isArray(enabledUsers)) {
      console.warn('[FSE3] fse3_enabled_users is not an array');
      return false;
    }

    const enabled = enabledUsers.includes('*') || enabledUsers.includes(userId);
    console.log(`[FSE3] Feature flag check: userId=${userId}, result=${enabled}`);
    return enabled;
  } catch (err) {
    console.error('[FSE3] Feature flag check failed:', err);
    return false;
  }
}

/**
 * Get the configured model for a specific FSE3 pass.
 *
 * Reads app_settings key 'fse3_model_{passName}' (e.g. 'fse3_model_pass0').
 * Falls back to 'gemini-2.5-flash' if no entry exists.
 */
export async function getModel(
  passName: string,
  supabaseClient: any
): Promise<string> {
  const DEFAULT_MODEL = 'gemini-2.5-flash';

  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', `fse3_model_${passName}`)
      .single();

    if (error || !data?.value) {
      console.log(`[FSE3] Model for ${passName} not found, using default: ${DEFAULT_MODEL}`);
      return DEFAULT_MODEL;
    }

    let model: string;
    try {
      model = JSON.parse(data.value);
    } catch {
      console.warn(`[FSE3] Failed to parse model value for ${passName}:`, data.value);
      return DEFAULT_MODEL;
    }

    if (typeof model !== 'string' || model.trim() === '') {
      console.warn(`[FSE3] Invalid model value for ${passName}, using default`);
      return DEFAULT_MODEL;
    }

    console.log(`[FSE3] Model for ${passName}: ${model}`);
    return model;
  } catch (err) {
    console.error(`[FSE3] Model lookup failed for ${passName}:`, err);
    return DEFAULT_MODEL;
  }
}
