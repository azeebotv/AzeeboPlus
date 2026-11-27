/**
 * Canonical URL Component
 * SEO-002: Add canonical URLs
 */

import { getPublicBaseUrl } from '@azeebo/shared-types';

interface CanonicalUrlProps {
  path?: string;
}

export function CanonicalUrl({ path = '' }: CanonicalUrlProps) {
  const baseUrl = getPublicBaseUrl();
  const canonicalUrl = `${baseUrl}${path}`;

  return (
    <head>
      <link rel="canonical" href={canonicalUrl} />
    </head>
  );
}

/**
 * Generate canonical metadata for Next.js
 */
export function getCanonicalMetadata(path: string = '') {
  const baseUrl = getPublicBaseUrl();
  return {
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
  };
}
