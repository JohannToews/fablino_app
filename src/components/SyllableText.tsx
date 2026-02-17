import React, { useMemo } from "react";
// Import language-specific hyphenation modules
import hyphenDe from "hyphen/de";
import hyphenFr from "hyphen/fr";
import hyphenEs from "hyphen/es";
import hyphenNl from "hyphen/nl";
import hyphenIt from "hyphen/it";
import hyphenEn from "hyphen/en-us";

// Colors for syllables — high-contrast blue/red for easy reading
const SYLLABLE_COLORS = ["#2563EB", "#DC2626"]; // blue-600, red-600

// Soft hyphen character
const SOFT_HYPHEN = "\u00AD";

// Map language codes to hyphenation modules
const hyphenators: Record<string, { hyphenateSync: (text: string, options?: Record<string, unknown>) => string }> = {
  de: hyphenDe,
  fr: hyphenFr,
  es: hyphenEs,
  nl: hyphenNl,
  it: hyphenIt,
  en: hyphenEn,
};

// Allow hyphenation for ALL words, even very short ones
const HYPHEN_OPTIONS = { minWordLength: 1 };

function splitSyllables(word: string, language: string): string[] {
  if (!word) return [word];

  const hyphenModule = hyphenators[language] || hyphenators.de;

  try {
    const hyphenated = hyphenModule.hyphenateSync(word, HYPHEN_OPTIONS);
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
    return (
      <span>
        {leadingPunct && <span>{leadingPunct}</span>}
        {syllables.map((syllable, index) => (
          <span
            key={index}
            style={{ color: SYLLABLE_COLORS[(colorOffset + index) % 2] }}
          >
            {syllable}
          </span>
        ))}
        {trailingPunct && <span>{trailingPunct}</span>}
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
