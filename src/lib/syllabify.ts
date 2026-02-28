// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Hypher from 'hypher';
// @ts-ignore
import german from 'hyphenation.de';
// @ts-ignore
import english from 'hyphenation.en-us';
// @ts-ignore
import spanish from 'hyphenation.es';
// @ts-ignore
import dutch from 'hyphenation.nl';
// @ts-ignore
import italian from 'hyphenation.it';

/** Languages that have real hyphenation patterns (no fallback). */
export const SUPPORTED_SYLLABLE_LANGUAGES = new Set<string>(['de', 'fr', 'en', 'es', 'nl', 'it']);

export function isSyllableSupported(lang: string): boolean {
  const key = lang.toLowerCase().substring(0, 2);
  return SUPPORTED_SYLLABLE_LANGUAGES.has(key);
}

// === DE + other langs: hypher (synchronous, good quality) ===
const hyphers: Record<string, InstanceType<typeof Hypher>> = {
  de: new Hypher(german),
  en: new Hypher(english),
  es: new Hypher(spanish),
  nl: new Hypher(dutch),
  it: new Hypher(italian),
};

// === FR: hyphen library (async preload, cached) ===
// hypher FR patterns have ~20% errors on basic words.
// The `hyphen` library has much better FR patterns but only works
// reliably in async mode (hyphenateSync breaks in Vite production builds).
const frCache: Map<string, string[]> = new Map();
let frReady = false;

/**
 * Preload French syllable data by running every unique word through
 * the async `hyphen/fr` hyphenator and caching the result.
 * Call once per story when language === 'fr'.
 */
export async function preloadFrenchSyllables(text: string): Promise<void> {
  if (!text) return;

  const words = [...new Set(
    text
      .replace(/[.,!?;:'"«»„"\-–—()\[\]{}]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0)
  )];

  console.log(`[syllabify] FR: ${words.length} einzigartige Wörter vorladen...`);

  // Dynamic import — avoids Vite code-splitting issues with pattern files
  const { hyphenate } = await import('hyphen/fr');

  for (const word of words) {
    try {
      const hyphenated: string = await hyphenate(word, { minWordLength: 1 });
      const syllables = hyphenated.split('\u00AD');
      frCache.set(word.toLowerCase(), syllables);
    } catch {
      frCache.set(word.toLowerCase(), [word]);
    }
  }

  frReady = true;
  console.log(`[syllabify] FR: ✅ ${frCache.size} Wörter gecached`);

  const testWords = ['autres', 'ressemble', 'concentre', 'pétillent', 'bonjour', 'soudainement'];
  testWords.forEach(w => {
    const cached = frCache.get(w.toLowerCase());
    if (cached) {
      console.log(`[syllabify] FR check: "${w}" → [${cached.join('|')}]`);
    }
  });
}

/**
 * General preload entry point. Currently only FR needs async preloading.
 * Extend `asyncLanguages` if other languages need the same treatment.
 */
const asyncLanguages = ['fr'];

export async function preloadSyllables(text: string, language: string): Promise<void> {
  const lang = language.toLowerCase().substring(0, 2);
  if (asyncLanguages.includes(lang)) {
    await preloadFrenchSyllables(text);
  }
}

/**
 * Split a word into syllables.
 *
 * DE + en/es/nl/it → hypher (synchronous, good quality)
 * FR              → cache lookup (must call preloadSyllables first)
 * Unsupported     → return word as single segment (no hyphenation)
 */
export function syllabify(word: string, language: string): string[] {
  if (!word || word.trim().length === 0) return [word];

  const lang = language.toLowerCase().substring(0, 2);

  if (!isSyllableSupported(lang)) {
    return [word];
  }

  if (lang === 'fr') {
    const cached = frCache.get(word.toLowerCase());
    if (cached) return cached;
    if (frReady) {
      console.warn(`[syllabify] FR cache miss: "${word}"`);
    }
    return [word];
  }

  const hypher = hyphers[lang];
  if (!hypher) return [word];
  try {
    const result = hypher.hyphenate(word);
    return result.length > 0 ? result : [word];
  } catch {
    return [word];
  }
}

// ── Live monitoring (first 20 words, resets on language change) ──
let _liveLogCount = 0;
let _lastLanguage = '';
const LIVE_LOG_MAX = 20;

export function syllabifyWithLog(word: string, language: string): string[] {
  if (language !== _lastLanguage) {
    _liveLogCount = 0;
    _lastLanguage = language;
    console.log(`[LIVE] === Neue Sprache: ${language} — Monitor reset ===`);
  }

  const result = syllabify(word, language);

  if (_liveLogCount < LIVE_LOG_MAX) {
    const status = result.length > 1 ? '✂️' : '1️⃣';
    console.log(
      `[LIVE ${_liveLogCount + 1}/${LIVE_LOG_MAX}] ${status} "${word}" (${language}) → [${result.join('|')}] (${result.length} Silben)`
    );
    _liveLogCount++;
  }
  return result;
}

export function resetLiveLog() {
  _liveLogCount = 0;
  _lastLanguage = '';
}

/** Count syllables without allocating the full array when only the count is needed. */
export function countSyllables(word: string, language: string): number {
  if (!word || word.trim().length === 0) return 0;
  return syllabify(word, language).length;
}

/** Languages that have hyphenation patterns loaded. */
export const SUPPORTED_LANGUAGES = [...Object.keys(hyphers), 'fr'];

/** @deprecated Use isSyllableSupported for UI (show toggle only when true). */
export function isSyllableModeSupported(language: string): boolean {
  return isSyllableSupported(language);
}

/** Whether FR preloading has completed. */
export function isFrenchReady(): boolean {
  return frReady;
}

// ── Self-test (runs once at import time, DE only — FR is async) ──
const _tests = [
  { word: 'Geheimnis', lang: 'de', min: 3 },
  { word: 'Schmetterling', lang: 'de', min: 3 },
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
