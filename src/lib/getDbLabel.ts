/**
 * Get a localized label from a JSONB labels object with consistent fallback chain.
 * Fallback: requested language → en → de → first available value → fallback string
 */
export function getDbLabel(
  labels: Record<string, string> | null | undefined,
  language: string,
  fallback: string = ''
): string {
  if (!labels) return fallback;

  return (
    labels[language] ||
    labels['en'] ||
    labels['de'] ||
    Object.values(labels).find(v => v && v.trim() !== '') ||
    fallback
  );
}
