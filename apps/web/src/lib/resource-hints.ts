/**
 * Resource Hints Configuration
 * P-008: Add preload, preconnect, prefetch for critical resources
 */

export const RESOURCE_HINTS = {
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.azeeboplus.com',
  ],
  preload: [
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    {
      href: '/fonts/montserrat-bold.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ],
  prefetch: ['/api/v1/auth/me'],
} as const;

export function getResourceHintTags(): string[] {
  const tags: string[] = [];

  for (const url of RESOURCE_HINTS.preconnect) {
    tags.push(`<link rel="preconnect" href="${url}" crossorigin>`);
  }

  for (const hint of RESOURCE_HINTS.preload) {
    tags.push(
      `<link rel="preload" href="${hint.href}" as="${hint.as}" type="${hint.type}"${hint.crossOrigin ? ' crossorigin="' + hint.crossOrigin + '"' : ''}>`
    );
  }

  for (const url of RESOURCE_HINTS.prefetch) {
    tags.push(`<link rel="prefetch" href="${url}">`);
  }

  return tags;
}
