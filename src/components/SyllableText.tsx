import { useMemo, useState, useEffect } from "react";

// Colors for syllables (matching the design - blue and amber)
const SYLLABLE_COLORS = ["#2563eb", "#b45309"]; // blue-600, amber-700

// Soft hyphen character
const SOFT_HYPHEN = "\u00AD";

// German syllable patterns - comprehensive ruleset based on Duden rules
// This is a simplified but more accurate approach than generic hyphenation libraries
const germanSyllableRules = {
  // Vowels and common vowel combinations
  vowels: /[aeiouäöüy]/i,
  diphthongs: /(?:au|äu|eu|ei|ai|ie|oi|ui)/gi,
  
  // Common prefixes that should stay together
  prefixes: [
    "ab", "an", "auf", "aus", "be", "bei", "da", "dar", "ein", "ent", "er", "ge",
    "hin", "miss", "mit", "nach", "un", "unter", "ur", "ver", "vor", "weg", "zer",
    "zu", "zurück", "zusammen", "über", "durch", "hinter", "wieder"
  ],
  
  // Common suffixes that should stay together
  suffixes: [
    "bar", "chen", "chen", "heit", "isch", "keit", "lein", "lich", "ling",
    "los", "nis", "sal", "sam", "schaft", "sel", "tum", "ung", "wärts"
  ],

  // Consonant clusters that should not be split
  clusterStart: ["bl", "br", "ch", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "kl", "kn", "kr", "pf", "pfl", "pfr", "pl", "pr", "qu", "sch", "schl", "schm", "schn", "schr", "schw", "sk", "sl", "sm", "sn", "sp", "spl", "spr", "st", "str", "sw", "th", "tr", "tsch", "tw", "vr", "wr", "zw"],
};

/**
 * Enhanced German syllable splitting function
 * Uses rule-based approach for better accuracy
 */
function splitGermanSyllables(word: string): string[] {
  if (!word || word.length <= 2) return [word];
  
  const lowerWord = word.toLowerCase();
  
  // Handle very short words
  if (lowerWord.length <= 3) return [word];
  
  // Find vowel positions
  const vowelPositions: number[] = [];
  for (let i = 0; i < lowerWord.length; i++) {
    if (/[aeiouäöüy]/.test(lowerWord[i])) {
      // Skip if part of a diphthong (second vowel)
      if (i > 0 && /[aeiouäöü]/.test(lowerWord[i - 1])) {
        // Check common diphthongs
        const pair = lowerWord.slice(i - 1, i + 1);
        if (/^(au|äu|eu|ei|ai|ie|oi|ui)$/.test(pair)) {
          continue;
        }
      }
      vowelPositions.push(i);
    }
  }
  
  // If only one vowel group, no splitting possible
  if (vowelPositions.length <= 1) return [word];
  
  const syllables: string[] = [];
  let lastSplit = 0;
  
  // Process each pair of consecutive vowel positions
  for (let i = 0; i < vowelPositions.length - 1; i++) {
    const v1 = vowelPositions[i];
    const v2 = vowelPositions[i + 1];
    
    // Count consonants between vowels
    let consonantStart = v1 + 1;
    // Skip if the next char is still part of diphthong
    if (consonantStart < lowerWord.length && /[aeiouäöüy]/.test(lowerWord[consonantStart])) {
      consonantStart++;
    }
    
    const consonantCount = v2 - consonantStart;
    
    if (consonantCount <= 0) {
      // No consonants - split after the vowel
      continue;
    }
    
    let splitPoint: number;
    
    if (consonantCount === 1) {
      // Single consonant goes to next syllable
      splitPoint = consonantStart;
    } else if (consonantCount === 2) {
      // Two consonants - check if they form a valid cluster
      const cluster = lowerWord.slice(consonantStart, v2);
      if (germanSyllableRules.clusterStart.includes(cluster)) {
        // Keep cluster together, split before it
        splitPoint = consonantStart;
      } else {
        // Split between consonants
        splitPoint = consonantStart + 1;
      }
    } else if (consonantCount === 3) {
      // Three consonants - try to find valid cluster at end
      const last2 = lowerWord.slice(v2 - 2, v2);
      const last3 = lowerWord.slice(v2 - 3, v2);
      
      if (germanSyllableRules.clusterStart.includes(last3)) {
        splitPoint = consonantStart;
      } else if (germanSyllableRules.clusterStart.includes(last2)) {
        splitPoint = consonantStart + 1;
      } else {
        // Default: keep last consonant with next syllable
        splitPoint = v2 - 1;
      }
    } else {
      // Four or more consonants
      // Try to find valid cluster at the end
      for (let len = Math.min(4, consonantCount); len >= 2; len--) {
        const cluster = lowerWord.slice(v2 - len, v2);
        if (germanSyllableRules.clusterStart.includes(cluster)) {
          splitPoint = v2 - len;
          break;
        }
      }
      if (!splitPoint) {
        splitPoint = v2 - 1;
      }
    }
    
    if (splitPoint && splitPoint > lastSplit && splitPoint < word.length) {
      syllables.push(word.slice(lastSplit, splitPoint));
      lastSplit = splitPoint;
    }
  }
  
  // Add remaining part
  if (lastSplit < word.length) {
    syllables.push(word.slice(lastSplit));
  }
  
  // Filter out empty syllables and merge very short ones
  const result: string[] = [];
  for (const syl of syllables) {
    if (syl.length === 0) continue;
    if (syl.length === 1 && result.length > 0 && !/[aeiouäöüy]/i.test(syl)) {
      // Single consonant - merge with previous
      result[result.length - 1] += syl;
    } else {
      result.push(syl);
    }
  }
  
  return result.length > 0 ? result : [word];
}

interface SyllableTextProps {
  text: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  dataPosition?: string;
}

/**
 * Splits a word into syllables and renders them with alternating colors
 */
export const SyllableText = ({ text, className = "", onClick, dataPosition }: SyllableTextProps) => {
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

    // Split into syllables using our German-specific function
    const syllables = splitGermanSyllables(cleanWord);

    if (syllables.length <= 1) {
      // Single syllable - just show with first color
      return (
        <span>
          {leadingPunct}
          <span style={{ color: SYLLABLE_COLORS[0] }}>{cleanWord}</span>
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
  }, [text]);

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

/**
 * Utility function to check if syllable mode should be available
 * (only for German text)
 */
export const isSyllableModeSupported = (language: string): boolean => {
  return language.toLowerCase() === "de";
};

export default SyllableText;
