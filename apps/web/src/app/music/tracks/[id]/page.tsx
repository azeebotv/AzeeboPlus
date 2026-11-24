import { Metadata } from 'next';
import { resolvedApiUrl } from '@/lib/api';
import { extractTracks } from '@/lib/music';
import TrackDetailClient from './TrackDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/music/tracks/${id}`;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/lifestyle/music/${id}`, {
      next: { revalidate: 60 },
    });
    const body = (await res.json()) as { success?: boolean; data?: unknown };
    const track = body.success && body.data ? extractTracks(body.data)[0] : undefined;

    if (!track) {
      return {
        title: 'Track Not Found',
        description: 'The requested track could not be found.',
        alternates: { canonical },
      };
    }

    const description = track.artist ? `${track.title} by ${track.artist}` : track.title;

    return {
      title: track.title,
      description,
      alternates: { canonical },
      openGraph: {
        title: track.title,
        description,
        type: 'music.song',
        images: track.thumbnail ? [{ url: track.thumbnail }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: track.title,
        description,
        images: track.thumbnail ? [track.thumbnail] : [],
      },
    };
  } catch {
    return {
      title: 'Music',
      description: 'Discover and stream music on Azeebo+',
      alternates: { canonical },
    };
  }
}

export default async function TrackDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <TrackDetailClient id={id} />;
}
