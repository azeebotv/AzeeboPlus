/**
 * Canonical URL Component
 * SEO-002: Add canonical URLs
 */

import React from 'react';

interface CanonicalUrlProps {
  path?: string;
}

export function CanonicalUrl({ path = '' }: CanonicalUrlProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://azeeboplus.com';
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://azeeboplus.com';
  return {
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
  };
}
