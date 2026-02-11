/**
 * Generates a Supabase Storage thumbnail URL by appending render/image/transform params.
 * Falls back to the original URL if it's not a Supabase storage URL.
 *
 * @param url - The original cover_image_url from the database
 * @param width - Desired width in pixels (default 128)
 * @param quality - JPEG quality 1-100 (default 60)
 * @returns Transformed URL string
 */
export function getThumbnailUrl(url: string | null | undefined, width = 128, quality = 60): string {
  if (!url) return '';

  // Only transform Supabase storage URLs
  if (!url.includes('/storage/v1/object/public/')) return url;

  // Append render transform params
  // Supabase format: /render/image?width=X&quality=Y&resize=contain
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const separator = transformedUrl.includes('?') ? '&' : '?';
  return `${transformedUrl}${separator}width=${width}&quality=${quality}&resize=contain`;
}
