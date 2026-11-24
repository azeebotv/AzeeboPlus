import { Metadata } from 'next';
import { resolvedApiUrl } from '@/lib/api';
import ContestantDetailClient from './ContestantDetailClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

interface ContestantMetadata {
  name: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/reality/contestant/${id}`;
  try {
    const res = await fetch(`${resolvedApiUrl}/api/v1/reality/contestants/${id}`, {
      next: { revalidate: 60 },
    });
    const body = (await res.json()) as { success?: boolean; data?: ContestantMetadata };
    const contestant = body.success && body.data ? body.data : undefined;

    if (!contestant) {
      return {
        title: 'Contestant Not Found',
        description: 'The requested contestant could not be found.',
        alternates: { canonical },
      };
    }

    const description = contestant.bio
      ? `${contestant.name} — ${contestant.bio}`
      : `Meet ${contestant.name} on Azeebo+'s Reality universe.`;
    const image = contestant.avatar || contestant.coverImage;

    return {
      title: contestant.name,
      description,
      alternates: { canonical },
      openGraph: {
        title: contestant.name,
        description,
        type: 'profile',
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: contestant.name,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: 'Reality',
      description: 'Follow contestants on Azeebo+ Reality',
      alternates: { canonical },
    };
  }
}

export default async function ContestantDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  return <ContestantDetailClient id={id} />;
}
