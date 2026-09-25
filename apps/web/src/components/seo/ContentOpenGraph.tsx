'use client';

import { useEffect } from 'react';

interface ContentOpenGraphProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  siteName?: string;
}

export function ContentOpenGraph({
  title,
  description,
  image,
  url,
  type = 'video.other',
  siteName = 'Azeebo+',
}: ContentOpenGraphProps): null {
  useEffect(() => {
    // Update document meta tags for social sharing
    const metaTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: siteName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    const elements: HTMLMetaElement[] = [];

    metaTags.forEach((tag) => {
      const key = tag.property || tag.name;
      if (!key) return;

      // Check if meta tag already exists
      let existing = document.querySelector(
        `meta[property="${tag.property}"], meta[name="${tag.name}"]`
      ) as HTMLMetaElement;

      if (existing) {
        existing.setAttribute('content', tag.content);
      } else {
        existing = document.createElement('meta');
        if (tag.property) existing.setAttribute('property', tag.property);
        if (tag.name) existing.setAttribute('name', tag.name);
        existing.setAttribute('content', tag.content);
        document.head.appendChild(existing);
      }

      elements.push(existing);
    });

    // Cleanup: remove added meta tags
    return () => {
      elements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [title, description, image, url, type, siteName]);

  return null;
}
