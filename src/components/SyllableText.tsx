import { useMemo } from "react";
// Import language-specific hyphenation modules
import hyphenDe from "hyphen/de";
import hyphenFr from "hyphen/fr";
import hyphenEs from "hyphen/es";
import hyphenNl from "hyphen/nl";
import hyphenIt from "hyphen/it";
import hyphenEn from "hyphen/en-us";

// Colors for syllables (matching the design - blue and amber)
const SYLLABLE_COLORS = ["#2563eb", "#b45309"]; // blue-600, amber-700

// Soft hyphen character
const SOFT_HYPHEN = "\u00AD";

// Map language codes to hyphenation modules
const hyphenators: Record<string, { hyphenateSync: (text: string) => string }> = {
  de: hyphenDe,
  fr: hyphenFr,
  es: hyphenEs,
  nl: hyphenNl,
  it: hyphenIt,
  en: hyphenEn,
};

/**
 * Split word into syllables using language-specific hyphenation patterns
 */
function splitSyllables(word: string, language: string): string[] {
  // Only skip truly tiny words (1-2 chars)
  if (!word || word.length <= 2) return [word];
  
  const hyphenModule = hyphenators[language] || hyphenators.de;
  
  try {
    const hyphenated = hyphenModule.hyphenateSync(word);
    
    // Split by soft hyphen
    const syllables = hyphenated.split(SOFT_HYPHEN);
    
    return syllables.length > 0 ? syllables : [word];
  } catch (e) {
    // If hyphenation fails, return original word
    console.warn("Hyphenation failed for:", word, e);
    return [word];
  }
}

interface SyllableTextProps {
  text: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  dataPosition?: string;
  language?: string;
}

/**
 * Splits a word into syllables and renders them with alternating colors
 */
export const SyllableText = ({ text, className = "", onClick, dataPosition, language = "de" }: SyllableTextProps) => {
  const syllabifiedContent = useMemo(() => {
    // Don't syllabify if it's just whitespace or punctuation
    if (/^\s+$/.test(text) || /^[.,!?;:'"«»\-–—]+$/.test(text)) {
      return <span>{text}</span>;
    }

    // Extract leading/trailing punctuation
    const leadingPunct = text.match(/^[.,!?;:'"«»\-–—\s]+/)?.[0] || "";
    const trailingPunct = text.match(/[.,!?;:'"«»\-–—\s]+$/)?.[0] || "";
    const cleanWord = text.slice(leadingPunct.length, text.length - (trailingPunct.length || undefined));

    if (!cleanWord) {
      return <span>{text}</span>;
    }

    // Split into syllables using language-specific patterns
    const syllables = splitSyllables(cleanWord, language);

    // Always color ALL words - single syllable gets first color, multi-syllable alternates
    if (syllables.length <= 1) {
      return (
        <span>
          {leadingPunct}
          <span style={{ color: SYLLABLE_COLORS[0], fontWeight: 500 }}>{cleanWord}</span>
          {trailingPunct}
        </span>
      );
    }

    // Multiple syllables - alternate colors
    return (
      <span>
        {leadingPunct}
        {syllables.map((syllable, index) => (
          <span 
            key={index} 
            style={{ color: SYLLABLE_COLORS[index % SYLLABLE_COLORS.length] }}
          >
            {syllable}
          </span>
        ))}
        {trailingPunct}
      </span>
    );
  }, [text, language]);

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

export default SyllableText;
