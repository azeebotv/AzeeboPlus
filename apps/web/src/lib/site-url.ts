/**
 * Centralized site URL helper for web client, robots, and sitemap.
 * Resolves NEXT_PUBLIC_BASE_URL with normalized trailing slash handling.
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || 'https://azeeboplus.com';
  return url.replace(/\/+$/, '');
}
