import { Metadata } from 'next';
import { resolvedApiUrl } from '@/lib/api';
import ArtistDetailClient from './ArtistDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

interface ArtistMetadata {
  name: string;
  bio?: string;
  avatar?: string;
  genre?: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/music/artists/${id}`;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/lifestyle/music/artists/${id}`, {
      next: { revalidate: 60 },
    });
    const body = (await res.json()) as { success?: boolean; data?: ArtistMetadata };
    const artist = body.success && body.data ? body.data : undefined;

    if (!artist) {
      return {
        title: 'Artist Not Found',
        description: 'The requested artist could not be found.',
        alternates: { canonical },
      };
    }

    const description =
      artist.bio ||
      (artist.genre
        ? `${artist.name} — ${artist.genre} artist on Azeebo+`
        : `Listen to ${artist.name} on Azeebo+`);

    return {
      title: artist.name,
      description,
      alternates: { canonical },
      openGraph: {
        title: artist.name,
        description,
        type: 'profile',
        images: artist.avatar ? [{ url: artist.avatar }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: artist.name,
        description,
        images: artist.avatar ? [artist.avatar] : [],
      },
    };
  } catch {
    return {
      title: 'Music Artists',
      description: 'Discover artists on Azeebo+',
      alternates: { canonical },
    };
  }
}

export default async function ArtistDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <ArtistDetailClient id={id} />;
}
