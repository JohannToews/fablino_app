import { useMemo } from 'react';
import { isSyllableSupported } from '@/lib/syllabify';

/**
 * Check if syllable coloring is available for the given language.
 * Uses syllabify's supported set (de, fr, en, es, nl, it).
 */
export function isSyllableColoringSupported(language: string): boolean {
  return isSyllableSupported(language);
}

/**
 * Hook that provides syllable coloring state management.
 *
 * Returns whether syllable mode is enabled and functions to toggle it.
 * The actual rendering is handled by the existing SyllableText component.
 *
 * @param language - The story's text language
 * @param enabled - Whether syllable coloring is currently toggled on
 */
export function useSyllableColoring(language: string, enabled: boolean) {
  const isSupported = useMemo(
    () => isSyllableColoringSupported(language),
    [language]
  );

  const hyphenLanguage = useMemo(() => {
    const key = language.toLowerCase().substring(0, 2);
    return isSyllableSupported(key) ? key : 'en';
  }, [language]);

  const isActive = enabled && isSupported;

  // Debug: log syllable mode state when it changes
  if (enabled) {
    console.log('[SyllableColoring] enabled:', enabled, 'isSupported:', isSupported, 'isActive:', isActive, 'language:', language, '→ hyphenLanguage:', hyphenLanguage);
  }

  return {
    isActive,
    isSupported,
    hyphenLanguage,
  };
}
