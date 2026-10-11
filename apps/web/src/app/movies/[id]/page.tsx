import { Metadata } from 'next';
import { resolvedApiUrl } from '../../../lib/api';
import MovieDetailClient from './MovieDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/movies/${id}`, {
      next: { revalidate: 60 },
    });
    const body = await res.json();

    if (!body.success || !body.data) {
      return {
        title: 'Movie Not Found',
        description: 'The requested movie could not be found.',
      };
    }

    const movie: {
      title: string;
      description: string;
      synopsis?: string;
      thumbnail?: string;
      banner?: string;
    } = body.data;

    const description = movie.synopsis || movie.description;

    return {
      title: movie.title,
      description,
      openGraph: {
        title: movie.title,
        description,
        type: 'video.other',
        images: movie.thumbnail || movie.banner ? [{ url: movie.thumbnail || movie.banner! }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: movie.title,
        description,
        images: movie.thumbnail ? [movie.thumbnail] : [],
      },
    };
  } catch {
    return {
      title: 'Movies - Azeebo+',
      description: 'Stream premium movies on Azeebo+',
    };
  }
}

export default async function MovieDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <MovieDetailClient id={id} />;
}
