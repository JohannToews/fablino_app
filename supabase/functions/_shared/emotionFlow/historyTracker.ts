/**
 * Emotion Flow History Tracker — Phase 6.3
 *
 * Central history for all selectors: blueprint, protagonist, sidekick, antagonist,
 * opening, perspective, closing, macguffin, setting_detail, humor_technique, tension_technique.
 * Used to exclude recently used keys so consecutive stories vary.
 */

import type { EmotionFlowSupabase } from './types.ts';

/** Client that supports insert (runtime Supabase client). */
type SupabaseWithInsert = EmotionFlowSupabase & {
  from(table: string): EmotionFlowSupabase['from'] & {
    insert(
      rows: Record<string, unknown> | Record<string, unknown>[]
    ): Promise<{ data: unknown; error: unknown }>;
  };
};

/**
 * Returns the last N selected keys for a selector type (most recent first).
 * On error returns [] so selection is never blocked.
 */
export async function getRecentKeys(
  supabase: EmotionFlowSupabase,
  kidProfileId: string,
  selectorType: string,
  limit: number = 5
): Promise<string[]> {
  try {
    const res = await supabase
      .from('emotion_flow_history')
      .select('selected_key')
      .eq('kid_profile_id', kidProfileId)
      .eq('selector_type', selectorType)
      .order('created_at', { ascending: false })
      .limit(limit);
    const data = res.data;
    if (res.error || !data) return [];
    const arr = Array.isArray(data) ? data : [];
    return arr.map((r: { selected_key?: string }) => r.selected_key ?? '').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Fetches recent keys for multiple selector types in one query.
 * Returns a map selectorType -> string[] (last N keys per type).
 * Use when you need history for many types with a single DB round-trip.
 */
export async function getRecentKeysBatch(
  supabase: EmotionFlowSupabase,
  kidProfileId: string,
  selectorTypes: string[],
  limitPerType: number = 3
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const st of selectorTypes) out[st] = [];
  if (selectorTypes.length === 0) return out;
  try {
    const res = await supabase
      .from('emotion_flow_history')
      .select('selector_type, selected_key, created_at')
      .eq('kid_profile_id', kidProfileId)
      .in('selector_type', selectorTypes)
      .limit(selectorTypes.length * limitPerType * 4);
    const data = res.data;
    if (res.error || !Array.isArray(data)) return out;
    const rows = data as { selector_type?: string; selected_key?: string; created_at?: string }[];
    const sorted = [...rows].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    const seen: Record<string, Set<string>> = {};
    for (const st of selectorTypes) seen[st] = new Set<string>();
    for (const r of sorted) {
      const st = r.selector_type ?? '';
      const key = (r.selected_key ?? '').trim();
      if (!st || !key || !selectorTypes.includes(st)) continue;
      if (seen[st].has(key)) continue;
      seen[st].add(key);
      if (out[st].length < limitPerType) out[st].push(key);
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Records one selection. Prefer recordStorySelections for batch.
 */
export async function recordSelection(
  supabase: SupabaseWithInsert,
  kidProfileId: string,
  selectorType: string,
  selectedKey: string
): Promise<void> {
  try {
    await (supabase as any)
      .from('emotion_flow_history')
      .insert({
        kid_profile_id: kidProfileId,
        selector_type: selectorType,
        selected_key: selectedKey,
      });
  } catch (err) {
    console.error('[EmotionFlow] History recordSelection failed:', err);
  }
}

/**
 * Records all selections for one story in a single batch.
 * Filters out null/undefined keys. Errors are logged only; story generation is not blocked.
 */
export async function recordStorySelections(
  supabase: SupabaseWithInsert,
  kidProfileId: string,
  selections: { selectorType: string; selectedKey: string | null | undefined }[]
): Promise<void> {
  const rows = selections
    .filter((s) => s.selectedKey != null && String(s.selectedKey).trim() !== '')
    .map((s) => ({
      kid_profile_id: kidProfileId,
      selector_type: s.selectorType,
      selected_key: s.selectedKey!.trim(),
    }));
  if (rows.length === 0) return;
  try {
    const client = supabase as any;
    const res = await client.from('emotion_flow_history').insert(rows);
    if (res.error) {
      console.error('[EmotionFlow] History recordStorySelections error:', res.error);
      return;
    }
    console.log('[EmotionFlow] History recorded:', rows.length, 'entries for kid=' + kidProfileId);
  } catch (err) {
    console.error('[EmotionFlow] History recordStorySelections failed:', err);
  }
}
