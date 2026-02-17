import React, { useMemo } from "react";
// Import language-specific hyphenation modules
// Use `* as` to handle both CJS module.exports and ESM default export correctly
import * as hyphenDeModule from "hyphen/de";
import * as hyphenFrModule from "hyphen/fr";
import * as hyphenEsModule from "hyphen/es";
import * as hyphenNlModule from "hyphen/nl";
import * as hyphenItModule from "hyphen/it";
import * as hyphenEnModule from "hyphen/en-us";

// Colors for syllables — high-contrast blue/red for easy reading
const SYLLABLE_COLORS = ["#2563EB", "#DC2626"]; // blue-600, red-600

// Soft hyphen character
const SOFT_HYPHEN = "\u00AD";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HyphenModule = any;

/**
 * Robustly extract hyphenateSync from a hyphen module.
 * The `hyphen` package uses CJS module.exports which Vite may wrap differently.
 * This handles: direct property, .default wrapper, .default.hyphenateSync, etc.
 */
function getHyphenateSync(mod: HyphenModule): ((text: string, options?: Record<string, unknown>) => string) | null {
  if (!mod) return null;
  // Direct property (CJS interop or namespace import)
  if (typeof mod.hyphenateSync === 'function') return mod.hyphenateSync.bind(mod);
  // Vite may put CJS exports under .default
  if (mod.default && typeof mod.default.hyphenateSync === 'function') return mod.default.hyphenateSync.bind(mod.default);
  // Sometimes the whole module IS the function (unlikely but safe)
  if (typeof mod === 'function') return mod;
  // Deep default nesting
  if (mod.default?.default && typeof mod.default.default.hyphenateSync === 'function') return mod.default.default.hyphenateSync.bind(mod.default.default);
  return null;
}

// Build map of language → hyphenateSync function
const hyphenateSyncFns: Record<string, (text: string, options?: Record<string, unknown>) => string> = {};

const rawModules: Record<string, HyphenModule> = {
  de: hyphenDeModule,
  fr: hyphenFrModule,
  es: hyphenEsModule,
  nl: hyphenNlModule,
  it: hyphenItModule,
  en: hyphenEnModule,
};

// One-time initialization with debug logging
let _initLogged = false;
for (const [lang, mod] of Object.entries(rawModules)) {
  const fn = getHyphenateSync(mod);
  if (fn) {
    hyphenateSyncFns[lang] = fn;
  }
  if (!_initLogged) {
    console.log('[SyllableText] hyphen module structure for', lang, ':', {
      type: typeof mod,
      keys: mod ? Object.keys(mod).slice(0, 8) : 'null',
      hasHyphenateSync: typeof mod?.hyphenateSync === 'function',
      hasDefault: !!mod?.default,
      defaultType: typeof mod?.default,
      defaultKeys: mod?.default ? Object.keys(mod.default).slice(0, 8) : 'none',
      resolved: !!fn,
    });
    if (fn) {
      try {
        const testResult = fn('Geheimnis', { minWordLength: 1 });
        const syllables = testResult.split(SOFT_HYPHEN);
        console.log('[SyllableText] TEST split "Geheimnis" →', syllables, '(count:', syllables.length, ')');
      } catch (e) {
        console.error('[SyllableText] TEST FAILED:', e);
      }
    }
    _initLogged = true;
  }
}

// Allow hyphenation for ALL words, even very short ones
const HYPHEN_OPTIONS = { minWordLength: 1 };

function splitSyllables(word: string, language: string): string[] {
  if (!word) return [word];

  const hyphenateSyncFn = hyphenateSyncFns[language] || hyphenateSyncFns.de;

  if (!hyphenateSyncFn) {
    // No hyphenation available — return word as single syllable
    return [word];
  }

  try {
    const hyphenated = hyphenateSyncFn(word, HYPHEN_OPTIONS);
    const syllables = hyphenated.split(SOFT_HYPHEN);
    return syllables.length > 0 ? syllables : [word];
  } catch {
    return [word];
  }
}

interface SyllableTextProps {
  text: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  dataPosition?: string;
  language?: string;
  /** Global color index offset — lets the caller maintain a running color counter */
  colorOffset?: number;
}

/**
 * Splits a word into syllables and renders them with alternating colors.
 *
 * EVERY word gets colored — single-syllable words get the next color in sequence.
 * No word is left black when syllable mode is active.
 */
export const SyllableText = ({ text, className = "", onClick, dataPosition, language = "de", colorOffset = 0 }: SyllableTextProps) => {
  const syllabifiedContent = useMemo(() => {
    // Don't syllabify pure whitespace
    if (/^\s+$/.test(text)) {
      return <span>{text}</span>;
    }

    // Extract leading/trailing punctuation
    const leadingPunct = text.match(/^[.,!?;:'"«»\-–—\s()\[\]{}]+/)?.[0] || "";
    const trailingPunct = text.match(/[.,!?;:'"«»\-–—\s()\[\]{}]+$/)?.[0] || "";
    const cleanWord = text.slice(leadingPunct.length, text.length - (trailingPunct.length || undefined));

    if (!cleanWord) {
      // Pure punctuation — color it with the current offset color
      return <span style={{ color: SYLLABLE_COLORS[colorOffset % 2] }}>{text}</span>;
    }

    // Split into syllables using language-specific patterns
    const syllables = splitSyllables(cleanWord, language);

    // Color ALL syllables — even single-syllable words
    // Punctuation also gets colored so nothing remains black
    const firstColor = SYLLABLE_COLORS[colorOffset % 2];
    const lastSyllableColor = SYLLABLE_COLORS[(colorOffset + syllables.length - 1) % 2];
    return (
      <span>
        {leadingPunct && <span style={{ color: firstColor }}>{leadingPunct}</span>}
        {syllables.map((syllable, index) => (
          <span
            key={index}
            style={{ color: SYLLABLE_COLORS[(colorOffset + index) % 2] }}
          >
            {syllable}
          </span>
        ))}
        {trailingPunct && <span style={{ color: lastSyllableColor }}>{trailingPunct}</span>}
      </span>
    );
  }, [text, language, colorOffset]);

  if (onClick) {
    return (
      <span
        className={className}
        onClick={onClick}
        data-position={dataPosition}
        data-word-clickable="true"
      >
        {syllabifiedContent}
      </span>
    );
  }

  return (
    <span className={className} data-position={dataPosition}>
      {syllabifiedContent}
    </span>
  );
};

// Supported languages for syllable mode
const SUPPORTED_SYLLABLE_LANGUAGES = ["de", "fr", "es", "nl", "it", "en"];

/**
 * Utility function to check if syllable mode should be available
 */
export const isSyllableModeSupported = (language: string): boolean => {
  return SUPPORTED_SYLLABLE_LANGUAGES.includes(language.toLowerCase());
};

/**
 * Count how many syllables a word produces (for running color counter).
 */
export function countSyllables(word: string, language: string): number {
  if (!word || /^\s+$/.test(word)) return 0;
  const leadingPunct = word.match(/^[.,!?;:'"«»\-–—\s()\[\]{}]+/)?.[0] || "";
  const trailingPunct = word.match(/[.,!?;:'"«»\-–—\s()\[\]{}]+$/)?.[0] || "";
  const cleanWord = word.slice(leadingPunct.length, word.length - (trailingPunct.length || undefined));
  if (!cleanWord) return 1; // punctuation counts as 1 color slot
  return splitSyllables(cleanWord, language).length;
}

export default SyllableText;
