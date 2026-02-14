/**
 * Unit tests for mergeSeriesContinuityState()
 * 
 * Run with: deno test supabase/functions/_shared/seriesContinuityMerge.test.ts
 * Or:       npx tsx supabase/functions/_shared/seriesContinuityMerge.test.ts
 */

import { mergeSeriesContinuityState, ContinuityState } from './seriesContinuityMerge.ts';

// ── Test helpers ──

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✅ ${message}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertArrayEquals(actual: string[], expected: string[], message: string) {
  const pass = actual.length === expected.length &&
    actual.every((v, i) => v === expected[i]);
  assert(pass, message + (pass ? '' : ` — got [${actual.join(', ')}], expected [${expected.join(', ')}]`));
}

function assertObjectKeys(actual: Record<string, string>, expectedKeys: string[], message: string) {
  const actualKeys = Object.keys(actual).sort();
  const expKeys = [...expectedKeys].sort();
  const pass = actualKeys.length === expKeys.length &&
    actualKeys.every((v, i) => v === expKeys[i]);
  assert(pass, message + (pass ? '' : ` — got keys [${actualKeys.join(', ')}], expected [${expKeys.join(', ')}]`));
}

// ── Full default state for convenience ──

function makeState(overrides: Partial<ContinuityState>): ContinuityState {
  return {
    established_facts: [],
    open_threads: [],
    character_states: {},
    world_rules: [],
    signature_element: { description: '', usage_history: [] },
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════

console.log('\n═══ Test 1: LLM vergisst einen Charakter ═══');
{
  const prev = makeState({
    character_states: { "Lina": "mutig", "Bello": "treu" },
  });
  const next = makeState({
    character_states: { "Lina": "noch mutiger" }, // Bello fehlt!
  });
  const result = mergeSeriesContinuityState(prev, next, 2, 'normal');
  assert(result.character_states["Lina"] === "noch mutiger", "Lina updated to 'noch mutiger'");
  assert(result.character_states["Bello"] === "treu", "Bello restored from previous");
  assertObjectKeys(result.character_states, ["Lina", "Bello"], "Both characters present");
}

console.log('\n═══ Test 2: LLM vergisst established_facts ═══');
{
  const prev = makeState({
    established_facts: ["Lina hat einen magischen Stein", "Der Wald ist verzaubert"],
  });
  const next = makeState({
    established_facts: ["Der Wald ist verzaubert", "Ein neuer Weg wurde entdeckt"],
  });
  const result = mergeSeriesContinuityState(prev, next, 3, 'normal');
  assertArrayEquals(result.established_facts, [
    "Lina hat einen magischen Stein",
    "Der Wald ist verzaubert",
    "Ein neuer Weg wurde entdeckt",
  ], "All facts preserved + new added");
}

console.log('\n═══ Test 3: signature_element usage_history wird gekürzt ═══');
{
  const prev = makeState({
    signature_element: {
      description: "Blaue Feder",
      usage_history: ["Ep1: gefunden", "Ep2: leuchtete"],
    },
  });
  const next = makeState({
    signature_element: {
      description: "Blaue Feder",
      usage_history: ["Ep3: half bei Rätsel"], // LLM dropped Ep1+Ep2!
    },
  });
  const result = mergeSeriesContinuityState(prev, next, 3, 'normal');
  assertArrayEquals(result.signature_element.usage_history, [
    "Ep1: gefunden",
    "Ep2: leuchtete",
    "Ep3: half bei Rätsel",
  ], "All history entries preserved + new appended");
  assert(result.signature_element.description === "Blaue Feder", "Description unchanged");
}

console.log('\n═══ Test 4: Episode 1 (kein previous state) ═══');
{
  const next = makeState({
    established_facts: ["Lina lebt im Wald"],
    character_states: { "Lina": "neugierig" },
  });
  const result = mergeSeriesContinuityState(null, next, 1, 'normal');
  assertArrayEquals(result.established_facts, ["Lina lebt im Wald"], "Facts passed through");
  assert(result.character_states["Lina"] === "neugierig", "Character passed through");
}

console.log('\n═══ Test 5: LLM liefert keinen State ═══');
{
  const prev = makeState({
    established_facts: ["Lina hat einen Stein"],
    character_states: { "Lina": "mutig" },
  });
  const result = mergeSeriesContinuityState(prev, null, 2, 'normal');
  assertArrayEquals(result.established_facts, ["Lina hat einen Stein"], "Previous facts preserved");
  assert(result.character_states["Lina"] === "mutig", "Previous character preserved");
}

console.log('\n═══ Test 6: open_threads dürfen reduziert werden ═══');
{
  const prev = makeState({
    open_threads: ["Wer ist der Schatten?", "Wohin führt der Tunnel?"],
  });
  const next = makeState({
    open_threads: ["Wohin führt der Tunnel?"], // Schatten-Rätsel gelöst
  });
  const result = mergeSeriesContinuityState(prev, next, 3, 'normal');
  assertArrayEquals(result.open_threads, ["Wohin führt der Tunnel?"], "Resolved thread removed OK");
}

console.log('\n═══ Test 7: Warnung wenn zu viele Threads verschwinden (nicht Ep5) ═══');
{
  const prev = makeState({
    open_threads: ["Thread A", "Thread B", "Thread C", "Thread D"],
  });
  const next = makeState({
    open_threads: ["Thread D"], // 75% weg, Episode 3
  });
  // Should log a warning but still accept LLM's threads
  const result = mergeSeriesContinuityState(prev, next, 3, 'normal');
  assertArrayEquals(result.open_threads, ["Thread D"], "LLM threads accepted despite warning");
}

console.log('\n═══ Test 7b: Keine Warnung bei Episode 5 (Finale) ═══');
{
  const prev = makeState({
    open_threads: ["Thread A", "Thread B", "Thread C", "Thread D"],
  });
  const next = makeState({
    open_threads: [], // Alle weg — aber das ist OK im Finale
  });
  // Should NOT warn for Episode 5
  const result = mergeSeriesContinuityState(prev, next, 5, 'normal');
  assertArrayEquals(result.open_threads, [], "All threads closed in finale — no warning");
}

console.log('\n═══ Test 8: Branch-Entscheidung als established_fact (Modus B) ═══');
{
  const prev = makeState({
    established_facts: [
      "Lina lebt im Wald",
      "Lina hat den mutigen Weg durch die Höhle gewählt",   // Kind-Entscheidung Ep2
      "Der Drache wurde zum Verbündeten",                     // Konsequenz der Wahl
    ],
  });
  const next = makeState({
    established_facts: [
      "Lina lebt im Wald",
      "Ein neues Rätsel wurde entdeckt",  // LLM hat Branch-Facts vergessen!
    ],
  });
  const result = mergeSeriesContinuityState(prev, next, 3, 'interactive');
  assertArrayEquals(result.established_facts, [
    "Lina lebt im Wald",
    "Lina hat den mutigen Weg durch die Höhle gewählt",
    "Der Drache wurde zum Verbündeten",
    "Ein neues Rätsel wurde entdeckt",
  ], "Branch-decision facts restored for interactive series");
}

console.log('\n═══ Test 9: Interaktive Serie Ep5 Finale — alle Branch-Konsequenzen erhalten ═══');
{
  const prev = makeState({
    established_facts: [
      "Ep2: Kind wählte 'Den Drachen fragen'",
      "Ep3: Kind wählte 'Das Rätsel lösen'",
      "Ep4: Kind wählte 'Freunde um Hilfe bitten'",
    ],
    character_states: {
      "Lina": "entschlossen",
      "Drache": "Verbündeter seit Ep2",
    },
  });
  const next = makeState({
    established_facts: ["Die Geschichte endet gut"], // LLM hat alles vergessen
    character_states: { "Lina": "glücklich" },        // Drache fehlt!
  });
  const result = mergeSeriesContinuityState(prev, next, 5, 'interactive');
  assertArrayEquals(result.established_facts, [
    "Ep2: Kind wählte 'Den Drachen fragen'",
    "Ep3: Kind wählte 'Das Rätsel lösen'",
    "Ep4: Kind wählte 'Freunde um Hilfe bitten'",
    "Die Geschichte endet gut",
  ], "All branch choices preserved in finale");
  assert(result.character_states["Lina"] === "glücklich", "Lina updated");
  assert(result.character_states["Drache"] === "Verbündeter seit Ep2", "Drache restored");
}

console.log('\n═══ Test 10: world_rules append-only ═══');
{
  const prev = makeState({
    world_rules: ["Magie funktioniert nur nachts", "Der Wald reagiert auf Emotionen"],
  });
  const next = makeState({
    world_rules: ["Der Wald reagiert auf Emotionen", "Kristalle speichern Erinnerungen"],
  });
  const result = mergeSeriesContinuityState(prev, next, 3, 'normal');
  assertArrayEquals(result.world_rules, [
    "Magie funktioniert nur nachts",
    "Der Wald reagiert auf Emotionen",
    "Kristalle speichern Erinnerungen",
  ], "World rules preserved + new added");
}

console.log('\n═══ Test 11: Both null ═══');
{
  const result = mergeSeriesContinuityState(null, null, 1, 'normal');
  assertArrayEquals(result.established_facts, [], "Empty facts");
  assertArrayEquals(result.open_threads, [], "Empty threads");
  assertObjectKeys(result.character_states, [], "Empty characters");
  assertArrayEquals(result.world_rules, [], "Empty world rules");
  assert(result.signature_element.description === '', "Empty signature description");
  assertArrayEquals(result.signature_element.usage_history, [], "Empty signature history");
}

console.log('\n═══ Test 12: Duplicate facts (case-insensitive) ═══');
{
  const prev = makeState({
    established_facts: ["Lina hat einen Stein"],
  });
  const next = makeState({
    established_facts: ["lina hat einen stein", "Ein neues Abenteuer beginnt"],
  });
  const result = mergeSeriesContinuityState(prev, next, 2, 'normal');
  assert(result.established_facts.length === 2, `Deduped to 2 facts (got ${result.established_facts.length})`);
  assert(result.established_facts[0] === "Lina hat einen Stein", "Keeps original casing from previous");
  assert(result.established_facts[1] === "Ein neues Abenteuer beginnt", "New fact added");
}

console.log('\n═══ Test 13: Performance (<50ms) ═══');
{
  const bigPrev = makeState({
    established_facts: Array.from({ length: 100 }, (_, i) => `Fact ${i}`),
    world_rules: Array.from({ length: 50 }, (_, i) => `Rule ${i}`),
    character_states: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`Char ${i}`, `State ${i}`])),
    signature_element: {
      description: "Complex element",
      usage_history: Array.from({ length: 10 }, (_, i) => `Ep${i}: used`),
    },
  });
  const bigNew = makeState({
    established_facts: Array.from({ length: 80 }, (_, i) => `Fact ${i + 30}`), // Overlap + new
    world_rules: Array.from({ length: 40 }, (_, i) => `Rule ${i + 20}`),
    character_states: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`Char ${i}`, `Updated ${i}`])),
    signature_element: {
      description: "Updated element",
      usage_history: Array.from({ length: 3 }, (_, i) => `Ep${i + 10}: new usage`),
    },
  });
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    mergeSeriesContinuityState(bigPrev, bigNew, 4, 'interactive');
  }
  const elapsed = performance.now() - start;
  const perCall = elapsed / 100;
  assert(perCall < 50, `Single merge in ${perCall.toFixed(2)}ms (100 calls in ${elapsed.toFixed(0)}ms) — target <50ms`);
}

// ── Summary ──
console.log('\n══════════════════════════════════════════');
console.log(`Results: ${passCount}/${testCount} passed, ${failCount} failed`);
console.log('══════════════════════════════════════════\n');

if (failCount > 0) {
  // @ts-ignore - Deno exit
  if (typeof Deno !== 'undefined') Deno.exit(1);
  else process.exit(1);
}
