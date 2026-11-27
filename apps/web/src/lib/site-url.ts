/**
 * Centralized site URL helper for web client, robots, and sitemap.
 * Resolves NEXT_PUBLIC_BASE_URL with normalized trailing slash handling.
 */

import { getPublicBaseUrl } from '@azeebo/shared-types';
export function getBaseUrl(): string {
  return getPublicBaseUrl();
}
