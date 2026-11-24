/**
 * Structured Data (JSON-LD) Components
 * SEO-001: Add structured data
 */

/**
 * AUD-59: JSON.stringify output is not safe to inline into a <script> — a
 * creator-authored title containing `</script>` would break out of the tag,
 * and `<`/U+2028/U+2029 can be misparsed. Escape them before injection.
 */
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function JsonLdScript({ jsonLd }: { jsonLd: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}

interface OrganizationProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({ name, url, logo, description, sameAs }: OrganizationProps) {
  return (
    <JsonLdScript
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo,
        description,
        sameAs,
      }}
    />
  );
}

interface WebSiteProps {
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    target: string;
    'query-input': string;
  };
}

export function WebSiteJsonLd({ name, url, description, potentialAction }: WebSiteProps) {
  return (
    <JsonLdScript
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        description,
        potentialAction: potentialAction
          ? {
              '@type': 'SearchAction',
              target: potentialAction.target,
              'query-input': potentialAction['query-input'],
            }
          : undefined,
      }}
    />
  );
}

interface VideoObjectProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  interactionCount?: number;
}

export function VideoObjectJsonLd({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
  interactionCount,
}: VideoObjectProps) {
  return (
    <JsonLdScript
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name,
        description,
        thumbnailUrl,
        uploadDate,
        duration,
        contentUrl,
        embedUrl,
        interactionStatistic: interactionCount
          ? {
              '@type': 'InteractionCounter',
              interactionType: { '@type': 'WatchAction' },
              userInteractionCount: interactionCount,
            }
          : undefined,
      }}
    />
  );
}

interface BreadcrumbListProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbListProps) {
  return (
    <JsonLdScript
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
