/**
 * Open Graph & Twitter Card Metadata
 * SEO-003: Add og:title, og:description, og:image
 * SEO-004: Add twitter:card, twitter:title
 */

export interface OpenGraphProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

export interface TwitterCardProps {
  title: string;
  description: string;
  image?: string;
  cardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
}

export function OpenGraphTags({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'Azeebo+',
}: OpenGraphProps) {
  const ogImage = image || 'https://cdn.azeeboplus.com/og-default.png';
  const ogUrl = url || 'https://azeeboplus.com';

  return (
    <>
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_NG" />
    </>
  );
}

export function TwitterCard({
  title,
  description,
  image,
  cardType = 'summary_large_image',
  site = '@azeeboplus',
  creator,
}: TwitterCardProps) {
  const twitterImage = image || 'https://cdn.azeeboplus.com/og-default.png';

  return (
    <>
      <meta name="twitter:card" content={cardType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:site" content={site} />
      {creator && <meta name="twitter:creator" content={creator} />}
    </>
  );
}

// Pre-configured templates for common page types
export const OG_TEMPLATES = {
  homepage: {
    title: 'Azeebo+ — Premium African Streaming Platform',
    description:
      'Discover, stream, and share premium African content. Reality shows, music, documentaries, and more.',
    type: 'website' as const,
  },
  video: (title: string, thumbnail: string) => ({
    title,
    description: `Watch ${title} on Azeebo+`,
    image: thumbnail,
    type: 'video.other' as const,
  }),
  profile: (name: string, avatar: string) => ({
    title: `${name} — Azeebo+ Creator`,
    description: `Watch content by ${name} on Azeebo+`,
    image: avatar,
    type: 'profile' as const,
  }),
  article: (title: string, excerpt: string, image: string) => ({
    title: `${title} — Azeebo+`,
    description: excerpt,
    image,
    type: 'article' as const,
  }),
};
