import React from 'react';
import { Metadata } from 'next';
import { resolvedApiUrl } from '../../../lib/api';
import WatchPageClient from './WatchPageClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/content/${id}`, {
      next: { revalidate: 60 },
    });
    const body = await res.json();

    if (!body.success || !body.data) {
      return {
        title: 'Content Not Found',
        description: 'The requested content could not be found.',
      };
    }

    const content = body.data;

    return {
      title: content.title,
      description: content.description,
      openGraph: {
        title: content.title,
        description: content.description,
        type: 'video.other',
        images: content.thumbnail ? [{ url: content.thumbnail }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description: content.description,
        images: content.thumbnail ? [content.thumbnail] : [],
      },
    };
  } catch {
    return {
      title: 'Watch - Azeebo+',
      description: 'Watch premium content on Azeebo+',
    };
  }
}

export default async function WatchPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <WatchPageClient id={id} />;
}
