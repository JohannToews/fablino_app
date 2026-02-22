/**
 * Emotion-Flow-Engine — Shared utilities
 * weightedRandom is used by intensity, blueprint, and tone selectors.
 */

/**
 * Picks one item from the array according to the given weights.
 * weights[i] corresponds to items[i]. Weights can be any non-negative numbers.
 * If weights sum to 0 or items are empty, returns first item (or undefined if empty).
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length === 0) {
    throw new Error('weightedRandom: items must not be empty');
  }
  if (items.length !== weights.length) {
    throw new Error('weightedRandom: items and weights must have same length');
  }
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return items[0];
  }
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
