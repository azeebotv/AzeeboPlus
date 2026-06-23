import React from 'react';
import { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import WatchPageClient from './WatchPageClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const contentResponse = await apiFetch<any>(`/content/${id}`);

    if (!contentResponse.success || !contentResponse.data) {
      return {
        title: 'Content Not Found',
        description: 'The requested content could not be found.',
      };
    }

    const content = contentResponse.data;

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
