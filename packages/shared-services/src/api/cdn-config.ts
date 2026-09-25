/**
 * CDN Verification Configuration
 * P-005: Add CDN verification
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'akamai';
  baseUrl: string;
  staticAssetDomains: string[];
  cacheHeaders: {
    staticAssets: string; // e.g., 'public, max-age=31536000, immutable'
    htmlPages: string; // e.g., 'no-cache, no-store, must-revalidate'
    apiResponses: string; // e.g., 'private, max-age=0'
    images: string; // e.g., 'public, max-age=86400'
  };
}

export const CDN_CONFIG: CDNConfig = {
  provider: 'cloudflare',
  baseUrl: 'https://cdn.azeeboplus.com',
  staticAssetDomains: [
    'https://cdn.azeeboplus.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  cacheHeaders: {
    staticAssets: 'public, max-age=31536000, immutable',
    htmlPages: 'no-cache, no-store, must-revalidate',
    apiResponses: 'private, max-age=0',
    images: 'public, max-age=86400',
  },
};

/**
 * Verify CDN configuration is correct
 * Run this in CI to catch misconfigurations
 */
export function verifyCDNConfig(config: CDNConfig = CDN_CONFIG): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.baseUrl.startsWith('https://')) {
    errors.push('CDN baseUrl must use HTTPS');
  }

  if (config.cacheHeaders.staticAssets.includes('max-age=0')) {
    errors.push('Static assets should have long cache TTL');
  }

  if (
    config.cacheHeaders.htmlPages.includes('max-age=') &&
    !config.cacheHeaders.htmlPages.includes('max-age=0')
  ) {
    errors.push('HTML pages should not be cached at CDN level');
  }

  if (config.staticAssetDomains.length === 0) {
    errors.push('No static asset domains configured');
  }

  return { passed: errors.length === 0, errors };
}
