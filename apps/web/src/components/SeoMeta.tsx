'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '../hooks/useDatabase';

interface SeoMetaProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}

export function SeoMeta({
  title,
  description,
  image,
  noIndex = false,
}: SeoMetaProps): React.JSX.Element {
  const _pathname = usePathname();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');

  useEffect(() => {
    if (title) {
      document.title = `${title} | ${siteName}`;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (description && metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (title && ogTitle) {
      ogTitle.setAttribute('content', `${title} | ${siteName}`);
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
        const seoTitle = getSetting('seo_title', `${siteName} - Premium Content Streaming`);
        document.title = seoTitle;
      }
    };
  }, [title, description, image, noIndex, siteName]);

  return <></>;
}

export function DefaultSeoMeta(): React.JSX.Element {
  const pathname = usePathname();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Azeebo+');

  useEffect(() => {
    const seoTitle = getSetting('seo_title', `${siteName} - Premium Content Streaming`);
    document.title = seoTitle;
  }, [pathname, siteName]);

  return <></>;
}
