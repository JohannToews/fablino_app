import { useMemo } from 'react';

/**
 * Supported languages for syllable coloring.
 *
 * Uses the existing `hyphen` package already installed in the project.
 * Language support: DE, FR, EN, ES, NL, IT
 * BS (Bosnian) not available in `hyphen` — falls back to DE patterns.
 */
const SUPPORTED_LANGUAGES = ['de', 'fr', 'en', 'es', 'nl', 'it'];

/**
 * Check if syllable coloring is available for the given language.
 */
export function isSyllableColoringSupported(language: string): boolean {
  const key = language.toLowerCase().substring(0, 2);
  return SUPPORTED_LANGUAGES.includes(key);
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

  // Map language codes to hyphenation module keys (BS → DE fallback)
  const hyphenLanguage = useMemo(() => {
    const key = language.toLowerCase().substring(0, 2);
    if (SUPPORTED_LANGUAGES.includes(key)) return key;
    // Bosnian fallback to German (closest available with Latin script)
    if (key === 'bs') return 'de';
    return 'de';
  }, [language]);

  return {
    isActive: enabled && isSupported,
    isSupported,
    hyphenLanguage,
  };
}
