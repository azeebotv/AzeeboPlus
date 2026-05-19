import React from 'react';
import { Metadata } from 'next';
import { api } from '../../../lib/api';
import WatchPageClient from './WatchPageClient';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const contentResponse = await api.content.getContent(params.id);

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

export default function WatchPage({ params }: Props): JSX.Element {
  return <WatchPageClient id={params.id} />;
}