/**
 * Series Continuity State Merge – Sicherheitsnetz
 * 
 * Rein programmatischer Merge-Layer der nach der LLM-Response sicherstellt,
 * dass keine Informationen aus dem bisherigen continuity_state verloren gehen.
 * Funktioniert identisch für normale und interaktive Serien (Mitgestalten).
 * 
 * Performance: <50ms (reine Array/Object-Operationen, kein LLM-Call, kein DB-Read)
 */

export interface ContinuityState {
  established_facts: string[];
  open_threads: string[];
  character_states: Record<string, string>;
  world_rules: string[];
  signature_element: {
    description: string;
    usage_history: string[];
  };
}

export interface MergeResult {
  merged: ContinuityState;
  restoredFacts: number;
  restoredCharacters: string[];
  restoredWorldRules: number;
  restoredSignatureHistory: number;
  threadWarning: string | null;
}

const EMPTY_STATE: ContinuityState = {
  established_facts: [],
  open_threads: [],
  character_states: {},
  world_rules: [],
  signature_element: {
    description: '',
    usage_history: [],
  },
};

/**
 * Normalize a string for deduplication comparison.
 */
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Merge an "append-only" string array: all items from `previous` are kept,
 * new items from `incoming` are appended (deduped).
 * Returns [mergedArray, countOfRestoredItems].
 */
function mergeAppendOnly(
  previous: string[] | undefined,
  incoming: string[] | undefined,
): [string[], number] {
  const prev = previous ?? [];
  const inc = incoming ?? [];

  // Start with all previous items
  const result = [...prev];
  const seen = new Set(prev.map(normalize));

  // Add new items from incoming that weren't in previous
  for (const item of inc) {
    const key = normalize(item);
    if (!seen.has(key)) {
      result.push(item);
      seen.add(key);
    }
  }

  // Count how many items from previous were missing in incoming (= restored)
  const incomingNorm = new Set(inc.map(normalize));
  let restored = 0;
  for (const item of prev) {
    if (!incomingNorm.has(normalize(item))) {
      restored++;
    }
  }

  return [result, restored];
}

/**
 * Merge character_states: characters may evolve but never disappear.
 * Returns [mergedStates, restoredCharacterKeys].
 */
function mergeCharacterStates(
  previous: Record<string, string> | undefined,
  incoming: Record<string, string> | undefined,
): [Record<string, string>, string[]] {
  const prev = previous ?? {};
  const inc = incoming ?? {};
  const result: Record<string, string> = {};
  const restored: string[] = [];

  // Start with all previous characters
  for (const [key, val] of Object.entries(prev)) {
    if (key in inc) {
      // Character exists in new state → take updated value (development allowed)
      result[key] = inc[key];
    } else {
      // LLM forgot this character → restore from previous
      result[key] = val;
      restored.push(key);
    }
  }

  // Add new characters from incoming that weren't in previous
  for (const [key, val] of Object.entries(inc)) {
    if (!(key in result)) {
      result[key] = val;
    }
  }

  return [result, restored];
}

/**
 * Merge signature_element: description may evolve, usage_history is cumulative.
 * Returns [mergedElement, countOfRestoredHistoryEntries].
 */
function mergeSignatureElement(
  previous: ContinuityState['signature_element'] | undefined,
  incoming: ContinuityState['signature_element'] | undefined,
): [ContinuityState['signature_element'], number] {
  const prev = previous ?? { description: '', usage_history: [] };
  const inc = incoming ?? { description: '', usage_history: [] };

  // Description: take LLM version, fallback to previous
  const description = (inc.description && inc.description.trim().length > 0)
    ? inc.description
    : prev.description;

  // Usage history: always cumulative
  const prevHistory = prev.usage_history ?? [];
  const incHistory = inc.usage_history ?? [];

  // If LLM's history is shorter than previous, restore old entries + append new
  const merged: string[] = [...prevHistory];
  const seen = new Set(prevHistory.map(normalize));
  let restoredCount = 0;

  for (const entry of incHistory) {
    const key = normalize(entry);
    if (!seen.has(key)) {
      merged.push(entry);
      seen.add(key);
    }
  }

  // Count how many previous entries the LLM had dropped
  const incNorm = new Set(incHistory.map(normalize));
  for (const entry of prevHistory) {
    if (!incNorm.has(normalize(entry))) {
      restoredCount++;
    }
  }

  return [{ description, usage_history: merged }, restoredCount];
}

/**
 * Main merge function.
 * 
 * Merges the new continuity_state from the LLM with the previous state,
 * ensuring no information is lost. Works identically for normal and
 * interactive (Mitgestalten) series.
 */
export function mergeSeriesContinuityState(
  previousState: ContinuityState | null,
  newState: ContinuityState | null,
  currentEpisodeNumber: number,
  seriesMode?: 'normal' | 'interactive',
): ContinuityState {
  const mode = seriesMode || 'normal';

  // Edge case: Episode 1 (no previous state)
  if (!previousState) {
    if (newState) {
      console.log(`[ContinuityMerge] Ep${currentEpisodeNumber} (${mode}): No previous state, using LLM state as-is`);
      return ensureShape(newState);
    }
    console.warn(`[ContinuityMerge] Ep${currentEpisodeNumber} (${mode}): Both previous and new state are null, using empty default`);
    return { ...EMPTY_STATE };
  }

  // Edge case: LLM returned no state
  if (!newState) {
    console.warn(`[ContinuityMerge] Ep${currentEpisodeNumber} (${mode}): LLM returned no continuity_state! Keeping previous state.`);
    return ensureShape(previousState);
  }

  // ── Merge each field ──

  // a) established_facts: append-only
  const [mergedFacts, restoredFacts] = mergeAppendOnly(
    previousState.established_facts,
    newState.established_facts,
  );

  // b) open_threads: LLM may close threads (= remove them)
  const prevThreads = previousState.open_threads ?? [];
  const newThreads = newState.open_threads ?? [];
  let threadWarning: string | null = null;

  if (prevThreads.length > 0 && currentEpisodeNumber < 5) {
    const removedCount = prevThreads.length - newThreads.length;
    const removedPercent = removedCount / prevThreads.length;
    if (removedPercent > 0.5) {
      threadWarning = `${Math.round(removedPercent * 100)}% of threads removed (${removedCount}/${prevThreads.length}) in non-finale episode`;
      console.warn(`[ContinuityMerge] Ep${currentEpisodeNumber} (${mode}): WARNING — ${threadWarning}`);
    }
  }

  // c) character_states: characters never disappear
  const [mergedChars, restoredCharacters] = mergeCharacterStates(
    previousState.character_states,
    newState.character_states,
  );

  // d) world_rules: append-only
  const [mergedWorldRules, restoredWorldRules] = mergeAppendOnly(
    previousState.world_rules,
    newState.world_rules,
  );

  // e) signature_element: description may evolve, history is cumulative
  const [mergedSignature, restoredSignatureHistory] = mergeSignatureElement(
    previousState.signature_element,
    newState.signature_element,
  );

  const merged: ContinuityState = {
    established_facts: mergedFacts,
    open_threads: newThreads, // Accept LLM's threads (may close resolved ones)
    character_states: mergedChars,
    world_rules: mergedWorldRules,
    signature_element: mergedSignature,
  };

  // ── Logging ──
  console.log(`[ContinuityMerge] Ep${currentEpisodeNumber} (${mode}):`, JSON.stringify({
    seriesMode: mode,
    previousFactsCount: previousState.established_facts?.length || 0,
    newFactsCount: newState.established_facts?.length || 0,
    mergedFactsCount: merged.established_facts.length,
    restoredCharacters,
    restoredFacts,
    restoredWorldRules,
    restoredSignatureHistory,
    threadWarning,
  }));

  return merged;
}

/**
 * Ensure a partial/malformed state has the correct shape.
 */
function ensureShape(state: any): ContinuityState {
  return {
    established_facts: Array.isArray(state.established_facts) ? state.established_facts : [],
    open_threads: Array.isArray(state.open_threads) ? state.open_threads : [],
    character_states: (state.character_states && typeof state.character_states === 'object')
      ? state.character_states : {},
    world_rules: Array.isArray(state.world_rules) ? state.world_rules : [],
    signature_element: {
      description: state.signature_element?.description || '',
      usage_history: Array.isArray(state.signature_element?.usage_history)
        ? state.signature_element.usage_history : [],
    },
  };
}
