'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SeoMetaProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}

export function SeoMeta({ title, description, image, noIndex = false }: SeoMetaProps): JSX.Element {
  const pathname = usePathname();

  useEffect(() => {
    if (title) {
      document.title = `${title} | Azeebo+`;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (description && metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (title && ogTitle) {
      ogTitle.setAttribute('content', `${title} | Azeebo+`);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description && ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (image && ogImage) {
      ogImage.setAttribute('content', image);
    }

    const robots = document.querySelector('meta[name="robots"]');
    if (noIndex && robots) {
      robots.setAttribute('content', 'noindex, nofollow');
    }

    return () => {
      if (title) {
        document.title = 'Azeebo+ - Premium Content Streaming';
      }
    };
  }, [title, description, image, noIndex]);

  return <></>;
}

export function DefaultSeoMeta(): JSX.Element {
  const pathname = usePathname();

  useEffect(() => {
    document.title = `Azeebo+ - Premium Content Streaming`;
  }, [pathname]);

  return <></>;
}