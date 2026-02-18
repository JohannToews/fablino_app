// @ts-expect-error — hypher + hyphenation.* packages lack TS declarations
import Hypher from 'hypher';
// @ts-expect-error
import german from 'hyphenation.de';
// @ts-expect-error
import french from 'hyphenation.fr';
// @ts-expect-error
import english from 'hyphenation.en-us';
// @ts-expect-error
import spanish from 'hyphenation.es';
// @ts-expect-error
import dutch from 'hyphenation.nl';
// @ts-expect-error
import italian from 'hyphenation.it';

const hyphers: Record<string, InstanceType<typeof Hypher>> = {
  de: new Hypher(german),
  fr: new Hypher(french),
  en: new Hypher(english),
  es: new Hypher(spanish),
  nl: new Hypher(dutch),
  it: new Hypher(italian),
};

/**
 * Split a word into syllables using TeX hyphenation patterns.
 * Returns an array with at least one element.
 *
 *   syllabify('Geheimnis', 'de') → ['Ge', 'heim', 'nis']
 *   syllabify('bonjour', 'fr')   → ['bon', 'jour']
 *   syllabify('the', 'en')       → ['the']
 */
export function syllabify(word: string, language: string): string[] {
  if (!word || word.trim().length === 0) return [word];

  const hypher = hyphers[language] || hyphers['de'];

  try {
    const result = hypher.hyphenate(word);
    return result.length > 0 ? result : [word];
  } catch {
    return [word];
  }
}

// ── Live monitoring (first 20 words per page) ───────────────
let _liveLogCount = 0;
const LIVE_LOG_MAX = 20;

export function syllabifyWithLog(word: string, language: string): string[] {
  const result = syllabify(word, language);

  if (_liveLogCount < LIVE_LOG_MAX) {
    const status = result.length > 1 ? '✂️' : '1️⃣';
    console.log(
      `[LIVE ${_liveLogCount + 1}/${LIVE_LOG_MAX}] ${status} "${word}" (${language}) → [${result.join('|')}] (${result.length} Silben)`
    );
    _liveLogCount++;

    if (_liveLogCount === LIVE_LOG_MAX) {
      console.log('[LIVE] — Stop nach 20 Wörtern.');
      console.log('[LIVE] ✂️ = mehrere Silben (gut!)');
      console.log('[LIVE] 1️⃣ = Einsilber (OK wenn kurzes Wort)');
      console.log('[LIVE] ❌ Wenn 3+ Buchstaben Wörter nur 1 Silbe haben → Problem');
    }
  }
  return result;
}

export function resetLiveLog() { _liveLogCount = 0; }

/** Count syllables without allocating the full array when only the count is needed. */
export function countSyllables(word: string, language: string): number {
  if (!word || word.trim().length === 0) return 0;
  return syllabify(word, language).length;
}

/** Languages that have hyphenation patterns loaded. */
export const SUPPORTED_LANGUAGES = Object.keys(hyphers);

export function isSyllableModeSupported(language: string): boolean {
  return language.toLowerCase().substring(0, 2) in hyphers;
}

// ── Self-test (runs once at import time) ─────────────────────
const _tests = [
  { word: 'Geheimnis', lang: 'de', min: 3 },
  { word: 'Schmetterling', lang: 'de', min: 3 },
  { word: 'bonjour', lang: 'fr', min: 2 },
  { word: 'soudainement', lang: 'fr', min: 4 },
  { word: 'beautiful', lang: 'en', min: 3 },
];

let _allOk = true;
_tests.forEach(({ word, lang, min }) => {
  const r = syllabify(word, lang);
  const ok = r.length >= min;
  if (!ok) _allOk = false;
  console.log(`[syllabify] ${ok ? '✅' : '❌'} ${word} (${lang}) → [${r.join('|')}] (${r.length} syl, expect ≥${min})`);
});
console.log(`[syllabify] ${_allOk ? '✅ All tests passed' : '❌ FAILURE — syllabification broken!'}`);
