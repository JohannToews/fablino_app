const RTL_LANGUAGES = new Set(['fa', 'ar', 'he', 'ur']);

export function isRTL(languageCode: string | null | undefined): boolean {
  return RTL_LANGUAGES.has(languageCode || '');
}

/**
 * Returns CSS direction props for a given language.
 * Use on any container that renders story content.
 */
export function rtlProps(languageCode: string | null | undefined): { dir?: 'rtl'; style?: { textAlign: 'right' } } {
  if (!isRTL(languageCode)) return {};
  return {
    dir: 'rtl',
    style: { textAlign: 'right' },
  };
}

/**
 * Returns Tailwind classes for RTL-aware text containers.
 */
export function rtlClasses(languageCode: string | null | undefined): string {
  if (!isRTL(languageCode)) return '';
  return 'text-right';
}
